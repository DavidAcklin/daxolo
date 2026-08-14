import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Vitest testet ausschliesslich die framework-freie Logik (CLAUDE.md 4).
// Kein DOM, keine Astro-Runtime: was hier laeuft, laeuft spaeter auch in der
// Buchhaltung aus Stufe 3.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**'],
    coverage: {
      include: ['src/lib/**/*.ts', 'src/tools/**/logic.ts'],
      exclude: ['**/*.test.ts'],
    },
  },
});
