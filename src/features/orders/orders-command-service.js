(function attachOrdersCommandService(global) {
  "use strict";
  function statusConsumesStock(status = "") { return /confirm|aprov|produ[cç][aã]o|em_producao|final|conclu|entreg|pago/i.test(String(status || "")); }
  function diffStockConsumption(nextOrder = {}, previousOrder = null, deps = {}) {
    const calculateConsumption = deps.calculateConsumption;
    const wasDeducted = deps.wasDeducted;
    const next = statusConsumesStock(nextOrder.status) ? calculateConsumption(nextOrder.itens || []) : new Map();
    const previous = previousOrder && wasDeducted(previousOrder) ? calculateConsumption(previousOrder.itens || []) : new Map();
    const ids = new Set([...next.keys(), ...previous.keys()]);
    return Array.from(ids).map((materialId) => ({ materialId, quantidade: (next.get(materialId) || 0) - (previous.get(materialId) || 0) })).filter((item) => Math.abs(item.quantidade) > 0.000001);
  }
  function createCashReceipt(order, value, kind = "entrada", metadata = null, deps = {}) {
    const safeValue = Math.max(0, Number(value) || 0);
    if (safeValue <= 0.009) return null;
    const now = deps.now ? deps.now() : new Date().toISOString();
    const session = deps.openCashSession("pedido");
    const method = deps.normalizePaymentMethod(order?.paymentMethod || order?.payment_method || order?.formaPagamento || "pix");
    const operation = metadata || deps.createOperationMetadata("pedido_recebimento", { id: order?.id, total: safeValue, status: order?.status, cliente: deps.customerName(order) }, { createdAt: now });
    return deps.prepareOnlineRecord({ id: deps.createId(), tipo: "entrada", valor: safeValue, descricao: `${kind === "quitacao" ? "Quitação" : "Entrada"} pedido #${order.id} - ${deps.customerName(order)}`, pedidoId: order.id, orderPaymentKind: kind, cash_session_id: session?.id || "", cashSessionId: session?.id || "", payment_method_id: method.id, paymentMethodId: method.id, paymentMethod: method.name, payment_method_type: method.type, ...operation, data: now, criadoEm: now, atualizadoEm: now });
  }
  function createCashReversal(order, movements = [], now = "", deps = {}) {
    if (!movements.length || movements.some((movement) => String(movement.cancelamentoPedidoId || movement.estornoPedidoId || "") === String(order.id))) return null;
    const balance = movements.reduce((sum, movement) => sum + (String(movement.tipo || "").toLowerCase() === "saida" ? -1 : 1) * (Number(movement.valor) || 0), 0);
    if (Math.abs(balance) < 0.01) return null;
    return deps.prepareOnlineRecord({ id: deps.createId(), tipo: balance > 0 ? "saida" : "entrada", valor: Math.abs(balance), descricao: `Estorno pedido #${order.id} - ${deps.customerName(order)}`, pedidoId: order.id, cancelamentoPedidoId: order.id, categoria: "estorno", data: now, criadoEm: now, atualizadoEm: now });
  }
  function determineEditEffects(proposed, current, deps = {}) {
    const inventory = diffStockConsumption(proposed, current, { calculateConsumption: deps.calculateConsumption, wasDeducted: deps.wasDeducted }).map((item) => ({ type: item.quantidade >= 0 ? "consume" : "restoreConsumption", ...item }));
    const cashBefore = deps.registeredCash(current);
    const cashAfter = deps.receivedCash(proposed);
    const cash = Math.abs(cashAfter - cashBefore) > 0.009 ? [{ type: cashAfter > cashBefore ? "receive" : "review_reversal", amount: Math.abs(cashAfter - cashBefore) }] : [];
    const production = deps.productionJobs().some((job) => String(job.orderId || job.order_id) === String(current.id) && job.status !== "cancelado") ? [{ type: "review_jobs", orderId: String(current.id) }] : [];
    return { inventory, cash, production };
  }
  function determineCancelEffects(order, input = {}, deps = {}) {
    const jobs = deps.productionJobs().filter((job) => String(job.orderId || job.order_id) === String(order.id) && job.status !== "cancelado");
    const partiallyProduced = jobs.some((job) => Math.max(0, Number(job.completedQuantity || job.completed_quantity) || 0) > 0 || ["pos_processamento", "pronto_para_entrega", "entregue"].includes(job.status));
    const canRestore = input.returnStock === true && deps.wasDeducted(order) && !order.stock_returned_at && !order.estoqueDevolvidoEm && !partiallyProduced;
    const movements = deps.orderMovements(order).filter((movement) => !deps.cashMovementCancelled(movement));
    return { inventory: { releaseReservations: [], restoreConsumption: canRestore ? diffStockConsumption({ itens: [] }, order, { calculateConsumption: deps.calculateConsumption, wasDeducted: deps.wasDeducted }) : [] }, financial: { reverseOperations: movements.map((movement) => ({ movementId: movement.id, amount: Number(movement.valor) || 0 })) }, production: { cancelJobs: jobs.filter((job) => !["entregue", "cancelado"].includes(job.status)).map((job) => ({ jobId: job.id, previousStatus: job.status })) }, warnings: partiallyProduced && input.returnStock === true ? [{ code: "PARTIAL_PRODUCTION_STOCK_REVIEW", message: "Há produção iniciada; o consumo não será restaurado automaticamente." }] : [] };
  }
  function createTransactionExecutor(deps = {}) {
    const Executor = deps.Executor;
    if (!Executor?.OrderCreateTransactionExecutor) throw new Error("ORDER_CREATE_EXECUTOR_UNAVAILABLE");
    return new Executor.OrderCreateTransactionExecutor({
      captureState: deps.captureState,
      restoreState: deps.restoreState,
      applyStock: deps.applyStock,
      commitOrder: deps.commitOrder,
      createCashReceipt: deps.createCashReceipt,
      commitCashReceipt: deps.commitCashReceipt,
      persist: deps.persist,
      persistRollback: deps.persistRollback,
      isCommitted: deps.isCommitted,
      afterCommit: deps.afterCommit
    });
  }
  async function executeCancelPlan(plan, deps = {}) {
    const snapshot = deps.captureState();
    try {
      const order = deps.loadOrder(plan.orderId);
      const now = deps.now();
      let inventoryChanged = false;
      if (plan.inventory.restoreConsumption.length) {
        inventoryChanged = deps.restoreStock(plan.inventory.restoreConsumption.map((item) => ({ ...item, orderItemId: item.materialId })), order);
        if (!inventoryChanged) throw Object.assign(new Error("Não foi possível restaurar o estoque."), { code: "INVENTORY_RESTORE_ERROR" });
      }
      const movements = deps.orderMovements(order);
      const reversal = deps.createCashReversal(order, movements, now);
      if (reversal) deps.commitCashReversal(reversal);
      const cancelJobIds = new Set(plan.production.cancelJobs.map((item) => String(item.jobId)));
      deps.cancelProductionJobs(cancelJobIds, now, plan.reason);
      const cancelled = deps.markCancelled(order, { now, inventoryChanged, reversal, reason: plan.reason });
      deps.commitCancelledOrder(cancelled, plan.orderId);
      deps.afterCancel(cancelled, reversal);
      deps.persist();
      deps.scheduleSync("pedido-cancelado");
      return { success: true, order: cancelled, effects: { inventoryChanged, cashChanged: !!reversal, cashMovements: movements.length, productionChanged: cancelJobIds.size > 0 }, invalidated: ["orders", `order:${plan.orderId}`, "dashboard", "cash-summary", "inventory", "production"] };
    } catch (error) { deps.restoreState(snapshot); deps.persist(); throw error; }
  }
  async function executeEditPlan(plan, deps = {}) {
    const proposed = plan.proposed;
    const current = deps.loadOrder(plan.orderId);
    const execution = await deps.transactionExecutor().execute({ transactionKey: plan.operationId, order: proposed, previousOrder: current, cashRegisteredBefore: deps.registeredCash(current), financialSummary: deps.financialSummary(proposed), operationMetadata: deps.operationMetadata(proposed) });
    if (!["COMMITTED", "ALREADY_COMMITTED"].includes(execution.status)) return { success: false, code: execution.reason || "EXECUTION_FAILED", message: execution.error?.message || "Falha ao atualizar pedido." };
    deps.scheduleSync("pedido-atualizado");
    return { success: true, order: execution.order || proposed, effects: { ...plan.effects, inventoryChanged: plan.effects.inventory.length > 0, cashChanged: !!execution.cashReceipt, productionChanged: plan.effects.production.length > 0, cashReceipt: execution.cashReceipt || null }, invalidated: ["orders", `order:${plan.orderId}`, "dashboard", "cash-summary", "inventory"], warnings: execution.warnings || [] };
  }
  const api = Object.freeze({ statusConsumesStock, diffStockConsumption, createCashReceipt, createCashReversal, determineEditEffects, determineCancelEffects, createTransactionExecutor, executeCancelPlan, executeEditPlan });
  global.SimplificaOrdersCommandService = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
