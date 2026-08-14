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

const androidCatalog = read("android/app/src/main/java/br/com/ne3d/erp/ai/LocalModelCatalog.kt");
const artifactManager = read("android/app/src/main/java/br/com/ne3d/erp/ai/ModelArtifactManager.kt");
const androidBuild = read("android/app/build.gradle");
assert(androidBuild.includes('applicationId simplificaPilotBuild ? "br.com.ne3d.erp.pilot" : "br.com.ne3d.erp"'), "o APK deve manter pacote próprio");
assert(androidCatalog.includes('context.filesDir, "models"'), "o modelo deve permanecer no filesDir privado do APK");
assert(artifactManager.includes('PREFS = "simplifica_local_ai_v1"'), "as preferências do modelo devem ser próprias do Simplifica 3D");
assert(artifactManager.includes('WORK_NAME = "simplifica-3d-local-model-v1"'), "o trabalho de download deve ter identidade própria");

console.log("Isolamento validado: Simplifica 3D carrega somente sua própria IA, memória, catálogo e modelo privado do APK.");
