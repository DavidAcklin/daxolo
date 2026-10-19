import { describe, expect, it } from 'vitest';
import { findePlatzhalter } from './platzhalter';

describe('findePlatzhalter', () => {
  it('findet die Platzhalter der Rechtstexte', () => {
    expect(findePlatzhalter('<p>{{NAME}}<br>{{PLZ_ORT}}, Schweiz</p>')).toEqual([
      '{{NAME}}',
      '{{PLZ_ORT}}',
    ]);
  });

  it('meldet jeden Platzhalter einmal', () => {
    expect(findePlatzhalter('{{EMAIL}} … {{EMAIL}} … {{STAND}}')).toEqual([
      '{{EMAIL}}',
      '{{STAND}}',
    ]);
  });

  it('erkennt Leerzeichen innerhalb der Klammern', () => {
    expect(findePlatzhalter('E-Mail: {{ EMAIL }}')).toEqual(['{{ EMAIL }}']);
  });

  it('erkennt einen Platzhalter in einem Attribut', () => {
    expect(findePlatzhalter('<a href="mailto:{{EMAIL}}">')).toEqual(['{{EMAIL}}']);
  });

  it('meldet nichts in einem Text ohne Platzhalter', () => {
    expect(findePlatzhalter('<p>David, 8000 Zürich, Schweiz</p>')).toEqual([]);
  });

  it('übersieht minifiziertes JavaScript mit verschachtelten Blöcken', () => {
    expect(findePlatzhalter('if(e){{a}}function t(){{return{b:1}}}')).toEqual([]);
  });
});
