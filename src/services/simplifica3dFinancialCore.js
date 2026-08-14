(function attachSimplifica3dFinancialCore(global) {
  "use strict";

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const SALE_EXCLUDED_STATUSES = new Set(["cancelado", "cancelled", "orcamento", "orçamento", "rascunho", "draft"]);
  const CASH_ENTRY_TYPES = new Set(["sale", "suprimento", "adjustment", "opening"]);
  const CASH_EXIT_TYPES = new Set(["sangria", "retirada", "estorno", "closing"]);

  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const normalizeText = (value) => String(value == null ? "" : value).trim();
  const normalizeStatus = (value) => normalizeText(value || "aberto").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const timestamp = (value) => {
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? parsed : 0;
  };

  function moneyToCents(value) {
    const parsed = typeof value === "string" ? Number(value.replace(/\./g, "").replace(",", ".")) : Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.round((parsed + Number.EPSILON) * 100);
  }

  function centsToMoney(value) {
    return Math.round(Number(value) || 0) / 100;
  }

  function stableHash(value = "") {
    const source = normalizeText(value);
    let first = 0x811c9dc5;
    let second = 0x9e3779b9;
    for (let index = 0; index < source.length; index += 1) {
      first = Math.imul(first ^ source.charCodeAt(index), 16777619);
      second = Math.imul(second ^ source.charCodeAt(index), 2246822519);
    }
    const part = (number) => (number >>> 0).toString(16).padStart(8, "0");
    return `${part(first)}${part(second)}${part(first ^ second)}${part(Math.imul(first, 31) ^ second)}`;
  }

  function uuidFrom(value) {
    const normalized = normalizeText(value).toLowerCase();
    if (UUID_RE.test(normalized)) return normalized;
    const hex = stableHash(normalized || "simplifica-financial-operation").slice(0, 32).split("");
    hex[12] = "5";
    hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
    return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20, 32).join("")}`;
  }

  function isUuid(value) {
    return UUID_RE.test(normalizeText(value));
  }

  function isOrderSaleEligible(order = {}) {
    if (order.deleted_at || order.deletedAt) return false;
    return !SALE_EXCLUDED_STATUSES.has(normalizeStatus(order.status));
  }

  function orderDate(order = {}) {
    return order.criadoEm || order.createdAt || order.created_at || order.dataHora || order.data || order.updatedAt || order.updated_at || "";
  }

  function operationPayload(operation = {}) {
    if (operation.payload_json && typeof operation.payload_json === "object") return operation.payload_json;
    if (typeof operation.payload_json === "string") {
      try { return JSON.parse(operation.payload_json); }
      catch (_) { return {}; }
    }
    return operation.payload && typeof operation.payload === "object" ? operation.payload : {};
  }

  function buildOrderFinancialEvent({ order = {}, cashReceipt = null, companyId = "", eventType = "upsert" } = {}) {
    const orderId = normalizeText(order.id || order.sale_id);
    if (!orderId) throw new Error("FINANCIAL_ORDER_ID_REQUIRED");
    if (!isUuid(companyId)) throw new Error("FINANCIAL_COMPANY_UUID_REQUIRED");

    const eligible = isOrderSaleEligible(order);
    const totalCents = eligible ? moneyToCents(order.total) : 0;
    const movementCents = cashReceipt ? Math.max(0, moneyToCents(cashReceipt.valor ?? cashReceipt.amount)) : 0;
    const cancelling = eventType === "cancel" || !eligible;
    const receivedCents = cancelling ? 0 : movementCents;
    const refundCents = cancelling ? movementCents : 0;
    const baseOperationSeed = order.operation_uuid || order.operationUuid || order.client_request_id || order.clientRequestId || `${companyId}:${orderId}`;
    const operationSeed = cancelling
      ? `${baseOperationSeed}:cancel:${order.deleted_at || order.deletedAt || order.updated_at || order.updatedAt || orderDate(order)}`
      : baseOperationSeed;
    const operationUuid = uuidFrom(operationSeed);
    const clientRequestId = cancelling
      ? `order_cancel:${companyId}:${orderId}:${operationUuid}`
      : normalizeText(order.client_request_id || order.clientRequestId || `order_financial:${companyId}:${orderId}:${operationUuid}`);
    const requestHash = cancelling
      ? stableHash(JSON.stringify({ orderId, eventType: "cancel", refundCents, operationUuid, status: normalizeStatus(order.status) }))
      : normalizeText(order.request_hash || order.requestHash || stableHash(JSON.stringify({ orderId, eventType, totalCents, receivedCents, status: normalizeStatus(order.status) })));
    const paymentType = normalizeStatus(cashReceipt?.payment_method_type || cashReceipt?.paymentMethod || order.payment_method_type || order.paymentMethod || "pix");

    return Object.freeze({
      orderId,
      companyId,
      operationUuid,
      clientRequestId,
      requestHash,
      totalCents,
      totalAmount: centsToMoney(totalCents),
      receivedCents,
      receivedAmount: centsToMoney(receivedCents),
      refundCents,
      refundAmount: centsToMoney(refundCents),
      paymentType,
      eventType: cancelling ? "cancel" : eventType,
      orderStatus: normalizeStatus(order.status),
      orderCreatedAt: orderDate(order),
      createdFromDevice: normalizeText(order.created_from_device || order.createdFromDevice),
      metadata: {
        event_type: cancelling ? "cancel" : eventType,
        order_status: normalizeStatus(order.status),
        order_created_at: orderDate(order),
        total_cents: totalCents,
        received_delta_cents: receivedCents,
        refund_cents: refundCents,
        app_version: order.app_version || order.appVersion || "",
        source: "simplifica-3d"
      }
    });
  }

  function getLatestSaleOperations(operations = []) {
    const latest = new Map();
    (Array.isArray(operations) ? operations : []).forEach((operation) => {
      if (normalizeStatus(operation.status) !== "completed") return;
      const saleId = normalizeText(operation.sale_id || operation.saleId || operationPayload(operation).sale_id);
      if (!saleId) return;
      const current = latest.get(saleId);
      const currentTime = timestamp(current?.updated_at || current?.created_at);
      const candidateTime = timestamp(operation.updated_at || operation.created_at);
      if (!current || candidateTime >= currentTime) latest.set(saleId, operation);
    });
    return latest;
  }

  function dateInRange(value, from = null, to = null) {
    const time = timestamp(value);
    if (!time) return !from && !to;
    if (from && time < timestamp(from)) return false;
    if (to && time >= timestamp(to)) return false;
    return true;
  }

  function localDateKey(value) {
    const date = new Date(value || 0);
    if (Number.isNaN(date.getTime())) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function projectFinancialState({ operations = [], movements = [], from = null, to = null } = {}) {
    const latest = getLatestSaleOperations(operations);
    let salesCents = 0;
    let orderCount = 0;
    const chart = new Map();
    const sales = [];

    latest.forEach((operation, saleId) => {
      const payload = operationPayload(operation);
      const metadata = payload.metadata || {};
      const status = normalizeStatus(metadata.order_status || payload.order_status || "aberto");
      const eventType = normalizeStatus(metadata.event_type || payload.event_type || "upsert");
      const valueCents = moneyToCents(payload.total_amount ?? operation.total_amount ?? 0);
      const occurredAt = metadata.order_created_at || payload.order_created_at || operation.created_at || operation.updated_at;
      if (SALE_EXCLUDED_STATUSES.has(status) || eventType === "cancel" || valueCents <= 0 || !dateInRange(occurredAt, from, to)) return;
      salesCents += valueCents;
      orderCount += 1;
      const key = localDateKey(occurredAt);
      if (key) chart.set(key, (chart.get(key) || 0) + valueCents);
      sales.push({ saleId, valueCents, occurredAt, operationId: operation.id || "" });
    });

    let entriesCents = 0;
    let exitsCents = 0;
    (Array.isArray(movements) ? movements : []).forEach((movement) => {
      const occurredAt = movement.created_at || movement.createdAt || movement.data;
      if (!dateInRange(occurredAt, from, to)) return;
      const amount = Math.max(0, moneyToCents(movement.amount ?? movement.valor));
      const type = normalizeStatus(movement.type || movement.tipo);
      if (CASH_ENTRY_TYPES.has(type)) entriesCents += amount;
      if (CASH_EXIT_TYPES.has(type)) exitsCents += amount;
    });

    return Object.freeze({
      source: "financial_operations",
      totalSalesCents: salesCents,
      totalSales: centsToMoney(salesCents),
      totalOrders: orderCount,
      entriesCents,
      entries: centsToMoney(entriesCents),
      exitsCents,
      exits: centsToMoney(exitsCents),
      cashBalanceCents: entriesCents - exitsCents,
      cashBalance: centsToMoney(entriesCents - exitsCents),
      chartSeries: [...chart.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, valueCents]) => ({ date, valueCents, value: centsToMoney(valueCents) })),
      sales
    });
  }

  function reconcileFinancialState({ orders = [], operations = [], movements = [] } = {}) {
    const latest = getLatestSaleOperations(operations);
    const orderById = new Map((Array.isArray(orders) ? orders : []).map((order) => [normalizeText(order.id), order]));
    const movementsByOrder = new Map();
    (Array.isArray(movements) ? movements : []).forEach((movement) => {
      const id = normalizeText(movement.reference_id || movement.referenceId || movement.pedidoId || movement.pedido_id);
      if (!id) return;
      const list = movementsByOrder.get(id) || [];
      list.push(movement);
      movementsByOrder.set(id, list);
    });

    const result = {
      missingFinancialOperation: [], missingCashMovement: [], duplicateMovement: [], wrongAmount: [],
      orphanMovement: [], statusMismatch: [], dateMismatch: []
    };

    orderById.forEach((order, id) => {
      const operation = latest.get(id);
      if (isOrderSaleEligible(order) && !operation) result.missingFinancialOperation.push(id);
      if (!operation) return;
      const payload = operationPayload(operation);
      const expected = isOrderSaleEligible(order) ? moneyToCents(order.total) : 0;
      const actual = moneyToCents(payload.total_amount || 0);
      if (expected !== actual) result.wrongAmount.push({ orderId: id, expectedCents: expected, actualCents: actual });
      const operationStatus = normalizeStatus(payload.metadata?.order_status || "aberto");
      if (operationStatus !== normalizeStatus(order.status)) result.statusMismatch.push({ orderId: id, orderStatus: normalizeStatus(order.status), financialStatus: operationStatus });
      const received = Math.max(0, moneyToCents(order.down_payment ?? order.valor_entrada));
      if (received > 0 && !(movementsByOrder.get(id) || []).some((movement) => normalizeStatus(movement.type || movement.tipo) === "sale")) result.missingCashMovement.push(id);
    });

    movementsByOrder.forEach((list, id) => {
      if (!orderById.has(id)) result.orphanMovement.push(...list.map((movement) => movement.id || id));
      const signatures = new Set();
      list.forEach((movement) => {
        const signature = `${normalizeStatus(movement.type || movement.tipo)}:${moneyToCents(movement.amount ?? movement.valor)}:${normalizeText(movement.operation_uuid || movement.operationUuid)}`;
        if (signatures.has(signature)) result.duplicateMovement.push(movement.id || signature);
        signatures.add(signature);
      });
    });

    return Object.freeze(clone(result));
  }

  const api = Object.freeze({
    moneyToCents, centsToMoney, stableHash, uuidFrom, isUuid, normalizeStatus, isOrderSaleEligible,
    buildOrderFinancialEvent, getLatestSaleOperations, projectFinancialState, reconcileFinancialState
  });
  global.Simplifica3dFinancialCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
