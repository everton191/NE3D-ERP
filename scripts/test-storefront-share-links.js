const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");

const required = [
  "getStorefrontShareContext",
  "abrirPreviewCompartilhamentoLoja",
  "abrirWhatsappCompartilhamentoLoja",
  "copiarLinkLojaPublica",
  "navigator.share",
  "store-public-share-inline",
  "Compartilhar categoria",
  "view: \"product\""
];

const missing = required.filter((item) => !app.includes(item));

if (missing.length) {
  console.error("Compartilhamento da loja incompleto:", missing.join(", "));
  process.exit(1);
}

console.log("Storefront share links: loja, produto, categoria, WhatsApp e fallback presentes.");
