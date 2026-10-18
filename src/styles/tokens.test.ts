import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { farbabstand, kontrast } from './farbmass';

/**
 * Farbprüfung der Design-Tokens (CLAUDE.md 6) — ein CI-Gate, weil `npm test`
 * eines ist.
 *
 * Liest tokens.css, löst die Rollen für hell und dunkel auf und prüft:
 * 1. Vorder- gegen Hintergrund nach WCAG: 4.5:1 für Text, 3:1 für Rahmen,
 *    Fokusring und bedeutungstragende Grafik — gegen jede angrenzende Fläche.
 * 2. Den Abstand bedeutungstragender Flächen untereinander: ΔE00 ≥ 8.
 *
 * Die Paare bilden ab, wo eine Rolle tatsächlich steht. Jede Farbrolle muss
 * einem Paar zugeordnet oder im Ausnahmeregister an dessen Kriterium begründet
 * sein — eine neue Rolle fällt sonst durch. Würde eine Prüfung rot, wird die
 * Farbe korrigiert, nicht die Prüfung eingegrenzt.
 *
 * `FARBBERICHT=1 npx vitest run src/styles/tokens.test.ts` gibt alle Messwerte
 * aus — so entstehen die Werte in den Kommentaren von tokens.css.
 */

type Rollen = Record<string, string>;

const quelle = readFileSync(fileURLToPath(new URL('./tokens.css', import.meta.url)), 'utf8')
  // Kommentare enthalten Messwerte und Hex-Werte, die keine Deklarationen sind.
  .replace(/\/\*[\s\S]*?\*\//g, '');

/** Deklarationen `--name: wert;` des Blocks, der auf `kopf` folgt. */
function block(kopf: RegExp): Rollen {
  const treffer = kopf.exec(quelle);
  if (treffer === null) throw new Error(`Block ${kopf} fehlt in tokens.css`);
  let tiefe = 0;
  let ende = treffer.index + treffer[0].length;
  for (let i = quelle.indexOf('{', treffer.index); i < quelle.length; i++) {
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}' && --tiefe === 0) {
      ende = i;
      break;
    }
  }
  const inhalt = quelle.slice(quelle.indexOf('{', treffer.index) + 1, ende);
  return Object.fromEntries(
    // Prettier bricht lange Werte um; Leerraum zählt nicht.
    [...inhalt.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map((d) => [
      d[1],
      (d[2] ?? '').replace(/\s+/g, ' ').trim(),
    ]),
  );
}

const theme = block(/@theme\s*\{/);
const hell = block(/:root\s*\{/);
const dunkelMedia = block(/:root:not\(\[data-modus='hell'\]\)\s*\{/);
const dunkelAttribut = block(/\[data-modus='dunkel'\]\s*\{/);
const dunkel = { ...hell, ...dunkelMedia };

/** Löst `var(--…)` über Rollen und Theme auf, bis eine Farbe dasteht. */
function farbe(rollen: Rollen, name: string, kette: string[] = []): string {
  if (kette.includes(name)) throw new Error(`Zirkelbezug: ${[...kette, name].join(' → ')}`);
  const wert = rollen[name] ?? theme[name];
  if (wert === undefined) throw new Error(`Rolle --${name} fehlt in tokens.css`);
  const verweis = /^var\(\s*--([\w-]+)\s*\)$/.exec(wert);
  return verweis === null ? wert.toLowerCase() : farbe(rollen, verweis[1] ?? '', [...kette, name]);
}

const NEUTRAL = ['flaeche-seite', 'flaeche-kachel', 'flaeche-innen'] as const;

/** Vordergrund, Hintergrund, wofür das Paar steht. */
type Paar = readonly [vorder: string, hinter: string, zweck: string];
const aufNeutral = (vorder: string, zweck: string): Paar[] =>
  NEUTRAL.map((hinter) => [vorder, hinter, zweck] as const);

/** Text, 4.5:1. */
const TEXT: Paar[] = [
  ...aufNeutral('text-primaer', 'Fliesstext'),
  ...aufNeutral('text-sekundaer', 'Hilfstext, nicht gewählter Farbmodus'),
  ...aufNeutral('text-gedaempft', 'gedämpfter Text'),
  ['text-platzhalter', 'flaeche-innen', 'Platzhalter im Feld'],
  ...aufNeutral('marke-link', 'Link'),
  ...aufNeutral('marke-aktion-hover', 'Link beim Hover'),
  ['marke-aktion-text', 'marke-aktion', 'Hauptknopf'],
  ['marke-aktion-text', 'marke-aktion-hover', 'Hauptknopf beim Hover'],
  ['marke-text-auf-flaeche', 'marke-flaeche', 'gewählter Farbmodus'],
  // Statusblock. Sein Symbol nutzt dieselbe Farbe und ist damit mit abgedeckt.
  ['erfolg-text', 'erfolg-flaeche', 'Statusblock Erfolg'],
  ['warnung-text', 'warnung-flaeche', 'Statusblock Warnung'],
  ['fehler-text', 'fehler-flaeche', 'Statusblock Fehler'],
  ['erfolg-text', 'flaeche-seite', 'Kopierbestätigung'],
  ['erfolg-text', 'flaeche-kachel', 'Kopierbestätigung'],
  ['fehler-text', 'flaeche-seite', 'Feldfehler'],
  ['fehler-text', 'flaeche-kachel', 'Feldfehler'],
];

/** Rahmen, Fokusring, bedeutungstragende Grafik, 3:1 — je gegen jede angrenzende Fläche. */
const NICHT_TEXT: Paar[] = [
  // Feldrahmen: innen das Feld, aussen Kachel oder Seite.
  ...aufNeutral('feld-rahmen', 'Feldrahmen'),
  ...aufNeutral('fehler-rahmen', 'Fehlerrahmen'),
  // Der Ring liegt mit Versatz auf der Fläche um das fokussierte Element.
  ...aufNeutral('fokus-ring', 'Fokusring'),
  ['marke-aktion', 'flaeche-seite', 'Hauptknopf'],
  ['marke-aktion', 'flaeche-kachel', 'Hauptknopf'],
  // Gewählter Farbmodus: Die 2-px-Markierung trägt die Auswahl ohne Farbe.
  // Innen grenzt sie an die gewählte Fläche, aussen an die Seite (der
  // Umschalter selbst hat keine Fläche). Die gewählte Fläche hebt sich von der
  // Seite kaum ab — sie ist Zusatz, nicht das Merkmal, das die Auswahl trägt.
  ['marke-aktion', 'marke-flaeche', 'Auswahlmarkierung Farbmodus'],
  ['marke-aktion', 'flaeche-seite', 'Auswahlmarkierung Farbmodus'],
  // Begrenzungen von Bedienelementen ohne eigene Fläche (WCAG 1.4.11). Der
  // Umschalter steht im Kopf auf der Seite und hat innen keine Fläche.
  ['feld-rahmen', 'flaeche-seite', 'Begrenzung Farbmodus-Umschalter'],
  // Der sekundäre Knopf ist ein Bauteil für Seite und Kachel; beim Hover füllt
  // er sich mit der Feldfläche.
  ...aufNeutral('feld-rahmen', 'Begrenzung sekundärer Knopf'),
];

/** Bedeutungstragende Flächen: Marke und Status. Jedes Paar untereinander, ΔE00 ≥ 8. */
const BEDEUTUNG = [
  'marke-flaeche',
  'marke-aktion',
  'erfolg-flaeche',
  'warnung-flaeche',
  'fehler-flaeche',
] as const;
const FLAECHENPAARE = BEDEUTUNG.flatMap((a, i) =>
  BEDEUTUNG.slice(i + 1).map((b) => [a, b] as const),
);

/**
 * Ausnahmeregister. Kriterium (CLAUDE.md 6): Eine Farbrolle ist nur dann
 * dekorativ, wenn die Oberfläche ohne sie vollständig bedienbar bleibt und jede
 * Komponente erkennbar ist. Jede Ausnahme begründet beide Teile einzeln — das
 * Wort "dekorativ" allein genügt nicht.
 */
interface Ausnahme {
  /** Wo die Rolle steht. */
  verwendung: string;
  /** Warum die Oberfläche ohne sie vollständig bedienbar bleibt. */
  bedienbar: string;
  /** Warum jede Komponente ohne sie erkennbar bleibt. */
  erkennbar: string;
}

const AUSNAHMEN: Record<string, Ausnahme> = {
  linie: {
    verwendung: 'Haarlinien zwischen Tabellenzeilen, über dem Erklärtext und über dem Fuss.',
    bedienbar: 'Sie trennt nur und begrenzt kein Bedienelement; keine Bedienung hängt an ihr.',
    erkennbar:
      'Tabellenzeilen bleiben über Zeilenkopf, Ausrichtung und Abstand erkennbar, ' +
      'Erklärtext und Fuss über Überschrift und Abstand.',
  },
  'linie-stark': {
    verwendung:
      'Zurzeit keine. Vorgesehen nur für Trennungen; Begrenzungen von Bedienelementen ' +
      'nutzen --feld-rahmen.',
    bedienbar: 'Sie steht an keinem Bedienelement.',
    erkennbar: 'Keine Komponente ist auf sie angewiesen.',
  },
};

const messwerte: string[] = [];
afterAll(() => {
  if (process.env['FARBBERICHT']) console.log(messwerte.join('\n'));
});

const MODI = [
  ['hell', hell],
  ['dunkel', dunkel],
] as const;

describe.each(MODI)('Farbprüfung %s', (modus, rollen) => {
  it.each(TEXT)('Text: %s auf %s ≥ 4.5:1 (%s)', (vorder, hinter, zweck) => {
    const ist = kontrast(farbe(rollen, vorder), farbe(rollen, hinter));
    messwerte.push(
      `${modus.padEnd(6)} Text    ${`${vorder} auf ${hinter}`.padEnd(44)} ${ist.toFixed(2).padStart(5)}:1  ${zweck}`,
    );
    expect(
      ist,
      `${modus}: ${vorder} auf ${hinter} (${zweck}) — Ist ${ist.toFixed(2)}:1, Soll ≥ 4.5:1`,
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NICHT_TEXT)('Rahmen/Grafik: %s gegen %s ≥ 3:1 (%s)', (vorder, hinter, zweck) => {
    const ist = kontrast(farbe(rollen, vorder), farbe(rollen, hinter));
    messwerte.push(
      `${modus.padEnd(6)} Rahmen  ${`${vorder} gegen ${hinter}`.padEnd(44)} ${ist.toFixed(2).padStart(5)}:1  ${zweck}`,
    );
    expect(
      ist,
      `${modus}: ${vorder} gegen ${hinter} (${zweck}) — Ist ${ist.toFixed(2)}:1, Soll ≥ 3:1`,
    ).toBeGreaterThanOrEqual(3);
  });

  it.each(FLAECHENPAARE)('Flächen: %s / %s ΔE00 ≥ 8', (a, b) => {
    const ist = farbabstand(farbe(rollen, a), farbe(rollen, b));
    messwerte.push(`${modus.padEnd(6)} Fläche  ${`${a} / ${b}`.padEnd(44)} ΔE00 ${ist.toFixed(1)}`);
    expect(
      ist,
      `${modus}: ${a} / ${b} — Ist ΔE00 ${ist.toFixed(1)}, Soll ≥ 8`,
    ).toBeGreaterThanOrEqual(8);
  });
});

describe('Vollständigkeit', () => {
  it('ordnet jede Farbrolle einem Paar oder dem Ausnahmeregister zu', () => {
    const geprueft = new Set(
      [...TEXT, ...NICHT_TEXT, ...FLAECHENPAARE].flatMap(([vorder, hinter]) => [vorder, hinter]),
    );
    const offen = Object.keys(hell).filter(
      (name) => /^#/.test(farbe(hell, name)) && !geprueft.has(name) && !(name in AUSNAHMEN),
    );
    expect(offen, `Farbrollen ohne Paar: ${offen.join(', ')}`).toEqual([]);
  });

  it('begründet jede Ausnahme an beiden Teilen des Kriteriums', () => {
    for (const [name, a] of Object.entries(AUSNAHMEN)) {
      expect(a.verwendung.trim(), `--${name}: Verwendung fehlt`).not.toBe('');
      expect(a.bedienbar.trim(), `--${name}: warum bedienbar ohne sie?`).not.toBe('');
      expect(a.erkennbar.trim(), `--${name}: warum erkennbar ohne sie?`).not.toBe('');
      for (const begruendung of [a.bedienbar, a.erkennbar]) {
        expect(begruendung, `--${name}: "dekorativ" ist keine Begründung`).not.toMatch(
          /^\s*dekorativ\.?\s*$/i,
        );
      }
    }
  });

  it('führt keine Rolle zugleich in einem Paar und im Ausnahmeregister', () => {
    const geprueft = new Set(
      [...TEXT, ...NICHT_TEXT, ...FLAECHENPAARE].flatMap(([vorder, hinter]) => [vorder, hinter]),
    );
    const doppelt = Object.keys(AUSNAHMEN).filter((name) => geprueft.has(name));
    expect(doppelt, `Geprüft und zugleich Ausnahme: ${doppelt.join(', ')}`).toEqual([]);
  });

  it('definiert den dunklen Modus zweimal gleich: für "automatisch" und für data-modus="dunkel"', () => {
    expect(dunkelAttribut).toEqual(dunkelMedia);
  });

  it('löst jede Rolle in beiden Modi zu #rrggbb auf', () => {
    for (const [modus, rollen] of MODI) {
      for (const name of Object.keys(rollen)) {
        const wert = farbe(rollen, name);
        if (/^#/.test(wert)) expect(wert, `${modus}: --${name}`).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });
});
