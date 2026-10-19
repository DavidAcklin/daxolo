import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Tool-Metadaten (CLAUDE.md 5).
 *
 * Eine Datei je Werkzeug: `src/content/tools/<id>.md`. Die `id` ist ein
 * sprachneutraler technischer Schluessel und taucht nie in einer URL auf — in den
 * Pfaden stehen ausschliesslich die uebersetzten Slugs aus `sprachen`.
 *
 * Alle Sprachen sind gleichrangig (CLAUDE.md 4): keine steht privilegiert in der
 * Frontmatter-Wurzel. Oben liegt nur, was sprachunabhaengig gilt — Kategorie,
 * Stufe, Status, Haftungsausschluss. Titel, Beschreibung, Slug und Keywords
 * liegen fuer jede Sprache unter demselben Schluessel. Fehlt eine Sprache, ist
 * das ein sichtbarer Zustand: die Route entsteht nicht, der Sprachumschalter
 * sagt es, und es gibt kein hreflang darauf.
 *
 * Fachdaten (Saetze, Fristen, Feiertage) gehoeren NICHT hierher, sondern datiert
 * und mit Quelle nach `src/data/` (CLAUDE.md 2.3).
 */

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug: nur Kleinbuchstaben, Ziffern und Bindestriche');

/** Alles, was pro Sprache uebersetzt wird — fuer jede Sprache identisch aufgebaut. */
const sprachfassung = z.object({
  slug,
  title: z.string().min(1),
  description: z.string().min(1).max(200),
  keywords: z.array(z.string()).default([]),
});

const tools = defineCollection({
  loader: glob({ base: './src/content/tools', pattern: '**/*.{md,mdoc}' }),
  schema: z.object({
    /** Abgeleitet aus CLAUDE.md 1: Geld, Zahlungen, Steuern, Buchhaltung. */
    category: z.enum(['zahlungen', 'steuern', 'buchhaltung']),
    /** Produktleiter aus CLAUDE.md 1: 1 Rechner, 2 Parser, 3 Local-first. */
    stufe: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
    status: z.enum(['entwurf', 'live']).default('entwurf'),
    /** Sichtbarer Haftungsausschluss noetig (CLAUDE.md 9)? */
    haftungsausschluss: z.boolean().default(false),
    sprachen: z
      .object({
        de: sprachfassung.optional(),
        fr: sprachfassung.optional(),
        en: sprachfassung.optional(),
      })
      .refine(
        (sprachen) => Object.values(sprachen).some((fassung) => fassung !== undefined),
        'Mindestens eine Sprachfassung muss vorhanden sein.',
      ),
  }),
});

/**
 * Erklaertexte (CLAUDE.md 5).
 *
 * Eine Datei je Sprache nach dem Schema `<slug>.<sprache>.md`, zum Beispiel
 * `iban-pruefer.de.md`. Der `<slug>` ist die sprachneutrale Werkzeug-Id aus
 * `tools`, nicht der uebersetzte Routen-Slug — sonst haengt der Dateiname an
 * einer URL, die sich nie mehr aendern darf.
 *
 * Damit ist eine fehlende Uebersetzung eine fehlende Datei: sichtbar, ohne
 * Sonderfall im Schema. Der Text steht im Markdown-Body (min. 150 Woerter), die
 * Frontmatter bleibt leer. Zwischentitel sind `###`: die h2 "Erklaerung" setzt
 * das ToolLayout, der Text liegt eine Ebene darunter.
 */
const erklaerungen = defineCollection({
  loader: glob({
    base: './src/content/erklaerungen',
    pattern: '**/*.md',
    // Die Id ist der Dateiname ohne Endung: `iban-pruefer.de`. Ohne das
    // schluckt die Standard-Id den Punkt, und der Sprachteil geht verloren.
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({}).strict(),
});

/**
 * Rechtstexte (CLAUDE.md 10): Impressum und Datenschutzerklärung.
 *
 * Eine Datei je Dokument und Sprache nach dem Schema `<dokument>.<sprache>.md`,
 * etwa `impressum.fr.md`. Das Dokument ist ein sprachneutraler Schlüssel; die
 * übersetzten Slugs stehen in `src/i18n/ui.ts`. Alle drei Sprachen sind
 * Pflicht: Fehlt eine Datei, bricht der Build der Route ab.
 *
 * Werte, die noch fehlen, stehen als Platzhalter wie `{{EMAIL}}` im Text. Der
 * Build bricht ab, solange einer im Output steht (astro.config.mjs).
 */
const rechtliches = defineCollection({
  loader: glob({
    base: './src/content/rechtliches',
    pattern: '**/*.md',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z
    .object({
      titel: z.string().min(1),
      beschreibung: z.string().min(1).max(200),
      stand: z.coerce.date(),
    })
    .strict(),
});

export const collections = { tools, erklaerungen, rechtliches };
