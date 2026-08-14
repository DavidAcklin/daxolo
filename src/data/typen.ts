/**
 * Grundtypen fuer Fachdaten (CLAUDE.md 2.3).
 *
 * Steuersaetze, Feiertage und Fristen aendern sich. Deshalb ist jeder Datensatz
 * datiert, traegt eine amtliche Quelle und ein Pruefdatum — und jede Berechnung
 * nimmt ein Stichdatum entgegen, statt implizit "heute" zu rechnen.
 */

/** Datum im Format YYYY-MM-DD. Vergleichbar per String-Vergleich. */
export type IsoDatum = string;

export interface Quelle {
  /** Amtliche Stelle, z. B. "Eidgenoessische Steuerverwaltung ESTV". */
  stelle: string;
  /** Direktlink auf die Publikation, nicht auf die Startseite. */
  url: string;
}

/** Basis jedes datierten Fachdatensatzes. */
export interface Fachdatensatz {
  /** Erster Tag der Gueltigkeit, einschliesslich. */
  gueltig_ab: IsoDatum;
  /** Letzter Tag der Gueltigkeit, einschliesslich. Fehlt, solange offen. */
  gueltig_bis?: IsoDatum;
  quelle: Quelle;
  /** Wann zuletzt gegen die Quelle geprueft. */
  geprueft_am: IsoDatum;
}
