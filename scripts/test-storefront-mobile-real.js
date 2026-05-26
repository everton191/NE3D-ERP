const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

const required = [
  "store-public-connection-badge",
  "atualizarStorefrontConnectionBadge",
  "env(safe-area-inset-bottom)",
  "max-width:100vw",
  "touch-action:auto",
  "overflow-x:clip",
  "store-mobile-admin-actions"
];

const missing = required.filter((item) => !app.includes(item) && !css.includes(item));

if (missing.length) {
  console.error("Validacao mobile real incompleta:", missing.join(", "));
  process.exit(1);
}

console.log("Storefront mobile real: safe-area, overflow, touch e indicador de conexao presentes.");
