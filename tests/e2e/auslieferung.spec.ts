import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Smoke-Tests der Auslieferung: robots.txt, Sitemap und die Header aus
 * public/_headers.
 *
 * `astro preview` wendet _headers nicht an. Die Tests lesen die Datei deshalb so,
 * wie Cloudflare Pages sie liest, und setzen die Header der Regel "/*" auf jede
 * Antwort. Der Browser prüft damit genau die Policy, die ausgeliefert wird.
 */

const PRODUKTION = 'https://daxolo.ch';

/** Regeln aus public/_headers: Zeilen getrimmt, `#` ist Kommentar, Pfad vor Header. */
function headerRegeln(): Map<string, Record<string, string>> {
  const regeln = new Map<string, Record<string, string>>();
  let aktuell: Record<string, string> | undefined;
  for (const roh of readFileSync('public/_headers', 'utf8').split(/\r?\n/)) {
    const zeile = roh.trim();
    if (zeile === '' || zeile.startsWith('#')) continue;
    if (zeile.startsWith('/') || /^\S+:\/\//.test(zeile)) {
      aktuell = {};
      regeln.set(zeile, aktuell);
      continue;
    }
    if (aktuell === undefined) throw new Error(`_headers: Header vor dem ersten Pfad: ${zeile}`);
    const trenner = zeile.indexOf(':');
    aktuell[zeile.slice(0, trenner).trim().toLowerCase()] = zeile.slice(trenner + 1).trim();
  }
  return regeln;
}

const ALLE_SEITEN = headerRegeln().get('/*') ?? {};

/** Lokale Pfade aller Seiten der Sitemap, mit ihren Sprachfassungen. */
async function sitemap(request: APIRequestContext) {
  const xml = await (await request.get('/sitemap.xml')).text();
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((url) => {
    const block = url[1] ?? '';
    return {
      loc: /<loc>(.*?)<\/loc>/.exec(block)?.[1] ?? '',
      fassungen: [...block.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)]
        .map((f) => `${f[1]} ${f[2]}`)
        .sort(),
    };
  });
}

const lokal = (url: string) => url.replace(PRODUKTION, '');

/** Liefert jede Antwort mit den Headern aus public/_headers aus und sammelt CSP-Verstösse. */
async function wieAufPages(page: Page): Promise<string[]> {
  const verstoesse: string[] = [];
  page.on('console', (meldung) => {
    if (/Content Security Policy/i.test(meldung.text())) verstoesse.push(meldung.text());
  });
  await page.route('**/*', async (route) => {
    const antwort = await route.fetch();
    await route.fulfill({ response: antwort, headers: { ...antwort.headers(), ...ALLE_SEITEN } });
  });
  return verstoesse;
}

test('_headers bleibt in den Grenzen von Cloudflare Pages', () => {
  // https://developers.cloudflare.com/pages/configuration/headers/
  const zeilen = readFileSync('public/_headers', 'utf8').split(/\r?\n/);
  expect(zeilen.filter((zeile) => zeile.trim().length > 2000)).toEqual([]);
  expect(headerRegeln().size).toBeLessThanOrEqual(100);
  expect(Object.keys(ALLE_SEITEN)).toEqual([
    'content-security-policy',
    'strict-transport-security',
    'referrer-policy',
    'x-content-type-options',
  ]);
});

test('robots.txt verweist auf die Sitemap der Produktionsdomain', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${PRODUKTION}/sitemap.xml`);
});

test('die Sitemap führt jede Seite mit denselben Sprachfassungen wie ihr Kopf', async ({
  page,
  request,
}) => {
  const eintraege = await sitemap(request);
  const locs = eintraege.map((e) => lokal(e.loc));
  for (const pfad of ['/de/', '/fr/', '/en/', '/de/werkzeuge/', '/fr/outils/', '/en/tools/']) {
    expect(locs).toContain(pfad);
  }
  // Die Wurzel ist eine Weiterleitung mit noindex und gehört nicht hinein.
  expect(locs).not.toContain('/');

  for (const { loc, fassungen } of eintraege) {
    const antwort = await page.goto(lokal(loc));
    expect(antwort?.status(), loc).toBe(200);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', loc);
    const imKopf = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((links) =>
        links.map((l) => `${l.getAttribute('hreflang')} ${l.getAttribute('href')}`).sort(),
      );
    expect(imKopf, loc).toEqual(fassungen);
  }
});

test('jede Seite hat genau ein Inline-Skript, und die CSP erlaubt es per Hash', async ({
  request,
}) => {
  const csp = ALLE_SEITEN['content-security-policy'] ?? '';
  for (const { loc } of await sitemap(request)) {
    const html = await (await request.get(lokal(loc))).text();
    const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(
      // Mit src kommt das Skript als Datei; JSON-Datenblöcke führt der Browser nicht aus.
      (s) => !/\bsrc=|type="application\/json"/.test(s[1] ?? ''),
    );
    expect(inline, `${loc}: ausführbare Inline-Skripte`).toHaveLength(1);
    const hash = `'sha256-${createHash('sha256')
      .update(inline[0]?.[2] ?? '')
      .digest('base64')}'`;
    expect(csp, `${loc}: Modus-Skript geändert — in public/_headers ${hash} setzen`).toContain(
      `script-src 'self' ${hash};`,
    );
  }
});

test('keine Seite verletzt die CSP aus _headers', async ({ page, request }) => {
  const verstoesse = await wieAufPages(page);
  for (const { loc } of await sitemap(request)) {
    await page.goto(lokal(loc));
    await page.waitForLoadState('networkidle');
  }
  expect(verstoesse).toEqual([]);
});

test('unter der CSP setzt das Modus-Skript den gespeicherten Modus vor dem Zeichnen', async ({
  page,
}) => {
  const verstoesse = await wieAufPages(page);
  await page.goto('/de/werkzeuge/iban-pruefer/');
  const wurzel = page.locator('html');

  // Der Umschalter ist ein Skript als Datei, das Modus-Skript ein Inline-Skript.
  await page.getByLabel('Dunkel').check();
  await expect(wurzel).toHaveAttribute('data-modus', 'dunkel');

  await page.reload();
  await expect(wurzel).toHaveAttribute('data-modus', 'dunkel');

  // Der IBAN-Prüfer läuft ebenfalls als Datei.
  await page.locator('#iban-eingabe').fill('CH94 0076 2011 6238 5295 7');
  await expect(page.locator('.status')).toHaveAttribute('data-art', 'fehler');
  expect(verstoesse).toEqual([]);
});
