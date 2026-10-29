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
// Unbekanntes Fachwort + Allerweltswörter → nicht raten.
assert(!ki.ask('Wie lasse ich die Last mit dem Notablass ab?').answered, 'Unbekanntes Fachwort wurde geraten');
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

// ── Selbstständiges Lernen ──
{
  const k = new StaplerEngine(WISSEN);
  const events = [];
  const chat = () => new StaplerEngine.Conversation(k, ev => events.push(ev));
  let t = 1e12;

  // 1) Unbekannte Formulierung → Umformulierung findet die Antwort → Nutzer geht weiter.
  const c = chat();
  const fail = c.ask('Wann muss die Karre zum Doc?', t);
  assert(!fail.result.answered, 'Slang-Frage sollte zunächst unbekannt sein');
  const ok = c.ask('Wie oft muss der Stapler zur UVV-Prüfung?', t += 20000);
  assert.strictEqual(ok.result.best.id, 'pruef-uvv');
  c.ask('Was kostet ein neuer Stapler?', t += 30000);
  assert(events.some(e => e.type === 'alias'), 'Umformulierung wurde nicht verknüpft');
  const again = k.ask('Wann muss die Karre zum Doc?');
  assert(again.answered && again.best.id === 'pruef-uvv', 'Verknüpfte Formulierung wird nicht erkannt');
  assert(!k.openQuestions().some(o => o.text.includes('Karre')), 'Gelöste Frage bleibt offen');

  // 2) Sofortiges Umformulieren einer beantworteten Frage → schwaches Nein für die Antwort.
  const c2 = chat();
  const first = c2.ask('Stapler Batterie Wasser', t += 600000);
  c2.ask('Batterie Wasser nachfüllen wann', t += 15000);
  assert(events.some(e => e.type === 'implicit' && e.value < 0 && e.entryId === first.result.best.id));

  // 3) Eigene Synonyme: „Karre“ führte zweimal erst über „Stapler“ zur Antwort (Fall 1 + dieses Gespräch).
  assert.strictEqual(k._learnedSynonym('karr'), null, 'Ein Beleg allein darf noch kein Synonym ergeben');
  const c3 = chat();
  assert(!c3.ask('Die Karre macht Mucken', t += 600000).result.answered);
  c3.ask('Mein Stapler hat ein Problem, er fährt nicht', t += 10000);
  c3.end();
  assert.strictEqual(k._learnedSynonym('karr'), 'stapl', 'Synonym „Karre“ ≈ „Stapler“ nicht gelernt');
  assert(k.selfLearnLog().some(l => l.kind === 'synonym'));

  // 4) Dokumente lesen + offene Fragen selbst lösen.
  k.noteOpen('Wie schnell darf man in Halle 3 fahren?');
  k.ingest({
    title: 'Hallenordnung Werk Nord',
    text: 'Hallenordnung\n\nIn Halle 3 gilt für alle Flurförderzeuge eine Höchstgeschwindigkeit von 6 km/h. ' +
      'An Kreuzungen ist Schrittgeschwindigkeit zu fahren und zu hupen.\n\nLadestation\n\n' +
      'Die Ladestation für Staplerbatterien befindet sich am Tor 5. Dort ist Rauchen verboten und die Lüftung muss eingeschaltet sein.',
  });
  const doc = k.ask('Wie schnell darf ich in Halle 3 fahren? Höchstgeschwindigkeit');
  assert(doc.answered && doc.best.origin === 'dokument' && /6 km\/h/.test(doc.best.answer), 'Dokumentwissen nicht gefunden');
  assert(!k.openQuestions().some(o => o.text.includes('Halle 3')), 'Offene Frage wurde nicht selbst gelöst');
  assert(k.selfLearnLog().some(l => l.kind === 'gelöst'));
  assert.strictEqual(k.summary().documents, 1);

  // 5) Alles selbst Gelernte lässt sich identisch auf einem anderen Gerät wiederherstellen.
  const k2 = new StaplerEngine(WISSEN);
  k2.importState(JSON.parse(JSON.stringify(k.exportState())));
  assert.deepStrictEqual(k2.summary(), k.summary());
  assert.strictEqual(k2._learnedSynonym('karr'), 'stapl');
  assert.strictEqual(k2.ask('Wann muss die Karre zum Doc?').best.id, 'pruef-uvv');

  // Versionierte Dokumente: neue Version ersetzt alte, gleiche Version wird nicht doppelt gelernt.
  const v1 = k2.ingest({ id: 'ds:M16A', version: '2026-10-01', title: 'M16A Datenblatt', text: 'Technische Daten\n\nDer M16A hebt 1.600 kg auf eine Hubhöhe von 4.800 mm und hat eine Lithium-Batterie.' });
  assert(v1 && k2.documentVersion('ds:M16A') === '2026-10-01');
  assert.strictEqual(k2.ingest({ id: 'ds:M16A', version: '2026-10-01', title: 'x', text: 'Doppelt gelesen, sollte ignoriert werden.' }), null);
  k2.ingest({ id: 'ds:M16A', version: '2026-10-20', title: 'M16A Datenblatt', text: 'Technische Daten\n\nDer M16A hebt 1.600 kg auf eine Hubhöhe von 6.000 mm und hat eine Lithium-Batterie.' });
  const m16 = k2.ask('Welche Hubhöhe hat der M16A?');
  assert(m16.answered && /6\.000 mm/.test(m16.best.answer), 'Neue Datenblatt-Version nicht übernommen');
  assert.strictEqual([...k2.entries.values()].filter(e => e.docId === 'ds:M16A').length, 1, 'Alte Version nicht ersetzt');
  // Lange Tabellenzeilen ohne Satzzeichen werden in handliche Abschnitte geteilt.
  const table = StaplerEngine.splitDocument(Array.from({ length: 400 }, (_, i) => `Wert${i} 123 mm`).join(' '));
  assert(table.length > 1 && table.every(p => p.text.length <= 1000), 'Lange Tabelle nicht geteilt');

  // Dokument wieder vergessen.
  const before = k2.summary().documents;
  k2.forget(k2.documentList().find(d => d.title.startsWith('Hallenordnung')).id);
  assert.strictEqual(k2.summary().documents, before - 1);
  const gone = k2.ask('Höchstgeschwindigkeit Halle 3');
  assert(!gone.answered || gone.best.origin !== 'dokument');
  console.log('✔ Selbstständiges Lernen: Verknüpfen, Umformulieren, Synonyme, Dokumente, offene Fragen');
}

if (fails) { console.error(`\n${fails} Erkennungsfehler`); process.exit(1); }
console.log('\nAlle Tests bestanden.');
