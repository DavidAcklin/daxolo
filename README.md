# daxolo

Werkzeuge für Zahlungsverkehr und Finanzen in der Schweiz. Statische Website, alle
Berechnungen laufen im Browser — es gibt kein Backend.

Verbindlich ist [CLAUDE.md](CLAUDE.md). Bei Konflikt zwischen einer Anweisung und
diesem Dokument gilt CLAUDE.md.

## Voraussetzungen

Node gemäss [.nvmrc](.nvmrc) (24.6.0), Paketmanager npm.

```sh
nvm use
npm ci
```

## Befehle

| Befehl               | Wirkung                                          |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Dev-Server auf <http://localhost:4321>           |
| `npm run build`      | statischer Build nach `dist/`                    |
| `npm run preview`    | gebauten Output lokal ausliefern                 |
| `npm run typecheck`  | `astro check`, TypeScript strict                 |
| `npm run lint`       | ESLint                                           |
| `npm run format`     | Prettier schreibend, `format:check` nur prüfend  |
| `npm test`           | Vitest, Logik unter `src/**/*.test.ts`           |
| `npm run test:e2e`   | Playwright-Smoke-Tests gegen den gebauten Output |
| `npm run audit:ci`   | `npm audit --audit-level=high`                   |
| `npm run lighthouse` | Lighthouse CI gegen den gebauten Output          |

Lighthouse braucht ein installiertes Chrome. Unter Windows gegebenenfalls
`CHROME_PATH` setzen; `lhci` läuft absichtlich per `npx` und steht nicht in
`package.json`, weil sein Abhängigkeitsbaum das Audit-Gate rot färben würde.

## CI-Gates

Jeder Punkt blockiert den Merge (CLAUDE.md 10): Typecheck, Lint, Formatprüfung,
Unit-Tests, `npm audit --audit-level=high`, Build, Playwright-Smoke-Tests und
Lighthouse CI (jede Kategorie mindestens 95).

## Aufbau

```text
src/
  components/       geteilte UI-Bausteine
  content/tools/    Werkzeug-Metadaten (Schema in src/content.config.ts)
  data/             Fachdaten, datiert und mit Quelle
  i18n/             Sprachen, Pfadsegmente, UI-Texte
  layouts/          BaseLayout, ToolLayout
  lib/money/        Geldarithmetik in ganzzahligen Rappen, parseBetrag
  lib/swiss/        IBAN, Referenzen, Prüfziffern, MwSt-Logik
  lib/werkzeuge.ts  Adapter zwischen Collection und Routen
  pages/de|fr|en/   gespiegelte Routen
  styles/           tokens.css, global.css
tests/e2e/          Playwright
```

Ein Werkzeug besteht aus `src/tools/<slug>/logic.ts` (rein, framework-frei, getestet),
`Tool.astro` (Island) und einem Eintrag in `src/content/tools/`. Die Trennung zwischen
Logik und UI ist nicht verhandelbar: dieser Code trägt später die Anwendungen aus
Stufe 3.

## URLs und Sprachen

`de`, `fr`, `en` — alle Routen sind sprachpräfixiert, `/` leitet dauerhaft auf `/de/`.

```text
/de/werkzeuge/<slug>/   /fr/outils/<slug>/   /en/tools/<slug>/
```

Pfadsegment und Slug sind pro Sprache übersetzt, die Kategorie kommt nie in den Pfad.
Die Segmente stehen in `src/i18n/ui.ts`, die Slugs in der Content Collection.

In den Metadaten sind alle Sprachen gleichrangig: sprachunabhängig sind nur Kategorie,
Stufe, Status und Haftungsausschluss-Flag; Titel, Beschreibung, Slug und Keywords liegen
für jede Sprache unter demselben Schlüssel `sprachen.<sprache>`. Fehlt eine Sprache,
entsteht dort keine Route, es gibt kein `hreflang` darauf, und der Sprachumschalter
zeigt sie als nicht verfügbar.

## Beträge einlesen

Nutzereingaben laufen ausschliesslich über `parseBetrag` aus `src/lib/money/`, nie über
`parseFloat`. Akzeptiert werden `1'000.50`, `1000,50`, `1000.50`, `1 000.50` sowie die
Ausgaben von `Intl` für de-CH (`1’000.50`) und fr-CH (`1 000,50`). Alles andere ergibt
ein Fehlerobjekt mit Code und Meldung — nie stillschweigend 0 oder NaN.

## IBAN

`src/lib/swiss/iban/` prüft schweizerische und liechtensteinische IBAN: Normalisierung,
Struktur, Modulo 97-10, QR-IBAN-Erkennung, Formatierung in Vierergruppen. Reine
Funktionen, Ergebnisobjekt statt Exception. Quellen sind im Modulkopf einzeln benannt:

- SIX, [IBAN — Standards Zahlungsverkehr Schweiz](https://www.six-group.com/en/products-services/banking-services/payment-standardization/standards/iban.html):
  21 Stellen, IID an Stelle 5–9, Prüfziffer nach Modulo 97-10 gemäss ISO/IEC 7064.
- SIX, Schweizer Implementation Guidelines QR-Rechnung, Version 2.3 (20.11.2023),
  Kapitel 2.8 und 2.10: QR-IID exklusiv 30000–31999.
- SIX, Fachliche Informationen zur QR-IID und QR-IBAN, Version 1.1 (29.02.2020).

Die Testvektoren stammen aus den Beispielrechnungen der Implementation Guidelines.

## Stand des Gerüsts

Noch keine Werkzeuge, kein Design-System. `src/styles/tokens.css` ist absichtlich leer,
`public/favicon.svg` ist ein Platzhalter, Impressum und Datenschutzerklärung fehlen
noch (CLAUDE.md 9).
