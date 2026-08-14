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
  const manager = fs.readFileSync(path.join(root, "android", "app", "src", "main", "java", "br", "com", "ne3d", "erp", "ai", "ModelArtifactManager.kt"), "utf8");
  const engine = fs.readFileSync(path.join(root, "android", "app", "src", "main", "java", "br", "com", "ne3d", "erp", "ai", "LocalInferenceEngine.kt"), "utf8");
  const plugin = fs.readFileSync(path.join(root, "android", "app", "src", "main", "java", "br", "com", "ne3d", "erp", "SimplificaLocalAiPlugin.kt"), "utf8");
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const runtime = fs.readFileSync(path.join(root, "src", "services", "simplifica3dAiRuntime.js"), "utf8");

  assert.match(manager, /fun automaticFallback[\s\S]*isAutomatic\(context\)[\s\S]*LocalModelCatalog\.balanced[\s\S]*isReady\(context, it\)/);
  assert.doesNotMatch(manager.match(/fun automaticFallback[\s\S]*?\n    }/)?.[0] || "", /install\(/,
    "fallback não pode iniciar download");
  assert.match(engine, /automaticFallback\(context, descriptor, needsVision\)[\s\S]*fallbackModelId = fallback\.id/);
  assert.match(plugin, /supportsVision", status\.state\.name == "READY" && status\.descriptor\.capabilities\.vision/);
  assert.match(app, /function getCapacidadesModeloAssistenteIa[\s\S]*supportsVision/);
  assert.match(app, /function alternarMenuAnexoAssistenteIa[\s\S]*informarImagemNaoSuportadaAssistenteIa/);
  assert.match(runtime, /privacyPolicy\?\.assert[\s\S]*LOCAL_ANDROID[\s\S]*LOCAL_WEB/);

  console.log("Política da IA: fallback sem download, capacidades reais e privacidade local por padrão validados.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
