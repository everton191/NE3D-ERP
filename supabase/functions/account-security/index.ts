import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };

const clean = (value: unknown, max = 300) => String(value ?? "").trim().slice(0, max);
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const sha256 = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))).map((b) => b.toString(16).padStart(2, "0")).join("");
const jwtPayload = (token: string) => {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, "=")));
  } catch { return {}; }
};

async function context(request: Request) {
  const token = clean(request.headers.get("authorization"), 5000).replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("UNAUTHENTICATED");
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user?.id || !user.email) throw new Error("UNAUTHENTICATED");
  const { data: membership } = await admin.from("company_members").select("company_id,role,status").eq("user_id", user.id).eq("status", "active").maybeSingle();
  const { data: owned } = await admin.from("companies").select("id,deletion_status,deletion_scheduled_at,status").eq("owner_user_id", user.id).maybeSingle();
  const companyId = membership?.company_id || owned?.id || null;
  const roleMap: Record<string, string> = { attendant: "sales", finance: "cashier", read_only: "viewer" };
  const role = owned?.id === companyId ? "owner" : (roleMap[membership?.role] || membership?.role || "viewer");
  const { data: company } = companyId ? await admin.from("companies").select("id,deletion_status,deletion_scheduled_at,status").eq("id", companyId).single() : { data: null };
  return { token, user, companyId, role, company, sessionId: clean(jwtPayload(token).session_id, 80) };
}

async function audit(ctx: Awaited<ReturnType<typeof context>>, eventType: string, status: string, request: Request, message = "", metadata: Record<string, unknown> = {}) {
  await admin.from("security_events").insert({
    company_id: ctx.companyId, user_id: ctx.user.id, event_type: eventType, status, message,
    ip_hash: await sha256(clean(request.headers.get("x-forwarded-for") || "unknown", 200)),
    user_agent_hash: await sha256(clean(request.headers.get("user-agent") || "unknown", 500)),
    metadata
  });
}

function ensureAllowed(ctx: Awaited<ReturnType<typeof context>>, feature: string) {
  if (!ctx.companyId) throw new Error("COMPANY_REQUIRED");
  if (ctx.company?.deletion_status === "pending_deletion" && !["cancel_account_deletion", "export_account_data", "view_security"].includes(feature)) throw new Error("PENDING_DELETION");
  if (feature === "request_account_deletion" && ctx.role !== "owner") throw new Error("OWNER_REQUIRED");
  if (feature === "cancel_account_deletion" && ctx.role !== "owner") throw new Error("OWNER_REQUIRED");
}

async function sendAuthOtp(email: string) {
  const result = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, create_user: false })
  });
  if (!result.ok) throw new Error("EMAIL_DELIVERY_FAILED");
}

async function requestChallenge(ctx: Awaited<ReturnType<typeof context>>, request: Request, purpose: string) {
  const { data: recent } = await admin.from("user_2fa_challenges").select("resend_available_at").eq("user_id", ctx.user.id).eq("purpose", purpose).eq("status", "pending").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (recent?.resend_available_at && new Date(recent.resend_available_at).getTime() > Date.now()) throw new Error("RESEND_TOO_SOON");
  await admin.from("user_2fa_challenges").update({ status: "expired" }).eq("user_id", ctx.user.id).eq("purpose", purpose).eq("status", "pending");
  await sendAuthOtp(ctx.user.email!);
  const { data, error } = await admin.from("user_2fa_challenges").insert({
    user_id: ctx.user.id, company_id: ctx.companyId, purpose,
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    resend_available_at: new Date(Date.now() + 60_000).toISOString(),
    ip_hash: await sha256(clean(request.headers.get("x-forwarded-for") || "unknown", 200)),
    user_agent_hash: await sha256(clean(request.headers.get("user-agent") || "unknown", 500))
  }).select("id,purpose,expires_at,resend_available_at").single();
  if (error) throw error;
  await audit(ctx, "2fa_challenge_sent", "success", request, "Código de segurança enviado por e-mail.", { purpose });
  return data;
}

async function verifyAuthOtp(email: string, code: string) {
  const result = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, token: code, type: "email" })
  });
  const data = await result.json().catch(() => ({}));
  if (!result.ok || !data.access_token) throw new Error("INVALID_OR_EXPIRED_CODE");
  return data;
}

async function verifyChallenge(ctx: Awaited<ReturnType<typeof context>>, request: Request, challengeId: string, code: string) {
  const { data: challenge } = await admin.from("user_2fa_challenges").select("*").eq("id", challengeId).eq("user_id", ctx.user.id).maybeSingle();
  if (!challenge || challenge.status !== "pending") throw new Error("CHALLENGE_NOT_FOUND");
  if (new Date(challenge.expires_at).getTime() <= Date.now()) {
    await admin.from("user_2fa_challenges").update({ status: "expired" }).eq("id", challenge.id);
    throw new Error("CODE_EXPIRED");
  }
  if (challenge.attempt_count >= 5) throw new Error("TOO_MANY_ATTEMPTS");
  let session;
  try { session = await verifyAuthOtp(ctx.user.email!, code); }
  catch (error) {
    const attempts = challenge.attempt_count + 1;
    await admin.from("user_2fa_challenges").update({ attempt_count: attempts, status: attempts >= 5 ? "failed" : "pending" }).eq("id", challenge.id);
    await audit(ctx, attempts >= 5 ? "2fa_too_many_attempts" : "2fa_challenge_failed", "failed", request, "Falha ao validar código.", { purpose: challenge.purpose });
    throw error;
  }
  const sessionId = clean(jwtPayload(session.access_token).session_id, 80);
  if (!sessionId) throw new Error("INVALID_VERIFIED_SESSION");
  await admin.from("user_2fa_sessions").upsert({
    user_id: ctx.user.id, company_id: ctx.companyId, auth_session_id: sessionId,
    verified_at: new Date().toISOString(), expires_at: new Date(Date.now() + 12 * 60 * 60_000).toISOString(), revoked_at: null
  }, { onConflict: "user_id,auth_session_id" });
  await admin.from("user_2fa_challenges").update({ status: "verified", used_at: new Date().toISOString() }).eq("id", challenge.id);
  await audit(ctx, "2fa_challenge_verified", "success", request, "Código de segurança confirmado.", { purpose: challenge.purpose });
  return { challenge, session };
}

async function status(ctx: Awaited<ReturnType<typeof context>>) {
  const [{ data: settings }, { data: deletion }, { data: events }] = await Promise.all([
    admin.from("account_security_settings").select("two_factor_enabled,two_factor_channel,status,last_2fa_enabled_at,last_2fa_disabled_at").eq("owner_id", ctx.user.id).maybeSingle(),
    ctx.companyId ? admin.from("account_deletion_requests").select("id,status,requested_at,scheduled_delete_at,cancelled_at").eq("company_id", ctx.companyId).in("status", ["requested", "confirmed"]).order("created_at", { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null }),
    admin.from("security_events").select("event_type,status,message,created_at").eq("user_id", ctx.user.id).order("created_at", { ascending: false }).limit(20)
  ]);
  const { data: verifiedSession } = ctx.sessionId
    ? await admin.from("user_2fa_sessions").select("id").eq("user_id", ctx.user.id).eq("auth_session_id", ctx.sessionId).is("revoked_at", null).gt("expires_at", new Date().toISOString()).maybeSingle()
    : { data: null };
  return { settings: settings || { two_factor_enabled: false, two_factor_channel: "disabled", status: "disabled" }, deletion, events: events || [], company: ctx.company, role: ctx.role, mfa_session_verified: !!verifiedSession };
}

async function confirmDeletion(ctx: Awaited<ReturnType<typeof context>>, request: Request, challengeId: string, code: string, reason: string) {
  ensureAllowed(ctx, "request_account_deletion");
  const verified = await verifyChallenge(ctx, request, challengeId, code);
  if (verified.challenge.purpose !== "account_deletion") throw new Error("INVALID_CHALLENGE_PURPOSE");
  const now = new Date();
  const scheduled = new Date(now.getTime() + 15 * 24 * 60 * 60_000);
  await admin.from("companies").update({ deletion_status: "pending_deletion", deletion_requested_at: now.toISOString(), deletion_scheduled_at: scheduled.toISOString(), deletion_requested_by: ctx.user.id, deletion_cancelled_at: null }).eq("id", ctx.companyId);
  await admin.from("account_deletion_requests").insert({ owner_id: ctx.user.id, requested_by: ctx.user.id, company_id: ctx.companyId, confirmation_email: ctx.user.email, status: "confirmed", requested_at: now.toISOString(), scheduled_delete_at: scheduled.toISOString(), confirmed_at: now.toISOString(), reason });
  await audit(ctx, "account_deletion_requested", "success", request, "Exclusão lógica agendada com carência de 15 dias.");
  return { scheduled_for: scheduled.toISOString(), session: verified.session };
}

async function confirmCancellation(ctx: Awaited<ReturnType<typeof context>>, request: Request, challengeId: string, code: string) {
  ensureAllowed(ctx, "cancel_account_deletion");
  const verified = await verifyChallenge(ctx, request, challengeId, code);
  if (verified.challenge.purpose !== "cancel_deletion") throw new Error("INVALID_CHALLENGE_PURPOSE");
  await admin.from("companies").update({ deletion_status: "cancelled", deletion_cancelled_at: new Date().toISOString(), deletion_scheduled_at: null }).eq("id", ctx.companyId).eq("deletion_status", "pending_deletion");
  await admin.from("account_deletion_requests").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("company_id", ctx.companyId).eq("status", "confirmed");
  await audit(ctx, "account_deletion_cancelled", "success", request, "Exclusão da conta cancelada.");
  return { cancelled: true, session: verified.session };
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const body = await request.json().catch(() => ({}));
    const action = clean(body.action, 80);
    const ctx = await context(request);
    let data: unknown;
    if (action === "status") data = await status(ctx);
    else if (action === "request_2fa_enable") data = await requestChallenge(ctx, request, "enable_2fa");
    else if (action === "request_2fa_login") data = await requestChallenge(ctx, request, "login");
    else if (action === "request_2fa_disable") data = await requestChallenge(ctx, request, "disable_2fa");
    else if (action === "verify_2fa") {
      const verified = await verifyChallenge(ctx, request, clean(body.challenge_id, 80), clean(body.code, 6));
      if (verified.challenge.purpose === "enable_2fa") {
        await admin.from("account_security_settings").upsert({ owner_id: ctx.user.id, two_factor_enabled: true, two_factor_channel: "email", status: "active", last_2fa_enabled_at: new Date().toISOString() });
        await audit(ctx, "2fa_enabled", "success", request, "Autenticação em dois fatores ativada.");
      } else if (verified.challenge.purpose === "disable_2fa") {
        await admin.from("account_security_settings").upsert({ owner_id: ctx.user.id, two_factor_enabled: false, two_factor_channel: "disabled", status: "prepared", last_2fa_disabled_at: new Date().toISOString() });
        await admin.from("user_2fa_sessions").update({ revoked_at: new Date().toISOString() }).eq("user_id", ctx.user.id);
        await audit(ctx, "2fa_disabled", "success", request, "Autenticação em dois fatores desativada.");
      }
      data = { purpose: verified.challenge.purpose, session: verified.session };
    }
    else if (action === "request_account_deletion") { ensureAllowed(ctx, "request_account_deletion"); data = await requestChallenge(ctx, request, "account_deletion"); }
    else if (action === "confirm_account_deletion") data = await confirmDeletion(ctx, request, clean(body.challenge_id, 80), clean(body.code, 6), clean(body.reason, 500));
    else if (action === "request_cancel_deletion") { ensureAllowed(ctx, "cancel_account_deletion"); data = await requestChallenge(ctx, request, "cancel_deletion"); }
    else if (action === "confirm_cancel_deletion") data = await confirmCancellation(ctx, request, clean(body.challenge_id, 80), clean(body.code, 6));
    else if (action === "history") { ensureAllowed(ctx, "view_security"); data = (await admin.from("security_events").select("event_type,status,message,created_at").eq("user_id", ctx.user.id).order("created_at", { ascending: false }).limit(100)).data || []; }
    else if (action === "export_account_data") {
      ensureAllowed(ctx, "export_account_data");
      const [company, members, profiles, subscriptions, events] = await Promise.all([
        admin.from("companies").select("*").eq("id", ctx.companyId).maybeSingle(),
        admin.from("company_members").select("user_id,role,status,created_at").eq("company_id", ctx.companyId),
        admin.from("profiles").select("user_id,name,email,role,status,created_at").eq("company_id", ctx.companyId),
        admin.from("subscriptions").select("*").eq("company_id", ctx.companyId),
        admin.from("security_events").select("event_type,status,message,created_at").eq("company_id", ctx.companyId)
      ]);
      data = { exported_at: new Date().toISOString(), company: company.data, members: members.data || [], profiles: profiles.data || [], subscriptions: subscriptions.data || [], security_events: events.data || [] };
      await audit(ctx, "account_data_exported", "success", request, "Dados da conta exportados.");
    } else throw new Error("ACTION_NOT_ALLOWED");
    return response({ ok: true, data });
  } catch (error) {
    const message = clean(error instanceof Error ? error.message : error, 300) || "ACCOUNT_SECURITY_FAILED";
    const statusCode = message === "UNAUTHENTICATED" ? 401 : ["OWNER_REQUIRED", "PENDING_DELETION"].includes(message) ? 403 : message.endsWith("_NOT_FOUND") ? 404 : 400;
    return response({ ok: false, error: message }, statusCode);
  }
});
