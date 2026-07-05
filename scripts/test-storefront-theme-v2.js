const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const service = fs.readFileSync("src/services/themeAuthorityV2.js", "utf8");
const css = fs.readFileSync("themes/base/design-system-v2.css", "utf8");
const publicRenderer = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'const STORE_THEME_KEY = "simplifica3d_store_theme_preference"',
  'const LEGACY_STORE_THEME_KEY = "simplifica3d_store_theme"',
  "function getSavedStoreThemePreference",
  "function applyStoreTheme",
  'writeStorage(STORE_THEME_KEY, normalized)',
  'writeStorage(LEGACY_STORE_THEME_KEY, resolved)'
].forEach((marker) => assert(service.includes(marker), `Autoridade Storefront ausente: ${marker}`));

[
  'const STOREFRONT_THEME_STORAGE_KEY = "simplifica3d_store_theme_preference"',
  "function normalizarTemaLojaOnline",
  'data-store-theme="light"',
  'data-store-theme-preference="light"'
].forEach((marker) => assert(app.includes(marker), `Integracao Storefront V2 ausente: ${marker}`));

[
  ":root[data-store-theme=\"light\"]",
  ":root[data-store-theme=\"dark\"]",
  "--color-text-primary:var(--store-text)",
  '.storefront-theme-v2[data-store-theme="dark"] :where(',
  ".storefront-theme-v2 .store-public-banner",
  ".storefront-theme-v2 .store-public-product-grid",
  ".storefront-theme-v2 .store-public-product-card"
].forEach((marker) => assert(css.includes(marker), `Tokens ou shell visual ausentes: ${marker}`));

assert(publicRenderer.includes('data-store-theme="light" data-store-theme-preference="light"'), "Storefront V3 deve permanecer isolada no tema claro");

console.log("Storefront theme V2: autoridade legada preservada e Storefront V3 clara isolada validadas.");
