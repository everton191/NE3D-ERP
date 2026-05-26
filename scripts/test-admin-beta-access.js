const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

const requiredApp = [
  "if (isStorefrontAllowedTestUser(usuario, flags)) return true;",
  "function getStorefrontCompatibleAdminSlugs",
  "getStorefrontCompatibleAdminSlugs(adminSlug).has(targetSlug)",
  "Painel administrativo em liberação gradual",
  "PRO, Super Admin ou beta autorizada",
  "Solicitar acesso"
];

const requiredCss = [
  ".store-context-access-card",
  ".store-context-access-actions",
  "border:1px solid color-mix(in srgb, var(--store-primary, var(--color-primary)) 22%"
];

const missing = [
  ...requiredApp.filter((snippet) => !app.includes(snippet)),
  ...requiredCss.filter((snippet) => !css.includes(snippet))
];

if (missing.length) {
  console.error("Admin beta access incompleto:", missing);
  process.exit(1);
}

console.log("Admin beta access: regras PRO/Super Admin/beta e fallback elegante validados.");
