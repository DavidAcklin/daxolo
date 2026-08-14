import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const BASE_URL = `http://localhost:${PORT}`;

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
  // Getestet wird der gebaute, statische Output — nicht der Dev-Server.
  webServer: {
    command: 'npm run build && npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
