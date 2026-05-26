const fs = require("fs");

const css = fs.readFileSync("style.css", "utf8");

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

console.log("Mobile visual stability: viewport, safe-area, touch e menu mobile verificados.");
