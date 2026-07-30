const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles/ui-v3/screens/operational.css"), "utf8");
const endpoint = require(path.join(root, "api/promocoes-3d.js"));

[
  'promocoes: Object.freeze({ label: "Promoções 3D"',
  '{ tela: "promocoes", icone: "cupom", texto: "Promoções 3D", badge: novidadesPromocoes }',
  'case "promocoes":',
  "function renderPromocoes3d()",
  "function carregarPromocoes3d(",
  "function pesquisarPromocoes3d(",
  "function filtrarPromocoes3d(",
  "function alternarAvisosPromocoes3d(",
  "function deveDestacarOfertasRelampago3d()",
  "PROMOTIONS_3D_REFRESH_MS = 10 * 60 * 1000",
  "PROMOTIONS_3D_VISIBLE_LIMIT = 15",
  "PROMOTIONS_3D_MAX_WATCHES = 8",
  "PROMOTIONS_3D_LOCAL_HOST",
  "function iniciarMonitorPromocoes3d()",
  "function processarMonitorPromocoes3d(",
  "function salvarBuscaAtualPromocoes3d()",
  "function alternarAcompanhamentoProdutoPromocao3d(",
  "function marcarPromocoes3dComoVistas()",
  "function mostrarNotificacaoExternaPromocoes3d(",
  "data-promo-badge",
  "Monitor automático ativo",
  "Acompanhar esta busca",
  "Acompanhar este produto",
  "Mais recentes",
  "Busca automática ativa",
  'localStorage.getItem(PROMOTIONS_3D_ALERTS_KEY) === "true"',
  "Ofertas relâmpago",
  "Elas podem acabar rápido.",
  "Melhores ofertas",
  "Somente lojas oficiais."
].forEach((marker) => assert(app.includes(marker), `Promoções 3D sem marcador: ${marker}`));

[
  ".promotions-3d-page",
  ".promotions-3d-monitor",
  ".promotions-monitor-watches",
  ".promotion-nav-badge",
  ".promotion-watch-product",
  ".promotions-3d-flash",
  ".promotions-3d-flash-grid",
  ".promotions-3d-grid",
  ".promotion-3d-card",
  ".promotion-3d-card.is-flash",
  "height:402px",
  "height:238px",
  ".promotion-filter-button.active",
  "@media(max-width:640px)"
].forEach((marker) => assert(css.includes(marker), `Promoções 3D sem estilo: ${marker}`));

assert(!app.includes('localStorage.setItem(PROMOTIONS_3D_ALERTS_KEY, "true");\n  carregarPromocoes3d'), "Avisos não podem ser ligados automaticamente.");
assert(!app.includes('if (tela !== "promocoes" && promotions3dRefreshTimer)'), "O monitor não pode parar ao sair da guia Promoções.");
assert.equal(endpoint.classifyProduct({ title: "Filamento PLA 1 kg" }), "filamentos");
assert.equal(endpoint.classifyProduct({ title: "Resina UV 1 kg" }), "resinas");
assert.equal(endpoint.classifyProduct({ title: "Impressora 3D Kobra" }), "impressoras");
assert.equal(endpoint.classifyProduct({ title: "Bico de reposição" }), "materiais");
assert.equal(endpoint.getProductOffer({
  handle: "filamento-indisponivel",
  title: "Filamento PLA",
  variants: [{ available: false, price: "99.90" }]
}, { name: "Loja teste", host: "loja.teste", baseUrl: "https://loja.teste" }, "promocao"), null);
assert.equal(endpoint.getProductOffer({
  handle: "filamento-disponivel",
  title: "Filamento PLA",
  published_at: "2026-07-29T10:00:00-03:00",
  updated_at: "2026-07-30T10:00:00-03:00",
  variants: [{ available: true, price: "89.90", compare_at_price: "109.90" }]
}, { name: "Loja teste", host: "loja.teste", baseUrl: "https://loja.teste" }, "promocao").updatedAt, "2026-07-30T13:00:00.000Z");

console.log("Promoções 3D: busca automática, até 15 ofertas recentes, disponibilidade e cartões fixos verificados.");
