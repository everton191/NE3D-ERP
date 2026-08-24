"use strict";
const assert = require("assert");
const { EditOrderUseCase, CancelOrderUseCase, ERROR } = require("../src/ai-3d/order-shared-usecases.js");

const base = { id: "o1", cliente: "João", status: "aberto", total: 100, itens: [{ nome: "Peça", qtd: 1, valor: 100 }], updated_at: "v1" };
function editHarness(overrides = {}) {
  let order = structuredClone(base); let commits = 0;
  const useCase = new EditOrderUseCase({
    loadOrder: () => order,
    hasPermission: (context) => context.allowed === true,
    isCancelled: (value) => value.status === "cancelado",
    versionOf: (value) => value.updated_at,
    validateProposed: (proposed) => proposed?.cliente && proposed?.itens?.length ? { ok: true } : { ok: false, code: ERROR.INVALID_INPUT, message: "inválido" },
    describeChanges: (proposed, current) => Object.keys(proposed).filter((key) => JSON.stringify(proposed[key]) !== JSON.stringify(current[key])),
    determineEditEffects: (proposed, current) => ({ inventory: proposed.itens.length !== current.itens.length ? [{ type: "recalculate" }] : [], cash: proposed.total !== current.total ? [{ type: "reconcile" }] : [], production: proposed.status !== current.status ? [{ type: "review" }] : [] }),
    commitEdit: async (plan) => { commits += 1; order = structuredClone(plan.proposed); return { success: true, order, effects: plan.effects, invalidated: ["orders", `order:${order.id}`] }; },
    ...overrides
  });
  return { useCase, get order() { return order; }, set order(value) { order = value; }, get commits() { return commits; } };
}

(async () => {
  const edit = editHarness();
  assert.strictEqual(edit.useCase.prepare({ orderId: "o1", proposed: base, operationId: "e0" }, {}).errors[0].code, ERROR.PERMISSION_DENIED);
  const missing = editHarness({ loadOrder: () => null });
  assert.strictEqual(missing.useCase.prepare({ orderId: "x", proposed: base, operationId: "e1" }, { allowed: true }).errors[0].code, ERROR.ORDER_NOT_FOUND);
  const cancelled = editHarness({ loadOrder: () => ({ ...base, status: "cancelado" }) });
  assert.strictEqual(cancelled.useCase.prepare({ orderId: "o1", proposed: base, operationId: "e2" }, { allowed: true }).errors[0].code, ERROR.ORDER_ALREADY_CANCELLED);
  assert.strictEqual(edit.useCase.prepare({ orderId: "o1", proposed: { ...base, cliente: "" }, operationId: "e3" }, { allowed: true }).errors[0].code, ERROR.INVALID_INPUT);
  for (const [name, patch] of [["cliente", { cliente: "Maria" }], ["item", { itens: [{ nome: "Outra", qtd: 1, valor: 100 }] }], ["quantidade", { itens: [{ nome: "Peça", qtd: 2, valor: 100 }] }], ["preço", { total: 120 }], ["status", { status: "confirmado" }], ["adicionar", { itens: [...base.itens, { nome: "Extra", qtd: 1, valor: 10 }] }], ["remover", { itens: [{ nome: "Peça", qtd: 1, valor: 100 }] }]]) {
    const proposed = { ...structuredClone(base), ...patch, updated_at: `edit-${name}` };
    const prepared = edit.useCase.prepare({ orderId: "o1", proposed, operationId: `edit-${name}` }, { allowed: true });
    assert.strictEqual(prepared.success, true, `preparar alteração: ${name}`);
    edit.order = structuredClone(prepared.data.current);
    const committed = await edit.useCase.commit(prepared, { allowed: true });
    assert.strictEqual(committed.success, true, `commit alteração: ${name}`);
  }
  const conflictHarness = editHarness();
  const conflictPlan = conflictHarness.useCase.prepare({ orderId: "o1", proposed: { ...base, total: 90 }, operationId: "conflict" }, { allowed: true });
  conflictHarness.order = { ...base, updated_at: "v2" };
  assert.strictEqual((await conflictHarness.useCase.commit(conflictPlan, { allowed: true })).errors[0].code, ERROR.CONFLICT);

  let order = structuredClone(base); let cancelCommits = 0; let failCode = "";
  const cancel = new CancelOrderUseCase({
    loadOrder: () => order,
    hasPermission: (context) => context.allowed === true,
    isCancelled: (value) => value.status === "cancelado",
    canCancel: () => ({ allowed: true }),
    determineCancelEffects: (_order, input) => ({ inventory: { releaseReservations: input.reserved ? ["r1"] : [], restoreConsumption: input.produced ? [] : input.returnStock ? ["m1"] : [] }, financial: { reverseOperations: input.paid ? ["f1"] : [] }, production: { cancelJobs: input.produced ? ["j1"] : [] }, warnings: input.produced ? [{ code: "PARTIAL_PRODUCTION_STOCK_REVIEW" }] : [] }),
    commitCancellation: async (plan) => { cancelCommits += 1; if (failCode) return { success: false, code: failCode, message: "falha controlada" }; order = { ...order, status: "cancelado" }; return { success: true, order, effects: { inventoryChanged: plan.inventory.restoreConsumption.length > 0, cashChanged: plan.financial.reverseOperations.length > 0 }, invalidated: ["orders"] }; }
  });
  assert.strictEqual(cancel.prepare({ orderId: "o1", operationId: "c0" }, {}).errors[0].code, ERROR.PERMISSION_DENIED);
  const openPlan = cancel.prepare({ orderId: "o1", operationId: "c1" }, { allowed: true }); assert.strictEqual(openPlan.success, true);
  const reservedPlan = cancel.prepare({ orderId: "o1", operationId: "c2", reserved: true }, { allowed: true }); assert.deepStrictEqual(reservedPlan.data.inventory.releaseReservations, ["r1"]);
  const partialPlan = cancel.prepare({ orderId: "o1", operationId: "c3", produced: true, returnStock: true }, { allowed: true }); assert.strictEqual(partialPlan.data.inventory.restoreConsumption.length, 0);
  const paidPlan = cancel.prepare({ orderId: "o1", operationId: "c4", paid: true }, { allowed: true }); assert.deepStrictEqual(paidPlan.data.financial.reverseOperations, ["f1"]);
  const unpaidPlan = cancel.prepare({ orderId: "o1", operationId: "c5" }, { allowed: true }); assert.strictEqual(unpaidPlan.data.financial.reverseOperations.length, 0);
  const committed = await cancel.commit(openPlan, { allowed: true }); assert.strictEqual(committed.success, true);
  const duplicate = await cancel.commit(openPlan, { allowed: true }); assert.strictEqual(duplicate.success, true); assert.strictEqual(cancelCommits, 1);
  const already = cancel.prepare({ orderId: "o1", operationId: "c6" }, { allowed: true }); assert.strictEqual(already.errors[0].code, ERROR.ORDER_ALREADY_CANCELLED);
  order = structuredClone(base); failCode = ERROR.INVENTORY_RESTORE_ERROR; const stockFailure = await cancel.commit(cancel.prepare({ orderId: "o1", operationId: "c7", returnStock: true }, { allowed: true }), { allowed: true }); assert.strictEqual(stockFailure.errors[0].code, ERROR.INVENTORY_RESTORE_ERROR);
  failCode = ERROR.FINANCIAL_REVERSAL_ERROR; const financeFailure = await cancel.commit(cancel.prepare({ orderId: "o1", operationId: "c8", paid: true }, { allowed: true }), { allowed: true }); assert.strictEqual(financeFailure.errors[0].code, ERROR.FINANCIAL_REVERSAL_ERROR);
  const notFound = new CancelOrderUseCase({ loadOrder: () => null, hasPermission: () => true, determineCancelEffects: () => ({}) }); assert.strictEqual(notFound.prepare({ orderId: "x", operationId: "c9" }, {}).errors[0].code, ERROR.ORDER_NOT_FOUND);
  console.log("Shared order UseCases: edit/cancel contracts, effects, permissions, conflicts and idempotency passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
