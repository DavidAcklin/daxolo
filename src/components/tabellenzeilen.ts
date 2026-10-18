/**
 * KachelTabelle im Browser: Zeilen ersetzen, ohne das Markup zu kennen.
 *
 * Die Komponente liefert beim Build ein Zeilenmuster als `<template>` mit —
 * dieselben Elemente, Klassen und dasselbe Scope-Attribut wie die gerenderten
 * Zeilen. `ersetzeZeilen` klont das Muster und setzt nur Text ein. Das Markup
 * einer Zeile gibt es damit genau einmal, in KachelTabelle.astro.
 */

/** Text einer Zelle, optional mit eigener Angabe, ob er eine Zahl ist. */
export type Zelle = string | { text: string; zahl?: boolean };

export const zellText = (zelle: Zelle): string => (typeof zelle === 'string' ? zelle : zelle.text);

/** Monospace oder nicht: Die Zelle entscheidet, wenn sie es sagt, sonst die Spalte. */
export const istZahl = (zelle: Zelle, spalteIstZahl: boolean): boolean =>
  typeof zelle === 'string' ? spalteIstZahl : (zelle.zahl ?? spalteIstZahl);

export function ersetzeZeilen(tabelle: HTMLTableElement, zeilen: Zelle[][]): void {
  const muster = tabelle.querySelector<HTMLTemplateElement>(':scope > template[data-zeilenmuster]');
  const vorlage = muster?.content.firstElementChild;
  const koerper = tabelle.tBodies[0];
  if (!(vorlage instanceof HTMLTableRowElement) || koerper === undefined) {
    // Ein Programmierfehler, kein Eingabefehler: melden, aber die Seite nicht
    // mit einer unbehandelten Ausnahme anhalten (CLAUDE.md 9).
    console.error(`KachelTabelle #${tabelle.id}: Zeilenmuster fehlt.`);
    return;
  }

  koerper.replaceChildren(
    ...zeilen.map((zeile) => {
      const tr = vorlage.cloneNode(true) as HTMLTableRowElement;
      for (const [i, zelle] of [...tr.cells].entries()) {
        const inhalt = zeile[i] ?? '';
        zelle.textContent = zellText(inhalt);
        // Im frischen Klon steht die Vorgabe der Spalte.
        zelle.classList.toggle('zahl', istZahl(inhalt, zelle.classList.contains('zahl')));
      }
      return tr;
    }),
  );
  tabelle.hidden = zeilen.length === 0;
}
