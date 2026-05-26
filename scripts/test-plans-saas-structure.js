const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const monetization = fs.readFileSync(path.join(root, "src/services/monetizationLimits.js"), "utf8");
const adMob = fs.readFileSync(path.join(root, "src/services/adMobService.js"), "utf8");
const storefrontPlans = fs.readFileSync(path.join(root, "src/storefront/plans/storefrontPlanRules.ts"), "utf8");

function includesAll(source, items, label) {
  for (const item of items) {
    assert(source.includes(item), `${label}: faltando ${item}`);
  }
}

includesAll(app, [
  "FREE_PRODUCT_LIMIT = 25",
  "START_PRODUCT_LIMIT = 300",
  "START_MONTHLY_PRICE = 29.9",
  "PRO_MONTHLY_PRICE = 59.9",
  "LOCAL_CHECKOUT_PENDING_TTL_MS = 30 * 60 * 1000",
  "slug: \"start\"",
  "slug: \"pro\"",
  "5 pedidos grátis por dia",
  "+5 pedidos assistindo anúncio",
  "Máximo 10 pedidos/dia",
  "Não gera link público",
  "Loja pública liberada",
  "Produtos ilimitados",
  "Valores promocionais de lançamento",
  "data-slug=\\\"start\\\"",
  "data-slug=\"pro\"",
], "app.js estrutura de planos");

includesAll(app, [
  "const slugNormalizado = normalizarSlugPlano(slug || \"free\")",
  "status: \"checkout_opened\"",
  "lastCheckoutPlan",
  "simplifica3d:checkout-session:v1",
  "limparCheckoutsLocaisExpirados({ force: true })",
], "checkout temporario sem upgrade fantasma");

assert(!app.includes("assinatura.pendingPlan = plano.slug"), "checkout nao deve gravar pendingPlan antes do pagamento aprovado");
assert(!app.includes("billingConfig.pendingPlan = plano.slug"), "checkout nao deve gravar pendingPlan global antes do pagamento aprovado");
assert(!app.includes("billingConfig.monthlyPrice = planPrice"), "checkout nao deve alterar preco mensal antes do pagamento aprovado");

includesAll(app, [
  "O link público e o compartilhamento da loja ficam disponíveis no plano Start ou Pro.",
  "Sua loja pode ser editada no plano Grátis",
], "bloqueio de publicacao gratis");

includesAll(css, [
  ".plans-pricing-grid",
  ".plan-tier-free",
  ".plan-tier-start",
  ".plan-tier-pro",
  "--plan-accent:#22c55e",
  "--plan-accent:#8b5cf6",
  "--plan-accent:#f6b51d",
  "body.theme-light .plans-pricing-screen .plan-tier-card",
  "body.theme-light .plans-pricing-screen .plan-tier-free",
  "body.theme-light .status-badge.plan-start",
], "CSS premium dos cards");

includesAll(monetization, [
  "FREE_ACTION_CREDIT_LIMIT = 5",
  "FREE_ACTION_AD_BONUS_LIMIT = 5",
  "FREE_ACTION_DAILY_MAX",
  "[\"start\", \"pro\", \"premium\"].includes(planId)",
], "monetizacao por plano");

includesAll(adMob, [
  "[\"start\", \"pro\", \"premium\"].includes(planId)",
], "ads somente no gratis");

includesAll(storefrontPlans, [
  "publishEnabled: false",
  "shareEnabled: false",
  "productLimit: 25",
  "plan === \"start\"",
  "productLimit: 300",
  "productLimit: Number.POSITIVE_INFINITY",
], "limites storefront");

console.log("Plans SaaS structure tests OK");
