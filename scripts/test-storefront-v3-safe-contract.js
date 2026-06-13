const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const storefrontCss = fs.readFileSync("storefront-v3.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'return "edit-identity";',
  'return "edit-settings";',
  'return "publish";',
  '"store-editor-v3-mobile" : "store-editor-v3-desktop"',
  'data-store-editor-theme="light"',
  'store-editor-v3-preview" data-storefront-theme="light"',
  'store-editor-v3-portal',
  'data-storefront-theme="light"'
].forEach((marker) => assert(app.includes(marker), `Contrato seguro V3 ausente em app.js: ${marker}`));

const navStart = app.indexOf("function renderStorefrontV3BottomNav");
const navEnd = app.indexOf("function renderStorefrontV3Home", navStart);
const navBlock = app.slice(navStart, navEnd);

assert(navStart >= 0 && navEnd > navStart, "Navegacao inferior V3 nao localizada");
assert(!navBlock.includes("<span>Produtos</span>"), "Barra publica mobile ainda possui o quinto item Produtos");
["Início", "Categorias", "Carrinho", "WhatsApp"].forEach((label) => {
  assert(navBlock.includes(`<span>${label}</span>`), `Item obrigatorio ausente na barra publica: ${label}`);
});
assert(storefrontCss.includes("grid-template-columns:repeat(4, minmax(0, 1fr))"), "Barra publica mobile nao usa quatro colunas");

[
  ".store-editor-v3-mobile,",
  ".store-editor-v3-desktop,",
  ".store-editor-v3-preview,",
  ".store-editor-v3-portal,"
].forEach((marker) => assert(css.includes(marker), `Raiz de tema V3 nao isolada em style.css: ${marker}`));

console.log("Storefront V3 safe contract: contextos, tema e navegacao publica com quatro itens validados.");
