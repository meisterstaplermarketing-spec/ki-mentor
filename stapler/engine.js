/*
 * Stapler-KI Engine
 * Eigenständige, lernende Wissens-KI für Gabelstapler – ohne externe Sprachmodelle.
 *
 * Bausteine:
 *  - Deutsche Textnormalisierung (Umlaute, Stoppwörter, einfacher Stemmer, Synonyme)
 *  - BM25-Suche über Wörter + Zeichen-Trigramme (tolerant gegenüber Tippfehlern/Komposita)
 *  - Lernschicht: Feedback verschiebt Gewichte zwischen Frage-Begriffen und Antworten,
 *    Korrekturen/neues Wissen werden als eigene Einträge aufgenommen,
 *    unbeantwortete Fragen werden gesammelt.
 *  - Selbstständiges Lernen (Conversation): erkennt am Gesprächsverlauf, ob eine Antwort
 *    gepasst hat, verknüpft erfolgreiche Umformulierungen, lernt eigene Synonyme,
 *    liest Dokumente und löst offene Fragen selbst, sobald neues Wissen da ist.
 *  - Ereignis-Log (Event Sourcing): jeder Lernschritt ist ein Event und kann
 *    lokal oder über die eigene Datenbank zwischen allen Nutzern geteilt werden.
 *
 * Läuft im Browser (window.StaplerEngine) und in Node (module.exports).
 */
(function (root) {
  'use strict';

  const STOPWORDS = new Set((
    'a ab aber alle allem allen aller alles als also am an ander andere anderen auch auf aus bei beim bin bis bist ' +
    'da dabei damit dann das dass dein deine dem den denn der des dessen deshalb die dies diese diesem diesen dieser ' +
    'dieses doch dort du durch ein eine einem einen einer eines er es etwas euch euer fur gegen gibt hab habe haben ' +
    'hat hatte hier hin ich ihm ihn ihnen ihr ihre im in ins ist ja jede jedem jeden jeder jedes jetzt kann kannst ' +
    'kein keine konnen konnte man manche mehr mein meine mich mir mit muss mussen nach nicht nichts noch nun nur ob ' +
    'oder ohne sehr sein seine sich sie sind so solche soll sollte sondern sonst uber um und uns unser unter viel ' +
    'vom von vor war waren was weil welche welchem welchen welcher welches wenn wer werde werden wie wieder will wir ' +
    'wird wo wurde zu zum zur zwar zwischen bitte mal gerne denn eigentlich genau ganz bzw usw etc' +
    ' welch wann warum wieso weshalb wozu womit worauf habt hast eure eurem euren eurer lauten lautet sag sagen' +
    ' erklar erklare erklaren weisst wisst meinem meinen meiner unsere unserem unseren einfach kurz danke' +
    ' darf durfen darfst soll sollen konnte mochte lass lasse lassen gemacht machen mach jemand jemanden'
  ).split(/\s+/));

  // Kanonische Begriffe: alle Varianten werden auf den ersten Begriff abgebildet.
  const SYNONYM_GROUPS = [
    ['stapl', 'gabelstapl', 'hubstapl', 'frontstapl', 'flurforderzeug', 'ffz', 'forklift', 'stapler'],
    ['fuhrerschein', 'staplerschein', 'fahrausweis', 'fahrerlaubnis', 'staplerfuhrerschein', 'befahigungsnachweis', 'schein'],
    ['schulung', 'ausbild', 'kurs', 'lehrgang', 'unterweis', 'training'],
    ['prufung', 'uvv', 'inspektion', 'sachkundigenprufung', 'tuv', 'abnahm', 'pruf', 'check', 'kontroll'],
    ['batteri', 'akku', 'akkumulator', 'traktionsbatteri'],
    ['lithium', 'lithiumion', 'li', 'lifepo4'],
    ['diesel', 'verbrenn', 'dieselstapl'],
    ['treibgas', 'gas', 'lpg', 'flussiggas', 'gasstapl', 'propan'],
    ['elektro', 'elektrostapl', 'estapl', 'strom', 'elektrisch'],
    ['tragfahigkeit', 'tragkraft', 'traglast', 'nennlast', 'hublast', 'resttragfahigkeit', 'kapazitat'],
    ['hubgerust', 'mast', 'hubmast'],
    ['gabel', 'gabelzink', 'zink', 'zinken'],
    ['kost', 'preis', 'kostet', 'teur', 'gunstig', 'euro', 'budget', 'kauf'],
    ['miet', 'vermiet', 'kurzzeitmiet', 'langzeitmiet'],
    ['reif', 'bereif', 'bandag', 'raed', 'rad'],
    ['wartung', 'servic', 'instandhalt', 'inspektionsintervall', 'reparatur'],
    ['fehl', 'stor', 'defekt', 'kaputt', 'problem', 'geht', 'funktioniert'],
    ['kipp', 'umkipp', 'umsturz', 'standsicherheit', 'stabilitat'],
    ['lad', 'aufladen', 'ladegerat', 'ladestation', 'laden'],
    ['hydraul', 'hydraulikol', 'ol'],
    ['sicherheit', 'gefahr', 'unfall', 'schutz'],
    ['person', 'mitfahr', 'mitnehm', 'beifahr', 'mensch'],
    ['gurt', 'sicherheitsgurt', 'ruckhaltesystem', 'anschnall'],
    ['hubwag', 'ameis', 'palettenhubwag', 'handhubwag'],
    ['gebraucht', 'occasion', 'second'],
    ['wechsel', 'austausch', 'tausch', 'ersetz', 'ausgetauscht', 'getauscht', 'erneuer'],
  ];

  const SYNONYMS = new Map();
  SYNONYM_GROUPS.forEach(group => group.forEach(w => SYNONYMS.set(w, group[0])));

  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/-/g, ' ');
  }

  // Bewusst einfacher deutscher Stemmer – robust genug für Fachbegriffe.
  function stem(word) {
    const suffixes = ['ungen', 'heiten', 'keiten', 'ung', 'heit', 'keit', 'ern', 'em', 'en', 'er', 'es', 'e', 's'];
    for (let pass = 0; pass < 2; pass++) {
      if (word.length <= 4) break;
      const before = word;
      for (const s of suffixes) {
        if (s === 's' && word.endsWith('ss')) continue; // „Notablass“, „Anlass“ nicht kürzen
        if (word.endsWith(s) && word.length - s.length >= 3) { word = word.slice(0, -s.length); break; }
      }
      // Plural-n nur nach -el/-er (Gabeln, Staplern), nicht bei Wörtern wie „Schein“.
      if (word === before && /[lr]n$/.test(word)) word = word.slice(0, -1);
      if (word === before) break;
    }
    return word;
  }

  function tokenize(text) {
    const out = [];
    for (const raw of normalize(text).split(/\s+/)) {
      if (!raw || STOPWORDS.has(raw)) continue;
      if (raw.length < 2 && !/\d/.test(raw)) continue;
      const st = stem(raw);
      out.push(SYNONYMS.get(st) || SYNONYMS.get(raw) || st);
    }
    return out;
  }

  function trigrams(text) {
    const grams = [];
    for (const w of normalize(text).split(/\s+/)) {
      if (w.length < 4 || STOPWORDS.has(w)) continue;
      const p = ` ${w} `;
      for (let i = 0; i < p.length - 2; i++) grams.push('#' + p.slice(i, i + 3));
    }
    return grams;
  }

  function counts(list) {
    const m = new Map();
    for (const t of list) m.set(t, (m.get(t) || 0) + 1);
    return m;
  }

  function uid() {
    return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function jaccard(a, b) {
    const A = new Set(a), B = new Set(b);
    if (!A.size || !B.size) return 0;
    let inter = 0;
    A.forEach(t => { if (B.has(t)) inter++; });
    return inter / (A.size + B.size - inter);
  }

  /** Zerlegt einen Dokumenttext in suchbare Abschnitte (je ca. 300–900 Zeichen). */
  function splitDocument(text) {
    const clean = String(text || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/-\n(?=[a-zäöüß])/g, '');
    const blocks = clean.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    const isHeading = line => line.length >= 3 && line.length <= 80 && !/[.:;,!?]$/.test(line) && /[A-Za-zÄÖÜäöü]/.test(line);
    const passages = [];
    let currentHeading = '';
    let buf = '';
    const flush = () => {
      const body = buf.replace(/\s*\n\s*/g, ' ').trim();
      buf = '';
      if (body.length < 40) return;
      const first = (body.match(/^.{20,140}?[.!?](\s|$)/) || [body.slice(0, 120)])[0].trim();
      passages.push({ question: currentHeading || first, text: body });
    };
    const pushText = text => {
      for (const sentence of text.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ0-9•\-])/)) {
        if (buf && buf.length + sentence.length > 900) flush();
        buf += (buf ? ' ' : '') + sentence;
      }
    };
    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      let prevEnded = true; // vorherige Zeile endete mit Satzzeichen bzw. Blockanfang
      let text = '';
      lines.forEach((line, i) => {
        // Überschrift: kurze Zeile ohne Satzende nach einem abgeschlossenen Satz, gefolgt von Text
        // (erkennt Zwischenüberschriften auch in PDFs ohne Leerzeilen).
        const heading = prevEnded && isHeading(line) && line.length <= 60 && /^[A-ZÄÖÜ0-9]/.test(line) &&
          (i < lines.length - 1 || lines.length === 1);
        if (heading) {
          if (text) { pushText(text); text = ''; }
          flush();
          currentHeading = line;
        } else {
          text += (text ? ' ' : '') + line;
        }
        prevEnded = heading || /[.!?:]$/.test(line);
      });
      if (text) pushText(text);
      if (buf.length >= 300) flush();
    }
    flush();
    return passages;
  }

  class StaplerEngine {
    constructor(baseKnowledge, options = {}) {
      this.base = (baseKnowledge || []).map(e => ({ ...e, origin: 'basis' }));
      this.options = { minScore: 1.6, k1: 1.4, b: 0.6, learnRate: 0.6, ...options };
      this.reset();
    }

    reset() {
      this.entries = new Map();
      this.base.forEach(e => this.entries.set(e.id, { ...e, keywords: [...(e.keywords || [])] }));
      this.weights = {};       // entryId -> { term: gewicht }
      this.stats = {};         // entryId -> { up, down, shown }
      this.open = new Map();   // normalisierte Frage -> { text, count, last }
      this.synonymVotes = {};  // unbekanntes Wort -> { bekanntes Wort: Anzahl Belege }
      this.documents = new Map();
      this.autoLog = [];       // was die KI selbstständig gelernt hat
      this.autoCount = 0;
      this.events = [];
      this.eventIds = new Set();
      this._dirty = true;
    }

    // ---------- Index ----------

    _buildIndex() {
      const docs = [];
      for (const e of this.entries.values()) {
        if (e.deleted) continue;
        // Frage & Stichwörter zählen doppelt, sie beschreiben die Absicht am besten.
        // Bei Dokumentabschnitten trägt auch der Anfang des Abschnitts die Absicht.
        const lead = e.origin === 'dokument' ? e.answer.slice(0, 160) : '';
        const intent = [e.question, lead, ...(e.alt || []), ...(e.keywords || [])].join(' ');
        const text = `${intent} ${intent} ${e.category || ''} ${e.answer}`;
        const terms = tokenize(text).concat(trigrams(intent));
        docs.push({ id: e.id, tf: counts(terms), len: terms.length });
      }
      const df = new Map();
      docs.forEach(d => d.tf.forEach((_, t) => df.set(t, (df.get(t) || 0) + 1)));
      const avgLen = docs.reduce((s, d) => s + d.len, 0) / Math.max(1, docs.length);
      this._index = { docs, df, avgLen, n: docs.length };
      this._dirty = false;
    }

    _bm25(queryTerms, words) {
      if (this._dirty) this._buildIndex();
      const { docs, df, avgLen, n } = this._index;
      const { k1, b } = this.options;
      const qtf = counts(queryTerms);
      // Trigramme je Wort – damit zählt ein Wort mit Tippfehler trotzdem als „getroffen“.
      const wordGrams = words.map(w => [w, trigrams(w)]);
      const results = [];
      for (const d of docs) {
        let score = 0;
        qtf.forEach((qc, t) => {
          const f = d.tf.get(t);
          if (!f) return;
          const idf = Math.log(1 + (n - df.get(t) + 0.5) / (df.get(t) + 0.5));
          const weight = t[0] === '#' ? 0.12 : 1; // Trigramme nur als leichter Unschärfe-Bonus
          score += weight * idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / avgLen));
        });
        if (score <= 0) continue;
        const covered = new Set();
        for (const [w, grams] of wordGrams) {
          if (d.tf.has(w)) covered.add(w);
          else if (grams.length) {
            const shared = grams.filter(g => d.tf.has(g));
            const inner = shared.filter(g => !g.includes(' ')).length;
            if (shared.length / grams.length >= 0.4 && inner >= 2) covered.add(w); // Tippfehler
          }
        }
        results.push({ id: d.id, score, covered });
      }
      return results;
    }

    // ---------- Fragen beantworten ----------

    /** Selbst gelerntes Synonym für ein Wort, das im Wissen nicht vorkommt (ab 2 Belegen). */
    _learnedSynonym(t) {
      if (this._dirty) this._buildIndex();
      if (this._index.df.has(t)) return null;
      const votes = this.synonymVotes[t];
      if (!votes) return null;
      let best = null;
      for (const [u, n] of Object.entries(votes)) {
        if (n >= 2 && this._index.df.has(u) && (!best || n > votes[best])) best = u;
      }
      return best;
    }

    ask(question) {
      const raw = tokenize(question);
      const words = raw.map(t => this._learnedSynonym(t) || t);
      const uniq = [...new Set(words)];
      const pairs = [...new Map(raw.map((t, i) => [t, words[i]])).entries()]; // [Originalwort, Suchwort]
      const terms = words.concat(trigrams(question));
      const scored = new Map(this._bm25(terms, uniq).map(r => [r.id, r]));

      // Gelernte Assoziationen addieren (auch für Einträge ohne Textüberlappung).
      for (const [id, w] of Object.entries(this.weights)) {
        const e = this.entries.get(id);
        if (!e || e.deleted) continue;
        let bonus = 0;
        const hit = [];
        for (const [t, mapped] of pairs) {
          const v = w[t] || (mapped !== t ? w[mapped] : 0) || 0;
          if (v) { bonus += v; if (v > 0) hit.push(mapped); }
        }
        if (!bonus) continue;
        const r = scored.get(id) || { id, score: 0, covered: new Set() };
        r.score += bonus;
        hit.forEach(t => r.covered.add(t));
        scored.set(id, r);
      }

      // Abdeckung: Anteil getroffener Frage-Begriffe, gewichtet nach Seltenheit.
      // Ein unbekanntes Fachwort zählt viel – fehlt es, wird lieber nicht geantwortet.
      const { df, n } = this._index;
      const rawIdf = d => Math.log(1 + (n - d + 0.5) / (d + 0.5));
      // Unbekannte Wörter können Fachbegriffe oder Füllwörter sein → mittleres Gewicht.
      const idf = t => (df.get(t) ? rawIdf(df.get(t)) : 0.6 * rawIdf(1));
      const totalWeight = uniq.reduce((sum, t) => sum + idf(t), 0);
      const ranked = [...scored.values()]
        .map(({ id, score, covered }) => {
          const s = this.stats[id];
          const prior = s ? 1 + 0.08 * clamp(s.up - s.down, -5, 5) : 1;
          let hit = 0;
          covered.forEach(t => { hit += idf(t); });
          const coverage = totalWeight ? hit / totalWeight : 0;
          return { id, score: score * prior * (0.3 + 0.7 * coverage), coverage };
        })
        .filter(r => r.score > 0)
        .sort((x, y) => y.score - x.score);

      const top = ranked[0];
      const minScore = this.options.minScore;
      if (!words.length || !top || top.score < minScore || top.coverage < 0.5) {
        return {
          answered: false,
          unsure: words.length > 0,
          confidence: 0,
          terms: uniq,
          related: ranked.slice(0, 3).map(r => this._card(r)),
        };
      }

      const second = ranked[1] ? ranked[1].score : 0;
      // Konfidenz: absolute Stärke + Abstand zum Zweitplatzierten.
      const confidence = clamp(
        0.55 * (1 - Math.exp(-(top.score - minScore) / 4)) + 0.45 * (1 - second / top.score),
        0.05, 0.99
      );
      return {
        answered: true,
        unsure: confidence < 0.25,
        confidence,
        terms: uniq,
        best: this._card(top),
        related: ranked.slice(1, 4).filter(r => r.score > minScore * 0.8).map(r => this._card(r)),
      };
    }

    _card(r) {
      const e = this.entries.get(r.id);
      return {
        id: e.id, question: e.question, answer: e.answer, category: e.category,
        source: e.source, origin: e.origin, score: r.score,
      };
    }

    _log(ts, kind, text) {
      this.autoLog.push({ ts, kind, text });
      if (this.autoLog.length > 200) this.autoLog.shift();
    }

    /** Prüft offene Fragen erneut, sobald neues Wissen da ist, und hakt gelöste ab. */
    _resolveOpen(newIds, ts) {
      for (const [key, o] of [...this.open.entries()]) {
        const r = this.ask(o.text);
        if (r.answered && r.confidence >= 0.3 && newIds.has(r.best.id)) {
          this.open.delete(key);
          this._log(ts, 'gelöst', `Offene Frage selbst gelöst: „${o.text}“`);
        }
      }
    }

    _addWeights(entryId, question, delta) {
      const w = this.weights[entryId] || (this.weights[entryId] = {});
      for (const t of new Set(tokenize(question))) {
        w[t] = clamp((w[t] || 0) + delta, -6, 6);
        if (Math.abs(w[t]) < 1e-6) delete w[t];
      }
    }

    _openKey(question) {
      return [...new Set(tokenize(question))].sort().join(' ');
    }

    // ---------- Lernen (alles läuft über Events) ----------

    /** Nutzer bewertet eine Antwort. value: +1 hilfreich, -1 nicht hilfreich */
    feedback(question, entryId, value) {
      return this.apply({ type: 'feedback', question, entryId, value: value > 0 ? 1 : -1 });
    }

    /** Neues Wissen oder Korrektur zu einer Frage. */
    teach({ question, answer, keywords = [], category = 'Gelernt', source = 'Nutzer', replaces = null }) {
      if (!question || !answer) throw new Error('Frage und Antwort werden benötigt');
      return this.apply({
        type: 'teach',
        entry: { id: uid(), question, answer, keywords, category, source },
        replaces,
      });
    }

    forget(entryId) {
      return this.apply({ type: 'forget', entryId });
    }

    /** Indirektes Signal aus dem Gesprächsverlauf (schwächer als 👍/👎). */
    implicit(question, entryId, value) {
      return this.apply({ type: 'implicit', question, entryId, value: value > 0 ? 1 : -1 });
    }

    /** Eine erfolglose Formulierung führte über eine Umformulierung zur passenden Antwort. */
    alias(question, entryId, via) {
      return this.apply({ type: 'alias', question, entryId, via });
    }

    /** Liest ein Dokument (Betriebsanleitung, Datenblatt, Schulungsunterlage …) ein. */
    ingest({ title, text, source }) {
      const passages = splitDocument(text);
      if (!passages.length) throw new Error('Im Dokument wurde kein verwertbarer Text gefunden');
      return this.apply({ type: 'document', doc: { id: uid(), title: title || 'Dokument', source: source || title, passages } });
    }

    /** Merkt sich eine Frage, die (noch) nicht sicher beantwortet werden konnte. */
    noteOpen(question) {
      return this.apply({ type: 'open', question });
    }

    dismissOpen(question) {
      return this.apply({ type: 'dismiss', question });
    }

    /** Wendet ein Event an. Doppelte Events (gleiche id) werden ignoriert. */
    apply(event, { record = true } = {}) {
      const ev = { id: event.id || uid(), ts: event.ts || Date.now(), ...event };
      if (this.eventIds.has(ev.id)) return null;
      this.eventIds.add(ev.id);

      if (ev.type === 'feedback') {
        const e = this.entries.get(ev.entryId);
        if (!e) return null;
        const st = this.stats[ev.entryId] || (this.stats[ev.entryId] = { up: 0, down: 0 });
        ev.value > 0 ? st.up++ : st.down++;
        this._addWeights(ev.entryId, ev.question, ev.value * this.options.learnRate);
        if (ev.value > 0) this.open.delete(this._openKey(ev.question));
      } else if (ev.type === 'implicit') {
        if (!this.entries.has(ev.entryId)) return null;
        // Weitergehen ist ein schwaches Ja, sofortiges Umformulieren ein deutlicheres Nein.
        this._addWeights(ev.entryId, ev.question, ev.value > 0 ? 0.15 : -0.3);
        this.autoCount++;
      } else if (ev.type === 'alias') {
        const e = this.entries.get(ev.entryId);
        if (!e) return null;
        this._addWeights(ev.entryId, ev.question, 1.2);
        // Wörter, die das Wissen nicht kennt, als mögliche Synonyme der erfolgreichen Formulierung vormerken.
        if (this._dirty) this._buildIndex();
        const failed = new Set(tokenize(ev.question));
        const good = new Set(tokenize(ev.via || ''));
        for (const t of failed) {
          if (good.has(t) || this._index.df.has(t)) continue;
          for (const u of good) {
            if (failed.has(u) || !this._index.df.has(u)) continue;
            const v = this.synonymVotes[t] || (this.synonymVotes[t] = {});
            v[u] = (v[u] || 0) + 1;
            if (v[u] === 2) this._log(ev.ts, 'synonym', `Neuer Begriff gelernt: „${t}“ ≈ „${u}“`);
          }
        }
        this.open.delete(this._openKey(ev.question));
        this.autoCount++;
        this._log(ev.ts, 'verknüpft', `„${ev.question}“ → ${e.question}`);
      } else if (ev.type === 'document') {
        const doc = ev.doc;
        const ids = new Set();
        doc.passages.forEach((p, i) => {
          const id = `${doc.id}#${i}`;
          ids.add(id);
          this.entries.set(id, {
            id, docId: doc.id, question: p.question, answer: p.text,
            category: 'Dokument', source: doc.source || doc.title, origin: 'dokument', keywords: [],
          });
        });
        this.documents.set(doc.id, { id: doc.id, title: doc.title, passages: doc.passages.length, ts: ev.ts });
        this._dirty = true;
        this._log(ev.ts, 'gelesen', `Dokument gelesen: „${doc.title}“ (${doc.passages.length} ${doc.passages.length === 1 ? 'Abschnitt' : 'Abschnitte'})`);
        this._resolveOpen(ids, ev.ts);
      } else if (ev.type === 'teach') {
        const entry = { ...ev.entry, origin: 'gelernt', keywords: [...(ev.entry.keywords || [])] };
        this.entries.set(entry.id, entry);
        // Die auslösende Frage direkt mit der neuen Antwort verknüpfen.
        const w = this.weights[entry.id] || (this.weights[entry.id] = {});
        for (const t of new Set(tokenize(entry.question))) w[t] = clamp((w[t] || 0) + 1.5, -6, 6);
        if (ev.replaces && this.weights[ev.replaces]) {
          const old = this.weights[ev.replaces];
          for (const t of new Set(tokenize(entry.question))) old[t] = clamp((old[t] || 0) - 1.5, -6, 6);
        }
        this.open.delete(this._openKey(entry.question));
        this._dirty = true;
        this._resolveOpen(new Set([entry.id]), ev.ts);
      } else if (ev.type === 'open') {
        const key = this._openKey(ev.question);
        if (!key) return null;
        const prev = this.open.get(key);
        this.open.set(key, { text: String(ev.question).trim(), count: (prev ? prev.count : 0) + 1, last: ev.ts });
      } else if (ev.type === 'dismiss') {
        this.open.delete(this._openKey(ev.question));
      } else if (ev.type === 'forget') {
        const e = this.entries.get(ev.entryId);
        if (e) { e.deleted = true; this._dirty = true; }
        if (this.documents.has(ev.entryId)) {
          for (const x of this.entries.values()) if (x.docId === ev.entryId) x.deleted = true;
          this.documents.delete(ev.entryId);
          this._dirty = true;
        }
      } else {
        return null;
      }

      if (record) this.events.push(ev);
      return ev;
    }

    // ---------- Zustand ----------

    openQuestions() {
      return [...this.open.values()].sort((a, b) => b.count - a.count || b.last - a.last);
    }

    summary() {
      let learned = 0, active = 0;
      for (const e of this.entries.values()) {
        if (e.deleted) continue;
        active++;
        if (e.origin === 'gelernt') learned++;
      }
      const fb = Object.values(this.stats).reduce((s, x) => s + x.up + x.down, 0);
      return {
        entries: active, learned, feedback: fb, open: this.open.size, events: this.events.length,
        documents: this.documents.size, self: this.autoCount,
      };
    }

    exportState() {
      return { version: 1, events: this.events };
    }

    /** Spielt Events ein (eigener Speicher, Datei-Import oder gemeinsame Datenbank). Liefert Anzahl neuer Events. */
    importState(state) {
      if (!state) return 0;
      const events = [...(state.events || [])].sort((a, b) => (a.ts || 0) - (b.ts || 0));
      let added = 0;
      for (const ev of events) if (this.apply(ev)) added++;
      return added;
    }

    learnedEntries() {
      return [...this.entries.values()].filter(e => e.origin === 'gelernt' && !e.deleted);
    }

    documentList() {
      return [...this.documents.values()].sort((a, b) => b.ts - a.ts);
    }

    selfLearnLog() {
      return this.autoLog.slice().reverse();
    }
  }

  /*
   * Verfolgt den Gesprächsverlauf und erzeugt daraus Lernschritte – ohne dass jemand bewerten muss.
   *  - Sofortiges Umformulieren  → die letzte Antwort hat nicht gepasst.
   *  - Weiter zum nächsten Thema → die letzte Antwort hat gepasst.
   *  - Erst erfolglos, dann mit anderen Worten erfolgreich → beide Formulierungen werden verknüpft.
   * Jeder erzeugte Lernschritt wird an onEvent übergeben (zum Speichern/Teilen).
   */
  class Conversation {
    constructor(engine, onEvent = () => {}, { rephraseMs = 120000 } = {}) {
      this.ki = engine;
      this.onEvent = onEvent;
      this.rephraseMs = rephraseMs;
      this.last = null;
    }

    _emit(ev) { if (ev) this.onEvent(ev); }

    ask(question, now = Date.now()) {
      const result = this.ki.ask(question);
      const turn = { question, result, ts: now, feedback: 0, failed: [] };
      const prev = this.last;
      if (prev && !prev.closed) {
        prev.closed = true;
        const quick = now - prev.ts < this.rephraseMs;
        const prevOk = prev.result.answered && prev.feedback >= 0;
        const similar = jaccard(tokenize(prev.question), tokenize(question)) >= 0.25;
        if (quick && (similar || !prevOk)) {
          if (prev.result.answered && prev.feedback === 0) this._emit(this.ki.implicit(prev.question, prev.result.best.id, -1));
          turn.failed = [...new Set([...prev.failed, prev.question])].slice(-3);
        } else {
          this._accept(prev);
        }
      }
      if (result.unsure) this._emit(this.ki.noteOpen(question));
      this.last = turn;
      return turn;
    }

    /** Nutzer wählt einen vorgeschlagenen Eintrag („Siehe auch“ / „Meintest du“). */
    choose(turn, card, now = Date.now()) {
      const sub = { question: turn.question, result: { answered: true, best: card }, ts: now, feedback: 0, failed: [] };
      if (!turn.result.answered) {
        // Der Vorschlag ersetzt die fehlende Antwort – wie eine Umformulierung behandeln.
        sub.failed = [...turn.failed];
        if (this.last === turn) { turn.closed = true; this.last = sub; }
      } else {
        this._emit(this.ki.implicit(turn.question, card.id, +1));
        turn.choseOther = true;
        sub.closed = true;
      }
      return sub;
    }

    feedback(turn, value) {
      if (!turn.result.answered || turn.feedback) return;
      turn.feedback = value > 0 ? 1 : -1;
      this._emit(this.ki.feedback(turn.question, turn.result.best.id, turn.feedback));
      if (turn.feedback > 0) this._accept(turn, true);
      else this._emit(this.ki.noteOpen(turn.question));
    }

    /** Gespräch endet (App geschlossen/verlassen): letzte Antwort gilt als passend. */
    end() {
      if (this.last && !this.last.closed) { this.last.closed = true; this._accept(this.last); }
    }

    _accept(turn, explicit = false) {
      if (turn.accepted || !turn.result.answered || turn.feedback < 0) return;
      turn.accepted = true;
      if (!explicit && turn.feedback === 0 && !turn.choseOther) this._emit(this.ki.implicit(turn.question, turn.result.best.id, +1));
      for (const q of turn.failed) this._emit(this.ki.alias(q, turn.result.best.id, turn.question));
    }
  }

  StaplerEngine.tokenize = tokenize;
  StaplerEngine.normalize = normalize;
  StaplerEngine.splitDocument = splitDocument;
  StaplerEngine.Conversation = Conversation;

  if (typeof module !== 'undefined' && module.exports) module.exports = StaplerEngine;
  else root.StaplerEngine = StaplerEngine;
})(typeof self !== 'undefined' ? self : this);
