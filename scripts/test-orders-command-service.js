"use strict";
const assert = require("node:assert/strict");
const commands = require("../src/features/orders/orders-command-service.js");
assert.equal(commands.statusConsumesStock("em_producao"), true);
assert.equal(commands.hasOrderStockConsumption({ itens: ["a"] }, { calculateConsumption: () => new Map([["m", 1]]) }), true);
assert.equal(commands.wasOrderStockDeducted({ status: "em_producao" }), true);
assert.equal(commands.receivedOrderValue({}, { financialSummary: () => ({ total: 10, entrada: 15 }) }), 10);
assert.equal(commands.isOrderCancelled({ status: "cancelado" }), true);
assert.deepEqual(commands.diffStockConsumption({ status: "aprovado", itens: ["a"] }, null, { calculateConsumption: () => new Map([["m", 2]]), wasDeducted: () => false }), [{ materialId: "m", quantidade: 2 }]);
const deps = { now: () => "2026-01-01T00:00:00.000Z", openCashSession: () => ({ id: "s" }), normalizePaymentMethod: () => ({ id: "pix", name: "Pix", type: "instant" }), createOperationMetadata: () => ({ operation_uuid: "x" }), customerName: () => "Ana", prepareOnlineRecord: (record) => record, createId: () => 7 };
assert.equal(commands.createCashReceipt({ id: 1 }, 0, "entrada", null, deps), null);
assert.equal(commands.createCashReceipt({ id: 1 }, 10, "quitacao", null, deps).descricao, "Quitação pedido #1 - Ana");
assert.equal(commands.createCashReversal({ id: 1 }, [{ tipo: "entrada", valor: 10 }], "2026-01-01T00:00:00.000Z", deps).tipo, "saida");
const effectsDeps = { calculateConsumption: () => new Map([["m", 2]]), wasDeducted: () => true, registeredCash: () => 10, receivedCash: () => 25, productionJobs: () => [{ id: "j", orderId: 1, status: "em_producao" }], orderMovements: () => [{ id: "c", valor: 10, tipo: "entrada" }], cashMovementCancelled: () => false };
assert.equal(commands.determineEditEffects({ id: 1, status: "aprovado", itens: [] }, { id: 1, status: "aprovado", itens: [] }, effectsDeps).cash[0].amount, 15);
assert.equal(commands.determineCancelEffects({ id: 1, status: "aprovado", itens: [] }, { returnStock: true }, effectsDeps).production.cancelJobs.length, 1);
class Executor { constructor(options) { this.options = options; } }
const transaction = commands.createTransactionExecutor({ Executor: { OrderCreateTransactionExecutor: Executor }, captureState: () => ({}), restoreState: () => {}, applyStock: () => true, commitOrder: () => {}, createCashReceipt: () => null, commitCashReceipt: () => {}, persist: () => {}, persistRollback: () => {}, isCommitted: () => false, afterCommit: () => {} });
assert.equal(typeof transaction.options.applyStock, "function");
let persisted = 0; let restored = 0; let committed = null;
commands.executeCancelPlan({ orderId: 1, reason: "teste", inventory: { restoreConsumption: [] }, production: { cancelJobs: [] } }, { captureState: () => ({}), restoreState: () => { restored += 1; }, loadOrder: () => ({ id: 1 }), now: () => "2026-01-01T00:00:00.000Z", restoreStock: () => true, orderMovements: () => [], createCashReversal: () => null, commitCashReversal: () => {}, cancelProductionJobs: () => {}, markCancelled: (order) => ({ ...order, status: "cancelado" }), commitCancelledOrder: (order) => { committed = order; }, afterCancel: () => {}, persist: () => { persisted += 1; }, scheduleSync: () => {} }).then((result) => { assert.equal(result.success, true); assert.equal(committed.status, "cancelado"); assert.equal(persisted, 1); assert.equal(restored, 0); console.log("Orders command service: estoque, recebimento, estorno e cancelamento preservados."); });
commands.executeEditPlan({ orderId: 1, operationId: "x", proposed: { id: 1 }, effects: { inventory: [], production: [] } }, { loadOrder: () => ({ id: 1 }), transactionExecutor: () => ({ execute: async () => ({ status: "COMMITTED", order: { id: 1 }, cashReceipt: null, warnings: [] }) }), registeredCash: () => 0, financialSummary: () => ({ total: 1 }), operationMetadata: () => ({}), scheduleSync: () => {} }).then((result) => assert.equal(result.success, true));
commands.finalizeOrder({ preparationInput: {}, disposableValidation: true, cashRegisteredBefore: 0 }, {
  preparationUseCase: () => ({ prepare: () => ({ record: { id: 1, client_request_id: "tx" }, financial: { total: 10 }, operationMetadata: {} }) }),
  reserveCredit: async () => ({ allowed: false }),
  compensateCredit: () => { throw new Error("não esperado"); },
  editUseCase: () => null,
  transactionExecutor: () => ({ execute: async () => ({ status: "COMMITTED", order: { id: 1 } }) })
}).then((result) => assert.equal(result.status, "COMMITTED"));
