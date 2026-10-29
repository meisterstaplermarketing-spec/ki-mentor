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
    ' erklar erklare erklaren weisst wisst meinem meinen meiner unsere unserem unseren einfach kurz danke'
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
        const intent = [e.question, ...(e.alt || []), ...(e.keywords || [])].join(' ');
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
          else if (grams.length && grams.filter(g => d.tf.has(g)).length / grams.length >= 0.4) covered.add(w);
        }
        results.push({ id: d.id, score, covered });
      }
      return results;
    }

    // ---------- Fragen beantworten ----------

    ask(question) {
      const words = tokenize(question);
      const uniq = [...new Set(words)];
      const terms = words.concat(trigrams(question));
      const scored = new Map(this._bm25(terms, uniq).map(r => [r.id, r]));

      // Gelernte Assoziationen addieren (auch für Einträge ohne Textüberlappung).
      for (const [id, w] of Object.entries(this.weights)) {
        const e = this.entries.get(id);
        if (!e || e.deleted) continue;
        let bonus = 0;
        const hit = [];
        for (const t of uniq) if (w[t]) { bonus += w[t]; if (w[t] > 0) hit.push(t); }
        if (!bonus) continue;
        const r = scored.get(id) || { id, score: 0, covered: new Set() };
        r.score += bonus;
        hit.forEach(t => r.covered.add(t));
        scored.set(id, r);
      }

      // Abdeckung (Anteil getroffener Frage-Begriffe) und Feedback als Prior.
      const ranked = [...scored.values()]
        .map(({ id, score, covered }) => {
          const s = this.stats[id];
          const prior = s ? 1 + 0.08 * clamp(s.up - s.down, -5, 5) : 1;
          const coverage = uniq.length ? covered.size / uniq.length : 0;
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
        const w = this.weights[ev.entryId] || (this.weights[ev.entryId] = {});
        const lr = this.options.learnRate;
        for (const t of new Set(tokenize(ev.question))) {
          w[t] = clamp((w[t] || 0) + ev.value * lr, -6, 6);
          if (Math.abs(w[t]) < 1e-6) delete w[t];
        }
        if (ev.value > 0) this.open.delete(this._openKey(ev.question));
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
      return { entries: active, learned, feedback: fb, open: this.open.size, events: this.events.length };
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
  }

  StaplerEngine.tokenize = tokenize;
  StaplerEngine.normalize = normalize;

  if (typeof module !== 'undefined' && module.exports) module.exports = StaplerEngine;
  else root.StaplerEngine = StaplerEngine;
})(typeof self !== 'undefined' ? self : this);
