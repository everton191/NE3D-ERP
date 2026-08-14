(function attachSimplifica3dOperationSafety(global) {
  "use strict";
  const WRITE_MODE = Object.freeze({ OFF: "OFF", DRY_RUN: "DRY_RUN", LIVE: "LIVE" });
  const OPERATION_STATUS = Object.freeze({ PREPARED: "PREPARED", CONFIRMATION_PENDING: "CONFIRMATION_PENDING", EXECUTING: "EXECUTING", DRY_RUN_EXECUTED: "DRY_RUN_EXECUTED", COMMITTED: "COMMITTED", FAILED: "FAILED", CANCELLED: "CANCELLED", STALE: "STALE", EXPIRED: "EXPIRED" });
  const RESULT_STATUS = Object.freeze({ SUCCESS: "SUCCESS", BLOCKED: "BLOCKED", STALE: "STALE", EXPIRED: "EXPIRED", DUPLICATE: "DUPLICATE", VALIDATION_ERROR: "VALIDATION_ERROR" });
  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  function stableStringify(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  function payloadHash(payload) {
    const source = stableStringify(payload); let first = 0x811c9dc5; let second = 0x9e3779b9;
    for (let index = 0; index < source.length; index += 1) { const code = source.charCodeAt(index); first = Math.imul(first ^ code, 0x01000193) >>> 0; second = Math.imul(second ^ code, 0x85ebca6b) >>> 0; }
    return `${first.toString(16).padStart(8, "0")}${second.toString(16).padStart(8, "0")}`;
  }
  class WriteCapabilityGate {
    constructor({ mode = WRITE_MODE.OFF, allowedCapabilities = ["ORDER.CREATE"] } = {}) { this.mode = mode; this.allowedCapabilities = new Set(allowedCapabilities); }
    check(capability, requestedMode = WRITE_MODE.DRY_RUN) {
      if (!this.allowedCapabilities.has(capability)) return { allowed: false, reason: "CAPABILITY_NOT_ALLOWED" };
      if (this.mode === WRITE_MODE.OFF) return { allowed: false, reason: "WRITE_GATE_OFF" };
      if (this.mode === WRITE_MODE.DRY_RUN && requestedMode !== WRITE_MODE.DRY_RUN) return { allowed: false, reason: "LIVE_WRITE_BLOCKED" };
      if (this.mode === WRITE_MODE.LIVE && requestedMode !== WRITE_MODE.LIVE) return { allowed: false, reason: "LIVE_MODE_REQUIRED" };
      return { allowed: true, mode: this.mode };
    }
  }
  class PrepareOperation {
    constructor({ ttlMs = 10 * 60 * 1000, clock = () => Date.now() } = {}) { this.ttlMs = ttlMs; this.clock = clock; }
    orderCreate(session, actor = {}, permissionSnapshot = {}) {
      const draft = session?.activeDraft; const item = draft?.items?.[0] || {}; const missing = [];
      if (!draft?.customer?.value) missing.push("customer"); if (!item.nome?.value) missing.push("product");
      if (!(Number(item.quantidade?.value) > 0)) missing.push("quantity"); if (!(Number(item.valor?.value) > 0)) missing.push("unitPrice");
      if (missing.length) return { status: RESULT_STATUS.VALIDATION_ERROR, missing };
      const quantity = Number(item.quantidade.value); const unitPrice = Number(item.valor.value);
      const customer = session?.resolvedEntities?.customer || {};
      const payload = { customerId: String(draft.customerId?.value || ""), customerName: String(draft.customer.value), customerPhone: String(customer.phone || ""), customerEmail: String(customer.email || ""), items: [{ productId: String(item.productId?.value || ""), description: String(item.nome.value), quantity, unitPrice, weightGrams: Number(item.pesoGramas?.value) || 0 }], weightGrams: Number(item.pesoGramas?.value) || 0, materials: clone(draft.materials || []), subtotal: Number((quantity * unitPrice).toFixed(2)), discount: 0, downPayment: Math.max(0, Number(draft.downPayment) || 0), status: String(draft.status || "aberto"), total: Number((quantity * unitPrice).toFixed(2)), metadata: { source: "AI_3D_CONFIRMED", notes: String(draft.notes || "") } };
      const now = this.clock();
      return { status: RESULT_STATUS.SUCCESS, operation: { operationId: id("operation"), capability: "ORDER.CREATE", accountId: String(actor.accountId || actor.userId || ""), companyId: String(actor.companyId || ""), taskId: String(session.activeTask?.taskId || ""), draftVersion: Number(draft.draftVersion) || 1, payload, payloadHash: payloadHash(payload), riskLevel: "MEDIUM_WRITE", permissionSnapshot: clone(permissionSnapshot), createdAt: new Date(now).toISOString(), expiresAt: new Date(now + this.ttlMs).toISOString(), status: OPERATION_STATUS.PREPARED } };
    }
  }
  class IdempotencyManager {
    constructor({ storage = null, storageKey = "simplifica:ai-idempotency:v1" } = {}) { this.storage = storage; this.storageKey = storageKey; }
    key(operation) { return payloadHash({ accountId: operation.accountId, capability: operation.capability, operationId: operation.operationId, payloadHash: operation.payloadHash }); }
    load() { try { const value = JSON.parse(this.storage?.getItem(this.storageKey) || "{}"); return value && typeof value === "object" ? value : {}; } catch (_) { return {}; } }
    save(records) { try { this.storage?.setItem(this.storageKey, JSON.stringify(records)); } catch (_) { } }
    get(operation) { return this.load()[this.key(operation)] || null; }
    claim(operation) { const records = this.load(); const key = this.key(operation); const existing = records[key]; if (existing && [OPERATION_STATUS.EXECUTING, OPERATION_STATUS.DRY_RUN_EXECUTED, OPERATION_STATUS.COMMITTED].includes(existing.status)) return { claimed: false, record: existing }; records[key] = { status: OPERATION_STATUS.EXECUTING, operationId: operation.operationId, payloadHash: operation.payloadHash, updatedAt: new Date().toISOString() }; this.save(records); return { claimed: true, record: records[key] }; }
    complete(operation, result) { const records = this.load(); const key = this.key(operation); const status = result?.status === OPERATION_STATUS.COMMITTED || result?.status === "COMMITTED" || result?.status === "ALREADY_COMMITTED" ? OPERATION_STATUS.COMMITTED : OPERATION_STATUS.DRY_RUN_EXECUTED; records[key] = { status, operationId: operation.operationId, payloadHash: operation.payloadHash, result: clone(result), updatedAt: new Date().toISOString() }; this.save(records); return records[key]; }
    fail(operation) { const records = this.load(); const key = this.key(operation); records[key] = { status: OPERATION_STATUS.FAILED, operationId: operation.operationId, payloadHash: operation.payloadHash, updatedAt: new Date().toISOString() }; this.save(records); return records[key]; }
  }
  class ExecutionGuard {
    constructor({ gate, capabilityReady = () => false, permissionGuard = () => false, planGuard = () => false, lock = new Set(), clock = () => Date.now() } = {}) { this.gate = gate; this.capabilityReady = capabilityReady; this.permissionGuard = permissionGuard; this.planGuard = planGuard; this.lock = lock; this.clock = clock; }
    check({ operation, confirmation, session, actor = {} }) {
      if (!operation || !confirmation) return { allowed: false, reason: "MISSING_OPERATION" };
      if (!this.capabilityReady(operation.capability)) return { allowed: false, reason: "CAPABILITY_NOT_READY" };
      const gate = this.gate.check(operation.capability, this.gate.mode); if (!gate.allowed) return gate;
      if (operation.writeMode !== this.gate.mode) return { allowed: false, reason: "WRITE_MODE_CHANGED", status: OPERATION_STATUS.STALE };
      if (String(actor.accountId || actor.userId || "") !== operation.accountId) return { allowed: false, reason: "ACCOUNT_CHANGED" };
      if (String(actor.companyId || "") !== operation.companyId) return { allowed: false, reason: "COMPANY_CHANGED" };
      if (!this.permissionGuard(operation.capability, actor, operation.permissionSnapshot)) return { allowed: false, reason: "PERMISSION_CHANGED" };
      if (!this.planGuard(operation.capability, actor)) return { allowed: false, reason: "PLAN_CHANGED" };
      if (Number(session?.activeDraft?.draftVersion) !== operation.draftVersion) return { allowed: false, reason: "DRAFT_VERSION_CHANGED", status: OPERATION_STATUS.STALE };
      if (payloadHash(operation.payload) !== operation.payloadHash || confirmation.payloadHash !== operation.payloadHash) return { allowed: false, reason: "PAYLOAD_HASH_CHANGED", status: OPERATION_STATUS.STALE };
      if (confirmation.status !== OPERATION_STATUS.CONFIRMATION_PENDING) return { allowed: false, reason: "CONFIRMATION_NOT_PENDING" };
      if (this.clock() > Date.parse(operation.expiresAt)) return { allowed: false, reason: "CONFIRMATION_EXPIRED", status: OPERATION_STATUS.EXPIRED };
      if (this.lock.has(operation.operationId)) return { allowed: false, reason: "CONCURRENT_EXECUTION" };
      return { allowed: true };
    }
    acquire(operationId) { if (this.lock.has(operationId)) return false; this.lock.add(operationId); return true; }
    release(operationId) { this.lock.delete(operationId); }
  }
  class DryRunExecutor {
    constructor() { this.executionCount = 0; }
    async execute(operation) { this.executionCount += 1; return { status: OPERATION_STATUS.DRY_RUN_EXECUTED, operationId: operation.operationId, capability: operation.capability, payloadHash: operation.payloadHash, preview: clone(operation.payload), sideEffects: 0, message: "Validação concluída em modo de teste. Nenhum dado foi alterado." }; }
  }
  class ConfirmationManager {
    constructor({ idempotency, executionGuard, executor, clock = () => Date.now() } = {}) { this.idempotency = idempotency; this.executionGuard = executionGuard; this.executor = executor; this.clock = clock; }
    create(operation) { return { confirmationId: id("confirmation"), conversationId: "", taskId: operation.taskId, actionId: id("action"), capability: operation.capability, operationId: operation.operationId, operationHash: operation.payloadHash, payloadHash: operation.payloadHash, draftSnapshot: clone(operation.payload), draftVersion: operation.draftVersion, riskLevel: operation.riskLevel, createdAt: new Date(this.clock()).toISOString(), expiresAt: operation.expiresAt, status: OPERATION_STATUS.CONFIRMATION_PENDING, operation: clone(operation) }; }
    async confirm({ manager, actor = {}, confirmationId = "" }) {
      const pending = manager.session.pendingAction; if (!pending || (confirmationId && pending.confirmationId !== confirmationId)) return { status: RESULT_STATUS.BLOCKED, reason: "CONFIRMATION_NOT_FOUND" };
      const operation = pending.operation; const duplicate = this.idempotency.get(operation); if ([OPERATION_STATUS.EXECUTING, OPERATION_STATUS.DRY_RUN_EXECUTED, OPERATION_STATUS.COMMITTED].includes(duplicate?.status)) return { status: RESULT_STATUS.DUPLICATE, result: duplicate.result || null };
      const guard = this.executionGuard.check({ operation, confirmation: pending, session: manager.session, actor });
      if (!guard.allowed) { pending.status = guard.status || OPERATION_STATUS.FAILED; manager.save(); return { status: guard.status === OPERATION_STATUS.STALE ? RESULT_STATUS.STALE : guard.status === OPERATION_STATUS.EXPIRED ? RESULT_STATUS.EXPIRED : RESULT_STATUS.BLOCKED, reason: guard.reason }; }
      const claim = this.idempotency.claim(operation); if (!claim.claimed) return { status: RESULT_STATUS.DUPLICATE, result: claim.record.result || null };
      if (!this.executionGuard.acquire(operation.operationId)) return { status: RESULT_STATUS.BLOCKED, reason: "CONCURRENT_EXECUTION" };
      pending.status = OPERATION_STATUS.EXECUTING; manager.save();
      try { const result = await this.executor.execute(operation); this.idempotency.complete(operation, result); pending.status = result?.status === "COMMITTED" || result?.status === "ALREADY_COMMITTED" ? OPERATION_STATUS.COMMITTED : OPERATION_STATUS.DRY_RUN_EXECUTED; pending.result = clone(result); manager.save(); return { status: RESULT_STATUS.SUCCESS, result }; }
      catch (error) { this.idempotency.fail(operation); pending.status = OPERATION_STATUS.CONFIRMATION_PENDING; pending.lastFailureAt = new Date(this.clock()).toISOString(); pending.lastFailureCode = String(error?.code || "EXECUTION_FAILED"); manager.save(); throw error; }
      finally { this.executionGuard.release(operation.operationId); }
    }
  }
  class SafeOperationPipeline {
    constructor({ manager, gate, preparer, confirmationManager, permissionGuard = () => ({ allowed: false }), planGuard = () => ({ allowed: false }) } = {}) { this.manager = manager; this.gate = gate; this.preparer = preparer; this.confirmationManager = confirmationManager; this.permissionGuard = permissionGuard; this.planGuard = planGuard; }
    prepareOrder(actor = {}) {
      const gate = this.gate.check("ORDER.CREATE", this.gate.mode); if (!gate.allowed) return { status: RESULT_STATUS.BLOCKED, reason: gate.reason };
      const permission = this.permissionGuard("ORDER.CREATE", actor); if (!permission.allowed) return { status: RESULT_STATUS.BLOCKED, reason: "PERMISSION_DENIED" };
      const plan = this.planGuard("ORDER.CREATE", actor); if (!plan.allowed) return { status: RESULT_STATUS.BLOCKED, reason: "PLAN_DENIED" };
      const prepared = this.preparer.orderCreate(this.manager.session, actor, { permission: true, plan: actor.plan || "" }); if (prepared.status !== RESULT_STATUS.SUCCESS) return prepared;
      prepared.operation.writeMode = this.gate.mode;
      const pending = this.confirmationManager.create(prepared.operation); pending.conversationId = this.manager.session.conversationId; this.manager.session.pendingAction = pending; this.manager.session.conversationState = "WAITING_CONFIRMATION"; this.manager.save(); return { status: RESULT_STATUS.SUCCESS, operation: prepared.operation, confirmation: pending };
    }
    confirm(actor = {}, confirmationId = "") { return this.confirmationManager.confirm({ manager: this.manager, actor, confirmationId }); }
  }
  const api = Object.freeze({ WRITE_MODE, OPERATION_STATUS, RESULT_STATUS, stableStringify, payloadHash, WriteCapabilityGate, PrepareOperation, IdempotencyManager, ExecutionGuard, DryRunExecutor, ConfirmationManager, SafeOperationPipeline });
  global.Simplifica3dOperationSafety = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
