import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Playwright deckt nur Smoke-Tests ab (CLAUDE.md 3): rendert die Seite, sind die
// Routen da, funktioniert die Tastaturbedienung. Fachlogik gehoert in Vitest.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  ...(process.env['CI'] ? { workers: 1 } : {}),
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Getestet wird der gebaute, statische Output — nicht der Dev-Server — und
  // zwar so, wie Cloudflare Pages ihn ausliefert: wrangler pages dev wendet
  // public/_headers an und sucht 404.html wie die Produktion. In der CI ist
  // dist das Artefakt aus dem Job "qualitaet" und wird nicht neu gebaut: geprüft
  // wird genau, was danach hochgeladen wird.
  webServer: {
    command: process.env['CI'] ? 'npm run pages:dev' : 'npm run build && npm run pages:dev',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
    // wrangler meldet sonst Nutzungsdaten an Cloudflare (CLAUDE.md 2.6).
    env: { WRANGLER_SEND_METRICS: 'false' },
  },
});
