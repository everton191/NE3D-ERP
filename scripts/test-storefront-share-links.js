const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");

const required = [
  "getStorefrontShareContext",
  "abrirPreviewCompartilhamentoLoja",
  "abrirWhatsappCompartilhamentoLoja",
  "abrirInstagramLojaPublica",
  "abrirEmailLojaPublica",
  "Object.assign(window,",
  "abrirWhatsappProdutoLojaPublica",
  "copiarLinkLojaPublica",
  "appConfig.whatsappNumber",
  "appConfig.companyInstagram",
  "appConfig.companyEmail",
  "navigator.share",
  "store-public-share-inline",
  "Compartilhar categoria",
  "view: \"product\"",
  "contact.instagram ? \"abrirInstagramLojaPublica()\"",
  "contact.whatsapp ? \"abrirWhatsappLojaPublica()\""
];

const missing = required.filter((item) => !app.includes(item));

if (missing.length) {
  console.error("Compartilhamento da loja incompleto:", missing.join(", "));
  process.exit(1);
}

if (app.includes("window.open('${escaparAttr(normalizarUrlInstagramLoja(contact.instagram))}'")) {
  console.error("Instagram da loja nao deve depender de window.open inline.");
  process.exit(1);
}

console.log("Storefront share links: loja, produto, categoria, WhatsApp e fallback presentes.");
