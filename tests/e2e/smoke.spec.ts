import { expect, test } from '@playwright/test';

/**
 * Smoke-Tests des Geruests: Routen, Sprachen, Tastaturbedienung.
 * Fachlogik wird hier nicht getestet — die gehoert in Vitest (CLAUDE.md 3).
 */

const sprachen = [
  { pfad: '/de/', lang: 'de-CH', werkzeuge: '/de/werkzeuge/' },
  { pfad: '/fr/', lang: 'fr-CH', werkzeuge: '/fr/outils/' },
  { pfad: '/en/', lang: 'en', werkzeuge: '/en/tools/' },
] as const;

test('die Wurzel leitet auf die Standardsprache', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/de\/$/);
});

for (const { pfad, lang } of sprachen) {
  test(`${pfad} rendert mit lang="${lang}"`, async ({ page }) => {
    const antwort = await page.goto(pfad);
    expect(antwort?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main#inhalt')).toBeVisible();
  });
}

for (const { werkzeuge, lang } of sprachen) {
  test(`${werkzeuge} existiert mit uebersetztem Segment`, async ({ page }) => {
    const antwort = await page.goto(werkzeuge);
    expect(antwort?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('h1')).toBeVisible();
  });
}

test('jede Sprachfassung verweist per hreflang auf die anderen', async ({ page }) => {
  await page.goto('/de/');
  await expect(page.locator('link[rel="alternate"][hreflang="fr-CH"]')).toHaveCount(1);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
});

test('der Sprachumschalter wechselt ohne JavaScript die Route', async ({ page }) => {
  await page.goto('/de/');
  await page.getByRole('link', { name: 'Français' }).click();
  await expect(page).toHaveURL(/\/fr\/$/);
});

test('der Sprachwechsel uebersetzt das Werkzeug-Segment mit', async ({ page }) => {
  await page.goto('/de/werkzeuge/');
  await page.getByRole('link', { name: 'Français' }).click();
  await expect(page).toHaveURL(/\/fr\/outils\/$/);
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/tools\/$/);
});

test('die Werkzeug-Uebersicht ist aus dem Kopfbereich erreichbar', async ({ page }) => {
  await page.goto('/de/');
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('link', { name: 'Werkzeuge' })
    .click();
  await expect(page).toHaveURL(/\/de\/werkzeuge\/$/);
});

test('der Sprunglink ist das erste per Tastatur erreichbare Element', async ({ page }) => {
  await page.goto('/de/');
  await page.keyboard.press('Tab');
  const fokus = page.locator(':focus');
  await expect(fokus).toHaveText('Direkt zum Inhalt');
  await expect(fokus).toBeVisible();
});
