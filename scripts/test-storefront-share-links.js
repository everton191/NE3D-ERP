const fs = require("fs");
const assert = require("node:assert/strict");

const app = fs.readFileSync("app.js", "utf8");
const renderer = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");
const publicModule = fs.readFileSync("src/features/storefront/storefront-public.js", "utf8");
const productEditor = fs.readFileSync("src/features/storefront/storefront-product-editor.js", "utf8");
const hay = `${app}\n${renderer}\n${publicModule}\n${productEditor}`;

const required = [
  "getStorefrontShareContext",
  "abrirPreviewCompartilhamentoLoja",
  "abrirWhatsappCompartilhamentoLoja",
  "abrirInstagramLojaPublica",
  "abrirTikTokLojaPublica",
  "abrirEmailLojaPublica",
  "Object.assign(window,",
  "abrirWhatsappProdutoLojaPublica",
  "copiarLinkLojaPublica",
  "appConfig.whatsappNumber",
  "appConfig.companyInstagram",
  "appConfig.companyEmail",
  "navigator.share",
  "Compartilhar categoria",
  "view: \"product\"",
  "abrirInstagramLojaPublica()",
  "abrirWhatsappLojaPublica()",
  "abrirTikTokLojaPublica()"
];

const missing = required.filter((item) => !hay.includes(item));

if (missing.length) {
  console.error("Compartilhamento da loja incompleto:", missing.join(", "));
  process.exit(1);
}

if (app.includes("window.open('${escaparAttr(normalizarUrlInstagramLoja(contact.instagram))}'")) {
  console.error("Instagram da loja nao deve depender de window.open inline.");
  process.exit(1);
}

global.window = global;
const storefrontPublic = require("../src/features/storefront/storefront-public.js");
assert.equal(storefrontPublic.normalizarUrlInstagramLoja("@simplifica3d"), "https://www.instagram.com/simplifica3d");
assert.match(app, /normalizarUrlInstagramLoja:\s*\(\.\.\.args\) => window\.SimplificaStorefrontPublic\.normalizarUrlInstagramLoja/);

console.log("Storefront share links: loja, produto, categoria, WhatsApp e fallback presentes.");
