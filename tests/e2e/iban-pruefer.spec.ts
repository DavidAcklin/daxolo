import { expect, test } from '@playwright/test';

/**
 * Smoke-Tests des IBAN-Prüfers: Route, Vorgabe, Live-Prüfung, Kopieren.
 * Die Fachlogik selbst deckt Vitest ab (CLAUDE.md 3).
 */

const seiten = [
  { pfad: '/de/werkzeuge/iban-pruefer/', lang: 'de-CH', titel: 'IBAN-Prüfer' },
  { pfad: '/fr/outils/verificateur-iban/', lang: 'fr-CH', titel: 'Vérificateur IBAN' },
  { pfad: '/en/tools/iban-validator/', lang: 'en', titel: 'IBAN validator' },
] as const;

for (const { pfad, lang, titel } of seiten) {
  test(`${pfad} rendert mit Beispiel und Ergebnis`, async ({ page }) => {
    const antwort = await page.goto(pfad);
    expect(antwort?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titel);

    // Sinnvolle Vorgabe: das Feld ist gefüllt und das Ergebnis steht da.
    await expect(page.locator('#iban-eingabe')).toHaveValue('CH93 0076 2011 6238 5295 7');
    await expect(page.locator('.status')).toHaveAttribute('data-art', 'erfolg');

    // Erklaertext in jeder Sprache (CLAUDE.md 5) — fehlt die Datei, fehlt der
    // Abschnitt, und dieser Test schlaegt an.
    await expect(page.locator('#erklaerung-titel')).toBeVisible();
    await expect(page.locator('.erklaerung h3')).toHaveCount(3);
  });
}

test('die Prüfung läuft während der Eingabe', async ({ page }) => {
  await page.goto('/de/werkzeuge/iban-pruefer/');
  const feld = page.locator('#iban-eingabe');
  const status = page.locator('.status');

  await feld.fill('CH94 0076 2011 6238 5295 7');
  await expect(status).toHaveAttribute('data-art', 'fehler');
  await expect(status).toContainText('vertippt');
  await expect(feld).toHaveAttribute('aria-invalid', 'true');

  await feld.fill('CH44 3199 9123 0008 8901 2');
  await expect(status).toHaveAttribute('data-art', 'erfolg');
  await expect(status).toContainText('QR-IBAN');
});

test('Formfehler stehen am Feld, nicht als Urteil', async ({ page }) => {
  await page.goto('/de/werkzeuge/iban-pruefer/');
  const feld = page.locator('#iban-eingabe');

  await feld.fill('CH93 0076');
  await expect(page.locator('#iban-eingabe-fehler')).toContainText('21 Stellen');
  await expect(feld).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('.status')).toBeHidden();

  // Das Urteil steht an genau einer Stelle: das Feld wiederholt es nicht.
  await feld.fill('CH94 0076 2011 6238 5295 7');
  await expect(page.locator('.status')).toContainText('vertippt');
  await expect(page.locator('#iban-eingabe-fehler')).toBeEmpty();
});

test('die Tabelle behaelt ihre Form, auch wenn das Skript die Zeilen ersetzt', async ({ page }) => {
  await page.goto('/de/werkzeuge/iban-pruefer/');

  // Astros Scope-Attribut tragen nur gerenderte Elemente. Zeilen aus dem Skript
  // verloren deshalb Ausrichtung und Haarlinien — das prüft dieser Test.
  const pruefeForm = async () => {
    const zeilen = page.locator('#iban-werte tbody tr');
    await expect(zeilen.first().locator('td')).toHaveCSS('text-align', 'end');
    await expect(zeilen.nth(1).locator('td')).toHaveCSS('border-top-width', '1px');
    await expect(zeilen.first().locator('th')).toHaveCSS('text-align', 'start');
  };

  await pruefeForm();
  await page.locator('#iban-eingabe').fill('CH44 3199 9123 0008 8901 2');
  await expect(page.locator('#iban-werte')).toContainText('QR-IBAN');
  await pruefeForm();
});

test('eine Eingabe gelangt beim Absenden nicht in die URL', async ({ page }) => {
  await page.goto('/de/werkzeuge/iban-pruefer/');
  await expect(page.locator('#iban-eingabe')).not.toHaveAttribute('name', /.*/);
  await page.locator('#iban-eingabe').fill('CH44 3199 9123 0008 8901 2');
  await page.locator('#iban-eingabe').press('Enter');
  expect(new URL(page.url()).search).toBe('');
});

test('eine auslaendische IBAN ergibt die abgestufte Aussage, keinen Fehler', async ({ page }) => {
  await page.goto('/de/werkzeuge/iban-pruefer/');
  await page.locator('#iban-eingabe').fill('DE89 3704 0044 0532 0130 00');

  const status = page.locator('.status');
  await expect(status).toHaveAttribute('data-art', 'warnung');
  await expect(status).toContainText('Prüfziffer stimmt');
  await expect(status).toContainText('prüfen wir nicht');
});

test('das leere Feld zeigt keinen Fehler', async ({ page }) => {
  await page.goto('/de/werkzeuge/iban-pruefer/');
  await page.locator('#iban-eingabe').fill('');
  await expect(page.locator('.status')).toBeHidden();
});

test('der Kopier-Knopf bestaetigt sichtbar', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/de/werkzeuge/iban-pruefer/');
  await page.locator('#iban-kopieren').click();
  await expect(page.locator('[data-bestaetigung]')).toHaveText('Kopiert');
});

test('der Farbmodus laesst sich umschalten und ueberlebt einen Seitenwechsel', async ({ page }) => {
  await page.goto('/de/werkzeuge/iban-pruefer/');
  const wurzel = page.locator('html');
  await expect(wurzel).not.toHaveAttribute('data-modus', /.*/);

  await page.getByLabel('Dunkel').check();
  await expect(wurzel).toHaveAttribute('data-modus', 'dunkel');

  await page.goto('/de/');
  await expect(wurzel).toHaveAttribute('data-modus', 'dunkel');

  await page.getByLabel('Automatisch').check();
  await expect(wurzel).not.toHaveAttribute('data-modus', /.*/);
});

test('die Markierung im Umschalter folgt data-modus, nicht dem Radio', async ({ page }) => {
  // Vor dem Modulskript ist "automatisch" angehakt, data-modus aber schon
  // gesetzt. Die sichtbare Auswahl muss data-modus folgen, sonst springt sie.
  await page.goto('/de/werkzeuge/iban-pruefer/');
  await page.evaluate(() => {
    document.documentElement.dataset['modus'] = 'dunkel';
  });
  await expect(page.locator('#modus-automatisch')).toBeChecked();

  const flaeche = (wert: string) =>
    page
      .locator(`label[for="modus-${wert}"]`)
      .evaluate((label) => getComputedStyle(label).backgroundColor);
  expect(await flaeche('dunkel')).not.toBe('rgba(0, 0, 0, 0)');
  expect(await flaeche('automatisch')).toBe('rgba(0, 0, 0, 0)');
});

test('die Werkzeug-Uebersicht listet den Pruefer in jeder Sprache', async ({ page }) => {
  for (const { pfad } of seiten) {
    const uebersicht = pfad.split('/').slice(0, 3).join('/') + '/';
    await page.goto(uebersicht);
    await expect(page.getByRole('link', { name: /IBAN/i }).first()).toBeVisible();
  }
});
