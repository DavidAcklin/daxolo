import { describe, expect, it } from 'vitest';
import { eintragAusHtml, pruefeSitemap, sitemapXml, type SitemapEintrag } from './sitemap';

const SITE = 'https://daxolo.ch';

function seite(canonical: string, fassungen: Record<string, string>, extra = ''): string {
  const links = Object.entries(fassungen)
    .map(([sprache, href]) => `<link rel="alternate" hreflang="${sprache}" href="${href}">`)
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${extra}<link rel="canonical" href="${canonical}">${links}</head><body><link rel="canonical" href="https://falsch.example/"></body></html>`;
}

const DE = 'https://daxolo.ch/de/werkzeuge/iban-pruefer/';
const FR = 'https://daxolo.ch/fr/outils/verificateur-iban/';
const EN = 'https://daxolo.ch/en/tools/iban-validator/';
const ALLE = { 'de-CH': DE, 'fr-CH': FR, en: EN, 'x-default': 'https://daxolo.ch/de/' };

describe('eintragAusHtml', () => {
  it('liest canonical und alle Sprachfassungen aus dem Kopf', () => {
    expect(eintragAusHtml(seite(FR, ALLE), 'fr.html')).toEqual({
      loc: FR,
      fassungen: [
        { hreflang: 'de-CH', href: DE },
        { hreflang: 'fr-CH', href: FR },
        { hreflang: 'en', href: EN },
        { hreflang: 'x-default', href: 'https://daxolo.ch/de/' },
      ],
    });
  });

  it('ignoriert Links ausserhalb des Kopfs', () => {
    expect(eintragAusHtml(seite(DE, {}), 'de.html')?.loc).toBe(DE);
  });

  it('lässt Seiten mit noindex weg', () => {
    const weiterleitung =
      '<!doctype html><title>Redirecting to: /de/</title><meta http-equiv="refresh" content="0;url=/de/"><meta name="robots" content="noindex"><link rel="canonical" href="https://daxolo.ch/de/">';
    expect(eintragAusHtml(weiterleitung, 'index.html')).toBeUndefined();
  });

  it('löst Entitäten in Attributen auf', () => {
    const eintrag = eintragAusHtml(seite('https://daxolo.ch/de/?a=1&amp;b=2', {}), 'x.html');
    expect(eintrag?.loc).toBe('https://daxolo.ch/de/?a=1&b=2');
  });

  it('wirft bei einer indexierbaren Seite ohne canonical', () => {
    expect(() => eintragAusHtml('<html><head></head></html>', 'ohne.html')).toThrow(
      'ohne.html: indexierbare Seite ohne <link rel="canonical">',
    );
  });
});

describe('pruefeSitemap', () => {
  const gueltig: SitemapEintrag[] = [DE, FR, EN].map((loc) => ({
    loc,
    fassungen: Object.entries(ALLE).map(([hreflang, href]) => ({ hreflang, href })),
  }));
  const startseite: SitemapEintrag = {
    loc: 'https://daxolo.ch/de/',
    fassungen: [{ hreflang: 'de-CH', href: 'https://daxolo.ch/de/' }],
  };

  it('akzeptiert gegenseitige Sprachfassungen mit Selbstverweis', () => {
    expect(pruefeSitemap([...gueltig, startseite], SITE)).toEqual([]);
  });

  it('meldet einen nicht erwiderten Verweis', () => {
    const ohneRueckweg = gueltig.map((e) =>
      e.loc === EN ? { ...e, fassungen: e.fassungen.filter((f) => f.href !== FR) } : e,
    );
    expect(pruefeSitemap([...ohneRueckweg, startseite], SITE)).toContain(
      `${EN}: erwidert den hreflang-Verweis von ${FR} nicht`,
    );
  });

  it('meldet einen Verweis auf eine Seite, die nicht in der Sitemap steht', () => {
    expect(pruefeSitemap(gueltig.slice(0, 2), SITE)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`zeigt auf ${EN}, die keine indexierbare Seite ist`),
      ]),
    );
  });

  it('meldet eine Seite ohne Selbstverweis', () => {
    const ohneSelbst = { loc: DE, fassungen: [{ hreflang: 'fr-CH', href: FR }] };
    expect(pruefeSitemap([ohneSelbst], SITE)).toContain(
      `${DE}: verweist nicht per hreflang auf sich selbst`,
    );
  });

  it('meldet URLs ausserhalb der Produktionsdomain', () => {
    const lokal = { loc: 'http://localhost:4321/de/', fassungen: [] };
    expect(pruefeSitemap([lokal], SITE)).toContain(
      'http://localhost:4321/de/: http://localhost:4321/de/ liegt nicht unter https://daxolo.ch',
    );
  });

  it('meldet doppelte Einträge und doppelte hreflang', () => {
    const doppelt = {
      loc: DE,
      fassungen: [
        { hreflang: 'de-CH', href: DE },
        { hreflang: 'de-CH', href: DE },
      ],
    };
    const fehler = pruefeSitemap([doppelt, doppelt], SITE);
    expect(fehler).toContain(`${DE}: doppelt in der Sitemap`);
    expect(fehler).toContain(`${DE}: hreflang doppelt: de-CH`);
  });
});

describe('sitemapXml', () => {
  it('schreibt je URL alle Sprachfassungen, sortiert und maskiert', () => {
    const xml = sitemapXml([
      { loc: FR, fassungen: [{ hreflang: 'fr-CH', href: FR }] },
      { loc: 'https://daxolo.ch/de/?a=1&b=2', fassungen: [] },
    ]);
    expect(xml).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        '  <url>',
        '    <loc>https://daxolo.ch/de/?a=1&amp;b=2</loc>',
        '  </url>',
        '  <url>',
        `    <loc>${FR}</loc>`,
        `    <xhtml:link rel="alternate" hreflang="fr-CH" href="${FR}"/>`,
        '  </url>',
        '</urlset>',
        '',
      ].join('\n'),
    );
  });
});
