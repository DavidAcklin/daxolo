/**
 * Sitemap aus dem gebauten HTML (CLAUDE.md 4).
 *
 * Quelle ist der Kopf jeder gebauten Seite: `<link rel="canonical">` und die
 * `<link rel="alternate" hreflang>`-Einträge. So kann die Sitemap nie etwas
 * anderes behaupten als die Seiten selbst. Seiten mit `noindex` — etwa die
 * Weiterleitung der Wurzel — fehlen bewusst.
 *
 * Kein Paket: @astrojs/sitemap leitet Sprachfassungen aus dem Pfad hinter dem
 * Sprachpräfix ab. Übersetzte Slugs wie /fr/outils/verificateur-iban/ kennt es
 * nicht; jede hreflang-Angabe einer Werkzeugseite wäre falsch.
 *
 * Reine Funktionen, kein Dateisystem. Die Integration in astro.config.mjs liest
 * die Dateien und bricht den Build ab, wenn `pruefeSitemap` Fehler meldet.
 */

export interface Sprachfassung {
  hreflang: string;
  href: string;
}

export interface SitemapEintrag {
  loc: string;
  fassungen: Sprachfassung[];
}

const ENTITAETEN: Record<string, string> = {
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&lt;': '<',
  '&gt;': '>',
};

function attribute(tag: string): Record<string, string> {
  return Object.fromEntries(
    [...tag.matchAll(/([\w-]+)\s*=\s*"([^"]*)"/g)].map((a) => [
      (a[1] ?? '').toLowerCase(),
      (a[2] ?? '').replace(/&(amp|quot|#39|lt|gt);/g, (e) => ENTITAETEN[e] ?? e),
    ]),
  );
}

/**
 * Eintrag einer gebauten Seite, oder `undefined`, wenn sie `noindex` trägt.
 * Eine indexierbare Seite ohne canonical ist ein Fehler, kein Sonderfall.
 */
export function eintragAusHtml(html: string, datei: string): SitemapEintrag | undefined {
  const ende = html.search(/<\/head>/i);
  const kopf = ende === -1 ? html : html.slice(0, ende);

  const metas = [...kopf.matchAll(/<meta\b[^>]*>/gi)].map((m) => attribute(m[0]));
  const noindex = metas.some(
    (m) => m['name']?.toLowerCase() === 'robots' && /\bnoindex\b/i.test(m['content'] ?? ''),
  );
  if (noindex) return undefined;

  const links = [...kopf.matchAll(/<link\b[^>]*>/gi)].map((l) => attribute(l[0]));
  const canonical = links.find((l) => l['rel'] === 'canonical')?.['href'];
  if (canonical === undefined) {
    throw new Error(`${datei}: indexierbare Seite ohne <link rel="canonical">`);
  }

  const fassungen = links
    .filter((l) => l['rel'] === 'alternate' && l['hreflang'] !== undefined)
    .map((l) => ({ hreflang: l['hreflang'] ?? '', href: l['href'] ?? '' }));

  return { loc: canonical, fassungen };
}

/**
 * Prüft, was Suchmaschinen für hreflang verlangen: absolute URLs der
 * Produktionsdomain, jede Fassung verweist auf sich selbst, und jeder Verweis
 * wird von der Gegenseite erwidert. Gibt die Fehler zurück, leer heisst gültig.
 */
export function pruefeSitemap(eintraege: SitemapEintrag[], site: string): string[] {
  const fehler: string[] = [];
  const herkunft = new URL(site).origin;
  const nachLoc = new Map<string, SitemapEintrag>();

  for (const eintrag of eintraege) {
    if (nachLoc.has(eintrag.loc)) fehler.push(`${eintrag.loc}: doppelt in der Sitemap`);
    nachLoc.set(eintrag.loc, eintrag);
  }

  for (const eintrag of eintraege) {
    for (const url of [eintrag.loc, ...eintrag.fassungen.map((f) => f.href)]) {
      if (!url.startsWith(`${herkunft}/`)) {
        fehler.push(`${eintrag.loc}: ${url} liegt nicht unter ${herkunft}`);
      }
    }

    const sprachen = eintrag.fassungen.map((f) => f.hreflang);
    const doppelt = sprachen.filter((s, i) => sprachen.indexOf(s) !== i);
    if (doppelt.length > 0) fehler.push(`${eintrag.loc}: hreflang doppelt: ${doppelt.join(', ')}`);

    if (!eintrag.fassungen.some((f) => f.hreflang !== 'x-default' && f.href === eintrag.loc)) {
      fehler.push(`${eintrag.loc}: verweist nicht per hreflang auf sich selbst`);
    }

    for (const fassung of eintrag.fassungen) {
      if (fassung.hreflang === 'x-default') continue;
      const gegenseite = nachLoc.get(fassung.href);
      if (gegenseite === undefined) {
        fehler.push(
          `${eintrag.loc}: hreflang="${fassung.hreflang}" zeigt auf ${fassung.href}, die keine indexierbare Seite ist`,
        );
      } else if (!gegenseite.fassungen.some((f) => f.href === eintrag.loc)) {
        fehler.push(`${fassung.href}: erwidert den hreflang-Verweis von ${eintrag.loc} nicht`);
      }
    }
  }

  return fehler;
}

function xml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** sitemap.xml mit allen Sprachfassungen je URL, nach `loc` sortiert. */
export function sitemapXml(eintraege: SitemapEintrag[]): string {
  const urls = [...eintraege]
    .sort((a, b) => a.loc.localeCompare(b.loc))
    .map((eintrag) =>
      [
        '  <url>',
        `    <loc>${xml(eintrag.loc)}</loc>`,
        ...eintrag.fassungen.map(
          (f) =>
            `    <xhtml:link rel="alternate" hreflang="${xml(f.hreflang)}" href="${xml(f.href)}"/>`,
        ),
        '  </url>',
      ].join('\n'),
    );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
