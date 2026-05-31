const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractFunction(name) {
  const start = app.indexOf(`function ${name}`);
  assert(start >= 0, `Funcao ausente: ${name}`);
  const braceStart = app.indexOf("{", start);
  let depth = 0;
  for (let index = braceStart; index < app.length; index += 1) {
    if (app[index] === "{") depth += 1;
    if (app[index] === "}") depth -= 1;
    if (depth === 0) return app.slice(start, index + 1);
  }
  throw new Error(`Funcao incompleta: ${name}`);
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
const normalizeWhatsapp = new Function(`${extractFunction("normalizarWhatsappLojaPublica")}; return normalizarWhatsappLojaPublica;`)();
assert(normalizeWhatsapp("(85) 99999-9999") === "5585999999999", "WhatsApp da loja deve receber DDI brasileiro quando necessario");
assert(normalizeWhatsapp("+55 (85) 99999-9999") === "5585999999999", "WhatsApp da loja nao deve duplicar DDI existente");
[
  "Fase 7C.2: experiencia mobile propria",
  ".store-visual-editor-topbar,",
  ".store-context-admin-bar{",
  "grid-template-columns:repeat(3, minmax(0, 1fr))",
  ".store-mobile-admin-actions button:nth-child(2)",
  "grid-template-columns:1fr;",
  "min-height:44px;",
  "font-size:16px;"
].forEach((marker) => assert(css.includes(marker), `Contrato mobile 7C.2 ausente: ${marker}`));

assert(sw.includes("simplifica-3d-v127-estavel-20260531-store-editor-mobile"), "Cache PWA da fase 7C.2 nao foi atualizado");
assert(index.includes("1.0.21-rc-store-editor-mobile-20260531"), "Cache-bust web da fase 7C.2 nao foi atualizado");

console.log("Storefront guided editor: painel contextual, bottom sheet mobile, produto publicado e cache PWA validados.");
