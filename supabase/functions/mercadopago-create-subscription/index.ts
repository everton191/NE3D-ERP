import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getBillingVariant, getMercadoPagoPlanId, normalizeBillingVariant, normalizeRequestedPlan } from "../_shared/mercadopago-billing.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") || "";
const MERCADOPAGO_WEBHOOK_URL = Deno.env.get("MERCADOPAGO_WEBHOOK_URL") || "";
const APP_PUBLIC_URL = Deno.env.get("APP_PUBLIC_URL") || "";
const DEFAULT_APP_PUBLIC_URL = "https://erpne3d.vercel.app";

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

function webhookUrl() {
  return MERCADOPAGO_WEBHOOK_URL || `${SUPABASE_URL.replace(/\/+$/, "")}/functions/v1/mercadopago-webhook`;
}

function backUrl(req: Request) {
  void req;
  const configuredOrigin = String(APP_PUBLIC_URL || "").trim().replace(/\/+$/, "");
  const origin = /^https:\/\//i.test(configuredOrigin) ? configuredOrigin : DEFAULT_APP_PUBLIC_URL;
  return `${origin}/?assinatura=retorno`;
}

async function getCurrentContext(req: Request, requestedClientId?: string) {
  const token = getBearerToken(req);
  if (!token) throw new Error("Usuário não autenticado");
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData?.user) throw new Error("Usuário não autenticado");

  const userId = userData.user.id;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("client_id, company_id, role, status")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: erpProfile, error: erpProfileError } = await supabase
    .from("erp_profiles")
    .select("client_id, company_id, role, status")
    .eq("id", userId)
    .maybeSingle();

  const { data: superadmin, error: superadminError } = await supabase
    .from("superadmins")
    .select("user_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (profileError || erpProfileError || superadminError) throw new Error("Não foi possível verificar o vínculo do cliente");
  const activeProfiles = [profile, erpProfile].filter((item) => item && !["inactive", "blocked"].includes(item.status));
  const linkedIds = [...new Set(activeProfiles.map((item) => String(item.client_id || "").trim()).filter(Boolean))];
  if (linkedIds.length > 1) throw new Error("Vínculos de cliente conflitantes");
  // Match the persisted authority used by erp_is_superadmin, not editable
  // metadata or a public-profile label alone.
  const isSuperadmin = !!superadmin || activeProfiles.some((item) => item === erpProfile && item.role === "superadmin");
  const linkedClientId = linkedIds[0] || "";
  const requestedId = String(requestedClientId || "").trim();
  if (!isSuperadmin && requestedId && requestedId !== linkedClientId) {
    throw new Error("Cliente informado não pertence ao usuário autenticado");
  }
  const clientId = isSuperadmin && requestedId ? requestedId : linkedClientId;

  if (!clientId) throw new Error("Cliente não vinculado");

  return { userId, clientId };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ ok: false }, 405);

  let createdProviderId = "";
  let providerRequestAttempted = false;
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("Backend de assinatura não configurado");
    }

    const body = await req.json().catch(() => ({}));
    const plan = normalizeRequestedPlan(body.plan_id || body.plano || body.plan || body.planSlug);
    const planSlug = plan.backendPlanSlug;

    const { userId, clientId } = await getCurrentContext(req, body.clienteId || body.clientId);
    const billingVariant = normalizeBillingVariant(body.billing_variant || body.billingVariant, plan.requestedPlanSlug);
    const plano = getBillingVariant(billingVariant, plan.requestedPlanSlug);
    const mercadoPagoPlanId = getMercadoPagoPlanId(plan.requestedPlanSlug);
    if (plan.requestedPlanSlug === "start" && !mercadoPagoPlanId) {
      throw new Error("Plano Start sem MERCADO_PAGO_START_PLAN_ID configurado");
    }
    // Provider aliases remain stable; the database catalog is only Start/Pro.
    const canonicalBillingVariant = plan.requestedPlanSlug === "start" ? "start_monthly" : "pro_monthly";
    const checkoutArgs = { p_client_id: clientId, p_actor_user_id: userId,
      p_plan_slug: plan.requestedPlanSlug, p_billing_variant: canonicalBillingVariant };
    // Verify server authorization, catalog and the installed persistence RPC
    // before creating anything at the external provider.
    const { data: context, error: contextError } = await supabase.rpc("persist_mercadopago_checkout", {
      ...checkoutArgs, p_preapproval: null,
    });
    if (contextError) throw contextError;
    if (context?.ready !== true || !context.client?.id || context.client.id !== clientId) {
      return jsonResponse({ ok: false, error: context?.reason || "Checkout indisponível" }, 409);
    }
    const client = context.client;
    const externalReference = `${client.id}|${planSlug}|subscription|${billingVariant}`;

    const preapprovalPayload = {
      reason: `Assinatura Simplifica 3D ${plano.name}`,
      external_reference: externalReference,
      payer_email: client.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: plano.amount,
        currency_id: "BRL",
      },
      back_url: backUrl(req),
      notification_url: webhookUrl(),
      status: "pending",
      ...(mercadoPagoPlanId ? { preapproval_plan_id: mercadoPagoPlanId } : {}),
      metadata: {
        user_id: userId,
        client_id: client.id,
        client_code: client.client_code,
        plan_id: planSlug,
        plan_slug: planSlug,
        requested_plan_slug: plan.requestedPlanSlug,
        mercado_pago_plan_id: mercadoPagoPlanId || null,
        billing_variant: billingVariant,
      },
    };

    providerRequestAttempted = true;
    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preapprovalPayload),
    });

    const mpData = await mpResponse.json().catch(() => ({}));
    if (!mpResponse.ok) {
      // A definite input/auth rejection did not create a contract. Timeouts,
      // server errors and ambiguous responses must be reconciled before retry.
      if ([400, 401, 403, 404, 405, 422].includes(mpResponse.status)) providerRequestAttempted = false;
      throw new Error(mpData.message || `Mercado Pago HTTP ${mpResponse.status}`);
    }
    createdProviderId = typeof mpData.id === "string" ? mpData.id.trim() : "";
    const checkoutUrl = new URL(String(mpData.init_point || ""));
    if (!createdProviderId || checkoutUrl.protocol !== "https:"
      || !/(^|\.)mercadopago\.com(?:\.br)?$/i.test(checkoutUrl.hostname)
      || checkoutUrl.username || checkoutUrl.password || mpData.status !== "pending") {
      throw new Error("Resposta de assinatura inválida; necessária reconciliação com o provedor");
    }
    const { data: persisted, error: persistError } = await supabase.rpc("persist_mercadopago_checkout", {
      ...checkoutArgs, p_preapproval: mpData,
    });
    if (persistError) throw persistError;
    if (persisted?.persisted !== true || !persisted.subscription_id) {
      throw new Error("Assinatura criada no provedor sem confirmação de gravação; não repetir o checkout antes da revisão");
    }

    return jsonResponse({
      ok: true,
      init_point: mpData.init_point,
      subscriptionId: mpData.id,
      amount: plano.amount,
      plan_id: plan.requestedPlanSlug,
      billing_variant: billingVariant,
      external_reference: externalReference,
      status: mpData.status || "pending",
    });
  } catch (error) {
    // Provider and database cannot share a transaction. Never disguise an
    // uncertain external contract as success or automatically create another.
    if (providerRequestAttempted) return jsonResponse({ ok: false,
      error: createdProviderId ? "CHECKOUT_PERSISTENCE_REVIEW_REQUIRED" : "CHECKOUT_PROVIDER_REVIEW_REQUIRED",
      providerCreated: createdProviderId ? true : null, providerRequestAttempted: true,
      subscriptionId: createdProviderId || null, retryable: false }, 503);
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : "Erro desconhecido" }, 400);
  }
});
