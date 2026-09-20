(function attachWidgetDataSources(global) { "use strict";

/**
 * Widget Data Sources — Camada limpa de dados para os 8 widgets do carrossel.
 *
 * PRINCÍPIO: Cada função recebe dados brutos e retorna um snapshot puro.
 * Não acessa DOM, não cria HTML, não depende de globals de app.js.
 *
 * CONTRATO DE SNAPSHOT:
 *   { status: "ready" | "empty" | "error", updatedAt: ISO string, data: object }
 *
 * STATUS:
 *   "ready"  — dados válidos disponíveis
 *   "empty"  — fonte existe mas retornou vazio (array vazio, null, undefined)
 *   "error"  — fonte temporariamente indisponível ou dados corrompidos
 *
 * Para integrar com app.js, o chamador deve:
 *   1. Extrair os dados dos globals (pedidos, caixa, estoque, etc.)
 *   2. Passar como argumento para estas funções
 *   3. Usar o snapshot retornado para renderizar
 *
 * LIMITAÇÕES DOCUMENTADAS:
 *   - customers: chave de unicidade é o nome do cliente (sem customer_id)
 *   - cash_today: filtra por dia corrente (comportamento do card, não paridade da Home)
 *   - storefront: targetScreen = "lojaOnline" (admin hub, mobile-enabled)
 */

/* ================================================================
   HELPERS PUROS
   ================================================================ */

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeString(value, fallback = "") {
  return String(value ?? fallback);
}

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

function dateWithinRange(date, start, end) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  return date.getTime() >= start.getTime() && date.getTime() < end.getTime();
}

function extractOrderDate(order) {
  const raw = order.updatedAt || order.criadoEm || order.createdAt || order.data || "";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeStatus(status) {
  return safeString(status).toLowerCase().trim();
}

/* ================================================================
   SNAPSHOT BASE
   ================================================================ */

const SNAPSHOT_READY = "ready";
const SNAPSHOT_EMPTY = "empty";
const SNAPSHOT_ERROR = "error";

function snapshot(status, data) {
  return Object.freeze({ status, updatedAt: new Date().toISOString(), data });
}

/* ================================================================
   1. PRODUCTION
   ================================================================ */

const PRODUCTION_ACTIVE_STATUSES = [
  "em_impressao", "pausado", "pos_processamento", "controle_qualidade"
];

const PRODUCTION_QUEUE_STATUSES = [
  "liberado_para_producao", "na_fila", "proximo", "aguardando_impressora"
];

const PRODUCTION_PENDING_STATUSES = [
  "pendente", "falhou", "reimpressao_necessaria"
];

const PRODUCTION_READY_STATUSES = [
  "pronto_para_entrega"
];

function normalizeProductionSnapshot(productionJobs, options) {
  if (options?.error) {
    return snapshot(SNAPSHOT_ERROR, { inProgress: 0, active: 0, inQueue: 0, pending: 0, ready: 0, total: 0, blockedByMaterial: 0 });
  }
  const jobs = Array.isArray(productionJobs) ? productionJobs : [];
  if (jobs.length === 0) {
    return snapshot(SNAPSHOT_EMPTY, { inProgress: 0, active: 0, inQueue: 0, pending: 0, ready: 0, total: 0, blockedByMaterial: 0 });
  }
  const excludeFinalized = options?.excludeFinalized !== false;

  const activeJobs = jobs.filter(function (j) {
    const s = normalizeStatus(j.status);
    return PRODUCTION_ACTIVE_STATUSES.includes(s);
  });

  const queueJobs = jobs.filter(function (j) {
    const s = normalizeStatus(j.status);
    return PRODUCTION_QUEUE_STATUSES.includes(s);
  });

  const pendingJobs = jobs.filter(function (j) {
    const s = normalizeStatus(j.status);
    return PRODUCTION_PENDING_STATUSES.includes(s);
  });

  const readyJobs = jobs.filter(function (j) {
    const s = normalizeStatus(j.status);
    return PRODUCTION_READY_STATUSES.includes(s);
  });

  const totalActive = activeJobs.length + queueJobs.length;

  const externalPrints = Array.isArray(options?.externalPrints)
    ? options.externalPrints.length
    : 0;

  const totalInProgress = totalActive + externalPrints;

  return snapshot(SNAPSHOT_READY, {
    inProgress: totalInProgress,
    active: activeJobs.length,
    inQueue: queueJobs.length,
    pending: pendingJobs.length,
    ready: readyJobs.length,
    total: excludeFinalized ? totalActive : jobs.length,
    blockedByMaterial: jobs.filter(function (j) {
      return safeString(j.blockedReason || j.blocked_reason) === "aguardando_material";
    }).length,
  });
}

/* ================================================================
   2. ORDERS_RECENT
   ================================================================ */

function normalizeOrdersRecentSnapshot(pedidos, options) {
  if (options?.error) {
    return snapshot(SNAPSHOT_ERROR, { orders: [], total: 0 });
  }
  const all = Array.isArray(pedidos) ? pedidos : [];
  if (all.length === 0) {
    return snapshot(SNAPSHOT_EMPTY, { orders: [], total: 0 });
  }
  const limit = options?.limit || 4;

  const sorted = all.slice().sort(function (a, b) {
    const da = extractOrderDate(a);
    const db = extractOrderDate(b);
    const ta = da ? da.getTime() : 0;
    const tb = db ? db.getTime() : 0;
    return tb - ta;
  });

  const recent = sorted.slice(0, limit).map(function (p) {
    return Object.freeze({
      id: safeString(p.id),
      client: safeString(p.cliente || p.nome, "Cliente"),
      orderNumber: safeString(p.numeroPedido || p.numero_pedido),
      itemCount: Array.isArray(p.itens) ? p.itens.length : 0,
      deadline: safeString(p.prazo || p.dataPrazo || p.data),
      total: clampNumber(
        typeof p.total === "number" ? p.total :
        typeof p.valor === "number" ? p.valor :
        typeof p.totalPedido === "number" ? p.totalPedido : 0
      ),
      status: safeString(p.status),
    });
  });

  return snapshot(SNAPSHOT_READY, { orders: recent, total: all.length });
}

/* ================================================================
   3. DAY_SUMMARY
   ================================================================ */

function normalizeDaySummarySnapshot(pedidos, options) {
  if (options?.error) {
    return snapshot(SNAPSHOT_ERROR, { faturamentoDia: 0, lucroDiaEstimado: 0, pedidosHoje: 0 });
  }
  const all = Array.isArray(pedidos) ? pedidos : [];
  if (all.length === 0) {
    return snapshot(SNAPSHOT_EMPTY, { faturamentoDia: 0, lucroDiaEstimado: 0, pedidosHoje: 0 });
  }
  const range = todayRange();
  const excludedStatuses = ["cancelado", "cancelled", "orcamento", "orçamento", "rascunho", "draft"];

  const eligible = all.filter(function (p) {
    if (p.deleted_at || p.deletedAt) return false;
    const s = normalizeStatus(p.status);
    return !excludedStatuses.includes(s);
  });

  const todayOrders = eligible.filter(function (p) {
    return dateWithinRange(extractOrderDate(p), range.start, range.end);
  });

  let faturamentoDia = 0;
  let lucroDiaEstimado = 0;

  todayOrders.forEach(function (p) {
    const total = clampNumber(
      typeof p.total === "number" ? p.total :
      typeof p.valor === "number" ? p.valor :
      typeof p.totalPedido === "number" ? p.totalPedido : 0
    );
    faturamentoDia += total;

    let custoTotal = 0;
    const itens = Array.isArray(p.itens) ? p.itens : [];
    itens.forEach(function (item) {
      custoTotal += clampNumber(item.custoTotal || item.custo);
    });
    lucroDiaEstimado += Math.max(0, total - custoTotal);
  });

  return snapshot(SNAPSHOT_READY, {
    faturamentoDia: Math.round(faturamentoDia * 100) / 100,
    lucroDiaEstimado: Math.round(lucroDiaEstimado * 100) / 100,
    pedidosHoje: todayOrders.length,
  });
}

/* ================================================================
   4. CASH_TODAY
   ================================================================ */

function normalizeCashTodaySnapshot(caixaMovimentos, options) {
  if (options?.error) {
    return snapshot(SNAPSHOT_ERROR, { entradas: 0, saidas: 0, saldo: 0, cancelados: 0, sessaoAberta: false });
  }
  const movements = Array.isArray(caixaMovimentos) ? caixaMovimentos : [];
  if (movements.length === 0) {
    return snapshot(SNAPSHOT_EMPTY, { entradas: 0, saidas: 0, saldo: 0, cancelados: 0, sessaoAberta: !!(options?.session && options.session.status === "open") });
  }
  const range = todayRange();
  const session = options?.session || null;

  let entradas = 0;
  let saidas = 0;
  let cancelados = 0;

  movements.forEach(function (m) {
    const cancelled = m.cancelado || m.cancelled || m.status === "cancelado";
    if (cancelled) { cancelados += 1; return; }
    const data = new Date(m.data || m.criadoEm || m.createdAt || m.created_at || "");
    if (!dateWithinRange(data, range.start, range.end)) return;
    const valor = clampNumber(m.valor);
    if (m.tipo === "saida") {
      saidas += valor;
    } else {
      entradas += valor;
    }
  });

  return snapshot(SNAPSHOT_READY, {
    entradas: Math.round(entradas * 100) / 100,
    saidas: Math.round(saidas * 100) / 100,
    saldo: Math.round((entradas - saidas) * 100) / 100,
    cancelados: cancelados,
    sessaoAberta: !!(session && session.status === "open"),
  });
}

/* ================================================================
   5. STOCK
   ================================================================ */

function normalizeStockSnapshot(materiais, options) {
  if (options?.error) {
    return snapshot(SNAPSHOT_ERROR, { total: 0, critical: 0, low: 0, normal: 0, alertCount: 0, alertItems: [] });
  }
  const items = Array.isArray(materiais) ? materiais : [];
  if (items.length === 0) {
    return snapshot(SNAPSHOT_EMPTY, { total: 0, critical: 0, low: 0, normal: 0, alertCount: 0, alertItems: [] });
  }
  let critical = 0;
  let low = 0;
  let normal = 0;
  const alertItems = [];

  items.forEach(function (m) {
    // The Home supplies its existing resolver here during the future data bridge.
    // Keeping it injected preserves this module's no-global, pure contract.
    const status = safeString(typeof options?.resolveStatus === "function"
      ? options.resolveStatus(m)
      : m.stock_status || "normal");
    if (status === "critical") {
      critical += 1;
      alertItems.push(Object.freeze({
        id: safeString(m.id),
        name: safeString(m.nome || m.name),
        quantity: clampNumber(m.qtd ?? m.current_quantity),
        unit: safeString(m.unidade || m.unit, "kg"),
        status: "critical",
      }));
    } else if (status === "low") {
      low += 1;
      alertItems.push(Object.freeze({
        id: safeString(m.id),
        name: safeString(m.nome || m.name),
        quantity: clampNumber(m.qtd ?? m.current_quantity),
        unit: safeString(m.unidade || m.unit, "kg"),
        status: "low",
      }));
    } else {
      normal += 1;
    }
  });

  return snapshot(SNAPSHOT_READY, {
    total: items.length,
    critical: critical,
    low: low,
    normal: normal,
    alertCount: critical + low,
    alertItems: alertItems,
  });
}

/* ================================================================
   6. CUSTOMERS
   ================================================================ */

/**
 * Chave de unicidade: nome do cliente (raw string de clienteDoPedido()).
 * LIMITAÇÃO: Não existe customer_id no fluxo operacional. Dois clientes
 * com o mesmo nome são contados como um só. Esta limitação é herdada
 * do sistema atual (renderClientesOperacionais, getDashboardStats).
 */
function normalizeCustomersSnapshot(pedidos, options) {
  if (options?.error) {
    return snapshot(SNAPSHOT_ERROR, { uniqueCustomers: 0, totalOrders: 0, openOrders: 0 });
  }
  const all = Array.isArray(pedidos) ? pedidos : [];
  if (all.length === 0) {
    return snapshot(SNAPSHOT_EMPTY, { uniqueCustomers: 0, totalOrders: 0, openOrders: 0 });
  }
  const mapa = new Map();

  all.forEach(function (p) {
    const nome = safeString(p.cliente || p.nome).trim();
    if (!nome) return;
    const atual = mapa.get(nome) || { nome: nome, pedidos: 0, total: 0, abertos: 0 };
    atual.pedidos += 1;
    atual.total += clampNumber(
      typeof p.total === "number" ? p.total :
      typeof p.valor === "number" ? p.valor :
      typeof p.totalPedido === "number" ? p.totalPedido : 0
    );
    const s = normalizeStatus(p.status);
    if (!["entregue", "pago", "finalizado", "cancelado"].includes(s)) {
      atual.abertos += 1;
    }
    mapa.set(nome, atual);
  });

  const uniqueCount = mapa.size;
  const openOrders = Array.from(mapa.values()).reduce(function (sum, c) {
    return sum + c.abertos;
  }, 0);

  return snapshot(SNAPSHOT_READY, {
    uniqueCustomers: uniqueCount,
    totalOrders: all.length,
    openOrders: openOrders,
  });
}

/* ================================================================
   7. STOREFRONT
   ================================================================ */

const STOREFRONT_TARGET_SCREEN = "lojaOnline";

function normalizeStorefrontSnapshot(storefrontData, options) {
  if (options?.error) {
    return snapshot(SNAPSHOT_ERROR, { active: false, publishedProducts: 0, totalProducts: 0, visits: 0, newLeads: 0, totalLeads: 0, targetScreen: STOREFRONT_TARGET_SCREEN });
  }
  const store = storefrontData?.store || null;
  const products = Array.isArray(storefrontData?.products) ? storefrontData.products : [];
  const leads = Array.isArray(storefrontData?.leads) ? storefrontData.leads : [];
  const events = Array.isArray(storefrontData?.events) ? storefrontData.events : [];

  if (!store && products.length === 0 && leads.length === 0 && events.length === 0) {
    return snapshot(SNAPSHOT_EMPTY, { active: false, publishedProducts: 0, totalProducts: 0, visits: 0, newLeads: 0, totalLeads: 0, targetScreen: STOREFRONT_TARGET_SCREEN });
  }

  const visitCount = events.filter(function (e) {
    return e.event_type === "store_view";
  }).length;

  const newLeads = leads.filter(function (l) {
    return safeString(l.status) === "novo";
  }).length;

  const publishedProducts = products.filter(function (p) {
    return p.active !== false && p.visible !== false;
  }).length;

  return snapshot(SNAPSHOT_READY, {
    active: !!(store && store.active),
    publishedProducts: publishedProducts,
    totalProducts: products.length,
    visits: visitCount,
    newLeads: newLeads,
    totalLeads: leads.length,
    targetScreen: STOREFRONT_TARGET_SCREEN,
  });
}

/* ================================================================
   8. ALERTS (regras determinísticas puras)
   ================================================================ */

function normalizeAlertsSnapshot(params) {
  if (params?.error) {
    return snapshot(SNAPSHOT_ERROR, { alerts: [], count: 0 });
  }
  const pedidos = Array.isArray(params?.pedidos) ? params.pedidos : [];
  const productionJobs = Array.isArray(params?.productionJobs) ? params.productionJobs : [];
  const caixaMovimentos = Array.isArray(params?.caixaMovimentos) ? params.caixaMovimentos : [];
  const materiais = Array.isArray(params?.materiais) ? params.materiais : [];
  const session = params?.session || null;

  const alerts = [];
  const now = new Date();
  const excludedStatuses = ["entregue", "pago", "finalizado", "cancelado"];

  pedidos.forEach(function (p) {
    const s = normalizeStatus(p.status);
    if (excludedStatuses.includes(s)) return;
    const prazo = p.prazo || p.dataPrazo;
    if (prazo && new Date(prazo) < now) {
      alerts.push(Object.freeze({
        type: "order_overdue",
        severity: "warning",
        title: "Pedido com prazo vencido",
        summary: safeString(p.cliente || p.nome, "Cliente") + " — prazo: " + safeString(prazo),
        targetScreen: "pedidos",
        entityId: safeString(p.id),
      }));
    }
  });

  productionJobs.forEach(function (j) {
    const s = normalizeStatus(j.status);
    if (["pausado", "falhou", "reimpressao_necessaria", "pendente"].includes(s)) {
      alerts.push(Object.freeze({
        type: "production_stopped",
        severity: "warning",
        title: "Produção parada",
        summary: safeString(j.itemName || j.item_name, "Tarefa") + " — " + s,
        targetScreen: "producao",
        entityId: safeString(j.id),
      }));
    }
    if (safeString(j.blockedReason || j.blocked_reason) === "aguardando_material") {
      alerts.push(Object.freeze({
        type: "production_material",
        severity: "warning",
        title: "Aguardando material",
        summary: safeString(j.itemName || j.item_name, "Tarefa"),
        targetScreen: "estoque",
        entityId: safeString(j.id),
      }));
    }
  });

  materiais.forEach(function (m) {
    const st = safeString(m.stock_status || "normal");
    if (st === "critical") {
      alerts.push(Object.freeze({
        type: "stock_critical",
        severity: "danger",
        title: "Estoque crítico",
        summary: safeString(m.nome || m.name) + " — " + clampNumber(m.qtd ?? m.current_quantity) + " " + safeString(m.unidade || m.unit, "kg"),
        targetScreen: "estoque",
        entityId: safeString(m.id),
      }));
    }
  });

  if (!session && caixaMovimentos.length > 0) {
    alerts.push(Object.freeze({
      type: "cash_no_session",
      severity: "warning",
      title: "Caixa sem sessão aberta",
      summary: "Abra o caixa antes do próximo lançamento",
      targetScreen: "caixa",
    }));
  }

  const status = alerts.length > 0 ? SNAPSHOT_READY : SNAPSHOT_EMPTY;
  return snapshot(status, { alerts: alerts, count: alerts.length });
}

/* ================================================================
   EXPORTAÇÃO
   ================================================================ */

global.SimplificaWidgetDataSources = Object.freeze({
  snapshot: snapshot,
  normalizeProductionSnapshot: normalizeProductionSnapshot,
  normalizeOrdersRecentSnapshot: normalizeOrdersRecentSnapshot,
  normalizeDaySummarySnapshot: normalizeDaySummarySnapshot,
  normalizeCashTodaySnapshot: normalizeCashTodaySnapshot,
  normalizeStockSnapshot: normalizeStockSnapshot,
  normalizeCustomersSnapshot: normalizeCustomersSnapshot,
  normalizeStorefrontSnapshot: normalizeStorefrontSnapshot,
  normalizeAlertsSnapshot: normalizeAlertsSnapshot,
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = global.SimplificaWidgetDataSources;
}

})(typeof window !== "undefined" ? window : globalThis);
