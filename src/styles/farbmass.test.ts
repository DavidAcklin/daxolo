import { describe, expect, it } from 'vitest';
import { deltaE2000, hexZuRgb, kontrast, relativeLeuchtdichte, zuLab, type Lab } from './farbmass';

/**
 * Testdaten zu CIEDE2000 von Sharma, Wu, Dalal (2005), unverändert übernommen:
 * https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/dataNprograms/ciede2000testdata.txt
 * Je Zeile: L1, a1, b1, L2, a2, b2, ΔE00 — vier Nachkommastellen.
 */
const SHARMA = [
  [50.0, 2.6772, -79.7751, 50.0, 0.0, -82.7485, 2.0425],
  [50.0, 3.1571, -77.2803, 50.0, 0.0, -82.7485, 2.8615],
  [50.0, 2.8361, -74.02, 50.0, 0.0, -82.7485, 3.4412],
  [50.0, -1.3802, -84.2814, 50.0, 0.0, -82.7485, 1.0],
  [50.0, -1.1848, -84.8006, 50.0, 0.0, -82.7485, 1.0],
  [50.0, -0.9009, -85.5211, 50.0, 0.0, -82.7485, 1.0],
  [50.0, 0.0, 0.0, 50.0, -1.0, 2.0, 2.3669],
  [50.0, -1.0, 2.0, 50.0, 0.0, 0.0, 2.3669],
  [50.0, 2.49, -0.001, 50.0, -2.49, 0.0009, 7.1792],
  [50.0, 2.49, -0.001, 50.0, -2.49, 0.001, 7.1792],
  [50.0, 2.49, -0.001, 50.0, -2.49, 0.0011, 7.2195],
  [50.0, 2.49, -0.001, 50.0, -2.49, 0.0012, 7.2195],
  [50.0, -0.001, 2.49, 50.0, 0.0009, -2.49, 4.8045],
  [50.0, -0.001, 2.49, 50.0, 0.001, -2.49, 4.8045],
  [50.0, -0.001, 2.49, 50.0, 0.0011, -2.49, 4.7461],
  [50.0, 2.5, 0.0, 50.0, 0.0, -2.5, 4.3065],
  [50.0, 2.5, 0.0, 73.0, 25.0, -18.0, 27.1492],
  [50.0, 2.5, 0.0, 61.0, -5.0, 29.0, 22.8977],
  [50.0, 2.5, 0.0, 56.0, -27.0, -3.0, 31.903],
  [50.0, 2.5, 0.0, 58.0, 24.0, 15.0, 19.4535],
  [50.0, 2.5, 0.0, 50.0, 3.1736, 0.5854, 1.0],
  [50.0, 2.5, 0.0, 50.0, 3.2972, 0.0, 1.0],
  [50.0, 2.5, 0.0, 50.0, 1.8634, 0.5757, 1.0],
  [50.0, 2.5, 0.0, 50.0, 3.2592, 0.335, 1.0],
  [60.2574, -34.0099, 36.2677, 60.4626, -34.1751, 39.4387, 1.2644],
  [63.0109, -31.0961, -5.8663, 62.8187, -29.7946, -4.0864, 1.263],
  [61.2901, 3.7196, -5.3901, 61.4292, 2.248, -4.962, 1.8731],
  [35.0831, -44.1164, 3.7933, 35.0232, -40.0716, 1.5901, 1.8645],
  [22.7233, 20.0904, -46.694, 23.0331, 14.973, -42.5619, 2.0373],
  [36.4612, 47.858, 18.3852, 36.2715, 50.5065, 21.2231, 1.4146],
  [90.8027, -2.0831, 1.441, 91.1528, -1.6435, 0.0447, 1.4441],
  [90.9257, -0.5406, -0.9208, 88.6381, -0.8985, -0.7239, 1.5381],
  [6.7747, -0.2908, -2.4247, 5.8714, -0.0985, -2.2286, 0.6377],
  [2.0776, 0.0795, -1.135, 0.9033, -0.0636, -0.5514, 0.9082],
] as const;

describe('deltaE2000 — Testdaten Sharma et al. 2005', () => {
  it('umfasst alle 34 Paare', () => {
    expect(SHARMA).toHaveLength(34);
  });

  it.each(SHARMA.map((zeile, i) => [i + 1, zeile] as const))('Paar %i', (_, zeile) => {
    const [l1, a1, b1, l2, a2, b2, soll] = zeile;
    const ist = deltaE2000([l1, a1, b1], [l2, a2, b2]);
    // Die Referenz ist auf vier Stellen gerundet.
    expect(Math.abs(ist - soll), `Ist ${ist.toFixed(4)}, Soll ${soll}`).toBeLessThan(0.00005);
  });

  it('ist symmetrisch und null für identische Farben', () => {
    const p: Lab = [50, 2.5, 0];
    const q: Lab = [73, 25, -18];
    expect(deltaE2000(p, q)).toBeCloseTo(deltaE2000(q, p), 12);
    expect(deltaE2000(p, p)).toBe(0);
  });
});

describe('Kontrast nach WCAG 2.2', () => {
  it('folgt den Gewichten der Definition für die Grundfarben', () => {
    expect(relativeLeuchtdichte('#ff0000')).toBeCloseTo(0.2126, 10);
    expect(relativeLeuchtdichte('#00ff00')).toBeCloseTo(0.7152, 10);
    expect(relativeLeuchtdichte('#0000ff')).toBeCloseTo(0.0722, 10);
  });

  it('reicht von 1:1 bis 21:1 und ist symmetrisch', () => {
    expect(kontrast('#ffffff', '#000000')).toBeCloseTo(21, 10);
    expect(kontrast('#000000', '#ffffff')).toBeCloseTo(21, 10);
    expect(kontrast('#7a7175', '#7a7175')).toBe(1);
  });
});

describe('sRGB nach L*a*b*', () => {
  it('bildet Weiss, Schwarz und Graustufen unbunt ab', () => {
    const [lw, aw, bw] = zuLab('#ffffff');
    expect(lw).toBeCloseTo(100, 2);
    expect(Math.abs(aw)).toBeLessThan(0.01);
    expect(Math.abs(bw)).toBeLessThan(0.01);
    expect(zuLab('#000000')[0]).toBeCloseTo(0, 10);
    for (const grau of ['#333333', '#777777', '#cccccc']) {
      const [, a, b] = zuLab(grau);
      expect(Math.abs(a), grau).toBeLessThan(0.01);
      expect(Math.abs(b), grau).toBeLessThan(0.01);
    }
  });

  it('steigt in L* mit der Helligkeit', () => {
    const l = ['#000000', '#333333', '#777777', '#cccccc', '#ffffff'].map((h) => zuLab(h)[0]);
    expect([...l].sort((x, y) => x - y)).toEqual(l);
  });
});

describe('Eingaben', () => {
  it('weist alles ausser #rrggbb ab', () => {
    for (const falsch of ['#fff', 'ffffff', '#gggggg', 'rgb(0,0,0)', '']) {
      expect(() => hexZuRgb(falsch), falsch).toThrow();
    }
    expect(hexZuRgb('#FFFFFF')).toEqual([1, 1, 1]);
  });
});
