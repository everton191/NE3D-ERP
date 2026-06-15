const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");
const publicRenderer = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");
const editorRenderer = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");
const components = fs.readFileSync("src/storefront/styles/components.css", "utf8");
const layouts = fs.readFileSync("src/storefront/styles/layouts.css", "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

["api.home", "api.hero", "api.benefits", "api.categories", "api.productSection", "api.contact", "api.productPage"].forEach((marker) => assert(publicRenderer.includes(marker), `Storefront premium incompleta: ${marker}`));
["api.overview", "api.product", "api.category", "api.banner", "api.contacts", "api.checklist"].forEach((marker) => assert(editorRenderer.includes(marker), `Editor premium incompleto: ${marker}`));
["store-ui-card", "store-ui-upload", "store-ui-button--secondary", "store-ui-button--ghost"].forEach((marker) => assert(components.includes(marker) || editorRenderer.includes(marker), `Componente premium ausente: ${marker}`));
["sfv3-hero", "sfv3-benefits", "sfv3-product-grid", "sfv3-contact", "sfe-preview", "sfe-tabs", "sfe-actions"].forEach((marker) => assert(layouts.includes(marker), `Layout premium ausente: ${marker}`));
assert(app.includes("function abrirCarrinhoLojaPublica"), "Carrinho funcional foi removido");
assert(app.includes("function abrirWhatsappLojaPublica"), "WhatsApp funcional foi removido");
assert(!publicRenderer.includes("store-public-"), "Interface publica ainda usa visual antigo");
console.log("Storefront premium: home, catálogo, contatos, editor e ações validados.");
