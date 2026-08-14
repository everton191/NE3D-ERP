(function attachUniversalAssistantAppRuntime(global) {
  "use strict";

  const Contracts = global.UniversalAssistantContracts;
  const Core = global.UniversalAssistantCore;
  const Ui = global.UniversalAssistantUi;
  const Privacy = global.UniversalAssistantPrivacy;
  const WebModel = global.UniversalAssistantWebProvider;

  class AppAssistantRuntime {
    constructor({
      pack,
      storage = global.localStorage,
      permissionGuard,
      writePipeline,
      navigate,
      back,
      attachmentStore = null,
      modelRuntime = null,
      modelArtifacts = [],
      artifactStore = null,
      navigatorRef = global.navigator,
      fetchRef = global.fetch?.bind?.(global),
      cryptoRef = global.crypto,
      assistantName = "Assistente",
      brand = {}
    } = {}) {
      if (!pack?.manifest?.appId) throw new Error("AssistantPack obrigatório.");
      if (pack.modelScope !== pack.manifest.appId) {
        throw new Error("O modelScope deve ser exclusivo e igual ao appId do manifesto.");
      }
      if (!Core?.AssistantCore || !Ui?.AssistantUiComponents || !Privacy?.AssistantPrivacyPolicy || !WebModel?.WebLocalModelProvider) {
        throw new Error("Módulos obrigatórios do Assistant Core não foram carregados.");
      }

      this.pack = pack;
      this.appId = pack.manifest.appId;
      this.modelScope = pack.modelScope;
      this.core = new Core.AssistantCore({
        manifest: pack.manifest,
        storage,
        permissionGuard,
        writePipeline,
        navigate,
        back,
        attachmentStore
      });
      this.ui = new Ui.AssistantUiComponents({
        appId: this.appId,
        appName: pack.manifest.appName,
        assistantName,
        brand
      });
      this.privacy = new Privacy.AssistantPrivacyPolicy({ appId: this.appId, allowRemote: false });
      this.modelProvider = new WebModel.WebLocalModelProvider({
        appId: this.modelScope,
        runtime: modelRuntime,
        artifacts: modelArtifacts,
        navigatorRef,
        storageRef: storage,
        artifactStore,
        fetchRef,
        cryptoRef
      });
      this.toolContracts = new Map((pack.tools || []).map((tool) => [tool.name, Object.freeze({ ...tool })]));
      this.boundAdapters = new Set();
    }

    bindAdapters(adapters = {}) {
      for (const contract of this.toolContracts.values()) {
        const execute = adapters[contract.adapter];
        if (typeof execute !== "function" || this.boundAdapters.has(contract.name)) continue;
        this.core.tools.register({
          name: contract.name,
          access: contract.access,
          execute
        });
        this.boundAdapters.add(contract.name);
      }
      return this.readiness();
    }

    readiness() {
      const registered = [...this.boundAdapters];
      const missing = [...this.toolContracts.keys()].filter((name) => !this.boundAdapters.has(name));
      return Object.freeze({
        appId: this.appId,
        modelScope: this.modelScope,
        ready: missing.length === 0,
        registered,
        missing
      });
    }

    registerScreen(context) { return this.core.context.register(context); }
    buildRequest(text, attachments = []) { return this.core.buildRequest(text, attachments); }
    newConversation() { return this.core.newConversation(); }
    deleteConversation(id) { return this.core.deleteConversation(id); }
    executeTool(name, input = {}, context = {}) { return this.core.tools.execute(name, input, context); }
    navigate(routeId, params = {}, origin = null) { return this.core.navigation.navigate(routeId, params, origin); }
    back() { return this.core.navigation.back(); }
    status() { return this.modelProvider.status(); }
    privacyDecision(request = {}) { return this.privacy.evaluate(request); }
  }

  const api = Object.freeze({ AppAssistantRuntime, ACCESS: Contracts?.ACCESS });
  global.UniversalAssistantAppRuntime = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
