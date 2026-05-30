import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

async function getCurrentContext(req: Request, requestedClientId?: string) {
  const token = getBearerToken(req);
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData?.user) throw new Error("Usuário não autenticado");

  const userId = userData.user.id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: erpProfile } = await supabase
    .from("erp_profiles")
    .select("client_id, role")
    .eq("id", userId)
    .maybeSingle();

  const isSuperadmin = profile?.role === "superadmin" || erpProfile?.role === "superadmin";
  const clientId = isSuperadmin && requestedClientId
    ? requestedClientId
    : (profile?.client_id || erpProfile?.client_id || requestedClientId || "");

  if (!clientId) throw new Error("Cliente não vinculado");
  return { userId, clientId, isSuperadmin };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ ok: false }, 405);

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("Backend de cancelamento não configurado");
    }

    const body = await req.json().catch(() => ({}));
    const { userId, clientId } = await getCurrentContext(req, body.clienteId || body.clientId);

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("id, mercado_pago_subscription_id, current_period_end, plan_expires_at, premium_until, expires_at, next_billing_at, proximo_vencimento")
      .eq("client_id", clientId)
      .maybeSingle();

    if (error || !subscription) throw new Error("Assinatura não encontrada");
    const mpSubscriptionId = String(body.subscriptionId || subscription.mercado_pago_subscription_id || "");
    if (!mpSubscriptionId) throw new Error("Assinatura Mercado Pago não vinculada");

    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(mpSubscriptionId)}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "cancelled" }),
    });

    const mpData = await mpResponse.json().catch(() => ({}));
    if (!mpResponse.ok) {
      throw new Error(mpData.message || `Mercado Pago HTTP ${mpResponse.status}`);
    }

    const accessEndsAt = subscription.current_period_end
      || subscription.plan_expires_at
      || subscription.premium_until
      || subscription.expires_at
      || subscription.next_billing_at
      || subscription.proximo_vencimento
      || null;
    await supabase.from("subscriptions").update({
      status: "active",
      status_assinatura: "canceling",
      subscription_status: "active",
      cancel_at_period_end: true,
      cancelled_at: new Date().toISOString(),
      metadata: { cancel: mpData, cancel_at_period_end: true, access_ends_at: accessEndsAt },
    }).eq("id", subscription.id);

    await supabase.from("clients")
      .update({
        status_assinatura: "canceling",
        subscription_status: "canceling",
        cancel_at_period_end: true,
        plan_expires_at: accessEndsAt,
        status: "active",
      })
      .eq("id", clientId);

    await supabase.from("audit_logs").insert({
      user_id: userId,
      client_id: clientId,
      action: "assinatura cancelada",
      details: { provider: "mercado_pago", subscription_id: mpSubscriptionId, cancel_at_period_end: true, access_ends_at: accessEndsAt },
    });

    return jsonResponse({ ok: true, subscriptionId: mpSubscriptionId, cancelAtPeriodEnd: true, accessEndsAt });
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : "Erro desconhecido" }, 400);
  }
});
