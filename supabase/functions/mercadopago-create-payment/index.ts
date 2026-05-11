import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

const BILLING_VARIANTS: Record<string, { name: string; amount: number }> = {
  premium_first_month: { name: "Premium Promo", amount: 19.9 },
  premium_monthly: { name: "Premium", amount: 29.9 },
};

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

function getPublicOrigin(req: Request) {
  const candidates = [APP_PUBLIC_URL, req.headers.get("origin"), DEFAULT_APP_PUBLIC_URL]
    .map((value) => String(value || "").trim().replace(/\/+$/, ""));
  const origin = candidates.find((value) => /^https?:\/\//i.test(value));
  return origin || DEFAULT_APP_PUBLIC_URL;
}

function backUrls(req: Request) {
  const origin = getPublicOrigin(req);
  return {
    success: `${origin}/?pagamento=sucesso`,
    pending: `${origin}/?pagamento=pendente`,
    failure: `${origin}/?pagamento=falha`,
  };
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

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, client_code, email, name, responsible_name")
    .eq("id", clientId)
    .maybeSingle();

  if (clientError || !client) throw new Error("Cliente não encontrado");
  return { userId, client, isSuperadmin };
}

function normalizePlanSlug(value: unknown) {
  const slug = String(value || "premium").toLowerCase().replace(/-/g, "_").trim();
  if (slug !== "premium") throw new Error("Plano inválido");
  return "premium";
}

function normalizeBillingVariant(value: unknown) {
  const variant = String(value || "premium_first_month").toLowerCase().replace(/-/g, "_").trim();
  return variant === "premium_monthly" ? "premium_monthly" : "premium_first_month";
}

async function resolveBillingVariant(clientId: string, requested: unknown) {
  const { data: current } = await supabase
    .from("subscriptions")
    .select("promo_used")
    .eq("client_id", clientId)
    .maybeSingle();

  if (current?.promo_used === true) return "premium_monthly";
  return normalizeBillingVariant(requested);
}

async function ensureSubscription(clientId: string, userId: string, planSlug: string, billingVariant: string) {
  const { data: plan } = await supabase
    .from("plans")
    .select("id")
    .eq("slug", planSlug)
    .maybeSingle();

  const { data: current } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();

  if (current?.id) {
    await supabase
      .from("subscriptions")
      .update({
        user_id: userId,
        plan_id: plan?.id || null,
        status: "pending",
        status_assinatura: "pending",
        billing_variant: billingVariant,
      })
      .eq("id", current.id);
    return { subscriptionId: current.id, planUuid: plan?.id || null };
  }

  const { data: created, error } = await supabase
    .from("subscriptions")
    .insert({
      client_id: clientId,
      user_id: userId,
      plan_id: plan?.id || null,
      status: "pending",
      status_assinatura: "pending",
      billing_variant: billingVariant,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { subscriptionId: created.id, planUuid: plan?.id || null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ ok: false }, 405);

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("Backend de pagamento não configurado");
    }

    const body = await req.json().catch(() => ({}));
    const planSlug = normalizePlanSlug(body.plan_id || body.plano || body.plan || body.planSlug);

    const { userId, client } = await getCurrentContext(req, body.clienteId || body.clientId);
    const billingVariant = await resolveBillingVariant(client.id, body.billing_variant || body.billingVariant);
    const plano = BILLING_VARIANTS[billingVariant];
    const { subscriptionId, planUuid } = await ensureSubscription(client.id, userId, planSlug, billingVariant);
    const externalReference = `${client.id}|${planSlug}|payment|${billingVariant}`;

    const preferencePayload = {
      items: [
        {
          id: `simplifica-3d-${billingVariant}`,
          title: `Simplifica 3D ${plano.name}`,
          description: "Assinatura Simplifica 3D",
          quantity: 1,
          currency_id: "BRL",
          unit_price: plano.amount,
        },
      ],
      payer: { email: client.email },
      external_reference: externalReference,
      back_urls: backUrls(req),
      auto_return: "approved",
      notification_url: webhookUrl(),
      statement_descriptor: "SIMPLIFICA3D",
      payment_methods: {
        installments: 12,
      },
      metadata: {
        user_id: userId,
        client_id: client.id,
        client_code: client.client_code,
        plan_id: "premium",
        plan_slug: planSlug,
        billing_variant: billingVariant,
        subscription_id: subscriptionId,
        kind: "checkout_preference",
      },
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencePayload),
    });

    const mpData = await mpResponse.json().catch(() => ({}));
    if (!mpResponse.ok) {
      throw new Error(mpData.message || `Mercado Pago HTTP ${mpResponse.status}`);
    }

    await supabase.from("payments").insert({
      client_id: client.id,
      user_id: userId,
      subscription_id: subscriptionId,
      plan_id: planUuid,
      preference_id: mpData.id || null,
      amount: plano.amount,
      plan_price: plano.amount,
      status: "pending",
      external_reference: externalReference,
      plan_slug: planSlug,
      billing_variant: billingVariant,
      metadata: { preference: mpData, user_id: userId, plan_id: "premium", billing_variant: billingVariant },
    });

    await supabase.from("audit_logs").insert({
      user_id: userId,
      client_id: client.id,
      action: "pagamento criado",
      details: { provider: "mercado_pago", plan: planSlug, preference_id: mpData.id || null },
    });

    return jsonResponse({
      ok: true,
      init_point: mpData.init_point || mpData.sandbox_init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      preference_id: mpData.id,
      amount: plano.amount,
      plan_id: "premium",
      billing_variant: billingVariant,
      external_reference: externalReference,
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : "Erro desconhecido" }, 400);
  }
});
