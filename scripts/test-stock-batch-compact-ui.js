const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

[
  "function abrirCadastroItemEstoque()",
  "function renderizarFabEstoqueGlobal()",
  "function configurarFechamentoMenusEstoque()",
  "function alternarListaCompletaEstoque()",
  "const limiteLista = 6",
  'class="stock-item-menu"',
  'data-action="stock-edit"',
  'data-action="stock-remove"',
  'class="stock-list-toggle"',
  "function abrirCadastroLoteEstoque",
  "function salvarLoteEstoque",
  "updateBatches(indice, batches = []",
  "function calcularPreviaConsumoPorRolo",
  "saldoA - saldoB",
  "STOCK_ROLL_CONSUMPTION_PREVIEW_ENABLED = RUNTIME_FEATURES.stockRollsEnabled !== false",
  "STOCK_ROLL_AUTO_CONSUMPTION_ENABLED = RUNTIME_FEATURES.stockRollAutoConsumptionEnabled === true",
  "INVENTORY_BATCH_AUTO_CONSUMPTION_DISABLED",
  "A baixa por rolo de",
  'isBatchControlled: podeUsarControleRolosEstoque() && document.getElementById("matBatchControlled")?.checked === true'
].forEach((marker) => assert.ok(app.includes(marker), `Contrato de estoque ausente: ${marker}`));

[
  ".stock-summary-grid",
  ".stock-item-menu-popover",
  ".stock-list-toggle",
  ".stock-add-fab",
  ".stock-batch-section",
  "body.mobile-mode .smart-stock-row"
].forEach((marker) => assert.ok(css.includes(marker), `Contrato visual de estoque ausente: ${marker}`));

const renderStart = app.indexOf("function renderEstoque()");
const renderEnd = app.indexOf("function renderListaPedidos()", renderStart);
const stockRender = app.slice(renderStart, renderEnd);

assert.ok(renderStart >= 0 && renderEnd > renderStart, "Render do estoque não localizado.");
assert.ok(!stockRender.includes("Cadastro rápido"), "A tela principal não deve exibir cadastro rápido.");
assert.ok(!stockRender.includes("Configuração"), "A tela principal não deve exibir mensagens de configuração.");
assert.ok(stockRender.includes("materiaisFiltrados.slice(0, limiteLista)"), "A lista inicial deve ser compacta.");
assert.ok(stockRender.includes("Ver todos os ${materiaisFiltrados.length} itens"), "A seta deve expandir a lista completa.");
assert.ok(!stockRender.includes('class="stock-add-fab"'), "O FAB não deve ficar dentro da área rolável do estoque.");

console.log("Estoque compacto, rolos/lotes e fronteira de baixa por pedido validados.");
