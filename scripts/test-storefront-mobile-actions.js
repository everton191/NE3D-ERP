const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "function abrirAcoesProdutoLojaOnline",
  "function renderAcoesProdutoLojaOnline",
  "function executarAcaoProdutoLojaOnline",
  "function fecharMenusContextuaisProdutosLoja",
  "function sincronizarMenuContextualProduto",
  "function configurarMenusContextuaisProdutosLoja",
  "function copiarLinkProdutoLojaOnline",
  "function abrirSeletorFotoProdutoLojaOnline",
  "function cancelarEdicaoProdutoLojaOnline",
  "function validarEtapaProdutoLojaOnline",
  "function validarTodasEtapasProdutoLojaOnline",
  "function setStorefrontProductMobileStep",
  "function avancarEtapaProdutoLojaOnline",
  "function voltarEtapaProdutoLojaOnline",
  "function ajustarQuantidadeProdutoLojaOnline",
  "function atualizarResumoRevisaoProdutoLojaOnline",
  'class="btn ghost ui-icon-button store-product-mobile-actions"',
  'class="store-admin-more-actions store-product-desktop-actions ui-context-menu"',
  'class="app-form store-product-form"',
  'class="store-product-mobile-flow-header"',
  'class="store-product-stepper"',
  'data-product-step="1"',
  'data-product-step="2"',
  'data-product-step="3"',
  'data-product-step="4"',
  'data-product-step-next',
  'data-product-step-save',
  'inputmode="decimal"',
  'inputmode="numeric"',
  'aria-label="Diminuir quantidade"',
  'aria-label="Aumentar quantidade"',
  'aria-label="Mais ações do produto"',
  'aria-controls="store-product-action-sheet"',
  'aria-modal="true"',
  'onclick="closeDrawer()">Cancelar</button>',
  'onclick="cancelarEdicaoProdutoLojaOnline()">Cancelar</button>',
  '${editing.id ? "Salvar alterações" : "Salvar produto"}'
].forEach((marker) => assert(app.includes(marker), `Acoes mobile da loja incompletas: ${marker}`));

[
  ".store-product-action-sheet{",
  ".store-product-sheet-actions{",
  ".store-product-sheet-action{",
  ".store-product-mobile-actions{",
  ".store-product-mobile-flow-header,",
  ".store-product-mobile-sticky-actions{",
  ".store-product-form-step.is-active{",
  ".store-product-stepper{",
  ".store-product-quantity-control{",
  ".store-product-form-step :where(input, select, textarea){",
  "min-height:48px;",
  ".store-product-desktop-actions{",
  ".store-admin-more-actions.open-up .ui-context-menu-panel{",
  "padding:var(--space-sm) var(--space-md) calc(var(--space-md) + env(safe-area-inset-bottom));",
  "grid-template-columns:72px minmax(0, 1fr);",
  "@media (max-width: 359px){",
  "grid-template-columns:64px minmax(0, 1fr);"
].forEach((marker) => assert(css.includes(marker), `CSS de acoes mobile da loja ausente: ${marker}`));

assert(app.includes("openDrawer({"), "Bottom sheet mobile deve usar drawer-layer oficial");
assert(app.includes('showOverlay(null, { closeAction: config.closable === false ? "" : "closeDrawer()" })'), "Drawer deve manter overlay com fechamento externo");
assert(!app.includes('aria-label="Mais ações" title="Mais ações"><span aria-hidden="true">⋯</span></summary>\n                  <div class="store-admin-actions ui-context-menu-panel">\n                    <button class="btn ghost" type="button" onclick="alternarProdutoLojaOnline'), "Menu legado estreito do produto nao deve voltar");

console.log("Storefront mobile actions: cards compactos, dropdown desktop e bottom sheet mobile validados.");
