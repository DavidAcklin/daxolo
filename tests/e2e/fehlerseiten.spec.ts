import { expect, test } from '@playwright/test';

/**
 * 404-Seiten, ausgeliefert wie von Cloudflare Pages (wrangler pages dev).
 *
 * Eine unbekannte Adresse muss Status 404 liefern, nicht 200. Ohne /404.html
 * hält Pages die Seite für eine Single-Page-App und beantwortet jede Adresse mit
 * der Startseite — jede vertippte URL wäre dann eine gültige Seite.
 */

const sprachen = [
  {
    pfad: '/de/gibt-es-nicht/',
    lang: 'de-CH',
    titel: 'Seite nicht gefunden',
    link: 'Zur Werkzeugübersicht',
    ziel: '/de/werkzeuge/',
  },
  {
    pfad: '/fr/outils/nexiste-pas/',
    lang: 'fr-CH',
    titel: 'Page introuvable',
    link: 'Vers la vue d’ensemble des outils',
    ziel: '/fr/outils/',
  },
  {
    pfad: '/en/tools/does-not-exist/',
    lang: 'en',
    titel: 'Page not found',
    link: 'Go to the tool overview',
    ziel: '/en/tools/',
  },
] as const;

for (const { pfad, lang, titel, link, ziel } of sprachen) {
  test(`${pfad} liefert 404 in der Sprache des Pfads`, async ({ page }) => {
    const antwort = await page.goto(pfad);
    expect(antwort?.status()).toBe(404);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titel);

    // Keine eigene Adresse: nicht indexieren, kein canonical, kein hreflang.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('link[rel="canonical"], link[hreflang]')).toHaveCount(0);

    await page.getByRole('link', { name: link }).click();
    await expect(page).toHaveURL(new RegExp(`${ziel}$`));
  });
}

test('eine Adresse ausserhalb der Sprachen liefert 404 in allen drei Sprachen', async ({
  page,
}) => {
  const antwort = await page.goto('/gibt-es-nicht/');
  expect(antwort?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Seite nicht gefunden · Page introuvable · Page not found',
  );
  for (const { lang, link, ziel } of sprachen) {
    const block = page.locator(`main [lang="${lang}"]`);
    await expect(block.getByRole('link', { name: link })).toHaveAttribute('href', ziel);
  }
});
