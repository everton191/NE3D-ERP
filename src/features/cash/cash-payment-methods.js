(function attachCashPaymentMethods(global) {
  "use strict";

  function normalizarMetodoPagamentoCaixa(value = "", helpers = {}) {
    const id = String(value || "").trim().toLowerCase();
    const getMetodosPagamentoCaixa = typeof helpers.getMetodosPagamentoCaixa === "function" ? helpers.getMetodosPagamentoCaixa : () => [];
    const methods = getMetodosPagamentoCaixa();
    return methods.find((method) => method.id === id || method.type === id) || methods[0] || { id: "dinheiro", name: "Dinheiro", type: "cash" };
  }

  function getMetodoPagamentoMovimento(movimento = {}, helpers = {}) {
    const normalize = typeof helpers.normalizarMetodoPagamentoCaixa === "function"
      ? helpers.normalizarMetodoPagamentoCaixa
      : (value) => normalizarMetodoPagamentoCaixa(value, helpers);
    return normalize(movimento.payment_method_type || movimento.paymentMethodType || movimento.paymentMethod || movimento.metodoPagamento || movimento.formaPagamento || movimento.payment_method_id || movimento.paymentMethodId || "dinheiro");
  }
  function calcularTotaisCaixa(movimentos = [], helpers = {}) {
    const cancelled = helpers.isCancelled || (() => false);
    return (Array.isArray(movimentos) ? movimentos : []).reduce((totals, movement) => {
      if (cancelled(movement)) { totals.cancelados += 1; return totals; }
      const value = Number(movement.valor) || 0;
      if (movement.tipo === "saida") totals.saidas += value;
      else totals.entradas += value;
      totals.saldo = totals.entradas - totals.saidas;
      return totals;
    }, { entradas: 0, saidas: 0, saldo: 0, cancelados: 0 });
  }
  function calcularSaldo(movimentos = [], helpers = {}) { return calcularTotaisCaixa(movimentos, helpers).saldo; }
  function calcularResumoSessaoCaixa(session = null, movements = [], helpers = {}) {
    const cancelled = helpers.isCancelled || (() => false), paymentMethod = helpers.getPaymentMethod || (() => ({ id: "dinheiro" })), dateOf = helpers.getMovementDate || (() => null);
    const summary = (Array.isArray(movements) ? movements : []).reduce((totals, movement) => {
      if (cancelled(movement)) { totals.cancelados += 1; return totals; }
      const value = Number(movement.valor) || 0, outgoing = String(movement.tipo || "").toLowerCase() === "saida";
      if (outgoing) totals.saidas += value;
      else { totals.entradas += value; const method = paymentMethod(movement); totals.porForma[method.id] = (totals.porForma[method.id] || 0) + value; }
      totals.saldo = totals.entradas - totals.saidas; totals.ultimaMovimentacao = dateOf(movement) || totals.ultimaMovimentacao;
      return totals;
    }, { entradas: 0, saidas: 0, saldo: 0, cancelados: 0, porForma: {}, ultimaMovimentacao: null });
    summary.expectedBalance = (Number(session?.openingBalance ?? session?.opening_balance) || 0) + summary.saldo;
    return summary;
  }

  function calcularTotaisCaixaPeriodo(inicio, fim, movimentos = [], helpers = {}) {
    const cancelled = helpers.isCancelled || (() => false);
    const dateOf = helpers.getMovementDate || (() => null);
    const inRange = helpers.inRange || (() => true);
    return (Array.isArray(movimentos) ? movimentos : []).reduce((totais, movimento) => {
      const data = dateOf(movimento);
      if (!inRange(data, inicio, fim)) return totais;
      if (cancelled(movimento)) {
        totais.cancelados += 1;
        return totais;
      }
      const valor = Number(movimento.valor) || 0;
      if (String(movimento.tipo || "").toLowerCase() === "saida") {
        totais.saidas += valor;
      } else {
        totais.entradas += valor;
      }
      totais.saldo = totais.entradas - totais.saidas;
      return totais;
    }, { entradas: 0, saidas: 0, saldo: 0, cancelados: 0 });
  }

  function calcularResumoCaixaVinculadoAoPedido(order = {}, movements = [], helpers = {}) {
    const orderId = String(order.id ?? "").trim();
    const summary = { entradas: 0, saidas: 0, saldo: 0, quantidade: 0 };
    if (!orderId) return summary;
    const cancelled = helpers.isCancelled || (() => false);
    for (const movement of Array.isArray(movements) ? movements : []) {
      if (!movement || cancelled(movement) || movement.deleted_at || movement.deletedAt) continue;
      const linkedOrderId = String(movement.pedidoId ?? movement.pedido_id ?? movement.orderId ?? movement.order_id ?? "").trim();
      // Descriptions and matching amounts are not proof that a movement belongs to this order.
      if (linkedOrderId !== orderId) continue;
      const type = String(movement.tipo || "").toLowerCase();
      const value = Number(movement.valor);
      if (!['entrada', 'saida'].includes(type) || !Number.isFinite(value) || value < 0) continue;
      const cents = Math.round(value * 100);
      summary[type === 'entrada' ? 'entradas' : 'saidas'] += cents;
      summary.quantidade += 1;
    }
    summary.saldo = (summary.entradas - summary.saidas) / 100;
    summary.entradas /= 100;
    summary.saidas /= 100;
    return summary;
  }

  function criarOperacaoFinanceiraLegadaDoPedido(order = {}, helpers = {}) {
    const financialCore = helpers.financialCore;
    if (!financialCore || !order?.id) return null;
    const eligible = financialCore.isOrderSaleEligible(order);
    const totalOrder = helpers.totalOrder || (() => 0);
    return {
      id: `legacy-order:${order.id}`,
      sale_id: String(order.id),
      operation_type: eligible ? "sale" : "refund",
      status: "completed",
      payload_json: {
        sale_id: String(order.id),
        total_amount: eligible ? totalOrder(order) : 0,
        metadata: {
          event_type: eligible ? "legacy_projection" : "cancel",
          order_status: order.status || "aberto",
          order_created_at: order.criadoEm || order.createdAt || order.created_at || order.data || "",
          source: "legacy_order_projection"
        }
      },
      created_at: order.criadoEm || order.createdAt || order.created_at || order.data || new Date(0).toISOString(),
      updated_at: order.updatedAt || order.updated_at || order.atualizadoEm || order.criadoEm || order.createdAt || new Date(0).toISOString(),
      source: "legacy_order_projection"
    };
  }

  function obterDadosFinanceirosCanonicosComFallback(helpers = {}) {
    const { financialCore, loadState, orders = [], cashMovements = [], operationFromEvent, movementFromEvent } = helpers;
    const state = loadState();
    const operations = [...state.operations];
    const canonicalMovements = [...state.movements];
    const operationKeys = new Set(operations.map((operation) => String(operation.operation_uuid || "")).filter(Boolean));
    const saleIds = new Set(operations.map((operation) => String(operation.sale_id || "")).filter(Boolean));
    state.events.forEach((event) => {
      if (!operationKeys.has(String(event.operationUuid || ""))) operations.push(operationFromEvent(event));
      if (event.syncStatus !== "synced") {
        const movement = movementFromEvent(event);
        if (movement) canonicalMovements.push(movement);
      }
      saleIds.add(String(event.orderId || ""));
    });
    orders.forEach((order) => {
      if (saleIds.has(String(order.id))) return;
      const legacy = criarOperacaoFinanceiraLegadaDoPedido(order, { financialCore, totalOrder: helpers.totalOrder });
      if (legacy) operations.push(legacy);
    });
    const movements = financialCore?.mergeCashMovements
      ? financialCore.mergeCashMovements({ legacyMovements: cashMovements, canonicalMovements })
      : (cashMovements.length ? [...cashMovements] : canonicalMovements);
    return { state, operations, movements };
  }

  function adaptarMovimentoFinanceiroCanonicoParaCaixa(movimento = {}, paymentMethods = []) {
    if (movimento.valor !== undefined && movimento.tipo && movimento.amount === undefined) return movimento;
    const tipoCanonico = String(movimento.type || movimento.tipo || "").toLowerCase();
    const saida = ["saida", "sangria", "retirada", "estorno", "closing"].includes(tipoCanonico);
    const metodoRemoto = paymentMethods.find((metodo) => String(metodo?.id || "") === String(movimento.payment_method_id || movimento.paymentMethodId || ""));
    const referenciaPedido = String(movimento.reference_collection || movimento.referenceCollection || "") === "pedidos"
      ? String(movimento.reference_id || movimento.referenceId || "")
      : "";
    return {
      ...movimento,
      id: movimento.id ? `canonical:${movimento.id}` : `canonical:${movimento.operation_uuid || movimento.client_request_id || Date.now()}`,
      canonical_movement_id: movimento.id || "",
      tipo: saida ? "saida" : "entrada",
      valor: Math.max(0, Number(movimento.amount ?? movimento.valor) || 0),
      descricao: movimento.description || movimento.descricao || (referenciaPedido ? `${saida ? "Estorno" : "Recebimento"} pedido #${referenciaPedido}` : "Movimento sincronizado"),
      pedidoId: referenciaPedido,
      payment_method_type: metodoRemoto?.type || movimento.payment_method_type || movimento.metadata_json?.payment_method_type || "other",
      paymentMethod: metodoRemoto?.name || movimento.paymentMethod || "Sincronizado",
      data: movimento.created_at || movimento.createdAt || movimento.data || "",
      criadoEm: movimento.created_at || movimento.createdAt || movimento.criadoEm || "",
      cancelado: !!movimento.cancelled_at,
      source: movimento.source || "financial_canonical",
      canonical_readonly: true
    };
  }

  function enfileirarEventoFinanceiroDoPedido(order, cashReceipt = null, eventType = "create", helpers = {}) {
    const financialCore = helpers.financialCore;
    if (!financialCore || !order) return { status: "BLOCKED", reason: "FINANCIAL_CORE_UNAVAILABLE" };
    const companyId = helpers.getCompanyId();
    if (!financialCore.isUuid(companyId)) {
      helpers.markOrder(order, { financial_operation_status: "pending_company", financial_sync_error: "COMPANY_UUID_REQUIRED" });
      helpers.persist();
      return { status: "PENDING", reason: "COMPANY_UUID_REQUIRED" };
    }
    const baseEvent = financialCore.buildOrderFinancialEvent({ order, cashReceipt, companyId, eventType });
    const now = helpers.now();
    const event = { ...baseEvent, createdAt: now, updatedAt: now, syncStatus: "pending_sync", syncAttempts: 0, lastError: "" };
    const state = helpers.loadState();
    const events = state.events.filter((item) => String(item.operationUuid) !== String(event.operationUuid));
    helpers.saveState({ ...state, events: [...events, event].slice(-300), lastError: "" });
    helpers.markOrder(order, {
      financial_operation_uuid: event.operationUuid,
      financial_operation_status: "pending_sync",
      financial_event_type: event.eventType,
      financial_sync_error: ""
    });
    helpers.persist();
    helpers.scheduleSync(80);
    return { status: "QUEUED", event };
  }

  const api = Object.freeze({ normalizarMetodoPagamentoCaixa, getMetodoPagamentoMovimento, calcularSaldo, calcularTotaisCaixa, calcularTotaisCaixaPeriodo, calcularResumoSessaoCaixa, calcularResumoCaixaVinculadoAoPedido, adaptarMovimentoFinanceiroCanonicoParaCaixa, criarOperacaoFinanceiraLegadaDoPedido, obterDadosFinanceirosCanonicosComFallback, enfileirarEventoFinanceiroDoPedido });
  global.SimplificaCashPaymentMethods = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
