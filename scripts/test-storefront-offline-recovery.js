const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");

const required = [
  "simplifica-storefront-admin-autosave-v1",
  "simplifica-storefront-admin-recovery-v1",
  "simplifica-storefront-admin-offline-queue-v1",
  "getStorefrontSessionRecoveryState",
  "restaurarStorefrontAutosaveLocal",
  "descartarStorefrontAutosaveLocal",
  "window.addEventListener(\"online\"",
  "window.addEventListener(\"offline\"",
  "simplifica-3d-v194-settings-security-menu-20260625"
];

const missing = required.filter((item) => !app.includes(item) && !sw.includes(item));

if (missing.length) {
  console.error("Recovery/offline incompleto:", missing.join(", "));
  process.exit(1);
}

console.log("Storefront offline/recovery: rascunho, fila local e cache PWA versionado.");
