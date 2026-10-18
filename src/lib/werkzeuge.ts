import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { locales, type Locale } from '../i18n/ui';
import { umbruchfreiHtml } from '../i18n/umbruch';
import { toolPath } from '../i18n/utils';

/**
 * Adapter zwischen der Content Collection und den Routen.
 *
 * Hier — und nur hier — wird entschieden, welche Werkzeuge in welcher Sprache
 * existieren. Die Routen selbst enthalten keine Auswahllogik.
 */

export type Werkzeug = CollectionEntry<'tools'>;
export type Erklaerung = CollectionEntry<'erklaerungen'>;

/** Ein Werkzeug in genau einer Sprache, flach fuer die Anzeige. */
export interface Werkzeugfassung {
  id: string;
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  category: Werkzeug['data']['category'];
  stufe: Werkzeug['data']['stufe'];
  haftungsausschluss: boolean;
  pfad: string;
}

/**
 * Entwuerfe erscheinen nur lokal. Ein halbfertiges Finanzwerkzeug soll niemand
 * versehentlich im Netz finden.
 */
function istSichtbar(werkzeug: Werkzeug): boolean {
  return import.meta.env.PROD ? werkzeug.data.status === 'live' : true;
}

export function fassung(werkzeug: Werkzeug, locale: Locale): Werkzeugfassung | undefined {
  const sprache = werkzeug.data.sprachen[locale];
  if (sprache === undefined) return undefined;

  return {
    id: werkzeug.id,
    locale,
    slug: sprache.slug,
    title: sprache.title,
    description: sprache.description,
    keywords: sprache.keywords,
    category: werkzeug.data.category,
    stufe: werkzeug.data.stufe,
    haftungsausschluss: werkzeug.data.haftungsausschluss,
    pfad: toolPath(locale, sprache.slug),
  };
}

/** Alle sichtbaren Werkzeuge, die es in dieser Sprache gibt — alphabetisch. */
export async function werkzeugeFuer(locale: Locale): Promise<Werkzeugfassung[]> {
  const alle = await getCollection('tools', istSichtbar);
  return alle
    .map((werkzeug) => fassung(werkzeug, locale))
    .filter((eintrag) => eintrag !== undefined)
    .sort((a, b) => a.title.localeCompare(b.title, locale));
}

/**
 * Erklaertext eines Werkzeugs in einer Sprache (CLAUDE.md 5), oder `undefined`.
 *
 * Die Datei heisst `<werkzeug-id>.<sprache>.md`. Fehlt sie, fehlt der Text —
 * das ist ein sichtbarer Zustand und kein Fehler.
 */
export async function erklaerungFuer(
  werkzeugId: string,
  locale: Locale,
): Promise<Erklaerung | undefined> {
  return getEntry('erklaerungen', `${werkzeugId}.${locale}`);
}

/**
 * Gerendertes HTML des Erklaertexts, mit umbruchfreien Begriffen wie
 * "QR-Referenz" (src/i18n/umbruch.ts), oder `undefined`, wenn der Text fehlt.
 */
export async function erklaerungHtml(
  werkzeugId: string,
  locale: Locale,
): Promise<string | undefined> {
  const html = (await erklaerungFuer(werkzeugId, locale))?.rendered?.html;
  return html === undefined ? undefined : umbruchfreiHtml(html);
}

/**
 * Pfade der vorhandenen Sprachfassungen — Grundlage fuer Sprachumschalter und
 * hreflang. Sprachen ohne Fassung fehlen bewusst.
 */
export function alternatePfade(werkzeug: Werkzeug): Partial<Record<Locale, string>> {
  const pfade: Partial<Record<Locale, string>> = {};
  for (const locale of locales) {
    const sprache = werkzeug.data.sprachen[locale];
    if (sprache !== undefined) pfade[locale] = toolPath(locale, sprache.slug);
  }
  return pfade;
}
