const fs = require("fs");

const css = fs.readFileSync("style.css", "utf8");
const app = fs.readFileSync("app.js", "utf8");

const requiredCss = [
  "@media (max-width: 860px)",
  ".store-mobile-admin-actions",
  "max-height:52dvh",
  "100dvh",
  "env(safe-area-inset-bottom)",
  ".storefront-crop-grid"
];

const requiredApp = [
  "renderStoreVisualMobileActions",
  "setStoreVisualViewport('mobile')",
  "store-mobile-admin-actions"
];

const missing = [
  ...requiredCss.filter((item) => !css.includes(item)),
  ...requiredApp.filter((item) => !app.includes(item))
];

if (missing.length) {
  console.error("Resiliencia mobile incompleta:", missing.join(", "));
  process.exit(1);
}

console.log("Storefront mobile: drawer/sidebar, bottom actions, safe area e viewport revisados.");
