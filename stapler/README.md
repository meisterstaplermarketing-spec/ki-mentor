# Stapler-KI

Eine eigenständige Gabelstapler-KI, die sich mit jeder Nutzung verbessert –
**ohne OpenAI, Anthropic oder andere Fremdanbieter, ohne Token-Kosten.**
Die komplette Intelligenz läuft im Browser des Nutzers (auch offline).

Aufruf: `https://<deine-domain>/stapler/`

## Wie sie „denkt“

| Baustein | Datei | Aufgabe |
|---|---|---|
| Basiswissen | `wissen.js` | 41 Fachantworten (Staplerschein, UVV, Sicherheit, Batterien, Antriebe, Tragfähigkeit, Fehlersuche, Kauf/Miete …) mit Quellenangabe |
| Sprachverständnis | `engine.js` | Deutsche Normalisierung, Stemming, Fach-Synonyme (Akku = Batterie, UVV = Prüfung …), Tippfehler-Toleranz über Zeichen-Trigramme |
| Suche & Ranking | `engine.js` | BM25-Ranking + Abdeckungsprüfung + gelernte Gewichte; antwortet nur, wenn sie sicher genug ist – sonst rät sie **nicht** |

## Wie sie sich verbessert

1. **👍 / 👎 Feedback** – verstärkt bzw. schwächt die Verbindung zwischen Frage-Begriffen und Antwort.
   Nach einigen Bewertungen landen die richtigen Antworten automatisch vorne.
2. **✏️ Korrigieren** – die richtige Antwort wird als neues Wissen gespeichert, die falsche für diese Frage abgewertet.
3. **Offene Fragen** – alles, was sie nicht sicher weiß, sammelt sie (mit Häufigkeit).
   Im Bereich „Lernen & Wissen“ (🎓 oben rechts) beantworten Experten diese Fragen – die meistgestellten zuerst.

Jeder Lernschritt ist ein **Ereignis** (Event). Ohne Datenbank bleibt das Gelernte im Browser.
Mit eigener Datenbank lernen alle Nutzer gemeinsam: Was ein Kollege beibringt, weiß die KI sofort bei allen.

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
