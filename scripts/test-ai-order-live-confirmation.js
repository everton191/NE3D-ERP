"use strict";

const assert = require("assert");
const C = require("../src/ai-3d/core.js");
const S = require("../src/ai-3d/operation-safety.js");

class MemoryStorage {
  constructor() { this.data = new Map(); }
  getItem(key) { return this.data.get(key) || null; }
  setItem(key, value) { this.data.set(key, value); }
}

(async () => {
  const storage = new MemoryStorage();
  const manager = new C.ConversationTaskManager({ storage, storageKey: "live-confirmation" });
  manager.startOrder({ customer: "José", product: "Chaveiro", weightGrams: 10, quantity: 100 });
  manager.updateSlot("unitPrice", 7);

  let writes = 0;
  const executor = {
    async execute(operation) {
      writes += 1;
      return { status: S.OPERATION_STATUS.COMMITTED, operationId: operation.operationId, orderId: "order-test", message: "Pedido de teste salvo." };
    }
  };
  const gate = new S.WriteCapabilityGate({ mode: S.WRITE_MODE.LIVE, allowedCapabilities: ["ORDER.CREATE"] });
  const idempotency = new S.IdempotencyManager({ storage, storageKey: "live-idempotency" });
  const guard = new S.ExecutionGuard({ gate, capabilityReady: (capability) => capability === "ORDER.CREATE", permissionGuard: () => true, planGuard: () => true });
  const confirmation = new S.ConfirmationManager({ idempotency, executionGuard: guard, executor });
  const pipeline = new S.SafeOperationPipeline({ manager, gate, preparer: new S.PrepareOperation(), confirmationManager: confirmation, permissionGuard: () => ({ allowed: true }), planGuard: () => ({ allowed: true }) });
  const actor = { userId: "user-test", accountId: "account-test", companyId: "company-test", plan: "pro" };

  assert.strictEqual(writes, 0, "montar o rascunho não pode gravar");
  const prepared = pipeline.prepareOrder(actor);
  assert.strictEqual(prepared.status, S.RESULT_STATUS.SUCCESS);
  assert.strictEqual(manager.session.pendingAction.status, S.OPERATION_STATUS.CONFIRMATION_PENDING);
  assert.strictEqual(writes, 0, "mostrar a prévia não pode gravar");

  const confirmed = await pipeline.confirm(actor, prepared.confirmation.confirmationId);
  assert.strictEqual(confirmed.status, S.RESULT_STATUS.SUCCESS);
  assert.strictEqual(confirmed.result.status, S.OPERATION_STATUS.COMMITTED);
  assert.strictEqual(writes, 1, "a confirmação humana deve executar uma vez");

  const duplicate = await pipeline.confirm(actor, prepared.confirmation.confirmationId);
  assert.strictEqual(duplicate.status, S.RESULT_STATUS.DUPLICATE);
  assert.strictEqual(writes, 1, "confirmação repetida não pode duplicar o pedido");

  const staleStorage = new MemoryStorage();
  const staleManager = new C.ConversationTaskManager({ storage: staleStorage, storageKey: "stale" });
  staleManager.startOrder({ customer: "José", product: "Chaveiro", weightGrams: 10, quantity: 100 });
  staleManager.updateSlot("unitPrice", 7);
  const staleGuard = new S.ExecutionGuard({ gate, capabilityReady: (capability) => capability === "ORDER.CREATE", permissionGuard: () => true, planGuard: () => true });
  const stalePipeline = new S.SafeOperationPipeline({ manager: staleManager, gate, preparer: new S.PrepareOperation(), confirmationManager: new S.ConfirmationManager({ idempotency: new S.IdempotencyManager({ storage: staleStorage, storageKey: "stale-idem" }), executionGuard: staleGuard, executor }), permissionGuard: () => ({ allowed: true }), planGuard: () => ({ allowed: true }) });
  stalePipeline.prepareOrder(actor);
  staleManager.updateSlot("quantity", 120);
  assert.strictEqual((await stalePipeline.confirm(actor)).status, S.RESULT_STATUS.STALE);
  assert.strictEqual(writes, 1, "prévia alterada deve ficar obsoleta e não gravar");

  const retryStorage = new MemoryStorage();
  const retryManager = new C.ConversationTaskManager({ storage: retryStorage, storageKey: "retry" });
  retryManager.startOrder({ customer: "José", product: "Chaveiro", weightGrams: 10, quantity: 100 });
  retryManager.updateSlot("unitPrice", 7);
  let attempts = 0;
  const retryExecutor = { async execute(operation) { attempts += 1; if (attempts === 1) throw new Error("falha injetada"); return { status: S.OPERATION_STATUS.COMMITTED, operationId: operation.operationId, message: "Pedido salvo." }; } };
  const retryGuard = new S.ExecutionGuard({ gate, capabilityReady: () => true, permissionGuard: () => true, planGuard: () => true });
  const retryPipeline = new S.SafeOperationPipeline({ manager: retryManager, gate, preparer: new S.PrepareOperation(), confirmationManager: new S.ConfirmationManager({ idempotency: new S.IdempotencyManager({ storage: retryStorage, storageKey: "retry-idem" }), executionGuard: retryGuard, executor: retryExecutor }), permissionGuard: () => ({ allowed: true }), planGuard: () => ({ allowed: true }) });
  const retryPrepared = retryPipeline.prepareOrder(actor);
  await assert.rejects(() => retryPipeline.confirm(actor, retryPrepared.confirmation.confirmationId), /falha injetada/);
  assert.strictEqual(retryManager.session.pendingAction.status, S.OPERATION_STATUS.CONFIRMATION_PENDING, "falha deve manter a confirmação para uma nova tentativa segura");
  assert.strictEqual((await retryPipeline.confirm(actor, retryPrepared.confirmation.confirmationId)).status, S.RESULT_STATUS.SUCCESS);
  assert.strictEqual(attempts, 2);

  assert.strictEqual(gate.check("STOCK.ADD", S.WRITE_MODE.LIVE).allowed, false);
  assert.strictEqual(gate.check("CUSTOMER.CREATE", S.WRITE_MODE.LIVE).allowed, false);
  console.log("ORDER.CREATE LIVE: prévia, confirmação humana, idempotência e invalidação do rascunho validadas sem dados reais.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
