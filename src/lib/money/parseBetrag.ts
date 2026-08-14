import { rappen, type Rappen } from './rappen';

/**
 * Die Stelle, an der Nutzereingaben auf unsere Zahlen treffen (CLAUDE.md 2.2).
 *
 * `parseFloat` gibt es hier nicht: es liest `1'000.50` als 1, `1000,50` als 1000
 * und alles Unlesbare als `NaN` — jedes Mal eine falsche Zahl statt einer
 * Fehlermeldung. `parseBetrag` gibt darum ein Ergebnis mit Fehlerfall zurueck und
 * wirft nicht; die UI kann jeden Fall benennen (CLAUDE.md 8).
 *
 * Zugelassen sind:
 * - Tausendertrennzeichen: Apostroph-Varianten und Leerzeichen, jeweils in
 *   Dreiergruppen.
 * - Dezimaltrennzeichen `.` oder `,` mit ein bis zwei Nachkommastellen.
 * - Vorzeichen `+`/`-` und beliebige Leerzeichen aussen.
 *
 * Bewusst NICHT zugelassen:
 * - `.` oder `,` als Tausendertrennzeichen. `1.000` waere je nach Herkunft 1000
 *   oder 1.00 — bei Geld raten wir nicht, wir melden einen Fehler.
 * - Mehr als zwei Nachkommastellen. Runden ist eine Entscheidung, die pro
 *   Anwendungsfall explizit getroffen wird, nicht still beim Einlesen.
 */

export type ParseFehlerCode =
  | 'leer'
  | 'unerlaubte-zeichen'
  | 'mehrere-dezimaltrenner'
  | 'unvollstaendig'
  | 'mehrdeutig'
  | 'zu-viele-nachkommastellen'
  | 'ungueltige-gruppierung'
  | 'zu-gross';

/**
 * Ergebnis mit Fehlerfall. `code` ist stabil und uebersetzbar, `nachricht` ist
 * die deutsche Fassung fuer Entwicklung und Tests.
 */
export type ParseErgebnis =
  { ok: true; wert: Rappen } | { ok: false; code: ParseFehlerCode; nachricht: string };

/**
 * Tausendertrennzeichen als Escape-Sequenzen, weil die Zeichen sonst nicht
 * unterscheidbar sind: U+2019 liefert `Intl` fuer de-CH ("1’000.50"),
 * U+202F fuer fr-CH ("1 000,50").
 */
const TRENNER = "'\\u2019\\u2018\\u02BC \\u00A0\\u202F\\u2009";
const GRUPPENTRENNER = new RegExp(`[${TRENNER}]`, 'g');
const ERLAUBTE_ZEICHEN = new RegExp(`^[\\d.,${TRENNER}]+$`);
const NUR_ZIFFERN = /^\d+$/;
const BEISPIEL = "1'000.50";

function fehler(code: ParseFehlerCode, nachricht: string): ParseErgebnis {
  return { ok: false, code, nachricht };
}

export function parseBetrag(eingabe: string): ParseErgebnis {
  const roh = eingabe.trim();
  if (roh === '') {
    return fehler('leer', `Gib einen Betrag ein, zum Beispiel ${BEISPIEL}.`);
  }

  const vorzeichen = roh.startsWith('-') ? -1 : 1;
  const ohneVorzeichen = roh.startsWith('-') || roh.startsWith('+') ? roh.slice(1) : roh;

  if (!ERLAUBTE_ZEICHEN.test(ohneVorzeichen)) {
    return fehler(
      'unerlaubte-zeichen',
      'Nur Ziffern, ein Dezimaltrennzeichen und Tausendertrennzeichen sind erlaubt — ' +
        `ohne Währungszeichen, zum Beispiel ${BEISPIEL}.`,
    );
  }

  const dezimaltrenner = (ohneVorzeichen.match(/[.,]/g) ?? []).length;
  if (dezimaltrenner > 1) {
    return fehler(
      'mehrere-dezimaltrenner',
      'Es darf nur ein Dezimaltrennzeichen vorkommen. Als Tausendertrennzeichen dienen ' +
        `Apostroph oder Leerzeichen, nicht Punkt oder Komma: ${BEISPIEL} statt 1,000.50.`,
    );
  }

  const trennerIndex = ohneVorzeichen.search(/[.,]/);
  const ganzTeil = trennerIndex === -1 ? ohneVorzeichen : ohneVorzeichen.slice(0, trennerIndex);
  const nachkomma = trennerIndex === -1 ? '' : ohneVorzeichen.slice(trennerIndex + 1);

  if (trennerIndex !== -1 && nachkomma === '') {
    return fehler(
      'unvollstaendig',
      'Nach dem Dezimaltrennzeichen fehlen die Rappen, zum Beispiel 1000.50.',
    );
  }
  if (nachkomma !== '' && !NUR_ZIFFERN.test(nachkomma)) {
    return fehler('unerlaubte-zeichen', 'Nach dem Dezimaltrennzeichen stehen nur Ziffern.');
  }
  if (nachkomma.length > 2) {
    // `1.000` kann tausend oder eins bedeuten — falsch geraten sind das drei
    // Groessenordnungen (CLAUDE.md 2.2). Genau drei Nachkommastellen hinter
    // einer Zahl ohne fuehrende Null sind so ein Fall; die Meldung nennt beide
    // korrekten Schreibweisen und laesst die Nutzerin entscheiden.
    const ohneGruppentrenner = ganzTeil.split(GRUPPENTRENNER).join('');
    const mehrdeutig =
      nachkomma.length === 3 && ohneGruppentrenner === ganzTeil && /^[1-9]\d{0,2}$/.test(ganzTeil);
    if (mehrdeutig) {
      return fehler(
        'mehrdeutig',
        `"${ganzTeil}.${nachkomma}" ist mehrdeutig. Für tausend schreibe ` +
          `${ganzTeil}'${nachkomma}, für den Betrag mit Rappen ${ganzTeil}.${nachkomma.slice(0, 2)}.`,
      );
    }
    return fehler(
      'zu-viele-nachkommastellen',
      'Ein Betrag hat höchstens zwei Nachkommastellen. Runde selbst auf Rappen, ' +
        `zum Beispiel ${ganzTeil === '' ? '0' : ganzTeil}.${nachkomma.slice(0, 2)}.`,
    );
  }

  const gruppen = ganzTeil.split(GRUPPENTRENNER);
  const ganzZiffern = gruppen.join('');
  if (ganzZiffern !== '' && !NUR_ZIFFERN.test(ganzZiffern)) {
    return fehler('unerlaubte-zeichen', 'Vor dem Dezimaltrennzeichen stehen nur Ziffern.');
  }
  if (ganzZiffern === '' && nachkomma === '') {
    return fehler('unvollstaendig', 'Der Betrag enthält keine Ziffer.');
  }
  if (gruppen.length > 1) {
    const [erste, ...weitere] = gruppen;
    const gruppierungStimmt =
      erste !== undefined &&
      /^\d{1,3}$/.test(erste) &&
      weitere.every((gruppe) => /^\d{3}$/.test(gruppe));
    if (!gruppierungStimmt) {
      return fehler(
        'ungueltige-gruppierung',
        "Tausendertrennzeichen stehen alle drei Stellen, zum Beispiel 1'000'000.50.",
      );
    }
  }

  // Ziffernweise nach Rappen: kein Float, keine Multiplikation mit 100.
  const rappenZiffern = `${ganzZiffern === '' ? '0' : ganzZiffern}${nachkomma.padEnd(2, '0')}`;
  const betrag = BigInt(rappenZiffern);
  if (betrag > BigInt(Number.MAX_SAFE_INTEGER)) {
    return fehler(
      'zu-gross',
      `Der Betrag ist zu gross. Maximal sind ${Number.MAX_SAFE_INTEGER} Rappen darstellbar.`,
    );
  }

  const wert = Number(betrag) * vorzeichen;
  // -0 ist als Betrag dasselbe wie 0 und soll sich auch so verhalten.
  return { ok: true, wert: rappen(wert === 0 ? 0 : wert) };
}
