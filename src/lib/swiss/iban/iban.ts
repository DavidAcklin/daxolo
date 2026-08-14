import { berechnePruefziffern, ibanRest } from './pruefziffer';

/**
 * Pruefung und Aufbereitung schweizerischer und liechtensteinischer IBAN.
 *
 * Reine Funktionen, kein `document`, kein `window`, kein Werfen: jeder Fehler
 * kommt als Ergebnisobjekt mit stabilem Code zurueck (CLAUDE.md 4 und 8).
 *
 * Quellen (geprueft am 2026-08-14):
 *
 * [1] SIX Group, "IBAN", Standards Zahlungsverkehr Schweiz.
 *     https://www.six-group.com/en/products-services/banking-services/payment-standardization/standards/iban.html
 *     Aufbau der schweizerischen und liechtensteinischen IBAN: 21 Stellen,
 *     Landescode (2) + Pruefziffer (2) + IID (5, Stellen 5 bis 9) + Kontonummer
 *     (12 alphanumerisch); Pruefziffer nach "modulo 97-10 Verfahren gemaess
 *     ISO/IEC 7064".
 *
 * [2] SIX Group, "Schweizer Implementation Guidelines QR-Rechnung", Version 2.3
 *     (20.11.2023, gueltig ab 21.11.2025), Kapitel 2.8 QR-IID und 2.10 QR-IBAN:
 *     "QR-IIDs bestehen exklusiv aus Nummern von 30000 bis 31999." und
 *     "Fuer die QR-IID sind exklusiv Werte im Bereich 30000 – 31999 reserviert.
 *     […] Die QR-IBAN enthaelt zur Kennzeichnung des Verfahrens die QR-IID des
 *     kontofuehrenden Instituts."
 *     Ebenda, Datenelement QRCH/CdtrInf/IBAN: "Feste Laenge: 21 alphanumerische
 *     Zeichen, keine Leerschlaege erlaubt, nur IBANs mit CH- oder LI-Landescode
 *     zulaessig."
 *
 * [3] SIX Group, "Schweizer QR-Rechnung — Fachliche Informationen zur QR-IID und
 *     QR-IBAN", Version 1.1 (gueltig ab 29.02.2020), Kapitel 1.3.2 und 3.2:
 *     bestaetigt Bereich und Aufbau; "Formal unterscheiden sich IBAN und QR-IBAN
 *     nicht. Beide entsprechen den Vorgaben gemaess ISO 13616."
 */

/**
 * Laenge je Landescode. Bewusst nur CH und LI: fuer andere Laender liegt uns
 * kein geprueftes Register vor, und geraten wird nicht (CLAUDE.md 2.5). Kommt
 * ein Land dazu, gehoert seine Laenge als datierte Fachdatei nach `src/data/`.
 */
export const IBAN_LAENGE: Readonly<Record<string, number>> = { CH: 21, LI: 21 };

export type IbanLand = 'CH' | 'LI';

/** Erste und letzte QR-IID gemaess [2], beide einschliesslich. */
export const QR_IID_VON = 30000;
export const QR_IID_BIS = 31999;

/** Stellen der IID in der CH-/LI-IBAN gemaess [1], 1-basiert und einschliesslich. */
const IID_VON = 5;
const IID_BIS = 9;

export type IbanFehlerCode =
  'leer' | 'ungueltiges-zeichen' | 'falsche-laenge' | 'unbekanntes-land' | 'pruefziffer-falsch';

export interface IbanTreffer {
  ok: true;
  /** Normalisiert: Grossbuchstaben, ohne Leerzeichen. */
  iban: string;
  /** In Vierergruppen, wie auf Rechnungen ueblich. */
  formatiert: string;
  land: IbanLand;
  /** Instituts-Identifikation, Stellen 5 bis 9. */
  iid: string;
  /** Kontonummer, Stellen 10 bis 21. */
  kontonummer: string;
  /** Liegt die IID im QR-IID-Bereich, ist es eine QR-IBAN [2]. */
  istQrIban: boolean;
}

export interface IbanFehler {
  ok: false;
  code: IbanFehlerCode;
  nachricht: string;
  /** 1-basierte Stelle in der normalisierten IBAN, wo der Fehler sitzt. */
  stelle?: number | undefined;
}

export type IbanErgebnis = IbanTreffer | IbanFehler;

const BEISPIEL = 'CH93 0076 2011 6238 5295 7';
const NUR_ZIFFERN = /^\d+$/;
const NUR_BUCHSTABEN = /^[A-Z]+$/;
const ERLAUBTES_ZEICHEN = /^[A-Z0-9]$/;

function fehler(code: IbanFehlerCode, nachricht: string, stelle?: number): IbanFehler {
  return { ok: false, code, nachricht, stelle };
}

/** Grossbuchstaben, ohne jegliche Leerzeichen. Aendert sonst nichts. */
export function normalisiereIban(eingabe: string): string {
  return eingabe.replace(/\s+/g, '').toUpperCase();
}

/** Vierergruppen, getrennt durch einfache Leerzeichen. Prueft nichts. */
export function formatiereIban(eingabe: string): string {
  const iban = normalisiereIban(eingabe);
  const gruppen = iban.match(/.{1,4}/g);
  return gruppen === null ? '' : gruppen.join(' ');
}

/** Gehoert diese IID zum QR-Verfahren? Erwartet die fuenfstellige IID [2]. */
export function istQrIid(iid: string): boolean {
  if (!NUR_ZIFFERN.test(iid) || iid.length !== 5) return false;
  const nummer = Number(iid);
  return nummer >= QR_IID_VON && nummer <= QR_IID_BIS;
}

function istBekanntesLand(land: string): land is IbanLand {
  return Object.hasOwn(IBAN_LAENGE, land);
}

/**
 * Prueft eine IBAN vollstaendig: Zeichen, Land, Laenge, Aufbau und Pruefziffer.
 * Wirft nie — im Fehlerfall kommt ein Objekt mit stabilem Code zurueck.
 */
export function pruefeIban(eingabe: string): IbanErgebnis {
  const iban = normalisiereIban(eingabe);

  if (iban === '') {
    return fehler('leer', `Gib eine IBAN ein, zum Beispiel ${BEISPIEL}.`);
  }

  for (let i = 0; i < iban.length; i += 1) {
    const zeichen = iban.charAt(i);
    if (!ERLAUBTES_ZEICHEN.test(zeichen)) {
      return fehler(
        'ungueltiges-zeichen',
        `An Stelle ${i + 1} steht "${zeichen}". Eine IBAN besteht nur aus Buchstaben und ` +
          'Ziffern; Leerzeichen darfst du setzen, sie werden ignoriert.',
        i + 1,
      );
    }
  }

  const land = iban.slice(0, 2);
  if (!NUR_BUCHSTABEN.test(land)) {
    return fehler(
      'unbekanntes-land',
      `Eine IBAN beginnt mit zwei Buchstaben für das Land, zum Beispiel ${BEISPIEL}.`,
      1,
    );
  }
  if (!istBekanntesLand(land)) {
    return fehler(
      'unbekanntes-land',
      `Dieser Prüfer kennt nur die Schweiz (CH) und Liechtenstein (LI); deine IBAN ` +
        `beginnt mit "${land}".`,
      1,
    );
  }

  const pruefziffer = iban.slice(2, 4);
  if (!NUR_ZIFFERN.test(pruefziffer)) {
    return fehler(
      'ungueltiges-zeichen',
      `An Stelle 3 und 4 steht die zweistellige Prüfziffer, bei dir "${pruefziffer}". ` +
        `Beispiel: ${BEISPIEL}.`,
      3,
    );
  }

  const soll = IBAN_LAENGE[land] ?? 0;
  if (iban.length !== soll) {
    const abweichung = iban.length - soll;
    const richtung = abweichung > 0 ? 'zu viel' : 'zu wenig';
    return fehler(
      'falsche-laenge',
      `Eine ${land}-IBAN hat ${soll} Stellen, deine hat ${iban.length} — ` +
        `${Math.abs(abweichung)} ${richtung}.`,
      Math.min(iban.length, soll) + 1,
    );
  }

  const iid = iban.slice(IID_VON - 1, IID_BIS);
  if (!NUR_ZIFFERN.test(iid)) {
    return fehler(
      'ungueltiges-zeichen',
      `An den Stellen ${IID_VON} bis ${IID_BIS} steht die Bankleitzahl (IID) aus fünf ` +
        `Ziffern, bei dir "${iid}".`,
      IID_VON,
    );
  }

  if (ibanRest(iban) !== 1) {
    const passende = berechnePruefziffern(land, iban.slice(4));
    const hinweis =
      passende === undefined
        ? ''
        : ` Zu den übrigen Stellen würde die Prüfziffer "${passende}" passen: stimmt die ` +
          'Kontonummer, ist die Prüfziffer vertippt — sonst steckt der Fehler im Rest.';
    return fehler(
      'pruefziffer-falsch',
      `Die Prüfziffer "${pruefziffer}" an Stelle 3 und 4 passt nicht zum Rest der IBAN. ` +
        `Das heisst fast immer: die IBAN ist vertippt.${hinweis}`,
      3,
    );
  }

  return {
    ok: true,
    iban,
    formatiert: formatiereIban(iban),
    land,
    iid,
    kontonummer: iban.slice(IID_BIS),
    istQrIban: istQrIid(iid),
  };
}
