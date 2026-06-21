const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const renderer = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");

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

const missing = required.filter((item) => !app.includes(item) && !renderer.includes(item));

if (missing.length) {
  console.error("Compartilhamento da loja incompleto:", missing.join(", "));
  process.exit(1);
}

if (app.includes("window.open('${escaparAttr(normalizarUrlInstagramLoja(contact.instagram))}'")) {
  console.error("Instagram da loja nao deve depender de window.open inline.");
  process.exit(1);
}

console.log("Storefront share links: loja, produto, categoria, WhatsApp e fallback presentes.");
