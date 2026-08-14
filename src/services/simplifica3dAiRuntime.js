(function attachSimplifica3dAiRuntime(global) {
  "use strict";
  class AndroidLocalModelProvider {
    constructor({ webProvider = null, privacyPolicy = null } = {}) {
      this.warmupPromise = null;
      this.webProvider = webProvider;
      const Policy = global.UniversalAssistantPrivacy?.AssistantPrivacyPolicy;
      this.privacyPolicy = privacyPolicy || (Policy ? new Policy({ appId: global.SimplificaAssistantPack?.manifest?.appId || "simplifica-3d" }) : null);
    }
    get plugin() { return global.Capacitor?.Plugins?.SimplificaLocalAi; }
    async status() {
      if (!this.plugin?.status) return this.webProvider?.status ? this.webProvider.status() : { available: false, modelReady: false, state: "UNAVAILABLE" };
      return { available: true, ...(await this.plugin.status()) };
    }
    async ensureReady() {
      if (this.plugin?.ensureModel) return this.plugin.ensureModel();
      if (this.webProvider?.prewarm) return this.webProvider.prewarm();
      throw new Error("A IA local ainda não está disponível neste aparelho.");
    }
    async listModels() { return this.plugin?.listModels ? this.plugin.listModels() : (this.webProvider?.listModels ? this.webProvider.listModels() : { models: [], enabled: false, selection: "automatic" }); }
    async profileDevice() { return this.plugin?.profileDevice ? this.plugin.profileDevice() : (this.webProvider?.profile ? this.webProvider.profile() : { conclusive: false }); }
    async benchmarkModel() { if (this.plugin?.benchmarkModel) return this.plugin.benchmarkModel(); if (this.webProvider?.benchmarkModel) return this.webProvider.benchmarkModel(); throw new Error("Benchmark indisponível neste navegador."); }
    async setEnabled(enabled) { if (this.plugin?.setEnabled) return this.plugin.setEnabled({ enabled: enabled === true }); if (this.webProvider?.setEnabled) return this.webProvider.setEnabled(enabled); throw new Error("Configuração de IA local indisponível."); }
    async selectModel(modelId) { if (this.plugin?.selectModel) return this.plugin.selectModel({ modelId }); if (this.webProvider?.selectModel) return this.webProvider.selectModel(modelId); throw new Error("Modelo indisponível."); }
    async installModel(modelId) { if (this.plugin?.installModel) return this.plugin.installModel({ modelId }); if (this.webProvider?.installModel) return this.webProvider.installModel(modelId); throw new Error("Download de modelo indisponível."); }
    async cancelDownload() { return this.plugin?.cancelDownload ? this.plugin.cancelDownload() : this.webProvider?.cancelDownload?.(); }
    async deleteModel(modelId) { if (this.plugin?.deleteModel) return this.plugin.deleteModel({ modelId }); if (this.webProvider?.deleteModel) return this.webProvider.deleteModel(modelId); throw new Error("Remoção de modelo indisponível."); }
    async unload() { return this.plugin?.unload ? this.plugin.unload() : this.webProvider?.unload?.(); }
    async prewarm() {
      if (!this.plugin?.status && this.webProvider?.prewarm) return this.webProvider.prewarm();
      if (this.warmupPromise) return this.warmupPromise;
      this.warmupPromise = (async () => {
        const status = await this.status();
        return status;
      })().finally(() => { this.warmupPromise = null; });
      return this.warmupPromise;
    }
    async converse(text, context, attachments = []) {
      const privacy = global.UniversalAssistantPrivacy;
      this.privacyPolicy?.assert?.({
        mode: this.plugin?.interpret ? privacy?.PROCESSING_MODE?.LOCAL_ANDROID : privacy?.PROCESSING_MODE?.LOCAL_WEB,
        dataTypes: attachments.length ? [privacy?.DATA_TYPE?.MESSAGE, privacy?.DATA_TYPE?.ERP_CONTEXT, privacy?.DATA_TYPE?.IMAGE] : [privacy?.DATA_TYPE?.MESSAGE, privacy?.DATA_TYPE?.ERP_CONTEXT]
      });
      if (!this.plugin?.interpret && this.webProvider?.send) {
        const result = await this.webProvider.send({ text: String(text || ""), context: context || {}, attachments });
        const answer = typeof result === "string" ? result : String(result?.text || result?.answer || "");
        if (!answer.trim()) throw new Error("A IA não retornou uma resposta agora.");
        return answer.trim();
      }
      if (!this.plugin?.interpret) throw new Error("A IA local ainda não está disponível neste aparelho.");
      const image = attachments.find((item) => item?.type === "image" && item?.imageBase64);
      const result = await this.plugin.interpret({ text: String(text || ""), context: JSON.stringify(context || {}), imageBase64: image?.imageBase64 || "", imageMimeType: image?.mimeType || "" });
      const raw = String(result?.text || "").trim();
      if (!raw) throw new Error("A IA não retornou uma resposta agora.");
      const json = raw.match(/\{[\s\S]*\}/)?.[0];
      if (json) {
        try {
          const parsed = JSON.parse(json);
          if (parsed?.type === "chat" && parsed?.payload?.answer) return String(parsed.payload.answer);
          if (parsed?.type) return "Continuo com o mesmo rascunho. Diga o que gostaria de analisar ou alterar; nada foi salvo.";
        } catch (_) { }
      }
      return raw;
    }
  }
  const webProvider = global.UniversalAssistantWebProvider?.WebLocalModelProvider ? new global.UniversalAssistantWebProvider.WebLocalModelProvider({
    appId: global.SimplificaAssistantPack?.modelScope || "simplifica-3d",
    runtime: global.SimplificaWebAiRuntime || global.__SIMPLIFICA_WEB_AI_RUNTIME__ || null,
    artifacts: global.SimplificaWebAiArtifacts || global.__SIMPLIFICA_WEB_AI_ARTIFACTS__ || []
  }) : null;
  const provider = new AndroidLocalModelProvider({ webProvider });
  async function interpret(text, context) {
    const plugin = provider.plugin;
    if (!plugin?.interpret) throw new Error("A IA local ainda não está disponível neste aparelho.");
    const result = await plugin.interpret({ text: String(text || ""), context: JSON.stringify(context || {}) });
    const raw = String(result?.text || "").trim();
    const json = raw.match(/\{[\s\S]*\}/)?.[0];
    const action = json ? (() => {
      try { return JSON.parse(json); } catch (_) { return { type: "chat", payload: { answer: raw } }; }
    })() : { type: "chat", payload: { answer: raw } };
    return global.Simplifica3dAiActions.preview(action);
  }
  async function execute(preview, confirmed) {
    if (preview?.requiresConfirmation && confirmed !== true) throw new Error("Confirmação obrigatória antes de alterar dados.");
    return global.Simplifica3dErpBridge.execute(preview);
  }
  global.Simplifica3dAiRuntime = Object.freeze({ interpret, execute, provider, webProvider, AndroidLocalModelProvider, LegacyCapacitorAiProvider: AndroidLocalModelProvider });
})(window);
