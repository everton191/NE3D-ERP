import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  buildWebhookEventKey,
  normalizeBillingVariant,
  normalizeRequestedPlan,
  resolvePlanSlugFromMercadoPagoPlanId,
  sanitizeWebhookPayload,
  verifyMercadoPagoSignature,
  WEBHOOK_TOLERANCE_MS,
} from "../_shared/mercadopago-billing.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") || "";
const MERCADOPAGO_WEBHOOK_SECRET = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET") || "";
const MERCADOPAGO_WEBHOOK_TOLERANCE_MS = Number(Deno.env.get("MERCADOPAGO_WEBHOOK_TOLERANCE_MS") || WEBHOOK_TOLERANCE_MS);

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizePaymentStatus(status: string) {
  const value = String(status || "").toLowerCase();
  if (value === "approved") return "approved";
  if (value === "cancelled" || value === "canceled") return "cancelled";
  if (value === "refunded") return "refunded";
  if (value === "charged_back") return "charged_back";
  if (value === "rejected") return "rejected";
  return "pending";
}

function normalizeSubscriptionStatus(status: string) {
  const value = String(status || "").toLowerCase();
  if (["authorized", "active"].includes(value)) return "active";
  if (["paused", "pending"].includes(value)) return "pending";
  if (["cancelled", "canceled"].includes(value)) return "cancelled";
  return "pending";
}

function addDays(date = new Date(), days = 30) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function splitExternalReference(value: unknown) {
  const [clientCodeOrId = "", planSlug = "", kind = "", billingVariant = ""] = String(value || "").split("|");
  return { clientCodeOrId, planSlug, kind, billingVariant };
}

function normalizePlanSlug(value: unknown, mercadoPagoPlanId?: unknown) {
  const planFromRemoteId = resolvePlanSlugFromMercadoPagoPlanId(mercadoPagoPlanId);
  if (planFromRemoteId) return planFromRemoteId;
  return normalizeRequestedPlan(value).backendPlanSlug;
}

function subscriptionStatusFromPayment(status: string) {
  if (status === "approved") return "active";
  if (status === "pending") return "pending";
  if (status === "cancelled") return "cancelled";
  if (["refunded", "charged_back", "rejected"].includes(status)) return "past_due";
  return "pending";
}

function uuidOrNull(value: unknown) {
  const text = String(value || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

async function fetchMercadoPago(path: string) {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    headers: {
      Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago HTTP ${response.status}`);
  }

  return await response.json();
}

async function findClient(metadata: Record<string, unknown>, externalReference: unknown) {
  if (!supabase) throw new Error("Supabase não configurado");
  const parsed = splitExternalReference(externalReference);
  const clientId = uuidOrNull(metadata.client_id) || uuidOrNull(parsed.clientCodeOrId);
  if (clientId) {
    const { data } = await supabase.from("clients").select("id, client_code, email").eq("id", clientId).maybeSingle();
    if (data) return data;
  }

  const clientCode = String(metadata.client_code || parsed.clientCodeOrId || "").trim();
  if (clientCode) {
    const { data } = await supabase.from("clients").select("id, client_code, email").eq("client_code", clientCode).maybeSingle();
    if (data) return data;
  }

  return null;
}

async function getPlanId(planSlug: string) {
  if (!supabase) return null;
  const slug = normalizePlanSlug(planSlug);
  const { data } = await supabase.from("plans").select("id").eq("slug", slug || "free").maybeSingle();
  return data?.id || null;
}

async function getSubscriptionId(clientId: string, planSlug: string, userId?: string | null, mpSubscriptionId?: string) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data: current } = await supabase.from("subscriptions").select("id").eq("client_id", clientId).maybeSingle();
  if (current?.id) return current.id;

  const planId = await getPlanId(planSlug);
  const { data: created, error } = await supabase.from("subscriptions")
    .insert({
      client_id: clientId,
      user_id: userId || null,
      plan_id: planId,
      status: "pending",
      status_assinatura: "pending",
      mercado_pago_subscription_id: mpSubscriptionId || null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

async function syncClientFromSubscription(clientId: string) {
  if (!supabase) return null;
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("active_plan, plan_code, plan_status, payment_status, subscription_status, status, status_assinatura, plan_price, price_locked, plan_expires_at, premium_until, current_period_end, pending_plan, cancel_at_period_end, blocked_at, blocked_reason")
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) return null;

  const effectivePlan = String(subscription.active_plan || "").toLowerCase() || (subscription.plan_code === "PREMIUM" ? "premium" : "free");
  const effectiveStatus = String(subscription.plan_status || "").toUpperCase();
  const supportStatus = effectiveStatus === "BLOCKED" ? "blocked" : "active";
  const subscriptionStatus = subscription.cancel_at_period_end === true
    ? "canceling"
    : subscription.subscription_status || subscription.status_assinatura || subscription.status || "free";
  const expiresAt = subscription.premium_until || subscription.plan_expires_at || subscription.current_period_end || null;

  await supabase.from("clients")
    .update({
      status: supportStatus,
      active_plan: effectivePlan,
      plano_atual: effectivePlan,
      pending_plan: subscription.pending_plan || null,
      cancel_at_period_end: subscription.cancel_at_period_end === true,
      payment_status: subscription.payment_status || "none",
      subscription_status: subscriptionStatus,
      status_assinatura: subscriptionStatus,
      plan_price: subscription.plan_price || null,
      price_locked: subscription.price_locked === true,
      plan_expires_at: expiresAt,
      blocked_at: subscription.blocked_at || null,
      blocked_reason: subscription.blocked_reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  return subscription;
}

async function logWebhookEvent(data: {
  eventId?: string;
  eventType?: string;
  paymentId?: string;
  clientId?: string | null;
  status: string;
  payload: Record<string, unknown>;
  error?: string;
}) {
  if (!supabase) return;
  await supabase.from("erp_webhook_events").insert({
    provider: "mercado_pago",
    event_id: data.eventId || null,
    event_type: data.eventType || null,
    payment_id: data.paymentId || null,
    client_id: data.clientId || null,
    status: data.status,
    payload: sanitizeWebhookPayload(data.payload),
    error: data.error || null,
  });
}

async function logDiagnosticEvent(eventType: string, metadata: Record<string, unknown>, severity = "medium", userId?: string | null) {
  if (!supabase) return;
  await supabase.from("app_diagnostic_events").insert({
    user_id: userId || null,
    event_type: eventType,
    screen: "mercadopago-webhook",
    action: "process_webhook",
    app_version: "fase-5a2",
    platform: "backend",
    severity,
    fingerprint: `mercadopago:${eventType}:${String(metadata.data_id || metadata.event_key || "unknown")}`.slice(0, 240),
    metadata_json: sanitizeWebhookPayload(metadata),
  });
}

async function reserveWebhookEvent(eventKey: string, eventType: string, dataId: string, requestId: string, signatureTs: string, payload: Record<string, unknown>) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { error } = await supabase.from("billing_webhook_events").insert({
    provider: "mercado_pago",
    event_key: eventKey,
    event_type: eventType || null,
    external_id: dataId || null,
    request_id: requestId || null,
    signature_ts: signatureTs || null,
    status: "received",
    payload: sanitizeWebhookPayload(payload),
  });
  if (error?.code === "23505") {
    const { data: existing, error: selectError } = await supabase.from("billing_webhook_events")
      .select("status")
      .eq("provider", "mercado_pago")
      .eq("event_key", eventKey)
      .maybeSingle();
    if (selectError) throw selectError;
    if (existing?.status !== "error") return false;
    const { error: retryError } = await supabase.from("billing_webhook_events")
      .update({
        status: "received",
        error: null,
        payload: sanitizeWebhookPayload(payload),
        updated_at: new Date().toISOString(),
      })
      .eq("provider", "mercado_pago")
      .eq("event_key", eventKey);
    if (retryError) throw retryError;
    return true;
  }
  if (error) throw error;
  return true;
}

async function finishWebhookEvent(eventKey: string, status: string, error?: string) {
  if (!supabase) return;
  await supabase.from("billing_webhook_events")
    .update({
      status,
      error: error || null,
      processed_at: status === "processed" || status === "ignored" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("event_key", eventKey);
}

async function applyPayment(payment: Record<string, unknown>, rawEvent: Record<string, unknown>) {
  if (!supabase) throw new Error("Supabase não configurado");
  const metadata = (payment.metadata || {}) as Record<string, unknown>;
  const parsed = splitExternalReference(payment.external_reference);
  const client = await findClient(metadata, payment.external_reference);
  const clientId = client?.id || null;
  const clientCode = client?.client_code || metadata.client_code || parsed.clientCodeOrId;
  const userId = uuidOrNull(metadata.user_id);
  if (!userId) throw new Error("Webhook sem user_id válido");
  let planSlug = "";
  try {
    planSlug = normalizePlanSlug(
      metadata.plan_id || metadata.plan_slug || parsed.planSlug,
      metadata.mercado_pago_plan_id || payment.preapproval_plan_id || payment.preapproval_id,
    );
  } catch (error) {
    await logDiagnosticEvent("webhook_start_plan_resolution_failed", {
      data_id: payment.id,
      requested_plan: metadata.requested_plan_slug || metadata.plan_id || parsed.planSlug,
      reason: error instanceof Error ? error.message : "plan_resolution_failed",
    }, "high", userId).catch(() => {});
    throw error;
  }
  if (planSlug === "start") {
    await logDiagnosticEvent("webhook_start_plan_resolved", { data_id: payment.id, plan: "start" }, "medium", userId).catch(() => {});
  }
  const billingVariant = normalizeBillingVariant(metadata.billing_variant || parsed.billingVariant, planSlug === "start" ? "start" : "pro");
  const status = normalizePaymentStatus(String(payment.status || ""));
  const amount = Number(payment.transaction_amount || payment.total_paid_amount || 0) || 0;
  const paymentId = String(payment.id || "");
  const method = String(payment.payment_method_id || payment.payment_type_id || "");
  const mpSubscriptionId = String(payment.preapproval_id || payment.subscription_id || metadata.mercado_pago_subscription_id || "");
  const subscriptionUuid = clientId ? await getSubscriptionId(clientId, planSlug, userId, mpSubscriptionId || undefined) : null;
  const planId = await getPlanId(planSlug);

  if (clientId) {
    await supabase.from("payments").upsert({
      client_id: clientId,
      user_id: userId,
      subscription_id: subscriptionUuid,
      plan_id: planId,
      mercado_pago_payment_id: paymentId,
      mercado_pago_subscription_id: mpSubscriptionId || null,
      preference_id: String(payment.preference_id || metadata.preference_id || "") || null,
      amount,
      plan_price: amount,
      status,
      payment_method: method || null,
      metodo_pagamento: method || null,
      external_reference: String(payment.external_reference || ""),
      plan_slug: planSlug,
      billing_variant: billingVariant,
      paid_at: status === "approved" ? String(payment.date_approved || "") || new Date().toISOString() : null,
      criado_em: String(payment.date_created || "") || new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      metadata: { ...payment, user_id: userId, plan_id: planSlug, billing_variant: billingVariant },
    }, { onConflict: "mercado_pago_payment_id" });

    await supabase.from("erp_payments").upsert({
      payment_id: paymentId,
      subscription_id: mpSubscriptionId || null,
      preference_id: String(payment.preference_id || metadata.preference_id || "") || null,
      external_reference: String(payment.external_reference || ""),
      cliente_id: clientId,
      cliente_codigo: String(clientCode || ""),
      plano: planSlug,
      billing_variant: billingVariant,
      valor: amount,
      status,
      metodo_pagamento: method || null,
      payload: payment,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: "payment_id" });

    const subscription = await syncClientFromSubscription(clientId);
    await supabase.from("audit_logs").insert({
      client_id: clientId,
      action: status === "approved" ? "pagamento aprovado" : status === "pending" ? "pagamento pendente" : "pagamento recusado",
      details: {
        provider: "mercado_pago",
        status,
        payment_id: paymentId,
        amount,
        plan: planSlug,
        effective_status: subscription?.plan_status || null,
        premium_until: subscription?.premium_until || subscription?.plan_expires_at || null,
      },
    });
  }

  await logWebhookEvent({
    eventId: String(rawEvent.id || ""),
    eventType: String(rawEvent.type || rawEvent.action || "payment"),
    paymentId,
    clientId,
    status: "processed",
    payload: { event: rawEvent, payment },
  });
}

async function applySubscription(preapproval: Record<string, unknown>, rawEvent: Record<string, unknown>) {
  if (!supabase) throw new Error("Supabase não configurado");
  const metadata = (preapproval.metadata || {}) as Record<string, unknown>;
  const parsed = splitExternalReference(preapproval.external_reference);
  const client = await findClient(metadata, preapproval.external_reference);
  const clientId = client?.id || null;
  const userId = uuidOrNull(metadata.user_id);
  if (!userId) throw new Error("Webhook de assinatura sem user_id válido");
  let planSlug = "";
  try {
    planSlug = normalizePlanSlug(
      metadata.plan_id || metadata.plan_slug || parsed.planSlug,
      metadata.mercado_pago_plan_id || preapproval.preapproval_plan_id,
    );
  } catch (error) {
    await logDiagnosticEvent("webhook_start_plan_resolution_failed", {
      data_id: preapproval.id,
      requested_plan: metadata.requested_plan_slug || metadata.plan_id || parsed.planSlug,
      reason: error instanceof Error ? error.message : "plan_resolution_failed",
    }, "high", userId).catch(() => {});
    throw error;
  }
  if (planSlug === "start") {
    await logDiagnosticEvent("webhook_start_plan_resolved", { data_id: preapproval.id, plan: "start" }, "medium", userId).catch(() => {});
  }
  const billingVariant = normalizeBillingVariant(metadata.billing_variant || parsed.billingVariant, planSlug === "start" ? "start" : "pro");
  const status = normalizeSubscriptionStatus(String(preapproval.status || ""));
  const mpSubscriptionId = String(preapproval.id || "");

  if (clientId) {
    const planId = await getPlanId(planSlug);
    await getSubscriptionId(clientId, planSlug, userId, mpSubscriptionId);

    if (status === "cancelled") {
      const accessEndsAt = String(preapproval.next_payment_date || "") || null;
      const cancellationUpdate: Record<string, unknown> = {
        user_id: userId,
        plan_id: planId,
        status: "active",
        status_assinatura: "canceling",
        subscription_status: "active",
        cancel_at_period_end: true,
        mercado_pago_subscription_id: mpSubscriptionId,
        cancelled_at: new Date().toISOString(),
        metadata: { preapproval, user_id: userId, plan_id: planSlug, billing_variant: billingVariant },
      };
      if (accessEndsAt) {
        cancellationUpdate.current_period_end = accessEndsAt;
        cancellationUpdate.plan_expires_at = accessEndsAt;
      }
      await supabase.from("subscriptions")
        .update(cancellationUpdate)
        .eq("client_id", clientId);

      const clientCancellationUpdate: Record<string, unknown> = {
        plano_atual: planSlug,
        status_assinatura: "canceling",
        subscription_status: "canceling",
        cancel_at_period_end: true,
        status: "active",
      };
      if (accessEndsAt) clientCancellationUpdate.plan_expires_at = accessEndsAt;
      await supabase.from("clients")
        .update(clientCancellationUpdate)
        .eq("id", clientId);
    } else {
      await supabase.from("subscriptions")
        .update({
          user_id: userId,
          plan_id: planId,
          status: "pending",
          status_assinatura: "pending",
          cancel_at_period_end: false,
          billing_variant: billingVariant,
          mercado_pago_subscription_id: mpSubscriptionId,
          proximo_vencimento: String(preapproval.next_payment_date || "") || null,
          metadata: { preapproval, user_id: userId, plan_id: planSlug, billing_variant: billingVariant },
        })
        .eq("client_id", clientId);
    }

    await supabase.from("audit_logs").insert({
      client_id: clientId,
      action: status === "cancelled" ? "assinatura cancelada" : "webhook assinatura",
      details: { provider: "mercado_pago", status, subscription_id: mpSubscriptionId, plan: planSlug },
    });
  }

  await logWebhookEvent({
    eventId: String(rawEvent.id || ""),
    eventType: String(rawEvent.type || rawEvent.action || "subscription"),
    paymentId: mpSubscriptionId,
    clientId,
    status: "processed",
    payload: { event: rawEvent, preapproval },
  });
}

function getDataId(url: URL, event: Record<string, unknown>) {
  const data = (event.data || {}) as Record<string, unknown>;
  return String(
    url.searchParams.get("data.id")
      || url.searchParams.get("id")
      || data.id
      || event.id
      || "",
  );
}

function getSignedDataId(url: URL) {
  return String(url.searchParams.get("data.id") || url.searchParams.get("id") || "");
}

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ ok: false }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !MERCADOPAGO_ACCESS_TOKEN || !MERCADOPAGO_WEBHOOK_SECRET) {
    return jsonResponse({ ok: false }, 500);
  }

  let event: Record<string, unknown> = {};
  let dataId = "";
  let eventType = "";
  let eventKey = "";

  try {
    const url = new URL(req.url);
    event = await req.json().catch(() => ({}));
    dataId = getDataId(url, event);
    const signedDataId = getSignedDataId(url);
    eventType = String(url.searchParams.get("type") || event.type || event.action || "");
    const requestId = req.headers.get("x-request-id") || "";

    const signature = await verifyMercadoPagoSignature({
      secret: MERCADOPAGO_WEBHOOK_SECRET,
      xSignature: req.headers.get("x-signature") || "",
      xRequestId: requestId,
      dataId: signedDataId,
      toleranceMs: MERCADOPAGO_WEBHOOK_TOLERANCE_MS,
    });
    if (!signature.ok) {
      await logWebhookEvent({
        eventId: String(event.id || ""),
        eventType,
        paymentId: dataId,
        status: "invalid_signature",
        payload: event,
      });
      await logDiagnosticEvent("webhook_validation_failed", { data_id: dataId, event_type: eventType, reason: signature.reason }, "high").catch(() => {});
      return jsonResponse({ ok: false }, 401);
    }

    eventKey = buildWebhookEventKey(event, eventType, dataId, requestId);
    if (!await reserveWebhookEvent(eventKey, eventType, dataId, requestId, signature.ts, event)) {
      await logDiagnosticEvent("webhook_ignored_duplicate", { data_id: dataId, event_type: eventType, event_key: eventKey }).catch(() => {});
      return jsonResponse({ ok: true, duplicate: true });
    }
    await logDiagnosticEvent("webhook_received", { data_id: dataId, event_type: eventType, event_key: eventKey }).catch(() => {});

    await logWebhookEvent({
      eventId: String(event.id || ""),
      eventType,
      paymentId: dataId,
      status: "received",
      payload: event,
    });

    const action = String(event.action || "");
    const isPayment = eventType === "payment" || event.type === "payment" || action.startsWith("payment.");
    const isSubscription = ["subscription_preapproval", "preapproval"].includes(eventType)
      || ["subscription_preapproval", "preapproval"].includes(String(event.type || ""))
      || action.startsWith("subscription")
      || action.startsWith("preapproval");

    if (isPayment) {
      const payment = await fetchMercadoPago(`/v1/payments/${encodeURIComponent(dataId)}`);
      await applyPayment(payment, event);
      await finishWebhookEvent(eventKey, "processed");
      return jsonResponse({ ok: true });
    }

    if (isSubscription) {
      const preapproval = await fetchMercadoPago(`/preapproval/${encodeURIComponent(dataId)}`);
      await applySubscription(preapproval, event);
      await finishWebhookEvent(eventKey, "processed");
      return jsonResponse({ ok: true });
    }

    await finishWebhookEvent(eventKey, "ignored");
    return jsonResponse({ ok: true, ignored: true });
  } catch (error) {
    if (eventKey) await finishWebhookEvent(eventKey, "error", error instanceof Error ? error.message : "unknown").catch(() => {});
    await logWebhookEvent({
      eventId: String(event.id || ""),
      eventType,
      paymentId: dataId,
      status: "error",
      payload: event,
      error: error instanceof Error ? error.message : "unknown",
    }).catch(() => {});

    return jsonResponse({ ok: false }, 500);
  }
});
