/**
 * Schweizer Fachlogik: IBAN, Referenzen, Pruefziffern, MwSt-Logik (CLAUDE.md 4).
 *
 * Vorhanden: IBAN inklusive Modulo 97-10 und QR-IBAN-Erkennung (`./iban`).
 * Geplant, jeweils erst mit benannter Quelle und offiziellen Testvektoren
 * (CLAUDE.md 2.5): Creditor Reference nach ISO 11649, QR-Referenz mit Modulo 10
 * rekursiv, MwSt-Saetze ueber `src/data/`.
 */
export * from './iban';

/**
 * Version der Schweizer Implementation Guidelines QR-Rechnung (CLAUDE.md 2.4).
 *
 * Die Spec-Version ist ein expliziter Parameter, keine verstreute Annahme:
 * - '2.3' — in Kraft seit 22.11.2025, nur strukturierte Adresse.
 * - '2.4' — in Kraft mit dem SIC-Release vom 13./14.11.2026.
 */
export type QrSpecVersion = '2.3' | '2.4';

export const QR_SPEC_AKTUELL: QrSpecVersion = '2.3';
