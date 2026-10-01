(function attachSimplificaIntentRegistry(global) {
  "use strict";

  const STATUS = Object.freeze(["READY", "PARTIAL", "DEGRADED", "NOT_IMPLEMENTED"]);
  const MODE = Object.freeze(["READ", "PREPARE", "WRITE", "PREPARE_WRITE"]);
  const definition = (id, status, mode, options = {}) => Object.freeze({
    id, domain: id.split(".")[0], description: options.description || id,
    aliases: Object.freeze(options.aliases || []), positiveExamples: Object.freeze(options.positiveExamples || []), negativeExamples: Object.freeze(options.negativeExamples || []),
    requiredEntities: Object.freeze(options.requiredEntities || []), optionalEntities: Object.freeze(options.optionalEntities || []),
    requiredFields: Object.freeze(options.requiredFields || []), optionalFields: Object.freeze(options.optionalFields || []),
    availableWhen: options.availableWhen || "always", workflowId: options.workflowId || id, screenRoute: options.screenRoute || "",
    mode, requiresConfirmation: options.requiresConfirmation === true, status, actionIds: Object.freeze(options.actionIds || [])
  });
  const definitions = Object.freeze([
    definition("navigation.open", "READY", "READ", { requiredFields: ["tela"], actionIds: ["navigation.open"] }),
    definition("customers.search", "READY", "READ", { description: "Buscar cliente, cadastro ou contato pelo nome", requiredFields: ["query"], aliases: ["CUSTOMER.SEARCH"], actionIds: ["customers.search"] }),
    definition("customers.get", "NOT_IMPLEMENTED", "READ", { requiredEntities: ["customer"], requiredFields: ["customerId"] }),
    definition("customers.create", "NOT_IMPLEMENTED", "WRITE", { requiredFields: ["name", "contact"], aliases: ["CUSTOMER.CREATE"], requiresConfirmation: true }),
    definition("customers.update", "NOT_IMPLEMENTED", "WRITE", { requiredEntities: ["customer"], requiredFields: ["customerId", "changes"], aliases: ["CUSTOMER.UPDATE"], requiresConfirmation: true }),
    definition("orders.list", "READY", "READ", { optionalFields: ["query", "status", "customer"], aliases: ["ORDER.SEARCH"], actionIds: ["orders.search"] }),
    definition("orders.get", "READY", "READ", { requiredEntities: ["order"], requiredFields: ["orderId"], aliases: ["ORDER.HISTORY"], actionIds: ["orders.get"] }),
    definition("orders.create", "PARTIAL", "PREPARE_WRITE", { requiredEntities: ["customer"], requiredFields: ["customerId", "description", "quantity", "unitPrice"], optionalFields: ["weightGrams", "notes"], aliases: ["ORDER.CREATE"], requiresConfirmation: true, actionIds: ["orders.prepare_create", "orders.commit_create"] }),
    definition("orders.update", "DEGRADED", "PREPARE_WRITE", { requiredEntities: ["order"], requiredFields: ["orderId", "changes", "idempotencyKey"], aliases: ["ORDER.UPDATE"], requiresConfirmation: true, actionIds: ["orders.prepare_update", "orders.update"] }),
    definition("orders.cancel", "DEGRADED", "PREPARE_WRITE", { requiredEntities: ["order"], requiredFields: ["orderId", "reason", "idempotencyKey"], aliases: ["ORDER.CANCEL"], requiresConfirmation: true, actionIds: ["orders.prepare_cancel", "orders.cancel"] }),
    definition("calculator.calculate", "READY", "READ", { requiredFields: ["weightGrams", "timeMinutes", "quantity"], aliases: ["PRICE.CALCULATE"], actionIds: ["calculator.quote"] }),
    definition("calculator.create_order", "PARTIAL", "PREPARE", { requiredFields: ["currentCalculation"], optionalEntities: ["customer"], requiresConfirmation: true, actionIds: ["orders.prepare_create"] }),
    definition("inventory.search", "READY", "READ", { requiredFields: ["query"], aliases: ["STOCK.SEARCH"], actionIds: ["inventory.search"] }),
    definition("inventory.get_stock", "PARTIAL", "READ", { requiredEntities: ["material"], requiredFields: ["materialId"], aliases: ["STOCK.SUMMARY"], actionIds: ["inventory.search"] }),
    definition("inventory.low_stock", "PARTIAL", "READ", { optionalFields: ["status"], actionIds: ["inventory.search"] }),
    definition("inventory.entry", "NOT_IMPLEMENTED", "WRITE", { requiredEntities: ["material"], requiredFields: ["materialId", "quantity"], aliases: ["STOCK.ADD"], requiresConfirmation: true }),
    definition("inventory.adjust", "DEGRADED", "PREPARE_WRITE", { requiredEntities: ["material"], requiredFields: ["materialId", "quantity", "reason"], aliases: ["STOCK.REMOVE"], requiresConfirmation: true, actionIds: ["inventory.prepare_consume", "inventory.consume"] }),
    definition("production.list", "READY", "READ", { description: "Listar trabalhos, peças e jobs da fila de produção", optionalFields: ["status"], aliases: ["PRODUCTION.SEARCH"], actionIds: ["production.list_queue"] }),
    definition("production.get", "NOT_IMPLEMENTED", "READ", { requiredEntities: ["job"], requiredFields: ["jobId"] }),
    definition("production.start", "DEGRADED", "PREPARE_WRITE", { requiredFields: ["jobId", "printerId"], requiresConfirmation: true, actionIds: ["production.prepare_job", "production.commit_job"] }),
    definition("production.change_status", "DEGRADED", "PREPARE_WRITE", { requiredFields: ["jobId", "status"], requiresConfirmation: true, actionIds: ["production.prepare_change_status", "production.change_status"] }),
    definition("cash.get_status", "READY", "READ", { description: "Consultar situação, saldo, entradas e saídas do caixa", optionalFields: ["period"], aliases: ["CASH.SUMMARY"], actionIds: ["cash.get_summary"] }),
    definition("cash.open", "DEGRADED", "WRITE", { requiredFields: ["openingAmount"], requiresConfirmation: true, actionIds: ["cash.open_session"] }),
    definition("cash.withdraw", "DEGRADED", "PREPARE_WRITE", { requiredFields: ["amount", "description"], requiresConfirmation: true, actionIds: ["cash.prepare_withdrawal", "cash.commit_withdrawal"] }),
    definition("cash.close", "DEGRADED", "PREPARE_WRITE", { requiredFields: ["sessionId", "countedAmount"], requiresConfirmation: true, actionIds: ["cash.prepare_close_session", "cash.close_session"] }),
    definition("reports.sales", "PARTIAL", "READ", { description: "Relatório de vendas, faturamento e desempenho comercial por período", optionalFields: ["period"], actionIds: ["reports.open"] }),
    definition("reports.financial", "PARTIAL", "READ", { description: "Relatório financeiro de receitas, despesas, lucro e balanço por período", optionalFields: ["period"], actionIds: ["reports.open"] }),
    definition("storefront.get_status", "NOT_IMPLEMENTED", "READ", { optionalFields: ["storeId"] }),
    definition("storefront.products", "PARTIAL", "READ", { optionalFields: ["query", "storeId"], actionIds: ["products.search"] }),
    definition("printers.list", "READY", "READ", { description: "Listar ou buscar impressoras e máquinas 3D cadastradas", optionalFields: ["query", "status"], actionIds: ["printers.search"] }),
    definition("printers.get", "PARTIAL", "READ", { requiredEntities: ["printer"], requiredFields: ["printerId"], actionIds: ["printers.search"] }),
    definition("documents.order_pdf", "NOT_IMPLEMENTED", "READ", { requiredEntities: ["order"], requiredFields: ["orderId"] }),
    definition("documents.share_order", "NOT_IMPLEMENTED", "READ", { requiredEntities: ["order"], requiredFields: ["orderId", "channel"] }),
    definition("admin.open", "NOT_IMPLEMENTED", "READ", { screenRoute: "admin" })
  ]);
  const byId = new Map(definitions.map((item) => [item.id, item]));
  const aliases = new Map(definitions.flatMap((item) => item.aliases.map((alias) => [alias, item.id])));
  // A shared PREPARE tool keeps the primary orders.create meaning; secondary
  // calculator.create_order remains represented by its own workflow context.
  const actionMap = new Map();
  for (const item of definitions) for (const actionId of item.actionIds) if (!actionMap.has(actionId)) actionMap.set(actionId, item.id);
  function resolveIntentId(id) { const value = String(id || "").trim(); return byId.has(value) ? value : aliases.get(value) || null; }
  function validateIntentRegistry(items = definitions) {
    const ids = new Set(); const knownWorkflows = new Set(items.map((item) => item?.id)); const errors = [];
    for (const item of items) { if (!item?.id || ids.has(item.id)) errors.push(`DUPLICATE_OR_MISSING_ID:${item?.id || ""}`); ids.add(item?.id); if (!item.domain) errors.push(`MISSING_DOMAIN:${item.id}`); if (!STATUS.includes(item.status)) errors.push(`INVALID_STATUS:${item.id}`); if (!MODE.includes(item.mode)) errors.push(`INVALID_MODE:${item.id}`); if (!item.workflowId || !knownWorkflows.has(item.workflowId)) errors.push(`INVALID_WORKFLOW:${item.id}`); if (item.screenRoute && !/^[a-z][a-z0-9_.-]*$/.test(item.screenRoute)) errors.push(`INVALID_SCREEN_ROUTE:${item.id}`); }
    return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), count: items.length });
  }
  const api = Object.freeze({ STATUS, MODE, definitions, get: (id) => byId.get(resolveIntentId(id)), resolveIntentId, intentForAction: (actionId) => actionMap.get(actionId) || null, actionsForIntent: (id) => byId.get(resolveIntentId(id))?.actionIds || Object.freeze([]), validateIntentRegistry });
  global.SimplificaIntentRegistry = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
