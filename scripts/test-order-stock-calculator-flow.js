const fs = require("fs");
const assert = require("assert");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const ordersRenderer = fs.readFileSync("src/features/orders/orders-renderer.js", "utf8");
const ordersHandlers = fs.readFileSync("src/features/orders/orders-handlers.js", "utf8");
const orderFlowSources = app + ordersRenderer + ordersHandlers;

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
  "Materiais e itens do estoque",
  "function abrirPopupMaterialPedido",
  "pedidoMaterialOpcoes",
  "data-material-cancel>Voltar",
  "materiais.length >= 4",
  "function editarQuantidadeMaterialItem",
  "function adicionarMaterialProduto",
  "getMateriaisItem(item).forEach((material)",
  "consumo.set(material.materialId, (consumo.get(material.materialId) || 0) + quantidade)",
  "SimplificaOrdersCommandService.applyOrderStock",
  "STOCK_ITEM_TYPES",
  "STOCK_CONTROL_UNITS",
  "function statusPedidoConsomeEstoque",
  "pedidoEstoqueFoiBaixado",
  "Estoque insuficiente para"
].forEach((marker) => assert.ok(orderFlowSources.includes(marker), `Fluxo calculadora/pedido/estoque ausente: ${marker}`));

assert.ok(
  app.includes('renderMaterialOptions(materialSelecionado, { emptyLabel: "Material não selecionado", includeAdd: false })'),
  "Calculadora não deve oferecer cadastro de material do estoque."
);
assert.match(app, /function statusPedidoConsomeEstoque[\s\S]{0,140}SimplificaOrdersCommandService\.statusConsumesStock/, "Status de consumo deve delegar ao comando canônico.");
assert.match(app, /function diffConsumoPedido[\s\S]{0,260}SimplificaOrdersCommandService\.diffStockConsumption/, "Diferença de consumo deve delegar ao comando canônico.");
assert.ok(css.includes(".calc-batch-toggle"), "Check de impressão em lote deve seguir o design system.");
assert.ok(css.includes(".order-stock-materials-title"), "Seção de materiais do pedido deve possuir contrato visual.");
assert.ok(
  app.includes('{ tela: "calculadora", icone: "calculadora", texto: "Calculadora 3D" }'),
  "Menu operacional deve abrir a calculadora de uso com nome inequívoco."
);
assert.ok(
  app.includes('{ tela: "preferencias", icone: "preferencias", texto: "Configurar calculadora" }'),
  "Parâmetros da calculadora não devem usar o mesmo nome da calculadora de uso."
);
assert.match(
  app,
  /function fecharDetalhesPedido\(\) \{[\s\S]*?pedidoVisualizandoId = null;[\s\S]*?window\.__pedidoDetalheFechado = true;[\s\S]*?renderizarPreservandoScroll\(\);/,
  "Fechar detalhes deve ocultar o painel selecionado antes de renderizar a lista."
);
assert.match(
  ordersRenderer,
  /const selecionado = context\.isDetailClosed\(\) \? null : \(pedidoSelecionado \|\| null\);/,
  "A versão web não deve reabrir automaticamente o pedido logo após fechar os detalhes."
);

console.log("Calculadora, pedido e estoque: lote, minutos, materiais e baixa por status validados.");
