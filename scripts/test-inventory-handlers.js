"use strict";
const assert = require("node:assert/strict");
const { saveQuickInventory } = require("../src/features/inventory/inventory-handlers.js");
let locked = false; let materialAdded = false; const events = [];
saveQuickInventory(null, {
  locked: () => locked, setLocked: (value) => { locked = value; }, toast: (...args) => events.push(args),
  quantity: () => 2, focus: () => {}, startOperation: () => "op", snapshot: () => String(materialAdded),
  addMaterial: async () => { materialAdded = true; }, closePopup: () => events.push(["close"]),
  updateOperation: () => {}, completeOperation: () => events.push(["complete"]), failOperation: () => {}, diagnose: () => {}
}).then(() => { assert.equal(locked, false); assert.ok(events.some((event) => event[0] === "close")); console.log("Inventory handlers: atualização rápida preservada."); });
