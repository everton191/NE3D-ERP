"use strict";

const assert = require("assert");
const fs = require("fs");
require("../src/assistant-core/schemas/contracts.js");
const { COMPONENTS, AssistantUiComponents } = require("../src/assistant-core/ui-contracts/components.js");
const packs = [
  require("../apps/simplifica/assistant-pack/index.js"),
  require("../apps/rural/assistant-pack/index.js"),
  require("../apps/tec/assistant-pack/index.js"),
  require("../apps/store-editor/assistant-pack/index.js")
];

assert.deepStrictEqual(COMPONENTS, [
  "AssistantLauncher", "AssistantPanel", "AssistantComposer", "AssistantContextChip",
  "AssistantResultCard", "AssistantConfirmation", "AssistantAttachment"
]);
assert.strictEqual(new Set(packs.map((pack) => pack.modelScope)).size, packs.length);

for (const pack of packs) {
  const ui = new AssistantUiComponents({ appId: pack.manifest.appId, appName: pack.manifest.appName, assistantName: pack.manifest.appName });
  const launcher = ui.launcher({ state: "idle", description: `Abrir ${pack.manifest.appName}`, iconHtml: "<svg></svg>", onActivate: "openAssistant", onDrag: "dragAssistant" });
  assert.match(launcher, new RegExp(`data-assistant-app="${pack.manifest.appId}"`));
  assert.match(launcher, /onclick="openAssistant\(event\)"/);
  assert.match(launcher, /onpointerdown="dragAssistant\(event\)"/);
  assert.match(ui.panel({ state: "active", headerHtml: "<header></header>", bodyHtml: "<main></main>" }), /AssistantPanel/);
}

const ui = new AssistantUiComponents({ appId: "security-test", assistantName: "Assistente <local>" });
assert.doesNotMatch(ui.launcher({ onActivate: "alert(1)", description: "<script>" }), /onclick=/);
assert.match(ui.launcher({ description: "<script>" }), /&lt;script&gt;/);

const card = ui.resultCard({
  kind: "order<script>", title: "Pedido <b>1</b>", status: "Pronto & seguro",
  subtitle: "Nada foi salvo <script>", lines: ["Cliente <João>"],
  action: { routeId: "orders.list", label: "Abrir <pedido>" }
}, { messageId: "message-1", onOpen: "openResult" });
assert.match(card, /AssistantResultCard/);
assert.match(card, /Pedido &lt;b&gt;1&lt;\/b&gt;/);
assert.match(card, /Cliente &lt;João&gt;/);
assert.match(card, /onclick="openResult\(this\.dataset\.messageId\)"/);
assert.doesNotMatch(card, /<script>/);

assert.match(ui.contextChip({ type: "order", id: "1842" }, { onRemove: "removeContext" }), /AssistantContextChip/);
assert.match(ui.contextActionButtons([{ id: "summary", label: "Resumir" }], { onAction: "runAction" }), /runAction\('summary'\)/);
assert.match(ui.composer({ onSubmit: "sendAssistant", disabled: true }), /AssistantComposer/);
assert.match(ui.confirmation({ onConfirm: "confirmAction", onCancel: "cancelAction" }), /AssistantConfirmation/);
assert.match(ui.attachment({ previewUrl: "blob:test", details: "120 × 80", onRemove: "removeAttachment" }), /AssistantAttachment/);

const app = fs.readFileSync("app.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");
assert.match(index, /src\/assistant-core\/ui-contracts\/components\.js/);
assert.match(app, /function getAssistantUiComponents3d/);
assert.match(app, /getAssistantUiComponents3d\(\)\?\.launcher/);
assert.match(app, /getAssistantUiComponents3d\(\)\?\.resultCard/);
assert.match(app, /const ui = getAssistantUiComponents3d\(\)/);
assert.match(app, /ui\?\.contextActionButtons/);
assert.match(app, /ui\?\.contextChip/);
assert.match(app, /ui\?\.confirmation/);
assert.match(app, /ui\?\.attachment/);
assert.match(app, /ui\?\.composer/);
assert.match(app, /ui\?\.panel/);

console.log("Assistant UI: sete componentes reutilizáveis, isolamento por pack, escaping e integração no Simplifica validados.");
