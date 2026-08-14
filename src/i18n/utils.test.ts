import { describe, expect, it } from 'vitest';
import {
  getLocaleFromUrl,
  isLocale,
  localePath,
  switchLocalePath,
  toolPath,
  useTranslations,
  werkzeugePath,
} from './utils';

describe('isLocale', () => {
  it('erkennt aktive Sprachen', () => {
    expect(isLocale('de')).toBe(true);
    expect(isLocale('fr')).toBe(true);
    expect(isLocale('en')).toBe(true);
  });

  it('weist alles andere ab', () => {
    expect(isLocale('it')).toBe(false);
    expect(isLocale('')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe('getLocaleFromUrl', () => {
  it('liest die Sprache aus dem ersten Segment', () => {
    expect(getLocaleFromUrl(new URL('https://daxolo.ch/fr/tva/'))).toBe('fr');
  });

  it('faellt ohne Praefix auf die Standardsprache zurueck', () => {
    expect(getLocaleFromUrl(new URL('https://daxolo.ch/'))).toBe('de');
    expect(getLocaleFromUrl(new URL('https://daxolo.ch/impressum/'))).toBe('de');
  });
});

describe('localePath', () => {
  it('haengt immer einen Slash an', () => {
    expect(localePath('de')).toBe('/de/');
    expect(localePath('fr', 'tva')).toBe('/fr/tva/');
  });

  it('normalisiert fuehrende und mehrfache Slashes', () => {
    expect(localePath('en', '/vat/')).toBe('/en/vat/');
  });
});

describe('werkzeugePath', () => {
  it('uebersetzt das Werkzeug-Segment', () => {
    expect(werkzeugePath('de')).toBe('/de/werkzeuge/');
    expect(werkzeugePath('fr')).toBe('/fr/outils/');
    expect(werkzeugePath('en')).toBe('/en/tools/');
  });
});

describe('toolPath', () => {
  it('baut /<sprache>/<segment>/<slug>/ ohne Kategorie im Pfad', () => {
    expect(toolPath('de', 'iban-pruefer')).toBe('/de/werkzeuge/iban-pruefer/');
    expect(toolPath('fr', 'verificateur-iban')).toBe('/fr/outils/verificateur-iban/');
    expect(toolPath('en', 'iban-validator')).toBe('/en/tools/iban-validator/');
  });
});

describe('switchLocalePath', () => {
  it('tauscht das Sprachsegment aus', () => {
    expect(switchLocalePath('/de/mwst/', 'fr')).toBe('/fr/mwst/');
  });

  it('setzt ein fehlendes Sprachsegment', () => {
    expect(switchLocalePath('/', 'en')).toBe('/en/');
  });

  it('uebersetzt das Werkzeug-Segment mit', () => {
    expect(switchLocalePath('/de/werkzeuge/', 'fr')).toBe('/fr/outils/');
    expect(switchLocalePath('/en/tools/', 'de')).toBe('/de/werkzeuge/');
  });

  it('laesst den Slug unangetastet — den kennt nur der Inhalt', () => {
    // Toolseiten geben ihre Sprachfassungen explizit als `alternates` an.
    expect(switchLocalePath('/de/werkzeuge/iban-pruefer/', 'fr')).toBe('/fr/outils/iban-pruefer/');
  });
});

describe('useTranslations', () => {
  it('liefert die Texte der gewaehlten Sprache', () => {
    expect(useTranslations('de')('skip.link')).toBe('Direkt zum Inhalt');
    expect(useTranslations('en')('skip.link')).toBe('Skip to content');
  });
});
