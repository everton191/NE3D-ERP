const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "themes", "base", "design-system-v2.css"), "utf8");

assert(app.includes("plans-modern-screen plans-pricing-screen s3d-plans-v2"), "tela de planos deve possuir autoridade V2 isolada");
assert(app.includes("const START_PLAN_ENABLED = false"), "Start deve permanecer comercialmente bloqueado");
[
  '.erp-theme-v2[data-erp-theme="light"] .s3d-plans-v2',
  '.erp-theme-v2[data-erp-theme="dark"] .s3d-plans-v2',
  ".s3d-plans-v2 .plan-tier-card",
  ".s3d-plans-v2 .plan-tier-pro",
  ".s3d-plans-v2 .plans-pricing-grid"
].forEach((marker) => assert(css.includes(marker), `CSS de planos V2 ausente: ${marker}`));

assert(css.includes("grid-template-columns:repeat(3, minmax(0, 1fr))"), "desktop deve manter tres planos proporcionais");
assert(css.includes("grid-template-columns:1fr"), "mobile deve empilhar planos");
assert(css.includes(".s3d-plans-v2 .plan-tier-free"), "Free claro deve manter identidade verde");
assert(css.includes(".s3d-plans-v2 .plan-tier-start"), "Start claro deve manter identidade roxa");
assert(css.includes("background:var(--plan-accent, var(--s3d-brand-teal))"), "CTA claro deve acompanhar a cor do plano");

console.log("Plans theme V2: autoridade isolada, contraste claro e responsividade validados.");
