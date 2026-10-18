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
 * Reine Funktion, kein DOM: Astro und das Skript bauen aus denselben Segmenten.
 */
export const UMBRUCHFREI = ['QR-Referenz'] as const;

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
