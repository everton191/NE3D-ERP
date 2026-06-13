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
  "renderStoreGuidedCategoryIconPicker",
  "store-editor-v3-mobile",
  "store-editor-v3-desktop",
  "store-editor-v3-preview",
  "store-editor-v3-portal"
].forEach((marker) => assert(app.includes(marker), `Contrato V3 ausente em app.js: ${marker}`));

[
  "--store-editor-v3-keyboard-inset",
  "data-store-editor-keyboard-open",
  ".store-editor-v3-switch",
  ".store-guided-category-form",
  ".store-guided-list-screen",
  "position:fixed !important",
  "margin:0 !important",
  "background-image:none !important",
  ".store-guided-editor-sidebar.is-open .store-guided-list-head",
  ".store-guided-editor-sidebar.is-open .store-guided-v3-sticky-head",
  "background:#ffffff !important",
  ".store-guided-editor-sidebar.is-open .store-guided-admin-card",
  "grid-template-columns:minmax(0, 1fr)",
  ".store-guided-editor-sidebar.is-open :where(input,textarea)::placeholder"
].forEach((marker) => assert(css.includes(marker), `Isolamento visual ausente em style.css: ${marker}`));

const storefrontCss = fs.readFileSync("storefront-v3.css", "utf8");
[
  ".storefront-v3__category-card",
  ".storefront-v3__product-card",
  "background-image:none !important",
  "backdrop-filter:none !important"
].forEach((marker) => assert(storefrontCss.includes(marker), `Isolamento publico V3 ausente em storefront-v3.css: ${marker}`));

console.log("Storefront V3 theme isolation: tema, escopo do editor mobile e catalogos dedicados validados.");
