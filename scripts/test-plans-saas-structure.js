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
  "FREE_STORE_PRODUCT_LIMIT = 0",
  "START_STORE_PRODUCT_LIMIT = 100",
  "START_MONTHLY_PRICE = 29.9",
  "PRO_MONTHLY_PRICE = 59.9",
  "LOCAL_CHECKOUT_PENDING_TTL_MS = 30 * 60 * 1000",
  "slug: \"start\"",
  "slug: \"pro\"",
  "Até 5 pedidos por dia",
  "Anúncios para liberar ações extras",
  "Editar loja",
  "Visualizar loja",
  "Produtos da loja online ficam disponíveis no Start ou Pro.",
  "Até 100 produtos na loja",
  "Loja pública liberada",
  "Relatórios completos",
  "Funcionários e permissões",
  "Personalização avançada",
  "Backup maior",
  "Valores promocionais de lançamento",
  "plan-start-unavailable",
  "data-slug=\"pro\"",
], "app.js estrutura de planos");
assert(app.includes("const START_PLAN_ENABLED = true"), "Start deve estar ativo na matriz comercial");
assert(app.includes('plano.slug === "start" ? "mercadopago-create-subscription" : "mercadopago-create-payment"'), "Start deve usar checkout de assinatura");

includesAll(app, [
  "const slugNormalizado = normalizarSlugPlano(slug || \"free\")",
  "status: \"checkout_opened\"",
  "lastCheckoutPlan",
  "simplifica3d:checkout-session:v1",
  "limparCheckoutsLocaisExpirados({ force: true })",
  "function setPlansModernTab",
  "Todos os planos",
  "plansModernTab === \"all\"",
  "function getAvatarPlanoClasseUsuario",
  "avatar-${classePlanoSaasCompacto",
  "sidebarPreferenceSet",
  "function getApresentacaoPlanoEmpresaSaas",
  "function getApresentacaoAtividadeEmpresaSaas",
  "depois volta ao Free",
  "Plano e acesso",
  "Último acesso",
  "is-compact",
  'function renderMenuAcoesSuperadmin(conteudo = "", rotulo = "⋯")',
], "checkout temporario sem upgrade fantasma");

assert(!app.includes("assinatura.pendingPlan = plano.slug"), "checkout nao deve gravar pendingPlan antes do pagamento aprovado");
assert(!app.includes("billingConfig.pendingPlan = plano.slug"), "checkout nao deve gravar pendingPlan global antes do pagamento aprovado");
assert(!app.includes("billingConfig.monthlyPrice = planPrice"), "checkout nao deve alterar preco mensal antes do pagamento aprovado");

includesAll(app, [
  "O link público e o compartilhamento da loja ficam disponíveis nos planos Start e Pro ativos.",
  "Sua loja está salva, mas a publicação pública está disponível apenas nos planos Start e Pro.",
], "bloqueio de publicacao gratis");

[
  "Sem produtos na loja online",
  "Não gera link público",
  "Não permite compartilhar loja",
  "Sem personalização avançada",
  "Editar loja real",
  "loja_real",
  "plano_real"
].forEach((label) => assert(!app.includes(label), `texto tecnico/negativo nao deve aparecer: ${label}`));

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
  ".avatar-plan-free",
  ".avatar-plan-start",
  ".avatar-plan-pro",
  ".client-admin-access",
  ".client-admin-activity",
  ".superadmin-action-menu.is-compact",
  ".superadmin-user-actions",
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
  "productLimit: 0",
  "plan === \"start\"",
  "productLimit: 100",
  "productLimit: Number.POSITIVE_INFINITY",
], "limites storefront");

console.log("Plans SaaS structure tests OK");
