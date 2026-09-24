const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const publication = fs.readFileSync("src/features/storefront/storefront-publication.js", "utf8");
const editorModule = fs.readFileSync("src/features/storefront/storefront-editor.js", "utf8");
const hay = `${app}\n${publication}\n${editorModule}`;

const required = [
  "storefrontScheduleAutosave",
  "renderStorefrontRecoveryNotice",
  "abrirCropImagemLojaOnline",
  "confirmarCropImagemLojaOnline",
  "store-product-prices",
  "storefrontQueuePendingAction",
  "storefront-crop-modal",
  "storefront-recovery-card"
];

const missing = required.filter((item) => !hay.includes(item) && !css.includes(item));
if (!/const APP_VERSION = "\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?";/i.test(app)) {
  missing.unshift("APP_VERSION versionada");
}

if (missing.length) {
  console.error("Fase 3.6 incompleta:", missing.join(", "));
  process.exit(1);
}

console.log("Storefront Fase 3.6: autosave, crop, validacao e recovery presentes.");
