const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

const requiredTokens = [
  "--bg-primary",
  "--bg-secondary",
  "--surface-primary",
  "--surface-secondary",
  "--sidebar-bg",
  "--header-bg",
  "--card-bg",
  "--card-hover",
  "--border-soft",
  "--border-strong",
  "--text-primary",
  "--text-secondary",
  "--text-muted",
  "--accent-primary",
  "--accent-secondary",
  "--success",
  "--warning",
  "--danger"
];

const missing = requiredTokens.filter((token) => !app.includes(token) && !css.includes(token));
if (missing.length) {
  throw new Error(`Tokens visuais obrigatorios ausentes: ${missing.join(", ")}`);
}

if (!app.includes("THEME_LIGHT_PALETTES") || !app.includes("THEME_DARK_PALETTES")) {
  throw new Error("Paletas controladas light/dark nao foram definidas.");
}

if (!app.includes("normalizarCorTemaControlado")) {
  throw new Error("Validacao de cor controlada nao encontrada.");
}

if (/--color-background", usarClaro \? "#fff/i.test(app) || /--color-background", usarClaro \? "#ffffff/i.test(app)) {
  throw new Error("Tema claro nao deve usar branco puro como fundo principal.");
}

if (/--color-background", usarClaro \? "[^"]+" : "#000/i.test(app)) {
  throw new Error("Tema escuro nao deve usar preto puro como fundo principal.");
}

if (!css.includes('body:not(.theme-light) :where(.superadmin-only-main,.superadmin-mobile-only) .superadmin-platform-profile-shell')) {
  throw new Error("Perfil de empresa do Superadmin nao possui autoridade de contraste escuro.");
}

console.log("UI contrast: tokens, paletas controladas e fundos premium verificados.");
