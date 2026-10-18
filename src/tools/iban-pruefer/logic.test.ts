import { describe, expect, it } from 'vitest';
import { BEISPIEL_IBAN, befund } from './logic';
import { formatiere, texte } from './texte';
import { locales } from '../../i18n/ui';

describe('befund — leere Eingabe', () => {
  it('zeigt nichts an, statt einen Fehler zu behaupten', () => {
    expect(befund('')).toBeUndefined();
    expect(befund('   ')).toBeUndefined();
  });
});

describe('befund — vollstaendig geprueft', () => {
  it('meldet Erfolg und liefert die Zeilen der Tabelle', () => {
    const ergebnis = befund(BEISPIEL_IBAN);
    expect(ergebnis?.status).toBe('erfolg');
    expect(ergebnis?.titel).toBe('treffer.vollstaendig');
    expect(ergebnis?.zeilen.map((zeile) => zeile.schluessel)).toEqual([
      'zeile.iban',
      'zeile.land',
      'zeile.iid',
      'zeile.konto',
      'zeile.art',
    ]);
    expect(ergebnis?.kopierwert).toBe('CH93 0076 2011 6238 5295 7');
  });

  it('sagt bei einer QR-IBAN, dass sie eine QR-Referenz verlangt', () => {
    const ergebnis = befund('CH4431999123000889012');
    expect(ergebnis?.texte).toContain('treffer.qr');
    expect(ergebnis?.zeilen.at(-1)?.wert).toBe('zeile.qr-iban');
  });

  it('sagt bei gewoehnlicher IBAN, dass eine QR-Referenz nicht zulaessig ist', () => {
    const ergebnis = befund('CH5204835012345671000');
    expect(ergebnis?.texte).toContain('treffer.normal');
  });

  it('weist bei jedem Treffer darauf hin, dass das Konto existieren kann oder nicht', () => {
    expect(befund(BEISPIEL_IBAN)?.texte).toContain('treffer.kein-konto');
    expect(befund('DE89370400440532013000')?.texte).toContain('treffer.kein-konto');
  });
});

describe('befund — nur Pruefziffer geprueft', () => {
  it('meldet eine Warnung, keinen Erfolg und keinen Fehler', () => {
    const ergebnis = befund('DE89370400440532013000');
    expect(ergebnis?.status).toBe('warnung');
    expect(ergebnis?.titel).toBe('treffer.nur-pruefziffer');
    expect(ergebnis?.texte).toContain('treffer.ungeprueft');
    expect(ergebnis?.werte['land']).toBe('DE');
  });

  it('zeigt keine Bankleitzahl, die es nicht belegen kann', () => {
    const zeilen = befund('DE89370400440532013000')?.zeilen ?? [];
    expect(zeilen.map((zeile) => zeile.schluessel)).not.toContain('zeile.iid');
  });
});

describe('befund — Fehler', () => {
  it('nennt bei falscher Pruefziffer die passende Ziffer', () => {
    const ergebnis = befund('CH9400762011623852957');
    expect(ergebnis?.status).toBe('fehler');
    expect(ergebnis?.titel).toBe('fehler.pruefziffer-falsch');
    expect(ergebnis?.texte).toContain('fehler.pruefziffer-hinweis');
    expect(ergebnis?.werte['passend']).toBe('93');
  });

  it('nennt bei falscher Laenge Soll und Ist', () => {
    const ergebnis = befund('CH930076201162385295');
    expect(ergebnis?.titel).toBe('fehler.falsche-laenge');
    expect(ergebnis?.werte).toMatchObject({ land: 'CH', ist: '20', soll: '21' });
  });

  it('faellt bei unbekanntem Land auf "zu kurz" zurueck, wenn die Laenge nicht reicht', () => {
    const ergebnis = befund('XX12');
    expect(ergebnis?.titel).toBe('fehler.zu-kurz');
    expect(ergebnis?.werte['ist']).toBe('4');
  });

  it('nennt bei ungueltigem Zeichen die Stelle', () => {
    const ergebnis = befund('CH93-0762011623852957');
    expect(ergebnis?.titel).toBe('fehler.ungueltiges-zeichen');
    expect(ergebnis?.werte['stelle']).toBe('5');
  });
});

describe('befund — Ort der Aussage', () => {
  it('stellt jedes Urteil in den Ergebnisbereich, gueltig wie ungueltig', () => {
    expect(befund(BEISPIEL_IBAN)?.ort).toBe('ergebnis');
    expect(befund('DE89370400440532013000')?.ort).toBe('ergebnis');
    expect(befund('CH9400762011623852957')?.ort).toBe('ergebnis');
  });

  it('stellt Formfehler ans Feld, weil es noch nichts zu urteilen gibt', () => {
    for (const eingabe of ['CH930076201162385295', 'XX12', 'CH93-0762011623852957', '12345']) {
      const ergebnis = befund(eingabe);
      expect(ergebnis?.status, eingabe).toBe('fehler');
      expect(ergebnis?.ort, eingabe).toBe('feld');
    }
  });

  it('haengt an Formfehler weder Tabelle noch Erlaeuterung', () => {
    const ergebnis = befund('CH930076201162385295');
    expect(ergebnis?.zeilen).toEqual([]);
    expect(ergebnis?.texte).toEqual([]);
    expect(ergebnis?.kopierwert).toBeUndefined();
  });
});

describe('Texte', () => {
  it('sind in allen Sprachen vollstaendig', () => {
    const schluessel = Object.keys(texte.de).sort();
    for (const locale of locales) {
      expect(Object.keys(texte[locale]).sort()).toEqual(schluessel);
    }
  });

  it('haben in jeder Sprache einen Text zu jedem Schluessel, den die Logik liefert', () => {
    const eingaben = ['', BEISPIEL_IBAN, 'DE89370400440532013000', 'CH9400762011623852957', 'XX12'];
    for (const locale of locales) {
      for (const eingabe of eingaben) {
        const ergebnis = befund(eingabe);
        if (ergebnis === undefined) continue;
        for (const schluessel of [ergebnis.titel, ...ergebnis.texte]) {
          expect(texte[locale][schluessel]).toBeTruthy();
        }
      }
    }
  });

  it('ersetzt Platzhalter und laesst unbekannte stehen', () => {
    expect(formatiere('Eine {land}-IBAN hat {soll} Stellen.', { land: 'CH', soll: '21' })).toBe(
      'Eine CH-IBAN hat 21 Stellen.',
    );
    expect(formatiere('Stelle {stelle}', {})).toBe('Stelle {stelle}');
  });

  it('laesst nach dem Einsetzen keine Platzhalter offen', () => {
    for (const locale of locales) {
      for (const eingabe of ['DE89370400440532013000', 'CH9400762011623852957', 'XX12']) {
        const ergebnis = befund(eingabe);
        if (ergebnis === undefined) continue;
        for (const schluessel of [ergebnis.titel, ...ergebnis.texte]) {
          const text = formatiere(texte[locale][schluessel], ergebnis.werte);
          expect(text).not.toMatch(/\{\w+\}/);
        }
      }
    }
  });
});
