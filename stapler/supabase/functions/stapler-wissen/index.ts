// Wissensquelle für die Stapler-KI (läuft im Supabase-Projekt „Meisterstapler Leads“).
// GET /functions/v1/stapler-wissen?code=<Zugangscode>
// Liefert Gerätekatalog, Online-Shop-Katalog und Datenblätter als lernbare Dokumente.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") || req.headers.get("x-zugangscode") || "").trim().toUpperCase();
  if (code !== ZUGANGSCODE) return json({ error: "Zugangscode ungültig" }, 401);
  try {
    const [geraete, shop, pdfs] = await Promise.all([geraeteKatalog(), shopKatalog(), datenblaetter()]);
    return json({ name: "Meisterstapler Dokumenten-Center", items: [geraete, shop, ...pdfs].filter(Boolean) });
  } catch (e) {
    console.log("stapler-wissen", String(e));
    return json({ error: "Wissensquelle gerade nicht verfügbar" }, 500);
  }
});
