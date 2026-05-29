(function (global) {
  "use strict";

  const MAX_SAFE_ITEMS = 10;
  const CONTEXT_TYPES = Object.freeze([
    "orders_summary",
    "inventory_summary",
    "cash_summary",
    "pricing_helper",
    "whatsapp_message_helper",
    "client_analysis"
  ]);

  function requireOwner(ownerId) {
    if (!ownerId) {
      const error = new Error("ownerId é obrigatório para montar contexto de IA.");
      error.code = "AI_OWNER_REQUIRED";
      throw error;
    }
  }

  function sameOwner(item = {}, ownerId) {
    return String(item.ownerId || item.owner_id || item.companyId || item.company_id || "") === String(ownerId);
  }

  function safeList(list, ownerId) {
    if (!Array.isArray(list)) return [];
    return list.filter((item) => sameOwner(item, ownerId)).slice(0, MAX_SAFE_ITEMS);
  }

  async function buildOrdersAiContext({ ownerId, userId = "", filters = {} } = {}) {
    requireOwner(ownerId);
    const orders = safeList(filters.orders, ownerId);
    const statusCounts = orders.reduce((acc, order) => {
      const status = String(order.status || "aberto").toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return {
      contextType: "orders_summary",
      ownerId,
      userId,
      period: filters.period || "current_month",
      totalOrders: orders.length,
      openOrders: statusCounts.aberto || statusCounts.open || 0,
      completedOrders: statusCounts.finalizado || statusCounts.entregue || statusCounts.completed || 0,
      delayedOrders: statusCounts.atrasado || statusCounts.delayed || 0,
      totalRevenue: orders.reduce((sum, order) => sum + Math.max(0, Number(order.total || order.valorTotal || 0) || 0), 0),
      topStatuses: Object.entries(statusCounts).slice(0, 5).map(([status, total]) => ({ status, total })),
      recentSafeItems: orders.slice(0, 5).map((order) => ({
        status: order.status || "",
        total: Number(order.total || order.valorTotal || 0) || 0,
        createdAt: order.createdAt || order.created_at || ""
      }))
    };
  }

  async function buildInventoryAiContext({ ownerId, userId = "", filters = {} } = {}) {
    requireOwner(ownerId);
    const materials = safeList(filters.materials, ownerId);
    const lowStock = materials.filter((item) => Number(item.stock || item.estoque || 0) <= Number(item.minStock || item.estoqueMinimo || 0));
    return {
      contextType: "inventory_summary",
      ownerId,
      userId,
      totalMaterials: materials.length,
      lowStockCount: lowStock.length,
      mostUsedMaterials: materials.slice(0, 5).map((item) => ({ name: item.name || item.nome || "", usage: Number(item.usage || item.consumo || 0) || 0 })),
      colorsWithLowStock: lowStock.slice(0, 5).map((item) => item.color || item.cor || item.name || item.nome || ""),
      estimatedConsumptionMonth: materials.reduce((sum, item) => sum + (Number(item.monthlyConsumption || item.consumoMensal || 0) || 0), 0)
    };
  }

  async function buildCashAiContext({ ownerId, userId = "", filters = {} } = {}) {
    requireOwner(ownerId);
    const movements = safeList(filters.movements, ownerId);
    const income = movements.filter((item) => ["income", "entrada", "sale", "venda"].includes(String(item.type || item.tipo || "").toLowerCase()));
    const expense = movements.filter((item) => ["expense", "saida", "sangria", "retirada"].includes(String(item.type || item.tipo || "").toLowerCase()));
    const sumAmount = (items) => items.reduce((sum, item) => sum + Math.max(0, Number(item.amount || item.valor || 0) || 0), 0);
    return {
      contextType: "cash_summary",
      ownerId,
      userId,
      period: filters.period || "current_month",
      totalIncome: sumAmount(income),
      totalExpense: sumAmount(expense),
      expectedBalance: sumAmount(income) - sumAmount(expense),
      paymentMethods: [],
      pendingAmounts: 0
    };
  }

  async function buildClientsAiContext({ ownerId, userId = "", filters = {} } = {}) {
    requireOwner(ownerId);
    const clients = safeList(filters.clients, ownerId);
    return {
      contextType: "client_analysis",
      ownerId,
      userId,
      totalClients: clients.length,
      activeClients: clients.filter((client) => client.active !== false && client.ativo !== false).length,
      recentSafeItems: clients.slice(0, 5).map((client) => ({
        firstName: String(client.name || client.nome || "").split(" ")[0] || "",
        ordersCount: Number(client.ordersCount || client.totalPedidos || 0) || 0
      }))
    };
  }

  async function buildPricingAiContext({ ownerId, userId = "", input = {} } = {}) {
    requireOwner(ownerId);
    return {
      contextType: "pricing_helper",
      ownerId,
      userId,
      weightGrams: input.weightGrams ?? null,
      printTimeMinutes: input.printTimeMinutes ?? null,
      materialType: input.materialType ?? null,
      materialCost: input.materialCost ?? null,
      machineCost: input.machineCost ?? null,
      energyCost: input.energyCost ?? null,
      suggestedPrice: input.suggestedPrice ?? null,
      margin: input.margin ?? null
    };
  }

  async function buildWhatsappMessageAiContext({ ownerId, userId = "", input = {} } = {}) {
    requireOwner(ownerId);
    return {
      contextType: "whatsapp_message_helper",
      ownerId,
      userId,
      orderStatus: input.orderStatus ?? null,
      customerFirstName: input.customerFirstName ?? null,
      safeOrderSummary: input.safeOrderSummary ?? null,
      messageGoal: input.messageGoal ?? null
    };
  }

  async function buildAiContextByType({ ownerId, userId = "", contextType, filters = {}, input = {} } = {}) {
    requireOwner(ownerId);
    if (contextType === "orders_summary") return buildOrdersAiContext({ ownerId, userId, filters });
    if (contextType === "inventory_summary") return buildInventoryAiContext({ ownerId, userId, filters });
    if (contextType === "cash_summary") return buildCashAiContext({ ownerId, userId, filters });
    if (contextType === "client_analysis") return buildClientsAiContext({ ownerId, userId, filters });
    if (contextType === "pricing_helper") return buildPricingAiContext({ ownerId, userId, input });
    if (contextType === "whatsapp_message_helper") return buildWhatsappMessageAiContext({ ownerId, userId, input });
    return { contextType: String(contextType || "unknown"), ownerId, userId, safe: true, items: [] };
  }

  const api = {
    CONTEXT_TYPES,
    MAX_SAFE_ITEMS,
    buildOrdersAiContext,
    buildInventoryAiContext,
    buildCashAiContext,
    buildClientsAiContext,
    buildPricingAiContext,
    buildWhatsappMessageAiContext,
    buildAiContextByType
  };

  global.SimplificaAiContextService = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
