"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const Privacy = require("../src/assistant-core/security/privacy-policy.js");
const { RemoteModelProvider } = require("../src/assistant-core/models/model-provider.js");

(async () => {
  const localOnly = new Privacy.AssistantPrivacyPolicy({ appId: "simplifica-3d" });
  const localDecision = localOnly.evaluate({
    mode: Privacy.PROCESSING_MODE.LOCAL_ANDROID,
    dataTypes: [Privacy.DATA_TYPE.MESSAGE, Privacy.DATA_TYPE.ERP_CONTEXT, Privacy.DATA_TYPE.IMAGE]
  });
  assert.strictEqual(localDecision.allowed, true);
  assert.strictEqual(localDecision.local, true);
  assert.throws(() => localOnly.assert({ mode: Privacy.PROCESSING_MODE.REMOTE, explicitConsent: true }), /envio externo/i,
    "a política padrão deve bloquear remoto mesmo se um chamador marcar consentimento");

  const futureOptIn = new Privacy.AssistantPrivacyPolicy({ appId: "future", allowRemote: true });
  assert.strictEqual(futureOptIn.evaluate({ mode: Privacy.PROCESSING_MODE.REMOTE }).allowed, false);
  assert.strictEqual(futureOptIn.evaluate({ mode: Privacy.PROCESSING_MODE.REMOTE, explicitConsent: true }).allowed, true);

  const remote = new RemoteModelProvider({ privacyPolicy: localOnly });
  await assert.rejects(() => remote.send({ attachments: [{ type: "image" }], explicitConsent: true }), /envio externo/i);
  assert.strictEqual((await remote.status()).enabled, false);

  const root = path.join(__dirname, "..");
  const installer = fs.readFileSync(path.join(root, "android", "app", "src", "main", "java", "br", "com", "ne3d", "erp", "ai", "FunctionGemmaModelInstaller.kt"), "utf8");
  const toolRuntime = fs.readFileSync(path.join(root, "android", "app", "src", "main", "java", "br", "com", "ne3d", "erp", "ai", "FunctionGemmaToolRuntime.kt"), "utf8");
  const plugin = fs.readFileSync(path.join(root, "android", "app", "src", "main", "java", "br", "com", "ne3d", "erp", "SimplificaLocalAiPlugin.kt"), "utf8");
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const runtime = fs.readFileSync(path.join(root, "src", "services", "simplifica3dAiRuntime.js"), "utf8");

  assert.match(installer, /EXPECTED_SHA256[\s\S]*EXPECTED_BYTES[\s\S]*noBackupFilesDir/);
  assert.match(toolRuntime, /operationType in setOf\("READ", "PREPARE"\)[\s\S]*FUNCTIONGEMMA_WRITE_TOOL_BLOCKED/);
  assert.match(plugin, /FunctionGemma 270M Q8_0[\s\S]*put\("vision", false\)[\s\S]*writeExposed", 0/);
  assert.match(app, /function getCapacidadesModeloAssistenteIa[\s\S]*supportsVision: false/);
  assert.match(app, /function alternarMenuAnexoAssistenteIa[\s\S]*informarImagemNaoSuportadaAssistenteIa/);
  assert.match(runtime, /class FunctionGemmaOnlyProvider[\s\S]*supportsVision: false[\s\S]*FUNCTIONGEMMA_WRITE_BLOCKED/);
  assert.doesNotMatch(runtime, /RemoteModelProvider|Gemma E2B|automaticFallback/);

  console.log("Política da IA: FunctionGemma local único, sem visão/remoto e WRITE bloqueado validados.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
