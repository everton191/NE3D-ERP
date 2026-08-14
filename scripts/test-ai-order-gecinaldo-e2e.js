"use strict";

const assert = require("assert");
const C = require("../src/ai-3d/core.js");
global.Simplifica3dAiCore = C;
const S = require("../src/ai-3d/operation-safety.js");
const { AiOrchestrator3D } = require("../src/ai-3d/orchestrator.js");

class MemoryStorage {
  constructor() { this.data = new Map(); }
  getItem(key) { return this.data.get(key) || null; }
  setItem(key, value) { this.data.set(key, value); }
}

(async () => {
  const storage = new MemoryStorage();
  const manager = new C.ConversationTaskManager({ storage, storageKey: "gecinaldo" });
  const capabilities = new C.CapabilityRegistry();
  capabilities.register({ name: "CUSTOMER.SEARCH", tool: "customer_search", operationType: C.OPERATION_TYPE.READ, schema: {}, adapter: () => {}, tested: true });
  const tools = new C.ToolRegistry({ capabilities, permissionGuard: () => true });
  tools.register({ name: "customer_search", capability: "CUSTOMER.SEARCH", operationType: C.OPERATION_TYPE.READ, executor: async () => ({ status: C.TOOL_STATUS.NOT_FOUND, matches: [] }) });
  const gate = new S.WriteCapabilityGate({ mode: S.WRITE_MODE.LIVE });
  const idempotency = new S.IdempotencyManager({ storage, storageKey: "gecinaldo-idempotency" });
  let executions = 0;
  const executor = { execute: async (operation) => { executions += 1; return { status: "COMMITTED", orderId: "order-gecinaldo", operationId: operation.operationId, message: "Pedido criado com sucesso." }; } };
  const actor = { userId: "account-a", accountId: "account-a", companyId: "11111111-1111-4111-8111-111111111111", plan: "pro" };
  const allowed = () => true;
  const guard = new S.ExecutionGuard({ gate, capabilityReady: (name) => name === "ORDER.CREATE", permissionGuard: allowed, planGuard: allowed });
  const confirmation = new S.ConfirmationManager({ idempotency, executionGuard: guard, executor });
  const safety = new S.SafeOperationPipeline({ manager, gate, preparer: new S.PrepareOperation(), confirmationManager: confirmation, permissionGuard: () => ({ allowed: true }), planGuard: () => ({ allowed: true }) });
  const orchestrator = new AiOrchestrator3D({
    manager,
    continuationResolver: new C.ContinuationResolver(),
    contextBuilder: new C.ContextBuilder(),
    tools,
    provider: { converse: async () => "Conversa sem execução." },
    operationSafety: safety
  });

  let response = await orchestrator.handle("Cria um pedido de 10 chaveiros e 10 suportes para lápis para Gecinaldo Júnior por R$80.", { appContext: actor });
  const taskId = manager.session.activeTask.taskId;
  assert.strictEqual(manager.session.activeDraft.customer.value, "Gecinaldo Júnior");
  assert.strictEqual(manager.session.activeDraft.items.length, 2);
  assert.deepStrictEqual(manager.session.activeDraft.items.map((item) => [item.quantidade.value, item.nome.value]), [[10, "chaveiros"], [10, "suportes para lápis"]]);
  assert.deepStrictEqual(manager.session.activeDraft.items.map((item) => item.valor.value), [4, 4]);
  assert(response.summary.includes("Sem peso"));

  response = await orchestrator.handle("Sem peso.", { appContext: actor });
  assert.strictEqual(manager.session.activeTask.taskId, taskId);
  assert(manager.session.activeDraft.items.every((item) => item.pesoGramas.state === C.SLOT_STATE.NOT_APPLICABLE));
  assert.match(response.summary, /completo/i);

  response = await orchestrator.handle("Pode criar.", { appContext: actor });
  assert.strictEqual(manager.session.activeTask.taskId, taskId);
  assert.strictEqual(manager.session.pendingAction.status, S.OPERATION_STATUS.CONFIRMATION_PENDING);
  assert.strictEqual(response.prepared.operation.payload.items.length, 2);
  assert.strictEqual(response.prepared.operation.payload.total, 80);
  assert.match(response.summary, /10 × chaveiros/i);
  assert.match(response.summary, /10 × suportes para lápis/i);

  response = await orchestrator.handle("Criar esse pedido.", { appContext: actor });
  assert.strictEqual(executions, 1);
  assert.strictEqual(response.confirmed.result.orderId, "order-gecinaldo");
  assert.deepStrictEqual(response.navigationTarget, { routeId: "orders.list", label: "Pedido criado", entityId: "order-gecinaldo", entityType: "order" });
  assert.strictEqual(manager.session.activeTask, null);

  await orchestrator.handle("Criar esse pedido.", { appContext: actor });
  assert.strictEqual(executions, 1, "repetir a confirmação não pode criar pedido duplicado");
  console.log("AI E2E Gecinaldo: uma tarefa, dois itens, sem peso, R$ 80, uma confirmação e uma execução.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
