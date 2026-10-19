// @ts-check
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { eintragAusHtml, pruefeSitemap, sitemapXml } from './src/lib/sitemap';

const SITE = 'https://daxolo.ch';

/**
 * sitemap.xml aus dem gebauten HTML (src/lib/sitemap.ts). Bricht den Build ab,
 * wenn hreflang-Verweise nicht gegenseitig sind oder eine URL nicht unter der
 * Produktionsdomain liegt.
 *
 * @returns {import('astro').AstroIntegration}
 */
function sitemap() {
  return {
    name: 'daxolo:sitemap',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const wurzel = fileURLToPath(dir);
        const dateien = (await readdir(wurzel, { recursive: true }))
          .filter((datei) => datei.endsWith('.html'))
          .sort();
        const eintraege = [];
        for (const datei of dateien) {
          const eintrag = eintragAusHtml(await readFile(`${wurzel}/${datei}`, 'utf8'), datei);
          if (eintrag !== undefined) eintraege.push(eintrag);
        }
        const fehler = pruefeSitemap(eintraege, SITE);
        if (fehler.length > 0) throw new Error(`Sitemap ungültig:\n${fehler.join('\n')}`);
        await writeFile(new URL('sitemap.xml', dir), sitemapXml(eintraege));
        logger.info(`sitemap.xml mit ${eintraege.length} URLs`);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  // CLAUDE.md 2.1: kein Backend. Der Output ist und bleibt statisch.
  output: 'static',
  // Produktionsdomain: Canonical, hreflang und Sitemap sind absolut.
  site: SITE,
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

  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});
