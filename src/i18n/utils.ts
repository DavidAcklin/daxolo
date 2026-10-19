import {
  defaultLocale,
  locales,
  rechtstextSlug,
  ui,
  werkzeugeSegment,
  type Locale,
  type Rechtstext,
  type UiKey,
} from './ui';

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}

/**
 * Liest die Sprache aus dem ersten Pfadsegment (`/de/…`).
 * Faellt auf die Standardsprache zurueck, wirft nie.
 */
export function getLocaleFromUrl(url: URL): Locale {
  const segment = url.pathname.split('/')[1];
  return isLocale(segment) ? segment : defaultLocale;
}

/** Uebersetzer fuer eine Sprache. Fehlende Schluessel gibt es nicht — der Typ verhindert sie. */
export function useTranslations(locale: Locale): (key: UiKey) => string {
  return (key) => ui[locale][key];
}

/**
 * Baut einen sprachpraefixierten Pfad mit abschliessendem Slash
 * (`trailingSlash: 'always'` in der Astro-Konfiguration).
 *
 * localePath('fr', 'tva') -> '/fr/tva/'
 */
export function localePath(locale: Locale, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return clean === '' ? `/${locale}/` : `/${locale}/${clean}/`;
}

/** Uebersicht aller Werkzeuge: `/de/werkzeuge/`, `/fr/outils/`, `/en/tools/`. */
export function werkzeugePath(locale: Locale): string {
  return localePath(locale, werkzeugeSegment[locale]);
}

/**
 * Pfad eines Werkzeugs (CLAUDE.md 4): `/<sprache>/<werkzeuge-segment>/<slug>/`.
 * Segment und Slug sind uebersetzt, die Kategorie kommt nie in den Pfad.
 */
export function toolPath(locale: Locale, slug: string): string {
  return localePath(locale, `${werkzeugeSegment[locale]}/${slug}`);
}

/** Pfad eines Rechtstexts: `/de/impressum/`, `/fr/protection-des-donnees/`. */
export function rechtstextPath(dokument: Rechtstext, locale: Locale): string {
  return localePath(locale, rechtstextSlug[dokument][locale]);
}

/**
 * Derselbe Pfad in einer anderen Sprache.
 *
 * Uebersetzt das Werkzeug-Segment mit, aber NICHT den Slug — den kennt nur der
 * Inhalt. Toolseiten geben ihre Sprachfassungen darum explizit als `alternates`
 * an; fehlt eine Fassung, gibt es dort bewusst keinen Link.
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  const quelle = isLocale(segments[0]) ? segments[0] : defaultLocale;
  const rest = isLocale(segments[0]) ? segments.slice(1) : segments;

  if (rest[0] === werkzeugeSegment[quelle]) {
    rest[0] = werkzeugeSegment[target];
  }

  return localePath(target, rest.join('/'));
}
