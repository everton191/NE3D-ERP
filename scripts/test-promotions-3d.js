const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles/ui-v3/screens/operational.css"), "utf8");
const endpoint = require(path.join(root, "api/promocoes-3d.js"));

[
  'promocoes: Object.freeze({ label: "Promoções 3D"',
  '{ tela: "promocoes", icone: "cupom", texto: "Promoções 3D" }',
  'case "promocoes":',
  "function renderPromocoes3d()",
  "function carregarPromocoes3d(",
  "function pesquisarPromocoes3d(",
  "function filtrarPromocoes3d(",
  "function alternarAvisosPromocoes3d(",
  "PROMOTIONS_3D_REFRESH_MS = 10 * 60 * 1000",
  'localStorage.getItem(PROMOTIONS_3D_ALERTS_KEY) === "true"',
  "Melhores ofertas",
  "Somente lojas oficiais."
].forEach((marker) => assert(app.includes(marker), `Promoções 3D sem marcador: ${marker}`));

[
  ".promotions-3d-page",
  ".promotions-3d-grid",
  ".promotion-3d-card",
  ".promotion-filter-button.active",
  "@media(max-width:640px)"
].forEach((marker) => assert(css.includes(marker), `Promoções 3D sem estilo: ${marker}`));

assert(!app.includes('localStorage.setItem(PROMOTIONS_3D_ALERTS_KEY, "true");\n  carregarPromocoes3d'), "Avisos não podem ser ligados automaticamente.");
assert.equal(endpoint.classifyProduct({ title: "Filamento PLA 1 kg" }), "filamentos");
assert.equal(endpoint.classifyProduct({ title: "Resina UV 1 kg" }), "resinas");
assert.equal(endpoint.classifyProduct({ title: "Impressora 3D Kobra" }), "impressoras");
assert.equal(endpoint.classifyProduct({ title: "Bico de reposição" }), "materiais");

console.log("Promoções 3D: guia, pesquisa, filtros, avisos opcionais e layout responsivo verificados.");
