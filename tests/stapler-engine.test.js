// Tests für die Stapler-KI: node tests/stapler-engine.test.js
const assert = require('assert');
const StaplerEngine = require('../stapler/engine.js');
const WISSEN = require('../stapler/wissen.js');

const ids = new Set();
for (const e of WISSEN) {
  assert(e.id && e.question && e.answer && e.category, `Eintrag unvollständig: ${e.id}`);
  assert(!ids.has(e.id), `Doppelte id: ${e.id}`);
  ids.add(e.id);
}

const ki = new StaplerEngine(WISSEN);
const cases = [
  ['Brauche ich einen Führerschein für den Gabelstapler?', 'schein-pflicht'],
  ['wie lange dauert der staplerschein', 'schein-ausbildung'],
  ['Wie oft muss die UVV Prüfung gemacht werden?', 'pruef-uvv'],
  ['Wann muss ich die Gabeln wechseln', 'pruef-gabeln'],
  ['mein elektrostapler fährt nicht mehr', 'fehler-faehrt-nicht'],
  ['Akku richtig aufladen', 'batt-laden'],
  ['lohnt sich lithium', 'batt-lithium'],
  ['diesel oder elektro was ist besser', 'antrieb-vergleich'],
  ['Was ist Freihub?', 'bau-hubgeruest'],
  ['Stapler kippt um was tun', 'sicher-kippen'],
  ['Wie fahre ich bergab mit Last?', 'sicher-gefaelle'],
  ['darf ich jemanden auf der gabel hochheben', 'sicher-personen'],
  ['gasflasche wechseln', 'antrieb-gas-wechsel'],
  ['Was kostet ein Stapler?', 'kauf-kosten'],
  ['gebrauchten stapler kaufen worauf achten', 'kauf-gebraucht'],
  ['Traglastdiagramm lesen', 'last-traglastdiagramm'],
  ['Gabelstapler mieten oder kaufen', 'kauf-miete-leasing'],
  ['Brauche ich für die Ameise einen Schein?', 'lager-hubwagen'],
  ['tägliche Kontrolle vor Schichtbeginn', 'sicher-tageskontrolle'],
  ['stapelr hebt nciht', 'fehler-hebt-nicht'], // Tippfehler
];
let fails = 0;
for (const [q, want] of cases) {
  const r = ki.ask(q);
  const got = r.answered ? r.best.id : '(keine)';
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? '✔' : '✘'} ${q}  →  ${got}${r.answered ? ` (${Math.round(r.confidence * 100)} %)` : ''}`);
}

// Unbekanntes wird nicht geraten, sondern als offene Frage gemerkt.
const unknown = ki.ask('Wie ist das Wetter morgen in Hamburg?');
assert(!unknown.answered && unknown.unsure, 'Wetterfrage sollte nicht beantwortet werden');
ki.noteOpen('Wie ist das Wetter morgen in Hamburg?');
ki.noteOpen('wetter morgen hamburg');
assert.strictEqual(ki.openQuestions().length, 1);
assert.strictEqual(ki.openQuestions()[0].count, 2);
ki.dismissOpen('Wetter Hamburg morgen');
assert.strictEqual(ki.openQuestions().length, 0);

// Lernen: neues Wissen wird nach dem Beibringen gefunden.
const q = 'Wie lauten eure Öffnungszeiten?';
assert(!ki.ask(q).answered);
ki.noteOpen(q);
ki.teach({ question: q, answer: 'Mo–Fr 7–17 Uhr', keywords: ['offnungszeit', 'geoffnet'] });
const learned = ki.ask('Wann habt ihr geöffnet? Öffnungszeiten');
assert(learned.answered && learned.best.answer === 'Mo–Fr 7–17 Uhr', 'Gelerntes Wissen nicht gefunden');
assert(!ki.openQuestions().some(o => o.text === q), 'Beantwortete Frage bleibt offen');

// Auch ohne Stichwörter wird Gelerntes bei anderer Formulierung gefunden.
ki.teach({ question: 'Habt ihr einen Notdienst am Wochenende?', answer: 'Ja, Notdienst-Hotline.' });
const nd = ki.ask('Gibt es bei euch einen Notdienst?');
assert(nd.answered && nd.best.answer === 'Ja, Notdienst-Hotline.', 'Umformulierte Frage nicht erkannt');

// Feedback verschiebt das Ranking.
const q2 = 'Stapler Akku Wasser';
const before = ki.ask(q2).best.id;
const target = 'batt-lithium';
for (let i = 0; i < 6; i++) ki.feedback(q2, before, -1);
for (let i = 0; i < 6; i++) ki.feedback(q2, target, +1);
assert.strictEqual(ki.ask(q2).best.id, target, 'Feedback hat Ranking nicht verändert');

// Zustand lässt sich exportieren und in einer neuen Instanz wiederherstellen (inkl. Duplikat-Schutz).
const state = JSON.parse(JSON.stringify(ki.exportState()));
const ki2 = new StaplerEngine(WISSEN);
ki2.importState(state);
ki2.importState(state);
assert.deepStrictEqual(ki2.summary(), ki.summary());
assert.strictEqual(ki2.ask(q2).best.id, target);

// Vergessen.
const id = learned.best.id;
ki2.forget(id);
assert(!ki2.ask('Öffnungszeiten').answered || ki2.ask('Öffnungszeiten').best.id !== id);

if (fails) { console.error(`\n${fails} Erkennungsfehler`); process.exit(1); }
console.log('\nAlle Tests bestanden.');
