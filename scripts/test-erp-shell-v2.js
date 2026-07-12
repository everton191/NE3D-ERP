const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("themes/base/design-system-v2.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'class="app-shell erp-shell erp-theme-v2"',
  'class="desktop-shell s3d-shell${classeMenu}"',
  'class="desktop-main app-content s3d-shell-main"',
  'class="topbar app-topbar s3d-toolbar s3d-header"',
  'class="side-menu app-sidebar desktop-sidebar s3d-sidebar',
  'class="side-nav-button s3d-nav-item"',
  'class="mobile-bottom-nav app-bottom-navigation s3d-bottom-nav"',
  'data-ui3-screen="dashboard"',
  'ui3-dashboard',
  'class="auth-page s3d-page s3d-auth-page"',
  'class="auth-card s3d-card s3d-auth-card"',
  'class="card onboarding-card s3d-card s3d-onboarding"'
].forEach((marker) => assert(index.includes(marker) || app.includes(marker), `Contrato ERP shell V2 ausente: ${marker}`));

[
  ".erp-theme-v2 .s3d-card",
  ".erp-theme-v2 .s3d-button-primary",
  ".erp-theme-v2 :where(.s3d-input,.s3d-select,.s3d-textarea)",
  ".erp-theme-v2 .s3d-badge",
  ".erp-theme-v2 .s3d-toolbar",
  ".erp-theme-v2 .s3d-sidebar",
  ".erp-theme-v2 .s3d-empty-state",
  ".erp-theme-v2 .s3d-loading-state",
  ".erp-theme-v2 .s3d-error-state"
].forEach((marker) => assert(css.includes(marker), `Componente-base V2 ausente: ${marker}`));

assert((index.match(/id="app-shell"/g) || []).length === 1, "index.html deve manter apenas um app-shell");
assert(!css.includes(".storefront-theme-v2 .s3d-dashboard"), "Tema da loja nao pode controlar dashboard ERP");

console.log("ERP shell V2: entrada, navegacao, dashboard e isolamento visual verificados.");
