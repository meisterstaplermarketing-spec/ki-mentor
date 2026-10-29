// Wissensquelle für die Stapler-KI (läuft im Supabase-Projekt „Meisterstapler Leads“).
// GET /functions/v1/stapler-wissen?code=<Zugangscode>
// Liefert Gerätekatalog, Online-Shop-Katalog, Datenblätter und Noblelift-Dokumente als lernbare Dokumente.
//   ?drive=<id>  reicht ein freigegebenes Noblelift-PDF von Google Drive durch
//   ?url=<link>  ruft Links von meisterstapler.de / down.noblelift.com serverseitig ab
// Bewusst NICHT enthalten: Einkaufspreise, Boni, Listenpreise der Geräte und alle Lead-/Kundendaten.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ZUGANGSCODE = "GA-Q6DV-555T-CLYG";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-zugangscode, apikey, authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

async function hash(text: string) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
}
const clean = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim();
const sentence = (s: string) => (s && !/[.!?]$/.test(s) ? s + "." : s);
const euro = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
// Überschriften dürfen nicht mit Satzzeichen enden (sonst erkennt die KI sie nicht als Überschrift).
const heading = (s: string) => clean(s).replace(/[.:;,!?]+$/, "").slice(0, 60);

async function geraeteKatalog() {
  const { data, error } = await sb.from("kat_products")
    .select("name, specs, equipment, sort, kat_categories(name, sort)")
    .eq("active", true);
  if (error) throw error;
  const rows = (data || []).sort((a: any, b: any) =>
    (a.kat_categories?.sort ?? 99) - (b.kat_categories?.sort ?? 99) || (a.sort ?? 0) - (b.sort ?? 0));
  const blocks: string[] = [];
  const overview: string[] = [];
  for (const p of rows as any[]) {
    const specs = Object.entries(p.specs || {}).filter(([, v]) => clean(v)).map(([k, v]) => sentence(`${k}: ${clean(v)}`));
    const serie = p.kat_categories?.name ? ` gehört zur Baureihe ${p.kat_categories.name}` : "";
    const body = [`Der Gabelstapler ${p.name}${serie}.`, "Technische Daten:", ...specs];
    if (clean(p.equipment)) body.push(sentence(`Ausstattung: ${clean(p.equipment)}`));
    blocks.push(`${heading(p.name)}\n${body.join(" ")}`);
    const kurz = ["Tragkraft", "Hubhöhe", "Batterie"].map(k => p.specs?.[k] ? `${k} ${clean(p.specs[k])}` : "").filter(Boolean).join(", ");
    overview.push(`${p.name}${kurz ? ` (${kurz})` : ""}`);
  }
  const text = `Übersicht aller Gabelstapler im Sortiment\nDiese Gabelstapler-Modelle bieten wir an: ${overview.join("; ")}.\n\n${blocks.join("\n\n")}`;
  return { id: "katalog-geraete", title: "Gerätekatalog Meisterstapler", version: await hash(text), text };
}

async function shopKatalog() {
  const { data, error } = await sb.from("app_settings").select("value").eq("key", "katalog").maybeSingle();
  if (error) throw error;
  const items = Array.isArray(data?.value) ? data!.value : [];
  const blocks = items.map((it: any) => {
    const parts: string[] = [];
    (it.intro || []).map(clean).filter((s: string) => s && s !== clean(it.name)).forEach((s: string) => parts.push(sentence(s)));
    if (it.cats?.length) parts.push(sentence(`Kategorie: ${it.cats.join(", ")}`));
    (it.features || []).map(clean).filter(Boolean).forEach((s: string) => parts.push(sentence(s)));
    (it.attrs || []).filter((a: any) => clean(a.v) && clean(a.v) !== "n. a.").forEach((a: any) => parts.push(sentence(`${clean(a.k)}: ${clean(a.v)}`)));
    const min = it.priceMin ?? it.price, max = it.priceMax;
    if (typeof min === "number") parts.push(sentence(`Preis im Online-Shop: ${max && max > min ? `${euro(min)} bis ${euro(max)}` : euro(min)} ${clean(it.tax) || "exkl. MwSt."}`));
    if (clean(it.delivery)) parts.push(sentence(`Lieferzeit: ${clean(it.delivery)}`));
    if (it.inStock === false) parts.push("Derzeit nicht auf Lager.");
    if (it.url) parts.push(`Bestellen: ${it.url}`);
    return `${heading(it.name)}\n${parts.join(" ")}`;
  });
  const text = blocks.join("\n\n");
  return text ? { id: "shop-katalog", title: "Online-Shop Meisterstapler", version: await hash(text), text } : null;
}

async function datenblaetter() {
  const { data, error } = await sb.storage.from("datasheets").list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
  if (error) throw error;
  const files = (data || []).filter(f => /\.pdf$/i.test(f.name));
  if (!files.length) return [];
  const { data: signed, error: e2 } = await sb.storage.from("datasheets").createSignedUrls(files.map(f => f.name), 60 * 60);
  if (e2) throw e2;
  return files.map((f, i) => ({
    id: `datenblatt:${f.name}`,
    title: f.name.replace(/\.pdf$/i, "").replace(/_/g, " "),
    version: String(f.updated_at || f.created_at || ""),
    pdf: signed?.[i]?.signedUrl,
  })).filter(d => d.pdf);
}

// ── Noblelift-Dokumente (Seite noblelift-datenblaetter-app-drive.html auf meisterstapler.de) ──
const NOBLELIFT_PAGE = "https://www.meisterstapler.de/wp-content/uploads/noblelift-datenblaetter-app-drive.html";
const PROXY_HOSTS = ["www.meisterstapler.de", "meisterstapler.de", "down.noblelift.com"];
const SELF = `${Deno.env.get("SUPABASE_URL")}/functions/v1/stapler-wissen`;
const SV_TYPES: Record<number, string> = { 1: "Ersatzteilliste", 2: "Bedienungsanleitung", 3: "Service-Handbuch", 4: "Fehlercodes", 5: "Schaltplan", 6: "Hydraulikplan" };
const SV_CATS: [RegExp, string][] = [
  [/^a\)/, "Elektro-Gegengewichtsstapler"], [/^b\)/, "Diesel-Gegengewichtsstapler"], [/^c\)/, "Schubmaststapler"],
  [/^d\)/, "Elektro-Niederhubwagen"], [/^e\)/, "Elektro-Hochhubwagen (Deichselstapler)"], [/^f\)/, "Spreizenstapler"],
  [/^g\)/, "Doppelstock-Hubwagen und Stapler"], [/^h\)/, "Kommissionierer und Schmalgangstapler"], [/^i\)/, "Schlepper"],
  [/^j\)/, "Reinigungsmaschinen"], [/^k\)/, "Halbelektrische Stapler"], [/^m\)/, "AGV (fahrerlose Fahrzeuge)"],
  [/^n\)/, "Lithium-Batterien"], [/^O/i, "Handstapler"],
];
// Gliederungspräfixe wie „d1) “, „a(2) “ oder „O）“ entfernen – nur wenn wirklich eine Klammer folgt.
const stripPrefix = (s: string) => clean(s).replace(/^[a-zO]\s*\(?\d*\s*[)）]\s*/i, "");

/** „PTE12/15/20N“ → zusätzlich „PTE12N PTE15N PTE20N“, damit Fragen nach Einzelmodellen treffen. */
function modelVariants(label: string) {
  const out = new Set<string>();
  for (const m of label.matchAll(/([A-Z]+)(\d+(?:\/\d+)+)([A-Z]*)/g)) m[2].split("/").forEach(n => out.add(`${m[1]}${n}${m[3]}`));
  return [...out].join(" ");
}

function svType(ftype: number | null, name: string) {
  if (ftype && SV_TYPES[ftype]) return SV_TYPES[ftype];
  if (/fault|error|alarm/i.test(name)) return "Fehlercodes";
  if (/part|spare/i.test(name)) return "Ersatzteilliste";
  if (/hydraulic/i.test(name)) return "Hydraulikplan";
  if (/circuit|wiring|schematic|diagram/i.test(name)) return "Schaltplan";
  if (/service|maintenance|repair/i.test(name)) return "Service-Handbuch";
  if (/manual|instruction|operat/i.test(name)) return "Bedienungsanleitung";
  return "";
}

function extractJson(html: string, name: string) {
  const start = html.indexOf(`const ${name} = `);
  if (start < 0) return null;
  const from = start + `const ${name} = `.length;
  const end = html.indexOf(";\n", from);
  return JSON.parse(html.slice(from, end));
}

async function nobleliftPage() {
  const res = await fetch(NOBLELIFT_PAGE);
  if (!res.ok) throw new Error(`Noblelift-Seite: HTTP ${res.status}`);
  const html = await res.text();
  const seed = extractJson(html, "SEED") || [];
  const sv = extractJson(html, "SV_RAW") || { flat: {}, files: [] };
  const folder = html.match(/const FOLDER_ID\s*=\s*"([^"]+)"/)?.[1];
  const apiKey = html.match(/const API_KEY\s*=\s*"([^"]+)"/)?.[1];
  const svBase = html.match(/const SV_BASE\s*=\s*"([^"]+)"/)?.[1] || "https://down.noblelift.com/afterSale/sales-public/";
  return { seed, sv, folder, apiKey, svBase };
}

// Der Drive-Schlüssel gehört zur Seite auf meisterstapler.de – Abrufe laufen in deren Namen.
const DRIVE_HEADERS = { Referer: "https://www.meisterstapler.de/" };
const isGerman = (name: string) => /deutsch|german|\bDE\b|[-_ ]DE\.pdf$|VDI/i.test(name);

async function nobleliftDrive(page: Awaited<ReturnType<typeof nobleliftPage>>) {
  const docs = new Map<string, { name: string; model: string; size: number }>();
  for (const d of page.seed as any[]) {
    if (d.driveId && (d.lang === "DE" || isGerman(d.name))) docs.set(d.driveId, { name: d.name, model: d.model, size: d.size || 0 });
  }
  // Neue Dateien im Drive-Ordner selbstständig mitnehmen.
  if (page.folder && page.apiKey) {
    try {
      let token = "";
      do {
        const u = new URL("https://www.googleapis.com/drive/v3/files");
        u.searchParams.set("q", `'${page.folder}' in parents and trashed=false and mimeType='application/pdf'`);
        u.searchParams.set("fields", "nextPageToken,files(id,name,size)");
        u.searchParams.set("pageSize", "1000");
        u.searchParams.set("key", page.apiKey);
        if (token) u.searchParams.set("pageToken", token);
        const r = await fetch(u, { headers: DRIVE_HEADERS });
        if (!r.ok) { console.log("drive list", r.status, await r.text()); break; }
        const j = await r.json();
        for (const f of j.files || []) if (!docs.has(f.id) && isGerman(f.name)) docs.set(f.id, { name: f.name, model: f.name.split(" - ")[0], size: Number(f.size) || 0 });
        token = j.nextPageToken || "";
      } while (token);
    } catch (e) { console.log("drive list", String(e)); }
  }
  return docs;
}

function nobleliftVerzeichnis(page: Awaited<ReturnType<typeof nobleliftPage>>) {
  const groups = new Map<string, { cat: string; lines: Set<string> }>();
  for (const f of page.sv.files as any[]) {
    const [, ftype, name, path, titleId, version] = f;
    const ext = String(path).split(".").pop()!.toLowerCase();
    if (!["pdf", "xls", "xlsx", "doc", "docx"].includes(ext) || ftype === 7 || ftype === 8) continue;
    if (/certificate|declaration|zertifikat/i.test(name)) continue;
    const typ = svType(ftype, `${name} ${path}`);
    if (!typ) continue;
    const p: string[] = (page.sv.flat[titleId] || []).map((s: string) => clean(s));
    if (!p.length || /test|测试|certificate/i.test(p[0])) continue;
    const model = stripPrefix(p[p.length - 1]);
    if (!model || /[一-鿿]/.test(model)) continue;
    const cat = (SV_CATS.find(([re]) => re.test(p[0])) || [null, "Sonstige Geräte"])[1];
    const url = /^https?:\/\//i.test(path) ? encodeURI(path) : page.svBase + String(path).split("/").map(encodeURIComponent).join("/");
    const g = groups.get(model) || { cat, lines: new Set<string>() };
    g.lines.add(sentence(`${typ}: ${clean(name).replace(/[一-鿿（）]+/g, " ").trim()}${clean(version) ? ` (Version ${clean(version)})` : ""}${ext !== "pdf" ? ` (${ext.toUpperCase()})` : ""} – ${url}`));
    groups.set(model, g);
  }
  const blocks = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([model, g]) => {
    const variants = modelVariants(model);
    return `Noblelift ${heading(model)} Service-Unterlagen\nService-Unterlagen für Noblelift ${model}${variants ? ` (${variants})` : ""}, ${g.cat}, aus dem Noblelift-Serviceportal: ${[...g.lines].join(" ")}`;
  });
  return blocks.join("\n\n");
}

async function noblelift() {
  const page = await nobleliftPage();
  const items: any[] = [];
  const verzeichnis = nobleliftVerzeichnis(page);
  if (verzeichnis) items.push({ id: "noblelift-service", title: "Noblelift Service-Unterlagen (Verzeichnis)", version: await hash(verzeichnis), text: verzeichnis });
  for (const [id, d] of await nobleliftDrive(page)) {
    items.push({
      id: `drive:${id}`,
      title: clean(d.name).replace(/\.pdf(\.pdf)?$/i, ""),
      version: `${id}:${d.size}`,
      pdf: `${SELF}?code=${encodeURIComponent(ZUGANGSCODE)}&drive=${encodeURIComponent(id)}`,
    });
  }
  return { items, page };
}

/** Reicht ein Drive-PDF durch (nur Dateien aus der Noblelift-Seite – kein offener Proxy). */
async function drivePdf(id: string) {
  const page = await nobleliftPage();
  const allowed = await nobleliftDrive(page);
  if (!allowed.has(id)) return json({ error: "Dokument nicht freigegeben" }, 404);
  // Öffentlicher Download-Link (der API-Schlüssel der Seite ist für Server-Abrufe gesperrt).
  const sources = [
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`,
    ...(page.apiKey ? [`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media&key=${page.apiKey}`] : []),
  ];
  for (const src of sources) {
    const r = await fetch(src, { headers: DRIVE_HEADERS });
    if (!r.ok) continue;
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") continue; // z. B. Hinweisseite statt PDF
    return new Response(bytes, { headers: { ...cors, "Content-Type": "application/pdf", "Cache-Control": "public, max-age=3600" } });
  }
  return json({ error: "PDF konnte nicht von Google Drive geladen werden" }, 502);
}

/** Ruft Links von freigegebenen Seiten serverseitig ab (Browser dürfen das wegen CORS nicht). */
async function proxy(target: string) {
  let u: URL;
  try { u = new URL(target); } catch { return json({ error: "Ungültiger Link" }, 400); }
  if (!PROXY_HOSTS.includes(u.hostname)) return json({ error: "Diese Seite ist nicht freigegeben" }, 403);
  if (u.pathname.includes("noblelift-datenblaetter")) {
    const { items } = await noblelift();
    return json({ name: "Noblelift Datenblätter & Service", items });
  }
  const r = await fetch(u);
  return new Response(r.body, { status: r.status, headers: { ...cors, "Content-Type": r.headers.get("content-type") || "application/octet-stream" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") || req.headers.get("x-zugangscode") || "").trim().toUpperCase();
  if (code !== ZUGANGSCODE) return json({ error: "Zugangscode ungültig" }, 401);
  try {
    if (url.searchParams.get("drive")) return await drivePdf(url.searchParams.get("drive")!);
    if (url.searchParams.get("url")) return await proxy(url.searchParams.get("url")!);
    const [geraete, shop, pdfs, nl] = await Promise.all([
      geraeteKatalog(), shopKatalog(), datenblaetter(),
      noblelift().catch(e => { console.log("noblelift", String(e)); return { items: [] }; }),
    ]);
    return json({ name: "Meisterstapler Dokumenten-Center", items: [geraete, shop, ...pdfs, ...nl.items].filter(Boolean) });
  } catch (e) {
    console.log("stapler-wissen", String(e));
    return json({ error: "Wissensquelle gerade nicht verfügbar" }, 500);
  }
});
