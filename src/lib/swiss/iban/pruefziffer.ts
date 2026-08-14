/**
 * Pruefziffern der IBAN nach Modulo 97-10.
 *
 * Quellen (geprueft am 2026-08-14):
 * - SIX Group, "IBAN", Standards Zahlungsverkehr Schweiz:
 *   https://www.six-group.com/en/products-services/banking-services/payment-standardization/standards/iban.html
 *   Nennt fuer die schweizerische und liechtensteinische IBAN ausdruecklich das
 *   "modulo 97-10 Verfahren gemaess ISO/IEC 7064" und die Laenge von 21 Stellen.
 * - SIX Group, "Schweizer Implementation Guidelines QR-Rechnung", Version 2.3
 *   (20.11.2023, gueltig ab 21.11.2025), Kapitel 2.9: "IBAN ist die international
 *   normierte Darstellung einer Bankkontonummer gemaess ISO 13616 Standard."
 *
 * Verfahren nach ISO 13616: die ersten vier Zeichen (Landescode und Pruefziffer)
 * wandern ans Ende, Buchstaben werden zu Zahlen (A=10 … Z=35), der Rest gegen 97
 * muss 1 sein.
 */

const ZIFFER_A = 10;
const CODE_A = 'A'.charCodeAt(0);
const CODE_Z = 'Z'.charCodeAt(0);
const CODE_0 = '0'.charCodeAt(0);
const CODE_9 = '9'.charCodeAt(0);

/**
 * Rest einer Zeichenfolge modulo 97, ziffernweise gerechnet.
 *
 * Ziffernweise, weil eine 21-stellige IBAN als Zahl laengst nicht mehr exakt in
 * einen `number` passt. Der Zwischenstand bleibt immer unter 970.
 *
 * Gibt `undefined` zurueck, sobald ein Zeichen ausserhalb von A–Z und 0–9 liegt —
 * geraten wird hier nichts, und geworfen wird nie.
 */
function restModulo97(zeichenfolge: string): number | undefined {
  let rest = 0;

  for (const zeichen of zeichenfolge) {
    const code = zeichen.charCodeAt(0);
    let wert: number;

    if (code >= CODE_0 && code <= CODE_9) {
      wert = code - CODE_0;
    } else if (code >= CODE_A && code <= CODE_Z) {
      wert = code - CODE_A + ZIFFER_A;
    } else {
      return undefined;
    }

    // Ein Buchstabe steuert zwei Ziffern bei (10 bis 35), eine Ziffer eine.
    rest = wert >= ZIFFER_A ? (rest * 100 + wert) % 97 : (rest * 10 + wert) % 97;
  }

  return rest;
}

/**
 * Rest der IBAN modulo 97. Bei einer gueltigen IBAN ist er 1.
 * Erwartet die normalisierte Form (Grossbuchstaben, keine Leerzeichen).
 */
export function ibanRest(iban: string): number | undefined {
  if (iban.length < 5) return undefined;
  return restModulo97(iban.slice(4) + iban.slice(0, 4));
}

export function pruefzifferStimmt(iban: string): boolean {
  return ibanRest(iban) === 1;
}

/**
 * Die Pruefziffer, die zu Landescode und BBAN gehoert — zweistellig, mit
 * fuehrender Null.
 *
 * Damit kann eine Fehlermeldung sagen, welche Pruefziffer zum Rest der Eingabe
 * passen wuerde, statt nur "ungueltig" zu melden (CLAUDE.md 8).
 */
export function berechnePruefziffern(land: string, bban: string): string | undefined {
  const rest = restModulo97(`${bban}${land}00`);
  if (rest === undefined) return undefined;
  return String(98 - rest).padStart(2, '0');
}
