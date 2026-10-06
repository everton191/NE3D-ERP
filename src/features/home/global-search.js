(function initHomeGlobalSearch(globalScope) {
  "use strict";

  const TYPE_LABELS = Object.freeze({
    pedido: "Pedidos",
    cliente: "Clientes",
    estoque: "Estoque",
    produto: "Produtos",
    producao: "Produção",
    tela: "Telas"
  });

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function firstText(source, keys) {
    for (const key of keys) {
      const value = String(source?.[key] || "").trim();
      if (value) return value;
    }
    return "";
  }

  function safeId(prefix, value, fallback) {
    const normalized = normalize(value || fallback).replace(/\s+/g, "-").slice(0, 80);
    return `${prefix}-${normalized || "item"}`;
  }

  function createResult({ type, id, title, subtitle = "", searchParts = [], route, entityId = "" }) {
    const cleanTitle = String(title || "").trim();
    if (!cleanTitle) return null;
    return Object.freeze({
      type,
      typeLabel: TYPE_LABELS[type] || type,
      id: String(id || safeId(type, cleanTitle)),
      title: cleanTitle,
      subtitle: String(subtitle || "").trim(),
      searchText: normalize([cleanTitle, ...searchParts].filter(Boolean).join(" ")),
      route: String(route || "dashboard"),
      entityId: String(entityId || ""),
      access: "READ"
    });
  }

  function projectOrders(orders) {
    return orders.map((order, index) => {
      const orderId = firstText(order, ["id", "numero", "number", "orderNumber"]) || String(index + 1);
      const customerName = firstText(order, ["clienteNome", "customerName", "cliente", "nomeCliente"]);
      const status = firstText(order, ["status"]);
      const itemNames = Array.isArray(order?.itens)
        ? order.itens.map((item) => firstText(item, ["nome", "descricao", "title"])).filter(Boolean)
        : [];
      return createResult({
        type: "pedido",
        id: `pedido-${orderId}`,
        title: customerName ? `${customerName} · Pedido #${orderId}` : `Pedido #${orderId}`,
        subtitle: status ? `Status: ${status}` : "Pedido",
        searchParts: [orderId, customerName, status, ...itemNames],
        route: "pedidos",
        entityId: orderId
      });
    }).filter(Boolean);
  }

  function projectCustomers(customers) {
    const byName = new Map();
    customers.forEach((customer) => {
      const name = firstText(customer, ["nome", "name", "customerName", "clienteNome"]);
      const normalizedName = normalize(name);
      if (!normalizedName || byName.has(normalizedName)) return;
      const sourceId = firstText(customer, ["customerId", "customer_id", "clienteId", "cliente_id"]);
      byName.set(normalizedName, createResult({
        type: "cliente",
        id: sourceId ? `cliente-${sourceId}` : safeId("cliente", normalizedName),
        title: name,
        subtitle: "Cliente",
        searchParts: [name],
        route: "clientes",
        entityId: sourceId
      }));
    });
    return Array.from(byName.values());
  }

  function projectInventory(inventory) {
    return inventory.map((item, index) => {
      const title = firstText(item, ["nome", "descricao", "name", "title"]);
      const sourceId = firstText(item, ["id", "inventoryId", "inventory_id"]) || String(index + 1);
      const code = firstText(item, ["codigo", "sku", "codigoBarras"]);
      const color = firstText(item, ["cor"]);
      const material = firstText(item, ["material", "tipo", "marca"]);
      return createResult({
        type: "estoque",
        id: `estoque-${sourceId}`,
        title,
        subtitle: [code, color, material].filter(Boolean).join(" · "),
        searchParts: [code, color, material],
        route: "estoque",
        entityId: sourceId
      });
    }).filter(Boolean);
  }

  function projectProducts(products) {
    return products.map((product, index) => {
      const title = firstText(product, ["title", "nome", "name"]);
      const sourceId = firstText(product, ["id", "productId", "product_id"]) || String(index + 1);
      return createResult({
        type: "produto",
        id: `produto-${sourceId}`,
        title,
        subtitle: "Produto da loja",
        searchParts: [firstText(product, ["slug"]), firstText(product, ["categoria", "category"])],
        route: "lojaAdmin",
        entityId: sourceId
      });
    }).filter(Boolean);
  }

  function projectProduction(production) {
    return production.map((job, index) => {
      const sourceId = firstText(job, ["id", "productionCode", "orderId", "order_id"]) || String(index + 1);
      const title = firstText(job, ["title", "name", "productionCode"]) || `Produção #${sourceId}`;
      const status = firstText(job, ["status"]);
      const orderId = firstText(job, ["orderId", "order_id"]);
      return createResult({
        type: "producao",
        id: `producao-${sourceId}`,
        title,
        subtitle: status ? `Status: ${status}` : "Produção",
        searchParts: [sourceId, status, orderId],
        route: "producao",
        entityId: sourceId
      });
    }).filter(Boolean);
  }

  function projectScreens(screens) {
    return screens.map((screen) => {
      const route = firstText(screen, ["route", "id", "screen"]);
      const title = firstText(screen, ["title", "label", "name"]);
      const aliases = Array.isArray(screen?.aliases) ? screen.aliases : [];
      return createResult({
        type: "tela",
        id: `tela-${route}`,
        title,
        subtitle: "Tela do aplicativo",
        searchParts: [route, ...aliases],
        route,
        entityId: route
      });
    }).filter(Boolean);
  }

  function buildIndex({ orders = [], customers = [], inventory = [], products = [], production = [], screens = [] } = {}) {
    const results = [
      ...projectOrders(Array.isArray(orders) ? orders : []),
      ...projectCustomers(Array.isArray(customers) ? customers : []),
      ...projectInventory(Array.isArray(inventory) ? inventory : []),
      ...projectProducts(Array.isArray(products) ? products : []),
      ...projectProduction(Array.isArray(production) ? production : []),
      ...projectScreens(Array.isArray(screens) ? screens : [])
    ];
    return Object.freeze(results);
  }

  function score(result, query) {
    const title = normalize(result.title);
    if (title === query) return 1000;
    if (title.startsWith(query)) return 700;
    if (result.searchText.includes(query)) return 400;
    const tokens = query.split(/\s+/).filter(Boolean);
    return tokens.length && tokens.every((token) => result.searchText.includes(token)) ? 200 + tokens.length : -1;
  }

  function search(index, query, { limit = 12 } = {}) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];
    return (Array.isArray(index) ? index : [])
      .map((result) => ({ result, score: score(result, normalizedQuery) }))
      .filter((entry) => entry.score >= 0)
      .sort((left, right) => right.score - left.score || left.result.title.localeCompare(right.result.title, "pt-BR"))
      .slice(0, Math.max(1, Number(limit) || 12))
      .map((entry) => entry.result);
  }

  function createState() {
    return { open: false, query: "", results: [] };
  }

  function updateState(state, query, results) {
    state.open = true;
    state.query = String(query || "");
    state.results = Array.isArray(results) ? results.slice() : [];
    return state;
  }

  function resetState(state) {
    state.open = false;
    state.query = "";
    state.results = [];
    return state;
  }

  const api = Object.freeze({ TYPE_LABELS, buildIndex, search, createState, updateState, resetState, normalize });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  globalScope.SimplificaHomeGlobalSearch = api;
})(typeof window !== "undefined" ? window : globalThis);
