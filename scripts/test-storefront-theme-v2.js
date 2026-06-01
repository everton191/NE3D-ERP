const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const service = fs.readFileSync("src/services/themeAuthorityV2.js", "utf8");

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

console.log("Storefront theme V2: preferencia separada, modo system e fallback legado validados.");
