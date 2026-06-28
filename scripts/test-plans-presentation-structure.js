const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const progress = fs.readFileSync(path.join(root, "docs", "superadmin-planos-progresso-2026-06-28.md"), "utf8");

function includesAll(source, items, label) {
  for (const item of items) {
    assert(source.includes(item), `${label}: faltando ${item}`);
  }
}

includesAll(app, [
  "plansPresentationSelectedSlug",
  "function getPlanPresentationDefaults",
  "function getPlanPresentationData",
  "function renderPlanMiniDashboard",
  "function renderPlanMobileTabs",
  "function renderPlanSelectedDetails",
  "function renderPlanTrustBar",
  "function renderPlanFeatureMatrix",
  "function renderPlanCardBrochure",
  "function sincronizarPlanoApresentacaoPorScroll",
  "function moverPlanoApresentacaoInterativo",
  "function editarPlanoApresentacaoSuperadmin",
  "function editarPrecoExibidoPlanoSuperadmin",
  "Isto não altera cobrança real",
  "Checkout real não foi alterado",
  "plans-carousel",
  "onpointermove=\"moverPlanoApresentacaoInterativo(event)\"",
  "onscroll=\"sincronizarPlanoApresentacaoPorScroll(this)\"",
  "selecionarPlanoApresentacao",
  "renderPlanPaymentNotice(accessState, checkoutState)",
], "estrutura visual dos planos");

includesAll(css, [
  ".plans-pricing-screen .plans-carousel",
  ".plans-pricing-grid.plans-carousel",
  "scroll-snap-type:x mandatory",
  "scroll-snap-stop:always",
  "scroll-snap-align:center",
  ".plans-pricing-grid .plan-tier-list li:nth-child(n+6)",
  ".plans-pricing-grid .plan-tier-note",
  ".plan-card-brochure",
  "@keyframes planBrochurePulse",
  "--plan-pointer-x",
  "PL-01 visual guard",
  ".plans-pricing-screen .plans-pricing-grid .plan-tier-free",
  "body.theme-light .plans-pricing-screen .plan-tier-free",
  "body:not(.theme-light) .plans-pricing-screen .plan-tier-pro",
  ".plan-mini-dashboard",
  ".plan-mobile-tabs",
  ".plan-selected-details",
  ".plan-trust-bar",
  ".plan-feature-matrix",
  ".superadmin-plan-grid",
  ".superadmin-plan-remote-list",
  ".superadmin-plan-safe-note",
  ".superadmin-plan-grid .superadmin-plan-card",
  ".superadmin-plan-remote-list .superadmin-plan-remote-card",
  "body.theme-light .plan-selected-details",
], "CSS visual responsivo dos planos");

includesAll(progress, [
  "Status: implementada nesta rodada",
  "Carrossel mobile em scroll horizontal",
  "Painel Superadmin de apresentacao dos planos",
  "Fase PL-02 - Cobranca e Mercado Pago",
  "nao altera checkout real",
], "documentacao de progresso");

console.log("Plans presentation structure tests OK");
