const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");
const publicRenderer = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");
const editorRenderer = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");
const tokens = fs.readFileSync("src/storefront/styles/tokens.css", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

["const STOREFRONT_V3_PAYMENT_STATE", 'checkoutMode: "whatsapp"', "onlinePaymentEnabled: false", "function registrarPedidoRascunhoLojaPublica", "function storefrontProductUsesControlledStock"].forEach((marker) => assert(app.includes(marker), `Contrato funcional V3 ausente: ${marker}`));
["sfv3", "sfv3-header", "sfv3-hero", "sfv3-category-card", "sfv3-product-card", "sfv3-bottom-nav"].forEach((marker) => assert(publicRenderer.includes(marker), `Fundacao publica ausente: ${marker}`));
["sfe-shell", "sfe-preview", "sfe-tabs", "sfe-fields", "sfe-actions"].forEach((marker) => assert(editorRenderer.includes(marker), `Fundacao editor ausente: ${marker}`));
["--store-bg", "--store-primary", "--store-button-height-md", "--store-input-height"].forEach((marker) => assert(tokens.includes(marker), `Token V3 ausente: ${marker}`));
assert(!app.includes("renderStorefrontPublicV2"), "Renderer V2 ainda existe");
assert(!fs.existsSync("storefront-v3.css"), "CSS misturado antigo ainda existe");
assert(index.includes("/src/storefront/renderers/publicV3.js"), "Renderer publico nao carrega");
assert(index.includes("/src/storefront/renderers/editorV3.js"), "Renderer editor nao carrega");
assert(sw.includes("./src/storefront/renderers/publicV3.js"), "Renderer publico nao entra no PWA");
console.log("Storefront V3 foundation: fundacao rebuilt e contratos funcionais preservados.");
