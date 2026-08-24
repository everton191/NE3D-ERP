(function attachOperationalUseCases(global) {
  "use strict";

  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const failure = (action, code, message, missing = []) => Object.freeze({ success: false, action, data: null, warnings: [], missing: [...missing], errors: [{ code, message }], nextActions: [] });
  const success = (action, data, warnings = []) => Object.freeze({ success: true, action, data: clone(data), warnings: clone(warnings), missing: [], errors: [], nextActions: [] });
  const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
  const operationKey = (input, prefix, target) => String(input.operationId || input.idempotencyKey || `${prefix}:${target || ""}`).trim();
  const stableStringify = (value) => {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  };

  class PersistentIdempotencyStore {
    constructor({ storage = null, storageKey = "simplifica:operational-usecases:idempotency:v1", clock = () => Date.now() } = {}) { this.storage = storage; this.storageKey = storageKey; this.clock = clock; }
    load() { try { const value = JSON.parse(this.storage?.getItem(this.storageKey) || "{}"); return value && typeof value === "object" ? value : {}; } catch (_) { return {}; } }
    save(records) { this.storage?.setItem?.(this.storageKey, JSON.stringify(records)); }
    fingerprint(plan) { return `${plan.capability}:${plan.operationId}:${stableStringify(plan.preview)}`; }
    get(plan) { return this.load()[this.fingerprint(plan)] || null; }
    claim(plan) {
      const records = this.load(); const key = this.fingerprint(plan); const existing = records[key];
      if (existing?.status === "COMMITTED") return { claimed: false, result: existing.result };
      records[key] = { status: "EXECUTING", operationId: plan.operationId, updatedAt: new Date(this.clock()).toISOString() }; this.save(records); return { claimed: true };
    }
    complete(plan, result) { const records = this.load(); records[this.fingerprint(plan)] = { status: "COMMITTED", operationId: plan.operationId, result: clone(result), updatedAt: new Date(this.clock()).toISOString() }; this.save(records); }
    fail(plan) { const records = this.load(); const key = this.fingerprint(plan); if (records[key]?.status === "EXECUTING") { delete records[key]; this.save(records); } }
  }

  class PreparedWriteUseCase {
    constructor({ prepareAction, commitAction, permission, capability, loadTarget, validate, buildPlan, commit } = {}, dependencies = {}) {
      this.config = { prepareAction, commitAction, permission, capability, loadTarget, validate, buildPlan, commit };
      this.dependencies = dependencies;
      this.committed = new Map(); this.idempotency = dependencies.idempotency || null;
    }
    prepare(input = {}, context = {}) {
      const c = this.config; const d = this.dependencies;
      if (!c.prepareAction || typeof d.hasPermission !== "function" || typeof c.buildPlan !== "function") return failure(c.prepareAction || "unknown.prepare", "EXECUTION_FAILED", "UseCase não configurado.");
      if (!d.hasPermission(context, c.permission)) return failure(c.prepareAction, "PERMISSION_DENIED", "Operação não autorizada.");
      const validation = c.validate?.(input) || { ok: true };
      if (!validation.ok) return failure(c.prepareAction, validation.code || "INVALID_INPUT", validation.message || "Dados inválidos.", validation.missing);
      const target = c.loadTarget ? c.loadTarget(input, d) : null;
      if (c.loadTarget && !target) return failure(c.prepareAction, "TARGET_NOT_FOUND", "Registro não encontrado.");
      const key = operationKey(input, c.capability, target?.id || input.targetId || input.rollId || input.reservationId || input.sessionId || input.jobId);
      if (!key) return failure(c.prepareAction, "INVALID_INPUT", "Identificador idempotente obrigatório.");
      return success(c.prepareAction, { operationId: key, capability: c.capability, input: clone(input), target: clone(target), preview: clone(c.buildPlan(input, target, d)) });
    }
    async commit(preparedEnvelope = {}, context = {}) {
      const c = this.config; const d = this.dependencies; const plan = preparedEnvelope?.data || preparedEnvelope;
      if (!preparedEnvelope?.success || !plan?.operationId) return failure(c.commitAction, "INVALID_INPUT", "Operação preparada inválida.");
      if (!d.hasPermission?.(context, c.permission)) return failure(c.commitAction, "PERMISSION_DENIED", "Operação não autorizada.");
      if (!context.confirmed) return failure(c.commitAction, "CONFIRMATION_REQUIRED", "Confirmação explícita obrigatória.");
      if (this.committed.has(plan.operationId)) return this.committed.get(plan.operationId);
      const claim = this.idempotency?.claim(plan);
      if (claim && !claim.claimed) return claim.result || failure(c.commitAction, "DUPLICATE_OPERATION", "A operação já foi concluída.");
      if (typeof c.commit !== "function") return failure(c.commitAction, "EXECUTION_FAILED", "Executor de domínio indisponível.");
      try {
        const committed = await c.commit(plan, context, d);
        if (!committed?.success) return failure(c.commitAction, committed?.code || "EXECUTION_FAILED", committed?.message || "Não foi possível concluir a operação.");
        const result = success(c.commitAction, committed.data ?? committed);
        this.committed.set(plan.operationId, result); this.idempotency?.complete(plan, result); return result;
      } catch (error) { this.idempotency?.fail(plan); return failure(c.commitAction, error?.code || "EXECUTION_FAILED", String(error?.message || error)); }
    }
  }

  const inventoryValidation = (input) => positive(input.amount) ? { ok: true } : { ok: false, code: "INVALID_AMOUNT", message: "Quantidade deve ser maior que zero.", missing: ["amount"] };
  class InventoryReserveUseCase extends PreparedWriteUseCase {
    constructor(dependencies = {}) { super({ prepareAction: "inventory.prepare_reservation", commitAction: "inventory.reserve", permission: "basic_stock", capability: "INVENTORY.RESERVE", loadTarget: (i, d) => d.loadMaterial?.(i.materialId), validate: inventoryValidation, buildPlan: (i, material) => ({ materialId: String(material.id), amount: Number(i.amount), orderId: String(i.orderId || "") }), commit: (p, c, d) => d.reserve(p.preview, c) }, dependencies); }
  }
  class InventoryReleaseUseCase extends PreparedWriteUseCase {
    constructor(dependencies = {}) { super({ prepareAction: "inventory.prepare_release", commitAction: "inventory.release", permission: "basic_stock", capability: "INVENTORY.RELEASE", loadTarget: (i, d) => d.loadReservation?.(i.reservationId), buildPlan: (i, reservation) => ({ reservationId: String(reservation.id), amount: Number(i.amount || reservation.amount), reason: String(i.reason || "") }), commit: (p, c, d) => d.release(p.preview, c) }, dependencies); }
  }
  class InventoryConsumeUseCase extends PreparedWriteUseCase {
    constructor(dependencies = {}) { super({ prepareAction: "inventory.prepare_consume", commitAction: "inventory.consume", permission: "basic_stock", capability: "INVENTORY.CONSUME", loadTarget: (i, d) => d.loadRoll?.(i.rollId), validate: inventoryValidation, buildPlan: (i, roll) => ({ rollId: String(roll.id), amount: Number(i.amount), available: Number(roll.available || 0) }), commit: (p, c, d) => d.consume(p.preview, c) }, dependencies); }
  }
  const moneyValidation = (input) => positive(input.amount) ? { ok: true } : { ok: false, code: "INVALID_AMOUNT", message: "Valor deve ser maior que zero.", missing: ["amount"] };
  class CashWithdrawalUseCase extends PreparedWriteUseCase {
    constructor(dependencies = {}) { super({ prepareAction: "cash.prepare_withdrawal", commitAction: "cash.commit_withdrawal", permission: "simple_cashier", capability: "CASH.WITHDRAWAL", validate: moneyValidation, buildPlan: (i) => ({ amount: Number(i.amount), description: String(i.description || "Sangria") }), commit: (p, c, d) => d.withdraw(p.preview, c) }, dependencies); }
  }
  class CashDepositUseCase extends PreparedWriteUseCase {
    constructor(dependencies = {}) { super({ prepareAction: "cash.prepare_deposit", commitAction: "cash.commit_deposit", permission: "simple_cashier", capability: "CASH.DEPOSIT", validate: moneyValidation, buildPlan: (i) => ({ amount: Number(i.amount), description: String(i.description || "Suprimento") }), commit: (p, c, d) => d.deposit(p.preview, c) }, dependencies); }
  }
  class CashCloseSessionUseCase extends PreparedWriteUseCase {
    constructor(dependencies = {}) { super({ prepareAction: "cash.prepare_close_session", commitAction: "cash.close_session", permission: "simple_cashier", capability: "CASH.CLOSE_SESSION", loadTarget: (i, d) => d.loadSession?.(i.sessionId), validate: (i) => Number.isFinite(Number(i.countedAmount)) ? { ok: true } : { ok: false, code: "INVALID_AMOUNT", message: "Valor contado é obrigatório.", missing: ["countedAmount"] }, buildPlan: (i, session) => ({ sessionId: String(session.id), countedAmount: Number(i.countedAmount), expectedAmount: Number(session.expectedAmount || 0) }), commit: (p, c, d) => d.closeSession(p.preview, c) }, dependencies); }
  }
  class ProductionPrepareUseCase extends PreparedWriteUseCase {
    constructor(dependencies = {}) { super({ prepareAction: "production.prepare_job", commitAction: "production.commit_job", permission: "basic_production", capability: "PRODUCTION.PREPARE", loadTarget: (i, d) => d.loadOrder?.(i.orderId), buildPlan: (i, order) => ({ orderId: String(order.id), printerId: String(i.printerId || ""), status: "queued" }), commit: (p, c, d) => d.createJob(p.preview, c) }, dependencies); }
  }
  class ProductionChangeStatusUseCase extends PreparedWriteUseCase {
    constructor(dependencies = {}) { super({ prepareAction: "production.prepare_change_status", commitAction: "production.change_status", permission: "basic_production", capability: "PRODUCTION.CHANGE_STATUS", loadTarget: (i, d) => d.loadJob?.(i.jobId), validate: (i) => i.status ? { ok: true } : { ok: false, code: "INVALID_STATUS", message: "Status é obrigatório.", missing: ["status"] }, buildPlan: (i, job) => ({ jobId: String(job.id), from: String(job.status || ""), to: String(i.status) }), commit: (p, c, d) => d.changeStatus(p.preview, c) }, dependencies); }
  }

  const api = Object.freeze({ PersistentIdempotencyStore, PreparedWriteUseCase, InventoryReserveUseCase, InventoryReleaseUseCase, InventoryConsumeUseCase, CashWithdrawalUseCase, CashDepositUseCase, CashCloseSessionUseCase, ProductionPrepareUseCase, ProductionChangeStatusUseCase });
  global.Simplifica3dOperationalUseCases = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
