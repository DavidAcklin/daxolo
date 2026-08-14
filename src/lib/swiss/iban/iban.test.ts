import { describe, expect, it } from 'vitest';
import {
  formatiereIban,
  istQrIid,
  normalisiereIban,
  pruefeIban,
  QR_IID_BIS,
  QR_IID_VON,
  type IbanFehlerCode,
} from './iban';

/**
 * Offizielle Testvektoren aus SIX, "Schweizer Implementation Guidelines
 * QR-Rechnung", Version 2.3 (20.11.2023), Beispielteil.
 */
const QR_IBAN_OFFIZIELL = 'CH4431999123000889012'; // IID 31999, obere Bereichsgrenze
const QR_IBAN_OFFIZIELL_2 = 'CH6431961000004421557'; // IID 31961
const IBAN_OFFIZIELL = 'CH5204835012345671000'; // IID 04835
const IBAN_OFFIZIELL_2 = 'CH5800791123000889012'; // IID 00791

/** Beispiel von der IBAN-Seite von SIX. */
const SIX_BEISPIEL = 'CH9300762011623852957';

/**
 * Grenzfaelle rund um den QR-IID-Bereich. Es gibt dafuer keine veroeffentlichten
 * Vektoren, deshalb sind die Pruefziffern unabhaengig nachgerechnet (Modulo
 * 97-10 ausserhalb dieses Codes) — CH4431999123000889012 aus dieser Reihe deckt
 * sich mit dem offiziellen Beispiel oben und belegt die Rechnung.
 */
const IID_29999 = 'CH4929999123000889012';
const IID_30000 = 'CH5730000123000889012';
const IID_32000 = 'CH5232000123000889012';
const LI_QR_IBAN = 'LI7030000123000889012';
const LI_IBAN = 'LI21088100002324013AA';

function code(eingabe: string): IbanFehlerCode {
  const ergebnis = pruefeIban(eingabe);
  if (ergebnis.ok) throw new Error(`Erwartet: Fehler. Erhalten: ${ergebnis.iban}`);
  return ergebnis.code;
}

function treffer(eingabe: string) {
  const ergebnis = pruefeIban(eingabe);
  if (!ergebnis.ok) {
    throw new Error(`Erwartet: gueltig. Erhalten: ${ergebnis.code} — ${ergebnis.nachricht}`);
  }
  return ergebnis;
}

describe('normalisiereIban', () => {
  it('entfernt Leerzeichen und macht Grossbuchstaben', () => {
    expect(normalisiereIban('ch93 0076 2011 6238 5295 7')).toBe(SIX_BEISPIEL);
  });

  it('entfernt auch geschuetzte und schmale Leerzeichen', () => {
    expect(normalisiereIban('CH93 0076 2011 6238 5295 7')).toBe(SIX_BEISPIEL);
  });

  it('laesst alles andere unangetastet', () => {
    expect(normalisiereIban('CH93-0076')).toBe('CH93-0076');
  });
});

describe('formatiereIban', () => {
  it('setzt Vierergruppen', () => {
    expect(formatiereIban(SIX_BEISPIEL)).toBe('CH93 0076 2011 6238 5295 7');
  });

  it('formatiert bereits formatierte und klein geschriebene Eingaben gleich', () => {
    expect(formatiereIban('ch93 0076 2011 6238 5295 7')).toBe('CH93 0076 2011 6238 5295 7');
  });

  it('kommt mit leerer Eingabe zurecht, statt zu werfen', () => {
    expect(formatiereIban('')).toBe('');
    expect(formatiereIban('   ')).toBe('');
  });
});

describe('istQrIid', () => {
  it('erkennt den Bereich 30000 bis 31999 einschliesslich', () => {
    expect(QR_IID_VON).toBe(30000);
    expect(QR_IID_BIS).toBe(31999);
    expect(istQrIid('30000')).toBe(true);
    expect(istQrIid('31999')).toBe(true);
    expect(istQrIid('31961')).toBe(true);
  });

  it('schliesst die Nachbarn aus', () => {
    expect(istQrIid('29999')).toBe(false);
    expect(istQrIid('32000')).toBe(false);
    expect(istQrIid('00791')).toBe(false);
  });

  it('weist alles ab, was keine fuenfstellige Zahl ist', () => {
    expect(istQrIid('3000')).toBe(false);
    expect(istQrIid('300000')).toBe(false);
    expect(istQrIid('3000A')).toBe(false);
    expect(istQrIid('')).toBe(false);
  });
});

describe('pruefeIban — offizielle Testvektoren', () => {
  it('nimmt die IBAN der Beispielrechnungen an', () => {
    for (const iban of [IBAN_OFFIZIELL, IBAN_OFFIZIELL_2, SIX_BEISPIEL]) {
      const ergebnis = treffer(iban);
      expect(ergebnis.land).toBe('CH');
      expect(ergebnis.istQrIban).toBe(false);
    }
  });

  it('erkennt die QR-IBAN der Beispielrechnungen', () => {
    for (const iban of [QR_IBAN_OFFIZIELL, QR_IBAN_OFFIZIELL_2]) {
      expect(treffer(iban).istQrIban).toBe(true);
    }
  });

  it('zerlegt die IBAN in IID und Kontonummer', () => {
    const ergebnis = treffer(QR_IBAN_OFFIZIELL);
    expect(ergebnis.iban).toBe(QR_IBAN_OFFIZIELL);
    expect(ergebnis.formatiert).toBe('CH44 3199 9123 0008 8901 2');
    expect(ergebnis.iid).toBe('31999');
    expect(ergebnis.kontonummer).toBe('123000889012');
    expect(ergebnis.kontonummer).toHaveLength(12);
  });

  it('liest die IBAN auch mit Leerzeichen und klein geschrieben', () => {
    expect(treffer('ch44 3199 9123 0008 8901 2').iban).toBe(QR_IBAN_OFFIZIELL);
  });
});

describe('pruefeIban — Landeserkennung', () => {
  it('nimmt Liechtenstein an', () => {
    const ergebnis = treffer(LI_IBAN);
    expect(ergebnis.land).toBe('LI');
    expect(ergebnis.istQrIban).toBe(false);
  });

  it('erkennt eine liechtensteinische QR-IBAN', () => {
    expect(treffer(LI_QR_IBAN).istQrIban).toBe(true);
  });

  it('weist andere Laender als unbekannt ab', () => {
    // Formal gueltige deutsche IBAN — hier trotzdem ausserhalb des Auftrags.
    expect(code('DE89370400440532013000')).toBe('unbekanntes-land');
  });

  it('sagt bei unbekanntem Land, welche Laender gelten', () => {
    const ergebnis = pruefeIban('DE89370400440532013000');
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.nachricht).toContain('CH');
      expect(ergebnis.nachricht).toContain('LI');
    }
  });

  it('weist einen Landescode aus Ziffern ab', () => {
    expect(code('9300762011623852957CH')).toBe('unbekanntes-land');
  });
});

describe('pruefeIban — QR-IBAN-Grenzen', () => {
  it('ist bei 30000 und 31999 eine QR-IBAN', () => {
    expect(treffer(IID_30000).istQrIban).toBe(true);
    expect(treffer(QR_IBAN_OFFIZIELL).istQrIban).toBe(true);
  });

  it('ist bei 29999 und 32000 keine QR-IBAN', () => {
    expect(treffer(IID_29999).istQrIban).toBe(false);
    expect(treffer(IID_32000).istQrIban).toBe(false);
  });
});

describe('pruefeIban — Fehlerfaelle', () => {
  it('meldet eine leere Eingabe', () => {
    expect(code('')).toBe('leer');
    expect(code('   ')).toBe('leer');
  });

  it('meldet ungueltige Zeichen mit Stelle', () => {
    const ergebnis = pruefeIban('CH93-0762011623852957');
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.code).toBe('ungueltiges-zeichen');
      expect(ergebnis.stelle).toBe(5);
      expect(ergebnis.nachricht).toContain('Stelle 5');
    }
  });

  it('meldet eine falsche Laenge mit Soll, Ist und Abweichung', () => {
    const zuKurz = pruefeIban('CH930076201162385295');
    expect(zuKurz.ok).toBe(false);
    if (!zuKurz.ok) {
      expect(zuKurz.code).toBe('falsche-laenge');
      expect(zuKurz.nachricht).toContain('21');
      expect(zuKurz.nachricht).toContain('20');
      expect(zuKurz.nachricht).toContain('zu wenig');
    }

    const zuLang = pruefeIban(`${SIX_BEISPIEL}0`);
    expect(zuLang.ok).toBe(false);
    if (!zuLang.ok) {
      expect(zuLang.code).toBe('falsche-laenge');
      expect(zuLang.nachricht).toContain('zu viel');
    }
  });

  it('meldet Buchstaben in der Pruefziffer', () => {
    const ergebnis = pruefeIban('CHAB00762011623852957');
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.code).toBe('ungueltiges-zeichen');
      expect(ergebnis.stelle).toBe(3);
    }
  });

  it('meldet Buchstaben in der Bankleitzahl', () => {
    const ergebnis = pruefeIban('CH930A762011623852957');
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.code).toBe('ungueltiges-zeichen');
      expect(ergebnis.stelle).toBe(5);
      expect(ergebnis.nachricht).toContain('IID');
    }
  });
});

describe('pruefeIban — falsche Pruefziffer', () => {
  it('erkennt eine einzelne verdrehte Ziffer', () => {
    // 6238 -> 6328 in der Kontonummer.
    expect(code('CH9300762011632852957')).toBe('pruefziffer-falsch');
  });

  it('erkennt eine falsche Pruefziffer', () => {
    expect(code('CH9400762011623852957')).toBe('pruefziffer-falsch');
  });

  it('sagt, dass die IBAN vertippt ist — nicht nur "ungueltig"', () => {
    const ergebnis = pruefeIban('CH9400762011623852957');
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.nachricht).toContain('vertippt');
      expect(ergebnis.nachricht).not.toMatch(/^ungültig/i);
      expect(ergebnis.stelle).toBe(3);
    }
  });

  it('nennt die Pruefziffer, die zum Rest passen wuerde', () => {
    const ergebnis = pruefeIban('CH9400762011623852957');
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) expect(ergebnis.nachricht).toContain('"93"');
  });
});

describe('pruefeIban — wirft nie', () => {
  const kaputt = [
    '',
    ' ',
    'C',
    'CH',
    'CH9',
    ' ',
    'CH93 ',
    '💥',
    'CH93007620116238529577777777777777',
    'ÄÖÜ93007620116238529',
    'null',
    'undefined',
  ];

  it.each(kaputt)('liefert fuer %o ein Ergebnisobjekt', (eingabe) => {
    const ergebnis = pruefeIban(eingabe);
    expect(typeof ergebnis.ok).toBe('boolean');
    if (!ergebnis.ok) {
      expect(ergebnis.nachricht.length).toBeGreaterThan(10);
      expect(ergebnis.code).toBeTruthy();
    }
  });
});
