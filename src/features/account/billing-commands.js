(function attachBillingCommands(global) {
  "use strict";

  function normalizarSlugPlano(slug = "free", deps = {}) {return deps.window.SimplificaPlanNormalizers.normalizarSlugPlano(slug);

  }

  function normalizarPlanoSaas(plano = {}, deps = {}) {const slug = deps.normalizarSlugPlano(plano.slug || plano.id || "free");
  const padrao = deps.DEFAULT_SAAS_PLANS.find((item) => item.slug === slug || item.id === slug) || deps.DEFAULT_SAAS_PLANS[0];
  const planoPadrao = deps.DEFAULT_SAAS_PLANS.some((item) => item.slug === slug || item.id === slug);
  return {
    id: String(plano.id || slug),
    slug,
    name: String(planoPadrao ? padrao.name : (plano.name || plano.nome || padrao.name || "Plano")),
    price: Math.max(0, Number(planoPadrao ? padrao.price : (plano.price ?? plano.preco ?? padrao.price ?? 0))),
    maxUsers: Math.max(1, Number(planoPadrao ? padrao.maxUsers : (plano.maxUsers ?? plano.max_users ?? padrao.maxUsers ?? 1))),
    maxOrders: planoPadrao ? padrao.maxOrders : (plano.maxOrders === null || plano.max_orders === null ? null : Math.max(1, Number(plano.maxOrders ?? plano.max_orders ?? padrao.maxOrders ?? 50))),
    maxClients: planoPadrao ? padrao.maxClients : (plano.maxClients === null || plano.max_clients === null ? null : Math.max(1, Number(plano.maxClients ?? plano.max_clients ?? padrao.maxClients ?? 10))),
    maxCalculatorUses: planoPadrao ? padrao.maxCalculatorUses : (plano.maxCalculatorUses === null || plano.max_calculator_uses === null ? null : Math.max(1, Number(plano.maxCalculatorUses ?? plano.max_calculator_uses ?? padrao.maxCalculatorUses ?? 30))),
    maxStorageMb: planoPadrao ? padrao.maxStorageMb : (plano.maxStorageMb === null || plano.max_storage_mb === null ? null : Math.max(1, Number(plano.maxStorageMb ?? plano.max_storage_mb ?? padrao.maxStorageMb ?? deps.FREE_BACKUP_LIMIT_MB))),
    maxDevices: planoPadrao ? padrao.maxDevices : Math.max(1, Number(plano.maxDevices ?? plano.max_devices ?? padrao.maxDevices ?? deps.FREE_DEVICE_LIMIT)),
    allowPdf: Boolean(planoPadrao ? padrao.allowPdf : (plano.allowPdf ?? plano.allow_pdf ?? padrao.allowPdf)),
    allowReports: Boolean(planoPadrao ? padrao.allowReports : (plano.allowReports ?? plano.allow_reports ?? padrao.allowReports)),
    allowPermissions: Boolean(planoPadrao ? padrao.allowPermissions : (plano.allowPermissions ?? plano.allow_permissions ?? padrao.allowPermissions)),
    allowEmployees: Boolean(planoPadrao ? padrao.allowEmployees : (plano.allowEmployees ?? plano.allow_employees ?? padrao.allowEmployees)),
    allowCustomization: Boolean(planoPadrao ? padrao.allowCustomization : (plano.allowCustomization ?? plano.allow_customization ?? padrao.allowCustomization)),
    kind: String(planoPadrao ? padrao.kind : (plano.kind || padrao.kind || "paid")),
    durationDays: Number(planoPadrao ? padrao.durationDays : (plano.durationDays ?? plano.duration_days ?? padrao.durationDays ?? 0)) || 0,
    active: plano.active !== false && plano.ativo !== false,
    recommended: planoPadrao ? !!padrao.recommended : (plano.recommended === true || plano.recomendado === true || slug === "start"),
    sortOrder: Number(planoPadrao ? padrao.sortOrder : (plano.sortOrder ?? plano.sort_order ?? padrao.sortOrder ?? 100)) || 100
  };

  }

  function normalizarAssinaturaSaas(assinatura = {}, deps = {}) {const planoRelacional = assinatura.plans?.slug || assinatura.plan?.slug || "";
  const planSlug = deps.normalizarSlugPlano(assinatura.planSlug || assinatura.plan_slug || planoRelacional || assinatura.planId || assinatura.plan_id || "free");
  const status = deps.normalizarStatusPlano(assinatura.status || assinatura.statusAssinatura || assinatura.status_assinatura || "pending");
  const activePlanInformado = assinatura.activePlan || assinatura.active_plan || "";
  const activePlan = deps.normalizarSlugPlano(activePlanInformado || (status === "pending" ? "free" : planSlug));
  const pendingPlan = assinatura.pendingPlan || assinatura.pending_plan ? deps.normalizarSlugPlano(assinatura.pendingPlan || assinatura.pending_plan) : "";
  const paymentStatus = deps.normalizarStatusPagamento(assinatura.paymentStatus || assinatura.payment_status || (status === "pending" ? "pending" : "none"));
  const cancelAtPeriodEnd = deps.normalizarBooleanoPlano(assinatura.cancelAtPeriodEnd ?? assinatura.cancel_at_period_end);
  const subscriptionStatus = deps.normalizarStatusAssinaturaDefinitivo(assinatura.subscriptionStatus || assinatura.subscription_status || (cancelAtPeriodEnd && deps.isPlanoPagoSlug(activePlan) ? "canceling" : deps.isPlanoPagoSlug(activePlan) ? "active" : "free"));
  const currentPeriodStart = assinatura.currentPeriodStart || assinatura.current_period_start || assinatura.startedAt || assinatura.started_at || assinatura.trialStartedAt || assinatura.trial_started_at || assinatura.trialStartAt || assinatura.trial_start_at || assinatura.createdAt || assinatura.created_at || new Date().toISOString();
  const currentPeriodEnd = assinatura.premiumUntil || assinatura.premium_until || assinatura.planExpiresAt || assinatura.plan_expires_at || assinatura.currentPeriodEnd || assinatura.current_period_end || assinatura.expiresAt || assinatura.expires_at || assinatura.nextBillingAt || assinatura.next_billing_at || assinatura.proximoVencimento || assinatura.proximo_vencimento || assinatura.trialEndAt || assinatura.trial_end_at || "";
  const trialStartedAt = assinatura.trialStartedAt || assinatura.trial_started_at || assinatura.trialStartAt || assinatura.trial_start_at || (activePlan === "premium_trial" ? currentPeriodStart : "");
  const trialExpiresAt = assinatura.trialExpiresAt || assinatura.trial_expires_at || assinatura.trialEndAt || assinatura.trial_end_at || (activePlan === "premium_trial" ? currentPeriodEnd : "");
  const isTrialActive = false;
  const planPrice = Math.max(0, Number(assinatura.planPrice ?? assinatura.plan_price ?? assinatura.price_locked_amount ?? 0) || 0);
  return {
    id: assinatura.id || deps.criarIdLocal("sub"),
    clientId: assinatura.clientId || assinatura.client_id || "",
    companyId: assinatura.companyId || assinatura.company_id || "",
    userId: assinatura.userId || assinatura.user_id || "",
    planId: planSlug,
    planSlug,
    activePlan,
    pendingPlan,
    paymentStatus,
    subscriptionStatus,
    status,
    statusAssinatura: deps.normalizarStatusPlano(assinatura.statusAssinatura || assinatura.status_assinatura || status),
    cancelAtPeriodEnd,
    promoUsed: assinatura.promoUsed === true || assinatura.promo_used === true,
    billingVariant: deps.normalizarBillingVariant(assinatura.billingVariant || assinatura.billing_variant || (assinatura.promoUsed || assinatura.promo_used ? "premium_monthly" : "premium_first_month")),
    planPrice,
    priceLocked: assinatura.priceLocked === true || assinatura.price_locked === true,
    currentPeriodStart,
    currentPeriodEnd,
    planExpiresAt: currentPeriodEnd,
    trialStartedAt,
    trialExpiresAt,
    trialConsumedAt: assinatura.trialConsumedAt || assinatura.trial_consumed_at || assinatura.trialUsedAt || assinatura.trial_used_at || "",
    isTrialActive,
    pendingStartedAt: assinatura.pendingStartedAt || assinatura.pending_started_at || "",
    planCode: String(assinatura.planCode || assinatura.plan_code || "").toUpperCase(),
    effectiveStatus: assinatura.effectiveStatus || assinatura.effective_status || "",
    manualOverride: assinatura.manualOverride === true || assinatura.manual_override === true,
    manualOverrideReason: assinatura.manualOverrideReason || assinatura.manual_override_reason || "",
    blockedAt: assinatura.blockedAt || assinatura.blocked_at || "",
    blockedReason: assinatura.blockedReason || assinatura.blocked_reason || "",
    archivedAt: assinatura.archivedAt || assinatura.archived_at || "",
    anonymizedAt: assinatura.anonymizedAt || assinatura.anonymized_at || "",
    mercadoPagoSubscriptionId: assinatura.mercadoPagoSubscriptionId || assinatura.mercado_pago_subscription_id || assinatura.subscriptionIdMercadoPago || "",
    startedAt: assinatura.startedAt || assinatura.started_at || currentPeriodStart,
    expiresAt: assinatura.expiresAt || assinatura.expires_at || currentPeriodEnd,
    nextBillingAt: assinatura.nextBillingAt || assinatura.next_billing_at || assinatura.proximoVencimento || assinatura.proximo_vencimento || currentPeriodEnd,
    lastPaymentAt: assinatura.lastPaymentAt || assinatura.ultimoPagamento || assinatura.ultimo_pagamento || "",
    overdueSince: assinatura.overdueSince || assinatura.overdue_since || ""
  };

  }

  function getBillingVariantAssinatura(assinatura, deps = {}) {
  if (assinatura === undefined) assinatura = deps.getAssinaturaSaas();

  // resolved default for getAssinaturaSaas
const plano = deps.normalizarSlugPlano(assinatura?.activePlan || assinatura?.planSlug || deps.getBillingConfig().activePlan || deps.getBillingConfig().planSlug || "free");
  if (plano === "pro") return "pro_monthly";
  if (plano === "start") return "start_monthly";
  return assinatura?.promoUsed ? "pro_monthly" : "start_monthly";

  }

  function calcularStatusAssinatura(assinatura, deps = {}) {
  if (assinatura === undefined) assinatura = deps.getAssinaturaSaas();

  // resolved default for getAssinaturaSaas
if (!assinatura) return { status: "active", blockLevel: "none", diasAtraso: 0 };
  assinatura = deps.normalizarAssinaturaSaas(assinatura);
  if (assinatura.paymentStatus === "pending") {
    return { status: deps.isPlanoPagoSlug(assinatura.activePlan) ? "active" : "free", blockLevel: "none", diasAtraso: 0, pending: true };
  }
  if (assinatura.activePlan === "free") return { status: "free", blockLevel: "none", diasAtraso: 0 };
  const status = deps.normalizarStatusPlano(assinatura.status || assinatura.statusAssinatura);
  if (["cancelled", "expired"].includes(status)) return { status, blockLevel: "total", diasAtraso: 0 };
  if (status === "past_due") return { status, blockLevel: "total", diasAtraso: 1 };
  const vencimento = Date.parse(assinatura.planExpiresAt || assinatura.trialExpiresAt || assinatura.currentPeriodEnd || assinatura.expiresAt || assinatura.nextBillingAt || 0) || 0;
  if (assinatura.cancelAtPeriodEnd && (!vencimento || vencimento >= Date.now())) return { status: "canceling", blockLevel: "none", diasAtraso: 0, cancelAtPeriodEnd: true };
  if ((status === "active" || status === "trialing") && vencimento && vencimento >= Date.now()) {
    return { status, blockLevel: "none", diasAtraso: 0 };
  }
  if (["start", "pro"].includes(assinatura.activePlan) && status === "active" && !vencimento) {
    return { status, blockLevel: "none", diasAtraso: 0 };
  }
  if (assinatura.activePlan === "free" && status === "active") {
    return { status, blockLevel: "none", diasAtraso: 0 };
  }
  const diasAtraso = vencimento ? Math.max(0, Math.floor((Date.now() - vencimento) / (24 * 60 * 60 * 1000))) : 0;
  return { status: status === "trialing" ? "expired" : "past_due", blockLevel: "total", diasAtraso };

  }

  function calcularFimTrial(inicio, dias, deps = {}) {
  if (dias === undefined) dias = deps.getBillingConfig().trialDays;
const dataInicio = deps.getTimestampPlano(inicio);
  const quantidadeDias = Math.max(0, Number(dias) || 0);
  if (!dataInicio || !quantidadeDias) return "";
  return new Date(dataInicio + quantidadeDias * 24 * 60 * 60 * 1000).toISOString();

  }

  function resolverEstadoPlano(user , options = {}, deps = {}) {
  if (user === undefined) user = deps.getUsuarioAtual();

  // resolved default for getUsuarioAtual
try {
    deps.limparCheckoutsLocaisExpirados();
  } catch (_) {}
  const now = Number(options.now || Date.now());
  const assinatura = options.subscription === undefined
    ? deps.getAssinaturaSaas(user?.clientId || deps.getBillingConfig().clientId || "")
    : options.subscription;
  const cliente = options.client === undefined ? deps.getClienteSaasAtual() : options.client;
  const source = options.source || (assinatura ? "supabase/local-subscription" : "local-cache");

  if (deps.isSuperAdmin(user)) {
    const snapshotSuper = {
      state: deps.PLAN_ACCESS_STATES.ACTIVE,
      source,
      activePlan: "pro",
      pendingPlan: "",
      paymentStatus: "none",
      subscriptionStatus: "active",
      statusPlano: "active",
      pending: false,
      pendingExpired: false,
      trialStartedAt: "",
      trialExpiresAt: "",
      trialRemainingDays: 0,
      planExpiresAt: "",
      planRemainingDays: 9999,
      hasPremium: true,
      isTrialActive: false,
      isPaidActive: true,
      adsAllowed: false,
      blockLevel: "none"
    };
    deps.logEstadoPlanoDebug(snapshotSuper);
    return snapshotSuper;
  }

  if (options.ignoreEffectiveLicense !== true) {
    const licencaEfetiva = deps.getLicencaEfetivaSnapshotLocal();
    const clientIdUsuario = String(user?.clientId || deps.getBillingConfig().clientId || "");
    const clientIdLicenca = String(licencaEfetiva?.clientId || "");
    if (licencaEfetiva && (!clientIdUsuario || !clientIdLicenca || clientIdUsuario === clientIdLicenca)) {
      const snapshotEfetivo = deps.montarSnapshotPlanoDeLicencaEfetiva(licencaEfetiva, licencaEfetiva.source || source);
      if (snapshotEfetivo) {
        deps.logEstadoPlanoDebug(snapshotEfetivo);
        return snapshotEfetivo;
      }
    }
  }

  const activePlan = deps.normalizarSlugPlano(deps.primeiroValorPlano(
    assinatura?.activePlan,
    assinatura?.active_plan,
    cliente?.activePlan,
    cliente?.active_plan,
    deps.getBillingConfig().activePlan,
    user?.activePlan,
    user?.active_plan,
    assinatura?.planSlug,
    assinatura?.plan_slug,
    assinatura?.planId,
    assinatura?.plan_id,
    cliente?.planoAtual,
    cliente?.plano_atual,
    deps.getBillingConfig().planSlug,
    user?.planSlug,
    user?.plan_slug,
    user?.planoAtual,
    "free"
  ));
  const pendingPlan = deps.normalizarSlugPlano(deps.primeiroValorPlano(
    assinatura?.pendingPlan,
    assinatura?.pending_plan,
    cliente?.pendingPlan,
    cliente?.pending_plan,
    deps.getBillingConfig().pendingPlan,
    user?.pendingPlan,
    user?.pending_plan,
    ""
  ));
  const paymentStatus = deps.normalizarStatusPagamento(deps.primeiroValorPlano(
    assinatura?.paymentStatus,
    assinatura?.payment_status,
    cliente?.paymentStatus,
    cliente?.payment_status,
    deps.getBillingConfig().paymentStatus,
    user?.paymentStatus,
    user?.payment_status,
    "none"
  ));
  const subscriptionStatus = deps.normalizarStatusAssinaturaDefinitivo(deps.primeiroValorPlano(
    assinatura?.subscriptionStatus,
    assinatura?.subscription_status,
    cliente?.subscriptionStatus,
    cliente?.subscription_status,
    deps.getBillingConfig().subscriptionStatus,
    user?.subscriptionStatus,
    user?.subscription_status,
    deps.isPlanoPagoSlug(activePlan) ? "active" : "free"
  ));
  const statusPlanoBruto = deps.primeiroValorPlano(
    assinatura?.status,
    assinatura?.statusAssinatura,
    assinatura?.status_assinatura,
    cliente?.statusAssinatura,
    cliente?.status_assinatura,
    deps.getBillingConfig().licenseStatus,
    user?.planStatus,
    "active"
  );
  const statusPlano = ["free", "gratis", "grátis"].includes(String(statusPlanoBruto || "").toLowerCase().trim())
    ? "active"
    : deps.normalizarStatusPlano(statusPlanoBruto);
  const trial = deps.getTrialSnapshotPlano({
    trialStartedAt: deps.primeiroValorPlano(assinatura?.trialStartedAt, assinatura?.trial_started_at, cliente?.trialStartedAt, cliente?.trial_started_at, deps.getBillingConfig().trialStartedAt, user?.trialStartedAt, user?.trial_started_at),
    trialExpiresAt: deps.primeiroValorPlano(assinatura?.trialExpiresAt, assinatura?.trial_expires_at, cliente?.trialExpiresAt, cliente?.trial_expires_at, deps.getBillingConfig().trialExpiresAt, user?.trialExpiresAt, user?.trial_expires_at),
    trialDays: deps.primeiroValorPlano(assinatura?.trialDays, assinatura?.trial_days, cliente?.trialDays, cliente?.trial_days, deps.getBillingConfig().trialDays, user?.trialDays, user?.trial_days, deps.DEFAULT_TRIAL_DAYS)
  }, now);
  const planExpiresAt = deps.primeiroValorPlano(
    assinatura?.planExpiresAt,
    assinatura?.plan_expires_at,
    assinatura?.currentPeriodEnd,
    assinatura?.current_period_end,
    assinatura?.expiresAt,
    assinatura?.expires_at,
    assinatura?.nextBillingAt,
    assinatura?.next_billing_at,
    cliente?.planExpiresAt,
    cliente?.plan_expires_at,
    deps.getBillingConfig().planExpiresAt,
    deps.getBillingConfig().paidUntil,
    user?.planExpiresAt,
    user?.plan_expires_at
  );
  const planExpiresMs = deps.getTimestampPlano(planExpiresAt);
  const planExpired = !!planExpiresMs && planExpiresMs <= now;
  const pendingStartedAt = deps.primeiroValorPlano(assinatura?.pendingStartedAt, assinatura?.pending_started_at, deps.getBillingConfig().pendingStartedAt, cliente?.pendingStartedAt, cliente?.pending_started_at);
  const pendingExpired = paymentStatus === "pending" && (!pendingStartedAt || (now - deps.getTimestampPlano(pendingStartedAt) > deps.LOCAL_CHECKOUT_PENDING_TTL_MS));
  const pending = !pendingExpired && (paymentStatus === "pending" || (!!pendingPlan && pendingPlan !== "free") || statusPlano === "pending");
  const cancelAtPeriodEnd = deps.normalizarBooleanoPlano(deps.primeiroValorPlano(
    assinatura?.cancelAtPeriodEnd,
    assinatura?.cancel_at_period_end,
    cliente?.cancelAtPeriodEnd,
    cliente?.cancel_at_period_end,
    deps.getBillingConfig().cancelAtPeriodEnd,
    user?.cancelAtPeriodEnd,
    user?.cancel_at_period_end,
    false
  ));
  const blocked = deps.usuarioEstaBloqueado(user) || (paymentStatus !== "pending" && (deps.getBillingConfig().licenseStatus === "blocked" || deps.getBillingConfig().licenseBlockLevel === "total" || deps.getBillingConfig().blocked));
  const paidActive = ["start", "pro"].includes(activePlan)
    && !planExpired
    && (["active", "canceling"].includes(subscriptionStatus) || ["active", "canceling"].includes(statusPlano) || paymentStatus === "approved" || cancelAtPeriodEnd);
  let state = deps.PLAN_ACCESS_STATES.FREE;
  if (blocked) {
    state = deps.PLAN_ACCESS_STATES.BLOCKED;
  } else if (paidActive) {
    state = deps.PLAN_ACCESS_STATES.ACTIVE;
  } else if (pending) {
    state = deps.PLAN_ACCESS_STATES.PENDING;
  } else if (
    ["past_due", "cancelled", "expired"].includes(subscriptionStatus)
    || ["past_due", "cancelled", "expired"].includes(statusPlano)
    || (["start", "pro"].includes(activePlan) && planExpired)
  ) {
    state = deps.PLAN_ACCESS_STATES.EXPIRED;
  }

  const planoEfetivoUnico = state === deps.PLAN_ACCESS_STATES.ACTIVE ? activePlan : "free";
  const snapshot = {
    state,
    source,
    activePlan: planoEfetivoUnico,
    pendingPlan: pendingPlan === "free" ? "" : pendingPlan,
    paymentStatus,
    subscriptionStatus,
    statusPlano,
    cancelAtPeriodEnd,
    pending,
    pendingExpired: !!pendingExpired,
    trialStartedAt: trial.startedAt,
    trialExpiresAt: trial.expiresAt,
    trialRemainingDays: trial.remainingDays,
    planExpiresAt: planExpiresAt || "",
    planRemainingDays: planExpiresAt ? deps.getRemainingDays(planExpiresAt, now) : 0,
    hasPremium: state === deps.PLAN_ACCESS_STATES.ACTIVE,
    isTrialActive: false,
    isPaidActive: state === deps.PLAN_ACCESS_STATES.ACTIVE,
    adsAllowed: [deps.PLAN_ACCESS_STATES.FREE, deps.PLAN_ACCESS_STATES.PENDING, deps.PLAN_ACCESS_STATES.EXPIRED].includes(state),
    blockLevel: state === deps.PLAN_ACCESS_STATES.BLOCKED ? "total" : "none"
  };
  deps.logEstadoPlanoDebug(snapshot);
  return snapshot;

  }

  function verificarVencimentoPlanoLocal(salvar = true, deps = {}) {if (deps.licencaEfetivaRemotaFresca()) {
    return;
  }

  const hoje = deps.hojeIsoData();
  let alterou = false;

  if (deps.getBillingConfig().paymentStatus === "pending") {
    const inicioPendenteGlobal = deps.getTimestampPlano(deps.getBillingConfig().pendingStartedAt || deps.getBillingConfig().updatedAt || 0);
    if (!inicioPendenteGlobal || Date.now() - inicioPendenteGlobal > deps.LOCAL_CHECKOUT_PENDING_TTL_MS) {
      deps.getBillingConfig().pendingPlan = "";
      deps.getBillingConfig().paymentStatus = "none";
      deps.getBillingConfig().pendingStartedAt = "";
      alterou = true;
    }
  }

  deps.getSaasSubscriptions().forEach((assinatura) => {
    const plano = deps.getPlanoSaas(assinatura.activePlan || assinatura.planSlug);
    const vencimento = deps.getTimestampPlano(assinatura.planExpiresAt || assinatura.trialExpiresAt || assinatura.currentPeriodEnd || assinatura.expiresAt || assinatura.nextBillingAt || 0);
    if (assinatura.paymentStatus === "pending") {
      const inicioPendente = deps.getTimestampPlano(assinatura.pendingStartedAt || assinatura.updatedAt || assinatura.createdAt || 0);
      if (!inicioPendente || Date.now() - inicioPendente > deps.LOCAL_CHECKOUT_PENDING_TTL_MS) {
        assinatura.pendingPlan = "";
        assinatura.paymentStatus = "none";
        assinatura.pendingStartedAt = "";
        if (deps.getBillingConfig().clientId === assinatura.clientId) {
          deps.getBillingConfig().pendingPlan = "";
          deps.getBillingConfig().paymentStatus = "none";
          deps.getBillingConfig().pendingStartedAt = "";
        }
        alterou = true;
      }
    }
    if (!vencimento || vencimento >= Date.now()) return;
    if ((assinatura.activePlan || assinatura.planSlug) === "free" || ["cancelled", "expired"].includes(assinatura.status)) return;

    const diasAtraso = Math.max(0, Math.floor((Date.now() - vencimento) / (24 * 60 * 60 * 1000)));
    if (plano.kind === "trial") {
      assinatura.planSlug = "free";
      assinatura.planId = "free";
      assinatura.activePlan = "free";
      assinatura.subscriptionStatus = "free";
      assinatura.cancelAtPeriodEnd = false;
      assinatura.status = "active";
      assinatura.statusAssinatura = "active";
      assinatura.currentPeriodEnd = "";
      assinatura.expiresAt = "";
      assinatura.nextBillingAt = "";
      assinatura.planExpiresAt = "";
      assinatura.isTrialActive = false;
      assinatura.overdueSince = assinatura.overdueSince || new Date(vencimento).toISOString();
      const cliente = deps.getClienteSaasPorId(assinatura.clientId);
      if (cliente) {
        cliente.planoAtual = "free";
        cliente.activePlan = "free";
        cliente.subscriptionStatus = "free";
        cliente.cancelAtPeriodEnd = false;
        cliente.isTrialActive = false;
        cliente.statusAssinatura = "active";
        cliente.updatedAt = new Date().toISOString();
      }
      if (deps.getBillingConfig().clientId === assinatura.clientId) {
        deps.getBillingConfig().planSlug = "free";
        deps.getBillingConfig().activePlan = "free";
        deps.getBillingConfig().subscriptionStatus = "free";
        deps.getBillingConfig().cancelAtPeriodEnd = false;
        deps.getBillingConfig().currentPeriodEnd = "";
        deps.getBillingConfig().isTrialActive = false;
        deps.getBillingConfig().licenseStatus = "free";
        deps.getBillingConfig().licenseBlockLevel = "none";
      }
      deps.registrarAuditoria("alteração plano", { motivo: "vencimento", planoAnterior: plano.slug }, assinatura.clientId);
      alterou = true;
    } else if (diasAtraso >= 0) {
      assinatura.planSlug = "free";
      assinatura.planId = "free";
      assinatura.activePlan = "free";
      assinatura.subscriptionStatus = "free";
      assinatura.cancelAtPeriodEnd = false;
      assinatura.status = "active";
      assinatura.statusAssinatura = "active";
      assinatura.currentPeriodEnd = "";
      assinatura.expiresAt = "";
      assinatura.nextBillingAt = "";
      assinatura.planExpiresAt = "";
      assinatura.overdueSince = assinatura.overdueSince || new Date(vencimento).toISOString();
      const cliente = deps.getClienteSaasPorId(assinatura.clientId);
      if (cliente) {
        cliente.planoAtual = "free";
        cliente.activePlan = "free";
        cliente.subscriptionStatus = "free";
        cliente.cancelAtPeriodEnd = false;
        cliente.statusAssinatura = "active";
        cliente.updatedAt = new Date().toISOString();
      }
      if (deps.getBillingConfig().clientId === assinatura.clientId) {
        deps.getBillingConfig().planSlug = "free";
        deps.getBillingConfig().activePlan = "free";
        deps.getBillingConfig().subscriptionStatus = "free";
        deps.getBillingConfig().cancelAtPeriodEnd = false;
        deps.getBillingConfig().currentPeriodEnd = "";
        deps.getBillingConfig().licenseStatus = "free";
        deps.getBillingConfig().licenseBlockLevel = "none";
      }
      alterou = true;
    }
  });

  deps.getBillingConfig().lastDailyPlanCheck = hoje;
  if (salvar && alterou) deps.salvarDados();

  }

  async function processarMudancaBillingRealtimeSupabase(evento, deps = {}) {deps.registrarDiagnostico("Realtime", deps.isSuperAdmin() ? "Evento de billing recebido" : "Plano atualizado em tempo real", `${evento.table}:${evento.type || ""}`);
  const licenca = await deps.consultarLicencaSupabaseSilencioso({ motivo: `realtime-${evento.table}` });
  if (deps.isSuperAdmin() && ["clientes", "superadmin", "admin"].includes(deps.getTelaAtual())) {
    await deps.carregarSaasSupabaseSilencioso({ renderizar: false, feedback: false }).catch((erro) => {
      deps.registrarDiagnostico("Realtime", "Empresas SaaS não atualizadas via billing", erro.message || erro);
    });
  }
  if (licenca && deps.document.visibilityState !== "hidden") {
    if (["assinatura", "minhaAssinatura", "planos", "admin", "clientes", "dashboard"].includes(deps.getTelaAtual())) deps.agendarRenderizacaoPreservandoScroll(120);
    deps.avisarRealtimePlanoAtualizado();
  }
  return !!licenca;

  }

  function garantirAssinaturaClienteLocal(clientId, deps = {}) {
  if (clientId === undefined) clientId = deps.getClientIdAtual();

  // resolved default for getClientIdAtual
const idCliente = clientId || deps.getBillingConfig().clientId || deps.criarIdLocal("client");
  let assinatura = deps.getAssinaturaSaas(idCliente);
  if (!assinatura) {
    assinatura = deps.normalizarAssinaturaSaas({ clientId: idCliente, planSlug: "free", status: "active" });
    deps.getSaasSubscriptions().push(assinatura);
  }
  if (!deps.getBillingConfig().clientId) deps.getBillingConfig().clientId = idCliente;
  deps.getBillingConfig().subscriptionId = assinatura.id;
  return assinatura;

  }

  function ativarPlanoClienteLocal(clientId, slug, status = "active", dias = 30, detalhes = {}, deps = {}) {const plano = deps.getPlanoSaas(slug);
  const agora = new Date().toISOString();
  const assinatura = deps.garantirAssinaturaClienteLocal(clientId);
  const expiresAt = dias > 0 ? new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString() : "";
  const planPrice = deps.isPlanoPagoSlug(plano.slug)
    ? Math.max(0, Number(detalhes.planPrice ?? detalhes.plan_price ?? assinatura.planPrice ?? plano.price) || plano.price)
    : 0;
  assinatura.planSlug = plano.slug;
  assinatura.planId = plano.slug;
  assinatura.activePlan = plano.slug;
  assinatura.pendingPlan = "";
  assinatura.pendingStartedAt = "";
  assinatura.paymentStatus = status === "pending" ? "pending" : "none";
  assinatura.subscriptionStatus = deps.isPlanoPagoSlug(plano.slug) ? "active" : "free";
  assinatura.cancelAtPeriodEnd = false;
  assinatura.status = deps.normalizarStatusPlano(status);
  assinatura.statusAssinatura = assinatura.status;
  assinatura.promoUsed = detalhes.promoUsed === true || assinatura.promoUsed === true;
  assinatura.billingVariant = deps.normalizarBillingVariant(detalhes.billingVariant || deps.getBillingVariantAssinatura(assinatura));
  assinatura.planPrice = planPrice;
  assinatura.priceLocked = deps.isPlanoPagoSlug(plano.slug);
  assinatura.currentPeriodStart = agora;
  assinatura.currentPeriodEnd = expiresAt;
  assinatura.startedAt = assinatura.startedAt || agora;
  assinatura.expiresAt = expiresAt;
  assinatura.nextBillingAt = expiresAt;
  assinatura.planExpiresAt = expiresAt;
  assinatura.trialStartedAt = "";
  assinatura.trialExpiresAt = "";
  assinatura.trialConsumedAt = assinatura.trialConsumedAt || "";
  assinatura.isTrialActive = false;
  assinatura.overdueSince = "";

  const cliente = deps.getClienteSaasPorId(clientId);
  if (cliente) {
    cliente.planoAtual = plano.slug;
    cliente.activePlan = plano.slug;
    cliente.pendingPlan = "";
    cliente.pendingStartedAt = "";
    cliente.paymentStatus = assinatura.paymentStatus;
    cliente.subscriptionStatus = assinatura.subscriptionStatus;
    cliente.cancelAtPeriodEnd = false;
    cliente.currentPeriodEnd = expiresAt;
    cliente.statusAssinatura = assinatura.statusAssinatura;
    cliente.status = status === "blocked" ? "blocked" : "active";
    cliente.planPrice = planPrice;
    cliente.priceLocked = deps.isPlanoPagoSlug(plano.slug);
    cliente.planExpiresAt = expiresAt;
    cliente.trialStartedAt = assinatura.trialStartedAt;
    cliente.trialExpiresAt = assinatura.trialExpiresAt;
    cliente.trialConsumedAt = assinatura.trialConsumedAt || cliente.trialConsumedAt || "";
    cliente.isTrialActive = assinatura.isTrialActive;
    cliente.updatedAt = agora;
  }

  deps.getUsuariosDoCliente(clientId).forEach((usuario) => {
    usuario.planStatus = status;
    usuario.planExpiresAt = expiresAt;
    if (status !== "blocked") {
      usuario.bloqueado = false;
      usuario.ativo = true;
    }
  });

  if (String(clientId || "") === String(deps.getClientIdAtual() || deps.getBillingConfig().clientId || "")) {
    deps.getBillingConfig().clientId = clientId;
    deps.getBillingConfig().planSlug = plano.slug;
    deps.getBillingConfig().activePlan = plano.slug;
    deps.getBillingConfig().pendingPlan = "";
    deps.getBillingConfig().pendingStartedAt = "";
    deps.getBillingConfig().paymentStatus = assinatura.paymentStatus;
    deps.getBillingConfig().subscriptionStatus = assinatura.subscriptionStatus;
    deps.getBillingConfig().cancelAtPeriodEnd = false;
    deps.getBillingConfig().currentPeriodEnd = expiresAt;
    deps.getBillingConfig().licenseStatus = status;
    deps.getBillingConfig().licenseBlockLevel = "none";
    deps.getBillingConfig().paidUntil = expiresAt;
    deps.getBillingConfig().planExpiresAt = expiresAt;
    deps.getBillingConfig().monthlyPrice = deps.isPlanoPagoSlug(plano.slug) ? planPrice : 0;
    deps.getBillingConfig().planPrice = planPrice;
    deps.getBillingConfig().priceLocked = deps.isPlanoPagoSlug(plano.slug);
    deps.getBillingConfig().trialStartedAt = assinatura.trialStartedAt;
    deps.getBillingConfig().trialExpiresAt = assinatura.trialExpiresAt;
    deps.getBillingConfig().trialConsumedAt = assinatura.trialConsumedAt || deps.getBillingConfig().trialConsumedAt || "";
    deps.getBillingConfig().isTrialActive = assinatura.isTrialActive;
    deps.getBillingConfig().subscriptionId = assinatura.id;
  }

  deps.salvarDados();
  deps.registrarAuditoria("alteração plano", { plano: plano.slug, status, expiresAt, ...detalhes }, clientId);
  return assinatura;

  }

  async function cancelarAssinaturaCliente(deps = {}) {const clientId = deps.getClientIdAtual() || deps.getBillingConfig().clientId;
  const assinatura = deps.garantirAssinaturaClienteLocal(clientId);
  const accessState = deps.getPlanAccessState(assinatura, { source: "cancel-renewal" });
  if (accessState.isFree || !accessState.isActive) {
    deps.alert("O plano Free não possui renovação para cancelar.");
    return;
  }
  if (accessState.isCancelingAtPeriodEnd) {
    deps.alert("A renovação já está cancelada. Seu acesso pago continua até o fim do período.");
    return;
  }
  const fimPeriodo = accessState.accessEndsAt || assinatura.currentPeriodEnd || assinatura.planExpiresAt || assinatura.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const dataFim = fimPeriodo ? new Date(fimPeriodo).toLocaleDateString("pt-BR") : "o fim do período pago";
  const confirmou = await deps.solicitarConfirmacaoAcao({
    titulo: "Cancelar renovação automática",
    mensagem: `Deseja cancelar a renovação automática? Seu plano ${getPlanoSaas(accessState.effectivePlan).name} continuará ativo até ${dataFim}. Depois disso, sua conta voltará ao plano Free.`,
    confirmar: "Cancelar renovação",
    perigo: true
  });
  if (!confirmou) return;
  deps.registrarEventoPlanoSeguro("subscription_cancel_requested", { plan: accessState.effectivePlan, accessEndsAt: fimPeriodo });

  try {
    if (deps.syncConfig.supabaseAccessToken && assinatura.mercadoPagoSubscriptionId) {
      await deps.chamarFuncaoSaas("mercadopago-cancel-subscription", {
        clienteId: clientId,
        subscriptionId: assinatura.mercadoPagoSubscriptionId
      });
    }
  } catch (erro) {
    deps.registrarDiagnostico("Mercado Pago", "Cancelamento online não confirmado", erro.message);
    deps.alert("Não foi possível confirmar o cancelamento automático. Vamos manter a solicitação local e o suporte pode conferir a cobrança.");
  }

  const agora = new Date().toISOString();
  assinatura.cancelAtPeriodEnd = true;
  assinatura.subscriptionStatus = "canceling";
  assinatura.status = "active";
  assinatura.statusAssinatura = "canceling";
  assinatura.paymentStatus = "none";
  assinatura.pendingPlan = "";
  assinatura.pendingStartedAt = "";
  assinatura.currentPeriodEnd = fimPeriodo || assinatura.currentPeriodEnd || "";
  assinatura.expiresAt = fimPeriodo || assinatura.expiresAt || "";
  assinatura.planExpiresAt = fimPeriodo || assinatura.planExpiresAt || "";
  assinatura.updatedAt = agora;
  const cliente = deps.getClienteSaasPorId(clientId);
  if (cliente) {
    cliente.cancelAtPeriodEnd = true;
    cliente.subscriptionStatus = "canceling";
    cliente.statusAssinatura = "canceling";
    cliente.pendingPlan = "";
    cliente.pendingStartedAt = "";
    cliente.paymentStatus = "none";
    cliente.currentPeriodEnd = fimPeriodo || cliente.currentPeriodEnd || "";
    cliente.planExpiresAt = fimPeriodo || cliente.planExpiresAt || "";
    cliente.updatedAt = agora;
  }
  if (String(clientId || "") === String(deps.getClientIdAtual() || deps.getBillingConfig().clientId || "")) {
    deps.getBillingConfig().cancelAtPeriodEnd = true;
    deps.getBillingConfig().subscriptionStatus = "canceling";
    deps.getBillingConfig().licenseStatus = "active";
    deps.getBillingConfig().paymentStatus = "none";
    deps.getBillingConfig().pendingPlan = "";
    deps.getBillingConfig().pendingStartedAt = "";
    deps.getBillingConfig().currentPeriodEnd = fimPeriodo || deps.getBillingConfig().currentPeriodEnd || "";
    deps.getBillingConfig().planExpiresAt = fimPeriodo || deps.getBillingConfig().planExpiresAt || "";
    deps.getBillingConfig().paidUntil = fimPeriodo || deps.getBillingConfig().paidUntil || "";
  }
  deps.salvarDados();
  deps.registrarAuditoria("cancelamento renovacao", { plano: accessState.effectivePlan, accessEndsAt: fimPeriodo, origem: "cliente" }, clientId);
  deps.registrarEventoPlanoSeguro("subscription_cancel_at_period_end", { plan: accessState.effectivePlan, accessEndsAt: fimPeriodo });
  deps.alert(`Renovação cancelada. O acesso pago continua liberado até ${dataFim}.`);
  deps.renderApp();

  }

  async function chamarSuperadminUpdateSubscription(id, action, options = {}, deps = {}) {if (!deps.podeSalvarAdminSupabaseRemoto()) {
    throw new Error("Entre como superadmin Supabase para salvar no banco.");
  }
  const alvo = options.targetUserId || deps.getAlvoRpcClienteSaas(id);
  const licenca = await deps.requisicaoSupabase("/rest/v1/rpc/superadmin_update_subscription", {
    method: "POST",
    body: JSON.stringify({
      target_user_id: String(alvo),
      action,
      plan_code: options.planCode || null,
      premium_until: options.premiumUntil || null,
      reason: options.reason || null
    })
  });
  deps.aplicarLicencaEfetivaClienteSaas(id || licenca?.client_id, licenca);
  return licenca;

  }

  async function atualizarAssinaturaClienteSaasSupabase(id, assinatura = {}, deps = {}) {if (!deps.podeSalvarAdminSupabaseRemoto()) return { ok: false, skipped: true, reason: "NO_SUPABASE_SESSION" };
  const planId = await deps.obterPlanIdSupabase(assinatura.activePlan || assinatura.planSlug || "free");
  const payload = {
    status: deps.normalizarStatusPlano(assinatura.status),
    status_assinatura: deps.normalizarStatusPlano(assinatura.statusAssinatura || assinatura.status),
    active_plan: deps.normalizarSlugPlano(assinatura.activePlan || assinatura.planSlug || "free"),
    pending_plan: assinatura.pendingPlan || null,
    payment_status: deps.normalizarStatusPagamento(assinatura.paymentStatus || "none"),
    subscription_status: deps.normalizarStatusAssinaturaDefinitivo(assinatura.subscriptionStatus || "free"),
    plan_expires_at: assinatura.planExpiresAt || assinatura.currentPeriodEnd || null,
    plan_price: assinatura.planPrice || null,
    price_locked: assinatura.priceLocked === true,
    trial_started_at: assinatura.trialStartedAt || null,
    trial_expires_at: assinatura.trialExpiresAt || null,
    is_trial_active: assinatura.isTrialActive === true,
    promo_used: assinatura.promoUsed === true,
    billing_variant: deps.normalizarBillingVariant(assinatura.billingVariant),
    current_period_start: assinatura.currentPeriodStart || null,
    current_period_end: assinatura.currentPeriodEnd || null,
    expires_at: assinatura.expiresAt || assinatura.currentPeriodEnd || null,
    next_billing_at: assinatura.nextBillingAt || assinatura.currentPeriodEnd || null,
    proximo_vencimento: assinatura.nextBillingAt || assinatura.currentPeriodEnd || null,
    updated_at: new Date().toISOString()
  };
  if (planId) payload.plan_id = planId;
  await deps.requisicaoSupabase(`/rest/v1/subscriptions?client_id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(payload)
  });
  return { ok: true };

  }

  async function alterarPlanoClienteSaas(id, deps = {}) {if (!deps.isSuperAdmin()) return;
  const cliente = deps.getClienteSaasPorId(id);
  if (!cliente) return;
  const planoAtual = deps.getPlanoSaas(deps.getAssinaturaSaas(id)?.activePlan || cliente.activePlan || deps.getAssinaturaSaas(id)?.planSlug || cliente.planoAtual || "free");
  const respostaPlano = await deps.solicitarPlanoSuperadmin(planoAtual.slug);
  if (respostaPlano === null) return;
  const novoPlano = deps.normalizarSlugPlano(respostaPlano || "");
  const plano = deps.getPlanoSaas(novoPlano);
  if (!["free", "start", "pro"].includes(novoPlano)) {
    deps.alert("Plano inválido.");
    return;
  }
  const confirmado = await deps.solicitarConfirmacaoAcao({
    titulo: "Alterar plano",
    mensagem: `Alterar ${cliente.email} para ${plano.name}?`,
    confirmar: "Alterar plano"
  });
  if (!confirmado) return;
  const toast = deps.mostrarToast("Salvando...", "loading");
  try {
    const licenca = await deps.chamarSuperadminUpdateSubscription(id, novoPlano === "free" ? "SET_FREE" : "ACTIVATE_PREMIUM_MANUAL", {
      planCode: novoPlano === "pro" ? "PRO" : novoPlano === "start" ? "START" : "FREE",
      premiumUntil: null,
      reason: `Alteração manual para ${plano.name}`
    });
    deps.registrarAuditoria("alteração plano", { email: cliente.email, plano: plano.slug, source: licenca?.source || "rpc" }, cliente.id);
    deps.mostrarToast("Plano atualizado com sucesso", "sucesso", 4200);
  } catch (erro) {
    deps.registrarDiagnostico("Superadmin", "Erro ao alterar plano", erro.message);
    deps.mostrarToast(`Falha ao atualizar: ${erro.message}`, "erro", 6500);
  } finally {
    toast?.remove?.();
    deps.renderApp();
  }

  }

  function escolherPlanoSaas(slug = "free", deps = {}) {const plano = deps.getPlanoSaas(slug);
  if (!["free", "start", "pro"].includes(plano.slug)) {
    deps.alert("Plano indisponível.");
    return;
  }
  if (plano.slug === "free") {
    deps.mostrarToast("Você continua no plano gratuito.", "info");
    deps.trocarTela("dashboard");
    return;
  }
  const clientId = deps.getClientIdAtual() || deps.getBillingConfig().clientId || deps.criarIdLocal("client");
  if (!deps.getBillingConfig().clientId) deps.getBillingConfig().clientId = clientId;
  let assinatura = deps.getAssinaturaSaas(clientId);
  if (!assinatura) {
    assinatura = deps.normalizarAssinaturaSaas({ clientId, planSlug: "free", activePlan: "free", status: "active" });
    deps.getSaasSubscriptions().push(assinatura);
  }
  if (plano.slug === "free") {
    assinatura.pendingPlan = "";
    assinatura.paymentStatus = "none";
    deps.getBillingConfig().pendingPlan = "";
    deps.getBillingConfig().paymentStatus = "none";
  }
  deps.getBillingConfig().planSlug = assinatura.activePlan || assinatura.planSlug || "free";
  deps.getBillingConfig().activePlan = assinatura.activePlan || assinatura.planSlug || "free";
  deps.getBillingConfig().monthlyPrice = deps.isPlanoPagoSlug(deps.getBillingConfig().activePlan) ? deps.getPlanoSaas(deps.getBillingConfig().activePlan).price : 0;
  deps.getBillingConfig().subscriptionId = assinatura.id;
  deps.salvarDados();
  deps.registrarAuditoria(plano.price > 0 ? "checkout solicitado" : "alteração plano", { plano: plano.slug }, clientId);
  if (plano.slug === "free") {
    deps.ativarPlanoClienteLocal(clientId, "free", "active", 0, { origem: "escolha_free" });
    deps.renderApp();
    return;
  }
  deps.abrirLinkMercadoPago(plano.slug);
  deps.renderApp();

  }

  function iniciarTesteGratis(deps = {}) {deps.mostrarToast("A ativação temporária foi removida. Escolha Start ou Pro para liberar recursos pagos.", "info", 5200);
  deps.trocarTela("assinatura");

  }

  global.SimplificaBillingCommands = {
    normalizarSlugPlano,
    normalizarPlanoSaas,
    normalizarAssinaturaSaas,
    getBillingVariantAssinatura,
    calcularStatusAssinatura,
    calcularFimTrial,
    resolverEstadoPlano,
    verificarVencimentoPlanoLocal,
    processarMudancaBillingRealtimeSupabase,
    garantirAssinaturaClienteLocal,
    ativarPlanoClienteLocal,
    cancelarAssinaturaCliente,
    chamarSuperadminUpdateSubscription,
    atualizarAssinaturaClienteSaasSupabase,
    alterarPlanoClienteSaas,
    escolherPlanoSaas,
    iniciarTesteGratis,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.SimplificaBillingCommands;
  }
})(typeof window !== "undefined" ? window : globalThis);
