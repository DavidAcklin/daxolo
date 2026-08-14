# Schriften

Beide Schriften stehen unter der SIL Open Font License 1.1 und werden selbst gehostet.
Kein CDN, keine Verbindung zu Dritten beim Seitenaufruf (CLAUDE.md 2.6).

| Datei                            | Schrift          | Schnitte | Herkunft          |
| -------------------------------- | ---------------- | -------- | ----------------- |
| `inter-latin.woff2`              | Inter (variabel) | 100–900  | Google Fonts, v20 |
| `jetbrains-mono-latin-400.woff2` | JetBrains Mono   | 400      | Google Fonts, v24 |

Beide Dateien sind auf den Subset **latin** beschränkt (U+0000–00FF plus die üblichen
Satzzeichen). Das deckt Deutsch und Französisch vollständig ab, inklusive `ä ö ü ß`,
`é è à ç` und `œ`. Für Zeichen ausserhalb des Bereichs greift über `unicode-range` die
Systemschrift.

Inter wird als variable Schrift ausgeliefert: eine Datei trägt 400 und 500, ein zweiter
Download entfällt.

- Inter: <https://github.com/rsms/inter> — Copyright (c) 2016 The Inter Project Authors
- JetBrains Mono: <https://github.com/JetBrains/JetBrainsMono> — Copyright 2020 The
  JetBrains Mono Project Authors

Lizenztext: <https://openfontlicense.org>
