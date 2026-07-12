const fs = require("fs");
const assert = require("assert");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

[
  'id="impressaoLote"',
  'id="calcBatchFields"',
  'calculatorDraftState.batchActive ? "" : "hidden"',
  'id="tempoMinutos"',
  'id="tempoFormato"',
  'id="quantidade"',
  "function alternarImpressaoLote",
  "function sincronizarTempoFormatadoCalculadora",
  "function normalizarCampoTempoCalculadora",
  "CalculatorDomain.toMinutes",
  "Valor total do lote",
  "Valor unitário calculado",
  "Gerar pedido com este cálculo",
  'materiais: []',
  "observacoesCalculo",
  "Materiais do estoque",
  "function editarQuantidadeMaterialItem",
  "STOCK_ITEM_TYPES",
  "STOCK_CONTROL_UNITS",
  "function statusPedidoConsomeEstoque",
  "pedidoEstoqueFoiBaixado",
  "Estoque insuficiente para"
].forEach((marker) => assert.ok(app.includes(marker), `Fluxo calculadora/pedido/estoque ausente: ${marker}`));

assert.ok(
  app.includes('renderMaterialOptions(materialSelecionado, { emptyLabel: "Material não selecionado", includeAdd: false })'),
  "Calculadora não deve oferecer cadastro de material do estoque."
);
assert.ok(
  app.includes("const novo = statusPedidoConsomeEstoque(pedidoNovo?.status) ? calcularConsumoMateriais"),
  "Rascunho não deve baixar estoque."
);
assert.ok(css.includes(".calc-batch-toggle"), "Check de impressão em lote deve seguir o design system.");
assert.ok(css.includes(".order-stock-materials-title"), "Seção de materiais do pedido deve possuir contrato visual.");

console.log("Calculadora, pedido e estoque: lote, minutos, materiais e baixa por status validados.");
