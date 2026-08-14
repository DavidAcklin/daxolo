import { describe, expect, it } from 'vitest';
import {
  addieren,
  betrag,
  istNegativ,
  istRappen,
  negieren,
  NULL_RAPPEN,
  rappen,
  subtrahieren,
  summe,
  vergleichen,
} from './rappen';

describe('rappen', () => {
  it('nimmt ganze Zahlen an, auch negative und null', () => {
    expect(rappen(0)).toBe(0);
    expect(rappen(1005)).toBe(1005);
    expect(rappen(-4200)).toBe(-4200);
  });

  it('weist Dezimalstellen ab — Franken sind keine Rappen', () => {
    expect(() => rappen(10.5)).toThrow(RangeError);
    expect(() => rappen(0.1 + 0.2)).toThrow(RangeError);
  });

  it('weist NaN und Infinity ab', () => {
    expect(() => rappen(Number.NaN)).toThrow(RangeError);
    expect(() => rappen(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => rappen(Number.NEGATIVE_INFINITY)).toThrow(RangeError);
  });

  it('weist Betraege ausserhalb des sicheren Bereichs ab', () => {
    expect(() => rappen(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(rappen(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe('istRappen', () => {
  it('unterscheidet ganzzahlige Betraege von allem anderen', () => {
    expect(istRappen(500)).toBe(true);
    expect(istRappen(-500)).toBe(true);
    expect(istRappen(5.5)).toBe(false);
    expect(istRappen('500')).toBe(false);
    expect(istRappen(null)).toBe(false);
    expect(istRappen(Number.NaN)).toBe(false);
  });
});

describe('Grundrechenarten', () => {
  it('addiert exakt, wo Floats scheitern', () => {
    // 0.10 + 0.20 in Franken = 30 Rappen. Exakt, ohne 0.30000000000000004.
    expect(addieren(rappen(10), rappen(20))).toBe(30);
  });

  it('subtrahiert und kann ins Negative laufen', () => {
    expect(subtrahieren(rappen(1000), rappen(2500))).toBe(-1500);
  });

  it('negiert und bildet den Absolutbetrag', () => {
    expect(negieren(rappen(1500))).toBe(-1500);
    expect(betrag(rappen(-1500))).toBe(1500);
    expect(betrag(rappen(1500))).toBe(1500);
  });

  it('wirft, wenn eine Addition den sicheren Bereich verlaesst', () => {
    expect(() => addieren(rappen(Number.MAX_SAFE_INTEGER), rappen(1))).toThrow(RangeError);
  });
});

describe('summe', () => {
  it('ist fuer die leere Liste null', () => {
    expect(summe([])).toBe(NULL_RAPPEN);
  });

  it('summiert viele Positionen ohne Drift', () => {
    // 100 x 0.01 CHF = 1.00 CHF. Als Float waere das 1.0000000000000007.
    const positionen = Array.from({ length: 100 }, () => rappen(1));
    expect(summe(positionen)).toBe(100);
  });

  it('summiert gemischte Vorzeichen', () => {
    expect(summe([rappen(2500), rappen(-1000), rappen(-1500)])).toBe(0);
  });
});

describe('vergleichen', () => {
  it('liefert -1, 0 und 1', () => {
    expect(vergleichen(rappen(1), rappen(2))).toBe(-1);
    expect(vergleichen(rappen(2), rappen(2))).toBe(0);
    expect(vergleichen(rappen(3), rappen(2))).toBe(1);
  });

  it('sortiert korrekt', () => {
    const werte = [rappen(300), rappen(-100), rappen(0)];
    expect([...werte].sort(vergleichen)).toEqual([-100, 0, 300]);
  });
});

describe('istNegativ', () => {
  it('erkennt Minusbetraege, null ist nicht negativ', () => {
    expect(istNegativ(rappen(-1))).toBe(true);
    expect(istNegativ(rappen(0))).toBe(false);
  });
});
