const fs = require("fs");

const index = fs.readFileSync("index.html", "utf8");
const service = fs.readFileSync("src/services/themeAuthorityV3.js", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(service.includes('ERP_THEME_KEY = "simplifica3d_erp_theme_preference"'), "Chave ERP V3 ausente");
assert(service.includes('STORE_THEME_KEY = "simplifica3d_store_theme_preference"'), "Chave Storefront V3 ausente");
assert(!service.includes('ERP_THEME_KEY = "simplifica3d_store_theme_preference"'), "ERP reutiliza indevidamente a chave da loja");
assert(index.indexOf("data-erp-theme") < index.indexOf("/app.js?v="), "Bootstrap ERP ocorre tarde demais");
assert(!index.includes('document.documentElement.setAttribute("data-store-theme"'), "Bootstrap global nao deve aplicar tema da loja no html");
assert(
  service.includes('querySelectorAll?.(".storefront-root,.store-public-shell,.storefront-theme-v3,')
    && service.includes(".store-cart-backdrop,.store-lead-backdrop"),
  "Tema da loja deve aplicar somente nos roots da storefront"
);
assert(index.indexOf("/src/services/themeAuthorityV3.js") < index.indexOf("/app.js?v="), "Servico de tema carrega depois do app");
assert(sw.includes('"./src/services/themeAuthorityV3.js"'), "Servico de tema nao entra no cache PWA");

console.log("Theme isolation: ERP, loja, bootstrap antecipado e PWA separados.");
