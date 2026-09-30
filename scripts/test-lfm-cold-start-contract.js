"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const plugin = fs.readFileSync(path.join(root, "android/app/src/main/java/br/com/ne3d/erp/SimplificaLocalAiPlugin.kt"), "utf8");
const backend = fs.readFileSync(path.join(root, "android/app/src/main/java/br/com/ne3d/erp/ai/LlamaCppBackend.kt"), "utf8");
const readiness = plugin.match(/private fun ensureRuntimeReady[\s\S]*?\n    }/)?.[0] || "";

assert.match(plugin, /generateLocal[\s\S]*ensureRuntimeReady\(item, timeoutMs\)[\s\S]*backend\.generate/);
assert.match(plugin, /ensureRuntimeReady[\s\S]*State\.READY[\s\S]*awaitReadyStep\(backend\.loadModel[\s\S]*awaitReadyStep\(backend\.warmup/);
assert.match(plugin, /task\.get\(remainingMs\(deadlineNanos\), TimeUnit\.MILLISECONDS\)/);
assert.match(plugin, /put\("loaded", backend\?\.currentState\(\) == LlamaCppBackend\.State\.READY\)/);
assert(readiness, "readiness function must exist");
assert.doesNotMatch(readiness, /Thread\.sleep|while\s*\(/);
assert.match(backend, /fun currentState\(\): State = state/);
assert.match(plugin, /put\("writeExposed", 0\)/);

console.log("LFM cold-start readiness queue and bounded wait contract: PASS");
