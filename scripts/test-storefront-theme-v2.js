const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const service = fs.readFileSync("src/services/themeAuthorityV2.js", "utf8");
const css = fs.readFileSync("themes/base/design-system-v2.css", "utf8");

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
  "const preference = normalizarTemaLojaOnline(theme.mode || getStoreThemeSaved())",
  "const mode = getEffectiveThemeMode(preference)",
  "storefront-theme-v2",
  'data-store-theme-preference="${escaparAttr(storefrontTheme.preference)}"',
  '${["light", "system", "dark"].map'
].forEach((marker) => assert(app.includes(marker), `Integracao Storefront V2 ausente: ${marker}`));

[
  ":root[data-store-theme=\"light\"]",
  ":root[data-store-theme=\"dark\"]",
  "--color-text-primary:var(--store-text)",
  '.storefront-theme-v2[data-store-theme="dark"] :where(',
  ".store-public-main-nav a,",
  ".storefront-theme-v2 .store-public-banner",
  ".storefront-theme-v2 .store-public-product-grid",
  ".storefront-theme-v2 .store-public-product-card"
].forEach((marker) => assert(css.includes(marker), `Tokens ou shell visual ausentes: ${marker}`));

console.log("Storefront theme V2: preferencia separada, modo system e fallback legado validados.");
