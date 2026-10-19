import type { Locale } from '../../i18n/ui';

/**
 * Texte des IBAN-Prüfers, je Sprache vollständig.
 *
 * Sie liegen beim Werkzeug und nicht in `src/i18n/ui.ts`: dort stehen die Texte
 * des Gerüsts, hier die des Tools. Platzhalter in geschweiften Klammern werden
 * von `formatiere()` ersetzt.
 *
 * Die Fachlogik in `src/lib/swiss/iban/` liefert stabile Codes und eine deutsche
 * Entwicklerfassung der Meldung; übersetzt wird ausschliesslich hier.
 */

const de = {
  'feld.label': 'IBAN',
  'feld.hinweis': 'Leerzeichen darfst du setzen, Klein- und Grossschreibung ist egal.',
  'aktion.pruefen': 'Prüfen',
  'aktion.kopieren': 'IBAN kopieren',
  'aktion.kopiert': 'Kopiert',
  'aktion.kopieren-fehler':
    'Kopieren nicht möglich. Markiere die IBAN in der Tabelle und kopiere sie von Hand.',
  'ergebnis.titel': 'Ergebnis',
  'status.erfolg': 'Erfolg',
  'status.warnung': 'Hinweis',
  'status.fehler': 'Fehler',
  'treffer.vollstaendig': 'Prüfziffer stimmt, Aufbau geprüft.',
  'treffer.qr': 'Das ist eine QR-IBAN: sie verlangt zwingend eine QR-Referenz.',
  'treffer.normal':
    'Das ist eine konventionelle IBAN (die übliche Form, keine QR-IBAN): eine QR-Referenz ist ' +
    'hier nicht zulässig.',
  'treffer.nur-pruefziffer': 'Prüfziffer stimmt.',
  'treffer.ungeprueft':
    'Länge und Aufbau einer {land}-IBAN prüfen wir nicht — dafür fehlt uns ein geprüftes ' +
    'Register. Vollständig geprüft werden CH und LI.',
  'treffer.kein-konto':
    'Die Prüfziffer sagt nichts darüber, ob das Konto existiert. Das weiss nur die Bank.',
  'zeile.iban': 'IBAN',
  'zeile.land': 'Land',
  'zeile.iid': 'Instituts-Identifikation (IID, Nummer der Bank)',
  'zeile.konto': 'Kontonummer',
  'zeile.art': 'Art',
  'zeile.qr-iban': 'QR-IBAN',
  'zeile.normale-iban': 'Konventionelle IBAN',
  'tabelle.titel': 'Bestandteile der IBAN',
  'tabelle.feld': 'Feld',
  'tabelle.wert': 'Wert',
  'fehler.leer': 'Gib eine IBAN ein.',
  'fehler.ungueltiges-zeichen':
    'An Stelle {stelle} steht ein Zeichen, das in einer IBAN nicht vorkommt. Erlaubt sind ' +
    'Buchstaben und Ziffern.',
  'fehler.falsche-laenge': 'Eine {land}-IBAN hat {soll} Stellen, deine hat {ist}.',
  'fehler.zu-kurz': 'Das ist zu kurz für eine IBAN: {ist} Stellen.',
  'fehler.unbekanntes-land': 'Eine IBAN beginnt mit zwei Buchstaben für das Land.',
  'fehler.pruefziffer-falsch': 'Die Prüfziffer passt nicht zum Rest: die IBAN ist vertippt.',
  'fehler.pruefziffer-hinweis':
    'Zur eingegebenen Kontonummer würde die Prüfziffer {passend} gehören. Stimmt die ' +
    'Kontonummer, korrigiere Stelle 3 und 4 — sonst steckt der Tippfehler im Rest.',
} as const;

type Texte = Record<keyof typeof de, string>;

const fr: Texte = {
  'feld.label': 'IBAN',
  'feld.hinweis': 'Les espaces sont permis, la casse n’a pas d’importance.',
  'aktion.pruefen': 'Vérifier',
  'aktion.kopieren': 'Copier l’IBAN',
  'aktion.kopiert': 'Copié',
  'aktion.kopieren-fehler':
    'Copie impossible. Sélectionnez l’IBAN dans le tableau et copiez-le manuellement.',
  'ergebnis.titel': 'Résultat',
  'status.erfolg': 'Succès',
  'status.warnung': 'Remarque',
  'status.fehler': 'Erreur',
  'treffer.vollstaendig': 'Les chiffres de contrôle sont corrects, la structure est vérifiée.',
  'treffer.qr': 'Il s’agit d’un QR-IBAN : il exige une référence QR.',
  'treffer.normal': 'Il s’agit d’un IBAN conventionnel : une référence QR n’est pas admise ici.',
  'treffer.nur-pruefziffer': 'Les chiffres de contrôle sont corrects.',
  'treffer.ungeprueft':
    'Nous ne vérifions ni la longueur ni la structure d’un IBAN {land} — il nous manque un ' +
    'registre vérifié. La vérification complète couvre CH et LI.',
  'treffer.kein-konto':
    'Les chiffres de contrôle ne disent rien sur l’existence du compte. Seule la banque le sait.',
  'zeile.iban': 'IBAN',
  'zeile.land': 'Pays',
  'zeile.iid': 'Identification d’établissement (IID)',
  'zeile.konto': 'Numéro de compte',
  'zeile.art': 'Type',
  'zeile.qr-iban': 'QR-IBAN',
  'zeile.normale-iban': 'IBAN conventionnel',
  'tabelle.titel': 'Éléments de l’IBAN',
  'tabelle.feld': 'Champ',
  'tabelle.wert': 'Valeur',
  'fehler.leer': 'Saisissez un IBAN.',
  'fehler.ungueltiges-zeichen':
    'La position {stelle} contient un caractère qui n’existe pas dans un IBAN. Seules les ' +
    'lettres et les chiffres sont admis.',
  'fehler.falsche-laenge': 'Un IBAN {land} compte {soll} positions, le vôtre en a {ist}.',
  'fehler.zu-kurz': 'C’est trop court pour un IBAN : {ist} positions.',
  'fehler.unbekanntes-land': 'Un IBAN commence par deux lettres désignant le pays.',
  'fehler.pruefziffer-falsch':
    'Les chiffres de contrôle ne correspondent pas au reste : l’IBAN comporte une faute de frappe.',
  'fehler.pruefziffer-hinweis':
    'Pour le numéro de compte saisi, les chiffres de contrôle seraient {passend}. Si le numéro de ' +
    'compte est juste, corrigez les positions 3 et 4 — sinon la faute est ailleurs.',
};

const en: Texte = {
  'feld.label': 'IBAN',
  'feld.hinweis': 'Spaces are fine, upper and lower case both work.',
  'aktion.pruefen': 'Check',
  'aktion.kopieren': 'Copy IBAN',
  'aktion.kopiert': 'Copied',
  'aktion.kopieren-fehler': 'Copying failed. Select the IBAN in the table and copy it manually.',
  'ergebnis.titel': 'Result',
  'status.erfolg': 'Success',
  'status.warnung': 'Note',
  'status.fehler': 'Error',
  'treffer.vollstaendig': 'Check digits are correct, structure verified.',
  'treffer.qr': 'This is a QR-IBAN: it requires a QR reference.',
  'treffer.normal': 'This is a conventional IBAN: a QR reference is not allowed here.',
  'treffer.nur-pruefziffer': 'Check digits are correct.',
  'treffer.ungeprueft':
    'We do not verify length or structure of a {land} IBAN — we have no verified registry ' +
    'for it. Full verification covers CH and LI.',
  'treffer.kein-konto':
    'Check digits say nothing about whether the account exists. Only the bank knows that.',
  'zeile.iban': 'IBAN',
  'zeile.land': 'Country',
  'zeile.iid': 'Institution identification (IID)',
  'zeile.konto': 'Account number',
  'zeile.art': 'Type',
  'zeile.qr-iban': 'QR-IBAN',
  'zeile.normale-iban': 'Conventional IBAN',
  'tabelle.titel': 'IBAN components',
  'tabelle.feld': 'Field',
  'tabelle.wert': 'Value',
  'fehler.leer': 'Enter an IBAN.',
  'fehler.ungueltiges-zeichen':
    'Position {stelle} holds a character that does not occur in an IBAN. Only letters and ' +
    'digits are allowed.',
  'fehler.falsche-laenge': 'A {land} IBAN has {soll} characters, yours has {ist}.',
  'fehler.zu-kurz': 'That is too short for an IBAN: {ist} characters.',
  'fehler.unbekanntes-land': 'An IBAN starts with two letters for the country.',
  'fehler.pruefziffer-falsch': 'The check digits do not match the rest: the IBAN has a typo.',
  'fehler.pruefziffer-hinweis':
    'For the account number entered, the check digits would be {passend}. If the account ' +
    'number is right, fix positions 3 and 4 — otherwise the typo is elsewhere.',
};

export const texte: Record<Locale, Texte> = { de, fr, en };

export type TextKey = keyof Texte;

/** Ersetzt `{platzhalter}` durch Werte. Unbekannte Platzhalter bleiben stehen. */
export function formatiere(vorlage: string, werte: Record<string, string> = {}): string {
  return vorlage.replace(/\{(\w+)\}/g, (treffer, name: string) => werte[name] ?? treffer);
}
