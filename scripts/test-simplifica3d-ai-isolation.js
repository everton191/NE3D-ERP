"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

require("../src/assistant-core/schemas/contracts.js");
const pack = require("../apps/simplifica/assistant-pack/index.js");

assert.equal(pack.manifest.appId, "simplifica-3d");
assert.equal(pack.modelScope, "simplifica-3d");
assert.equal(pack.status, "ACTIVE");
assert.equal(typeof pack.createRuntime, "undefined", "não deve existir fábrica compartilhada de runtimes");
assert(pack.manifest.domains.some((domain) => domain.id === "store"), "a Loja deve continuar como domínio interno do Simplifica 3D");

const foreignPacks = [
  "apps/rural/assistant-pack/index.js",
  "apps/tec/assistant-pack/index.js",
  "apps/store-editor/assistant-pack/index.js"
];
foreignPacks.forEach((file) => assert.equal(exists(file), false, `${file} não pode integrar o Simplifica 3D`));
assert.equal(exists("src/assistant-core/engine/app-assistant-runtime.js"), false, "runtime multiapp não pode integrar o Simplifica 3D");

for (const file of ["index.html", "sw.js"]) {
  const source = read(file);
  assert(!source.includes("app-assistant-runtime"), `${file} não pode carregar runtime multiapp`);
  assert(!source.includes("apps/rural/assistant-pack"), `${file} não pode carregar a IA Rural`);
  assert(!source.includes("apps/tec/assistant-pack"), `${file} não pode carregar a IA Tec`);
  assert(!source.includes("apps/store-editor/assistant-pack"), `${file} não pode criar outra IA dentro do ERP`);
  assert(source.includes("apps/simplifica/assistant-pack/index.js"), `${file} deve carregar somente o pack do Simplifica 3D`);
}

const modelInstaller = read("android/app/src/main/java/br/com/ne3d/erp/ai/FunctionGemmaModelInstaller.kt");
const plugin = read("android/app/src/main/java/br/com/ne3d/erp/SimplificaLocalAiPlugin.kt");
const androidBuild = read("android/app/build.gradle");
assert(androidBuild.includes('applicationId simplificaPilotBuild ? "br.com.ne3d.erp.pilot" : "br.com.ne3d.erp"'), "o APK deve manter pacote próprio");
assert(modelInstaller.includes('context.noBackupFilesDir, "models/functiongemma/0.2.0-q8_0"'), "o modelo deve permanecer no noBackupFilesDir privado do APK");
assert(modelInstaller.includes('EXPECTED_SHA256 = "595b727d73a8e78cc8da03f12a947137818c6d3544be903eef8494824b2d5b47"'), "o artefato deve ser identificado pelo hash oficial validado");
assert(plugin.includes('const val MODEL_ID = "functiongemma-270m-it-q8_0"'), "o plugin deve expor somente o FunctionGemma operacional");
assert(!plugin.includes("LocalModelCatalog"), "o catálogo multi-modelo antigo não pode retornar ao APK");

console.log("Isolamento validado: Simplifica 3D carrega somente o FunctionGemma verificado no armazenamento privado do APK.");
