(function attachSimplificaContextSnapshot(global) {
  "use strict";
  const scalar = (value, max = 160) => typeof value === "string" ? value.slice(0, max) : (typeof value === "number" || typeof value === "boolean" ? value : null);
  const ref = (value, keys = ["id", "name", "label", "status"]) => { if (!value || typeof value !== "object") return null; const result = {}; for (const key of keys) if (scalar(value[key]) != null) result[key] = scalar(value[key]); return Object.keys(result).length ? result : null; };
  const items = (value) => Array.isArray(value) ? value.slice(0, 12).map((item) => ref(item, ["id", "name", "label", "quantity", "status"])).filter(Boolean) : [];
  function buildContextSnapshot({ screen = "", route = "", session = null, app = {}, calculation = null, printer = null, selectedItems = [] } = {}) {
    const draft = session?.activeDraft || null; const order = app.currentOrder || app.order || null; const customer = app.currentCustomer || app.customer || session?.resolvedEntities?.customer || null;
    return Object.freeze({ currentScreen: scalar(screen || app.screen || route || app.route, 80) || "", currentEntity: ref(app.currentEntity), currentCustomer: ref(customer), currentOrder: ref(order), currentCalculation: ref(calculation || app.currentCalculation, ["id", "unitPrice", "totalPrice", "quantity"]), currentPrinter: ref(printer || app.currentPrinter), selectedItems: Object.freeze(items(selectedItems || app.selectedItems)), activeWorkflow: scalar(session?.activeTask?.intent, 80) || "", activeDraftId: scalar(draft?.draftId || draft?.draftVersion, 80) || "", storeId: scalar(app.storeId || app.companyId, 80) || "", userId: scalar(app.userId, 80) || "" });
  }
  function validateContextSnapshot(snapshot = {}) { const errors = []; for (const key of ["currentEntity", "currentCustomer", "currentOrder", "currentCalculation", "currentPrinter"]) { const value = snapshot[key]; if (value && (Array.isArray(value) || JSON.stringify(value).length > 512)) errors.push(`OVERSIZED_CONTEXT:${key}`); } if (Array.isArray(snapshot.selectedItems) && snapshot.selectedItems.length > 12) errors.push("TOO_MANY_SELECTED_ITEMS"); return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) }); }
  const api = Object.freeze({ buildContextSnapshot, validateContextSnapshot });
  global.SimplificaContextSnapshot = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
