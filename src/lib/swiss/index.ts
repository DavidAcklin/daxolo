/**
 * Schweizer Fachlogik: IBAN, Referenzen, Pruefziffern, MwSt-Logik (CLAUDE.md 4).
 *
 * Noch leer — hier kommt Code erst hinein, wenn die Quelle benannt ist
 * (CLAUDE.md 2.5). Geplant, jeweils mit offiziellen Testvektoren belegt:
 * Modulo 97-10 (IBAN, Creditor Reference ISO 11649), Modulo 10 rekursiv
 * (QR-Referenz), QR-IBAN-Erkennung, MwSt-Saetze ueber `src/data/`.
 */

/**
 * Version der Schweizer Implementation Guidelines QR-Rechnung (CLAUDE.md 2.4).
 *
 * Die Spec-Version ist ein expliziter Parameter, keine verstreute Annahme:
 * - '2.3' — in Kraft seit 22.11.2025, nur strukturierte Adresse.
 * - '2.4' — in Kraft mit dem SIC-Release vom 13./14.11.2026.
 */
export type QrSpecVersion = '2.3' | '2.4';

export const QR_SPEC_AKTUELL: QrSpecVersion = '2.3';
