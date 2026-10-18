Der IBAN-Prüfer rechnet die Prüfziffer einer IBAN nach und zerlegt schweizerische und
liechtensteinische Nummern in ihre Bestandteile. Die Prüfung läuft vollständig in deinem
Browser; die eingegebene Nummer verlässt dein Gerät nicht.

### Was Modulo 97-10 leistet

Jede IBAN trägt an Stelle 3 und 4 eine zweistellige Prüfziffer. Sie entsteht nach dem
Verfahren Modulo 97-10 gemäss ISO/IEC 7064: Landescode und Prüfziffer wandern ans Ende,
Buchstaben werden zu Zahlen, und der Rest der Division durch 97 muss 1 ergeben. Das
Verfahren erkennt zuverlässig eine einzelne falsche Stelle und auch den häufigsten
Tippfehler überhaupt, zwei vertauschte Nachbarziffern.

Was es nicht leistet: Es sagt nicht, **welche** Stelle falsch ist. Rechnerisch stimmt nur
die Aussage, dass Prüfziffer und Rest nicht zusammenpassen — der Fehler kann ebenso gut in
der Kontonummer stecken. Deshalb nennt die Fehlermeldung die Prüfziffer, die zur
eingegebenen Kontonummer gehören würde, und überlässt dir den Schluss. Und es erkennt
nicht jede Verfälschung: Rund eine von 97 zufälligen Ziffernfolgen besteht die Prüfung
rein rechnerisch.

### Was eine QR-IBAN unterscheidet

Formal unterscheiden sich IBAN und QR-IBAN nicht; beide folgen ISO 13616. Der Unterschied
steckt an Stelle 5 bis 9, in der Instituts-Identifikation. Liegt sie im Bereich 30000 bis
31999, handelt es sich um eine QR-IID und damit um eine QR-IBAN. Diese Nummern sind für
das Verfahren mit QR-Referenz reserviert: Eine QR-IBAN verlangt zwingend eine QR-Referenz,
eine gewöhnliche IBAN schliesst sie aus. Wer beides vertauscht, produziert Rechnungen, die
Banken zurückweisen. Eine QR-IBAN dient ausserdem nur Zahlungseingängen.

### Warum das Konto trotzdem nicht existieren muss

Die Prüfziffer ist reine Arithmetik. Sie beweist, dass die Ziffernfolge in sich stimmig
ist — nicht, dass die Bank existiert, das Konto eröffnet ist, der Name zur Nummer passt
oder eine Zahlung ankommt. Das weiss nur die kontoführende Bank. Eine formal korrekte IBAN
kann auf ein längst geschlossenes Konto zeigen.

Für Länder ausserhalb der Schweiz und Liechtensteins rechnen wir die Prüfziffer ebenfalls,
weil das Verfahren landesunabhängig ist. Länge und Aufbau prüfen wir dort nicht, weil uns
dafür kein geprüftes Register vorliegt. Das Ergebnis sagt das ausdrücklich, statt eine
Sicherheit zu behaupten, die es nicht gibt.

Stand: 15.08.2026 · Quellen: SIX Group, Schweizer Implementation Guidelines QR-Rechnung
Version 2.3, Kapitel 2.8 und 2.10; SIX Group, IBAN — Standards Zahlungsverkehr Schweiz.
