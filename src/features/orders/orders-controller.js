(function attachOrdersController(global) {
  "use strict";
  function setDraftField(name, value, deps = {}) {
    const state = deps.getState();
    state[name] = name === "entradaPedido" ? Math.max(0, deps.parseNumber(value, 0)) : String(value || "");
    deps.setState(state);
    if (name === "entradaPedido") deps.refreshSummary();
    return state[name];
  }
  function setDiscount(value, deps = {}) {
    const state = deps.getState();
    const informed = Math.max(0, deps.parseNumber(value, 0));
    if (state.descontoTipoPedido === "porcentagem") {
      state.descontoPercentualPedido = Math.min(100, informed);
      state.descontoPedido = deps.totalItems() * state.descontoPercentualPedido / 100;
    } else {
      state.descontoPercentualPedido = 0;
      state.descontoPedido = informed;
    }
    deps.setState(state);
    deps.refreshSummary();
    return state.descontoPedido;
  }
  function setDiscountType(type = "fixo", deps = {}) {
    const state = deps.getState();
    state.descontoTipoPedido = type === "porcentagem" ? "porcentagem" : "fixo";
    state.descontoPercentualPedido = state.descontoTipoPedido === "porcentagem" && deps.totalItems() > 0
      ? Math.min(100, state.descontoPedido / deps.totalItems() * 100)
      : 0;
    deps.setState(state);
    return state.descontoTipoPedido;
  }
  function setFinalValue(value, deps = {}) {
    const state = deps.getState();
    const subtotal = deps.totalItems();
    const finalValue = Math.max(0, deps.parseNumber(value, subtotal));
    state.descontoPedido = Math.max(0, subtotal - Math.min(subtotal, finalValue));
    state.descontoTipoPedido = "fixo";
    state.descontoPercentualPedido = 0;
    deps.setState(state);
    deps.refreshSummary();
    return state.descontoPedido;
  }
  function normalizeSelectedItems(selected, items = []) {
    return [...new Set((Array.isArray(selected) ? selected : [])
      .map((index) => Number(index))
      .filter((index) => Number.isInteger(index) && index >= 0 && index < items.length))]
      .sort((a, b) => a - b);
  }
  function toggleSelectedItem(selected, index, checked, items = []) {
    const itemIndex = Number(index);
    if (!Number.isInteger(itemIndex) || !items[itemIndex]) return normalizeSelectedItems(selected, items);
    const next = new Set(normalizeSelectedItems(selected, items));
    const shouldSelect = checked === null ? !next.has(itemIndex) : checked === true;
    if (shouldSelect) next.add(itemIndex);
    else next.delete(itemIndex);
    return normalizeSelectedItems([...next], items);
  }
  function applyBulkQuantity(items, selected, quantity) {
    const normalized = normalizeSelectedItems(selected, items);
    const nextQuantity = Math.max(1, Number(quantity) || 1);
    normalized.forEach((index) => {
      const item = items[index];
      item.qtd = nextQuantity;
      item.total = (Number(item.valor) || 0) * nextQuantity;
    });
    return { selected: normalized, quantity: nextQuantity };
  }
  function buildOrderHeader(input = {}, deps = {}) {
    const customer = String(input.customer || "").trim();
    const phone = deps.normalizePhone(input.phone || "");
    const email = String(input.email || "").trim();
    const notes = String(input.notes || "").trim();
    const dueDate = String(input.dueDate || "").trim();
    const downPayment = Math.max(0, deps.parseNumber(input.downPayment, 0));
    const paymentMethod = deps.normalizePaymentMethod(input.paymentMethodId || "pix");
    return {
      cliente: customer, telefone: phone, email, observacao: notes, prazo: dueDate, entrada: downPayment,
      down_payment: downPayment, valor_entrada: downPayment,
      paymentMethodId: paymentMethod.id, payment_method_id: paymentMethod.id,
      paymentMethod: paymentMethod.name, payment_method_type: paymentMethod.type,
      status: input.status || "aberto"
    };
  }
  const api = Object.freeze({ setDraftField, setDiscount, setDiscountType, setFinalValue, normalizeSelectedItems, toggleSelectedItem, applyBulkQuantity, buildOrderHeader });
  global.SimplificaOrdersController = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
