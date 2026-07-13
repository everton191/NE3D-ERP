const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");
const index = read("styles", "ui-v3", "index.css");
const legacy = read("style.css");

const modules = [
  "system-tokens.css",
  "app-shell.css",
  "legacy-bridge.css",
  "system-navigation.css",
  "system-controls.css",
  "system-content.css",
  "system-overlays.css",
  "system-screens.css",
  "screens/plans.css"
];

const missing = modules.filter((file) => !index.includes(file));
const forbiddenLegacy = [
  ".mobile-home,\n  .mobile-panel,\n  .mobile-panel-content",
  "body.mobile-mode .mobile-panel:has(> .mobile-panel-content) {\n    position:relative !important;"
].filter((snippet) => legacy.includes(snippet));

const html = read("index.html");
if (/design-system-v2|themeAuthorityV2|erp-theme-v2|storefront-theme-v2/.test(html)) forbiddenLegacy.push("index ainda carrega autoridade V2");
const runtimeSources = [html, read("app.js"), read("sw.js"), read("src", "services", "themeAuthorityV3.js")].join("\n");
if (/design-system-v2|themeAuthorityV2|SimplificaThemeAuthorityV2|erp-theme-v2|storefront-theme-v2/.test(runtimeSources)) forbiddenLegacy.push("runtime ainda referencia autoridade V2");
if (fs.existsSync(path.join(root, "themes", "base", "design-system-v2.css"))) forbiddenLegacy.push("folha V2 ainda existe");

for (const file of modules) {
  const target = path.join(root, "styles", "ui-v3", file);
  if (!fs.existsSync(target)) missing.push(`${file} ausente`);
}

if (missing.length || forbiddenLegacy.length) {
  console.error("Autoridade V3 incompleta:", { missing, forbiddenLegacy });
  process.exit(1);
}

console.log("Autoridade V3: módulos globais carregados e conflitos estruturais bloqueados.");
