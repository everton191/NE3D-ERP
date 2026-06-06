const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const style = fs.readFileSync(path.join(root, "style.css"), "utf8");
const lightTokens = fs.readFileSync(path.join(root, "themes", "light", "tokens.css"), "utf8");
const designSystem = fs.readFileSync(path.join(root, "themes", "base", "design-system-v2.css"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "--bg-app:#f2f5f5",
  "--surface-primary:#fafcfc",
  "--accent-primary:#4f7f83",
  "--accent-soft:#e5eff0",
  "--shadow-soft:0 4px 14px rgba(31,51,53,.07)"
].forEach((token) => assert(lightTokens.includes(token), `Token claro ausente: ${token}`));

assert(
  !/body\.theme-light[^,{]*\.(?:store-|storefront-)/.test(style),
  "Tema do ERP ainda controla seletor da loja."
);
assert(
  !/body:not\(\.theme-light\)[^,{]*\.(?:store-|storefront-)/.test(style),
  "Fallback escuro do ERP ainda controla seletor da loja."
);

const checkpoint = style.slice(style.indexOf("/* Checkpoint tema claro 2026-06-06"));
assert(checkpoint.length > 1000, "Checkpoint final do tema claro nao encontrado.");
assert(checkpoint.includes("background-image:none !important"), "Protecao contra gradientes claros ausente.");
assert(checkpoint.includes("@media (prefers-reduced-motion:reduce)"), "Reducao de movimento ausente.");

const lightPlanBlock = designSystem.slice(
  designSystem.indexOf('.erp-theme-v2[data-erp-theme="light"] .s3d-plans-v2'),
  designSystem.indexOf('.erp-theme-v2[data-erp-theme="dark"]:has(.s3d-plans-v2)')
);
assert(!/linear-gradient|radial-gradient|conic-gradient/.test(lightPlanBlock), "Planos claros ainda usam gradiente.");

console.log("Light theme no-gradient: tokens suaves, planos solidos e loja isolada verificados.");
