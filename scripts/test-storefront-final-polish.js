const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "let storefrontPublicInternalHistory = []",
  "function fecharNavegacaoContextualLojaSeExistir",
  "function navegarVoltarLojaSeguroInterno",
  "storefrontPublicInternalHistory.push(previousPath)",
  'body[data-ui-profile="android_apk"] .store-guided-editor-sidebar',
  ".store-public-admin-mode.store-plan-free",
  ".store-public-admin-mode.store-plan-start",
  ".store-public-admin-mode.store-plan-pro",
  ".store-admin-more-actions",
  "Substitua por um produto seu. Use o modelo como base para liberar edição completa e publicação."
].forEach((marker) => assert(app.includes(marker) || css.includes(marker), `Polimento final ausente: ${marker}`));

[
  '.store-public-shell[data-storefront-source="v2"][data-store-theme="dark"] .store-visual-editor-sidebar',
  '.store-public-shell[data-storefront-source="v2"][data-store-theme="light"] :where(.store-visual-editor-sidebar,.store-visual-editor-topbar)',
  ':root[data-store-theme="light"] body .store-visual-panel',
  '.store-public-shell[data-storefront-source="v2"].store-public-admin-mode .store-public-floating-cart',
  "grid-template-columns:repeat(2, minmax(0, 1fr));",
  "overscroll-behavior:contain;",
  ".store-public-search:focus-within",
  ".store-guided-form > header{\n  position:static;",
  ".store-guided-upload input{\n  width:100%;",
  ".store-public-shell[data-storefront-source=\"v2\"] .store-public-brand strong{\n    min-width:0;\n    overflow:hidden;\n    text-overflow:ellipsis;"
].forEach((marker) => assert(css.includes(marker), `CSS final da vitrine ausente: ${marker}`));

[
  "Editar loja real",
  "Editar na loja real",
  "Abrir loja real",
  "Copiar link da loja",
  "Abrir loja pública"
].forEach((legacyLabel) => assert(!app.includes(legacyLabel), `Rotulo legado ainda visivel: ${legacyLabel}`));

assert(app.includes("Copiar link da vitrine"), "Toolbar deve expor Copiar link da vitrine");
assert(app.includes("Abrir vitrine"), "Toolbar deve expor Abrir vitrine");

console.log("Storefront final polish: retorno interno, tema claro, perfil APK, toolbar e modelos de produto validados.");
