const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const service = fs.readFileSync("src/services/themeAuthorityV2.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'const ERP_THEME_KEY = "simplifica3d_erp_theme_preference"',
  'Object.freeze(["light", "system", "dark"])',
  'global.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light"',
  "function applyErpTheme",
  "data-erp-theme-preference",
  "simplifica-theme-system-change"
].forEach((marker) => assert(service.includes(marker), `Autoridade ERP ausente: ${marker}`));

[
  'const erpKey = "simplifica3d_erp_theme_preference"',
  'document.documentElement.setAttribute("data-erp-theme", erpTheme)',
  'document.documentElement.setAttribute("data-erp-theme-preference", erpPreference)',
  'class="app-shell erp-shell erp-theme-v2"'
].forEach((marker) => assert(index.includes(marker), `Bootstrap ERP V2 ausente: ${marker}`));

[
  "function normalizarPreferenciaTemaInterface",
  'if (normalized === "auto") return "system"',
  "window.SimplificaThemeAuthorityV2?.applyErpTheme?.(temaPreferido)",
  'document.body.classList.toggle("theme-dark", !usarClaro)',
  '<option value="system" ${normalizarPreferenciaTemaInterface(appConfig.theme) === "system" ? "selected" : ""}>Seguir sistema</option>'
].forEach((marker) => assert(app.includes(marker), `Integracao ERP V2 ausente: ${marker}`));

console.log("ERP theme V2: preferencia system, resolucao e bootstrap antecipado validados.");
