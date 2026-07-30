const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles/ui-v3/screens/operational.css"), "utf8");
const endpointSource = fs.readFileSync(path.join(root, "api/promocoes-3d.js"), "utf8");
const endpoint = require(path.join(root, "api/promocoes-3d.js"));
const cronMigration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260730161704_promotions_3d_refresh_every_5_minutes.sql"),
  "utf8"
);
const refreshFunction = fs.readFileSync(
  path.join(root, "supabase/functions/promotions-refresh/index.ts"),
  "utf8"
);

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
  "PROMOTIONS_3D_REFRESH_MS = 5 * 60 * 1000",
  "PROMOTIONS_3D_VISIBLE_LIMIT = 60",
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
  "min-height:420px",
  "min-height:266px",
  ".promotion-filter-button.active",
  "@media(max-width:640px)"
].forEach((marker) => assert(css.includes(marker), `Promoções 3D sem estilo: ${marker}`));

assert(!app.includes('localStorage.setItem(PROMOTIONS_3D_ALERTS_KEY, "true");\n  carregarPromocoes3d'), "Avisos não podem ser ligados automaticamente.");
assert(!app.includes('if (tela !== "promocoes" && promotions3dRefreshTimer)'), "O monitor não pode parar ao sair da guia Promoções.");
assert.equal(endpoint.classifyProduct({ title: "Filamento PLA 1 kg" }), "filamentos");
assert.equal(endpoint.classifyProduct({ title: "Resina UV 1 kg" }), "resinas");
assert.equal(endpoint.classifyProduct({ title: "Impressora 3D Kobra" }), "impressoras");
assert.equal(endpoint.classifyProduct({ title: "Impressora 3D com kit de fechamento" }), "impressoras");
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
assert.equal(endpoint.getStructuredOffer({
  "@type": "Product",
  name: "Filamento PLA Premium 1 kg",
  url: "https://loja.teste/produto/pla-premium",
  offers: { price: "79.90", availability: "https://schema.org/InStock" }
}, { name: "Loja teste", host: "loja.teste", baseUrl: "https://loja.teste" }).currentPrice, 79.9);
assert(app.includes("const queues = new Map();"), "A lista recente precisa distribuir ofertas entre as lojas disponíveis.");
assert(app.includes("diverse.push(queue.shift())"), "A lista recente não pode ser monopolizada por uma única loja.");
assert.match(cronMigration, /create extension if not exists pg_net/i, "O bot precisa habilitar pg_net.");
assert.match(cronMigration, /create extension if not exists pg_cron/i, "O bot precisa habilitar pg_cron.");
assert.match(cronMigration, /simplifica-promotions-refresh-5m/i, "O bot precisa ter um job estável e substituível.");
assert.match(cronMigration, /'\*\/5 \* \* \* \*'/, "O bot precisa executar a cada 5 minutos.");
assert.match(cronMigration, /https:\/\/qsufnnivlgdidmjuaprb\.supabase\.co\/functions\/v1\/promotions-refresh/, "O Cron precisa chamar a função isolada do bot.");
assert.match(cronMigration, /promotion_offer_state/, "O bot precisa persistir o estado de preço por oferta.");
assert.match(cronMigration, /promotion_bot_state/, "O bot precisa persistir seu estado de execução.");
assert.match(refreshFunction, /MINIMUM_REFRESH_MS = 4 \* 60 \* 1000/, "Chamadas repetidas precisam ser limitadas.");
assert.match(refreshFunction, /unchangedScans >= 4/, "A oferta precisa ficar estável após quatro preços iguais.");
assert.match(refreshFunction, /samePrice \?/, "Ofertas sem alteração não podem voltar ao fluxo de mudança.");
assert.match(refreshFunction, /https:\/\/erpne3d\.vercel\.app\/api\/promocoes-3d/, "A função precisa consultar o agregador do Simplifica.");
assert(app.includes("const PROMOTIONS_3D_VISIBLE_LIMIT = 60;"), "A tela precisa permitir até 60 ofertas.");
assert(endpointSource.includes("OFFICIAL_STORES.map(loadStoreOffers)"), "Cada loja precisa usar uma fila própria para evitar rajadas.");

console.log("Promoções 3D: busca automática, Cron de 5 minutos, disponibilidade e cartões fixos verificados.");
