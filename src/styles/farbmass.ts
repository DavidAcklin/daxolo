/**
 * Farbmessung für die Design-Tokens (CLAUDE.md 6).
 *
 * Zwei Messungen, zwei Fragen:
 * - Kontrast nach WCAG: Ist Vordergrund auf Hintergrund lesbar bzw. erkennbar?
 * - Farbabstand ΔE00 nach CIEDE2000: Sind zwei Flächen auf den ersten Blick
 *   voneinander zu unterscheiden?
 *
 * Quellen:
 * - WCAG 2.2, Definitionen "relative luminance" und "contrast ratio",
 *   https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 * - G. Sharma, W. Wu, E. N. Dalal: The CIEDE2000 Color-Difference Formula —
 *   Implementation Notes, Supplementary Test Data, and Mathematical
 *   Observations. Color Research and Application 30 (1), 2005.
 *   Testdaten: https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/
 *
 * Reine Funktionen, kein DOM. Farben kommen als `#rrggbb`.
 */

export type Lab = readonly [l: number, a: number, b: number];

const HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

/** sRGB-Kanäle 0..1 aus `#rrggbb`. Alles andere ist ein Fehler, keine Schätzung. */
export function hexZuRgb(hex: string): [number, number, number] {
  const treffer = HEX.exec(hex.trim());
  if (treffer === null) throw new Error(`Keine Farbe im Format #rrggbb: "${hex}"`);
  return [treffer[1], treffer[2], treffer[3]].map((kanal) => parseInt(kanal ?? '', 16) / 255) as [
    number,
    number,
    number,
  ];
}

/** sRGB-Kanal in linearen Wert (WCAG 2.2, Schwelle 0.04045). */
const linear = (kanal: number): number =>
  kanal <= 0.04045 ? kanal / 12.92 : ((kanal + 0.055) / 1.055) ** 2.4;

/** Relative Leuchtdichte nach WCAG 2.2. */
export function relativeLeuchtdichte(hex: string): number {
  const [r, g, b] = hexZuRgb(hex).map(linear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Kontrastverhältnis nach WCAG 2.2, von 1 bis 21. Reihenfolge egal. */
export function kontrast(a: string, b: string): number {
  const [hell, dunkel] = [relativeLeuchtdichte(a), relativeLeuchtdichte(b)].sort((x, y) => y - x);
  return ((hell ?? 0) + 0.05) / ((dunkel ?? 0) + 0.05);
}

/**
 * sRGB → CIE XYZ (D65) → CIE L*a*b* mit Weisspunkt D65.
 *
 * Die Matrix mit sieben Stellen: Ihre Zeilensummen ergeben genau den Weisspunkt
 * (0.95047, 1, 1.08883). Mit vier Stellen bekäme Weiss ein falsches b* ≠ 0.
 */
export function zuLab(hex: string): Lab {
  const [r, g, b] = hexZuRgb(hex).map(linear) as [number, number, number];
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const GRAD = Math.PI / 180;

/** Farbtonwinkel in Grad, 0..360. Unbunte Farben haben den Winkel 0. */
const farbton = (b: number, a: number): number =>
  a === 0 && b === 0 ? 0 : (Math.atan2(b, a) / GRAD + 360) % 360;

/** Farbabstand ΔE00 nach CIEDE2000 (kL = kC = kH = 1), Formeln nach Sharma et al. 2005. */
export function deltaE2000(lab1: Lab, lab2: Lab): number {
  const [l1, a1, b1] = lab1;
  const [l2, a2, b2] = lab2;

  const cMittel = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const g = 0.5 * (1 - Math.sqrt(cMittel ** 7 / (cMittel ** 7 + 25 ** 7)));
  const a1s = (1 + g) * a1;
  const a2s = (1 + g) * a2;
  const c1s = Math.hypot(a1s, b1);
  const c2s = Math.hypot(a2s, b2);
  const h1s = farbton(b1, a1s);
  const h2s = farbton(b2, a2s);

  const dL = l2 - l1;
  const dC = c2s - c1s;
  let dh = 0;
  if (c1s * c2s !== 0) {
    dh = h2s - h1s;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(c1s * c2s) * Math.sin((dh / 2) * GRAD);

  const lMittel = (l1 + l2) / 2;
  const cMittelS = (c1s + c2s) / 2;
  let hMittel = h1s + h2s;
  if (c1s * c2s !== 0) {
    if (Math.abs(h1s - h2s) > 180) hMittel += h1s + h2s < 360 ? 360 : -360;
    hMittel /= 2;
  }

  const t =
    1 -
    0.17 * Math.cos((hMittel - 30) * GRAD) +
    0.24 * Math.cos(2 * hMittel * GRAD) +
    0.32 * Math.cos((3 * hMittel + 6) * GRAD) -
    0.2 * Math.cos((4 * hMittel - 63) * GRAD);
  const dTheta = 30 * Math.exp(-(((hMittel - 275) / 25) ** 2));
  const rC = 2 * Math.sqrt(cMittelS ** 7 / (cMittelS ** 7 + 25 ** 7));
  const sL = 1 + (0.015 * (lMittel - 50) ** 2) / Math.sqrt(20 + (lMittel - 50) ** 2);
  const sC = 1 + 0.045 * cMittelS;
  const sH = 1 + 0.015 * cMittelS * t;
  const rT = -Math.sin(2 * dTheta * GRAD) * rC;

  return Math.sqrt((dL / sL) ** 2 + (dC / sC) ** 2 + (dH / sH) ** 2 + rT * (dC / sC) * (dH / sH));
}

/** ΔE00 zwischen zwei sRGB-Farben. */
export const farbabstand = (a: string, b: string): number => deltaE2000(zuLab(a), zuLab(b));
