const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const rollConsumption = fs.readFileSync(path.join(root, "src", "features", "inventory", "inventory-roll-consumption.js"), "utf8");
const batchCommands = fs.readFileSync(path.join(root, "src", "features", "inventory", "inventory-batch-commands.js"), "utf8");
const inventoryHandlers = fs.readFileSync(path.join(root, "src", "features", "inventory", "inventory-handlers.js"), "utf8");
const inventoryScreen = fs.readFileSync(path.join(root, "src", "features", "inventory", "inventory-screen-renderer.js"), "utf8");
const stockHaystack = app + "\n" + batchCommands + "\n" + inventoryHandlers + "\n" + inventoryScreen;

[
  "function abrirCadastroItemEstoque()",
  "function renderizarFabEstoqueGlobal()",
  "function configurarFechamentoMenusEstoque()",
  "function alternarListaCompletaEstoque()",
  'class="ui-context-menu stock-item-menu"',
  'data-action="stock-edit"',
  'data-action="stock-remove"',
  'class="stock-list-toggle"',
  "function abrirCadastroLoteEstoque",
  "function salvarLoteEstoque",
  "updateBatches(indice, batches = []",
  "function calcularPreviaConsumoPorRolo",
  "STOCK_ROLL_CONSUMPTION_PREVIEW_ENABLED = RUNTIME_FEATURES.stockRollsEnabled !== false",
  "STOCK_ROLL_AUTO_CONSUMPTION_ENABLED = RUNTIME_FEATURES.stockRollAutoConsumptionEnabled === true",
  "INVENTORY_BATCH_AUTO_CONSUMPTION_DISABLED",
  "A baixa por rolo de"
].forEach((marker) => assert.ok(stockHaystack.includes(marker), `Contrato de estoque ausente: ${marker}`));

assert.ok(
  inventoryHandlers.includes('isBatchControlled: deps.podeUsarControleRolosEstoque() && deps.documentRef.getElementById("matBatchControlled")?.checked === true'),
  "Contrato de controle de lote no addMaterial ausente no módulo."
);
assert.ok(inventoryScreen.includes("const limiteLista = 6"), "Limite compacto da lista deve residir no renderer de estoque.");

[
  "async function saveBatch",
  "deps.inventory.updateBatches",
  "INVENTORY_BATCH_CODE_DUPLICATE"
].forEach((marker) => assert.ok(batchCommands.includes(marker), `Contrato de lote ausente no módulo: ${marker}`));

[
  "function calcularPreviaConsumoPorRolo",
  "saldoA - saldoB"
].forEach((marker) => assert.ok(rollConsumption.includes(marker), `Regra canônica de consumo por rolo ausente: ${marker}`));
assert.ok(app.includes("SimplificaInventoryRollConsumption.calcularPreviaConsumoPorRolo"), "Bridge de consumo por rolo ausente.");

[
  ".stock-summary-grid",
  ".stock-item-menu-popover",
  ".stock-list-toggle",
  ".stock-add-fab",
  ".stock-batch-section",
  "body.mobile-mode .smart-stock-row"
].forEach((marker) => assert.ok(css.includes(marker), `Contrato visual de estoque ausente: ${marker}`));

const renderStart = inventoryScreen.indexOf("function renderEstoque(");
const renderEnd = inventoryScreen.indexOf("function renderizarFabEstoqueGlobal(", renderStart);
const stockRender = inventoryScreen.slice(renderStart, renderEnd);

assert.ok(renderStart >= 0 && renderEnd > renderStart, "Render do estoque não localizado.");
assert.ok(!stockRender.includes("Cadastro rápido"), "A tela principal não deve exibir cadastro rápido.");
assert.ok(!stockRender.includes("Configuração"), "A tela principal não deve exibir mensagens de configuração.");
assert.ok(stockRender.includes("materiaisFiltrados.slice(0, limiteLista)"), "A lista inicial deve ser compacta.");
assert.ok(stockRender.includes("Ver todos os ${materiaisFiltrados.length} itens"), "A seta deve expandir a lista completa.");
assert.ok(!stockRender.includes('class="stock-add-fab"'), "O FAB não deve ficar dentro da área rolável do estoque.");
assert.ok(app.includes("function renderEstoque()"), "Bridge de renderEstoque deve permanecer no app.js.");

console.log("Estoque compacto, rolos/lotes e fronteira de baixa por pedido validados.");
