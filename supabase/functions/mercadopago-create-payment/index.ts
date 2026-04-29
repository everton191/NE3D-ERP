import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") || "";
const MERCADOPAGO_WEBHOOK_URL = Deno.env.get("MERCADOPAGO_WEBHOOK_URL") || "";
const APP_PUBLIC_URL = Deno.env.get("APP_PUBLIC_URL") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const PLANOS: Record<string, { name: string; amount: number }> = {
  pro: { name: "Pro", amount: 29.9 },
  premium: { name: "Premium", amount: 54.9 },
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

function backUrls(req: Request) {
  const origin = APP_PUBLIC_URL || req.headers.get("origin") || "https://simplifica3d.app";
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

async function ensureSubscription(clientId: string, planSlug: string) {
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
      .update({ plan_id: plan?.id || null, status: "pending", status_assinatura: "pendente" })
      .eq("id", current.id);
    return current.id;
  }

  const { data: created, error } = await supabase
    .from("subscriptions")
    .insert({ client_id: clientId, plan_id: plan?.id || null, status: "pending", status_assinatura: "pendente" })
    .select("id")
    .single();

  if (error) throw error;
  return created.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ ok: false }, 405);

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("Backend de pagamento não configurado");
    }

    const body = await req.json().catch(() => ({}));
    const planSlug = String(body.plano || body.plan || body.planSlug || "pro").toLowerCase();
    const plano = PLANOS[planSlug];
    if (!plano) throw new Error("Plano inválido");

    const { userId, client } = await getCurrentContext(req, body.clienteId || body.clientId);
    const subscriptionId = await ensureSubscription(client.id, planSlug);
    const externalReference = `${client.client_code || client.id}|${planSlug}|payment`;

    const preferencePayload = {
      items: [
        {
          id: `simplifica-3d-${planSlug}`,
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
      notification_url: webhookUrl(),
      metadata: {
        client_id: client.id,
        client_code: client.client_code,
        plan_slug: planSlug,
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
      subscription_id: subscriptionId,
      preference_id: mpData.id || null,
      amount: plano.amount,
      status: "pending",
      external_reference: externalReference,
      plan_slug: planSlug,
      metadata: { preference: mpData },
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
      external_reference: externalReference,
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : "Erro desconhecido" }, 400);
  }
});
