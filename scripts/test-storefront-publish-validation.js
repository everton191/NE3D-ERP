const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");

const required = [
  "getStorefrontPublicationChecklist",
  "store-logo",
  "store-banner",
  "store-whatsapp",
  "store-products",
  "store-product-prices",
  "store-categories",
  "exigirChecklistPublicacaoLoja",
  "Finalize o checklist da loja antes de publicar ou compartilhar.",
  "renderStorefrontPublicationChecklistModal"
];

const missing = required.filter((item) => !app.includes(item));

if (missing.length) {
  console.error("Validacao de publicacao incompleta:", missing.join(", "));
  process.exit(1);
}

console.log("Storefront publish validation: checklist obrigatorio e bloqueios presentes.");
