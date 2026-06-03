const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

const requiredApp = [
  "Fase atual: editor liberado para qualquer usuário autenticado.",
  "function getStorefrontCompatibleAdminSlugs",
  "getStorefrontCompatibleAdminSlugs(adminSlug).has(targetSlug)",
  "Entre para editar esta loja",
  "No plano Grátis você pode montar e visualizar a loja",
  "Entrar no ERP"
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

console.log("Admin access: fallback autenticado e mensagem elegante validados.");
