import { describe, expect, it } from 'vitest';
import { gueltigAm, istIsoDatum, verlangeGueltigAm } from './gueltigkeit';
import type { Fachdatensatz } from './typen';

// Erfundene Beispieldaten, absichtlich ohne Bezug zu echten Saetzen:
// hier wird die Auswahlmechanik geprueft, nicht Schweizer Fachrecht.
interface Beispielsatz extends Fachdatensatz {
  wert: number;
}

const quelle = { stelle: 'Beispielstelle', url: 'https://example.org/publikation' };

const alt: Beispielsatz = {
  wert: 1,
  gueltig_ab: '2020-01-01',
  gueltig_bis: '2023-12-31',
  quelle,
  geprueft_am: '2026-08-14',
};

const aktuell: Beispielsatz = {
  wert: 2,
  gueltig_ab: '2024-01-01',
  quelle,
  geprueft_am: '2026-08-14',
};

const befristet: Beispielsatz = {
  wert: 3,
  gueltig_ab: '2024-01-01',
  gueltig_bis: '2027-12-31',
  quelle,
  geprueft_am: '2026-08-14',
};

describe('istIsoDatum', () => {
  it('nimmt echte Kalendertage an', () => {
    expect(istIsoDatum('2026-08-14')).toBe(true);
    expect(istIsoDatum('2024-02-29')).toBe(true);
  });

  it('weist falsche Form und nicht existierende Tage ab', () => {
    expect(istIsoDatum('14.08.2026')).toBe(false);
    expect(istIsoDatum('2026-8-14')).toBe(false);
    expect(istIsoDatum('2026-02-31')).toBe(false);
    expect(istIsoDatum('2025-02-29')).toBe(false);
  });
});

describe('gueltigAm', () => {
  it('waehlt den Satz des Stichdatums', () => {
    expect(gueltigAm([alt, aktuell], '2022-06-01')).toBe(alt);
    expect(gueltigAm([alt, aktuell], '2026-08-14')).toBe(aktuell);
  });

  it('rechnet die Grenztage einschliesslich', () => {
    expect(gueltigAm([alt], '2020-01-01')).toBe(alt);
    expect(gueltigAm([alt], '2023-12-31')).toBe(alt);
    expect(gueltigAm([alt], '2019-12-31')).toBeUndefined();
    expect(gueltigAm([alt], '2024-01-01')).toBeUndefined();
  });

  it('behandelt fehlendes gueltig_bis als offen', () => {
    expect(gueltigAm([aktuell], '2099-01-01')).toBe(aktuell);
  });

  it('faellt nicht auf einen Nachbarsatz zurueck, wenn die Luecke echt ist', () => {
    const luecke: Beispielsatz[] = [alt, { ...aktuell, gueltig_ab: '2025-01-01' }];
    expect(gueltigAm(luecke, '2024-06-01')).toBeUndefined();
  });

  it('nimmt bei Ueberlappung den spaeter beginnenden Satz', () => {
    const spaeter: Beispielsatz = { ...befristet, wert: 4, gueltig_ab: '2026-01-01' };
    expect(gueltigAm([befristet, spaeter], '2026-08-14')).toBe(spaeter);
  });

  it('ist unabhaengig von der Reihenfolge der Datensaetze', () => {
    expect(gueltigAm([aktuell, alt], '2022-06-01')).toBe(alt);
  });

  it('weist ein unbrauchbares Stichdatum ab', () => {
    expect(() => gueltigAm([aktuell], '14.08.2026')).toThrow(RangeError);
  });

  it('weist unbrauchbare Daten im Datensatz ab', () => {
    const kaputt: Beispielsatz = { ...aktuell, gueltig_ab: '2024-13-01' };
    expect(() => gueltigAm([kaputt], '2026-08-14')).toThrow(RangeError);
  });

  it('ist fuer eine leere Liste undefined', () => {
    expect(gueltigAm<Beispielsatz>([], '2026-08-14')).toBeUndefined();
  });
});

describe('verlangeGueltigAm', () => {
  it('liefert den Treffer', () => {
    expect(verlangeGueltigAm([aktuell], '2026-08-14', 'Beispielsatz')).toBe(aktuell);
  });

  it('wirft mit Bezeichnung und Stichdatum, statt zu raten', () => {
    expect(() => verlangeGueltigAm([alt], '2026-08-14', 'Beispielsatz')).toThrow(
      /Beispielsatz.*2026-08-14/s,
    );
  });
});
