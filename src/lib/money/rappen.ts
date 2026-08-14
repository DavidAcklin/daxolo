/**
 * Geldarithmetik in ganzzahligen Rappen (CLAUDE.md 2.2).
 *
 * Betraege sind intern immer ganzzahlige Rappen, nie Dezimal-Floats. Deshalb gibt
 * es hier bewusst NUR exakte Operationen: Addition, Subtraktion, Vorzeichen,
 * Vergleich.
 *
 * Was hier absichtlich fehlt:
 * - Multiplikation mit Saetzen (MwSt, Skonto) und Division: beides erzwingt eine
 *   Rundungsentscheidung. Rundungsregel und -richtung sind pro Anwendungsfall
 *   explizit und getestet — sie werden nicht hier zentral geraten.
 * - Parsen und Formatieren: das passiert an der UI-Grenze, mit dem ersten Tool,
 *   das es braucht (`1'000.50` und `1000,50` muessen beide gelten, CLAUDE.md 6).
 */

declare const rappenMarke: unique symbol;

/** Ganzzahlige Rappen. Nur ueber `rappen()` zu bekommen. */
export type Rappen = number & { readonly [rappenMarke]: true };

export const NULL_RAPPEN = 0 as Rappen;

export function istRappen(wert: unknown): wert is Rappen {
  return typeof wert === 'number' && Number.isSafeInteger(wert);
}

/**
 * Erzeugt einen Rappen-Betrag.
 *
 * @throws RangeError wenn der Wert kein sicherer ganzzahliger Wert ist —
 *         inklusive NaN, Infinity und Dezimalstellen wie 10.5.
 */
export function rappen(wert: number): Rappen {
  if (!Number.isFinite(wert)) {
    throw new RangeError(`Rappen muessen endlich sein, erhalten: ${String(wert)}`);
  }
  if (!Number.isInteger(wert)) {
    throw new RangeError(
      `Rappen muessen ganzzahlig sein, erhalten: ${wert}. ` +
        'Betraege werden in Rappen gefuehrt, nicht in Franken.',
    );
  }
  if (!Number.isSafeInteger(wert)) {
    throw new RangeError(
      `Betrag ausserhalb des sicher darstellbaren Bereichs: ${wert}. ` +
        `Maximal ${Number.MAX_SAFE_INTEGER} Rappen.`,
    );
  }
  return wert as Rappen;
}

/** Addiert exakt. Wirft, sobald das Ergebnis den sicheren Bereich verlaesst. */
export function addieren(a: Rappen, b: Rappen): Rappen {
  return rappen(a + b);
}

export function subtrahieren(a: Rappen, b: Rappen): Rappen {
  return rappen(a - b);
}

export function negieren(a: Rappen): Rappen {
  return rappen(-a);
}

export function betrag(a: Rappen): Rappen {
  return rappen(Math.abs(a));
}

/** Summe mehrerer Betraege. Leere Liste ergibt 0. */
export function summe(betraege: readonly Rappen[]): Rappen {
  return betraege.reduce<Rappen>((total, wert) => addieren(total, wert), NULL_RAPPEN);
}

/** -1, 0 oder 1 — geeignet fuer `Array.prototype.sort`. */
export function vergleichen(a: Rappen, b: Rappen): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function istNegativ(a: Rappen): boolean {
  return a < 0;
}
