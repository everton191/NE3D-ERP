"use strict";
const assert = require("node:assert/strict");
const controller = require("../src/features/orders/orders-controller.js");
let state = { clienteTelefonePedido: "", clienteEmailPedido: "", observacaoPedido: "", prazoPedido: "", statusPedido: "aberto", entradaPedido: 0, descontoPedido: 0, descontoTipoPedido: "fixo", descontoPercentualPedido: 0 };
let refreshes = 0;
const deps = { getState: () => ({ ...state }), setState: (next) => { state = next; }, parseNumber: (value, fallback) => Number(String(value).replace(",", ".")) || fallback, totalItems: () => 200, refreshSummary: () => { refreshes += 1; } };
assert.equal(controller.setDraftField("clienteEmailPedido", "a@b.com", deps), "a@b.com");
assert.equal(controller.setDraftField("entradaPedido", "12,5", deps), 12.5);
assert.equal(refreshes, 1);
assert.equal(controller.setDiscount("10", deps), 10);
state.descontoTipoPedido = "porcentagem";
assert.equal(controller.setDiscount("15", deps), 30);
assert.equal(state.descontoPercentualPedido, 15);
assert.equal(controller.setDiscountType("fixo", deps), "fixo");
assert.equal(state.descontoPercentualPedido, 0);
assert.equal(controller.setDiscountType("porcentagem", deps), "porcentagem");
assert.equal(state.descontoPercentualPedido, 15);
assert.equal(controller.setFinalValue("150", deps), 50);
assert.equal(state.descontoTipoPedido, "fixo");
assert.equal(state.descontoPercentualPedido, 0);
const items = [{ valor: 12 }, { valor: 8 }];
assert.deepEqual(controller.normalizeSelectedItems([1, "0", 1, -1, 8], items), [0, 1]);
assert.deepEqual(controller.toggleSelectedItem([0], 1, null, items), [0, 1]);
assert.deepEqual(controller.toggleSelectedItem([0, 1], 0, false, items), [1]);
assert.deepEqual(controller.applyBulkQuantity(items, [0, 1], "3"), { selected: [0, 1], quantity: 3 });
assert.deepEqual(items.map((item) => item.total), [36, 24]);
assert.deepEqual(controller.buildOrderHeader({ customer: "  Ana ", phone: " 1199 ", email: " a@b.com ", notes: " x ", dueDate: " 2026-10-01 ", downPayment: "10,5", paymentMethodId: "card", status: "confirmado" }, {
  normalizePhone: (value) => String(value).trim(), parseNumber: (value) => Number(String(value).replace(",", ".")), normalizePaymentMethod: (id) => ({ id, name: "Cartão", type: "card" })
}), { cliente: "Ana", telefone: "1199", email: "a@b.com", observacao: "x", prazo: "2026-10-01", entrada: 10.5, down_payment: 10.5, valor_entrada: 10.5, paymentMethodId: "card", payment_method_id: "card", paymentMethod: "Cartão", payment_method_type: "card", status: "confirmado" });
let editorState = null;
controller.openAuthorizedEdit(4, {
  loadOrder: () => ({ id: 4, cliente: "Ana", itens: [{ nome: "Peça", qtd: 2 }], descontoTipo: "porcentagem", descontoPercentual: "5", paymentMethodId: "pix" }),
  isCancelled: () => false, toast: () => {}, orderTotal: () => 30, clone: (value) => JSON.parse(JSON.stringify(value)),
  customerName: (order) => order.cliente, customerPhone: () => "85", customerEmail: () => "a@b.com",
  downPayment: () => 4, discount: () => 2, parseNumber: Number,
  normalizePaymentMethod: (id) => ({ id }), setEditorState: (next) => { editorState = next; },
  setCustomerSuggestionState: () => {}, audit: () => {}, navigate: () => {}, notify: () => {}
});
assert.equal(editorState.customer, "Ana");
assert.equal(editorState.discountPercentage, 5);
assert.equal(editorState.paymentMethodId, "pix");
let resetState = null;
controller.resetAfterSave({
  setEditorState: (next) => { resetState = next; },
  setQuickItemDraft: () => {}, setQuickStatusDraft: () => {}, setSelectedItems: () => {}, setQuickSelectedItems: () => {},
  setCustomerSuggestionState: () => {}, clearReview: () => {}, clearQuickDraft: () => {}
});
assert.equal(resetState.paymentMethodId, "pix");
assert.deepEqual(resetState.items, []);
assert.deepEqual(controller.describeOrderChanges({ itens: [{ nome: "Novo", qtd: 1 }] }, { itens: [{ nome: "Antigo", qtd: 1 }] }, { normalizarItensPedido: (order) => order.itens || [], getMateriaisItem: () => [] }), { adicionados: [], removidos: [], alterados: ["Novo"] });
const draftStorage = new Map();
const draftState = { customer: "Ana", items: [{ nome: "Peça" }], itemDraft: {}, open: false };
assert.equal(controller.hasQuickOrderDraft(draftState), true);
assert.equal(controller.saveQuickOrderDraft({}, draftState, { key: "draft", version: 1, now: () => "2026-09-20T12:00:00.000Z", normalizarItensPedido: (items) => items, storage: { setItem: (key, value) => draftStorage.set(key, value), removeItem: (key) => draftStorage.delete(key) }, diagnose: () => {} }), true);
assert.equal(controller.loadQuickOrderDraft({ key: "draft", version: 1, ttl: 1000, nowMillis: () => new Date("2026-09-20T12:00:00.000Z").getTime(), storage: { getItem: (key) => draftStorage.get(key), removeItem: (key) => draftStorage.delete(key) }, diagnose: () => {} }).cliente, "Ana");
assert.equal(controller.restoreQuickOrderDraft({ cliente: "Ana", telefone: "85", itens: [{ nome: "Peça" }], itemDraft: {} }, { findOrder: () => null, normalizePhone: String, normalizePaymentMethod: () => ({ id: "pix" }), normalizarItensPedido: (items) => items, currentLastItem: () => null, clone: (value) => value }).items.length, 1);
assert.equal(controller.createEmptyQuickOrderDraftState().paymentMethod, "pix");
console.log("Orders controller: campos, entrada e desconto preservados.");
