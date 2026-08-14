import {
  berechnePruefziffern,
  IBAN_LAENGE,
  normalisiereIban,
  pruefeIban,
  type IbanFehlerCode,
} from '../../lib/swiss/iban';
import type { TextKey } from './texte';

/**
 * Fachlogik der Oberfläche des IBAN-Prüfers.
 *
 * Reine Funktionen, kein `document`, kein `window` (CLAUDE.md 4). Die Prüfung
 * selbst liegt in `src/lib/swiss/iban/`; hier entsteht daraus die Anzeige:
 * welcher Status, welche Textschlüssel, welche Tabellenzeilen.
 *
 * Übersetzt wird nichts — es werden nur Schlüssel und Platzhalterwerte
 * geliefert. So sagt dieselbe Logik in drei Sprachen dasselbe.
 */

export interface Zeile {
  schluessel: TextKey;
  wert: string;
  /** Zahlen und Kennungen laufen in Monospace, rechtsbündig. */
  zahl: boolean;
}

export interface Befund {
  status: 'erfolg' | 'warnung' | 'fehler';
  /** Kernaussage in einem Satz. */
  titel: TextKey;
  /** Erläuterungen darunter, in dieser Reihenfolge. */
  texte: TextKey[];
  /** Platzhalterwerte für Titel und Texte. */
  werte: Record<string, string>;
  zeilen: Zeile[];
  /** Normalisierte, formatierte IBAN zum Kopieren — nur wenn sie gültig ist. */
  kopierwert?: string;
}

/**
 * Ergebnis für die Anzeige. `undefined` heisst: nichts anzeigen.
 *
 * Ein leeres Feld ist kein Fehler, sondern der Anfang. Erst was dasteht, wird
 * beurteilt (CLAUDE.md 9).
 */
export function befund(eingabe: string): Befund | undefined {
  if (normalisiereIban(eingabe) === '') return undefined;

  const ergebnis = pruefeIban(eingabe);

  if (ergebnis.ok && ergebnis.umfang === 'vollstaendig') {
    return {
      status: 'erfolg',
      titel: 'treffer.vollstaendig',
      texte: [ergebnis.istQrIban ? 'treffer.qr' : 'treffer.normal', 'treffer.kein-konto'],
      werte: {},
      zeilen: [
        { schluessel: 'zeile.iban', wert: ergebnis.formatiert, zahl: true },
        { schluessel: 'zeile.land', wert: ergebnis.land, zahl: false },
        { schluessel: 'zeile.iid', wert: ergebnis.iid, zahl: true },
        { schluessel: 'zeile.konto', wert: ergebnis.kontonummer, zahl: true },
        {
          schluessel: 'zeile.art',
          wert: ergebnis.istQrIban ? 'zeile.qr-iban' : 'zeile.normale-iban',
          zahl: false,
        },
      ],
      kopierwert: ergebnis.formatiert,
    };
  }

  if (ergebnis.ok) {
    // Prüfziffer stimmt, Aufbau ungeprüft — die Grenze steht ausdrücklich da
    // und wird nicht zu "gültig" verkürzt (CLAUDE.md 2.5).
    return {
      status: 'warnung',
      titel: 'treffer.nur-pruefziffer',
      texte: ['treffer.ungeprueft', 'treffer.kein-konto'],
      werte: { land: ergebnis.land },
      zeilen: [
        { schluessel: 'zeile.iban', wert: ergebnis.formatiert, zahl: true },
        { schluessel: 'zeile.land', wert: ergebnis.land, zahl: false },
      ],
      kopierwert: ergebnis.formatiert,
    };
  }

  return fehlerBefund(eingabe, ergebnis.code, ergebnis.stelle);
}

function fehlerBefund(eingabe: string, code: IbanFehlerCode, stelle: number | undefined): Befund {
  const iban = normalisiereIban(eingabe);
  const land = iban.slice(0, 2);
  const soll = IBAN_LAENGE[land];

  const rumpf = { status: 'fehler', texte: [], werte: {}, zeilen: [] } satisfies Omit<
    Befund,
    'titel'
  >;

  switch (code) {
    case 'ungueltiges-zeichen':
      return {
        ...rumpf,
        titel: 'fehler.ungueltiges-zeichen',
        werte: { stelle: String(stelle ?? 1) },
      };

    case 'falsche-laenge':
      return {
        ...rumpf,
        // Ohne bekannte Solllänge bleibt nur die Aussage "zu kurz für eine IBAN".
        titel: soll === undefined ? 'fehler.zu-kurz' : 'fehler.falsche-laenge',
        werte: { land, ist: String(iban.length), soll: String(soll ?? '') },
      };

    case 'pruefziffer-falsch': {
      const passend = berechnePruefziffern(land, iban.slice(4));
      return {
        ...rumpf,
        titel: 'fehler.pruefziffer-falsch',
        texte: passend === undefined ? [] : ['fehler.pruefziffer-hinweis'],
        werte: { passend: passend ?? '' },
      };
    }

    case 'unbekanntes-land':
      return { ...rumpf, titel: 'fehler.unbekanntes-land' };

    case 'leer':
      return { ...rumpf, titel: 'fehler.leer' };
  }
}

/** Vorgabe beim Laden: ein funktionierendes Beispiel, nie ein leeres Formular. */
export const BEISPIEL_IBAN = 'CH93 0076 2011 6238 5295 7';
