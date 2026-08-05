const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const editor = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");
const storefront = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");
const layouts = fs.readFileSync("src/storefront/styles/layouts.css", "utf8");
const components = fs.readFileSync("src/storefront/styles/components.css", "utf8");
const appStyles = fs.readFileSync("style.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'class="sfe-actions',
  "sfe-action-back",
  "Salvar rascunho",
  "Próximo",
  "Publicar",
  'class="sfe-mobile-actions"',
  "voltarPainelLojaVisual(event)",
  "salvarEdicaoVisualAtualLoja()",
  "abrirLojaPublicaOnline()",
  'id="storefrontProductForm"',
  'data-guided-product-step="${step}"',
  "processarImagemProdutoLojaOnline(",
  'label: "Adicionar mais fotos"',
  "multiple: true",
  "removerImagemProdutoLojaOnline(",
].forEach((marker) => assert(editor.includes(marker), `Ação mobile V3 ausente: ${marker}`));

[
  'class="sfv3-bottom-nav"',
  "adicionarProdutoCarrinhoLojaPublica(",
  "abrirCarrinhoLojaPublica()",
  "abrirWhatsappLojaPublica()",
  "selecionarImagemProdutoLojaPublica(this)",
  "navegarLojaPublicaLink(event,this",
].forEach((marker) => assert(storefront.includes(marker), `Ação pública V3 ausente: ${marker}`));

[
  ".sfe-actions{position:sticky;bottom:0;",
  "calc(8px + var(--app-safe-bottom,0px))",
  ".sfv3-bottom-nav{position:fixed;right:0;bottom:0;left:0;",
  "calc(5px + var(--app-safe-bottom,0px))",
  ".sfv3{padding-bottom:calc(var(--store-bottom-bar-height)",
  ".sfv3-search{width:100%;max-width:none;grid-column:1/-1;grid-row:2}",
  "grid-template-columns:repeat(2,minmax(0,1fr));",
  'html[data-store-editor-keyboard-open="true"] .sfe-actions',
  "@media(max-width:560px)",
].forEach((marker) => assert(layouts.includes(marker), `Layout mobile V3 ausente: ${marker}`));

assert(components.includes(".storefront-editor :where(button,.store-ui-button,.btn)"), "Botões do editor não usam o componente-base");
assert(app.includes("function alinharSelecaoLojaVisual"), "Alinhamento contextual da edição ausente");
assert(editor.includes('event.preventDefault();event.stopPropagation();'), "Voltar do editor deve impedir clique atravessando para a prévia");
assert(!editor.includes(">‹</button>"), "Editor ainda usa seta textual fora do padrão");
assert(!app.includes('<i aria-hidden="true">⌄</i>'), "Menu expansível ainda usa seta vertical antiga");
assert(app.includes('class="expand-toggle-indicator"') && appStyles.includes('.expand-toggle-indicator::before'), "Expansíveis devem usar indicador mais/menos compartilhado");
assert(!editor.includes("store-product-mobile-actions"), "Classe visual V2 não deve retornar ao editor V3");

console.log("Storefront mobile actions: editor V3, galeria, carrinho, navegação e safe area validados.");
