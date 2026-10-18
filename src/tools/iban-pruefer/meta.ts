/**
 * Angaben, die alle drei Routen des IBAN-Prüfers teilen.
 *
 * Die Quelle steht sichtbar am Werkzeug (CLAUDE.md 2.3 und 5): welcher Stand
 * geprüft wurde und woher die Regel stammt.
 */
export const WERKZEUG_ID = 'iban-pruefer';

export const QUELLE = {
  stelle: 'SIX Group — Implementation Guidelines QR-Rechnung 2.3',
  url: 'https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-v2.3-de.pdf',
  geprueft_am: '2026-08-15',
} as const;
