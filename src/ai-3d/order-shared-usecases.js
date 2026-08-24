(function attachOrderSharedUseCases(global) {
  "use strict";

  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const ERROR = Object.freeze({
    ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
    ORDER_ALREADY_CANCELLED: "ORDER_ALREADY_CANCELLED",
    ORDER_CANNOT_BE_CANCELLED: "ORDER_CANNOT_BE_CANCELLED",
    INVALID_ORDER_STATUS: "INVALID_ORDER_STATUS",
    INVALID_INPUT: "INVALID_INPUT",
    PERMISSION_DENIED: "PERMISSION_DENIED",
    CONFLICT: "CONFLICT",
    INVENTORY_RESTORE_ERROR: "INVENTORY_RESTORE_ERROR",
    FINANCIAL_REVERSAL_ERROR: "FINANCIAL_REVERSAL_ERROR",
    EXECUTION_FAILED: "EXECUTION_FAILED"
  });

  function envelope(action, success, data = null, errors = [], extra = {}) {
    return Object.freeze({ success, action, data, warnings: [...(extra.warnings || [])], missing: [...(extra.missing || [])], errors: [...errors], nextActions: [...(extra.nextActions || [])] });
  }
  const failure = (action, code, message, extra = {}) => envelope(action, false, null, [{ code, message }], extra);
  const requireFunctions = (dependencies, names) => names.filter((name) => typeof dependencies[name] !== "function");
  const operationKey = (input, prefix) => String(input.operationId || input.idempotencyKey || `${prefix}:${input.orderId || ""}`).trim();

  class EditOrderUseCase {
    constructor(dependencies = {}) { this.dependencies = dependencies; this.committed = new Map(); }
    prepare(input = {}, context = {}) {
      const deps = this.dependencies;
      const missingDeps = requireFunctions(deps, ["loadOrder", "hasPermission", "validateProposed", "describeChanges", "determineEditEffects"]);
      if (missingDeps.length) return failure("orders.prepare_update", ERROR.EXECUTION_FAILED, `Dependências indisponíveis: ${missingDeps.join(", ")}`);
      if (!deps.hasPermission(context, "basic_orders")) return failure("orders.prepare_update", ERROR.PERMISSION_DENIED, "Sem permissão para editar pedidos.");
      const current = deps.loadOrder(input.orderId);
      if (!current) return failure("orders.prepare_update", ERROR.ORDER_NOT_FOUND, "Pedido não encontrado.");
      if (deps.isCancelled?.(current)) return failure("orders.prepare_update", ERROR.ORDER_ALREADY_CANCELLED, "Pedido cancelado não pode ser editado.");
      const proposed = clone(input.proposed);
      const validation = deps.validateProposed(proposed, current) || { ok: true };
      if (!validation.ok) return failure("orders.prepare_update", validation.code || ERROR.INVALID_INPUT, validation.message || "Alteração inválida.", { missing: validation.missing });
      const key = operationKey(input, "order_update");
      if (!key) return failure("orders.prepare_update", ERROR.INVALID_INPUT, "Identificador da operação obrigatório.");
      const changes = deps.describeChanges(proposed, current) || [];
      const effects = deps.determineEditEffects(proposed, current) || { inventory: [], cash: [], production: [] };
      return envelope("orders.prepare_update", true, Object.freeze({ operationId: key, orderId: String(input.orderId), current: clone(current), proposed, changes: clone(changes), effects: clone(effects) }));
    }
    async commit(preparedEnvelope = {}, context = {}) {
      const plan = preparedEnvelope?.data || preparedEnvelope;
      if (!preparedEnvelope?.success || !plan?.operationId) return failure("orders.update", ERROR.INVALID_INPUT, "Plano de edição inválido.");
      if (!this.dependencies.hasPermission?.(context, "basic_orders")) return failure("orders.update", ERROR.PERMISSION_DENIED, "Sem permissão para editar pedidos.");
      if (this.committed.has(plan.operationId)) return this.committed.get(plan.operationId);
      const current = this.dependencies.loadOrder?.(plan.orderId);
      if (!current) return failure("orders.update", ERROR.ORDER_NOT_FOUND, "Pedido não encontrado.");
      if (this.dependencies.versionOf && this.dependencies.versionOf(current) !== this.dependencies.versionOf(plan.current)) return failure("orders.update", ERROR.CONFLICT, "O pedido foi alterado depois da preparação.");
      try {
        const committed = await this.dependencies.commitEdit(plan, context);
        if (!committed?.success) return failure("orders.update", committed?.code || ERROR.EXECUTION_FAILED, committed?.message || "Não foi possível editar o pedido.");
        const result = envelope("orders.update", true, { order: clone(committed.order || plan.proposed), effects: clone(committed.effects || plan.effects), invalidated: clone(committed.invalidated || []) }, [], { warnings: committed.warnings });
        this.committed.set(plan.operationId, result);
        return result;
      } catch (error) { return failure("orders.update", error?.code || ERROR.EXECUTION_FAILED, String(error?.message || error)); }
    }
  }

  class CancelOrderUseCase {
    constructor(dependencies = {}) { this.dependencies = dependencies; this.committed = new Map(); }
    prepare(input = {}, context = {}) {
      const deps = this.dependencies;
      const missingDeps = requireFunctions(deps, ["loadOrder", "hasPermission", "determineCancelEffects"]);
      if (missingDeps.length) return failure("orders.prepare_cancel", ERROR.EXECUTION_FAILED, `Dependências indisponíveis: ${missingDeps.join(", ")}`);
      if (!deps.hasPermission(context, "basic_orders")) return failure("orders.prepare_cancel", ERROR.PERMISSION_DENIED, "Sem permissão para cancelar pedidos.");
      const order = deps.loadOrder(input.orderId);
      if (!order) return failure("orders.prepare_cancel", ERROR.ORDER_NOT_FOUND, "Pedido não encontrado.");
      if (deps.isCancelled?.(order)) return failure("orders.prepare_cancel", ERROR.ORDER_ALREADY_CANCELLED, "Pedido já cancelado.");
      const policy = deps.canCancel?.(order, input) || { allowed: true };
      if (!policy.allowed) return failure("orders.prepare_cancel", policy.code || ERROR.ORDER_CANNOT_BE_CANCELLED, policy.message || "Pedido não pode ser cancelado.");
      const key = operationKey(input, "order_cancel");
      if (!key) return failure("orders.prepare_cancel", ERROR.INVALID_INPUT, "Identificador da operação obrigatório.");
      const effects = deps.determineCancelEffects(order, input) || {};
      const plan = {
        operationId: key, orderId: String(input.orderId), current: clone(order), currentStatus: String(order.status || "aberto"), targetStatus: "cancelado",
        reason: String(input.reason || "Cancelamento manual"), inventory: clone(effects.inventory || { releaseReservations: [], restoreConsumption: [] }),
        financial: clone(effects.financial || { reverseOperations: [] }), production: clone(effects.production || { cancelJobs: [] }), warnings: clone(effects.warnings || [])
      };
      return envelope("orders.prepare_cancel", true, Object.freeze(plan), [], { warnings: plan.warnings });
    }
    async commit(preparedEnvelope = {}, context = {}) {
      const plan = preparedEnvelope?.data || preparedEnvelope;
      if (!preparedEnvelope?.success || !plan?.operationId) return failure("orders.cancel", ERROR.INVALID_INPUT, "Plano de cancelamento inválido.");
      if (!this.dependencies.hasPermission?.(context, "basic_orders")) return failure("orders.cancel", ERROR.PERMISSION_DENIED, "Sem permissão para cancelar pedidos.");
      if (this.committed.has(plan.operationId)) return this.committed.get(plan.operationId);
      const current = this.dependencies.loadOrder?.(plan.orderId);
      if (!current) return failure("orders.cancel", ERROR.ORDER_NOT_FOUND, "Pedido não encontrado.");
      if (this.dependencies.isCancelled?.(current)) {
        const already = envelope("orders.cancel", true, { order: clone(current), effects: { alreadyCancelled: true }, invalidated: [] }, [], { warnings: [{ code: ERROR.ORDER_ALREADY_CANCELLED, message: "Pedido já estava cancelado." }] });
        this.committed.set(plan.operationId, already); return already;
      }
      try {
        const committed = await this.dependencies.commitCancellation(plan, context);
        if (!committed?.success) return failure("orders.cancel", committed?.code || ERROR.EXECUTION_FAILED, committed?.message || "Não foi possível cancelar o pedido.");
        const result = envelope("orders.cancel", true, { order: clone(committed.order), effects: clone(committed.effects), invalidated: clone(committed.invalidated || []) }, [], { warnings: committed.warnings });
        this.committed.set(plan.operationId, result);
        return result;
      } catch (error) { return failure("orders.cancel", error?.code || ERROR.EXECUTION_FAILED, String(error?.message || error)); }
    }
  }

  const api = Object.freeze({ ERROR, EditOrderUseCase, CancelOrderUseCase, envelope });
  global.Simplifica3dOrderSharedUseCases = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
