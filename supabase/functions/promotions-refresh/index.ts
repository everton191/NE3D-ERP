import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const PROMOTIONS_ENDPOINT = "https://erpne3d.vercel.app/api/promocoes-3d?source=official";
const CLIENT_ID = Deno.env.get("MERCADOLIVRE_CLIENT_ID") || "";
const CLIENT_SECRET = Deno.env.get("MERCADOLIVRE_CLIENT_SECRET") || "";
const MINIMUM_REFRESH_MS = 4 * 60 * 1000;
const MAX_UNCHANGED_SCANS = 9999;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
};

function json(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), { status, headers });
}

function asPrice(value: unknown): number {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? Math.round(price * 100) / 100 : 0;
}

function asFutureDate(value: unknown): string | null {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) && timestamp > Date.now() ? new Date(timestamp).toISOString() : null;
}

function classifyProduct(title: string): string {
  const value = title.toLowerCase();
  if (/\b(filamento|pla|petg|abs|asa|tpu)\b/.test(value)) return "filamentos";
  if (/\b(resina|resin)\b/.test(value)) return "resinas";
  if (/\b(impressora|printer)\s*3d\b/.test(value)) return "impressoras";
  return "materiais";
}

function isMercadoLivreUrl(value: unknown): boolean {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" && (url.hostname === "produto.mercadolivre.com.br" || url.hostname === "www.mercadolivre.com.br");
  } catch {
    return false;
  }
}

async function getMercadoLivreToken(admin: ReturnType<typeof createClient>): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) return "";
  const { data: saved } = await admin
    .from("mercadolivre_oauth_tokens")
    .select("access_token,refresh_token,expires_at")
    .eq("singleton", true)
    .maybeSingle();
  if (!saved?.access_token || !saved?.refresh_token) return "";
  if (Date.parse(saved.expires_at) > Date.now() + 60_000) return String(saved.access_token);

  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: String(saved.refresh_token),
    }),
    signal: AbortSignal.timeout(15000),
  });
  const token = await response.json().catch(() => ({}));
  if (!response.ok || !token.access_token || !token.refresh_token) return "";
  await admin.from("mercadolivre_oauth_tokens").upsert({
    singleton: true,
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at: new Date(Date.now() + Math.max(60, Number(token.expires_in) || 21600) * 1000).toISOString(),
    scope: String(token.scope || ""),
    user_id: String(token.user_id || ""),
    updated_at: new Date().toISOString(),
  });
  return String(token.access_token);
}

async function loadMercadoLivreOffers(admin: ReturnType<typeof createClient>) {
  const token = await getMercadoLivreToken(admin);
  if (!token) return [];
  const queries = ["impressora 3d", "filamento 3d", "resina 3d", "peças impressora 3d"];
  const offers: Record<string, unknown>[] = [];
  for (const query of queries) {
    const url = new URL("https://api.mercadolibre.com/sites/MLB/search");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "15");
    const response = await fetch(url, {
      headers: { accept: "application/json", authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (response.ok) {
      const payload = await response.json().catch(() => ({}));
      for (const item of Array.isArray(payload?.results) ? payload.results : []) {
        const currentPrice = asPrice(item?.price);
        const oldPrice = asPrice(item?.original_price);
        if (!item?.id || !item?.title || !currentPrice || !isMercadoLivreUrl(item?.permalink)) continue;
        offers.push({
          id: `mercadolivre.com.br:${item.id}`,
          store: "Mercado Livre",
          host: new URL(item.permalink).hostname,
          title: String(item.title),
          category: classifyProduct(String(item.title)),
          currentPrice,
          oldPrice,
          discount: oldPrice > currentPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0,
          image: String(item.thumbnail || "").replace(/^http:/, "https:"),
          url: String(item.permalink),
          updatedAt: new Date().toISOString(),
          expiresAt: asFutureDate(
            item?.sale_price?.metadata?.campaign_end_date
            || item?.sale_price?.metadata?.promotion_end_date
            || item?.sale_price?.end_date
          ),
        });
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  return Array.from(new Map(offers.map((offer) => [String(offer.id), offer])).values());
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (!["GET", "POST"].includes(request.method)) return json(405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { ok: false, error: "BACKEND_NOT_CONFIGURED" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  if (request.method === "GET") {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data, error } = await admin
      .from("promotion_offer_state")
      .select("offer_id,store,host,title,category,current_price,old_price,discount,image_url,offer_url,source_updated_at,last_seen_at,expires_at")
      .gte("last_seen_at", cutoff)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("last_seen_at", { ascending: false })
      .limit(120);
    if (error) return json(500, { ok: false, error: "OFFERS_READ_FAILED" });
    return json(200, {
      ok: true,
      offers: (data || []).map((row) => ({
        id: row.offer_id,
        store: row.store,
        host: row.host,
        title: row.title,
        category: row.category,
        currentPrice: asPrice(row.current_price),
        oldPrice: asPrice(row.old_price),
        discount: row.discount,
        image: row.image_url || "",
        url: row.offer_url,
        updatedAt: row.source_updated_at || row.last_seen_at,
        expiresAt: row.expires_at || "",
      })),
    });
  }

  const { data: botState } = await admin
    .from("promotion_bot_state")
    .select("last_started_at,last_finished_at,last_status,last_offer_count,last_changed_count")
    .eq("singleton", true)
    .maybeSingle();

  const lastStarted = Date.parse(String(botState?.last_started_at || ""));
  if (Number.isFinite(lastStarted) && Date.now() - lastStarted < MINIMUM_REFRESH_MS) {
    return json(200, { ok: true, skipped: true, reason: "RECENT_REFRESH", state: botState });
  }

  const startedAt = new Date().toISOString();
  await admin.from("promotion_bot_state").upsert({
    singleton: true,
    last_started_at: startedAt,
    last_status: "running",
    last_error: null,
    updated_at: startedAt,
  });

  try {
    const response = await fetch(PROMOTIONS_ENDPOINT, {
      headers: { accept: "application/json", "user-agent": "Simplifica3D-Promotions-Worker/1.0" },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`PROMOTIONS_HTTP_${response.status}`);
    const payload = await response.json();
    const officialOffers = Array.isArray(payload?.offers) ? payload.offers : [];
    const mercadoLivreOffers = await loadMercadoLivreOffers(admin).catch(() => []);
    const offers = Array.from(new Map([...officialOffers, ...mercadoLivreOffers]
      .map((offer: Record<string, unknown>) => [String(offer.id || ""), offer])).values()).filter((offer) => offer.id);
    if (!payload?.ok || !offers.length) throw new Error("NO_ACTIVE_OFFERS");

    const ids = offers.map((offer: Record<string, unknown>) => String(offer.id || "")).filter(Boolean);
    const { data: previousRows, error: readError } = await admin
      .from("promotion_offer_state")
      .select("offer_id,current_price,unchanged_scans,price_changed_at,first_seen_at")
      .in("offer_id", ids);
    if (readError) throw readError;

    const previousById = new Map((previousRows || []).map((row) => [String(row.offer_id), row]));
    let changedCount = 0;
    const now = new Date().toISOString();
    const rows = offers.flatMap((offer: Record<string, unknown>) => {
      const offerId = String(offer.id || "");
      const currentPrice = asPrice(offer.currentPrice);
      if (!offerId || !currentPrice || !offer.title || !offer.url) return [];
      const previous = previousById.get(offerId);
      const samePrice = previous && asPrice(previous.current_price) === currentPrice;
      const unchangedScans = samePrice
        ? Math.min(Number(previous.unchanged_scans || 0) + 1, MAX_UNCHANGED_SCANS)
        : 0;
      if (!samePrice) changedCount += 1;
      return [{
        offer_id: offerId,
        store: String(offer.store || "Loja"),
        host: String(offer.host || ""),
        title: String(offer.title),
        category: String(offer.category || "materiais"),
        current_price: currentPrice,
        previous_price: previous ? asPrice(previous.current_price) : null,
        old_price: asPrice(offer.oldPrice) || null,
        discount: Math.max(0, Math.min(99, Math.round(Number(offer.discount) || 0))),
        image_url: String(offer.image || "") || null,
        offer_url: String(offer.url),
        unchanged_scans: unchangedScans,
        is_stable: unchangedScans >= 4,
        first_seen_at: previous?.first_seen_at || now,
        last_seen_at: now,
        price_changed_at: samePrice ? (previous?.price_changed_at || now) : now,
        source_updated_at: Number.isFinite(Date.parse(String(offer.updatedAt || ""))) ? String(offer.updatedAt) : null,
        expires_at: asFutureDate(offer.expiresAt),
        updated_at: now,
      }];
    });

    const { error: writeError } = await admin.from("promotion_offer_state").upsert(rows, { onConflict: "offer_id" });
    if (writeError) throw writeError;
    await admin.from("promotion_offer_state").delete().not("expires_at", "is", null).lte("expires_at", now);

    await admin.from("promotion_bot_state").update({
      last_finished_at: now,
      last_status: "ready",
      last_offer_count: rows.length,
      last_changed_count: changedCount,
      last_error: null,
      updated_at: now,
    }).eq("singleton", true);

    return json(200, {
      ok: true,
      skipped: false,
      offers: rows.length,
      changed: changedCount,
      stable: rows.filter((row) => row.is_stable).length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PROMOTIONS_REFRESH_FAILED";
    const failedAt = new Date().toISOString();
    await admin.from("promotion_bot_state").update({
      last_finished_at: failedAt,
      last_status: "error",
      last_error: message.slice(0, 500),
      updated_at: failedAt,
    }).eq("singleton", true);
    return json(502, { ok: false, error: message });
  }
});
