const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'return "preview";',
  'return "guided";',
  'return "edit-product";',
  'return "edit-category";',
  'const hideFooter = mobileV3Only && ["edit-product", "edit-category"].includes(uiMode);',
  'data-guided-selection="${escaparAttr(selection.type)}" data-store-ui-mode="${escaparAttr(uiMode)}"',
  '<div class="store-guided-sidebar-footer" ${hideFooter ? "hidden" : ""}>'
].forEach((marker) => assert(app.includes(marker), `Contexto mobile ausente em app.js: ${marker}`));

[
  ".store-guided-editor-sidebar.is-open{",
  "grid-template-rows:auto minmax(0, 1fr) auto;",
  ".store-guided-editor-sidebar.is-open .store-guided-context-panel{",
  "grid-template-rows:minmax(0, 1fr);",
  ".storefront-v3-host--admin .store-visual-editor-frame:has(.store-guided-editor-sidebar.is-open) .store-visual-editor-main",
  ".storefront-v3-host--admin .store-visual-editor-frame:has(.store-guided-editor-sidebar.is-open) .store-visual-mobile-actions"
].forEach((marker) => assert(css.includes(marker), `Contexto mobile ausente em style.css: ${marker}`));

console.log("Store editor V3 mobile contexts: modos, footer contextual e overlay mobile validados.");
