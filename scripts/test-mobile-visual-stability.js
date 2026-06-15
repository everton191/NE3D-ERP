const fs = require("fs");

const css = fs.readFileSync("style.css", "utf8");
const app = fs.readFileSync("app.js", "utf8");

const checks = [
  "100dvh",
  "100svh",
  "env(safe-area-inset-bottom)",
  "-webkit-overflow-scrolling:touch",
  "touch-action:pan-y",
  "touch-action:auto",
  ".store-mobile-admin-actions",
  ".store-public-menu-toggle",
  ".store-public-header.mobile-open"
];

const missing = checks.filter((needle) => !css.includes(needle));
if (missing.length) {
  throw new Error(`Estabilidade visual mobile incompleta: ${missing.join(", ")}`);
}

if (/protegendoToque\s*=\s*toqueNaBorda/.test(app) || /protegendoToque\s*=.*isAndroidNativeApp/.test(app)) {
  throw new Error("Protecao de gestos nao pode bloquear o gesto de voltar nas bordas do Android.");
}
if (!app.includes("protegendoToque = !toqueNaBorda")) {
  throw new Error("Gesto lateral Android deve permanecer livre nas bordas.");
}

console.log("Mobile visual stability: viewport, safe-area, touch e menu mobile verificados.");
