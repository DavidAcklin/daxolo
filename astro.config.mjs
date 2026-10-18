// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // CLAUDE.md 2.1: kein Backend. Der Output ist und bleibt statisch.
  output: 'static',
  site: 'https://daxolo.ch',
  trailingSlash: 'always',

  // CLAUDE.md 4: de ist Start, fr und en tragen die Struktur von Anfang an mit.
  // Alle Sprachen sind praefixiert — auch de. So gibt es keine Sonderrolle,
  // die spaeter zurueckgebaut werden muesste.
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'fr', 'en'],
    routing: {
      prefixDefaultLocale: true,
      // Die Wurzel wird unten als echte Weiterleitung gebaut, nicht als
      // zweite Ausgabe der deutschen Startseite — sonst gibt es die Seite
      // unter zwei URLs.
      redirectToDefaultLocale: false,
    },
  },

  // Die Wurzel gehoert keiner Sprache. Statisch erzeugte Weiterleitung auf de.
  redirects: {
    '/': '/de/',
  },

  // CLAUDE.md 8: LCP < 1.5 s. Jedes Stylesheet als eigene Datei blockiert das
  // erste Zeichnen; auf Werkzeugseiten kostete das zweite rund 300 ms und hob
  // das LCP auf 1.51 s. Eingebettet entfällt die Anfrage. Der Preis: die
  // Basis-CSS wird nicht seitenübergreifend gecacht — rund 4 kB gzip je Seite.
  build: {
    inlineStylesheets: 'always',
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
