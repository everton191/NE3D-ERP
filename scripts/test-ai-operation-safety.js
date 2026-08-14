"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const C = require("../src/ai-3d/core.js");
const S = require("../src/ai-3d/operation-safety.js");
const { AiOrchestrator3D } = require("../src/ai-3d/orchestrator.js");

class MemoryStorage {
  constructor() { this.data = new Map(); }
  getItem(key) { return this.data.get(key) || null; }
  setItem(key, value) { this.data.set(key, value); }
}

function completeDraft(manager, { quantity = 100, unitPrice = 7 } = {}) {
  manager.startOrder({ customer: "José", product: "Chaveiro", weightGrams: 10, quantity });
  manager.updateSlot("unitPrice", unitPrice);
  return manager;
}

function fixture({ storage = new MemoryStorage(), now = { value: Date.now() }, permission = { allowed: true }, plan = { allowed: true } } = {}) {
  const manager = completeDraft(new C.ConversationTaskManager({ storage, storageKey: "session-a" }));
  const gate = new S.WriteCapabilityGate({ mode: S.WRITE_MODE.DRY_RUN });
  const idempotency = new S.IdempotencyManager({ storage, storageKey: "idem-a" });
  const executor = new S.DryRunExecutor();
  const permissionCheck = () => permission.allowed;
  const executionGuard = new S.ExecutionGuard({ gate, capabilityReady: (capability) => capability === "ORDER.CREATE", permissionGuard: permissionCheck, planGuard: () => plan.allowed, clock: () => now.value });
  const confirmationManager = new S.ConfirmationManager({ idempotency, executionGuard, executor, clock: () => now.value });
  const pipeline = new S.SafeOperationPipeline({ manager, gate, preparer: new S.PrepareOperation({ ttlMs: 1000, clock: () => now.value }), confirmationManager, permissionGuard: () => permission, planGuard: () => plan });
  return { manager, gate, idempotency, executor, pipeline, now, permission, plan, storage };
}

(async () => {
  const actor = { userId: "account-a", accountId: "account-a", companyId: "company-a", plan: "pro" };
  const first = fixture();
  const prepared = first.pipeline.prepareOrder(actor);
  assert.strictEqual(prepared.status, S.RESULT_STATUS.SUCCESS);
  assert.strictEqual(prepared.operation.capability, "ORDER.CREATE");
  assert.strictEqual(prepared.operation.draftVersion, first.manager.session.activeDraft.draftVersion);
  assert.strictEqual(prepared.operation.payload.items[0].quantity, 100);
  assert.strictEqual(prepared.operation.payload.total, 700);
  assert.strictEqual(prepared.operation.payloadHash, S.payloadHash(prepared.operation.payload));
  assert.strictEqual(first.manager.session.pendingAction.status, S.OPERATION_STATUS.CONFIRMATION_PENDING);

  const [confirmed, duplicate] = await Promise.all([first.pipeline.confirm(actor), first.pipeline.confirm(actor)]);
  assert([confirmed.status, duplicate.status].includes(S.RESULT_STATUS.SUCCESS));
  assert([confirmed.status, duplicate.status].includes(S.RESULT_STATUS.DUPLICATE));
  assert.strictEqual(first.executor.executionCount, 1, "confirmações concorrentes devem executar um único dry-run");
  assert.strictEqual((await first.pipeline.confirm(actor)).status, S.RESULT_STATUS.DUPLICATE, "confirmação repetida após conclusão deve ser idempotente");
  assert.strictEqual(first.executor.executionCount, 1);

  const stale = fixture();
  const stalePrepared = stale.pipeline.prepareOrder(actor);
  const oldHash = stalePrepared.operation.payloadHash;
  stale.manager.updateSlot("quantity", 120);
  assert.strictEqual(stale.manager.session.pendingAction.status, S.OPERATION_STATUS.STALE);
  const staleResult = await stale.pipeline.confirm(actor);
  assert.strictEqual(staleResult.status, S.RESULT_STATUS.STALE);
  assert.strictEqual(stale.executor.executionCount, 0);
  const refreshed = stale.pipeline.prepareOrder(actor);
  assert.notStrictEqual(refreshed.operation.payloadHash, oldHash);
  assert.strictEqual(refreshed.operation.payload.items[0].quantity, 120);

  const restart = fixture();
  restart.pipeline.prepareOrder(actor);
  const restored = new C.ConversationTaskManager({ storage: restart.storage, storageKey: "session-a" });
  assert.strictEqual(restored.session.pendingAction.status, S.OPERATION_STATUS.CONFIRMATION_PENDING);
  assert.strictEqual(restart.executor.executionCount, 0, "restaurar processo nunca executa confirmação automaticamente");
  const legacyStorage = new MemoryStorage();
  legacyStorage.setItem("legacy", JSON.stringify({ activeDraft: { kind: "ORDER", customer: { value: "José" }, items: [{}] } }));
  const migratedLegacy = new C.ConversationTaskManager({ storage: legacyStorage, storageKey: "legacy" });
  assert.strictEqual(migratedLegacy.session.activeDraft.draftVersion, 1, "draft persistido pela Fase 1 deve receber versão na restauração");

  const accountChange = fixture(); accountChange.pipeline.prepareOrder(actor);
  assert.strictEqual((await accountChange.pipeline.confirm({ ...actor, accountId: "account-b", userId: "account-b" })).reason, "ACCOUNT_CHANGED");
  assert.strictEqual(accountChange.executor.executionCount, 0);

  const permissionChange = fixture(); permissionChange.pipeline.prepareOrder(actor); permissionChange.permission.allowed = false;
  assert.strictEqual((await permissionChange.pipeline.confirm(actor)).reason, "PERMISSION_CHANGED");
  assert.strictEqual(permissionChange.executor.executionCount, 0);

  const planChange = fixture(); planChange.pipeline.prepareOrder(actor); planChange.plan.allowed = false;
  assert.strictEqual((await planChange.pipeline.confirm(actor)).reason, "PLAN_CHANGED");

  const expired = fixture(); expired.pipeline.prepareOrder(actor); expired.now.value += 1001;
  assert.strictEqual((await expired.pipeline.confirm(actor)).status, S.RESULT_STATUS.EXPIRED);
  assert.strictEqual(expired.executor.executionCount, 0);

  const cancelled = fixture(); cancelled.pipeline.prepareOrder(actor); cancelled.manager.cancel();
  assert.strictEqual(cancelled.manager.session.pendingAction, null);
  assert.strictEqual(cancelled.executor.executionCount, 0);

  const newTask = fixture(); newTask.pipeline.prepareOrder(actor); newTask.manager.startOrder({ customer: "Maria" });
  assert.strictEqual(newTask.manager.session.pendingAction, null, "nova tarefa inequívoca não pode herdar confirmação anterior");

  const gateOff = new S.WriteCapabilityGate({ mode: S.WRITE_MODE.OFF });
  assert.strictEqual(gateOff.check("ORDER.CREATE").allowed, false);
  assert.strictEqual(first.gate.check("ORDER.CREATE", S.WRITE_MODE.LIVE).reason, "LIVE_WRITE_BLOCKED");
  assert.strictEqual(first.gate.check("STOCK.ADD").reason, "CAPABILITY_NOT_ALLOWED");

  const integrated = fixture(); let providerCalls = 0;
  const integratedOrchestrator = new AiOrchestrator3D({
    manager: integrated.manager, continuationResolver: new C.ContinuationResolver(), contextBuilder: new C.ContextBuilder(), tools: null,
    provider: { converse: async () => { providerCalls += 1; return "não deveria chamar provider"; } }, operationSafety: integrated.pipeline
  });
  let integratedResponse = await integratedOrchestrator.handle("Preparar.", { appContext: actor });
  assert.match(integratedResponse.summary, /Prévia do pedido/);
  assert.match(integratedResponse.summary, /apenas uma simulação/i);
  assert.strictEqual(integratedResponse.classification.fastPath, true);
  integratedResponse = await integratedOrchestrator.handle("Sim.", { appContext: actor });
  assert.match(integratedResponse.summary, /Nenhum dado foi alterado/);
  assert.strictEqual(integrated.executor.executionCount, 1);
  await integratedOrchestrator.handle("Sim.", { appContext: actor });
  assert.strictEqual(integrated.executor.executionCount, 1);
  assert.strictEqual(providerCalls, 0, "preparação e confirmação inequívocas não podem chamar provider");

  const coreSource = fs.readFileSync(path.join(__dirname, "..", "src", "ai-3d", "operation-safety.js"), "utf8");
  assert.doesNotMatch(coreSource, /fecharPedido\(|salvarDados\(|movimentarEstoque\(|adicionarMovimentoCaixa\(|requisicaoSupabase\(|Simplifica3dErpBridge\.execute/);
  assert.match(coreSource, /sideEffects: 0/);
  const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert.match(appSource, /WRITE_MODE\.DRY_RUN/);
  assert.doesNotMatch(appSource.match(/const operationSafety = new S\.SafeOperationPipeline\([\s\S]*?\n  \}\);/)?.[0] || "", /fecharPedido|salvarDados|estoque|caixa|financeiro/i);
  console.log("AI Fase 2A: preparação, confirmação, idempotência, guards e simulação validados sem WRITE.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
