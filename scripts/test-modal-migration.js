#!/usr/bin/env node
const { readFileSync } = require("fs");
const path = require("path");

let ok = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) { ok++; return true; }
  fail++;
  console.error(`  FAIL: ${msg}`);
}

const app = readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

console.log("=== MODAL MIGRATION TESTS ===\n");

// --- T1: UiV3.Dialog API contract ---
console.log("[T1] UiV3.Dialog API contract");

const dialogCalls = app.match(/UiV3\??\.(Dialog|Drawer|BottomSheet)\??\.?\s*\(\s*\{/g) || [];
assert(dialogCalls.length >= 10, `UiV3.Dialog calls exist in app.js (found ${dialogCalls.length})`);
console.log(`  Found ${dialogCalls.length} Dialog/Drawer/BottomSheet calls.`);

// --- T2: Migrated functions use UiV3.Dialog ---
console.log("\n[T2] Migrated functions use UiV3.Dialog");

const migrated = [
  "mostrarResumoAtualizacaoUmaVez",
  "mostrarModalLimitePlano",
  "abrirAgentesLocais",
  "criarAgenteLocal",
  "abrirPreviewCompartilhamentoLoja",
];

for (const fn of migrated) {
  const fnRegex = new RegExp(`function\\s+${fn}\\s*\\(`);
  const fnStart = app.search(fnRegex);
  assert(fnStart !== -1, `Function ${fn} exists`);
  if (fnStart === -1) continue;

  // Find function body (next 30 lines)
  const bodyLines = app.slice(fnStart).split("\n").slice(0, 30).join("\n");

  assert(bodyLines.includes("UiV3"), `${fn} uses UiV3.Dialog`);
  assert(!bodyLines.includes('getElementById("popup")'), `${fn} does NOT reference #popup`);
  assert(!bodyLines.includes("promoverPopupParaDialogUiV3"), `${fn} does NOT use promoverPopupParaDialogUiV3`);
}

// --- T3: No legacy patterns in migrated functions ---
console.log("\n[T3] No legacy patterns in migrated functions");

for (const fn of migrated) {
  const fnRegex = new RegExp(`function\\s+${fn}\\s*\\(`);
  const fnStart = app.search(fnRegex);
  if (fnStart === -1) continue;

  const bodyLines = app.slice(fnStart).split("\n").slice(0, 40).join("\n");
  assert(!bodyLines.includes("onclick="), `${fn} has no inline onclick handlers`);
  assert(!bodyLines.includes("event.stopPropagation()"), `${fn} has no stopPropagation`);
  assert(!bodyLines.includes("modal-backdrop"), `${fn} uses no manual modal-backdrop`);
}

// --- T4: action buttons use data- attributes ---
console.log("\n[T4] Action buttons use data-* attributes (no inline onclick)");

for (const fn of migrated) {
  const fnRegex = new RegExp(`function\\s+${fn}\\s*\\(`);
  const fnStart = app.search(fnRegex);
  if (fnStart === -1) continue;

  const bodyLines = app.slice(fnStart).split("\n").slice(0, 40).join("\n");
  const hasButton = bodyLines.includes("<button");
  if (hasButton) {
    assert(!bodyLines.includes('onclick="'), `${fn} buttons use data-* attributes, not onclick`);
  }
}

// --- T5: fecharPopup still exists as bridge ---
console.log("\n[T5] Bridge functions still exist");
assert(app.includes("function fecharPopup()"), "fecharPopup() still exists as legacy bridge");
assert(app.includes("function promoverPopupParaDialogUiV3("), "promoverPopupParaDialogUiV3() still exists");

// --- T6: Legacy popup usage count reduced ---
console.log("\n[T6] Legacy popup usage count");
const popupRefs = app.match(/document\.getElementById\("popup"\)/g) || [];
console.log(`  Remaining getElementById("popup") calls: ${popupRefs.length}`);
assert(popupRefs.length <= 62, `Reduced from ~67 to ${popupRefs.length} (target <= 62)`);

// --- T7: All functions have UiV3?. fallback ---
console.log("\n[T7] Optional chaining safety");
for (const fn of migrated) {
  const fnRegex = new RegExp(`function\\s+${fn}\\s*\\(`);
  const fnStart = app.search(fnRegex);
  if (fnStart === -1) continue;

  const bodyLines = app.slice(fnStart).split("\n").slice(0, 40).join("\n");
  assert(bodyLines.includes("UiV3?.Dialog?.") || bodyLines.includes("UiV3?.Dialog?.("), `${fn} uses optional chaining for safety`);
}

// --- Summary ---
console.log("\n=== RESULTS ===");
console.log(`  PASS: ${ok}`);
console.log(`  FAIL: ${fail}`);
console.log(fail === 0 ? "\n✅ ALL MODAL MIGRATION TESTS PASSED" : "\n❌ SOME TESTS FAILED");
process.exit(fail > 0 ? 1 : 0);
