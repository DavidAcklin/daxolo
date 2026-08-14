import type { Fachdatensatz, IsoDatum } from './typen';

/**
 * Auswahl des Datensatzes, der an einem Stichdatum gilt (CLAUDE.md 2.3).
 *
 * Damit kann ein Satzwechsel — etwa der beschlossene MwSt-Normalsatz ab 2028 —
 * allein in den Datendateien abgebildet werden, ohne Tool-Code anzufassen.
 */

const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;

/** Prueft Form und Kalendertag: 2026-02-31 ist ungueltig. */
export function istIsoDatum(wert: string): boolean {
  if (!ISO_DATUM.test(wert)) return false;
  const zeit = Date.parse(`${wert}T00:00:00Z`);
  if (Number.isNaN(zeit)) return false;
  return new Date(zeit).toISOString().startsWith(wert);
}

function pruefeDatum(wert: IsoDatum, feld: string): void {
  if (!istIsoDatum(wert)) {
    throw new RangeError(`${feld} muss ein Datum im Format YYYY-MM-DD sein, erhalten: "${wert}"`);
  }
}

/**
 * Der am Stichdatum gueltige Datensatz, oder `undefined`.
 *
 * Gueltigkeit ist beidseitig einschliesslich. Ueberlappen mehrere Datensaetze,
 * gewinnt der mit dem spaetesten `gueltig_ab`.
 */
export function gueltigAm<T extends Fachdatensatz>(
  datensaetze: readonly T[],
  stichdatum: IsoDatum,
): T | undefined {
  pruefeDatum(stichdatum, 'Stichdatum');

  let treffer: T | undefined;
  for (const satz of datensaetze) {
    pruefeDatum(satz.gueltig_ab, 'gueltig_ab');
    if (satz.gueltig_bis !== undefined) pruefeDatum(satz.gueltig_bis, 'gueltig_bis');

    const beginnt = satz.gueltig_ab <= stichdatum;
    const laeuftNoch = satz.gueltig_bis === undefined || stichdatum <= satz.gueltig_bis;
    if (!beginnt || !laeuftNoch) continue;

    if (treffer === undefined || satz.gueltig_ab > treffer.gueltig_ab) {
      treffer = satz;
    }
  }
  return treffer;
}

/**
 * Wie `gueltigAm`, wirft aber statt still zu schweigen.
 *
 * Kein Tool rechnet mit einem geratenen Satz: lieber ein klarer Fehler als eine
 * falsche Zahl auf einer Rechnung.
 */
export function verlangeGueltigAm<T extends Fachdatensatz>(
  datensaetze: readonly T[],
  stichdatum: IsoDatum,
  bezeichnung: string,
): T {
  const treffer = gueltigAm(datensaetze, stichdatum);
  if (treffer === undefined) {
    throw new RangeError(
      `Fuer "${bezeichnung}" liegen zum ${stichdatum} keine gepruefte Daten vor. ` +
        'Waehle ein Stichdatum im abgedeckten Zeitraum oder ergaenze den Datensatz in src/data/.',
    );
  }
  return treffer;
}
