// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // CLAUDE.md 2.6: keine Nutzereingaben in Logs.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },

  // CLAUDE.md 4: logic.ts ist framework-frei. Kein document, kein window.
  {
    files: ['src/lib/**/*.ts', 'src/tools/**/logic.ts', 'src/data/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'document', message: 'Logik bleibt framework-frei (CLAUDE.md 4).' },
        { name: 'window', message: 'Logik bleibt framework-frei (CLAUDE.md 4).' },
        { name: 'localStorage', message: 'Persistenz gehoert nicht in die Logik (CLAUDE.md 3).' },
      ],
    },
  },

  {
    files: ['**/*.test.ts', 'tests/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // Prettier zuletzt: schaltet alle formatierenden Regeln ab.
  prettier,
);
