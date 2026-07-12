const fs = require("fs");

const css = fs.readFileSync("style.css", "utf8");
const app = fs.readFileSync("app.js", "utf8");

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

if (!css.includes(".dashboard-home-header .dashboard-search.search-compact.is-expanded")) {
  throw new Error("Busca compacta do dashboard mobile nao possui regra expandida.");
}

if (!css.includes(".search-compact.is-expanded") || !css.includes(".search-compact:focus-within")) {
  throw new Error("Busca compacta de relatorios nao possui regra expandida.");
}

if (!app.includes("function ativarBuscaCompacta") || !app.includes("function encontrarBuscaCompactaPreferencial")) {
  throw new Error("Helpers de foco/expansao da busca compacta nao foram encontrados.");
}

if (!app.includes("reports-search-compact") || !app.includes("aria-label=\"Buscar relatórios\"")) {
  throw new Error("Relatorios deve renderizar campo de busca compacto, nao apenas icone.");
}

console.log("UI overflow: protecoes de largura, scroll e grids responsivos verificadas.");
