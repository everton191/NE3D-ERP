(function attachOrderCreateExecutor(global) {
  "use strict";

  const STATUS = Object.freeze({ COMMITTED: "COMMITTED", ALREADY_COMMITTED: "ALREADY_COMMITTED", BLOCKED: "BLOCKED", ROLLED_BACK: "ROLLED_BACK" });

  class OrderCreateExecutionError extends Error {
    constructor(code, message, cause = null) {
      super(message);
      this.name = "OrderCreateExecutionError";
      this.code = code;
      this.cause = cause;
    }
  }

  class OrderCreateTransactionExecutor {
    constructor(dependencies = {}) {
      this.dependencies = dependencies;
      this.executing = new Set();
    }

    async execute(command = {}) {
      const deps = this.dependencies;
      const required = ["captureState", "restoreState", "applyStock", "commitOrder", "createCashReceipt", "commitCashReceipt", "persist"];
      const missing = required.filter((name) => typeof deps[name] !== "function");
      if (missing.length) throw new OrderCreateExecutionError("DEPENDENCY_UNAVAILABLE", `Executor indisponível: ${missing.join(", ")}`);

      const order = command.order;
      const transactionKey = String(command.transactionKey || order?.client_request_id || order?.operation_uuid || order?.id || "").trim();
      if (!order || !transactionKey) throw new OrderCreateExecutionError("INVALID_COMMAND", "Pedido preparado inválido.");
      if (typeof deps.isCommitted === "function" && deps.isCommitted(transactionKey, order)) {
        return { status: STATUS.ALREADY_COMMITTED, transactionKey, order, cashReceipt: null, sideEffects: 0 };
      }
      if (this.executing.has(transactionKey)) return { status: STATUS.BLOCKED, reason: "EXECUTION_IN_PROGRESS", transactionKey, sideEffects: 0 };

      this.executing.add(transactionKey);
      const snapshot = deps.captureState();
      let committed = false;
      try {
        const stockApplied = await deps.applyStock(order, command.previousOrder || null);
        if (!stockApplied) throw new OrderCreateExecutionError("STOCK_REJECTED", "O estoque não permitiu concluir o pedido.");

        deps.commitOrder(order, command.previousOrder || null);
        const cashReceipt = await deps.createCashReceipt(order, command);
        if (cashReceipt) deps.commitCashReceipt(cashReceipt);
        await deps.persist(order, command);
        committed = true;

        const warnings = [];
        if (typeof deps.afterCommit === "function") {
          try { await deps.afterCommit({ order, cashReceipt, command, transactionKey }); }
          catch (error) { warnings.push({ code: "AFTER_COMMIT_FAILED", message: String(error?.message || error) }); }
        }
        return { status: STATUS.COMMITTED, transactionKey, order, cashReceipt: cashReceipt || null, sideEffects: cashReceipt ? 3 : 2, warnings };
      } catch (error) {
        if (!committed) {
          try {
            deps.restoreState(snapshot);
            if (typeof deps.persistRollback === "function") await deps.persistRollback();
          } catch (rollbackError) {
            throw new OrderCreateExecutionError("ROLLBACK_FAILED", "Não foi possível restaurar o estado anterior do pedido.", { error, rollbackError });
          }
        }
        return { status: STATUS.ROLLED_BACK, transactionKey, reason: error?.code || "EXECUTION_FAILED", error, sideEffects: 0 };
      } finally {
        this.executing.delete(transactionKey);
      }
    }
  }

  global.Simplifica3dOrderCreateExecutor = Object.freeze({ STATUS, OrderCreateExecutionError, OrderCreateTransactionExecutor });
  if (typeof module !== "undefined" && module.exports) module.exports = global.Simplifica3dOrderCreateExecutor;
})(typeof window !== "undefined" ? window : globalThis);
