# daxolo — Projektverfassung

Diese Datei ist verbindlich. Bei Konflikt zwischen einem Prompt und diesem Dokument:
nachfragen, nicht abweichen.

---

## 1. Was daxolo ist

**Werkzeuge für Zahlungsverkehr und Finanzen in der Schweiz.**

Keine allgemeine Tool-Sammlung. Wenn ein Tool nicht mit Geld, Zahlungen, Steuern oder
Buchhaltung zu tun hat, gehört es nicht auf daxolo — egal wie nützlich es wäre.
Fokus ist hier ein Feature, kein Mangel.

Zielgruppen, in dieser Reihenfolge:
1. **Selbstständige und Kleinunternehmen** in der Schweiz — stellen Rechnungen, rechnen
   MwSt ab, prüfen Zahlungseingänge.
2. **Treuhand und Buchhaltung** — brauchen schnelle, korrekte Einzelberechnungen.
3. **Entwickler:innen**, die Schweizer Zahlungsverkehr in eigene Software einbauen.

### Die Produktleiter

Wir bauen in drei Stufen. Jede Stufe muss allein funktionieren.

- **Stufe 1 — Rechner und Generatoren** (jetzt): Ein Input, ein Output, kein Zustand.
  QR-Rechnung, IBAN, MwSt, Skonto, Zahlungsfristen.
- **Stufe 2 — Parser und Viewer** (danach): Datei rein, Klarheit raus. camt.053-Viewer,
  pain.001-Generator. Hier entsteht der echte Abstand zur Konkurrenz.
- **Stufe 3 — Local-first-Anwendungen** (Ziel): Budgetplaner, später einfache
  Buchhaltung. Mit Zustand, aber weiterhin ohne Server.

**Jedes Tool aus Stufe 1 ist ein Baustein für Stufe 3.** Die MwSt-Logik, die heute im
Rechner steckt, ist morgen die MwSt-Logik der Buchhaltung. Deshalb ist `logic.ts`
framework-frei und sauber getestet — nicht aus Prinzipienreiterei, sondern weil wir
diesen Code wiederverwenden.

### Tonalität

Sachlich, knapp, präzise. Kein Marketing-Sprech, keine Ausrufezeichen, kein "einfach"
und kein "schnell und unkompliziert". Wir schreiben für Leute, die mit Geld arbeiten und
Genauigkeit über Begeisterung stellen. Das Tool beweist es, der Text behauptet es nicht.

---

## 2. Eiserne Regeln

### 2.1 Kein Backend. Niemals.

Jede Berechnung passiert im Browser. Keine API-Routen, keine Server-Endpoints, keine
Datenbank, kein `output: 'server'`. Wenn ein Tool zwingend einen Server braucht, wird es
nicht gebaut — oder zuerst diskutiert.

In dieser Nische ist das kein Kompromiss, sondern das stärkste Verkaufsargument:
**"Deine Finanzdaten verlassen deinen Browser nie."** Wer einen Kontoauszug hochlädt,
will nicht, dass er irgendwo landet. Bei uns landet er nirgends — er wird lokal gelesen.
Das ist auf jedem relevanten Tool sichtbar zu kommunizieren.

Folge davon: Wir sind kein Finanzintermediär, verarbeiten keine fremden Kundendaten und
lösen keine Bewilligungsfragen aus. Diese Eigenschaft geben wir nicht auf.

### 2.2 Geld ist niemals ein Float

`0.1 + 0.2 !== 0.3`. In einem Finanzprodukt ist das kein Kuriosum, sondern ein Defekt.

- Beträge werden **intern als ganzzahlige Rappen** geführt (`number` als Integer oder
  `bigint`), nie als Dezimal-Float.
- Umwandlung in die Anzeige passiert **ausschliesslich an der UI-Grenze**.
- Gerundet wird **einmal, am Ende**, nie zwischendurch.
- Rundungsregel und -richtung sind pro Anwendungsfall explizit und getestet.
  Kaufmännisches Runden auf Rappen ist der Default; die 5-Rappen-Rundung gilt nur für
  Barzahlung und wird nie stillschweigend angewendet.
- Jede Geldfunktion hat Tests mit klassischen Fallstricken: 0.005, 1.005, negative
  Beträge, sehr grosse Beträge, Rundung über mehrere Positionen.
- Multiplikation und Division existieren **nur** in Varianten, die den Rundungsmodus als
  Parameter verlangen. Es gibt keine stille Rundung.
- **Eingaben werden über `parseBetrag` gelesen, nie über `parseFloat`.** Akzeptiert
  werden mindestens `1'000.50`, `1000,50`, `1000.50`, `1 000.50` und führende/folgende
  Leerzeichen, inklusive der Apostroph- und Leerzeichenvarianten, die `Intl` für `de-CH`
  und `fr-CH` ausgibt. Alles andere wird als Fehler zurückgegeben, nie stillschweigend zu
  0 oder NaN. Dies ist die Stelle, an der Nutzereingaben auf unsere Zahlen treffen — sie
  existiert und ist getestet, bevor das erste Tool gebaut wird.
- **Parsing rundet nie.** Mehr als zwei Nachkommastellen sind ein Fehler, keine stille
  Korrektur. Runden ist ein fachlicher Entscheid und gehört dorthin, wo er begründet
  werden kann.
- **Mehrdeutige Eingaben werden abgewiesen, nicht geraten.** `1.000` kann tausend oder
  eins bedeuten; falsch geraten sind das drei Grössenordnungen. Dasselbe gilt für `1.005`
  — lesbar als 1005 oder als 1.00 mit zu vielen Stellen. `0.005` ist dagegen nicht
  mehrdeutig, weil `0'005` keine plausible Schreibweise ist. Die Fehlermeldung nennt bei
  Mehrdeutigkeit **beide korrekten Schreibweisen**, damit die Nutzerin entscheidet.
- Beträge und Stückpreise sind fachlich verschieden. Wenn später höhere Präzision nötig
  wird (Mengen, Einheitspreise), entsteht dafür ein **eigener Typ mit eigener
  Parse-Funktion** — `parseBetrag` wird dafür nicht aufgeweicht.

### 2.3 Fachdaten sind datiert, nie hartcodiert

Steuersätze, Feiertage und Fristen ändern sich. Ein falscher Satz auf einer Rechnung ist
unser Totalschaden.

- Alle Fachdaten liegen in `src/data/` als versionierte Dateien mit `gueltig_ab` und,
  wo bekannt, `gueltig_bis`.
- Jeder Datensatz trägt eine `quelle` (URL zur amtlichen Stelle) und ein `geprueft_am`.
- Berechnungen nehmen immer ein **Stichdatum** entgegen. Kein Tool rechnet implizit
  "mit den heutigen Sätzen" ohne das anzuzeigen.
- Jedes Tool zeigt sichtbar "Stand: <Datum> · Quelle: <Stelle>".

Bekannter Stand (Nachweis in den Datendateien führen, nicht hier):
- MwSt seit 01.01.2024: Normalsatz 8.1 %, reduziert 2.6 %, Beherbergung 3.8 %.
- Der Beherbergungs-Sondersatz ist befristet bis längstens 31.12.2027.
- Eine Erhöhung des Normalsatzes auf 8.8 % ist beschlossen, aber auf frühestens
  Januar 2028 verschoben. Die Datenstruktur muss diesen Wechsel abbilden können,
  ohne dass Tool-Code angefasst wird.

### 2.4 Spezifikationen sind versioniert

Für die QR-Rechnung gelten die *Schweizer Implementation Guidelines QR-Rechnung* von
SIX Interbank Clearing.

- **Aktueller Stand:** IG Version 2.3, gültig ab 21.11.2025 (Dokumentdatum 20.11.2023).
  Nur noch die **strukturierte Adresse** ist zugelassen; die kombinierte Adresse ist tot.
- **Kommend:** IG Version 2.4, in Kraft mit dem SIC-Release vom 13./14.11.2026.

Die Spec-Version ist ein **expliziter Parameter im Code**, keine verstreute Annahme.
Wir müssen 2.4 zuschalten können, ohne den Generator umzuschreiben. Das ist unsere
Chance, im November die erste korrekte 2.4-Implementation zu haben.

Weitere verbindliche Regeln: QR-IBAN erzwingt eine QR-Referenz und schliesst sie bei
normaler IBAN aus. Prüfziffern nach Modulo 97-10 (IBAN, Creditor Reference ISO 11649)
und Modulo 10 rekursiv (QR-Referenz). Alles mit offiziellen Testvektoren belegt.

### 2.5 Korrektheit schlägt Geschwindigkeit

Bei jeder Fachlogik im Finanzbereich gilt: **im Zweifel nachfragen, nie annehmen.**
Ein hübsches Tool, das falsch rechnet, ist schlimmer als kein Tool. Es kostet Vertrauen,
das wir nicht zurückkaufen können.

Konkret bedeutet das: Vor der Implementation einer Fachregel wird die Quelle benannt.
Ohne Quelle keine Regel. Erfundene Grenzwerte, geratene Fristen oder aus dem Gedächtnis
zitierte Prozentsätze sind ein schwerer Fehler.

**Fehlende Belege führen zu einer abgestuften Aussage, nicht zur Verweigerung.**
Was wir prüfen können, prüfen wir; was wir nicht belegen können, benennen wir als
ungeprüft. Beispiel: Bei einer ausländischen IBAN ist Modulo 97-10 landesunabhängig
rechenbar, Länge und Aufbau mangels geprüftem Register nicht. Dann lautet die Antwort
"Prüfziffer stimmt, Aufbau für dieses Land nicht geprüft" — nicht "unbekannt".
Ein Teilergebnis mit klarer Grenze ist ehrlich und nützlich. Ein pauschales Nein ist
nur bequem.

### 2.6 Keine Nutzerdaten verlassen den Browser

Kein Upload, kein Logging von Eingaben, keine Fremd-Fonts von CDNs, keine Tracking-Pixel,
keine Fehlerberichte mit Nutzerinhalten. Analytics nur cookiefrei und ohne Personenbezug.

### 2.7 Keine schweren Abhängigkeiten

Vor jedem npm-Paket: Geht es mit Plattform-APIs? Ausnahme sind Bibliotheken für
sicherheits- oder korrektheitskritische Aufgaben (QR-Encoding, PDF-Erzeugung) — dort ist
eine geprüfte Bibliothek besser als Eigenbau. Solche Ausnahmen werden begründet.

---

## 3. Stack

- **Astro 7**, `output: 'static'`, TypeScript `strict: true`
- Tailwind 4 mit den Tokens aus `src/styles/tokens.css` — nie rohe Hex-Werte im Markup
- Vitest für Logik, Playwright für Smoke-Tests
- Node-Version gemäss `.nvmrc`, Paketmanager npm

### Versionspolitik

Wir bleiben auf der aktuellen Major-Version des Frameworks. Ein Finanzprodukt, dessen
`npm audit` rot ist, verliert genau das Vertrauen, das sein einziges Kapital ist.

- `npm audit --audit-level=high` ist ein **CI-Gate**, kein Bericht.
- Sicherheitsupdates werden zeitnah eingespielt, nicht gesammelt.
- Bevor eine Version im Code festgeschrieben wird: prüfen, was aktuell ist. Angaben in
  dieser Datei können veraltet sein — bei Widerspruch zwischen Verfassung und Realität
  nachfragen, nicht stillschweigend das eine oder andere wählen.

### Stufe 3: Local-first

Sobald Anwendungen mit Zustand entstehen (Budgetplaner, Buchhaltung), gilt:

- Persistenz über **IndexedDB**, grosse Dateien über **OPFS**. Kein `localStorage` für
  Nutzdaten.
- **Export und Import sind Pflichtfunktionen, keine Extras.** Die Nutzerin muss ihre
  Daten jederzeit als Datei herausbekommen. Ohne Export dürfen keine Daten entstehen.
- Datenschema **von Anfang an versioniert**, mit Migrationspfad.
- Beim ersten Speichern klar erklären, wo die Daten liegen und dass sie beim Löschen der
  Browserdaten verschwinden. Ehrlichkeit über diesen Nachteil schafft mehr Vertrauen als
  Verschweigen.

---

## 4. Verzeichnisstruktur

```
src/
  components/       # geteilte UI-Bausteine
  layouts/          # BaseLayout, ToolLayout
  content/tools/    # Metadaten je Tool (Content Collection)
  data/             # Fachdaten, datiert und mit Quelle
  lib/money/        # Geldarithmetik — die Grundlage von allem
  lib/swiss/        # IBAN, Referenzen, Prüfziffern, MwSt-Logik
  pages/
    de/ fr/ en/     # gespiegelte Routen
  tools/<slug>/
    logic.ts        # reine Funktionen, framework-frei
    logic.test.ts
    Tool.astro      # UI-Island
  i18n/
  styles/tokens.css
```

Die Trennung `logic.ts` ↔ `Tool.astro` ist nicht verhandelbar. Kein `document`, kein
`window` in `logic.ts`. Diese Dateien sind der Kern, der später die Buchhaltung trägt.

### URL-Struktur

**`/<sprache>/<werkzeuge-segment>/<slug>/`** — flach, ohne Kategorie im Pfad.

Tools wechseln über die Jahre die Kategorie. URLs dürfen das nie. Kategorien sind
Filter auf der Übersichtsseite, keine Hierarchie im Pfad.

Pfadsegment und Slug werden **pro Sprache übersetzt**:
`/de/werkzeuge/iban-pruefer/` · `/fr/outils/verificateur-iban/`
Ein deutscher Slug rankt in der Romandie nicht.

Eine einmal veröffentlichte URL ist unveränderlich. Muss sie doch weichen, gibt es
eine dauerhafte Weiterleitung.

### Sprachen

Start mit **de**. Die Routing- und i18n-Struktur trägt **fr** von Anfang an — in der
Finanznische ist die Romandie relevanter Markt, nicht Optionalität. **en** für die
Entwickler-Tools. Keine Sprache wird nachträglich "eingebaut".

**Alle Sprachen sind in den Metadaten gleichrangig.** Keine Sprache steht privilegiert
in der Frontmatter-Wurzel, während die anderen in einem Unterobjekt hängen. Titel,
Beschreibung, Slug und Keywords liegen für jede Sprache unter demselben Schlüssel.
Fehlt eine Sprache, ist das ein bewusster, sichtbarer Zustand — kein Sonderfall im Code.

Die Domains `daxolo.com` und `daxolo.de` leiten dauerhaft auf `daxolo.ch` weiter.
Sie liefern niemals eigene Inhalte — doppelter Inhalt schadet der Sichtbarkeit.

---

## 5. Aufbau jedes Tools

Jedes Tool liefert vollständig:

- [ ] `logic.ts` mit reinen, exportierten Funktionen — Beträge in Rappen
- [ ] `logic.test.ts` — Happy Path, Randfälle, ungültige Eingaben, Rundungsfälle,
      und wo vorhanden **die offiziellen Testvektoren der Spezifikation**
- [ ] `Tool.astro` — Island, lädt bei Bedarf (`client:visible`)
- [ ] Eintrag in `src/content/tools/<slug>.md`: title, description, category,
      keywords, Sprachvarianten
- [ ] Routen in allen aktiven Sprachen
- [ ] Sichtbare Angabe "Stand · Quelle", wo Fachdaten einfliessen
- [ ] Haftungsausschluss, wo das Ergebnis rechtliche oder finanzielle Wirkung hat
- [ ] Erklärtext unter dem Tool (min. 150 Wörter): was es tut, wann man es braucht,
      welche Regel dahintersteht. Ablage in einer **eigenen Collection**, eine Datei je
      Sprache nach dem Schema `<slug>.<sprache>.md`. Eine fehlende Übersetzung ist eine
      fehlende Datei — sichtbar, ohne Sonderfall im Schema.
- [ ] Sinnvolle Defaults — beim Laden ein funktionierendes Beispiel, nie ein leeres
      Formular
- [ ] Copy-Button für jedes Ergebnis, mit sichtbarer Bestätigung

---

## 6. Design-System

Formensprache sind **Kacheln** — abgerundete Flächen, wie sie Schweizer Nutzer:innen von
SBB oder Swisscom kennen. Innerhalb der Kacheln gilt redaktionelle Ruhe: viel Weissraum,
Haarlinien statt Rahmen, Farbe nur mit Bedeutung.

Fünf Leitplanken, damit die Sammlung über vierzig Werkzeuge hinweg zusammengehört:

1. **Höchstens eine Verschachtelungsstufe.** Kachel enthält Inhalt oder Tabelle. Nie
   Kachel in Kachel in Kachel — sonst braucht es vier unterscheidbare Flächentöne in
   zwei Modi.
2. **Drei Radien, keiner mehr.** 16 px aussen, 12 px innen, 8 px für Felder. Pillenform
   nur für Buttons und Badges.
3. **Farbe nur mit Bedeutung.** Eine Markenfarbe, dazu Erfolg, Warnung, Fehler. Keine
   dekorative Einfärbung, keine Farbe je Kategorie.
4. **Symbole nur bei Status.** Kein Symbol je Werkzeug, kein Symbol je Kachel.
5. **Zahlen immer in Monospace und rechtsbündig.** Beträge, die untereinander verglichen
   werden, brauchen gleiche Ziffernbreite.

**Tabellen kommen als Ganzes in eine Kachel**, Zeilen werden durch Haarlinien getrennt.
Niemals eine Kachel je Datenzeile.

Markenfarbe und Statusfarben müssen auf den ersten Blick unterscheidbar bleiben. Wo
Markenfarbe und eine Statusfarbe aus derselben Familie stammen, wird der Abstand
bewusst hergestellt und geprüft — bei einem Prüfwerkzeug ist "gültig oder falsch" die
Kernaussage und darf nie mit Markenfläche verwechselt werden.

Farbprüfung umfasst zwei Messungen: Vorder- zu Hintergrund nach WCAG (4.5:1 für Text,
3:1 für Rahmen, Fokusringe und bedeutungstragende Grafik, gemessen gegen jede
angrenzende Fläche) und den Abstand bedeutungstragender Flächen untereinander nach
CIEDE2000 (Ziel dE ≥ 8). Beide Messungen laufen als automatischer Test über tokens.css
und sind ein CI-Gate.

Eine Farbrolle ist nur dann dekorativ, wenn die Oberfläche ohne sie vollständig bedienbar
bleibt und jede Komponente erkennbar ist. Jede Ausnahme im Farbtest nennt ihre Begründung an
diesem Kriterium, nicht nur das Wort „dekorativ“.

Alle Farbwerte liegen als Tokens in `src/styles/tokens.css`. Rohe Hex-Werte im Markup
sind ein Fehler.

Nachbearbeitung von gerendertem Markup ist auf eine explizite Begriffsliste beschränkt —
heute die Fachbegriffe, die nicht am Bindestrich umbrechen dürfen (`src/i18n/umbruch.ts`).
Sie wirkt ausschliesslich auf Textknoten, nie auf Tags, Attribute oder Code. Jeder neue
Begriff bringt seinen Test mit. Was sich im Markdown selbst ausdrücken lässt, wird dort
ausgedrückt und nicht nachbearbeitet.

---

## 7. Barrierefreiheit

Nicht optional, nicht "später".

- Jedes Input hat ein `<label>`. Placeholder ist kein Label.
- Vollständig per Tastatur bedienbar, sichtbarer Fokus-Ring.
- Ergebnisse und Fehler in `aria-live="polite"`.
- Kontrast mindestens 4.5:1, in beiden Themes.
- `prefers-reduced-motion` respektieren.
- Semantisches HTML vor ARIA. Ein `<button>` ist ein `<button>`, kein `<div>`.
- Zahlenfelder: `inputmode="decimal"`, und sowohl `1'000.50` als auch `1000,50`
  akzeptieren. Schweizer Nutzer:innen tippen beides.

---

## 8. Performance-Budget

- LCP < 1.5 s, CLS < 0.1
- JS pro Tool-Seite < 30 kB gzip (Ausnahmen für PDF- und QR-Erzeugung begründen)
- Lighthouse 100 / 100 / 100 / 100. Ein Wert unter 95 blockiert den Merge.
- Fonts self-hosted, `woff2`, maximal zwei Schriftdateien
- Bilder über Astros `<Image>`, immer mit Dimensionen

---

## 9. Fehlerbehandlung

Nutzereingaben sind ungültig, bis bewiesen ist, dass sie es nicht sind.

- Validierung inline während der Eingabe, nicht erst beim Absenden
- Fehlermeldungen sagen, **wie** man es richtig macht, nicht nur dass es falsch ist
- Kein Tool wirft eine unbehandelte Exception. Nie ein leerer Bildschirm.
- Bei Prüfziffernfehlern: sagen, welche Stelle nicht stimmt, nicht nur "ungültig"

---

## 10. Rechtliches

- Impressum und Datenschutzerklärung in allen Sprachen, aus dem Footer jeder Seite.
- Tools mit rechtlicher oder finanzieller Wirkung (QR-Rechnung, MwSt, Fristen, Lohn)
  tragen einen sichtbaren Haftungsausschluss direkt am Tool: Ergebnisse ohne Gewähr,
  keine Steuer- oder Rechtsberatung, Verantwortung bleibt bei der Nutzerin.
- Keine Cookies ohne technische Notwendigkeit. Damit kein Cookie-Banner.
- Marken und Standards Dritter (SIX, Swiss QR Code) korrekt benennen, nie eine
  Zertifizierung oder Partnerschaft suggerieren, die nicht besteht.

---

## 11. Git

- Branches: `feat/<slug>`, `fix/<beschreibung>`, `chore/<beschreibung>`
- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- Nie direkt auf `main`. `main` ist branch-protected.
- Ein Tool pro Pull Request.

### CI-Gates — jeder Punkt blockiert den Merge

1. Typecheck
2. Lint und Formatprüfung
3. Unit-Tests
4. Build
5. Playwright-Smoke-Tests
6. `npm audit --audit-level=high`
7. **Lighthouse CI** gegen den gebauten Output

Eine Qualitätsvorgabe, die niemand automatisch prüft, ist keine Vorgabe. Wenn Abschnitt 8
Lighthouse 100 fordert, muss die Pipeline es messen — sonst streichen wir die Forderung
ehrlicherweise.

---

## 12. Wenn du unsicher bist

Frag nach, statt zu raten. Zwingend bei:

- Schweizer Fachlogik — QR-Rechnung, IBAN-Regeln, MwSt, AHV, Fristen
- allem, was nach Server-Logik aussieht
- jedem Grenzwert, Prozentsatz oder Datum, für das du keine Quelle nennen kannst
- neuen Abhängigkeiten
- Rundungsverhalten, das nicht eindeutig spezifiziert ist

**Eine ehrliche Rückfrage kostet fünf Minuten. Eine falsche Zahl kostet das Projekt.**
