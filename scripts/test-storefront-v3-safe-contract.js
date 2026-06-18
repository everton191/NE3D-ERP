const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const storefrontLayouts = fs.readFileSync("src/storefront/styles/layouts.css", "utf8");
const storefrontPublicRenderer = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'return "edit-identity";',
  'return "edit-settings";',
  'return "publish";',
  '"sfe-workspace--mobile" : "sfe-workspace--desktop"',
  'data-store-editor-theme="light"',
  'sfe-workspace__preview" data-storefront-theme="light"',
  'store-editor-v3-portal',
  'data-storefront-theme="light"'
].forEach((marker) => assert(app.includes(marker), `Contrato seguro V3 ausente em app.js: ${marker}`));

const navStart = storefrontPublicRenderer.indexOf("api.bottomNav = function bottomNav");
const navEnd = storefrontPublicRenderer.indexOf("api.root = function root", navStart);
const navBlock = storefrontPublicRenderer.slice(navStart, navEnd);

assert(navStart >= 0 && navEnd > navStart, "Navegacao inferior V3 nao localizada");
assert(!navBlock.includes("<span>Produtos</span>"), "Barra publica mobile ainda possui o quinto item Produtos");
["Início", "Categorias", "Orçamento", "Contato"].forEach((label) => {
  assert(navBlock.includes(`<span>${label}</span>`), `Item obrigatorio ausente na barra publica: ${label}`);
});
assert(storefrontLayouts.includes(".sfv3-bottom-nav"), "Barra publica mobile V3 nao localizada");
assert(storefrontLayouts.includes("grid-template-columns:repeat(4,minmax(0,1fr))"), "Barra publica mobile nao usa quatro colunas");

[
  ".store-editor-v3-mobile,",
  ".store-editor-v3-desktop,",
  ".store-editor-v3-preview,",
  ".store-editor-v3-portal,"
].forEach((marker) => assert(css.includes(marker), `Raiz de tema V3 nao isolada em style.css: ${marker}`));

console.log("Storefront V3 safe contract: contextos, tema e navegacao publica com quatro itens validados.");
