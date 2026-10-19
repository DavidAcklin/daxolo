import { expect, test } from '@playwright/test';

/**
 * Impressum und Datenschutzerklärung (CLAUDE.md 10): in allen drei Sprachen,
 * erreichbar aus dem Footer jeder Seite.
 */

const rechtstexte = {
  de: {
    impressum: { pfad: '/de/impressum/', link: 'Impressum', titel: 'Impressum' },
    datenschutz: { pfad: '/de/datenschutz/', link: 'Datenschutz', titel: 'Datenschutzerklärung' },
  },
  fr: {
    impressum: {
      pfad: '/fr/mentions-legales/',
      link: 'Mentions légales',
      titel: 'Mentions légales',
    },
    datenschutz: {
      pfad: '/fr/protection-des-donnees/',
      link: 'Protection des données',
      titel: 'Déclaration de protection des données',
    },
  },
  en: {
    impressum: { pfad: '/en/legal-notice/', link: 'Legal notice', titel: 'Legal notice' },
    datenschutz: { pfad: '/en/privacy-policy/', link: 'Privacy policy', titel: 'Privacy policy' },
  },
} as const;

const lang = { de: 'de-CH', fr: 'fr-CH', en: 'en' } as const;
const sprachen = ['de', 'fr', 'en'] as const;

test('jede Seite verlinkt im Footer Impressum und Datenschutz in ihrer Sprache', async ({
  page,
  request,
}) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const seiten = [...xml.matchAll(/<loc>https:\/\/daxolo\.ch(.*?)<\/loc>/g)].map((m) => m[1] ?? '');
  // Die 404-Seiten stehen nicht in der Sitemap, tragen den Footer aber auch.
  for (const pfad of [...seiten, '/de/gibt-es-nicht/', '/fr/x/', '/en/x/', '/x/']) {
    await page.goto(pfad);
    const sprache = sprachen.find((s) => pfad.startsWith(`/${s}/`)) ?? 'de';
    const fuss = page.locator('footer nav');
    for (const { pfad: ziel, link } of Object.values(rechtstexte[sprache])) {
      await expect(fuss.getByRole('link', { name: link }), pfad).toHaveAttribute('href', ziel);
    }
  }
});

for (const sprache of sprachen) {
  for (const [dokument, { pfad, titel }] of Object.entries(rechtstexte[sprache])) {
    test(`${pfad} zeigt den Rechtstext mit allen Sprachfassungen`, async ({ page }) => {
      const antwort = await page.goto(pfad);
      expect(antwort?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', lang[sprache]);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(titel);

      // Der Sprachumschalter führt auf den übersetzten Slug, nicht auf eine geratene URL.
      for (const andere of sprachen) {
        const ziel = rechtstexte[andere][dokument as keyof (typeof rechtstexte)['de']].pfad;
        await expect(page.locator(`header a[hreflang="${lang[andere]}"]`)).toHaveAttribute(
          'href',
          ziel,
        );
      }
    });
  }
}

test('im Impressum stehen Name und Ort auf eigenen Zeilen', async ({ page }) => {
  for (const sprache of sprachen) {
    await page.goto(rechtstexte[sprache].impressum.pfad);
    // Der Absatz, der mit dem Namen beginnt — nicht der zum Urheberrecht.
    const adresse = page.locator('main p', { hasText: /^\s*David/ });
    expect(await adresse.innerHTML()).toMatch(/^David<br>/);
  }
});
