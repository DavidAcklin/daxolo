// @ts-check
import { access, readdir, readFile, rename, rmdir, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { locales } from './src/i18n/ui';
import { findePlatzhalter } from './src/lib/platzhalter';
import { eintragAusHtml, pruefeSitemap, sitemapXml } from './src/lib/sitemap';

const SITE = 'https://daxolo.ch';

/**
 * Bricht den Build ab, solange ein Platzhalter wie {{EMAIL}} im Output steht
 * (src/lib/platzhalter.ts). Durchsucht jede Datei ausser Binärformaten — so geht
 * kein Rechtstext mit fehlenden Angaben live.
 *
 * @returns {import('astro').AstroIntegration}
 */
function platzhalter() {
  const BINAER = /\.(woff2?|png|jpe?g|gif|webp|avif|ico|pdf)$/i;
  return {
    name: 'daxolo:platzhalter',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const wurzel = fileURLToPath(dir);
        const funde = [];
        for (const datei of (await readdir(wurzel, { recursive: true })).sort()) {
          const pfad = `${wurzel}/${datei}`;
          if (BINAER.test(datei) || !(await stat(pfad)).isFile()) continue;
          const gefunden = findePlatzhalter(await readFile(pfad, 'utf8'));
          if (gefunden.length > 0) funde.push(`  ${datei}: ${gefunden.join(', ')}`);
        }
        if (funde.length > 0) {
          throw new Error(
            `Platzhalter im Output — so darf nichts live gehen:\n${funde.join('\n')}`,
          );
        }
      },
    },
  };
}

/**
 * 404-Seiten dorthin, wo Cloudflare Pages sie sucht: /de/404.html usw. Astro
 * schreibt src/pages/de/404.astro nach de/404/index.html; nur die Wurzel-404
 * landet von selbst in 404.html. Fehlt eine, bricht der Build ab — ohne
 * /404.html liefert Pages jede unbekannte Adresse mit Status 200 aus.
 *
 * @returns {import('astro').AstroIntegration}
 */
function fehlerseiten() {
  return {
    name: 'daxolo:fehlerseiten',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        await access(new URL('404.html', dir)).catch(() => {
          throw new Error('404.html fehlt: Cloudflare Pages würde die Seite als SPA ausliefern.');
        });
        for (const sprache of locales) {
          const ordner = new URL(`${sprache}/404/`, dir);
          await rename(new URL('index.html', ordner), new URL(`${sprache}/404.html`, dir)).catch(
            () => {
              throw new Error(`src/pages/${sprache}/404.astro fehlt oder wurde nicht gebaut.`);
            },
          );
          await rmdir(ordner);
        }
      },
    },
  };
}

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

  integrations: [fehlerseiten(), platzhalter(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Kleine Skripte legt Astro sonst inline in das HTML. Die CSP in
      // public/_headers erlaubt genau ein Inline-Skript, das Modus-Skript im
      // Kopf, per Hash; alles andere kommt als Datei von 'self'. Gilt nur für
      // Skripte und importierte Assets — Stylesheets steuert inlineStylesheets.
      assetsInlineLimit: 0,
    },
  },
});
