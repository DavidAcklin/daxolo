/**
 * Platzhalter im gebauten Output (CLAUDE.md 10).
 *
 * Rechtstexte tragen Platzhalter wie `{{EMAIL}}`, bis die Werte feststehen.
 * Nichts davon darf live gehen: Die Integration in astro.config.mjs durchsucht
 * jede Textdatei des Builds und bricht ab, solange ein Platzhalter darin steht.
 *
 * Erkannt wird die Schreibweise der Rechtstexte: Grossbuchstaben, Ziffern und
 * Unterstrich in doppelten geschweiften Klammern. Kleingeschriebenes wie
 * `{{a}}` kann in minifiziertem JavaScript legitim vorkommen und zählt nicht.
 */
const PLATZHALTER = /\{\{\s*[A-Z][A-Z0-9_]*\s*\}\}/g;

/** Alle verschiedenen Platzhalter eines Texts, in der Reihenfolge ihres Auftretens. */
export function findePlatzhalter(text: string): string[] {
  return [...new Set(text.match(PLATZHALTER) ?? [])];
}
