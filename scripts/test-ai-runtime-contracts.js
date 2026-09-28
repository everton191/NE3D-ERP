"use strict";
const assert = require("node:assert/strict");
const intents = require("../src/ai/intent-registry.js");
const plans = require("../src/ai/action-plan.js");
const context = require("../src/ai/context-snapshot.js");
const core = require("../src/ai-3d/core.js");
global.Simplifica3dAiCore = core;
const resolver = require("../src/ai-3d/entity-resolution.js");
global.Simplifica3dEntityResolution = resolver;
const { DraftManager } = require("../src/ai/draft-manager.js");
const router = require("../src/ai/deterministic-router.js");

class MemoryStorage { constructor() { this.values = new Map(); } getItem(key) { return this.values.get(key) || null; } setItem(key, value) { this.values.set(key, value); } }
assert.equal(intents.definitions.length, 34);
assert.equal(intents.validateIntentRegistry().ok, true);
assert.equal(intents.validateIntentRegistry([{ ...intents.definitions[0], workflowId: "missing.workflow" }]).ok, false);
assert.equal(intents.resolveIntentId("ORDER.CREATE"), "orders.create");
assert.equal(intents.resolveIntentId("orders.create"), "orders.create");
assert.equal(intents.intentForAction("orders.prepare_create"), "orders.create");
assert.equal(router.resolve("quanto tem no caixa?").canonicalIntent, "cash.get_status");

const unsafe = plans.validateActionPlan({ intent: "orders.create", fields: { customerId: { value: "invented", source: "MODEL_INFERENCE" } } });
assert.equal(unsafe.ok, false);
assert(unsafe.errors.includes("UNTRUSTED_MODEL_FIELD:customerId"));
assert.equal(plans.validateActionPlan({ intent: "orders.create", domain: "cash", fields: {} }).ok, false);

const manager = new core.ConversationTaskManager({ storage: new MemoryStorage(), storageKey: "lote-2" });
const drafts = new DraftManager({ manager, entityResolver: resolver });
let plan = drafts.createDraft("ORDER.CREATE", { customer: "Maria", product: "chaveiro", quantity: 3 });
plan = drafts.resolveEntities({ customerCandidates: [{ id: "customer-maria", name: "Maria Silva" }] });
assert.equal(plan.intent, "orders.create");
assert.equal(plan.fields.customerId.value, "customer-maria");
assert.deepEqual(plan.missingRequired, ["unitPrice"]);
const draftVersion = manager.session.activeDraft.draftVersion;
plan = drafts.continueDraft("12 reais");
assert.equal(manager.session.activeDraft.draftVersion > draftVersion, true);
assert.equal(plan.fields.unitPrice.value, 12);
assert.deepEqual(plan.missingRequired, []);
assert.equal(drafts.prepare().status, "REQUIRES_CONFIRMATION");
assert.equal(drafts.complete().status, "BLOCKED");
assert.equal(manager.session.activeDraft.items[0].valor.value, 12);

const canonicalEntity = resolver.resolveCanonicalEntity({ entityType: "customer", query: "Maria", candidates: [{ id: "customer-maria", name: "Maria Silva" }] });
assert.deepEqual(canonicalEntity, { status: "RESOLVED", entityType: "customer", entityId: "customer-maria", displayName: "Maria Silva", confidence: 1, candidates: [{ id: "customer-maria", label: "Maria Silva" }], reason: "customer resolvido por nome" });
const ambiguous = resolver.resolveCanonicalEntity({ entityType: "customer", query: "Maria", candidates: [{ id: "a", name: "Maria Silva" }, { id: "b", name: "Maria Santos" }] });
assert.equal(ambiguous.status, "AMBIGUOUS");

const snapshot = context.buildContextSnapshot({ screen: "calculator", session: manager.session, app: { storeId: "store-a", userId: "user-a", currentCustomer: { id: "customer-maria", name: "Maria Silva", privateData: "not copied" } }, calculation: { id: "quote-1", unitPrice: 12, totalPrice: 36, ignored: "not copied" }, selectedItems: Array.from({ length: 15 }, (_, id) => ({ id, name: `item-${id}` })) });
assert.equal(snapshot.currentScreen, "calculator");
assert.equal(snapshot.storeId, "store-a");
assert.equal(snapshot.selectedItems.length, 12);
assert.equal(Object.hasOwn(snapshot.currentCustomer, "privateData"), false);
assert.equal(context.validateContextSnapshot(snapshot).ok, true);
console.log("AI runtime contracts: registry, ActionPlan, context, canonical entity and order draft continuation passed.");
