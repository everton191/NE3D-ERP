const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

const required = [
  "body.theme-light",
  "body:not(.theme-light)",
  "--background-primary",
  "--background-secondary",
  "--surface-primary",
  "--surface-hover",
  "--border-soft",
  "--border-strong",
  "--text-primary",
  "--text-secondary",
  "--accent-primary",
  "getThemePalettes",
  "getStorefrontControlledTheme",
  "theme-palette-chip"
];

const missing = required.filter((needle) => !app.includes(needle) && !css.includes(needle));
if (missing.length) {
  throw new Error(`Consistencia de tema incompleta: ${missing.join(", ")}`);
}

if (app.includes('type="color" value="${escaparAttr(corAtual)}"') || app.includes('name="storePrimary" type="color"')) {
  throw new Error("Color picker livre ainda esta exposto em areas principais de tema.");
}

if (!css.includes("body.theme-light .superadmin-panel :where(") || !css.includes(".superadmin-row .row-actions")) {
  throw new Error("Super Admin claro deve manter superfícies legíveis e ações responsivas.");
}

if ((app.match(/timeoutMs: 12000/g) || []).length < 3) {
  throw new Error("Salvamento remoto de personalização deve possuir timeout de segurança.");
}

console.log("UI theme consistency: tema claro/escuro e paletas guiadas verificados.");
