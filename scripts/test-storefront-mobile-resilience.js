const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");
const publicRenderer = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");
const editorRenderer = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");
const layouts = fs.readFileSync("src/storefront/styles/layouts.css", "utf8");

const requiredCss = [
  "@media(max-width:900px)",
  "@media(max-width:560px)",
  "100dvh",
  "var(--app-safe-bottom",
  ".sfv3-bottom-nav",
  ".sfe-shell--mobile",
  ".sfe-actions"
];

const requiredRuntime = [
  "renderStoreVisualMobileActions",
  "storefrontGuidedPanelOpen",
  "visualViewport"
];

const requiredVisual = [
  "sfv3-bottom-nav",
  "sfe-shell--mobile",
  "sfe-preview",
  "sfe-actions"
];

const missing = [
  ...requiredCss.filter((item) => !layouts.includes(item)),
  ...requiredRuntime.filter((item) => !app.includes(item)),
  ...requiredVisual.filter((item) => !`${publicRenderer}\n${editorRenderer}`.includes(item))
];

if (missing.length) {
  console.error("Resiliencia mobile incompleta:", missing.join(", "));
  process.exit(1);
}

console.log("Storefront mobile: safe area, bottom nav, editor guiado e teclado revisados.");
