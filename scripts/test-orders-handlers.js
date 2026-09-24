"use strict";

const assert = require("node:assert/strict");
const { changeOrderStatus, requestOrderDelete, requestOrderEdit, cancelOrderSafely, addCalculatedItem, openOrderItemActions, mountQuickOrderDrawer, openQuickOrder, refreshQuickOrder, continueQuickOrder, manageQuickOrderKeyboard, selectOrderItem, toggleOrderItemSelection, selectAllOrderItems, clearOrderItemSelection, applyOrderItemsQuantity, requestOrderItemsQuantity, removeSelectedOrderItems, removeCurrentOrderItem, finalizeOrderUi } = require("../src/features/orders/orders-handlers.js");

async function run() {
  const orders = [{ id: 7, status: "aberto" }];
  const events = [];
  const inProgress = new Set();
  const result = await changeOrderStatus(7, "em_producao", {
    allowAction: () => true,
    orders: () => orders,
    isCancelled: () => false,
    toast: (...args) => events.push(["toast", ...args]),
    inProgress: () => inProgress,
    requestDelete: async () => { throw new Error("não esperado"); },
    now: () => "2026-09-20T12:00:00.000Z",
    markForSync: (order) => order,
    editUseCase: () => ({
      prepare: (input) => ({ success: true, input }),
      commit: async (prepared) => ({ success: true, data: { order: prepared.input.proposed } })
    }),
    audit: (...args) => events.push(["audit", ...args]),
    history: (...args) => events.push(["history", ...args]),
    statusLabel: (status) => status,
    render: () => events.push(["render"]),
    log: () => { throw new Error("não esperado"); },
    notify: () => { throw new Error("não esperado"); }
  });
  assert.equal(result.success, true);
  assert.equal(result.data.order.status, "em_producao");
  assert.equal(inProgress.size, 0);
  assert.ok(events.some((event) => event[0] === "audit"));
  assert.ok(events.some((event) => event[0] === "render"));

  let cancelInput = null;
  const deleted = await requestOrderDelete(7, {
    allowAction: () => true,
    loadOrder: () => ({ id: 7, stock_deducted_at: "yes" }),
    audit: () => {},
    confirmSensitive: async () => true,
    hasStockConsumption: () => true,
    stockWasDeducted: () => true,
    confirmAction: async () => true,
    cancelSafely: async (id, input) => { cancelInput = { id, input }; return { success: true }; },
    notify: () => { throw new Error("não esperado"); }
  });
  assert.equal(deleted.success, true);
  assert.deepEqual(cancelInput, { id: 7, input: { returnStock: true, reason: "Cancelamento solicitado pelo usuário" } });

  let editedId = null;
  await requestOrderEdit(7, {
    allowAction: () => true, loadOrder: () => ({ id: 7 }), isCancelled: () => false, toast: () => {},
    confirmSensitive: async () => true, consumeCredit: async () => true, openAuthorizedEdit: (id) => { editedId = id; },
    notify: () => { throw new Error("não esperado"); }
  });
  assert.equal(editedId, 7);

  const cancelled = await cancelOrderSafely(7, { returnStock: true, reason: "teste" }, {
    allowAction: () => true,
    nowMillis: () => 123,
    cancelUseCase: () => ({
      prepare: (input) => ({ success: true, input }),
      commit: async () => ({ success: true, data: { order: { id: 7, cancelReason: "teste" }, effects: { inventoryChanged: true, cashMovements: 1, cashChanged: true } } })
    }),
    toast: (...args) => events.push(["toast", ...args]),
    clearEditingOrder: () => events.push(["clear"]),
    audit: (...args) => events.push(["audit", ...args]),
    history: (...args) => events.push(["history", ...args]),
    customerName: () => "Ana",
    render: () => events.push(["render"]),
    notify: () => { throw new Error("não esperado"); }
  });
  assert.equal(cancelled.success, true);
  assert.equal(cancelled.data.order.id, 7);

  const orderItems = [];
  let selectedItem = null;
  const added = await addCalculatedItem({ nome: "Peça", qtd: 1, valor: 10, total: 10 }, {}, {
    isAdding: () => false, setAdding: () => {}, document: { getElementById: () => null }, toast: () => {},
    validateItem: (item) => ({ ok: true, item }), fingerprint: () => "piece", nowMillis: () => 10000,
    lastFingerprint: () => "", lastAddedAt: () => 0, setLastAdded: () => {}, findEquivalent: () => -1,
    findSimilar: () => -1, items: () => orderItems, decideDuplicate: async () => null, consumeCredit: async () => true,
    setSelectedItem: (index) => { selectedItem = index; }, recordUsage: () => {}, minimizeCalculator: () => {},
    navigateToOrder: () => {}, notify: () => { throw new Error("não esperado"); }
  });
  assert.equal(added, true);
  assert.equal(orderItems.length, 1);
  assert.equal(selectedItem, 0);

  let focusedItem = null;
  await openOrderItemActions(0, {
    items: () => [{ nome: "Peça" }], isItemSelected: () => false, selectedItems: () => [],
    requestChoice: async () => "editar", selectItem: () => {}, focusItemEditor: (index) => { focusedItem = index; },
    toggleItemSelection: () => {}, changeSelectedQuantity: () => {}, removeItem: () => {}, removeSelectedItems: () => {}
  });
  assert.equal(focusedItem, 0);

  const popup = {};
  assert.equal(mountQuickOrderDrawer({}, { document: { getElementById: () => popup }, renderQuickOrder: () => "<form>", promoteDrawer: (node, config) => ({ node, config }) }).node, popup);
  let resetQuickState = false;
  openQuickOrder({ reset: true }, {
    allowAction: () => true, restoreDraft: () => {}, hasDraft: () => false, clearDraft: () => {}, resetState: () => { resetQuickState = true; },
    document: { getElementById: () => popup }, renderQuickOrder: () => "", promoteDrawer: () => true, deferFocus: () => {}
  });
  assert.equal(resetQuickState, true);
  let syncedQuickOrder = false;
  refreshQuickOrder({}, { document: { querySelector: () => ({}), getElementById: () => popup }, syncDraft: () => { syncedQuickOrder = true; }, renderQuickOrder: () => "", promoteDrawer: () => true });
  assert.equal(syncedQuickOrder, true);
  let editorTab = null;
  continueQuickOrder({ syncDraft: () => {}, closePopup: () => {}, hasItems: () => true, openOrderEditor: (hasItems) => { editorTab = hasItems; } });
  assert.equal(editorTab, true);
  let closedQuickPopup = false;
  manageQuickOrderKeyboard({ key: "Escape", preventDefault: () => {}, target: {} }, { closePopup: () => { closedQuickPopup = true; } });
  assert.equal(closedQuickPopup, true);

  const selectableItems = [{ qtd: 1 }, { qtd: 1 }];
  let selectedItems = [];
  let currentItem = null;
  selectOrderItem(1, { items: () => selectableItems, setCurrentItem: (index) => { currentItem = index; }, updateSelectedItemUi: () => {} });
  assert.equal(currentItem, 1);
  toggleOrderItemSelection(0, true, { items: () => selectableItems, selectedItems: () => selectedItems, setSelectedItems: (value) => { selectedItems = value; }, toggleSelection: () => [0], selectItem: () => {}, render: () => {} });
  assert.deepEqual(selectedItems, [0]);
  selectAllOrderItems({ items: () => selectableItems, setSelectedItems: (value) => { selectedItems = value; }, render: () => {} });
  assert.deepEqual(selectedItems, [0, 1]);
  clearOrderItemSelection({ setSelectedItems: (value) => { selectedItems = value; }, render: () => {} });
  assert.deepEqual(selectedItems, []);
  selectedItems = [0, 1];
  applyOrderItemsQuantity("3", { selectedItems: () => selectedItems, items: () => selectableItems, readQuantity: () => "", applyQuantity: () => ({ quantity: 3 }), toast: () => {}, render: () => {} });
  let requestedQuantity = null;
  requestOrderItemsQuantity({ selectedItems: () => [0], prompt: () => "4", applyQuantity: (value) => { requestedQuantity = value; } });
  assert.equal(requestedQuantity, "4");
  selectedItems = [0];
  await removeSelectedOrderItems({ selectedItems: () => selectedItems, confirm: async () => true, consumeCredit: async () => true, items: () => selectableItems, setSelectedItems: (value) => { selectedItems = value; }, setCurrentItem: (index) => { currentItem = index; }, toast: () => {}, render: () => {} });
  assert.equal(selectableItems.length, 1);
  assert.deepEqual(selectedItems, []);
  let removedCurrent = null;
  await removeCurrentOrderItem({ currentItem: () => 0, items: () => selectableItems, toast: () => {}, removeItem: async (index) => { removedCurrent = index; } });
  assert.equal(removedCurrent, 0);

  let saved = false;
  await finalizeOrderUi({
    editingOrder: () => null, editingOrderOriginal: () => null, isSaving: () => false, setSaving: () => {},
    plan: () => ({ status: "ativo" }), showPlanBlock: () => { throw new Error("não esperado"); },
    createHeader: () => ({ cliente: "Ana", telefone: "", email: "", down_payment: 0, status: "aberto", observacao: "", prazo: "" }), render: () => {},
    verifyOrderLimit: async () => true, alert: () => { throw new Error("não esperado"); }, verifyCustomerLimit: () => true,
    now: () => new Date("2026-09-20T12:00:00.000Z"), nowMillis: () => 123, preparationUseCase: () => ({ prepare: () => ({ items: [{ nome: "Peça" }], financial: { total: 12 }, record: { id: "p1", status: "aberto", total: 12, itens: [{ nome: "Peça" }] } }) }),
    customerSuggestion: () => null, items: () => [{ nome: "Peça" }], setItems: () => {}, discount: () => ({ value: 0, type: "fixo", percentage: 0 }), paymentMethod: () => "pix", sequenceNumber: () => 1, nextSequenceNumber: () => 1,
    reviewConfirmed: () => false, openReview: () => { throw new Error("não esperado"); }, disposableValidation: () => false,
    commandService: () => ({ finalizeOrder: async () => ({ status: "COMMITTED", cashReceipt: null }) }), editUseCase: () => ({}), transactionExecutor: () => ({}), reserveCredit: () => ({}), compensateCredit: () => {}, registeredCash: () => 0, clearReview: () => {},
    recordCustomerSuggestion: () => {}, recordUsage: () => {}, recordFinancialShadow: () => {}, log: () => {}, scheduleSync: () => {}, audit: () => {}, history: () => {}, toast: () => {}, recordMonetization: () => {}, resetAfterSave: () => { saved = true; }, shouldFinishOnboarding: () => false, finishOnboarding: () => {}, currentCustomer: () => "Ana", notify: () => { throw new Error("não esperado"); }
  });
  assert.equal(saved, true);
}

run().then(() => console.log("Orders handlers: alteração de status preservada.")).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
