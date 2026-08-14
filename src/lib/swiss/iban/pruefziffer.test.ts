import { describe, expect, it } from 'vitest';
import { berechnePruefziffern, ibanRest, pruefzifferStimmt } from './pruefziffer';

/**
 * Testvektoren aus SIX, "Schweizer Implementation Guidelines QR-Rechnung",
 * Version 2.3 (20.11.2023), Beispielteil — dort als IBAN bzw. QR-IBAN der
 * Beispielrechnungen abgedruckt.
 */
const OFFIZIELL = [
  'CH4431999123000889012',
  'CH6431961000004421557',
  'CH5204835012345671000',
  'CH5800791123000889012',
] as const;

/** Beispiel von der IBAN-Seite von SIX. */
const SIX_BEISPIEL = 'CH9300762011623852957';

describe('ibanRest', () => {
  it('ergibt fuer jede offizielle IBAN den Rest 1', () => {
    for (const iban of [...OFFIZIELL, SIX_BEISPIEL]) {
      expect(ibanRest(iban)).toBe(1);
    }
  });

  it('rechnet Buchstaben im Kontoteil korrekt um (A=10 … Z=35)', () => {
    // Liechtensteiner IBAN mit Buchstaben in der Kontonummer.
    expect(ibanRest('LI21088100002324013AA')).toBe(1);
  });

  it('meldet ungueltige Zeichen mit undefined, statt zu werfen', () => {
    expect(ibanRest('CH93 0076 2011 6238 5295 7')).toBeUndefined();
    expect(ibanRest('CH93007620116238529*7')).toBeUndefined();
    expect(ibanRest('ch9300762011623852957')).toBeUndefined();
  });

  it('gibt fuer zu kurze Eingaben undefined zurueck', () => {
    expect(ibanRest('')).toBeUndefined();
    expect(ibanRest('CH93')).toBeUndefined();
  });
});

describe('pruefzifferStimmt', () => {
  it('erkennt eine verdrehte Ziffer', () => {
    // Zwei Stellen der Kontonummer vertauscht: 6238 -> 6328.
    expect(pruefzifferStimmt(SIX_BEISPIEL)).toBe(true);
    expect(pruefzifferStimmt('CH9300762011632852957')).toBe(false);
  });

  it('erkennt eine falsche Pruefziffer', () => {
    expect(pruefzifferStimmt('CH9400762011623852957')).toBe(false);
  });
});

describe('berechnePruefziffern', () => {
  it('rekonstruiert die Pruefziffer der offiziellen Beispiele', () => {
    for (const iban of [...OFFIZIELL, SIX_BEISPIEL]) {
      expect(berechnePruefziffern(iban.slice(0, 2), iban.slice(4))).toBe(iban.slice(2, 4));
    }
  });

  it('rekonstruiert auch die liechtensteinische Pruefziffer', () => {
    expect(berechnePruefziffern('LI', '088100002324013AA')).toBe('21');
  });

  it('liefert zweistellig mit fuehrender Null', () => {
    const pruefziffer = berechnePruefziffern('CH', '0900000000000000A');
    expect(pruefziffer).toHaveLength(2);
  });

  it('meldet ungueltige Zeichen mit undefined', () => {
    expect(berechnePruefziffern('CH', '0076 2011 6238 5295 7')).toBeUndefined();
  });
});
