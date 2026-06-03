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
  "function validarTextoVisualLoja",
  "function atualizarPreviewGuiadoLoja",
  "function normalizarWhatsappLojaPublica",
  "Object.assign(window, {\n    selecionarItemLojaVisual",
  "fecharPainelEdicaoGuiadaLoja,\n    editarProdutoPublicadoLojaOnline",
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

const floatingEditor = extractFunction("renderStoreAdminFloatingEditor");
const mobileActions = extractFunction("renderStoreVisualMobileActions");
assert(!floatingEditor.includes("store-context-admin-bar"), "Editor guiado nao deve renderizar barra contextual duplicada");
assert(mobileActions.includes('return "";'), "Rodape antigo do editor guiado deve permanecer removido");
assert(app.includes("Copiar link da loja"), "Toolbar desktop deve nomear claramente a acao de copiar link");
assert(app.includes("Abrir loja"), "Toolbar desktop deve nomear claramente a abertura da loja");
assert(app.includes('maxlength="50"'), "Campos principais da loja devem possuir limite visual seguro");
assert(app.includes('maxlength="180"'), "Descricao de produto deve possuir limite visual seguro");
assert(app.includes("vm?.limits?.shareEnabled !== false"), "Link guiado respeita regra de compartilhamento do plano");
assert(app.includes("const START_PLAN_ENABLED = false"), "Homologacao da loja nao pode ativar checkout Start");
assert(app.includes("const STOREFRONT_REAL_TEST_FULL_ACCESS = true"), "Homologacao real da loja deve ficar explicita");
assert(app.includes("function isStorefrontRealTestFullAccessEnabled"), "Liberacao da loja deve usar helper controlado");
assert(app.includes("testMode: true"), "Limites da loja em homologacao devem marcar testMode");
assert(app.includes("Produtos da loja online ficam disponíveis no Start ou Pro."), "Produtos da loja continuam protegidos no Gratis");
const normalizeWhatsapp = new Function(`${extractFunction("normalizarWhatsappLojaPublica")}; return normalizarWhatsappLojaPublica;`)();
assert(normalizeWhatsapp("(85) 99999-9999") === "5585999999999", "WhatsApp da loja deve receber DDI brasileiro quando necessario");
assert(normalizeWhatsapp("+55 (85) 99999-9999") === "5585999999999", "WhatsApp da loja nao deve duplicar DDI existente");
[
  "Fase 7C.2: experiencia mobile propria",
  ".store-visual-editor-topbar,",
  ".store-context-admin-bar{",
  ".store-mobile-admin-actions{",
  "display:none !important;",
  ".store-context-edit-fab{",
  "display:inline-flex;",
  "--store-stage-max:min(100%, 1760px);",
  "grid-template-columns:1fr;",
  "min-height:44px;",
  "font-size:16px;"
].forEach((marker) => assert(css.includes(marker), `Contrato mobile 7C.2 ausente: ${marker}`));

assert(sw.includes("simplifica-3d-v143-storefront-full-test-20260603"), "Cache PWA da loja publica nao foi atualizado");
assert(index.includes("1.0.37-rc-storefront-full-test-20260603"), "Cache-bust web da loja publica nao foi atualizado");
[
  "Preview do catálogo",
  "Preview das categorias",
  "Preview compartilhável",
  "Preview de publicação",
  "Preview da experiência"
].forEach((marker) => assert(!fs.readFileSync("modules/store-editor/storeEditorTabs.js", "utf8").includes(marker), `Modulo de abas nao deve exibir texto em ingles: ${marker}`));
assert(!fs.readFileSync("modules/store-editor/storeEditorPreview.js", "utf8").includes("Preview da loja"), "Fallback de visualizacao deve estar em portugues");
assert(!fs.readFileSync("modules/store-editor/storeEditorProducts.js", "utf8").includes("testar preview"), "Estado vazio de produtos deve estar em portugues");

console.log("Storefront guided editor: toolbar unica, preview imediato, bottom sheet mobile, produto publicado e cache PWA premium validados.");
