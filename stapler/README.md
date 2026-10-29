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

## Gemeinsames Lernen einrichten (optional)

1. Supabase-Projekt anlegen (oder das vorhandene nutzen; Supabase lässt sich auch selbst hosten).
2. Inhalt von `supabase.sql` im SQL-Editor ausführen.
3. In der App: 🎓 → „Gemeinsames Lernen“ → Projekt-URL und Anon Key eintragen → **Verbinden**.

> Hinweis: Mit dem Anon Key kann jeder, der die App öffnet, Lernschritte hinzufügen. Für einen
> öffentlichen Einsatz das Beibringen auf angemeldete Mitarbeiter beschränken (Supabase Auth +
> Insert-Policy nur für `authenticated`).

## Wissen erweitern

- Im Betrieb: über die App beibringen (empfohlen).
- Dauerhaft ins Basiswissen: Eintrag in `wissen.js` ergänzen (eindeutige `id`, nie ändern).
- Tests: `node tests/stapler-engine.test.js`

## Wichtig

Die Antworten ersetzen keine Betriebsanleitung, Gefährdungsbeurteilung oder Unterweisung.
Fachangaben (insb. Vorschriften und Preise) regelmäßig von einem Experten prüfen lassen.
