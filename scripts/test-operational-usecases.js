"use strict";
const assert = require("assert");
const U = require("../src/ai-3d/operational-usecases.js");

const allowed = { hasPermission: () => true };
async function exercise(UseCase, dependencies, input, expectedPrepare, expectedCommit) {
  const useCase = new UseCase({ ...allowed, ...dependencies });
  const prepared = useCase.prepare({ ...input, idempotencyKey: `test:${expectedCommit}` }, {});
  assert.strictEqual(prepared.success, true, `${expectedPrepare} must prepare`);
  assert.strictEqual(prepared.action, expectedPrepare);
  const blocked = await useCase.commit(prepared, { confirmed: false });
  assert.strictEqual(blocked.errors[0].code, "CONFIRMATION_REQUIRED");
  const committed = await useCase.commit(prepared, { confirmed: true });
  assert.strictEqual(committed.success, true, `${expectedCommit} must commit after confirmation`);
  assert.strictEqual(committed.action, expectedCommit);
  assert.deepStrictEqual(await useCase.commit(prepared, { confirmed: true }), committed, `${expectedCommit} must be idempotent`);
}

(async () => {
  await exercise(U.InventoryReserveUseCase, { loadMaterial: () => ({ id: "mat-1" }), reserve: async (data) => ({ success: true, data }) }, { materialId: "mat-1", amount: 200 }, "inventory.prepare_reservation", "inventory.reserve");
  await exercise(U.InventoryReleaseUseCase, { loadReservation: () => ({ id: "res-1", amount: 200 }), release: async (data) => ({ success: true, data }) }, { reservationId: "res-1" }, "inventory.prepare_release", "inventory.release");
  await exercise(U.InventoryConsumeUseCase, { loadRoll: () => ({ id: "roll-1", available: 500 }), consume: async (data) => ({ success: true, data }) }, { rollId: "roll-1", amount: 200 }, "inventory.prepare_consume", "inventory.consume");
  await exercise(U.CashWithdrawalUseCase, { withdraw: async (data) => ({ success: true, data }) }, { amount: 100 }, "cash.prepare_withdrawal", "cash.commit_withdrawal");
  await exercise(U.CashDepositUseCase, { deposit: async (data) => ({ success: true, data }) }, { amount: 100 }, "cash.prepare_deposit", "cash.commit_deposit");
  await exercise(U.CashCloseSessionUseCase, { loadSession: () => ({ id: "cash-1", expectedAmount: 100 }), closeSession: async (data) => ({ success: true, data }) }, { sessionId: "cash-1", countedAmount: 100 }, "cash.prepare_close_session", "cash.close_session");
  await exercise(U.ProductionPrepareUseCase, { loadOrder: () => ({ id: "order-1" }), createJob: async (data) => ({ success: true, data }) }, { orderId: "order-1", printerId: "printer-1" }, "production.prepare_job", "production.commit_job");
  await exercise(U.ProductionChangeStatusUseCase, { loadJob: () => ({ id: "job-1", status: "queued" }), changeStatus: async (data) => ({ success: true, data }) }, { jobId: "job-1", status: "printing" }, "production.prepare_change_status", "production.change_status");
  const denied = new U.CashWithdrawalUseCase({ hasPermission: () => false }).prepare({ amount: 10, idempotencyKey: "denied" }, {});
  assert.strictEqual(denied.errors[0].code, "PERMISSION_DENIED");
  const records = new Map();
  const storage = { getItem: (key) => records.get(key) || null, setItem: (key, value) => records.set(key, value) };
  const persistent = new U.PersistentIdempotencyStore({ storage });
  const first = new U.CashDepositUseCase({ ...allowed, idempotency: persistent, deposit: async (data) => ({ success: true, data }) });
  const prepared = first.prepare({ amount: 12, idempotencyKey: "persistent-deposit" }, {});
  const firstResult = await first.commit(prepared, { confirmed: true });
  const reloaded = new U.CashDepositUseCase({ ...allowed, idempotency: persistent, deposit: async () => { throw new Error("must not execute twice"); } });
  const repeated = await reloaded.commit(prepared, { confirmed: true });
  assert.deepStrictEqual(repeated, firstResult, "persistent idempotency must survive a new UseCase instance");
  console.log("Critical operational UseCase contract tests passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
