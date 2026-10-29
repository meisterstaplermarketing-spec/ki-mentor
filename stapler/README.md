# Stapler-KI

Eine eigenständige Gabelstapler-KI, die mit jeder Nutzung selbstständig schlauer wird –
**ohne OpenAI, Anthropic oder andere Fremdanbieter, ohne Token-Kosten.**
Die komplette Intelligenz läuft im Browser des Nutzers (auch offline).

Aufruf: `https://<deine-domain>/stapler/`

## Wie sie „denkt“

| Baustein | Datei | Aufgabe |
|---|---|---|
| Basiswissen | `wissen.js` | 41 Fachantworten (Staplerschein, UVV, Sicherheit, Batterien, Antriebe, Tragfähigkeit, Fehlersuche, Kauf/Miete …) mit Quellenangabe |
| Sprachverständnis | `engine.js` | Deutsche Normalisierung, Stemming, Fach-Synonyme (Akku = Batterie, UVV = Prüfung …), Tippfehler-Toleranz über Zeichen-Trigramme |
| Suche & Ranking | `engine.js` | BM25-Ranking + Abdeckungsprüfung + gelernte Gewichte; antwortet nur, wenn sie sicher genug ist – sonst rät sie **nicht** |

## Wie sie selbstständig schlauer wird

Sie lernt **ohne dass jemand etwas tun muss** – einfach durch Benutzung:

| Mechanismus | Was passiert |
|---|---|
| 🗣 Gesprächsverlauf | Formuliert jemand seine Frage sofort um, hat die Antwort nicht gepasst → wird für diese Formulierung abgewertet. Geht jemand zum nächsten Thema weiter, hat sie gepasst → wird bestärkt. |
| 🔗 Umformulierungen verknüpfen | Scheitert „Wann muss die Karre zum Doc?“, und die Umformulierung „Wie oft muss der Stapler zur UVV-Prüfung?“ trifft, versteht sie künftig auch die erste Formulierung. |
| 🧩 Eigene Begriffe | Wird ein unbekanntes Wort mehrfach (≥ 2 Belege) erfolgreich durch ein bekanntes ersetzt, lernt sie es als Synonym – für **alle** Antworten. |
| 📖 Dokumente lesen | PDFs, Text- oder Markdown-Dateien (Betriebsanleitungen, Hallenordnungen, Datenblätter) hochladen – sie zerlegt sie in Abschnitte und beantwortet danach Fragen dazu. Der PDF-Leser (pdf.js) liegt lokal in `vendor/`, kein fremder Server. |
| ✅ Offene Fragen selbst lösen | Kommt neues Wissen hinzu, prüft sie alle offenen Fragen erneut und hakt ab, was sie jetzt beantworten kann. |

Zusätzlich kann man sie aktiv trainieren:

- **👍 / 👎** – stärkeres Signal als das Gesprächsverhalten.
- **✏️ Korrigieren** – richtige Antwort eingeben, wird als neues Wissen gespeichert.
- **Offene Fragen beantworten** – im Bereich 🎓, die meistgestellten zuerst.

Was sie selbst gelernt hat, zeigt das Protokoll „Selbst gelernt“ im Bereich 🎓.

Sie **rät nicht**: Ist das entscheidende Wort einer Frage unbekannt oder die Trefferlage zu schwach,
sagt sie das und merkt sich die Frage – bei Staplern ist eine falsche Antwort schlimmer als keine.

Jeder Lernschritt ist ein **Ereignis** (Event). Ohne Datenbank bleibt das Gelernte im Browser.
Mit eigener Datenbank lernen alle Nutzer gemeinsam: Was die KI bei einem Kollegen lernt, weiß sie sofort bei allen.

## Wissensquellen (Dokumenten-Center)

Im Bereich 🎓 → „Wissensquellen“ kann man der KI einen **Link + Zugangscode** geben.
Sie liest dann alle Inhalte dieser Quelle und prüft **alle 6 Stunden selbstständig**, ob etwas
neu oder geändert ist – nur Neues wird gelernt, eine neue Version ersetzt die alte.

Voreingestellt ist das **Meisterstapler Dokumenten-Center** – der Dienst
`supabase/functions/stapler-wissen` im Supabase-Projekt „Meisterstapler Leads“. Er liefert:

| Inhalt | Quelle | Hinweis |
|---|---|---|
| Gerätekatalog (alle aktiven Geräte, technische Daten, Ausstattung) | `kat_products`, `kat_categories` | **ohne** Einkaufspreis, Bonus und Listenpreis |
| Online-Shop (Zubehör, Anbaugeräte …) | `app_settings` → `katalog` | mit den öffentlichen Shop-Preisen |
| Datenblätter (PDF) | Speicherordner `datasheets` | zeitlich begrenzte Download-Links |
| Noblelift-Dokumente (93 Broschüren und Datenblätter, deutsch und englisch) | Seite `noblelift-datenblaetter-app-drive.html` → Google Drive | neue Dateien kommen automatisch, sobald sie auf der Seite gelistet sind |
| Noblelift Service-Unterlagen (Verzeichnis je Modell mit Links) | dieselbe Seite → Noblelift-Serviceportal | Fehlercodes, Anleitungen, Service-Handbücher, Schalt-/Hydraulikpläne, Ersatzteillisten; ohne Videos, Bilder, Zertifikate |

Der Dienst antwortet nur mit dem Zugangscode. Weil alle Lernschritte geteilt werden, liest nur das
erste Gerät neue PDFs – alle anderen bekommen das Wissen direkt aus der gemeinsamen Datenbank.

Weitere Quellen: Ein direkter Link auf ein PDF, eine Text- oder Webseite funktioniert ebenfalls.
Blockiert der Browser den Abruf (CORS), holt der Dienst Links von meisterstapler.de und
down.noblelift.com serverseitig ab; andere Seiten sind nicht freigegeben. Neue Datenblätter einfach in den
Speicherordner `datasheets` legen bzw. Geräte im Katalog pflegen – die KI lernt sie von selbst.

## Gemeinsames Lernen

Ist bereits eingerichtet: Die App speichert alle Lernschritte in der Tabelle `stapler_events` im
Supabase-Projekt **„Stapler-Akademie“** (neben den Tabellen `ak_*` und `lt_*`, ohne diese zu berühren).
Jedes Gerät lernt dadurch automatisch von allen anderen. Kosten: keine, solange das Projekt im
kostenlosen Tarif bleibt.

- Der Anon Key darf in `stapler_events` nur **lesen und anhängen** – nicht ändern oder löschen,
  und er sieht keine Daten der Akademie oder der Tourenplanung.
- Ein Gerät kann im Bereich 🎓 → „Gemeinsames Lernen“ getrennt werden (Felder leeren → Verbinden).
- Für ein anderes Projekt: `supabase.sql` dort ausführen und URL/Key in der App eintragen
  (bzw. `DEFAULT_DB` in `index.html` ändern).

> Hinweis: Jeder, der die App öffnet, kann Lernschritte hinzufügen. Für einen öffentlichen Einsatz
> das Beibringen auf angemeldete Mitarbeiter beschränken (Supabase Auth + Insert-Policy nur für `authenticated`).

## Wissen erweitern

- Im Betrieb: über die App beibringen (empfohlen).
- Dauerhaft ins Basiswissen: Eintrag in `wissen.js` ergänzen (eindeutige `id`, nie ändern).
- Tests: `node tests/stapler-engine.test.js`

## Wichtig

Die Antworten ersetzen keine Betriebsanleitung, Gefährdungsbeurteilung oder Unterweisung.
Fachangaben (insb. Vorschriften und Preise) regelmäßig von einem Experten prüfen lassen.
