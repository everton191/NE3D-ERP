const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("themes/base/design-system-v2.css", "utf8");
const mainCss = fs.readFileSync("style.css", "utf8");
const templates = fs.readFileSync("src/shared/design-system/layouts/templates.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  ".erp-theme-v2 .s3d-page",
  ".erp-theme-v2 .s3d-shell-main",
  ".erp-theme-v2 .s3d-sidebar",
  ".erp-theme-v2 .s3d-dashboard",
  ".erp-theme-v2 .s3d-bottom-nav",
  "min-width:0",
  "padding-bottom:calc(76px + env(safe-area-inset-bottom))",
  "grid-template-columns:clamp(240px, 15vw, 280px) minmax(0, 1fr)"
].forEach((marker) => assert(css.includes(marker), `Protecao de layout V2 ausente: ${marker}`));

assert(!css.includes("width:100vw"), "Design System V2 nao deve usar width:100vw");
assert(app.includes('class="desktop-shell s3d-shell${classeMenu}"'), "Shell desktop nao recebeu classe V2");
assert(/class="mobile-home app-page s3d-page s3d-mobile-page(?:\s|\$\{)/.test(app), "Pagina mobile nao recebeu protecao V2");
assert(app.includes('class="mobile-bottom-nav app-bottom-navigation s3d-bottom-nav"'), "Bottom navigation nao recebeu contrato V2");
assert(templates.includes('data-ui-scroll-scope="page"'), "Template oficial precisa declarar escopo de scroll de pagina");
assert(templates.includes('data-ui-layout="content-grid"'), "Template oficial precisa declarar grade de conteudo");
[
  "data-ui-scroll-owner=\"app-content\"",
  "[data-ui-scroll-scope=\"page\"]",
  "[data-ui-layout=\"content-grid\"]",
  "scrollbar-gutter:stable",
  "min-width:0 !important"
].forEach((marker) => assert(mainCss.includes(marker), `Contrato global de largura/scroll ausente: ${marker}`));

console.log("Layout overflow V2: shell, mobile, safe-area e largura minima verificados.");
