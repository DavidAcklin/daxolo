import { describe, expect, it } from 'vitest';
import { segmente, umbruchfreiHtml, UMBRUCHFREI } from './umbruch';

describe.each(UMBRUCHFREI.map((begriff) => [begriff]))('segmente — %s', (begriff) => {
  it('zeichnet den Begriff als umbruchfrei aus', () => {
    expect(segmente(`Eine ${begriff} ist hier gemeint.`)).toEqual([
      { text: 'Eine ', umbruchfrei: false },
      { text: begriff, umbruchfrei: true },
      { text: ' ist hier gemeint.', umbruchfrei: false },
    ]);
  });

  it('findet den Begriff mehrfach und am Rand', () => {
    expect(segmente(`${begriff} und ${begriff}`)).toEqual([
      { text: begriff, umbruchfrei: true },
      { text: ' und ', umbruchfrei: false },
      { text: begriff, umbruchfrei: true },
    ]);
  });

  it('setzt den Text verlustfrei wieder zusammen', () => {
    const text = `Vorher ${begriff}, dazwischen ${begriff}s, danach.`;
    expect(
      segmente(text)
        .map((s) => s.text)
        .join(''),
    ).toBe(text);
  });
});

describe('segmente', () => {
  it('lässt Texte ohne Begriff unverändert', () => {
    expect(segmente('Prüfziffer stimmt.')).toEqual([
      { text: 'Prüfziffer stimmt.', umbruchfrei: false },
    ]);
    expect(segmente('')).toEqual([]);
  });

  it('trennt verschiedene Begriffe im selben Satz', () => {
    expect(segmente('Eine QR-IBAN verlangt eine QR-Referenz.')).toEqual([
      { text: 'Eine ', umbruchfrei: false },
      { text: 'QR-IBAN', umbruchfrei: true },
      { text: ' verlangt eine ', umbruchfrei: false },
      { text: 'QR-Referenz', umbruchfrei: true },
      { text: '.', umbruchfrei: false },
    ]);
  });

  it('behält bei gebeugten Formen den Begriff zusammen', () => {
    expect(segmente('Rechnungen: QR-Rechnungen')).toEqual([
      { text: 'Rechnungen: ', umbruchfrei: false },
      { text: 'QR-Rechnung', umbruchfrei: true },
      { text: 'en', umbruchfrei: false },
    ]);
  });
});

describe('umbruchfreiHtml', () => {
  it('setzt Begriffe im Text in einen umbruchfreien Span', () => {
    expect(umbruchfreiHtml('<p>Eine QR-IBAN verlangt eine QR-Referenz.</p>')).toBe(
      '<p>Eine <span class="umbruchfrei">QR-IBAN</span> verlangt eine ' +
        '<span class="umbruchfrei">QR-Referenz</span>.</p>',
    );
  });

  it('erreicht verschachtelte Elemente, lässt Tags und Attribute unberührt', () => {
    expect(umbruchfreiHtml('<h3 id="qr-iid">Die <strong>QR-IID</strong></h3>')).toBe(
      '<h3 id="qr-iid">Die <strong><span class="umbruchfrei">QR-IID</span></strong></h3>',
    );
    expect(umbruchfreiHtml('<abbr title="QR-IBAN">QR-IBAN</abbr>')).toBe(
      '<abbr title="QR-IBAN"><span class="umbruchfrei">QR-IBAN</span></abbr>',
    );
  });

  it('lässt Code aus', () => {
    const html = '<p><code>QR-IBAN</code> und <pre>QR-IID</pre> QR-Rechnung</p>';
    expect(umbruchfreiHtml(html)).toBe(
      '<p><code>QR-IBAN</code> und <pre>QR-IID</pre> ' +
        '<span class="umbruchfrei">QR-Rechnung</span></p>',
    );
  });

  it('ist idempotent', () => {
    const einmal = umbruchfreiHtml('<p>QR-IBAN und QR-Referenz</p>');
    expect(umbruchfreiHtml(einmal)).toBe(einmal);
  });

  it('lässt HTML ohne Begriff unverändert', () => {
    const html = '<p>Prüfziffer &amp; Rest</p>';
    expect(umbruchfreiHtml(html)).toBe(html);
  });
});
