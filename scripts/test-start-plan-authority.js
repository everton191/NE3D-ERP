const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function bodyOfFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert(start >= 0, `funcao ausente: ${name}`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`nao foi possivel ler funcao: ${name}`);
}

const app = read("app.js");
const shared = read("supabase/functions/_shared/mercadopago-billing.ts");
const createPayment = read("supabase/functions/mercadopago-create-payment/index.ts");
const createSubscription = read("supabase/functions/mercadopago-create-subscription/index.ts");
const webhook = read("supabase/functions/mercadopago-webhook/index.ts");
const diagnostics = read("src/services/diagnosticsService.js");
const migration = read("supabase/migrations/20260530103000_start_plan_backend_authority.sql");
const runner = read("scripts/start-plan-remote-controlled.js");

const renderPlans = bodyOfFunction(app, "renderAssinatura");
const openPayment = bodyOfFunction(app, "abrirLinkMercadoPago");
const storefrontLimits = bodyOfFunction(app, "getStorefrontLimitsLocal");

assert(app.includes("const START_PLAN_ENABLED = false"), "Start deve permanecer comercialmente desligado no frontend");
assert(app.includes("const PLAN_REGISTRY = Object.freeze"), "registry central de planos deve existir");
assert(app.includes("slug: \"start\""), "slug start deve existir no registry/frontend");
assert(app.includes("price: START_MONTHLY_PRICE"), "Start deve usar preco central R$ 29,90");
assert(app.includes("const START_MONTHLY_PRICE = 29.9"), "preco Start deve ser 29.90");
assert(app.includes("const PRO_MONTHLY_PRICE = 59.9"), "preco Pro deve ser 59.90");
assert(app.includes("function normalizePlanSlug"), "helper normalizePlanSlug deve existir");
assert(app.includes("function getPlanEntitlements"), "helper getPlanEntitlements deve existir");
assert(app.includes("function getPlanLimits"), "helper getPlanLimits deve existir");
assert(app.includes("function canAccessFeature"), "helper canAccessFeature deve existir");
assert(app.includes("function getPlanUpgradeOptions"), "helper getPlanUpgradeOptions deve existir");
assert(app.includes("const upgradeOptions = getPlanUpgradeOptions(effectivePlan)"), "upgrade deve ser derivado do registry");
assert(app.includes('isPaid = ["start", "pro"].includes(effectivePlan)'), "getPlanAccessState deve reconhecer Start como pago");
assert(storefrontLimits.includes("getPlanEntitlements"), "limites da loja devem usar entitlements centrais");
assert(storefrontLimits.includes("getPlanLimits"), "limites da loja devem usar limites centrais");
assert(renderPlans.includes('badge: isStartCurrent ? "PLANO ATUAL" : startEnabled ? "MAIS POPULAR" : "EM BREVE"'), "Start desligado deve aparecer como Em breve");
assert(renderPlans.includes('action: startEnabled ? "start" : "start-unavailable"'), "CTA Start deve depender da flag");
assert(openPayment.includes('plano.slug === "start" && !isStartPlanCommerciallyEnabled()'), "checkout Start deve ficar bloqueado enquanto flag false");
assert(openPayment.includes("start_plan_checkout_requested"), "tentativa Start futura deve ser diagnosticada");
assert(openPayment.includes('plano.slug === "start" ? "mercadopago-create-subscription" : "mercadopago-create-payment"'), "Start futuro deve usar criacao de assinatura pelo backend");
assert(!renderPlans.includes('data-action=\\"open-payment\\" data-slug=\\"start\\"'), "render inicial nao pode expor checkout Start diretamente");

assert(shared.includes("export function isStartPlanEnabled"), "backend deve ter gate START_PLAN_ENABLED");
assert(shared.includes('getEnv("START_PLAN_ENABLED")'), "backend deve ler START_PLAN_ENABLED somente no backend");
assert(shared.includes('getEnv("MERCADO_PAGO_START_PLAN_ID")'), "backend deve ler MERCADO_PAGO_START_PLAN_ID somente no backend");
assert(shared.includes("start_monthly: { id: \"start_monthly\""), "Start deve ter billing variant proprio");
assert(shared.includes("Plano Start ainda não está habilitado no backend de cobrança"), "Start deve falhar fechado por padrão");
assert(shared.includes("resolvePlanSlugFromMercadoPagoPlanId"), "webhook deve resolver plano por preapproval_plan_id allowlist");
assert(createPayment.includes("getMercadoPagoPlanId"), "checkout deve resolver plan id no backend");
assert(createPayment.includes("Plano Start sem MERCADO_PAGO_START_PLAN_ID configurado"), "checkout Start deve exigir plan id backend");
assert(createSubscription.includes("preapproval_plan_id"), "assinatura deve suportar preapproval_plan_id backend");
assert(webhook.includes("resolvePlanSlugFromMercadoPagoPlanId"), "webhook central deve usar allowlist de plan ids");
assert(webhook.includes("webhook_start_plan_resolved"), "webhook deve diagnosticar Start resolvido");
assert(webhook.includes("webhook_start_plan_resolution_failed"), "webhook deve diagnosticar falha de resolucao Start");
assert(!fs.existsSync(path.join(root, "supabase/functions/mercadopago-start-webhook")), "nao pode existir webhook separado de Start");

[
  "start_plan_checkout_requested",
  "start_plan_checkout_created",
  "start_plan_checkout_failed",
  "start_plan_payment_pending_real",
  "start_plan_payment_approved",
  "start_plan_payment_failed",
  "start_plan_subscription_created",
  "start_plan_subscription_cancel_requested",
  "start_plan_subscription_cancel_at_period_end",
  "start_plan_subscription_expired",
  "start_to_pro_upgrade_requested",
  "start_to_pro_upgrade_approved",
  "webhook_start_plan_resolved",
  "webhook_start_plan_resolution_failed",
].forEach((eventType) => assert(diagnostics.includes(`"${eventType}"`) || webhook.includes(eventType) || app.includes(eventType), `evento Start ausente: ${eventType}`));

assert(migration.includes("insert into public.plans"), "migration deve preparar planos");
assert(migration.includes("'start', 'Start', 29.90"), "migration deve criar/atualizar Start");
assert(migration.includes("'start_plan_enabled', false"), "migration deve manter Start desligado por flag");
assert(migration.includes("alter table public.app_billing_feature_flags enable row level security"), "feature flags devem ter RLS");
assert(!/using\s*\(\s*true\s*\)/i.test(migration), "migration nao pode criar policy aberta");
assert(!/with check\s*\(\s*true\s*\)/i.test(migration), "migration nao pode criar policy aberta de escrita");

assert(runner.includes("sandbox-create-plan"), "runner deve suportar criacao sandbox controlada");
assert(runner.includes("TEST-"), "runner sandbox deve aceitar somente token TEST-");
assert(runner.includes("APP_USR-"), "runner deve bloquear token produtivo");
assert(runner.includes("production_start_plan_creation=disabled"), "runner nao pode criar plano produtivo automaticamente");
assert(runner.includes("db\", \"query\", \"--linked\", \"-f\", START_PLAN_MIGRATION"), "apply remoto deve aplicar somente a migration Start");

assert(!/MERCADO_PAGO_START_PLAN_ID\s*=\s*["'][^"']+["']/.test(app + shared + createPayment + createSubscription + webhook + runner), "plan id real nao pode ficar hardcoded");
assert(!/MERCADOPAGO_(ACCESS_TOKEN|WEBHOOK_SECRET)\s*=\s*["'][^"']+["']/.test(app + shared + createPayment + createSubscription + webhook + runner), "segredos Mercado Pago nao podem ficar hardcoded");

console.log("Start plan authority tests OK");
