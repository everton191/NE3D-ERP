const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "function getStorefrontUiMode",
  "catalog-products",
  "catalog-categories",
  'mode.admin ? "" : renderStorefrontV3BottomNav(vm)',
  "renderStoreEditorSwitch",
  "renderStoreGuidedCategoryIconPicker"
].forEach((marker) => assert(app.includes(marker), `Contrato V3 ausente em app.js: ${marker}`));

[
  "--store-editor-v3-keyboard-inset",
  "data-store-editor-keyboard-open",
  ".store-editor-v3-switch",
  ".store-guided-category-form",
  ".store-guided-list-screen",
  "position:fixed !important",
  ".store-guided-editor-sidebar.is-open :where(input,textarea)::placeholder"
].forEach((marker) => assert(css.includes(marker), `Isolamento visual ausente em style.css: ${marker}`));

console.log("Storefront V3 theme isolation: tema, escopo do editor mobile e catalogos dedicados validados.");
