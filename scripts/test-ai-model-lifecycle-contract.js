"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const plugin = read("android/app/src/main/java/br/com/ne3d/erp/SimplificaLocalAiPlugin.kt");
const runtime = read("src/services/simplifica3dAiRuntime.js");
const app = read("app.js");
const gradle = read("android/app/build.gradle");
const aiDir = path.join(root, "android/app/src/main/java/br/com/ne3d/erp/ai");
const manifest = JSON.parse(read("models/models-manifest.v1.json"));

assert.equal(manifest.artifacts.length, 1);
assert.equal(manifest.artifacts[0].modelId, "functiongemma-270m-it-q8_0");
assert.equal(manifest.artifacts[0].writeExposed, 0);

assert.match(plugin, /FunctionGemmaToolRuntime/);
assert.match(plugin, /fun importFunctionGemma/);
assert.match(plugin, /fun loadFunctionGemma/);
assert.match(plugin, /fun warmupFunctionGemma/);
assert.match(plugin, /fun predictFunctionGemma/);
assert.match(plugin, /put\("writeExposed", 0\)/);
assert.match(plugin, /FunctionGemma 270M Q8_0/);
assert.doesNotMatch(plugin, /LocalInferenceEngine|LocalModelCatalog|installModel|selectModel|benchmarkModel/);
assert.doesNotMatch(gradle, /litertlm|com\.google\.ai\.edge/);
assert.equal(fs.existsSync(path.join(aiDir, "LocalInferenceEngine.kt")), false);
assert.equal(fs.existsSync(path.join(aiDir, "LocalModelCatalog.kt")), false);
assert.equal(fs.existsSync(path.join(aiDir, "ModelArtifactManager.kt")), false);

assert.match(runtime, /FunctionGemmaOnlyProvider/);
assert.match(runtime, /shadow: false/);
assert.match(runtime, /FUNCTIONGEMMA_WRITE_BLOCKED/);
assert.doesNotMatch(runtime, /LegacyCapacitorAiProvider|LocalInferenceEngine|gemma-4-e2b/i);
assert.doesNotMatch(app.match(/function renderConfig[\s\S]*?\n}/)?.[0] || "", /assistente-ia|Seleção do modelo/);
assert.doesNotMatch(app, /setTimeout\(\(\) => preaquecerAssistenteIa3d\(\), 450\)/);

console.log("FunctionGemma é o único modelo Android/Web e WRITE permanece bloqueado.");
