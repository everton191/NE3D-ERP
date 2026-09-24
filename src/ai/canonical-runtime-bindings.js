(function attachCanonicalRuntimeBindings(global) {
  "use strict";
  const registry = global.SimplificaActionRegistry || (typeof require === "function" ? require("./action-registry.js") : null);
  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const compactItems = (items, max = 12) => (Array.isArray(items) ? items : []).slice(0, max).map((item) => ({ id: String(item.id || ""), label: String(item.name || item.title || item.customerName || item.id || ""), status: String(item.status || ""), quantity: Number(item.quantity) || 0, unit: String(item.unit || "") }));
  const result = (status, data = {}, extra = {}) => Object.freeze({ status, ...clone(data), ...clone(extra) });

  function create({ readFacade, prepareOrder = null, navigate = null } = {}) {
    if (!readFacade || typeof readFacade !== "object") throw new Error("AI_READ_FACADE_REQUIRED");
    const bindings = Object.freeze({
      "navigation.open": (args) => typeof navigate === "function" ? result("SUCCESS", { route: String(args.tela || "") }) : result("GAP_BLOCKED", {}, { reason: "NAVIGATION_BRIDGE_UNAVAILABLE" }),
      "orders.search": (args) => { const items = compactItems(readFacade.searchOrdersReadOnly?.(args.query || args.customer || args.status || "", 20)); return result(items.length ? "SUCCESS" : "NOT_FOUND", { items }); },
      "orders.get": (args) => { const item = compactItems(readFacade.searchOrdersReadOnly?.(String(args.order_id || ""), 20), 1)[0] || null; return result(item ? "SUCCESS" : "NOT_FOUND", { item }); },
      "customers.search": (args) => { const items = compactItems(readFacade.searchCustomers?.(args.query || ""), 8); return result(items.length ? "SUCCESS" : "NOT_FOUND", { items }); },
      "inventory.search": (args) => { const items = compactItems(readFacade.searchStock?.(args.query || args.status || "")); return result(items.length ? "SUCCESS" : "NOT_FOUND", { items }); },
      "cash.get_summary": (args) => { const value = readFacade.cashSummaryReadOnly?.(args.period || "all"); return value ? result("SUCCESS", { summary: { period: String(value.period || args.period || "all"), sales: Number(value.sales) || 0, orders: Number(value.orders) || 0, entries: Number(value.entradas) || 0, exits: Number(value.saidas) || 0, balance: Number(value.saldo) || 0 } }) : result("GAP_BLOCKED"); },
      "calculator.quote": (args) => { const value = readFacade.calculatePrice?.({ weightGrams: args.weight_grams, timeMinutes: args.time_minutes, quantity: args.quantity }); return value ? result("SUCCESS", { quote: { unitPrice: Number(value.unitPrice ?? value.precoFinal) || 0, totalPrice: Number(value.totalPrice ?? value.valorFinal) || 0, warnings: Array.isArray(value.warnings) ? value.warnings.slice(0, 3) : [] } }) : result("GAP_BLOCKED"); },
      "production.list_queue": (args) => {
        if (typeof readFacade.searchProductionJobsReadOnly !== "function") return result("GAP_BLOCKED", {}, { reason: "PRODUCTION_QUEUE_READ_UNAVAILABLE" });
        const rows = readFacade.searchProductionJobsReadOnly(args.status || "all");
        if (!Array.isArray(rows)) return result("DEPENDENCY_ERROR", {}, { reason: "PRODUCTION_QUEUE_READ_INVALID" });
        const items = compactItems(rows);
        const value = readFacade.productionSummaryReadOnly?.();
        const summary = value ? { active: Number(value.active) || 0, total: Number(value.total) || 0 } : null;
        return result(items.length ? "SUCCESS" : "NOT_FOUND", { items, summary });
      },
      "products.search": (args) => { const items = compactItems(readFacade.searchProductsReadOnly?.(args.query || "")); return result(items.length ? "SUCCESS" : "NOT_FOUND", { items }); },
      "printers.search": (args) => { const items = compactItems(readFacade.searchPrintersReadOnly?.(args.query || "", args.status || "")); return result(items.length ? "SUCCESS" : "NOT_FOUND", { items }); },
      "orders.prepare_create": (args, context) => typeof prepareOrder === "function" ? prepareOrder(args, context) : result("GAP_BLOCKED", {}, { reason: "ORDER_PREPARE_BRIDGE_UNAVAILABLE" })
    });
    function execute(actionId, args = {}, context = {}) {
      const action = registry?.get?.(actionId);
      if (!action) return result("VALIDATION_ERROR", {}, { reason: "UNKNOWN_ACTION" });
      if (action.operationType === registry.OPERATION.WRITE) return result("GAP_BLOCKED", {}, { reason: "WRITE_DISABLED" });
      const binding = bindings[actionId];
      if (!binding) return result("GAP_BLOCKED", {}, { reason: "EXECUTION_BINDING_UNAVAILABLE" });
      try { return binding(args, context); } catch (_) { return result("DEPENDENCY_ERROR", {}, { reason: "RUNTIME_BOUNDARY_FAILED" }); }
    }
    function validate() {
      const executable = registry.actions.filter((action) => registry.health(action).exposed && action.operationType !== registry.OPERATION.WRITE);
      const missing = executable.filter((action) => typeof bindings[action.id] !== "function").map((action) => action.id);
      return Object.freeze({ ok: missing.length === 0, bound: Object.freeze(Object.keys(bindings)), missing: Object.freeze(missing) });
    }
    return Object.freeze({ bindings, execute, validate });
  }
  const api = Object.freeze({ create });
  global.SimplificaCanonicalRuntimeBindings = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
