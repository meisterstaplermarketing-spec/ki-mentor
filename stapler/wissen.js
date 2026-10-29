/*
 * Basiswissen der Stapler-KI.
 * Jeder Eintrag: id (stabil, nie ändern), category, question, alt (weitere Formulierungen),
 * keywords, answer, source.
 * Neues Wissen lernt die KI im Betrieb dazu – dieses Grundwissen kann aber jederzeit
 * erweitert werden. Hinweis: Angaben ersetzen keine Betriebsanleitung oder Gefährdungsbeurteilung.
 */
(function (root) {
  'use strict';

  const WISSEN = [
    // ── Über die KI ──
    {
      id: 'ki-hilfe', category: 'Über mich',
      question: 'Was kannst du? Wer bist du?',
      alt: ['Hilfe', 'Wie funktionierst du', 'Was weißt du'],
      keywords: ['hilfe', 'hallo', 'start', 'funktion'],
      answer: 'Ich bin die **Stapler-KI** – ein eigenständiger Assistent rund um Gabelstapler. Ich laufe komplett ohne externe KI-Anbieter und ohne Token-Kosten.\n\nIch helfe bei: **Staplerschein & Schulung**, **Sicherheit & Fahrregeln**, **UVV-Prüfung & Wartung**, **Batterien & Antriebe**, **Tragfähigkeit**, **Bauarten & Anbaugeräte**, **Fehlersuche**, **Kauf, Miete & Gebrauchte**.\n\nBewerte meine Antworten mit 👍/👎 oder bring mir mit „Korrigieren“ das Richtige bei – so werde ich mit jeder Nutzung besser.',
      source: 'Stapler-KI',
    },
    {
      id: 'ki-lernen', category: 'Über mich',
      question: 'Wie lernst du dazu? Wie verbesserst du dich?',
      alt: ['Kann ich dir etwas beibringen', 'selbst lernen'],
      keywords: ['lernen', 'beibringen', 'verbessern', 'trainieren', 'feedback', 'korrigieren'],
      answer: 'Ich lerne auf drei Wegen:\n1. **Feedback** – 👍 verstärkt die Verbindung zwischen deiner Frage und meiner Antwort, 👎 schwächt sie.\n2. **Korrekturen** – über „Korrigieren“ gibst du die richtige Antwort ein; ich speichere sie als neues Wissen.\n3. **Offene Fragen** – Fragen, die ich nicht sicher beantworten kann, sammle ich. Im Bereich „Lernen“ können Experten sie nachträglich beantworten.\n\nIst eine eigene Datenbank verbunden, teile ich alles Gelernte mit allen Nutzern.',
      source: 'Stapler-KI',
    },

    // ── Staplerschein & Ausbildung ──
    {
      id: 'schein-pflicht', category: 'Staplerschein',
      question: 'Brauche ich einen Staplerschein, um Gabelstapler zu fahren?',
      alt: ['Wer darf Stapler fahren', 'Voraussetzungen Staplerfahrer', 'Ohne Schein fahren'],
      keywords: ['voraussetzung', 'darf', 'erlaubt', 'beauftragung', 'pflicht'],
      answer: 'Ja. Nach **DGUV Vorschrift 68 (§ 7)** darf ein Stapler mit Fahrersitz oder Fahrerstand nur selbstständig fahren, wer:\n• **mindestens 18 Jahre** alt ist,\n• körperlich und geistig **geeignet** ist,\n• **ausgebildet** wurde und seine Befähigung nachgewiesen hat (Staplerschein),\n• vom Unternehmer **schriftlich beauftragt** ist.\n\nOhne Ausbildung und schriftlichen Fahrauftrag zu fahren, verstößt gegen die Unfallverhütungsvorschrift – im Schadensfall drohen Probleme mit Versicherung und Haftung.',
      source: 'DGUV Vorschrift 68',
    },
    {
      id: 'schein-ausbildung', category: 'Staplerschein',
      question: 'Wie läuft die Ausbildung zum Staplerschein ab und wie lange dauert sie?',
      alt: ['Staplerschein machen', 'Staplerschein Dauer', 'Staplerschein Kosten', 'Wo mache ich den Staplerschein'],
      keywords: ['dauer', 'lange', 'tage', 'theorie', 'praxis', 'kosten', 'machen', 'kurs'],
      answer: 'Die Ausbildung richtet sich nach dem **DGUV Grundsatz 308-001** und besteht aus:\n• **Theorie**: Rechtsgrundlagen, Unfallgeschehen, Aufbau & Funktion, Standsicherheit, Traglastdiagramm, Fahrregeln, Prüfungen.\n• **Praxis**: Fahrübungen, Lastaufnahme, Stapeln, Regalbedienung.\n• **Abschlussprüfung** in Theorie und Praxis.\n\nDie Grundausbildung dauert je nach Vorkenntnissen meist **1 bis 3 Tage**. Die Kosten liegen je nach Anbieter typischerweise im Bereich von etwa **150–400 €**. Für Sondergeräte (z. B. Teleskoplader, Mitgänger-Geräte) gibt es Zusatzausbildungen.',
      source: 'DGUV Grundsatz 308-001',
    },
    {
      id: 'schein-gueltig', category: 'Staplerschein',
      question: 'Wie lange ist der Staplerschein gültig? Muss er erneuert werden?',
      alt: ['Staplerschein abgelaufen', 'Staplerschein verlängern', 'Gültigkeit Staplerschein'],
      keywords: ['gultig', 'gultigkeit', 'ablauf', 'verlangern', 'erneuern', 'unterweisung', 'jahrlich'],
      answer: 'Der Staplerschein selbst hat **kein gesetzliches Ablaufdatum**. Aber:\n• Fahrer müssen **mindestens einmal jährlich unterwiesen** werden (DGUV Vorschrift 1, § 4) – dokumentiert.\n• Der **schriftliche Fahrauftrag** gilt nur für den jeweiligen Betrieb und kann befristet sein.\n• Wer lange nicht gefahren ist oder auf ein anderes Gerät wechselt, braucht eine **Einweisung bzw. Zusatzausbildung**.',
      source: 'DGUV Vorschrift 1 / DGUV Vorschrift 68',
    },
    {
      id: 'schein-strasse', category: 'Staplerschein',
      question: 'Darf ich mit dem Stapler auf öffentlichen Straßen fahren?',
      alt: ['Stapler Straßenverkehr', 'Stapler Zulassung', 'Führerschein Klasse für Stapler'],
      keywords: ['strass', 'offentlich', 'verkehr', 'zulassung', 'klasse', 'kennzeichen', 'stvo'],
      answer: 'Nur unter Voraussetzungen:\n• Der Stapler braucht eine **Betriebserlaubnis/Zulassung** für den Straßenverkehr (Beleuchtung, Spiegel, ggf. Kennzeichen) und eine **Haftpflichtversicherung**.\n• Der Fahrer braucht zusätzlich zum Staplerschein einen **Pkw-Führerschein der passenden Klasse** – für Stapler bis 25 km/h in der Regel **Klasse L** (in Klasse B enthalten).\n• Lasten müssen gesichert sein, Gabeln dürfen ohne Kennzeichnung/Schutz nicht ungesichert herausragen.\n\nIm Zweifel vorab bei der Zulassungsstelle nachfragen.',
      source: 'StVZO / FeV',
    },

    // ── Sicherheit & Fahrregeln ──
    {
      id: 'sicher-fahrregeln', category: 'Sicherheit',
      question: 'Welche Fahrregeln gelten beim Staplerfahren?',
      alt: ['Wie fahre ich richtig Stapler', 'Regeln Gabelstapler', 'sicher fahren'],
      keywords: ['regel', 'fahren', 'richtig', 'verhalten', 'tipps'],
      answer: '**Die wichtigsten Fahrregeln:**\n• Last **abgesenkt** (knapp über dem Boden) und **Hubgerüst zurückgeneigt** transportieren.\n• Bei **Sichtbehinderung durch die Last rückwärts** fahren oder einen Einweiser nutzen.\n• Geschwindigkeit an Boden, Last und Umgebung anpassen, Kurven langsam fahren.\n• **Gurt bzw. Rückhaltesystem** immer benutzen.\n• Keine Personen mitnehmen oder anheben (Ausnahme: zugelassene Einrichtungen).\n• Niemand darf sich **unter angehobenen Lasten** aufhalten.\n• Auf Fußgänger achten, Blickkontakt suchen, an unübersichtlichen Stellen hupen.\n• Hände, Arme und Füße bleiben innerhalb des Fahrerschutzdachs.',
      source: 'DGUV Vorschrift 68 / DGUV Information 208-004',
    },
    {
      id: 'sicher-gefaelle', category: 'Sicherheit',
      question: 'Wie fahre ich mit Last auf Steigungen oder Rampen?',
      alt: ['Stapler bergab', 'Stapler bergauf', 'Rampe Gefälle Last'],
      keywords: ['steigung', 'gefall', 'rampe', 'bergab', 'bergauf', 'schrag', 'neigung'],
      answer: 'Auf Steigungen und Gefällen gilt: **Die Last zeigt immer bergauf.**\n• **Bergauf vorwärts** fahren, **bergab rückwärts** fahren.\n• Niemals auf der Steigung **wenden** oder **quer** zur Steigung fahren – Kippgefahr!\n• Last nicht auf der Rampe anheben oder absetzen.\n• Ohne Last ist es umgekehrt: Gabeln zeigen bergab.\n• Langsam fahren und die zulässige Steigfähigkeit des Staplers beachten.',
      source: 'DGUV Information 208-004',
    },
    {
      id: 'sicher-kippen', category: 'Sicherheit',
      question: 'Was tun, wenn der Stapler umkippt?',
      alt: ['Stapler kippt um', 'Verhalten beim Kippen', 'Abspringen Stapler'],
      keywords: ['kippt', 'umkipp', 'abspring', 'verhalten', 'notfall'],
      answer: '**Niemals abspringen!** Die meisten tödlichen Kippunfälle passieren, weil der Fahrer abspringt und vom Schutzdach erschlagen wird.\n\nRichtig ist:\n1. **Sitzen bleiben** und angeschnallt bleiben.\n2. **Lenkrad festhalten**, Füße abstützen.\n3. **Gegen die Kipprichtung lehnen.**\n\nDeshalb ist das Anlegen des Gurts bzw. Schließen des Rückhaltesystems Pflicht.',
      source: 'DGUV Information 208-004',
    },
    {
      id: 'sicher-standsicherheit', category: 'Sicherheit',
      question: 'Warum kippt ein Stapler? Was ist die Standsicherheit?',
      alt: ['Stabilitätsdreieck', 'Stützdreieck', 'Kippgefahr Ursachen'],
      keywords: ['standsicherheit', 'stabilitat', 'dreieck', 'schwerpunkt', 'kippgefahr', 'ursach', 'langs', 'seitlich'],
      answer: 'Ein Gegengewichtsstapler steht auf einem gedachten **Stützdreieck** (Vorderräder + Pendelpunkt der Hinterachse). Solange der gemeinsame Schwerpunkt von Stapler und Last innerhalb dieses Dreiecks liegt, ist er standsicher.\n\n**Typische Kippursachen:**\n• **Seitlich**: zu schnelle Kurvenfahrt, Kurve mit angehobener Last, Fahren quer zum Gefälle, Bodenunebenheiten.\n• **Nach vorn**: Überlast, Lastschwerpunkt zu weit vorn, Vorneigen mit hoher Last, starkes Bremsen bergab.\n\nDeshalb: Last tief, Mast zurückgeneigt, langsam in Kurven, Traglastdiagramm einhalten.',
      source: 'DGUV Information 208-004',
    },
    {
      id: 'sicher-personen', category: 'Sicherheit',
      question: 'Darf ich Personen mit dem Stapler mitnehmen oder anheben?',
      alt: ['Person auf Gabel', 'Mitfahrer Stapler', 'Arbeitsbühne Stapler'],
      keywords: ['person', 'mitnehm', 'anheb', 'hochheb', 'arbeitsbuhn', 'korb', 'palett'],
      answer: '**Nein** – Personen auf Gabeln, Paletten oder in Gitterboxen zu transportieren oder anzuheben ist **verboten**.\n\nAusnahmen:\n• **Mitfahren** nur auf einem vom Hersteller vorgesehenen **Beifahrersitz**.\n• **Anheben** nur in einer dafür **zugelassenen, fest verriegelten Arbeitsbühne** (Arbeitskorb), mit eingewiesenem Fahrer, der den Stapler währenddessen nicht verlässt, und nur als Ausnahme für gelegentliche Arbeiten.',
      source: 'DGUV Vorschrift 68',
    },
    {
      id: 'sicher-abstellen', category: 'Sicherheit',
      question: 'Wie stelle ich den Stapler richtig ab?',
      alt: ['Stapler parken', 'Stapler verlassen', 'Schlüssel abziehen'],
      keywords: ['abstell', 'park', 'verlass', 'schlussel', 'feststellbrems', 'absteig'],
      answer: '**Stapler richtig abstellen:**\n1. Gabeln **ganz absenken**, Spitzen leicht nach vorn auf den Boden neigen.\n2. **Feststellbremse** anziehen, Fahrschalter in Neutral.\n3. Motor aus, **Schlüssel abziehen** (gegen unbefugte Benutzung).\n4. Nicht an Gefällen, nicht vor Notausgängen, Feuerlöschern oder auf Verkehrswegen abstellen.\n5. Treibgasstapler nicht in Kellern oder Gruben abstellen – Gas ist schwerer als Luft.',
      source: 'DGUV Vorschrift 68',
    },
    {
      id: 'sicher-tageskontrolle', category: 'Sicherheit',
      question: 'Was muss ich vor Schichtbeginn am Stapler prüfen?',
      alt: ['tägliche Prüfung Stapler', 'Sichtprüfung vor Arbeitsbeginn', 'Checkliste Stapler täglich', 'Abfahrtskontrolle'],
      keywords: ['taglich', 'schicht', 'arbeitsbeginn', 'checklist', 'vorher', 'sichtprufung', 'abfahrtskontroll'],
      answer: '**Tägliche Einsatzprüfung durch den Fahrer:**\n• **Bremsen** (Betriebs- und Feststellbremse)\n• **Lenkung** – kein übermäßiges Spiel\n• **Hupe, Beleuchtung**, Warneinrichtungen\n• **Hydraulik** – dicht, keine Ölspuren, Funktion Heben/Senken/Neigen\n• **Gabelzinken & Ketten** – Risse, Verformung, Sicherung der Zinken\n• **Reifen** – Schäden, Luftdruck\n• **Fahrerschutzdach, Gurt/Rückhaltesystem**\n• Elektro: **Batteriestecker, Kabel, Ladezustand**; Verbrenner: **Kraftstoff, Öl, Kühlwasser**; Gas: **Flasche & Anschluss dicht**\n\nMängel sofort melden – bei sicherheitsrelevanten Mängeln Stapler **nicht benutzen**.',
      source: 'DGUV Vorschrift 68',
    },
    {
      id: 'sicher-lkw', category: 'Sicherheit',
      question: 'Was muss ich beim Be- und Entladen von Lkw beachten?',
      alt: ['Stapler auf Lkw fahren', 'Ladebrücke', 'Lkw entladen Stapler'],
      keywords: ['lkw', 'beladen', 'entlad', 'ladebruck', 'rampe', 'auflieg', 'container'],
      answer: '**Beim Be- und Entladen von Lkw:**\n• Lkw gegen **Wegrollen sichern** (Feststellbremse, Unterlegkeile, ggf. Verriegelung an der Rampe).\n• **Tragfähigkeit** von Ladebrücke, Ladefläche und Rampe prüfen – sie müssen Stapler + Last tragen.\n• Ladebrücke sicher auflegen, Spalt und Höhenunterschied beachten.\n• Langsam und gerade über die Ladebrücke fahren.\n• Für Container/Planen-Lkw einen Stapler mit **Freihub** verwenden.\n• Auf ausreichende Beleuchtung im Laderaum achten.',
      source: 'DGUV Information 208-004',
    },
    {
      id: 'sicher-fussgaenger', category: 'Sicherheit',
      question: 'Wie schütze ich Fußgänger im Staplerverkehr?',
      alt: ['Fußgänger Stapler Unfall', 'Blue Spot', 'Verkehrswege Halle'],
      keywords: ['fussgang', 'verkehrsweg', 'halle', 'blue', 'spot', 'warnlicht', 'kollision', 'markierung'],
      answer: '**Fußgängerschutz:**\n• Verkehrswege für Stapler und Fußgänger **trennen und markieren**.\n• Geschwindigkeit in Bereichen mit Fußgängern begrenzen.\n• **Warnlichter** (z. B. Blue Spot, Red Line) und Rundumleuchten nutzen.\n• Spiegel an unübersichtlichen Kreuzungen.\n• Fahrer: Blickkontakt suchen, hupen, im Zweifel anhalten.\n• Fußgänger: Warnwesten tragen, nicht im Fahrweg aufhalten, nie hinter rückwärtsfahrende Stapler treten.',
      source: 'ASR A1.8',
    },

    // ── Tragfähigkeit ──
    {
      id: 'last-traglastdiagramm', category: 'Tragfähigkeit',
      question: 'Wie lese ich das Traglastdiagramm?',
      alt: ['Traglastschild', 'Tragfähigkeitsdiagramm', 'Wie viel darf ich heben'],
      keywords: ['diagramm', 'schild', 'tabell', 'lesen', 'hoch', 'wieviel', 'gewicht', 'hubhoh'],
      answer: 'Das **Traglastdiagramm** (Tragfähigkeitsschild) am Stapler zeigt, wie viel kg du heben darfst – abhängig von:\n• **Lastschwerpunktabstand** (Abstand des Lastschwerpunkts vom Gabelrücken, in mm) und\n• **Hubhöhe**.\n\n**So geht\'s:** Lastschwerpunkt der Last ermitteln (bei gleichmäßiger Last = halbe Lastlänge) → im Diagramm diesen Abstand suchen → bei der gewünschten Hubhöhe die zulässige Last ablesen.\n\nJe weiter der Schwerpunkt vorn liegt und je höher gehoben wird, desto **weniger** darf die Last wiegen. Anbaugeräte verringern die Tragfähigkeit zusätzlich – dann gilt das Schild für das Anbaugerät.',
      source: 'DGUV Information 208-004',
    },
    {
      id: 'last-schwerpunkt', category: 'Tragfähigkeit',
      question: 'Was bedeutet Lastschwerpunkt 500 mm? Was ist die Nenntragfähigkeit?',
      alt: ['Lastschwerpunktabstand', 'Nennlast', 'Resttragfähigkeit'],
      keywords: ['500', '600', 'mm', 'lastschwerpunkt', 'nenn', 'rest', 'abstand'],
      answer: 'Die **Nenntragfähigkeit** (z. B. 2.500 kg) gilt nur bei einem **Standard-Lastschwerpunktabstand** – bei üblichen Staplern bis ca. 5 t meist **500 mm**, bei größeren Geräten 600 mm oder mehr.\n\nLiegt der Schwerpunkt weiter vorn (z. B. lange Kisten, quer aufgenommene Paletten), sinkt die zulässige Last – die **Resttragfähigkeit**. Ebenso bei großer Hubhöhe oder mit Anbaugeräten.\n\nDie verbindlichen Werte stehen immer auf dem **Traglastdiagramm** des Staplers – niemals schätzen.',
      source: 'DIN ISO 3691-1',
    },
    {
      id: 'last-ueberlast', category: 'Tragfähigkeit',
      question: 'Was passiert bei Überlast? Darf ich mehr heben, wenn ich Gegengewicht anbringe?',
      alt: ['Stapler überladen', 'Zusatzgewicht hinten', 'Personen als Gegengewicht'],
      keywords: ['uberlast', 'uberlad', 'gegengewicht', 'zusatz', 'schwer', 'zu viel'],
      answer: '**Überlast ist eine der häufigsten Kippursachen** (nach vorn). Zusätzlich drohen Schäden an Mast, Ketten, Zinken und Hydraulik.\n\n**Verboten:** zusätzliches Gegengewicht anbringen, Personen als „Gegengewicht“ auf das Heck setzen oder Sicherheitseinrichtungen überbrücken. Die Standsicherheit ist vom Hersteller berechnet und geprüft.\n\nIst die Last zu schwer: größeren Stapler verwenden oder Last aufteilen.',
      source: 'DGUV Vorschrift 68',
    },

    // ── Prüfung & Wartung ──
    {
      id: 'pruef-uvv', category: 'Prüfung & Wartung',
      question: 'Wie oft muss ein Stapler geprüft werden? Was ist die UVV-Prüfung?',
      alt: ['UVV Prüfung Stapler', 'jährliche Prüfung', 'Prüfplakette Stapler', 'Wer darf Stapler prüfen'],
      keywords: ['oft', 'jahrlich', 'plakett', 'sachkundig', 'befahigt', 'prufbuch', 'protokoll', 'intervall'],
      answer: 'Stapler müssen **mindestens einmal jährlich** von einer **befähigten Person** (Sachkundiger) geprüft werden – die sogenannte **UVV-Prüfung** (DGUV Vorschrift 68 § 37, BetrSichV).\n\n• Geprüft werden u. a. Bremsen, Lenkung, Hubgerüst, Ketten, Gabeln, Hydraulik, Elektrik, Schutzeinrichtungen und Schilder.\n• Das Ergebnis wird **dokumentiert** (Prüfbuch/Protokoll), meist mit einer **Prüfplakette** am Stapler.\n• Bei hoher Beanspruchung (Mehrschicht, Kühlhaus, Gießerei) können **kürzere Intervalle** nötig sein – das legt die Gefährdungsbeurteilung fest.\n• Zusätzlich gilt die **tägliche Sichtprüfung** durch den Fahrer.',
      source: 'DGUV Vorschrift 68 § 37 / BetrSichV',
    },
    {
      id: 'pruef-wartung', category: 'Prüfung & Wartung',
      question: 'Wie oft muss ein Stapler gewartet werden?',
      alt: ['Wartungsintervall Stapler', 'Inspektion Stapler', 'Service Stapler'],
      keywords: ['oft', 'betriebsstund', 'intervall', 'olwechsel', 'filter', 'regelmassig'],
      answer: 'Die Wartung richtet sich nach den **Herstellervorgaben** – typischerweise nach **Betriebsstunden** (häufig alle **500–1.000 Bh**) oder mindestens **jährlich**, je nachdem, was zuerst eintritt.\n\n**Typische Wartungspunkte:** Motoröl & Filter (Verbrenner), Hydrauliköl & -filter, Ketten schmieren und Längung prüfen, Mast & Lager, Bremsen, Reifen, Batterie & Elektrik.\n\nRegelmäßige Wartung senkt Ausfälle und Kosten und ist Grundlage für Gewährleistung und Werterhalt. Wartung ≠ UVV-Prüfung – beides ist nötig, kann aber oft im selben Termin erledigt werden.',
      source: 'Herstellerangaben',
    },
    {
      id: 'pruef-gabeln', category: 'Prüfung & Wartung',
      question: 'Wann müssen Gabelzinken ausgetauscht werden?',
      alt: ['Gabelzinken Verschleiß', 'Gabeln abgenutzt', 'Zinken prüfen'],
      keywords: ['austausch', 'wechsel', 'verschleiss', 'abgenutzt', 'riss', 'verbog', 'dick', '10'],
      answer: '**Gabelzinken sind auszutauschen bei:**\n• **10 % Verschleiß** der ursprünglichen Dicke (gemessen am Zinkenblatt/Knick) – die Tragfähigkeit sinkt dann bereits um ca. 20 %.\n• **Rissen**, besonders im Bereich des Zinkenknicks.\n• **Verbiegung** oder ungleicher Höhe der Zinkenspitzen (Richtwert: Höhendifferenz max. ca. 3 % der Zinkenlänge).\n• Defekter **Zinkenarretierung**.\n\nGabelzinken **nie schweißen oder richten** – immer paarweise ersetzen und auf die passende Tragfähigkeit achten.',
      source: 'ISO 5057',
    },
    {
      id: 'pruef-ketten', category: 'Prüfung & Wartung',
      question: 'Wann müssen die Hubketten getauscht werden?',
      alt: ['Ketten Längung Stapler', 'Lastketten prüfen', 'Kette schmieren'],
      keywords: ['kett', 'hubkett', 'lastkett', 'langung', 'schmier'],
      answer: 'Hubketten (Lastketten) werden getauscht, wenn ihre **Längung ca. 3 %** erreicht (Herstellerangabe beachten), sowie bei **Rissen, verdrehten oder steifen Gliedern, Korrosion** oder beschädigten Bolzen.\n\n**Pflege:** regelmäßig reinigen und mit geeignetem Kettenschmierstoff schmieren, beide Ketten gleichmäßig spannen. Ketten immer **paarweise** tauschen und die Kettenendbefestigungen mitprüfen.',
      source: 'Herstellerangaben',
    },

    // ── Antriebe ──
    {
      id: 'antrieb-vergleich', category: 'Antriebe',
      question: 'Elektro, Diesel oder Gas – welcher Stapler-Antrieb ist der richtige?',
      alt: ['Unterschied Elektrostapler Dieselstapler', 'Vergleich Antriebsarten', 'Welcher Antrieb'],
      keywords: ['unterschied', 'vergleich', 'antrieb', 'welch', 'besser', 'vorteil', 'nachteil', 'innen', 'aussen'],
      answer: '**Elektro**\n✅ emissionsfrei, leise, ideal für Hallen, geringe Energie- und Wartungskosten\n⚠️ Ladezeiten bzw. Batteriewechsel, höhere Anschaffung (Batterie)\n\n**Diesel**\n✅ viel Leistung, schnell betankt, robust für außen und schwere Lasten\n⚠️ Abgase & Lärm – in geschlossenen Hallen nur eingeschränkt (Abgasnachbehandlung, Lüftung)\n\n**Treibgas (LPG)**\n✅ flexibel innen/außen, schneller Flaschenwechsel, sauberer als Diesel\n⚠️ dennoch Abgase (CO), Flaschenlagerung, nicht in Kellern/Gruben abstellen\n\n**Faustregel:** überwiegend innen → Elektro; überwiegend außen/schwer → Diesel; gemischt → Treibgas oder Elektro mit Lithium-Batterie.',
      source: 'Praxiswissen',
    },
    {
      id: 'antrieb-gas-wechsel', category: 'Antriebe',
      question: 'Wie wechsle ich die Gasflasche am Treibgasstapler?',
      alt: ['Gasflasche tauschen', 'Treibgasflasche wechseln', 'LPG Flasche anschließen'],
      keywords: ['flasch', 'wechsel', 'tausch', 'anschliess', 'ventil'],
      answer: '**Gasflasche wechseln (nur unterwiesene Personen, im Freien oder gut belüftet, kein Feuer/Rauchen):**\n1. **Flaschenventil schließen** und Motor laufen lassen, bis er ausgeht (Leitung leer).\n2. Zündung aus.\n3. **Schutzhandschuhe** tragen – austretendes Flüssiggas verursacht Kälteverbrennungen.\n4. Anschluss lösen, leere Flasche entnehmen.\n5. Volle **Staplerflasche (Flüssigentnahme)** in korrekter Lage einsetzen (Markierung/Pfeil beachten) und sichern.\n6. Dichtung prüfen, Anschluss handfest verschrauben, Ventil öffnen.\n7. **Dichtheit prüfen** (Lecksuchspray) – nie mit offener Flamme.',
      source: 'DGUV Regel 110-010 / Herstellerangaben',
    },

    // ── Batterien ──
    {
      id: 'batt-laden', category: 'Batterie',
      question: 'Wie lade ich die Staplerbatterie richtig?',
      alt: ['Blei-Säure Batterie laden', 'Batterie Pflege Stapler', 'Zwischenladen Stapler', 'Wasser nachfüllen Batterie'],
      keywords: ['laden', 'zwischenlad', 'tiefentlad', 'wasser', 'destilliert', 'pfleg', 'saur', 'blei'],
      answer: '**Blei-Säure-Batterie (klassisch):**\n• Laden, wenn die Restkapazität bei ca. **20–30 %** liegt – **Tiefentladung vermeiden**.\n• **Vollständig laden**, unnötiges Zwischenladen vermeiden (verkürzt die Lebensdauer, außer die Batterie ist dafür ausgelegt).\n• **Wasser** (demineralisiert/destilliert) **nach dem Laden** nachfüllen, nicht vorher.\n• Batteriedeckel beim Laden öffnen, Pole sauber halten.\n\n**Sicherheit im Ladebereich:** Beim Laden entsteht **Wasserstoff (Knallgas)** → gut lüften, **Rauchen und offenes Feuer verboten**, Schutzbrille und säurefeste Handschuhe, Augendusche bereithalten.\n\n**Lithium-Ionen:** Zwischenladen jederzeit möglich, kein Wasser nachfüllen, keine Gasung.',
      source: 'DIN EN IEC 62485-3 / Herstellerangaben',
    },
    {
      id: 'batt-lithium', category: 'Batterie',
      question: 'Lohnt sich eine Lithium-Ionen-Batterie für den Stapler?',
      alt: ['Lithium oder Blei Batterie', 'Vorteile Lithium Stapler', 'Li-Ion Stapler'],
      keywords: ['lohnt', 'vorteil', 'nachteil', 'blei', 'vergleich', 'lebensdau', 'zykl'],
      answer: '**Lithium-Ionen vs. Blei-Säure:**\n✅ **Zwischenladen** jederzeit (z. B. in Pausen) – oft kein Batteriewechsel im Mehrschichtbetrieb\n✅ **wartungsfrei** – kein Wasser nachfüllen, keine Gasung, kein separater Laderaum nötig\n✅ deutlich **mehr Ladezyklen** und konstante Leistung bis zur Entladung\n✅ höherer Wirkungsgrad → geringere Stromkosten\n⚠️ **höherer Anschaffungspreis**\n⚠️ teils geringeres Gewicht – bei Gegengewichtsstaplern muss das ausgeglichen sein (nur vom Hersteller freigegebene Batterien verwenden)\n\n**Lohnt sich** meist bei Mehrschichtbetrieb und hoher Auslastung; bei Einschicht und wenig Nutzung reicht oft Blei-Säure.',
      source: 'Praxiswissen',
    },

    // ── Bauarten & Technik ──
    {
      id: 'bau-arten', category: 'Bauarten',
      question: 'Welche Arten von Gabelstaplern gibt es?',
      alt: ['Staplertypen', 'Bauarten Flurförderzeuge', 'Schubmaststapler Unterschied'],
      keywords: ['art', 'typ', 'bauart', 'schubmast', 'kommissionier', 'hochregal', 'seitenstapl', 'teleskop', 'gegengewicht'],
      answer: '**Gängige Bauarten:**\n• **Gegengewichtsstapler** (3- oder 4-Rad) – der Allrounder für innen & außen.\n• **Schubmaststapler** – Mast fährt vor/zurück, sehr wendig, für Regallager mit großen Hubhöhen.\n• **Hochhubwagen / Deichselstapler** – kompakt, oft Mitgänger, für kleine Hubhöhen.\n• **Niederhubwagen (Elektro-Ameise)** – horizontaler Palettentransport.\n• **Kommissionierer** – Fahrer fährt mit hoch, um Einzelteile zu entnehmen.\n• **Schmalgang-/Hochregalstapler** – für sehr schmale Gänge und große Höhen.\n• **Seiten- und Mehrwegestapler** – für Langgut (Rohre, Holz, Profile).\n• **Teleskoplader** – Last weit nach vorn und oben, oft auf Baustellen & in der Landwirtschaft.\n• **Geländestapler** – für unbefestigtes Gelände.',
      source: 'Praxiswissen',
    },
    {
      id: 'bau-hubgeruest', category: 'Bauarten',
      question: 'Was ist der Unterschied zwischen Simplex, Duplex und Triplex Hubgerüst? Was ist Freihub?',
      alt: ['Freihub Stapler', 'Hubmast Arten', 'Triplex Mast'],
      keywords: ['simplex', 'duplex', 'triplex', 'freihub', 'hubhoh', 'bauhoh', 'container'],
      answer: '**Hubgerüst-Arten:**\n• **Simplex** (Standard, 2-fach Teleskop): einfach & günstig, Mast fährt sofort mit aus – **kein Freihub**.\n• **Duplex mit Freihub**: Gabel kann ein Stück angehoben werden, **ohne dass der Mast höher wird**.\n• **Triplex** (3-fach): große Hubhöhen bei niedriger Bauhöhe, mit vollem Freihub.\n\n**Freihub** ist wichtig, wenn du in **Container, Lkw, niedrige Hallen oder unter Durchfahrten** arbeitest – dort darf der Mast nicht anstoßen.\n\nBei der Auswahl beachten: **Bauhöhe** (eingefahren), **Hubhöhe** und Resttragfähigkeit in großer Höhe.',
      source: 'Praxiswissen',
    },
    {
      id: 'bau-reifen', category: 'Bauarten',
      question: 'Welche Reifen sind für den Stapler die richtigen?',
      alt: ['Luftreifen oder Vollgummi', 'Superelastik Reifen', 'Bandagen Stapler', 'Non-marking Reifen'],
      keywords: ['luft', 'vollgummi', 'superelast', 'se', 'bandag', 'non', 'marking', 'spurlos', 'boden'],
      answer: '**Stapler-Bereifung:**\n• **Luftreifen** – gute Federung, für unebene Außenflächen; können platzen/plattfahren.\n• **Superelastik (SE)** – pannensicher, robust, für innen & außen, der häufigste Kompromiss.\n• **Vollgummi-Bandagen** – kompakt, sehr langlebig, für glatte Hallenböden (oft bei Elektrostaplern).\n• **Non-marking** (hell/grau) – hinterlassen keine schwarzen Streifen, z. B. Lebensmittel, Pharma.\n\nReifen bei Abnutzung bis zur **Verschleißmarke** oder bei Rissen/Ausbrüchen tauschen – achsweise. Falsche Reifen können die Standsicherheit verändern.',
      source: 'Praxiswissen',
    },
    {
      id: 'bau-anbaugeraete', category: 'Bauarten',
      question: 'Welche Anbaugeräte gibt es für Gabelstapler?',
      alt: ['Seitenschieber', 'Zinkenverstellgerät', 'Klammer Stapler', 'Anbaugerät Tragfähigkeit'],
      keywords: ['anbau', 'seitenschieb', 'zinkenverstell', 'klammer', 'drehgerat', 'schubgabel', 'kranarm', 'fassklamm'],
      answer: '**Häufige Anbaugeräte:**\n• **Seitenschieber** – Gabel seitlich verschieben, schnelleres Positionieren.\n• **Zinkenverstellgerät** – Zinkenabstand hydraulisch verstellen.\n• **Klammern** (Ballen-, Papierrollen-, Fassklammer) – Last ohne Palette greifen.\n• **Drehgerät** – Behälter kippen/entleeren.\n• **Schubgabel / Push-Pull** – Lasten ohne Palette auf Slipsheets.\n• **Kranarm, Teppichdorn, Gabelverlängerung**.\n\n⚠️ Anbaugeräte haben Eigengewicht und verschieben den Lastschwerpunkt → **Resttragfähigkeit sinkt**. Es braucht ein **eigenes Traglastschild** für die Kombination Stapler + Anbaugerät, und der Fahrer muss eingewiesen sein.',
      source: 'DGUV Vorschrift 68',
    },

    // ── Fehlersuche ──
    {
      id: 'fehler-faehrt-nicht', category: 'Fehlersuche',
      question: 'Elektrostapler fährt nicht – was kann ich prüfen?',
      alt: ['Stapler fährt nicht mehr', 'Stapler startet nicht Elektro', 'Stapler keine Funktion'],
      keywords: ['fahrt', 'startet', 'bewegt', 'reagiert', 'tot', 'nichts', 'notaus', 'sitzschalt'],
      answer: '**Checkliste, bevor du den Service rufst:**\n1. **Not-Aus** gedrückt? → entriegeln.\n2. **Batteriestecker** richtig gesteckt, Kabel unbeschädigt?\n3. **Ladezustand** – Batterie leer oder Unterspannungsschutz aktiv?\n4. **Sitzschalter / Fahrerpräsenz** – sitzt du richtig, ist der Gurt geschlossen (bei Gurtschloss-Abfrage)?\n5. **Feststellbremse** gelöst, Fahrtrichtungsschalter vorher auf Neutral?\n6. **Fehlercode** im Display ablesen und notieren.\n7. **Sicherungen** (nur durch Fachpersonal).\n\nFührt das nicht zum Erfolg: Stapler sichern, nicht weiter herumprobieren und den **Kundendienst** mit Fehlercode, Modell und Seriennummer kontaktieren.',
      source: 'Praxiswissen',
    },
    {
      id: 'fehler-hebt-nicht', category: 'Fehlersuche',
      question: 'Stapler hebt nicht oder nur langsam – woran liegt das?',
      alt: ['Gabel hebt nicht', 'Hubgerüst langsam', 'Hydraulik ohne Kraft'],
      keywords: ['hebt', 'langsam', 'hub', 'kraft', 'hydraul', 'pump'],
      answer: '**Mögliche Ursachen:**\n• **Überlast** – Last zu schwer für Hubhöhe/Schwerpunkt (Überlastabschaltung).\n• **Hydraulikölstand** zu niedrig oder Öl zu kalt/zu alt.\n• **Batterie** fast leer – viele Elektrostapler begrenzen dann die Hubfunktion.\n• **Undichtigkeiten** an Schläuchen, Zylindern, Anschlüssen (Ölspuren?).\n• Verstopfter **Hydraulikfilter** oder defekte **Pumpe/Ventil**.\n• Bei Verbrennern: zu niedrige Motordrehzahl.\n\nÖlstand nur bei abgesenkten Gabeln prüfen. Bei Leckagen oder ungewöhnlichen Geräuschen Stapler stilllegen und Service rufen.',
      source: 'Praxiswissen',
    },
    {
      id: 'fehler-last-sinkt', category: 'Fehlersuche',
      question: 'Die angehobene Last sinkt von alleine ab oder der Mast neigt sich – was tun?',
      alt: ['Gabel sackt ab', 'Mast kippt nach vorne von selbst', 'Hubzylinder undicht'],
      keywords: ['sinkt', 'sackt', 'absenk', 'allein', 'selbst', 'zylind', 'dicht'],
      answer: '⚠️ **Sicherheitsrelevanter Mangel!** Wahrscheinliche Ursache: innere Undichtigkeit an **Hub- oder Neigezylinder** (Dichtungen) oder ein defektes **Senk-/Halteventil**.\n\n**Sofort:**\n1. Last kontrolliert absetzen.\n2. Stapler **außer Betrieb nehmen** und kennzeichnen.\n3. Vorgesetzten informieren und **Fachwerkstatt** beauftragen.\n\nNiemals unter angehobener Last arbeiten – erst recht nicht, wenn sie absinkt.',
      source: 'Praxiswissen',
    },
    {
      id: 'fehler-bremse', category: 'Fehlersuche',
      question: 'Die Bremse des Staplers zieht schlecht oder macht Geräusche',
      alt: ['Stapler bremst schlecht', 'Bremse quietscht', 'Feststellbremse hält nicht'],
      keywords: ['brems', 'quietscht', 'halt', 'bremsweg'],
      answer: '⚠️ **Bremsmängel sind sicherheitsrelevant** – den Stapler **nicht weiter benutzen**.\n\nMögliche Ursachen: verschlissene Bremsbeläge, Luft oder zu wenig Flüssigkeit im Bremssystem, verstellte Feststellbremse, verschmutzte oder verölte Bremsen.\n\nStapler sichern, kennzeichnen, Mangel melden und durch Fachpersonal prüfen lassen.',
      source: 'DGUV Vorschrift 68',
    },
    {
      id: 'fehler-diesel-startet', category: 'Fehlersuche',
      question: 'Dieselstapler oder Gasstapler springt nicht an',
      alt: ['Diesel startet nicht', 'Treibgasstapler startet nicht', 'Verbrenner springt nicht an'],
      keywords: ['springt', 'anspring', 'startet', 'start', 'motor', 'kalt', 'winter', 'vorgluh'],
      answer: '**Diesel:**\n• Tank leer? **Vorglühen** abgewartet?\n• Starterbatterie schwach (Anlasser dreht langsam)?\n• Im Winter: Diesel versulzt → Winterdiesel, Kraftstofffilter prüfen.\n• Luft im Kraftstoffsystem nach Leerfahren → entlüften.\n\n**Treibgas:**\n• Flasche **leer** oder **Ventil geschlossen**?\n• Flasche richtig herum eingesetzt (Flüssigentnahme)?\n• Bei Frost kann der Verdampfer Probleme machen.\n• Gasgeruch → sofort Ventil schließen, lüften, keine Zündquellen!\n\nZeigt das Display einen Fehlercode, diesen dem Service mitteilen.',
      source: 'Praxiswissen',
    },

    // ── Kauf, Miete, Kosten ──
    {
      id: 'kauf-miete-leasing', category: 'Kauf & Miete',
      question: 'Stapler kaufen, mieten oder leasen – was lohnt sich?',
      alt: ['Stapler mieten', 'Stapler leasen', 'Mietstapler', 'Kauf oder Miete'],
      keywords: ['kauf', 'miet', 'leas', 'finanzier', 'lohnt', 'kurzzeit', 'langzeit'],
      answer: '**Kauf** – lohnt sich bei dauerhaftem, hohem Einsatz über viele Jahre; volle Freiheit, aber Kapitalbindung und eigenes Wartungsrisiko.\n\n**Leasing / Langzeitmiete** – planbare Monatsraten, oft inkl. **Full-Service** (Wartung, UVV, Reparatur), schont die Liquidität; ideal bei 3–5 Jahren Einsatzdauer.\n\n**Kurzzeitmiete** – für Spitzen (Saison, Inventur, Ausfall eines Geräts, Projekte); flexibel, aber pro Tag teurer.\n\n**Gebrauchtkauf** – günstiger Einstieg bei geringer Auslastung.\n\nEntscheidend sind: **jährliche Betriebsstunden**, geplante Nutzungsdauer, Budget und wer sich um Wartung kümmern soll.',
      source: 'Praxiswissen',
    },
    {
      id: 'kauf-kosten', category: 'Kauf & Miete',
      question: 'Was kostet ein neuer Gabelstapler?',
      alt: ['Preis Gabelstapler', 'Stapler Kosten neu', 'Wie teuer ist ein Stapler'],
      keywords: ['kost', 'preis', 'teuer', 'euro', 'neu', 'anschaff'],
      answer: 'Grobe **Richtwerte (netto, neu)** – stark abhängig von Hersteller, Ausstattung, Hubhöhe und Batterie:\n• **Elektro-Niederhubwagen**: ca. 2.000–6.000 €\n• **Gegengewichtsstapler 1,5–3 t** (Diesel/Gas/Elektro): ca. 20.000–45.000 €\n• **Schubmaststapler**: ca. 30.000–60.000 €\n• **Lithium-Ionen-Batterie** statt Blei-Säure: deutlich teurer in der Anschaffung, dafür günstiger im Betrieb.\n\nZusätzlich einplanen: Ladegerät, Anbaugeräte, Wartung, jährliche UVV-Prüfung, Energie/Kraftstoff, Versicherung.\n\nFür ein konkretes Angebot am besten deinen Händler mit Einsatzbeschreibung anfragen.',
      source: 'Marktübersicht (Richtwerte)',
    },
    {
      id: 'kauf-gebraucht', category: 'Kauf & Miete',
      question: 'Worauf muss ich beim Kauf eines gebrauchten Staplers achten?',
      alt: ['Gebrauchtstapler Checkliste', 'gebrauchten Gabelstapler kaufen', 'Stapler gebraucht prüfen'],
      keywords: ['gebraucht', 'achten', 'checklist', 'betriebsstund', 'zustand', 'probefahrt'],
      answer: '**Checkliste Gebrauchtstapler:**\n• **Betriebsstunden** und Baujahr, Wartungshistorie/Serviceheft\n• **Aktuelle UVV-Prüfung** (Plakette, Protokoll)\n• **Batterie**: Alter, Kapazitätstest, Zustand der Zellen (oft teuerstes Teil!)\n• **Hubgerüst**: Spiel in Rollen und Lagern, Risse, Schweißstellen\n• **Ketten & Gabelzinken**: Längung, Verschleiß\n• **Hydraulik**: dicht, Last hält in der Höhe, kein Absinken\n• **Lenkung & Bremsen**, Achsschenkel, Reifen\n• Motor (Verbrenner): Startverhalten, Rauch, Ölverlust\n• **Probefahrt mit Last** in voller Hubhöhe\n• Typenschild & Traglastschild vorhanden und lesbar\n\nAm sichersten: beim **Fachhändler** mit Gewährleistung und frischer UVV kaufen.',
      source: 'Praxiswissen',
    },

    // ── Lager ──
    {
      id: 'lager-regal', category: 'Lager',
      question: 'Was muss ich beim Ein- und Auslagern im Regal beachten?',
      alt: ['Regal einlagern Stapler', 'Palette ins Regal stellen', 'Regalprüfung'],
      keywords: ['regal', 'einlag', 'auslag', 'palett', 'stapel', 'fach', 'anfahrschutz'],
      answer: '**Einlagern:**\n1. Langsam und **gerade** vor das Regalfach fahren, anhalten.\n2. Last anheben – erst dann ggf. Mast senkrecht stellen.\n3. Langsam einfahren, Last absetzen, Gabeln frei machen.\n4. Gerade zurücksetzen, Gabeln absenken, erst dann weiterfahren.\n\n**Beachten:** Fachlast und Feldlast des Regals (Belastungsschild), intakte Paletten, Last nicht über das Fach hinausragen lassen. Bei **Anfahrschäden** am Regal sofort melden – beschädigte Regale können einstürzen. Regale werden mindestens **jährlich** von einer befähigten Person geprüft.',
      source: 'DIN EN 15635',
    },
    {
      id: 'lager-paletten', category: 'Lager',
      question: 'Wie nehme ich eine Palette richtig auf?',
      alt: ['Last aufnehmen', 'Palette anheben', 'Gabeln einstellen'],
      keywords: ['aufnehm', 'palett', 'gabelabstand', 'einstell', 'lastaufnahm', 'gitterbox'],
      answer: '**Last richtig aufnehmen:**\n1. **Gabelabstand** an die Palette anpassen – möglichst weit auseinander, mittig zur Last.\n2. Gerade und langsam heranfahren, Gabeln waagerecht.\n3. Gabeln **so weit wie möglich** unter die Last fahren – die Last soll am Gabelrücken anliegen.\n4. Leicht anheben, **Mast zurückneigen**.\n5. Prüfen: Last stabil, gesichert, nicht zu hoch gestapelt (Sicht!), Gewicht innerhalb des Traglastdiagramms.\n\nBeschädigte Paletten nicht mehr verwenden.',
      source: 'DGUV Information 208-004',
    },
    {
      id: 'lager-hubwagen', category: 'Lager',
      question: 'Brauche ich für den Hubwagen oder die Ameise einen Staplerschein?',
      alt: ['Elektro-Ameise Schein', 'Mitgängerflurförderzeug Ausbildung', 'Handhubwagen Führerschein'],
      keywords: ['hubwag', 'ameis', 'mitgang', 'deichsel', 'handhubwag'],
      answer: '• **Handhubwagen (manuell)**: kein Staplerschein nötig, aber eine **Unterweisung**.\n• **Elektrische Mitgänger-Flurförderzeuge** (Elektro-Ameise, Deichselstapler): Es ist eine **Ausbildung bzw. Einweisung mit Befähigungsnachweis** nach DGUV Grundsatz 308-001 (Zusatzmodul Mitgängerflurförderzeuge) und eine **Beauftragung** durch den Arbeitgeber erforderlich – oft kürzer als der volle Staplerschein.\n• **Mit Fahrerstand/Fahrersitz**: voller Staplerschein (DGUV Vorschrift 68).',
      source: 'DGUV Grundsatz 308-001',
    },
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = WISSEN;
  else root.STAPLER_WISSEN = WISSEN;
})(typeof self !== 'undefined' ? self : this);
