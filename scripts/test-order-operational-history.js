const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("styles/ui-v3/screens/operational.css", "utf8");
const operationalHistorySource = fs.readFileSync("src/features/orders/orders-operational-history.js", "utf8");
const orderHandlersSource = fs.readFileSync("src/features/orders/orders-handlers.js", "utf8");
const orderRendererSource = fs.readFileSync("src/features/orders/orders-renderer.js", "utf8");
const orderControllerSource = fs.readFileSync("src/features/orders/orders-controller.js", "utf8");
const orderHistorySources = `${app}\n${operationalHistorySource}\n${orderHandlersSource}\n${orderRendererSource}\n${orderControllerSource}`;
const historyProjection = require("../src/features/orders/orders-operational-history.js");

[
  "SimplificaOrdersOperationalHistory.getOrderOperationalEvents",
  "function renderHistoricoOperacionalPedido",
  "function renderRentabilidadeOperacionalPedido",
  "movimentosCaixaPedido(pedido)",
  "productionEvents",
  "metadata.order_id",
  'deps.audit("pedido_status_alterado"',
  'event_type: editingOrder ? "order_updated" : "order_created"',
  'event_type: "order_cancelled"',
  "${renderHistoricoOperacionalPedido(pedido)}"
].forEach((marker) => {
  assert.ok(orderHistorySources.includes(marker), `Histórico operacional sem contrato: ${marker}`);
});

[
  ".order-operational-history",
  ".order-operational-history-list",
  ".order-operational-history-item",
  ".order-profitability-summary",
  ".order-event-estoque",
  ".order-event-producao",
  ".order-event-caixa"
].forEach((marker) => {
  assert.ok(css.includes(marker), `Histórico operacional sem estilo: ${marker}`);
});

assert.ok(
  app.indexOf("function getEventosOperacionaisPedido") < app.indexOf("function renderDetalhePedido"),
  "Bridge da agregação do histórico deve existir antes do detalhe do pedido."
);

assert.ok(
  operationalHistorySource.includes('["pedido_edicao_solicitada", "pedido_cancelamento_solicitado", "pedido_excluido"].includes(record.acao)'),
  "Histórico operacional não deve exibir autorizações ou etapas técnicas como eventos finais."
);
assert.ok(
  operationalHistorySource.includes('metadata.event_type === "order_cancelled" && hasCancellationAudit'),
  "Cancelamento não deve aparecer duplicado entre auditoria e histórico."
);

const projectedEvents = historyProjection.getOrderOperationalEvents({ id: "p1", cliente: "Ana", total: 30, created_at: "2026-09-21T10:00:00Z" }, {
  auditLogs: [{ id: "a1", acao: "pedido_status_alterado", data: "2026-09-21T11:00:00Z", detalhes: { orderId: "p1", statusAnterior: "aberto", statusNovo: "producao" } }],
  history: [{ id: "h1", acao: "Baixa", detalhes: "PLA", data: "2026-09-21T12:00:00Z", metadata: { order_id: "p1", area: "stock" } }],
  productionJobs: [{ id: "j1", orderId: "p1", status: "ready", itemName: "Peça", created_at: "2026-09-21T13:00:00Z" }],
  productionEvents: [], customerForOrder: (order) => order.cliente, formatMoney: (value) => `R$ ${value}`,
  orderTotal: (order) => order.total, orderStatusLabel: (value) => value, productionStatusLabel: (value) => value,
  orderCashMovements: () => [{ id: "c1", tipo: "entrada", valor: 30, data: "2026-09-21T14:00:00Z" }], cashDescription: () => "PIX"
});
assert.equal(projectedEvents.length, 5, "Projeção deve reunir Pedido, Estoque, Produção e Caixa sem gravar dados.");
assert.equal(projectedEvents[0].tipo, "caixa", "Eventos devem manter a ordenação descendente por data.");
assert.equal(
  (orderHistorySources.match(/(?:registrarAuditoriaPedido|deps\.audit)\("pedido_cancelado"/g) || []).length,
  1,
  "Cancelamento deve gerar uma única auditoria canônica."
);
assert.equal(
  (orderHistorySources.match(/(?:registrarAuditoriaPedido|deps\.audit)\("pedido_excluido"/g) || []).length,
  0,
  "Cancelamento lógico não deve duplicar a auditoria como exclusão."
);
assert.ok(
  orderHistorySources.includes("Pedido cancelado é um registro final e não pode mudar de status."),
  "Pedido cancelado deve permanecer em estado terminal."
);
assert.ok(
  orderHistorySources.includes("Pedido cancelado é somente leitura e não pode ser editado."),
  "Pedido cancelado deve permanecer somente leitura."
);

const moreOptionsFlow = app.slice(
  app.indexOf("async function abrirMaisOpcoesPedido"),
  app.indexOf("function duplicarPedidoSalvo")
);
assert.ok(
  moreOptionsFlow.includes('label: cancelado ? "Resumo financeiro" : "Financeiro e cobrança"'),
  "Financeiro deve permanecer no menu Mais, em consulta quando o pedido estiver cancelado."
);
["Ver detalhes", "Enviar WhatsApp", "Gerar PDF", "Imprimir"].forEach((redundantAction) => {
  assert.ok(
    !moreOptionsFlow.includes(`label: "${redundantAction}"`),
    `Menu Mais não deve repetir a ação ${redundantAction}.`
  );
});
assert.ok(
  orderHistorySources.includes('pedidoSelecionado ? "ui3-orders-has-detail" : ""'),
  "Pedidos PWA deve abrir o detalhe mobile somente após seleção explícita."
);
assert.ok(
  !orderHistorySources.includes('<div class="order-cancel-info">'),
  "Detalhe não deve repetir o motivo do cancelamento depois da barra de ações."
);
[
  ".orders-pwa-page.ui3-orders-has-detail .orders-pwa-list",
  ".orders-pwa-page.ui3-orders-has-detail .orders-pwa-detail",
  "grid-template-columns: repeat(4, minmax(0, 1fr)) !important"
].forEach((marker) => {
  assert.ok(css.includes(marker), `Ajuste responsivo de Pedidos ausente: ${marker}`);
});

console.log("Histórico operacional do pedido: pedidos, estoque, produção e caixa integrados.");
