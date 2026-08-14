(function attachWebLocalModelProvider(global) {
  "use strict";

  const Base = global.UniversalAssistantModelProvider;
  const StoreApi = global.UniversalAssistantPwaModelStore;
  const PROCESSING_STATES = new Set(["CHECKING", "DOWNLOADING", "VERIFYING", "INSTALLING"]);

  function normalizeWebArtifact(item = {}) {
    const platforms = Array.isArray(item.supportedPlatforms)
      ? item.supportedPlatforms
      : String(item.platform || "").split(",").map((value) => value.trim()).filter(Boolean);
    const id = String(item.id || item.modelId || "").trim();
    const url = String(item.url || item.artifactUrl || "").trim();
    const status = String(item.status || "available").toLowerCase();
    const available = item.available !== false && status !== "experimental" && status !== "planned"
      && id && Number(item.downloadBytes) > 0 && /^https:\/\//.test(url) && /^[a-f0-9]{64}$/i.test(String(item.sha256 || ""));
    return Object.freeze({
      ...item,
      id,
      displayName: String(item.displayName || id || "Modelo web"),
      version: String(item.version || ""),
      url,
      supportedPlatforms: platforms,
      available: Boolean(available && platforms.some((platform) => /^(web|pwa|webgpu)/i.test(platform))),
      capabilities: { text: true, vision: false, audio: false, tools: true, ...(item.capabilities || {}) }
    });
  }

  class WebLocalModelProvider extends Base.ModelProvider {
    constructor({
      appId = "assistant",
      runtime = null,
      artifacts = [],
      navigatorRef = global.navigator,
      storageRef = global.localStorage,
      artifactStore = null,
      fetchRef = global.fetch?.bind(global),
      cryptoRef = global.crypto
    } = {}) {
      super({ id: `${appId}-web-local`, platform: "web" });
      this.appId = String(appId || "assistant");
      this.runtime = runtime;
      this.navigator = navigatorRef;
      this.storage = storageRef;
      this.settingsKey = `${this.appId}:assistant-web-model:v1`;
      const artifactList = Array.isArray(artifacts) ? artifacts : [];
      this.artifacts = new Map(artifactList.map(normalizeWebArtifact).filter((item) => item.id).map((item) => [item.id, item]));
      const runtimeVerifier = runtime?.verifyArtifactChecksum || runtime?.verifyChecksum;
      this.artifactStore = artifactStore || (StoreApi?.PwaModelArtifactStore ? new StoreApi.PwaModelArtifactStore({
        scope: this.appId,
        navigatorRef,
        fetchRef,
        cryptoRef,
        checksumVerifier: typeof runtimeVerifier === "function"
          ? (args) => runtimeVerifier.call(runtime, args)
          : null
      }) : null);
      this.abortController = null;
      this.installPromise = null;
      this.loadedModelId = "";
      this.fallbackFromModelId = "";
      this.fallbackModelId = "";
      this.fallbackReason = "";
      this.progress = null;
    }
    readSettings() {
      try {
        const value = JSON.parse(this.storage?.getItem?.(this.settingsKey) || "{}");
        return { enabled: value.enabled === true, selection: String(value.selection || "automatic") };
      } catch (_) { return { enabled: false, selection: "automatic" }; }
    }
    writeSettings(next = {}) {
      const value = { ...this.readSettings(), ...next };
      try { this.storage?.setItem?.(this.settingsKey, JSON.stringify(value)); }
      catch (_) { }
      return value;
    }
    runtimeCapabilities() {
      try { return this.runtime?.capabilities?.() || {}; }
      catch (_) { return {}; }
    }
    async profile() {
      const gpu = this.navigator?.gpu;
      let adapter = null;
      try { adapter = gpu ? await gpu.requestAdapter({ powerPreference: "high-performance" }) : null; }
      catch (_) { }
      let storage = null;
      try { storage = this.artifactStore?.storageProfile ? await this.artifactStore.storageProfile() : await this.navigator?.storage?.estimate?.(); }
      catch (_) { }
      const quota = Number(storage?.quota || 0);
      const usage = Number(storage?.usage || 0);
      return {
        webGpu: !!gpu,
        adapterAvailable: !!adapter,
        storageQuota: quota,
        storageUsage: usage,
        freeStorageBytes: Number(storage?.freeBytes ?? Math.max(0, quota - usage)) || 0,
        persistentStorage: storage?.persisted === true,
        storageBackend: storage?.backend || "",
        storageScope: storage?.scope || this.appId,
        deviceMemoryGb: Number(this.navigator?.deviceMemory || 0) || null
      };
    }
    async capabilities({ profile = null, descriptor = null } = {}) {
      const currentProfile = profile || await this.profile();
      const runtime = await Promise.resolve(this.runtimeCapabilities());
      const model = descriptor?.capabilities || { text: true, vision: false, audio: false, tools: true };
      const accelerated = currentProfile.adapterAvailable === true;
      return {
        supportsText: accelerated && runtime.text === true && model.text !== false,
        supportsVision: accelerated && runtime.vision === true && model.vision === true,
        supportsAudio: accelerated && runtime.audio === true && model.audio === true,
        supportsTools: accelerated && runtime.tools === true && model.tools !== false
      };
    }
    compatibleArtifacts() {
      return [...this.artifacts.values()].filter((item) => item.available === true);
    }
    async descriptorForSelection(selection = this.readSettings().selection) {
      if (selection !== "automatic") return this.artifacts.get(selection) || null;
      const candidates = this.compatibleArtifacts().sort((a, b) => Number(b.rank || 0) - Number(a.rank || 0));
      for (const descriptor of candidates) {
        const status = await this.artifactStore?.status?.(descriptor);
        if (status?.state === "READY" && status.verified) return descriptor;
      }
      return candidates[0] || null;
    }
    async readyFallbacks(failedDescriptor) {
      const candidates = this.compatibleArtifacts()
        .filter((item) => item.id !== failedDescriptor?.id && item.capabilities?.text !== false)
        .sort((a, b) => Number(b.rank || 0) - Number(a.rank || 0));
      const ready = [];
      for (const descriptor of candidates) {
        const stored = await this.artifactStore?.status?.(descriptor);
        if (stored?.state === "READY" && stored.verified === true) ready.push(descriptor);
      }
      return ready;
    }
    async listModels() {
      const settings = this.readSettings();
      const models = [];
      for (const descriptor of this.artifacts.values()) {
        const stored = descriptor.available && this.artifactStore?.status
          ? await this.artifactStore.status(descriptor)
          : { state: descriptor.available ? "NOT_INSTALLED" : "EXPERIMENTAL", downloadedBytes: 0, verified: false };
        models.push({
          ...descriptor,
          state: stored.state,
          installed: stored.state === "READY" && stored.verified === true,
          downloadedBytes: stored.downloadedBytes || 0,
          compatible: descriptor.available === true
        });
      }
      return { models, enabled: settings.enabled, selection: settings.selection };
    }
    unavailableReason(profile, capabilities = {}) {
      if (!profile.webGpu) return "IA local não disponível neste navegador porque o WebGPU não está ativo.";
      if (!profile.adapterAvailable) return "Este navegador não forneceu aceleração compatível para a IA local.";
      if (!this.runtime) return "O runtime de IA local para navegador ainda não está configurado.";
      if (capabilities.supportsText !== true) return "O runtime web atual não oferece geração local de texto neste navegador.";
      if (!this.compatibleArtifacts().length) return "Nenhum modelo local compatível com navegador foi publicado para este aplicativo.";
      if (!this.artifactStore) return "O armazenamento de modelos não está disponível neste navegador.";
      return "";
    }
    async status() {
      const settings = this.readSettings();
      const profile = await this.profile();
      const descriptor = await this.descriptorForSelection(settings.selection);
      const capabilities = await this.capabilities({ profile, descriptor });
      const reason = this.unavailableReason(profile, capabilities);
      const available = !reason && capabilities.supportsText;
      const stored = descriptor && this.artifactStore?.status
        ? await this.artifactStore.status(descriptor)
        : { state: available ? "NOT_INSTALLED" : "UNAVAILABLE", downloadedBytes: 0, totalBytes: Number(descriptor?.downloadBytes || 0), verified: false };
      const progress = this.progress?.modelId === descriptor?.id ? this.progress : null;
      const state = progress?.state || stored.state;
      return {
        available,
        compatible: available,
        enabled: settings.enabled,
        state,
        reason,
        incompatibilityReason: reason,
        modelId: descriptor?.id || "",
        modelName: descriptor?.displayName || "",
        modelReady: stored.state === "READY" && stored.verified === true,
        downloading: PROCESSING_STATES.has(state),
        downloadedBytes: Number(progress?.downloadedBytes ?? stored.downloadedBytes) || 0,
        totalBytes: Number(progress?.totalBytes ?? stored.totalBytes ?? descriptor?.downloadBytes) || 0,
        selection: settings.selection,
        fallbackFromModelId: this.fallbackFromModelId,
        fallbackModelId: this.fallbackModelId,
        fallbackReason: this.fallbackReason,
        profile,
        ...capabilities
      };
    }
    async profileDevice() { return this.profile(); }
    async setEnabled(enabled) {
      if (enabled === true) {
        const status = await this.status();
        if (!status.available) throw new Error(status.reason || "IA local não disponível neste navegador.");
      }
      this.writeSettings({ enabled: enabled === true });
      if (enabled !== true) await this.unload();
      return this.status();
    }
    async selectModel(modelId) {
      const selection = String(modelId || "automatic");
      if (selection !== "automatic" && !this.artifacts.has(selection)) throw new Error("Modelo web não encontrado neste aplicativo.");
      if (this.loadedModelId && this.loadedModelId !== selection) await this.unload();
      this.writeSettings({ selection });
      return this.status();
    }
    async installModel(modelId) {
      if (this.installPromise) return this.installPromise;
      const descriptor = this.artifacts.get(String(modelId || ""));
      if (!descriptor?.available) throw new Error("Este modelo ainda não está disponível para navegador.");
      const baseStatus = await this.status();
      if (!baseStatus.available) throw new Error(baseStatus.reason || "IA local não disponível neste navegador.");
      this.writeSettings({ enabled: true, selection: descriptor.id });
      this.abortController = new AbortController();
      this.progress = { modelId: descriptor.id, state: "DOWNLOADING", downloadedBytes: 0, totalBytes: descriptor.downloadBytes };
      this.installPromise = this.artifactStore.install(descriptor, {
        signal: this.abortController.signal,
        onProgress: (progress) => { this.progress = { modelId: descriptor.id, state: this.progress?.state || "DOWNLOADING", ...progress }; },
        onStateChange: (progress) => { this.progress = { modelId: descriptor.id, ...progress }; }
      }).then(async () => {
        this.progress = null;
        return this.prewarm();
      }).finally(() => {
        this.abortController = null;
        this.installPromise = null;
      });
      return this.installPromise;
    }
    async cancelDownload() {
      this.abortController?.abort();
      return { ...(await this.status()), cancelRequested: true };
    }
    async deleteModel(modelId) {
      const descriptor = this.artifacts.get(String(modelId || "")) || await this.descriptorForSelection();
      if (!descriptor) return this.status();
      if (this.loadedModelId === descriptor.id) await this.unload();
      await this.artifactStore?.remove?.(descriptor.id);
      this.progress = null;
      return this.status();
    }
    async unload() {
      try { await this.runtime?.unload?.(); }
      finally {
        this.loadedModelId = "";
        this.fallbackFromModelId = "";
        this.fallbackModelId = "";
        this.fallbackReason = "";
      }
      return { unloaded: true };
    }
    async prewarm() {
      const status = await this.status();
      if (!status.available || !status.enabled || !status.modelReady) return status;
      if (this.loadedModelId === status.modelId) return { ...status, runtimeReady: true };
      if (status.selection === "automatic" && this.loadedModelId && this.loadedModelId === this.fallbackModelId) {
        return { ...status, runtimeReady: true, activeModelId: this.loadedModelId };
      }
      const descriptor = this.artifacts.get(status.modelId);
      if (!this.runtime?.load) return { ...status, available: false, modelReady: false, state: "UNAVAILABLE", reason: "O runtime web não consegue carregar modelos locais." };
      const artifact = await this.artifactStore.openArtifact(descriptor);
      try {
        await this.runtime.load({ descriptor, artifact, contextWindow: Number(descriptor.recommendedContext) || 8192 });
        this.loadedModelId = descriptor.id;
        this.fallbackFromModelId = "";
        this.fallbackModelId = "";
        this.fallbackReason = "";
        await this.artifactStore.touch?.(descriptor);
        return { ...(await this.status()), runtimeReady: true, activeModelId: descriptor.id };
      } catch (primaryError) {
        if (status.selection !== "automatic") throw primaryError;
        const fallbacks = await this.readyFallbacks(descriptor);
        for (const fallback of fallbacks) {
          try {
            await this.runtime?.unload?.();
            const fallbackArtifact = await this.artifactStore.openArtifact(fallback);
            await this.runtime.load({ descriptor: fallback, artifact: fallbackArtifact, contextWindow: Number(fallback.recommendedContext) || 8192 });
            this.loadedModelId = fallback.id;
            this.fallbackFromModelId = descriptor.id;
            this.fallbackModelId = fallback.id;
            this.fallbackReason = `${descriptor.displayName} não iniciou; ${fallback.displayName} foi usada sem novo download.`;
            await this.artifactStore.touch?.(fallback);
            return { ...(await this.status()), runtimeReady: true, activeModelId: fallback.id };
          } catch (_) { /* Tenta apenas outros modelos já instalados. */ }
        }
        const balanced = [...this.artifacts.values()].find((item) => String(item.profile || "").toUpperCase() === "BALANCED" || /e2b|balanced|equilibrada/i.test(`${item.id} ${item.displayName}`));
        if (balanced && balanced.id !== descriptor.id) {
          throw new Error(`${descriptor.displayName} não conseguiu iniciar neste navegador. ${balanced.displayName} é mais compatível e só será baixada com sua autorização.`);
        }
        throw primaryError;
      }
    }
    async benchmarkModel() {
      const status = await this.prewarm();
      if (!status.runtimeReady) throw new Error(status.reason || "O modelo web ainda não está pronto.");
      if (!this.runtime?.benchmark) return { health: "NOT_TESTED", reason: "Benchmark não oferecido pelo runtime web atual." };
      return this.runtime.benchmark();
    }
    async send(request) {
      const status = await this.prewarm();
      if (!status.runtimeReady || !this.runtime?.send) throw new Error(status.reason || "IA local não disponível neste navegador.");
      return this.runtime.send(request);
    }
  }

  const api = Object.freeze({ normalizeWebArtifact, WebLocalModelProvider });
  global.UniversalAssistantWebProvider = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
