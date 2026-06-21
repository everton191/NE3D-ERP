const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const layouts = fs.readFileSync("src/storefront/styles/layouts.css", "utf8");
const publicRenderer = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");
const editorRenderer = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

[
  "let storefrontPublicInternalHistory = []",
  "function fecharNavegacaoContextualLojaSeExistir",
  "function navegarVoltarLojaSeguroInterno",
  "storefrontPublicInternalHistory.push(previousPath)",
  "Modelo carregado como rascunho. Revise foto, nome, descrição e preço."
].forEach((marker) => assert(app.includes(marker), `Polimento funcional ausente: ${marker}`));

[
  "storefront-v3",
  'data-store-theme="light"',
  "api.headerMenu",
  "api.productPage",
  "api.contact",
  "sfv3-product-gallery",
  "Compartilhar categoria"
].forEach((marker) => assert(publicRenderer.includes(marker), `Polimento público V3 ausente: ${marker}`));

[
  "sfe-form",
  "sfe-tabs",
  "sfe-actions",
  "Adicionar mais fotos",
  "WhatsApp da loja"
].forEach((marker) => assert(editorRenderer.includes(marker), `Polimento do editor V3 ausente: ${marker}`));

[
  ".sfv3-product-grid",
  ".sfv3-bottom-nav",
  ".sfe-fields",
  ".sfe-image-gallery",
  ".sfv3-contact-card",
  "overflow:auto",
  "var(--app-safe-bottom"
].forEach((marker) => assert(layouts.includes(marker), `CSS final V3 ausente: ${marker}`));

assert(css.includes('body[data-ui-profile="android_apk"]'), "Perfil Android deve continuar isolado");

["Editar loja real", "Editar na loja real", "Abrir loja real"].forEach((legacyLabel) => {
  assert(!app.includes(legacyLabel) && !publicRenderer.includes(legacyLabel) && !editorRenderer.includes(legacyLabel), `Rótulo legado ainda visível: ${legacyLabel}`);
});

console.log("Storefront final polish: navegação, tema claro, galeria, contatos e editor V3 validados.");
