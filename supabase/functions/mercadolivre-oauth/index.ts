import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CLIENT_ID = Deno.env.get("MERCADOLIVRE_CLIENT_ID") || "";
const CLIENT_SECRET = Deno.env.get("MERCADOLIVRE_CLIENT_SECRET") || "";
const REDIRECT_URI = "https://erpne3d.vercel.app";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/mercadolivre-oauth`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://erpne3d.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function randomBase64Url(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Base64Url(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !CLIENT_ID || !CLIENT_SECRET) {
    return json(503, { ok: false, error: "OAUTH_NOT_CONFIGURED" });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "status";

  if (request.method === "GET" && action === "start") {
    const state = `ml_${randomBase64Url(24)}`;
    const verifier = randomBase64Url(48);
    const challenge = await sha256Base64Url(verifier);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await admin.from("mercadolivre_oauth_sessions").delete().lt("expires_at", new Date().toISOString());
    const { error } = await admin.from("mercadolivre_oauth_sessions").insert({
      state,
      code_verifier: verifier,
      expires_at: expiresAt,
    });
    if (error) return json(500, { ok: false, error: "OAUTH_STATE_FAILED" });

    const authorization = new URL("https://auth.mercadolivre.com.br/authorization");
    authorization.searchParams.set("response_type", "code");
    authorization.searchParams.set("client_id", CLIENT_ID);
    authorization.searchParams.set("redirect_uri", REDIRECT_URI);
    authorization.searchParams.set("state", state);
    authorization.searchParams.set("code_challenge", challenge);
    authorization.searchParams.set("code_challenge_method", "S256");
    return Response.redirect(authorization.toString(), 302);
  }

  if (request.method === "GET" && action === "status") {
    const { data } = await admin
      .from("mercadolivre_oauth_tokens")
      .select("expires_at,updated_at")
      .eq("singleton", true)
      .maybeSingle();
    return json(200, { ok: true, connected: Boolean(data), updatedAt: data?.updated_at || null });
  }

  if (request.method === "POST" && action === "exchange") {
    const body = await request.json().catch(() => ({}));
    const code = String(body?.code || "");
    const state = String(body?.state || "");
    if (!code || !state.startsWith("ml_")) return json(400, { ok: false, error: "OAUTH_CODE_REQUIRED" });

    const { data: session } = await admin
      .from("mercadolivre_oauth_sessions")
      .select("code_verifier,expires_at")
      .eq("state", state)
      .maybeSingle();
    if (!session || Date.parse(session.expires_at) <= Date.now()) {
      return json(400, { ok: false, error: "OAUTH_STATE_INVALID" });
    }

    const form = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: session.code_verifier,
    });
    const tokenResponse = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(15000),
    });
    const token = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !token.access_token || !token.refresh_token) {
      return json(400, { ok: false, error: String(token.error || "TOKEN_EXCHANGE_FAILED") });
    }

    const now = new Date().toISOString();
    const { error: saveError } = await admin.from("mercadolivre_oauth_tokens").upsert({
      singleton: true,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: new Date(Date.now() + Math.max(60, Number(token.expires_in) || 21600) * 1000).toISOString(),
      scope: String(token.scope || ""),
      user_id: String(token.user_id || ""),
      updated_at: now,
    });
    if (saveError) return json(500, { ok: false, error: "TOKEN_SAVE_FAILED" });
    await admin.from("mercadolivre_oauth_sessions").delete().eq("state", state);
    return json(200, { ok: true, connected: true });
  }

  return json(405, { ok: false, error: "METHOD_NOT_ALLOWED", functionUrl: FUNCTION_URL });
});
