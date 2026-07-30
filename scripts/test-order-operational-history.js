const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("styles/ui-v3/screens/operational.css", "utf8");

[
  "function getEventosOperacionaisPedido",
  "function renderHistoricoOperacionalPedido",
  "function renderRentabilidadeOperacionalPedido",
  "movimentosCaixaPedido(pedido)",
  "productionEvents",
  "metadata.order_id",
  'registrarAuditoriaPedido("pedido_status_alterado"',
  'event_type: pedidoEditando ? "order_updated" : "order_created"',
  'event_type: "order_cancelled"',
  "${renderHistoricoOperacionalPedido(pedido)}"
].forEach((marker) => {
  assert.ok(app.includes(marker), `Histórico operacional sem contrato: ${marker}`);
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
  "Agregação do histórico deve existir antes do detalhe do pedido."
);

assert.ok(
  app.includes('["pedido_edicao_solicitada", "pedido_cancelamento_solicitado", "pedido_excluido"].includes(registro.acao)'),
  "Histórico operacional não deve exibir autorizações ou etapas técnicas como eventos finais."
);
assert.ok(
  app.includes('metadata.event_type === "order_cancelled" && temAuditoriaCancelamento'),
  "Cancelamento não deve aparecer duplicado entre auditoria e histórico."
);
assert.equal(
  (app.match(/registrarAuditoriaPedido\("pedido_cancelado"/g) || []).length,
  1,
  "Cancelamento deve gerar uma única auditoria canônica."
);
assert.equal(
  (app.match(/registrarAuditoriaPedido\("pedido_excluido"/g) || []).length,
  0,
  "Cancelamento lógico não deve duplicar a auditoria como exclusão."
);
assert.ok(
  app.includes("Pedido cancelado é um registro final e não pode mudar de status."),
  "Pedido cancelado deve permanecer em estado terminal."
);
assert.ok(
  app.includes("Pedido cancelado é somente leitura e não pode ser editado."),
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
  app.includes('pedidoSelecionado ? "ui3-orders-has-detail" : ""'),
  "Pedidos PWA deve abrir o detalhe mobile somente após seleção explícita."
);
assert.ok(
  !app.includes('<div class="order-cancel-info">'),
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
