import { describe, expect, it } from 'vitest';
import { parseBetrag, type ParseFehlerCode } from './parseBetrag';

/** Hilfen, damit die Tests die Erwartung zeigen und nicht die Typwache. */
function wert(eingabe: string): number {
  const ergebnis = parseBetrag(eingabe);
  if (!ergebnis.ok) {
    throw new Error(`Erwartet: gueltig. Erhalten: ${ergebnis.code} — ${ergebnis.nachricht}`);
  }
  return ergebnis.wert;
}

function code(eingabe: string): ParseFehlerCode {
  const ergebnis = parseBetrag(eingabe);
  if (ergebnis.ok) {
    throw new Error(`Erwartet: Fehler. Erhalten: ${ergebnis.wert} Rappen`);
  }
  return ergebnis.code;
}

describe('parseBetrag — die Formate aus CLAUDE.md 2.2', () => {
  it("liest 1'000.50", () => {
    expect(wert("1'000.50")).toBe(100050);
  });

  it('liest 1000,50', () => {
    expect(wert('1000,50')).toBe(100050);
  });

  it('liest 1000.50', () => {
    expect(wert('1000.50')).toBe(100050);
  });

  it('liest 1 000.50', () => {
    expect(wert('1 000.50')).toBe(100050);
  });

  it('ignoriert Leerzeichen aussen', () => {
    expect(wert('   1000.50   ')).toBe(100050);
    expect(wert('\t1000,50\n')).toBe(100050);
  });
});

describe('parseBetrag — Schweizer Formatierung aus Intl', () => {
  it('liest, was Intl fuer de-CH ausgibt (Apostroph U+2019)', () => {
    const formatiert = new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2 }).format(
      1234567.5,
    );
    expect(wert(formatiert)).toBe(123456750);
  });

  it('liest, was Intl fuer fr-CH ausgibt (schmales Leerzeichen, Komma)', () => {
    const formatiert = new Intl.NumberFormat('fr-CH', { minimumFractionDigits: 2 }).format(
      1234567.5,
    );
    expect(wert(formatiert)).toBe(123456750);
  });

  it('liest geschuetzte und schmale Leerzeichen als Tausendertrennzeichen', () => {
    expect(wert('1 000.50')).toBe(100050);
    expect(wert('1 000,50')).toBe(100050);
    expect(wert('1 000.50')).toBe(100050);
  });

  it('liest alle gebraeuchlichen Apostroph-Varianten', () => {
    expect(wert("1'000.50")).toBe(100050);
    expect(wert('1’000.50')).toBe(100050);
    expect(wert('1‘000.50')).toBe(100050);
    expect(wert('1ʼ000.50')).toBe(100050);
  });
});

describe('parseBetrag — gueltige Randfaelle', () => {
  it('nimmt Betraege ohne Nachkommastellen', () => {
    expect(wert('1000')).toBe(100000);
    expect(wert("1'000'000")).toBe(100000000);
  });

  it('fuellt eine einzelne Nachkommastelle auf Rappen auf', () => {
    expect(wert('10.5')).toBe(1050);
  });

  it('nimmt Betraege ohne Vorkommastelle', () => {
    expect(wert('.50')).toBe(50);
    expect(wert(',05')).toBe(5);
  });

  it('nimmt null und beide Vorzeichen', () => {
    expect(wert('0')).toBe(0);
    expect(wert('0.00')).toBe(0);
    expect(wert('+1000.50')).toBe(100050);
    expect(wert('-1000.50')).toBe(-100050);
    expect(wert("-1'234'567.89")).toBe(-123456789);
  });

  it('liefert fuer -0.00 die echte Null, kein negatives Null', () => {
    expect(Object.is(wert('-0.00'), 0)).toBe(true);
  });

  it('nimmt den groessten sicher darstellbaren Betrag', () => {
    expect(wert('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe('parseBetrag — klassische Fallstricke', () => {
  it('rundet 0.005 nicht still, sondern meldet einen Fehler', () => {
    expect(code('0.005')).toBe('zu-viele-nachkommastellen');
  });

  it('rundet 1.005 nicht still, sondern meldet einen Fehler', () => {
    expect(code('1.005')).toBe('zu-viele-nachkommastellen');
  });

  it('nennt in der Meldung die auf Rappen gekuerzte Form', () => {
    const ergebnis = parseBetrag('1.005');
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) expect(ergebnis.nachricht).toContain('1.00');
  });

  it('weist 1.000 ab, statt es als tausend oder eins zu raten', () => {
    expect(code('1.000')).toBe('zu-viele-nachkommastellen');
  });

  it('weist 1,000.50 ab — Komma ist kein Tausendertrennzeichen', () => {
    expect(code('1,000.50')).toBe('mehrere-dezimaltrenner');
  });

  it('weist Betraege ausserhalb des sicheren Bereichs ab', () => {
    expect(code('90071992547409.92')).toBe('zu-gross');
    expect(code('999999999999999999')).toBe('zu-gross');
  });
});

describe('parseBetrag — ungueltige Eingaben werden nie still zu 0 oder NaN', () => {
  it.each([
    ['', 'leer'],
    ['   ', 'leer'],
    ['abc', 'unerlaubte-zeichen'],
    ['CHF 1000', 'unerlaubte-zeichen'],
    ['1000 CHF', 'unerlaubte-zeichen'],
    ['1e3', 'unerlaubte-zeichen'],
    ['1000.', 'unvollstaendig'],
    ['-', 'unerlaubte-zeichen'],
    ['1.2.3', 'mehrere-dezimaltrenner'],
    ["1'00'0", 'ungueltige-gruppierung'],
    ["1'0000", 'ungueltige-gruppierung'],
    ["'000", 'ungueltige-gruppierung'],
  ])('meldet fuer %o den Code %s', (eingabe, erwartet) => {
    expect(code(eingabe)).toBe(erwartet);
  });

  it('liefert nie NaN, sondern immer ein Ergebnisobjekt', () => {
    const ergebnis = parseBetrag('völlig kaputt');
    expect(ergebnis.ok).toBe(false);
    expect(Number.isNaN((ergebnis as { wert?: number }).wert)).toBe(false);
  });

  it('gibt zu jedem Fehler eine Meldung, die weiterhilft', () => {
    for (const eingabe of ['', 'abc', '1.005', "1'00'0", '1,000.50']) {
      const ergebnis = parseBetrag(eingabe);
      expect(ergebnis.ok).toBe(false);
      if (!ergebnis.ok) expect(ergebnis.nachricht.length).toBeGreaterThan(20);
    }
  });
});
