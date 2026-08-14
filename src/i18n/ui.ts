/**
 * Sprachen und UI-Texte.
 *
 * CLAUDE.md 4: Start mit de, fr traegt die Struktur von Anfang an mit, en fuer
 * die Entwickler-Tools. Keine Sprache wird nachtraeglich eingebaut.
 *
 * Fachtexte der Tools liegen NICHT hier, sondern in der Content Collection
 * (`src/content/tools/`). Hier stehen nur Texte des Geruests.
 */

export const locales = ['de', 'fr', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale = 'de' satisfies Locale;

/** Beschriftung im Sprachumschalter — immer in der Zielsprache. */
export const localeNames: Record<Locale, string> = {
  de: 'Deutsch',
  fr: 'Français',
  en: 'English',
};

/** Wert fuer `<html lang>` und `hreflang`. */
export const localeTags: Record<Locale, string> = {
  de: 'de-CH',
  fr: 'fr-CH',
  en: 'en',
};

/**
 * Uebersetztes Pfadsegment der Werkzeug-Uebersicht (CLAUDE.md 4):
 * `/de/werkzeuge/<slug>/` · `/fr/outils/<slug>/` · `/en/tools/<slug>/`.
 *
 * Einmal veroeffentlicht, ist ein Segment unveraenderlich. Aenderungen brauchen
 * eine dauerhafte Weiterleitung.
 */
export const werkzeugeSegment: Record<Locale, string> = {
  de: 'werkzeuge',
  fr: 'outils',
  en: 'tools',
};

const de = {
  'site.name': 'daxolo',
  'site.tagline': 'Werkzeuge für Zahlungsverkehr und Finanzen in der Schweiz',
  'skip.link': 'Direkt zum Inhalt',
  'nav.label': 'Hauptnavigation',
  'nav.home': 'Startseite',
  'nav.tools': 'Werkzeuge',
  'lang.label': 'Sprache wechseln',
  'lang.unavailable': 'Diese Seite gibt es noch nicht auf Deutsch.',
  'modus.label': 'Farbmodus',
  'modus.hell': 'Hell',
  'modus.dunkel': 'Dunkel',
  'modus.automatisch': 'Automatisch',
  'tools.empty': 'Es sind noch keine Werkzeuge veröffentlicht.',
  'tool.stand': 'Stand',
  'tool.source': 'Quelle',
  'tool.disclaimer.title': 'Haftungsausschluss',
  'tool.disclaimer.text':
    'Die Ergebnisse sind ohne Gewähr und ersetzen keine Steuer- oder Rechtsberatung. ' +
    'Die Verantwortung für ihre Verwendung bleibt bei dir.',
  'tool.explanation.title': 'Erklärung',
  'footer.privacy': 'Alle Berechnungen laufen in deinem Browser. Deine Daten verlassen ihn nie.',
} as const;

/** Jede Sprache muss alle Schluessel bedienen — sonst schlaegt der Typecheck fehl. */
type UiStrings = Record<keyof typeof de, string>;

const fr: UiStrings = {
  'site.name': 'daxolo',
  'site.tagline': 'Outils pour le trafic des paiements et les finances en Suisse',
  'skip.link': 'Aller au contenu',
  'nav.label': 'Navigation principale',
  'nav.home': 'Accueil',
  'nav.tools': 'Outils',
  'lang.label': 'Changer de langue',
  'lang.unavailable': 'Cette page n’existe pas encore en français.',
  'modus.label': 'Mode d’affichage',
  'modus.hell': 'Clair',
  'modus.dunkel': 'Sombre',
  'modus.automatisch': 'Automatique',
  'tools.empty': 'Aucun outil n’est encore publié.',
  'tool.stand': 'État',
  'tool.source': 'Source',
  'tool.disclaimer.title': 'Clause de non-responsabilité',
  'tool.disclaimer.text':
    'Les résultats sont fournis sans garantie et ne remplacent ni un conseil fiscal ni un ' +
    'conseil juridique. La responsabilité de leur utilisation t’incombe.',
  'tool.explanation.title': 'Explication',
  'footer.privacy':
    'Tous les calculs se font dans ton navigateur. Tes données ne le quittent jamais.',
};

const en: UiStrings = {
  'site.name': 'daxolo',
  'site.tagline': 'Tools for Swiss payments and finance',
  'skip.link': 'Skip to content',
  'nav.label': 'Main navigation',
  'nav.home': 'Home',
  'nav.tools': 'Tools',
  'lang.label': 'Change language',
  'lang.unavailable': 'This page is not available in English yet.',
  'modus.label': 'Colour mode',
  'modus.hell': 'Light',
  'modus.dunkel': 'Dark',
  'modus.automatisch': 'Automatic',
  'tools.empty': 'No tools published yet.',
  'tool.stand': 'As of',
  'tool.source': 'Source',
  'tool.disclaimer.title': 'Disclaimer',
  'tool.disclaimer.text':
    'Results are provided without warranty and do not replace tax or legal advice. ' +
    'Responsibility for their use remains with you.',
  'tool.explanation.title': 'Explanation',
  'footer.privacy': 'All calculations run in your browser. Your data never leaves it.',
};

export const ui: Record<Locale, UiStrings> = { de, fr, en };

export type UiKey = keyof UiStrings;
