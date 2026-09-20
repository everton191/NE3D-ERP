(function attachWidgetPresenters(global) { "use strict";

/**
 * Widget Presenters — Camada pura entre snapshots de dados e view models visuais.
 *
 * CONTRATO:
 *   input:  { status: "ready"|"empty"|"error"|"loading", updatedAt, data }
 *   output: { id, title, state, primaryMetric, secondaryMetrics, items,
 *             badge, targetScreen, animationKey, visualState }
 *
 * REGRAS:
 *   - Funcoes puras, sem DOM, sem Canvas, sem WebGL
 *   - Nao mutam o snapshot de entrada
 *   - Nao recalcram regra de negocio
 *   - Formatacao visual apenas (currency, integer, label)
 */

/* ================================================================
   HELPERS DE FORMACAO
   ================================================================ */

var BRAZIL_CURRENCY = null;

function formatCurrency(value) {
  if (!BRAZIL_CURRENCY) {
    try { BRAZIL_CURRENCY = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }); }
    catch (_) { BRAZIL_CURRENCY = { format: function(v) { return "R$ " + Number(v || 0).toFixed(2); } }; }
  }
  return BRAZIL_CURRENCY.format(Number(value) || 0);
}

function formatInteger(value) {
  return String(Math.round(Number(value) || 0));
}

/* ================================================================
   BASE VIEW MODEL
   ================================================================ */

function baseViewModel(id, title, targetScreen, animationKey) {
  return {
    id: id,
    title: title,
    state: "ready",
    primaryMetric: null,
    secondaryMetrics: [],
    items: [],
    badge: null,
    targetScreen: targetScreen,
    animationKey: animationKey,
    visualState: "neutral",
  };
}

function loadingViewModel(id, title, targetScreen, animationKey) {
  var vm = baseViewModel(id, title, targetScreen, animationKey);
  vm.state = "loading";
  vm.visualState = "loading";
  return vm;
}

function emptyViewModel(id, title, targetScreen, animationKey) {
  var vm = baseViewModel(id, title, targetScreen, animationKey);
  vm.state = "empty";
  vm.visualState = "empty";
  return vm;
}

function errorViewModel(id, title, targetScreen, animationKey) {
  var vm = baseViewModel(id, title, targetScreen, animationKey);
  vm.state = "error";
  vm.visualState = "error";
  return vm;
}

/* ================================================================
   1. PRODUCTION
   ================================================================ */

function presentProduction(snapshot) {
  if (!snapshot || snapshot.status === "loading") return loadingViewModel("production", "Producao", "producao", "production-flow");
  if (snapshot.status === "error") return errorViewModel("production", "Producao", "producao", "production-flow");
  if (snapshot.status === "empty") return emptyViewModel("production", "Producao", "producao", "production-flow");

  var d = snapshot.data || {};
  var vm = baseViewModel("production", "Producao", "producao", "production-flow");

  vm.primaryMetric = { value: d.inProgress || 0, label: "em producao", formatted: formatInteger(d.inProgress) };

  vm.secondaryMetrics = [
    { value: d.inQueue || 0, label: "na fila", formatted: formatInteger(d.inQueue) },
    { value: d.ready || 0, label: "prontos", formatted: formatInteger(d.ready) },
  ];

  if (d.blockedByMaterial > 0) {
    vm.badge = { text: d.blockedByMaterial + " bloqueado(s)", tone: "warning" };
  }

  if (d.inProgress > 0) vm.visualState = "working";
  else if (d.inQueue > 0) vm.visualState = "queue";
  else if (d.ready > 0) vm.visualState = "ready-state";
  else vm.visualState = "idle";

  return vm;
}

/* ================================================================
   2. ORDERS_RECENT
   ================================================================ */

var ORDERS_MAX_ITEMS = 3;

function presentOrdersRecent(snapshot) {
  if (!snapshot || snapshot.status === "loading") return loadingViewModel("orders_recent", "Pedidos recentes", "pedidos", "order-stack");
  if (snapshot.status === "error") return errorViewModel("orders_recent", "Pedidos recentes", "pedidos", "order-stack");
  if (snapshot.status === "empty") return emptyViewModel("orders_recent", "Pedidos recentes", "pedidos", "order-stack");

  var d = snapshot.data || {};
  var orders = Array.isArray(d.orders) ? d.orders : [];
  var vm = baseViewModel("orders_recent", "Pedidos recentes", "pedidos", "order-stack");

  vm.primaryMetric = { value: d.total || 0, label: "pedidos", formatted: formatInteger(d.total) };

  vm.items = orders.slice(0, ORDERS_MAX_ITEMS).map(function(o) {
    return {
      id: o.id,
      displayClient: o.client || "Cliente",
      displayTotal: formatCurrency(o.total),
      displayStatus: o.status || "",
      displayDeadline: o.deadline || "",
      orderNumber: o.orderNumber || "",
      itemCount: o.itemCount || 0,
    };
  });

  if (orders.length > 0) vm.visualState = "has-orders";
  else vm.visualState = "empty";

  return vm;
}

/* ================================================================
   3. DAY_SUMMARY
   ================================================================ */

function presentDaySummary(snapshot) {
  if (!snapshot || snapshot.status === "loading") return loadingViewModel("day_summary", "Resumo do dia", "relatorios", "metric-bars");
  if (snapshot.status === "error") return errorViewModel("day_summary", "Resumo do dia", "relatorios", "metric-bars");
  if (snapshot.status === "empty") return emptyViewModel("day_summary", "Resumo do dia", "relatorios", "metric-bars");

  var d = snapshot.data || {};
  var vm = baseViewModel("day_summary", "Resumo do dia", "relatorios", "metric-bars");

  vm.primaryMetric = { value: d.faturamentoDia || 0, label: "faturamento", formatted: formatCurrency(d.faturamentoDia) };

  vm.secondaryMetrics = [
    { value: d.lucroDiaEstimado || 0, label: "lucro", formatted: formatCurrency(d.lucroDiaEstimado) },
    { value: d.pedidosHoje || 0, label: "pedidos", formatted: formatInteger(d.pedidosHoje) },
  ];

  if (d.faturamentoDia > 0) vm.visualState = "active";
  else vm.visualState = "idle";

  return vm;
}

/* ================================================================
   4. CASH_TODAY
   ================================================================ */

function presentCashToday(snapshot) {
  if (!snapshot || snapshot.status === "loading") return loadingViewModel("cash_today", "Caixa hoje", "caixa", "cash-flow");
  if (snapshot.status === "error") return errorViewModel("cash_today", "Caixa hoje", "caixa", "cash-flow");
  if (snapshot.status === "empty") return emptyViewModel("cash_today", "Caixa hoje", "caixa", "cash-flow");

  var d = snapshot.data || {};
  var vm = baseViewModel("cash_today", "Caixa hoje", "caixa", "cash-flow");

  vm.primaryMetric = { value: d.saldo || 0, label: "saldo", formatted: formatCurrency(d.saldo) };

  vm.secondaryMetrics = [
    { value: d.entradas || 0, label: "entradas", formatted: formatCurrency(d.entradas) },
    { value: d.saidas || 0, label: "saidas", formatted: formatCurrency(d.saidas) },
  ];

  if (d.sessaoAberta) {
    vm.badge = { text: "Aberto", tone: "success" };
    vm.visualState = "open";
  } else {
    vm.badge = { text: "Fechado", tone: "neutral" };
    vm.visualState = "closed";
  }

  return vm;
}

/* ================================================================
   5. STOCK
   ================================================================ */

var STOCK_MAX_ITEMS = 3;

function presentStock(snapshot) {
  if (!snapshot || snapshot.status === "loading") return loadingViewModel("stock", "Estoque", "estoque", "stock-level");
  if (snapshot.status === "error") return errorViewModel("stock", "Estoque", "estoque", "stock-level");
  if (snapshot.status === "empty") return emptyViewModel("stock", "Estoque", "estoque", "stock-level");

  var d = snapshot.data || {};
  var alertItems = Array.isArray(d.alertItems) ? d.alertItems : [];
  var vm = baseViewModel("stock", "Estoque", "estoque", "stock-level");

  vm.primaryMetric = { value: d.alertCount || 0, label: d.alertCount === 1 ? "alerta" : "alertas", formatted: formatInteger(d.alertCount) };

  vm.secondaryMetrics = [
    { value: d.total || 0, label: "total", formatted: formatInteger(d.total) },
    { value: d.normal || 0, label: "normal", formatted: formatInteger(d.normal) },
  ];

  var sorted = alertItems.slice().sort(function(a, b) {
    if (a.status === "critical" && b.status !== "critical") return -1;
    if (a.status !== "critical" && b.status === "critical") return 1;
    return 0;
  });

  vm.items = sorted.slice(0, STOCK_MAX_ITEMS).map(function(item) {
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      status: item.status,
      displayQuantity: formatInteger(item.quantity) + " " + (item.unit || ""),
    };
  });

  if (d.critical > 0) vm.visualState = "critical";
  else if (d.low > 0) vm.visualState = "low";
  else vm.visualState = "normal";

  return vm;
}

/* ================================================================
   6. CUSTOMERS
   ================================================================ */

function presentCustomers(snapshot) {
  if (!snapshot || snapshot.status === "loading") return loadingViewModel("customers", "Clientes", "clientes", "customer-cards");
  if (snapshot.status === "error") return errorViewModel("customers", "Clientes", "clientes", "customer-cards");
  if (snapshot.status === "empty") return emptyViewModel("customers", "Clientes", "clientes", "customer-cards");

  var d = snapshot.data || {};
  var vm = baseViewModel("customers", "Clientes", "clientes", "customer-cards");

  vm.primaryMetric = { value: d.uniqueCustomers || 0, label: "clientes", formatted: formatInteger(d.uniqueCustomers) };

  vm.secondaryMetrics = [
    { value: d.totalOrders || 0, label: "pedidos", formatted: formatInteger(d.totalOrders) },
    { value: d.openOrders || 0, label: "em aberto", formatted: formatInteger(d.openOrders) },
  ];

  if (d.uniqueCustomers > 0) vm.visualState = "active";
  else vm.visualState = "empty";

  return vm;
}

/* ================================================================
   7. STOREFRONT
   ================================================================ */

function presentStorefront(snapshot) {
  if (!snapshot || snapshot.status === "loading") return loadingViewModel("storefront", "Loja Online", "lojaOnline", "storefront-showcase");
  if (snapshot.status === "error") return errorViewModel("storefront", "Loja Online", "lojaOnline", "storefront-showcase");
  if (snapshot.status === "empty") return emptyViewModel("storefront", "Loja Online", "lojaOnline", "storefront-showcase");

  var d = snapshot.data || {};
  var vm = baseViewModel("storefront", "Loja Online", d.targetScreen || "lojaOnline", "storefront-showcase");

  vm.primaryMetric = { value: d.visits || 0, label: "visitas", formatted: formatInteger(d.visits) };

  vm.secondaryMetrics = [
    { value: d.newLeads || 0, label: "leads", formatted: formatInteger(d.newLeads) },
    { value: d.publishedProducts || 0, label: "produtos", formatted: formatInteger(d.publishedProducts) },
  ];

  if (d.active) {
    vm.badge = { text: "Ativa", tone: "success" };
    vm.visualState = "active";
  } else {
    vm.badge = { text: "Inativa", tone: "neutral" };
    vm.visualState = "inactive";
  }

  return vm;
}

/* ================================================================
   8. ALERTS
   ================================================================ */

var ALERTS_MAX_ITEMS = 3;

function presentAlerts(snapshot) {
  if (!snapshot || snapshot.status === "loading") return loadingViewModel("alerts", "Alertas", null, "alert-pulse");
  if (snapshot.status === "error") return errorViewModel("alerts", "Alertas", null, "alert-pulse");
  if (snapshot.status === "empty") return emptyViewModel("alerts", "Alertas", null, "alert-pulse");

  var d = snapshot.data || {};
  var alerts = Array.isArray(d.alerts) ? d.alerts : [];
  var vm = baseViewModel("alerts", "Alertas", null, "alert-pulse");

  vm.primaryMetric = { value: d.count || 0, label: d.count === 1 ? "alerta" : "alertas", formatted: formatInteger(d.count) };

  vm.items = alerts.slice(0, ALERTS_MAX_ITEMS).map(function(a) {
    return {
      type: a.type,
      severity: a.severity,
      title: a.title,
      summary: a.summary,
      targetScreen: a.targetScreen,
      entityId: a.entityId || null,
    };
  });

  if (alerts.length > 0) vm.visualState = "has-alerts";
  else vm.visualState = "clear";

  return vm;
}

/* ================================================================
   EXPORTACAO
   ================================================================ */

global.SimplificaWidgetPresenters = Object.freeze({
  presentProduction: presentProduction,
  presentOrdersRecent: presentOrdersRecent,
  presentDaySummary: presentDaySummary,
  presentCashToday: presentCashToday,
  presentStock: presentStock,
  presentCustomers: presentCustomers,
  presentStorefront: presentStorefront,
  presentAlerts: presentAlerts,
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = global.SimplificaWidgetPresenters;
}

})(typeof window !== "undefined" ? window : globalThis);