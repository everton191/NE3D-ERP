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
  function openAuthorizedEdit(id, deps = {}) {
    try {
      const order = deps.loadOrder(id);
      if (!order) return;
      if (deps.isCancelled(order)) {
        deps.toast("Pedido cancelado é somente leitura e não pode ser editado.", "info", 4200);
        return;
      }
      const items = Array.isArray(order.itens) && order.itens.length
        ? order.itens
        : [{ nome: order.nome || "Item", qtd: 1, valor: deps.orderTotal(order), total: deps.orderTotal(order) }];
      deps.setEditorState({
        items: deps.clone(items),
        selectedItem: items.length ? 0 : null,
        customer: deps.customerName(order),
        phone: deps.customerPhone(order),
        email: deps.customerEmail(order),
        notes: order.observacao || order.observacoes || "",
        dueDate: order.prazo || order.dataPrazo || "",
        status: order.status || "aberto",
        downPayment: deps.downPayment(order),
        discount: deps.discount(order),
        discountType: order.descontoTipo === "porcentagem" ? "porcentagem" : "fixo",
        discountPercentage: order.descontoTipo === "porcentagem" ? Math.max(0, deps.parseNumber(order.descontoPercentual, 0)) : 0,
        paymentMethodId: deps.normalizePaymentMethod(order.paymentMethodId || order.payment_method_id || order.paymentMethod || "pix").id,
        editingOrder: order,
        originalOrder: deps.clone(order)
      });
      deps.setCustomerSuggestionState({ query: deps.customerName(order), suggestions: [], loading: false, error: "" });
      deps.audit("pedido_edicao_solicitada", order);
      deps.navigate("pedido");
    } catch (error) {
      deps.notify(error, { area: "Pedidos", action: "Abrir pedido para edição", errorKey: "OPEN_ORDER_FAILED" });
    }
  }
  function cancelEdit(deps = {}) {
    deps.setEditorState({
      items: [], selectedItem: null, customer: "", phone: "", email: "", notes: "", dueDate: "", status: "",
      downPayment: 0, discount: 0, discountType: "fixo", discountPercentage: 0, editingOrder: null, originalOrder: null
    });
    deps.setSelectedItems([]);
    deps.setQuickSelectedItems([]);
    deps.setCustomerSuggestionState({ query: "", suggestions: [], loading: false, error: "" });
    deps.render();
  }
  function resetAfterSave(deps = {}) {
    deps.setEditorState({
      items: [], selectedItem: null, customer: "", phone: "", email: "", notes: "", dueDate: "", status: "",
      downPayment: 0, discount: 0, discountType: "fixo", discountPercentage: 0, paymentMethodId: "pix",
      editingOrder: null, originalOrder: null
    });
    deps.setQuickItemDraft({ nome: "", qtd: "1", valor: "", tempoHoras: "", pesoGramas: "" });
    deps.setQuickStatusDraft("");
    deps.setSelectedItems([]);
    deps.setQuickSelectedItems([]);
    deps.setCustomerSuggestionState({ query: "", suggestions: [], loading: false, error: "" });
    deps.clearReview();
    deps.clearQuickDraft();
  }
  function describeOrderChanges(nextOrder = {}, previousOrder = {}, deps = {}) {
    const previous = deps.normalizarItensPedido(previousOrder);
    const next = deps.normalizarItensPedido(nextOrder);
    const serialize = (item) => JSON.stringify({ nome: item.nome, qtd: Number(item.qtd) || 1, valor: Number(item.valor) || 0, total: Number(item.total) || 0, tempoHoras: Number(item.tempoHoras) || 0, materiais: deps.getMateriaisItem(item).map((material) => ({ materialId: material.materialId || "", quantidade: Number(material.quantidade) || 0, unidade: material.unidade || "" })) });
    return { adicionados: next.slice(previous.length).map((item) => item.nome || "Item"), removidos: previous.filter((_, index) => !next[index]).map((item) => item.nome || "Item"), alterados: next.filter((item, index) => previous[index] && serialize(item) !== serialize(previous[index])).map((item) => item.nome || "Item") };
  }
  function hasQuickOrderDraft(state = {}) {
    const item = state.itemDraft || {};
    return !!(state.customer || state.phone || state.email || state.notes || state.dueDate || state.downPayment || state.items?.length || state.editingOrder || item.nome || item.valor || item.tempoHoras || item.pesoGramas);
  }
  function createQuickOrderDraftSnapshot(state = {}, deps = {}) {
    return { version: deps.version, updatedAt: deps.now(), screen: state.screen || "", open: state.open === true, pedidoEditandoId: state.editingOrder?.id || "", cliente: state.customer || "", telefone: state.phone || "", email: state.email || "", observacao: state.notes || "", prazo: state.dueDate || "", entrada: state.downPayment || 0, paymentMethod: state.paymentMethod || state.editingOrder?.paymentMethodId || "pix", status: state.status || state.editingOrder?.status || "aberto", itens: deps.normalizarItensPedido(state.items || []).slice(0, 80), itemDraft: { ...(state.itemDraft || {}) }, lastItem: state.lastItem ? { ...state.lastItem } : null };
  }
  function hasQuickOrderDraftContent(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return false;
    const item = snapshot.itemDraft || {};
    return !!(snapshot.cliente || snapshot.telefone || snapshot.email || snapshot.observacao || snapshot.prazo || Number(snapshot.entrada) > 0 || (Array.isArray(snapshot.itens) && snapshot.itens.length) || item.nome || item.valor || item.tempoHoras || item.pesoGramas);
  }
  function saveQuickOrderDraft(options = {}, state = {}, deps = {}) {
    try {
      if (!options.force && !state.open && !hasQuickOrderDraft(state)) return false;
      const snapshot = createQuickOrderDraftSnapshot(state, deps);
      if (!hasQuickOrderDraftContent(snapshot)) { deps.storage.removeItem(deps.key); return false; }
      deps.storage.setItem(deps.key, JSON.stringify(snapshot)); return true;
    } catch (error) { deps.diagnose(error); return false; }
  }
  function loadQuickOrderDraft(deps = {}) {
    try {
      const raw = deps.storage.getItem(deps.key); if (!raw) return null;
      const snapshot = JSON.parse(raw); const updatedAt = new Date(snapshot.updatedAt || 0).getTime();
      if (snapshot.version !== deps.version || !updatedAt || deps.nowMillis() - updatedAt > deps.ttl || !hasQuickOrderDraftContent(snapshot)) { deps.storage.removeItem(deps.key); return null; }
      return snapshot;
    } catch (error) { deps.diagnose(error); return null; }
  }
  function clearQuickOrderDraft(deps = {}) { try { deps.storage.removeItem(deps.key); return true; } catch (error) { deps.diagnose(error); return false; } }
  function restoreQuickOrderDraft(snapshot, deps = {}) {
    if (!snapshot) return null;
    const editingOrder = snapshot.pedidoEditandoId ? deps.findOrder(snapshot.pedidoEditandoId) || null : null;
    const status = String(snapshot.status || "");
    if (status && editingOrder) editingOrder.status = status;
    return { customer: String(snapshot.cliente || "").trim(), phone: deps.normalizePhone(snapshot.telefone || ""), email: String(snapshot.email || "").trim(), notes: String(snapshot.observacao || "").trim(), dueDate: String(snapshot.prazo || "").trim(), downPayment: Math.max(0, Number(snapshot.entrada) || 0), paymentMethod: deps.normalizePaymentMethod(snapshot.paymentMethod || "pix").id, items: deps.normalizarItensPedido(Array.isArray(snapshot.itens) ? snapshot.itens : []), itemDraft: { nome: String(snapshot.itemDraft?.nome || ""), qtd: String(snapshot.itemDraft?.qtd || "1"), valor: String(snapshot.itemDraft?.valor || ""), tempoHoras: String(snapshot.itemDraft?.tempoHoras || ""), pesoGramas: String(snapshot.itemDraft?.pesoGramas || "") }, lastItem: snapshot.lastItem || deps.currentLastItem(), status, editingOrder, originalOrder: editingOrder ? deps.clone(editingOrder) : null };
  }
  function createEmptyQuickOrderDraftState() { return { items: [], customer: "", phone: "", email: "", notes: "", dueDate: "", downPayment: 0, discount: 0, editingOrder: null, originalOrder: null, itemDraft: { nome: "", qtd: "1", valor: "", tempoHoras: "", pesoGramas: "" }, status: "", paymentMethod: "pix", selectedItem: null, selectedQuickItems: [], customerSuggestion: { query: "", suggestions: [], loading: false, error: "" } }; }
  function readQuickOrderItemDraft(fields = {}) { return { nome: String(fields.nome || "").trim(), qtd: String(fields.qtd || "1"), valor: String(fields.valor || ""), tempoHoras: String(fields.tempoHoras || ""), pesoGramas: String(fields.pesoGramas || "") }; }
  function readQuickOrderFields(fields = {}, current = {}, deps = {}) { return { customer: String(fields.customer || current.customer || "").trim(), phone: deps.normalizePhone(fields.phone || current.phone || ""), email: String(fields.email || current.email || "").trim(), notes: String(fields.notes || current.notes || "").trim(), dueDate: String(fields.dueDate || current.dueDate || "").trim(), downPayment: Math.max(0, deps.parseNumber(fields.downPayment ?? current.downPayment, 0)), status: String(fields.status || current.status || current.editingOrder?.status || "aberto"), paymentMethod: deps.normalizePaymentMethod(fields.paymentMethod || current.paymentMethod || "pix").id }; }
  function editItemName(items = [], index, name) { if (!items[index]) return false; items[index].nome = name; return true; }
  function editItemQuantity(items = [], index, value, deps = {}) { if (!items[index]) return null; const quantity = deps.parseStrict(value, "quantidade", { min: 1 }); items[index].qtd = quantity; items[index].total = quantity * (Number(items[index].valor) || 0); return quantity; }
  function editItemPrice(items = [], index, value, deps = {}) { if (!items[index]) return null; const price = deps.parseStrict(value, "valor", { min: 0 }); items[index].valor = price; items[index].total = price * (Number(items[index].qtd) || 1); return price; }
  function ensureItemMaterials(items = [], index, deps = {}) { if (!items[index]) return []; items[index] = deps.normalizeItem(items[index]); if (!Array.isArray(items[index].materiais)) items[index].materiais = []; return items[index].materiais; }
  function adjustItemTotalForMaterial(items = [], itemIndex, previous = {}, current = {}) { const item = items[itemIndex]; if (!item) return false; const oldTotal = (Number(previous.quantidade) || 0) * (Number(previous.valorUnitario) || 0); const newTotal = (Number(current.quantidade) || 0) * (Number(current.valorUnitario) || 0); item.total = Math.max(0, (Number(item.total) || 0) + newTotal - oldTotal); item.valor = item.total / Math.max(1, Number(item.qtd) || 1); return true; }
  const api = Object.freeze({ setDraftField, setDiscount, setDiscountType, setFinalValue, normalizeSelectedItems, toggleSelectedItem, applyBulkQuantity, buildOrderHeader, openAuthorizedEdit, cancelEdit, resetAfterSave, describeOrderChanges, hasQuickOrderDraft, createQuickOrderDraftSnapshot, hasQuickOrderDraftContent, saveQuickOrderDraft, loadQuickOrderDraft, clearQuickOrderDraft, restoreQuickOrderDraft, createEmptyQuickOrderDraftState, readQuickOrderItemDraft, readQuickOrderFields, editItemName, editItemQuantity, editItemPrice, ensureItemMaterials, adjustItemTotalForMaterial });
  global.SimplificaOrdersController = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
