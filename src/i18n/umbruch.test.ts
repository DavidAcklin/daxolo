import { describe, expect, it } from 'vitest';
import { segmente } from './umbruch';

describe('segmente', () => {
  it('zeichnet "QR-Referenz" als umbruchfrei aus', () => {
    expect(segmente('Eine QR-Referenz ist hier nicht zulässig.')).toEqual([
      { text: 'Eine ', umbruchfrei: false },
      { text: 'QR-Referenz', umbruchfrei: true },
      { text: ' ist hier nicht zulässig.', umbruchfrei: false },
    ]);
  });

  it('findet den Begriff mehrfach und am Rand', () => {
    expect(segmente('QR-Referenz und QR-Referenz')).toEqual([
      { text: 'QR-Referenz', umbruchfrei: true },
      { text: ' und ', umbruchfrei: false },
      { text: 'QR-Referenz', umbruchfrei: true },
    ]);
  });

  it('lässt Texte ohne Begriff unverändert', () => {
    expect(segmente('Prüfziffer stimmt.')).toEqual([
      { text: 'Prüfziffer stimmt.', umbruchfrei: false },
    ]);
    expect(segmente('')).toEqual([]);
  });

  it('setzt den Text verlustfrei wieder zusammen', () => {
    const text = 'Das ist eine QR-IBAN: sie verlangt zwingend eine QR-Referenz.';
    expect(
      segmente(text)
        .map((s) => s.text)
        .join(''),
    ).toBe(text);
  });
});
