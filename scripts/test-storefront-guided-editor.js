const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "function selecionarItemLojaVisual",
  "function fecharPainelEdicaoGuiadaLoja",
  "function editarProdutoPublicadoLojaOnline",
  "function renderStoreGuidedContextPanel",
  "function renderStoreGuidedProductForm",
  "function renderStoreGuidedContactsForm",
  "function renderStoreGuidedLinks",
  "function normalizarWhatsappLojaPublica",
  'data-guided-selection="${escaparAttr(selection.type)}"',
  'data-store-section="contato"',
  'editarProdutoPublicadoLojaOnline(\'${id}\')',
  "encodeURIComponent(texto)"
].forEach((marker) => assert(app.includes(marker), `Editor guiado incompleto: ${marker}`));

[
  ".store-guided-editor-sidebar",
  ".store-guided-context-panel",
  ".store-guided-editor-sidebar.is-open",
  ".store-guided-editable",
  "@media (min-width:1024px)",
  "@media (max-width:860px)"
].forEach((marker) => assert(css.includes(marker), `CSS guiado ausente: ${marker}`));

assert(app.includes("vm?.limits?.shareEnabled !== false"), "Link guiado respeita regra de compartilhamento do plano");
assert(app.includes("Produtos da loja online ficam disponíveis no Start ou Pro."), "Produtos da vitrine continuam bloqueados no Gratis");
assert(sw.includes("simplifica-3d-v126-estavel-20260531-store-editor-guided"), "Cache PWA da fase 7C nao foi atualizado");
assert(index.includes("1.0.20-rc-store-editor-guided-20260531"), "Cache-bust web da fase 7C nao foi atualizado");

console.log("Storefront guided editor: painel contextual, mobile sheet, produto publicado e cache PWA validados.");
