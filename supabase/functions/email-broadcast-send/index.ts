import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_BROADCAST_FROM") || "Simplifica 3D <contato@simplifica3d.com>";
const EMAIL_BROADCAST_ENABLED = ["1", "true", "yes", "sim"].includes(String(Deno.env.get("EMAIL_BROADCAST_ENABLED") || "").toLowerCase());
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });
  if (!EMAIL_BROADCAST_ENABLED) return json(503, { error: "EMAIL_BROADCAST_DISABLED" });
  const authorization = request.headers.get("authorization") || "";
  if (!authorization || !SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) return json(401, { error: "UNAUTHORIZED" });

  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json(401, { error: "INVALID_SESSION" });
  const { data: profile } = await admin.from("erp_profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "superadmin") return json(403, { error: "SUPERADMIN_REQUIRED" });
  if (!RESEND_API_KEY) return json(503, { error: "EMAIL_PROVIDER_NOT_CONFIGURED" });

  const input = await request.json().catch(() => ({}));
  const subject = String(input.subject || "").trim().slice(0, 160);
  const message = String(input.message || "").trim().slice(0, 10000);
  const status = String(input.status || "active").trim();
  const plan = String(input.plan || "all").trim();
  const selectedIds = Array.isArray(input.client_ids) ? input.client_ids.map(String).slice(0, 500) : [];
  if (subject.length < 3 || message.length < 10) return json(400, { error: "INVALID_CONTENT" });

  let query = admin.from("clients").select("id,name,email,status,plano_atual").not("email", "is", null).limit(500);
  if (selectedIds.length) query = query.in("id", selectedIds);
  else {
    if (status !== "all") query = query.eq("status", status);
    if (plan !== "all") query = query.eq("plano_atual", plan);
  }
  const { data: clients, error: clientsError } = await query;
  if (clientsError) return json(500, { error: "RECIPIENTS_FAILED" });
  const recipients = (clients || []).filter((client) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(client.email || "")));
  if (!recipients.length) return json(400, { error: "NO_RECIPIENTS" });

  const { data: campaign, error: campaignError } = await admin.from("email_broadcasts").insert({ created_by: user.id, subject, message, audience: { status, plan, client_ids: selectedIds }, status: "processing", recipient_count: recipients.length, started_at: new Date().toISOString() }).select("id").single();
  if (campaignError || !campaign) return json(500, { error: "CAMPAIGN_CREATE_FAILED" });
  await admin.from("email_broadcast_recipients").insert(recipients.map((client) => ({ broadcast_id: campaign.id, client_id: client.id, email: client.email, client_name: client.name })));

  let sent = 0;
  let failed = 0;
  for (const client of recipients) {
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111"><p>Olá, ${String(client.name || "cliente").replace(/[<>&]/g, "")}</p><div>${message.replace(/[<>&]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[char] || char)).replace(/\n/g, "<br>")}</div><hr><small>Simplifica 3D</small></div>`;
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: EMAIL_FROM, to: [client.email], subject, html }) });
    const result = await response.json().catch(() => ({}));
    const recipientStatus = response.ok ? "sent" : "failed";
    response.ok ? sent++ : failed++;
    await admin.from("email_broadcast_recipients").update({ status: recipientStatus, provider_message_id: result.id || null, error_message: response.ok ? null : String(result.message || response.status).slice(0, 300), sent_at: response.ok ? new Date().toISOString() : null }).eq("broadcast_id", campaign.id).eq("email", client.email);
  }
  const finalStatus = failed === 0 ? "sent" : sent ? "partial" : "failed";
  await admin.from("email_broadcasts").update({ status: finalStatus, sent_count: sent, failed_count: failed, finished_at: new Date().toISOString() }).eq("id", campaign.id);
  return json(200, { ok: true, campaign_id: campaign.id, status: finalStatus, recipients: recipients.length, sent, failed });
});
