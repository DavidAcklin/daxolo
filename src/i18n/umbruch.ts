/**
 * Begriffe, die nie am Bindestrich umbrochen werden.
 *
 * "QR-" am Zeilenende und "Referenz" auf der nächsten Zeile liest sich wie zwei
 * Wörter. Der geschützte Bindestrich U+2011 wäre die typografische Lösung, liegt
 * aber nicht im Latin-Subset von Inter: Der Browser zeichnete dieses eine Zeichen
 * in einer anderen Schrift. Deshalb `white-space: nowrap` über die globale Klasse
 * `umbruchfrei` (global.css) — global, weil auch das Skript eines Werkzeugs solche
 * Stellen erzeugt.
 *
 * Reine Funktionen, kein DOM. Angewendet beim Rendern der Werkzeuge (Statusblock,
 * KachelTabelle), in deren Skripten und über `umbruchfreiHtml` in den
 * Erklärtexten — überall dieselbe Liste.
 */
export const UMBRUCHFREI = ['QR-Referenz', 'QR-IBAN', 'QR-IID', 'QR-Rechnung'] as const;

export interface Segment {
  text: string;
  umbruchfrei: boolean;
}

const muster = new RegExp(
  `(${UMBRUCHFREI.map((begriff) => begriff.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
);

/** Zerlegt einen Text in normale und umbruchfreie Abschnitte. */
export function segmente(text: string): Segment[] {
  return text
    .split(muster)
    .filter((teil) => teil !== '')
    .map((teil) => ({
      text: teil,
      umbruchfrei: (UMBRUCHFREI as readonly string[]).includes(teil),
    }));
}

const AUSLASSEN_AUF = /^<(code|pre|script|style)\b/i;
const AUSLASSEN_ZU = /^<\/(code|pre|script|style)>/i;
const SPAN_AUF = /^<span class="umbruchfrei">$/;

/**
 * Wendet die Liste auf fertiges HTML an: nur auf Text zwischen den Tags, nie in
 * Tags oder Attributen, nicht in Code und nicht in Spans, die schon umbruchfrei
 * sind. Für die gerenderten Erklärtexte — deren HTML stammt aus unserem eigenen
 * Markdown, nicht aus Eingaben. Ein Markdown-Plugin bräuchte unter Astro 7 ein
 * zusätzliches Paket; diese Funktion braucht keins.
 */
export function umbruchfreiHtml(html: string): string {
  let auslassen = 0;
  let inSpan = false;
  return html
    .split(/(<[^>]*>)/)
    .map((teil) => {
      if (teil.startsWith('<')) {
        if (AUSLASSEN_AUF.test(teil)) auslassen++;
        else if (AUSLASSEN_ZU.test(teil)) auslassen = Math.max(0, auslassen - 1);
        else if (SPAN_AUF.test(teil)) inSpan = true;
        else if (inSpan && teil === '</span>') inSpan = false;
        return teil;
      }
      if (auslassen > 0 || inSpan) return teil;
      return segmente(teil)
        .map((s) => (s.umbruchfrei ? `<span class="umbruchfrei">${s.text}</span>` : s.text))
        .join('');
    })
    .join('');
}
