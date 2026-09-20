(function attachWidgetVisualModels(global) { "use strict";

/**
 * Widget Visual Models — Camada pura entre Presenter ViewModel e futuro Renderer.
 *
 * CONTRATO:
 *   input:  Presenter ViewModel { id, title, state, primaryMetric, secondaryMetrics,
 *           items, badge, targetScreen, animationKey, visualState }
 *   output: Widget Visual Model { id, state, title, primary, secondary, items, badge,
 *            visual: { emphasis, iconKey, textureKey, layoutKey },
 *            animation: { key, state, intensity, progress },
 *            navigation: { targetScreen } }
 *
 * REGRAS:
 *   - Funcoes puras, sem DOM, sem Canvas, sem WebGL
 *   - Nao mutam o ViewModel de entrada
 *   - Nao recalcram regra de negocio
 *   - Somente mapeiam ViewModel -> Visual Model
 */

/* ================================================================
   HELPERS
   ================================================================ */

function safeClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function mapItems(items, mapper) {
  if (!items || items.length === 0) return [];
  return items.map(mapper);
}

/* ================================================================
   1. PRODUCTION
   ================================================================ */

var PRODUCTION_TEXTURES = {
  idle: "production-idle",
  working: "production-active",
  queue: "production-queue",
  "ready-state": "production-ready",
};

var PRODUCTION_ICONS = {
  idle: "production-idle",
  working: "production-active",
  queue: "production-queue",
  "ready-state": "production-done",
};

function buildProductionVisualModel(vm) {
  var vs = vm.visualState;
  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: mapItems(vm.items, function(item) {
      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        status: item.status,
        displayQuantity: item.displayQuantity,
        emphasis: item.status === "critical" ? "high" : "normal",
      };
    }),
    badge: vm.badge,
    visual: {
      emphasis: vs === "working" ? "high" : vs === "queue" ? "medium" : "low",
      iconKey: PRODUCTION_ICONS[vs] || "production-idle",
      textureKey: PRODUCTION_TEXTURES[vs] || "production-idle",
      layoutKey: "production-belt",
    },
    animation: {
      key: vm.animationKey,
      state: vs,
      intensity: vs === "working" ? 1.0 : vs === "queue" ? 0.6 : vs === "blocked" ? 0.3 : 0.0,
      progress: 0,
    },
    navigation: {
      targetScreen: vm.targetScreen,
    },
  };
}

/* ================================================================
   2. ORDERS_RECENT
   ================================================================ */

function buildOrdersRecentVisualModel(vm) {
  var vs = vm.visualState;
  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: mapItems(vm.items, function(item, index) {
      return {
        id: item.id,
        displayClient: item.displayClient,
        displayTotal: item.displayTotal,
        displayStatus: item.displayStatus,
        displayDeadline: item.displayDeadline,
        orderNumber: item.orderNumber,
        itemCount: item.itemCount,
        stackPosition: index,
        emphasis: index === 0 ? "high" : "normal",
      };
    }),
    badge: vm.badge,
    visual: {
      emphasis: vs === "has-orders" ? "medium" : "low",
      iconKey: "orders-card",
      textureKey: "orders-stack",
      layoutKey: "orders-stack-layout",
    },
    animation: {
      key: vm.animationKey,
      state: vs,
      intensity: vs === "has-orders" ? 0.8 : 0.0,
      progress: 0,
    },
    navigation: {
      targetScreen: vm.targetScreen,
    },
  };
}

/* ================================================================
   3. DAY_SUMMARY
   ================================================================ */

function buildDaySummaryVisualModel(vm) {
  var vs = vm.visualState;
  var bars = [];

  if (vm.primary) {
    bars.push({
      label: vm.primary.label,
      value: vm.primary.value,
      formatted: vm.primary.formatted,
      fillPercent: 100,
      color: "primary",
    });
  }

  if (vm.secondary) {
    vm.secondary.forEach(function(m, i) {
      bars.push({
        label: m.label,
        value: m.value,
        formatted: m.formatted,
        fillPercent: 0,
        color: i === 0 ? "secondary" : "tertiary",
      });
    });
  }

  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: bars,
    badge: vm.badge,
    visual: {
      emphasis: vs === "active" ? "medium" : "low",
      iconKey: "summary-chart",
      textureKey: "summary-chart",
      layoutKey: "summary-bars-layout",
    },
    animation: {
      key: vm.animationKey,
      state: vs,
      intensity: vs === "active" ? 0.7 : 0.0,
      progress: 0,
    },
    navigation: {
      targetScreen: vm.targetScreen,
    },
  };
}

/* ================================================================
   4. CASH_TODAY
   ================================================================ */

function buildCashTodayVisualModel(vm) {
  var vs = vm.visualState;
  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: mapItems(vm.items, function(item) {
      return {
        id: item.id,
        type: item.type,
        value: item.value,
        formatted: item.formatted,
        emphasis: item.type === "entrada" ? "positive" : "negative",
      };
    }),
    badge: vm.badge,
    visual: {
      emphasis: vs === "open" ? "medium" : "low",
      iconKey: "cash-coins",
      textureKey: "cash-flow",
      layoutKey: "cash-dashboard-layout",
    },
    animation: {
      key: vm.animationKey,
      state: vs,
      intensity: vs === "open" ? 0.6 : 0.0,
      progress: 0,
    },
    navigation: {
      targetScreen: vm.targetScreen,
    },
  };
}

/* ================================================================
   5. STOCK
   ================================================================ */

function buildStockVisualModel(vm) {
  var vs = vm.visualState;
  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: mapItems(vm.items, function(item) {
      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        status: item.status,
        displayQuantity: item.displayQuantity,
        fillPercent: item.status === "critical" ? 20 : item.status === "low" ? 50 : 100,
        emphasis: item.status === "critical" ? "high" : item.status === "low" ? "medium" : "normal",
      };
    }),
    badge: vm.badge,
    visual: {
      emphasis: vs === "critical" ? "high" : vs === "low" ? "medium" : "low",
      iconKey: "stock-spool",
      textureKey: "stock-level",
      layoutKey: "stock-levels-layout",
    },
    animation: {
      key: vm.animationKey,
      state: vs,
      intensity: vs === "critical" ? 1.0 : vs === "low" ? 0.6 : 0.0,
      progress: 0,
    },
    navigation: {
      targetScreen: vm.targetScreen,
    },
  };
}

/* ================================================================
   6. CUSTOMERS
   ================================================================ */

function buildCustomersVisualModel(vm) {
  var vs = vm.visualState;
  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: mapItems(vm.items, function(item, index) {
      return {
        id: item.id || "cust-" + index,
        displayClient: item.displayClient,
        displayTotal: item.displayTotal,
        emphasis: index === 0 ? "high" : "normal",
      };
    }),
    badge: vm.badge,
    visual: {
      emphasis: vs === "active" ? "medium" : "low",
      iconKey: "customers-orbit",
      textureKey: "customers-orbit",
      layoutKey: "customers-cards-layout",
    },
    animation: {
      key: vm.animationKey,
      state: vs,
      intensity: vs === "active" ? 0.5 : 0.0,
      progress: 0,
    },
    navigation: {
      targetScreen: vm.targetScreen,
    },
  };
}

/* ================================================================
   7. STOREFRONT
   ================================================================ */

function buildStorefrontVisualModel(vm) {
  var vs = vm.visualState;
  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: mapItems(vm.items, function(item) {
      return {
        id: item.id,
        name: item.name,
        emphasis: "normal",
      };
    }),
    badge: vm.badge,
    visual: {
      emphasis: vs === "active" ? "medium" : "low",
      iconKey: "storefront-product",
      textureKey: "storefront-product",
      layoutKey: "storefront-showcase-layout",
    },
    animation: {
      key: vm.animationKey,
      state: vs,
      intensity: vs === "active" ? 0.7 : 0.0,
      progress: 0,
    },
    navigation: {
      targetScreen: vm.targetScreen,
    },
  };
}

/* ================================================================
   8. ALERTS
   ================================================================ */

var ALERT_TEXTURES = {
  order_overdue: "alert-overdue",
  production_stopped: "alert-stopped",
  production_material: "alert-material",
  stock_critical: "alert-stock",
  cash_no_session: "alert-cash",
};

var ALERT_ICONS = {
  order_overdue: "alert-clock",
  production_stopped: "alert-stop",
  production_material: "alert-box",
  stock_critical: "alert-warning",
  cash_no_session: "alert-register",
};

function buildAlertsVisualModel(vm) {
  var vs = vm.visualState;
  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: mapItems(vm.items, function(item) {
      return {
        type: item.type,
        severity: item.severity,
        title: item.title,
        summary: item.summary,
        targetScreen: item.targetScreen,
        entityId: item.entityId,
        iconKey: ALERT_ICONS[item.type] || "alert-generic",
        textureKey: ALERT_TEXTURES[item.type] || "alert-generic",
        emphasis: item.severity === "critical" ? "high" : item.severity === "warning" ? "medium" : "low",
      };
    }),
    badge: vm.badge,
    visual: {
      emphasis: vs === "has-alerts" ? "high" : "low",
      iconKey: "alerts-bell",
      textureKey: "alerts-warning",
      layoutKey: "alerts-list-layout",
    },
    animation: {
      key: vm.animationKey,
      state: vs,
      intensity: vs === "has-alerts" ? 1.0 : 0.0,
      progress: 0,
    },
    navigation: {
      targetScreen: vm.targetScreen,
    },
  };
}

/* ================================================================
   BUILDER MAP
   ================================================================ */

var BUILDERS = {
  production: buildProductionVisualModel,
  orders_recent: buildOrdersRecentVisualModel,
  day_summary: buildDaySummaryVisualModel,
  cash_today: buildCashTodayVisualModel,
  stock: buildStockVisualModel,
  customers: buildCustomersVisualModel,
  storefront: buildStorefrontVisualModel,
  alerts: buildAlertsVisualModel,
};

function buildVisualModel(widgetId, viewModel) {
  if (!viewModel) return null;
  var builder = BUILDERS[widgetId];
  if (!builder) return null;
  return builder(viewModel);
}

/* ================================================================
   EXPORTACAO
   ================================================================ */

global.SimplificaWidgetVisualModels = Object.freeze({
  buildVisualModel: buildVisualModel,
  _builders: BUILDERS,
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = global.SimplificaWidgetVisualModels;
}

})(typeof window !== "undefined" ? window : globalThis);