import { segmente } from '../i18n/umbruch';

/**
 * Setzt Text in ein Element und hält dabei die umbruchfreien Begriffe aus
 * src/i18n/umbruch.ts zusammen — das Gegenstück im Browser zu dem, was Astro beim
 * Rendern aus denselben Segmenten baut. Die Klasse `umbruchfrei` ist global
 * (global.css), sie greift also auch auf diese erzeugten Elemente.
 */
export function fuelleUmbruchfrei(element: Element, text: string): void {
  element.replaceChildren(
    ...segmente(text).map((s) => {
      if (!s.umbruchfrei) return document.createTextNode(s.text);
      const span = document.createElement('span');
      span.className = 'umbruchfrei';
      span.textContent = s.text;
      return span;
    }),
  );
}
