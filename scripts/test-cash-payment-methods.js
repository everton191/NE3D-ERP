"use strict";

const assert = require("node:assert/strict");
const cash = require("../src/features/cash/cash-payment-methods.js");
const methods = [{ id: "dinheiro", type: "cash" }, { id: "pix", type: "instant" }];
const helpers = { getMetodosPagamentoCaixa: () => methods };

assert.equal(cash.normalizarMetodoPagamentoCaixa("PIX", helpers).id, "pix");
assert.equal(cash.normalizarMetodoPagamentoCaixa("unknown", helpers).id, "dinheiro");
assert.equal(cash.getMetodoPagamentoMovimento({ paymentMethodType: "instant" }, helpers).id, "pix");
assert.deepEqual(cash.normalizarMetodoPagamentoCaixa("", { getMetodosPagamentoCaixa: () => [] }), { id: "dinheiro", name: "Dinheiro", type: "cash" });
const movements = [{ tipo: "entrada", valor: 20, paymentMethod: "pix", data: "2026-01-01" }, { tipo: "saida", valor: 5, data: "2026-01-02" }, { tipo: "entrada", valor: 9, cancelled: true }];
assert.deepEqual(cash.calcularTotaisCaixa(movements, { isCancelled: (item) => item.cancelled === true }), { entradas: 20, saidas: 5, saldo: 15, cancelados: 1 });
assert.equal(cash.calcularSaldo(movements, { isCancelled: (item) => item.cancelled === true }), 15);
assert.deepEqual(cash.calcularResumoSessaoCaixa({ openingBalance: 10 }, movements, { isCancelled: (item) => item.cancelled === true, getPaymentMethod: (item) => ({ id: item.paymentMethod || "dinheiro" }), getMovementDate: (item) => item.data || null }), { entradas: 20, saidas: 5, saldo: 15, cancelados: 1, porForma: { pix: 20 }, ultimaMovimentacao: "2026-01-02", expectedBalance: 25 });
const orderMovements = [{ pedidoId: "p1", tipo: "entrada", valor: 0.1 }, { order_id: "p1", tipo: "entrada", valor: 0.2 }, { pedido_id: "p1", tipo: "saida", valor: 0.05 }, { pedidoId: "p2", tipo: "entrada", valor: 99 }, { pedidoId: "p1", tipo: "entrada", valor: 4, cancelled: true }];
assert.deepEqual(cash.calcularResumoCaixaVinculadoAoPedido({ id: "p1" }, orderMovements, { isCancelled: (item) => item.cancelled === true }), { entradas: 0.3, saidas: 0.05, saldo: 0.25, quantidade: 3 });
assert.deepEqual(cash.calcularResumoCaixaVinculadoAoPedido({}, orderMovements), { entradas: 0, saidas: 0, saldo: 0, quantidade: 0 });
const financialCore = { isOrderSaleEligible: (order) => order.status !== "cancelado", mergeCashMovements: ({ legacyMovements, canonicalMovements }) => [...legacyMovements, ...canonicalMovements] };
const legacyOperation = cash.criarOperacaoFinanceiraLegadaDoPedido({ id: "p1", status: "aberto", criadoEm: "2026-01-01" }, { financialCore, totalOrder: () => 12 });
assert.equal(legacyOperation.payload_json.total_amount, 12);
const financialState = { operations: [{ operation_uuid: "op1", sale_id: "p1" }], movements: [{ id: "canonical" }], events: [{ operationUuid: "op1", orderId: "p1", syncStatus: "synced" }, { operationUuid: "op2", orderId: "p2", syncStatus: "pending_sync" }] };
const financialData = cash.obterDadosFinanceirosCanonicosComFallback({ financialCore, loadState: () => financialState, orders: [{ id: "p1" }, { id: "p2", status: "aberto" }], cashMovements: [{ id: "legacy-cash" }], totalOrder: () => 20, operationFromEvent: (event) => ({ operation_uuid: event.operationUuid, sale_id: event.orderId }), movementFromEvent: (event) => ({ id: `movement-${event.operationUuid}` }) });
assert.equal(financialData.operations.length, 2, "Evento novo deve gerar operação única e pedidos já vinculados não devem duplicar fallback.");
assert.deepEqual(financialData.movements.map((movement) => movement.id), ["legacy-cash", "canonical", "movement-op2"]);
const queuedStates = [], markedOrders = [], scheduled = [];
const queued = cash.enfileirarEventoFinanceiroDoPedido({ id: "p3" }, { value: 10 }, "create", { financialCore: { isUuid: (value) => value === "company-1", buildOrderFinancialEvent: () => ({ operationUuid: "op-3", eventType: "create" }) }, getCompanyId: () => "company-1", markOrder: (_, patch) => markedOrders.push(patch), persist: () => {}, now: () => "2026-09-21T00:00:00.000Z", loadState: () => ({ events: [{ operationUuid: "op-3", old: true }] }), saveState: (state) => queuedStates.push(state), scheduleSync: (delay) => scheduled.push(delay) });
assert.equal(queued.status, "QUEUED");
assert.equal(queuedStates[0].events.length, 1, "Repetição deve substituir evento da mesma operação na fila local.");
assert.equal(markedOrders[0].financial_operation_status, "pending_sync");
assert.deepEqual(scheduled, [80]);
const pending = cash.enfileirarEventoFinanceiroDoPedido({ id: "p4" }, null, "create", { financialCore: { isUuid: () => false }, getCompanyId: () => "invalid", markOrder: (_, patch) => markedOrders.push(patch), persist: () => {}, now: () => "", loadState: () => ({ events: [] }), saveState: () => {}, scheduleSync: () => {} });
assert.equal(pending.status, "PENDING");
const adapted = cash.adaptarMovimentoFinanceiroCanonicoParaCaixa({ id: "m1", type: "saida", amount: 12.5, description: "Sangria material", created_at: "2026-01-02T10:00:00.000Z", payment_method_id: "pix" }, methods);
assert.equal(adapted.id, "canonical:m1");
assert.equal(adapted.tipo, "saida");
assert.equal(adapted.valor, 12.5);
assert.equal(adapted.descricao, "Sangria material");
assert.equal(adapted.payment_method_type, "instant");
assert.equal(adapted.canonical_readonly, true);
const alreadyCash = { valor: 7, tipo: "entrada" };
assert.equal(cash.adaptarMovimentoFinanceiroCanonicoParaCaixa(alreadyCash, methods), alreadyCash, "Movimento já no formato Caixa não deve ser readaptado.");
const periodoMovs = [
  { tipo: "entrada", valor: 10, data: "2026-01-05" },
  { tipo: "saida", valor: 4, data: "2026-01-10" },
  { tipo: "entrada", valor: 3, data: "2026-01-15", cancelled: true },
  { tipo: "entrada", valor: 99, data: "2026-02-20" }
];
assert.deepEqual(
  cash.calcularTotaisCaixaPeriodo("2026-01-01", "2026-01-31", periodoMovs, {
    isCancelled: (item) => item.cancelled === true,
    getMovementDate: (item) => item.data,
    inRange: (data, start, end) => data >= start && data <= end
  }),
  { entradas: 10, saidas: 4, saldo: 6, cancelados: 1 },
  "Totais por período devem respeitar intervalo, cancelamento e tipo."
);
console.log("Cash payment methods: aliases, fallback, adaptação canônica, totais por período e dependências injetadas preservados.");
