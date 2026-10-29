// Bibliothek der Stapler-KI (läuft im Supabase-Projekt „Stapler-Akademie“).
// Volltext der Noblelift-Service-Unterlagen (Seite noblelift-datenblaetter-app-drive.html):
// Geräte mit der App lesen die Dateien aus („Mitlesen“), der Dienst speichert den Text und durchsucht ihn.
//
//   ?aktion=status                      Fortschritt
//   ?aktion=naechste&n=3                nächste Dateien zum Lesen reservieren
//   ?aktion=datei&id=<link>             Datei durchreichen (Browser dürfen down.noblelift.com nicht direkt abrufen)
//   ?aktion=speichern  (POST)           ausgelesenen Text speichern: { id, parts: [{ page, text }], fehler? }
//   ?aktion=suche&q=<frage>&n=20        Volltextsuche
// Alle Aufrufe brauchen den Zugangscode (?code=…).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ZUGANGSCODE = "GA-Q6DV-555T-CLYG";
const NOBLELIFT_PAGE = "https://www.meisterstapler.de/wp-content/uploads/noblelift-datenblaetter-app-drive.html";
const MAX_DB_MB = 400;              // Sicherung: unter dem kostenlosen Supabase-Tarif (500 MB) bleiben
const MAX_CHARS_PER_DOC = 400_000;  // sehr lange Ersatzteilkataloge kappen
const SYNC_HOURS = 6;
const LESBAR = ["pdf", "xlsx", "xls", "docx"];

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const clean = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim();
const noCjk = (s: string) => clean(s.replace(/[一-鿿（）]+/g, " "));

const SV_TYPES: Record<number, string> = { 1: "Ersatzteilliste", 2: "Bedienungsanleitung", 3: "Service-Handbuch", 4: "Fehlercodes", 5: "Schaltplan", 6: "Hydraulikplan" };
const SV_CATS: [RegExp, string][] = [
  [/^a\)/, "Elektro-Gegengewichtsstapler"], [/^b\)/, "Diesel-Gegengewichtsstapler"], [/^c\)/, "Schubmaststapler"],
  [/^d\)/, "Elektro-Niederhubwagen"], [/^e\)/, "Elektro-Hochhubwagen (Deichselstapler)"], [/^f\)/, "Spreizenstapler"],
  [/^g\)/, "Doppelstock-Hubwagen und Stapler"], [/^h\)/, "Kommissionierer und Schmalgangstapler"], [/^i\)/, "Schlepper"],
  [/^j\)/, "Reinigungsmaschinen"], [/^k\)/, "Halbelektrische Stapler"], [/^m\)/, "AGV (fahrerlose Fahrzeuge)"],
  [/^n\)/, "Lithium-Batterien"], [/^O/i, "Handstapler"],
];
const stripPrefix = (s: string) => clean(s).replace(/^[a-zO]\s*\(?\d*\s*[)）]\s*/i, "");

const ZERTIFIKAT = "Zertifikat / Prüfbericht";

function svType(ftype: number | null, name: string, top = "") {
  if (ftype === 8 || /certificate|declaration|test report/i.test(`${name} ${top}`)) return ZERTIFIKAT;
  if (ftype && SV_TYPES[ftype]) return SV_TYPES[ftype];
  if (/fault|error|alarm/i.test(name)) return "Fehlercodes";
  if (/part|spare/i.test(name)) return "Ersatzteilliste";
  if (/hydraulic/i.test(name)) return "Hydraulikplan";
  if (/circuit|wiring|schematic|diagram/i.test(name)) return "Schaltplan";
  if (/service|maintenance|repair/i.test(name)) return "Service-Handbuch";
  if (/manual|instruction|operat/i.test(name)) return "Bedienungsanleitung";
  return "Dokument";
}

function extractJson(html: string, name: string) {
  const start = html.indexOf(`const ${name} = `);
  if (start < 0) return null;
  const from = start + `const ${name} = `.length;
  return JSON.parse(html.slice(from, html.indexOf(";\n", from)));
}

/** Holt die Dateiliste von der Noblelift-Seite und trägt neue Dateien ein (alle 6 Stunden). */
async function syncListe(force = false) {
  const { data: meta } = await sb.from("stapler_bib_meta").select("updated_at").eq("key", "sync").maybeSingle();
  if (!force && meta && Date.now() - new Date(meta.updated_at).getTime() < SYNC_HOURS * 3600e3) return 0;
  const html = await (await fetch(NOBLELIFT_PAGE)).text();
  const sv = extractJson(html, "SV_RAW") || { flat: {}, files: [] };
  const base = html.match(/const SV_BASE\s*=\s*"([^"]+)"/)?.[1] || "https://down.noblelift.com/afterSale/sales-public/";
  const rows = new Map<string, any>();
  for (const [, ftype, name, path, titleId] of sv.files as any[]) {
    const ext = String(path).split(".").pop()!.toLowerCase();
    if (!LESBAR.includes(ext) || ftype === 7) continue; // Videos haben keinen lesbaren Text
    const p: string[] = (sv.flat[titleId] || []).map((s: string) => clean(s));
    if (p.length && /^测试/.test(p[0])) continue;      // interne Testeinträge
    const model = p.length > 1 || !/certificate/i.test(p[0] || "") ? noCjk(stripPrefix(p[p.length - 1] || "")) : "";
    const typ = svType(ftype, `${name} ${path}`, p[0]);
    const url = /^https?:\/\//i.test(path) ? encodeURI(path) : base + String(path).split("/").map(encodeURIComponent).join("/");
    const kategorie = (SV_CATS.find(([re]) => re.test(p[0] || "")) || [null, "Sonstige Geräte"])[1];
    rows.set(url, { id: url, title: noCjk(`${model ? `Noblelift ${model} – ` : ""}${typ}: ${name}`) || url, model, kategorie, typ, ext });
  }
  const list = [...rows.values()];
  for (let i = 0; i < list.length; i += 500) {
    const { error } = await sb.from("stapler_bib_docs").upsert(list.slice(i, i + 500), { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
  }
  await sb.from("stapler_bib_meta").upsert({ key: "sync", value: { dateien: list.length }, updated_at: new Date().toISOString() });
  return list.length;
}

async function status() {
  const { data, error } = await sb.rpc("stapler_bib_status");
  if (error) throw error;
  return { ...data, max_mb: MAX_DB_MB, voll: data.db_mb >= MAX_DB_MB };
}

async function naechste(n: number, self: string) {
  await syncListe();
  const st = await status();
  if (st.voll) return { voll: true, status: st, dateien: [] };
  const { data, error } = await sb.rpc("stapler_bib_claim", { n });
  if (error) throw error;
  return {
    voll: false, status: st,
    dateien: (data || []).map((d: any) => ({
      id: d.id, title: d.title, model: d.model, typ: d.typ, ext: d.ext,
      datei: `${self}?code=${encodeURIComponent(ZUGANGSCODE)}&aktion=datei&id=${encodeURIComponent(d.id)}`,
    })),
  };
}

async function datei(id: string) {
  const { data } = await sb.from("stapler_bib_docs").select("id").eq("id", id).maybeSingle();
  if (!data) return json({ error: "Datei nicht freigegeben" }, 404);
  const r = await fetch(id);
  if (!r.ok) return json({ error: `Noblelift: HTTP ${r.status}` }, 502);
  return new Response(r.body, { headers: { ...cors, "Content-Type": r.headers.get("content-type") || "application/octet-stream" } });
}

async function speichern(body: any) {
  const id = String(body?.id || "");
  const { data: doc } = await sb.from("stapler_bib_docs").select("id, model, typ").eq("id", id).maybeSingle();
  if (!doc) return json({ error: "Unbekannte Datei" }, 404);
  if (body.fehler) {
    await sb.from("stapler_bib_docs").update({ status: "fehler", fehler: clean(body.fehler).slice(0, 300), updated_at: new Date().toISOString() }).eq("id", id);
    return json({ ok: true });
  }
  const st = await status();
  if (st.voll) {
    await sb.from("stapler_bib_docs").update({ status: "offen", updated_at: new Date().toISOString() }).eq("id", id);
    return json({ error: "Bibliothek voll", voll: true, status: st }, 507);
  }
  // Text bereinigen, kappen und jedem Abschnitt Modell + Typ voranstellen (damit die Suche sie findet).
  const prefix = clean(`${doc.model || ""} ${doc.typ || ""}`);
  let total = 0;
  const parts: any[] = [];
  for (const p of Array.isArray(body.parts) ? body.parts : []) {
    const text = clean(p?.text);
    if (text.length < 20 || total >= MAX_CHARS_PER_DOC) continue;
    const cut = text.slice(0, MAX_CHARS_PER_DOC - total);
    total += cut.length;
    parts.push({ doc_id: id, part: parts.length, page: Number(p.page) || null, text: prefix ? `${prefix}: ${cut}` : cut });
  }
  await sb.from("stapler_bib_text").delete().eq("doc_id", id);
  for (let i = 0; i < parts.length; i += 200) {
    const { error } = await sb.from("stapler_bib_text").insert(parts.slice(i, i + 200));
    if (error) throw error;
  }
  await sb.from("stapler_bib_docs").update({
    status: parts.length ? "fertig" : "leer", parts: parts.length, chars: total, fehler: null, updated_at: new Date().toISOString(),
  }).eq("id", id);
  return json({ ok: true, parts: parts.length, chars: total });
}

async function suche(q: string, n: number) {
  const { data, error } = await sb.rpc("stapler_bib_suche", { q, n });
  if (error) throw error;
  return (data || []).map((r: any) => ({ ...r, url: r.doc_id }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const url = new URL(req.url);
  if ((url.searchParams.get("code") || "").trim().toUpperCase() !== ZUGANGSCODE) return json({ error: "Zugangscode ungültig" }, 401);
  const self = `${Deno.env.get("SUPABASE_URL")}/functions/v1/stapler-bibliothek`;
  try {
    switch (url.searchParams.get("aktion")) {
      case "status": return json(await status());
      case "naechste": return json(await naechste(Number(url.searchParams.get("n")) || 3, self));
      case "datei": return await datei(url.searchParams.get("id") || "");
      case "speichern": return await speichern(await req.json());
      case "suche": return json({ treffer: await suche(url.searchParams.get("q") || "", Number(url.searchParams.get("n")) || 20) });
      case "sync": return json({ dateien: await syncListe(true) });
      default: return json({ error: "Unbekannte Aktion" }, 400);
    }
  } catch (e) {
    console.log("stapler-bibliothek", (e as any)?.message || JSON.stringify(e));
    return json({ error: "Bibliothek gerade nicht verfügbar" }, 500);
  }
});
