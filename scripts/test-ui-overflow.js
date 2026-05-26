const fs = require("fs");

const css = fs.readFileSync("style.css", "utf8");

const checks = [
  "overflow-x:hidden",
  "overflow-x:clip",
  "max-width:100%",
  "max-width:100vw",
  "minmax(0, 1fr)",
  "repeat(auto-fit, minmax",
  "touch-action:auto",
  "overscroll-behavior-y:auto"
];

const missing = checks.filter((needle) => !css.includes(needle));
if (missing.length) {
  throw new Error(`Protecoes contra overflow/responsividade ausentes: ${missing.join(", ")}`);
}

if (!css.includes("@media (max-width: 820px)") || !css.includes("@media (max-width: 640px)")) {
  throw new Error("Breakpoints mobile principais nao foram encontrados.");
}

console.log("UI overflow: protecoes de largura, scroll e grids responsivos verificadas.");
