const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

const required = [
  "APP_VERSION = \"1.0.28-rc\"",
  "storefrontScheduleAutosave",
  "renderStorefrontRecoveryNotice",
  "abrirCropImagemLojaOnline",
  "confirmarCropImagemLojaOnline",
  "store-product-prices",
  "storefrontQueuePendingAction",
  "storefront-crop-modal",
  "storefront-recovery-card"
];

const missing = required.filter((item) => !app.includes(item) && !css.includes(item));

if (missing.length) {
  console.error("Fase 3.6 incompleta:", missing.join(", "));
  process.exit(1);
}

console.log("Storefront Fase 3.6: autosave, crop, validacao e recovery presentes.");
