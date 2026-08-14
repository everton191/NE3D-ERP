(function attachAssistantModels(global) {
  "use strict";
  const MODEL_STATUS = Object.freeze({ NOT_INSTALLED: "NOT_INSTALLED", CHECKING: "CHECKING", DOWNLOADING: "DOWNLOADING", VERIFYING: "VERIFYING", INSTALLING: "INSTALLING", READY: "READY", FAILED: "FAILED", UPDATE_AVAILABLE: "UPDATE_AVAILABLE", INCOMPATIBLE: "INCOMPATIBLE", EXPERIMENTAL: "EXPERIMENTAL" });
  class ModelRegistry {
    constructor({ manifestVersion = 1, artifacts = [] } = {}) { this.manifestVersion = manifestVersion; this.artifacts = new Map(); artifacts.forEach((item) => this.register(item)); }
    register(item) {
      for (const field of ["id", "displayName", "version", "provider", "runtime"]) if (!String(item?.[field] || "").trim()) throw new Error(`Modelo sem ${field}.`);
      if (item.available !== false && (!Number.isFinite(Number(item.downloadBytes)) || !/^[a-f0-9]{64}$/i.test(String(item.sha256 || "")) || !/^https:\/\//.test(String(item.url || "")))) throw new Error(`Artifact inválido: ${item.id}`);
      const artifact = Object.freeze({ status: item.available === false ? MODEL_STATUS.EXPERIMENTAL : MODEL_STATUS.NOT_INSTALLED, recommendedContext: 8192, supportedPlatforms: [], capabilities: { text: true, vision: false, audio: false, tools: true }, ...item });
      this.artifacts.set(artifact.id, artifact); return artifact;
    }
    get(id) { return this.artifacts.get(id); }
    list(platform) { return [...this.artifacts.values()].filter((item) => !platform || item.supportedPlatforms.includes(platform)); }
    chooseAutomatic({ installedIds = [], memoryMb = 0, freeBytes = 0, platform = "android" } = {}) {
      const installed = this.list(platform).filter((item) => installedIds.includes(item.id) && item.available !== false);
      const fitting = installed.filter((item) => (!item.minimumMemoryMb || memoryMb >= item.minimumMemoryMb) && (!item.downloadBytes || freeBytes >= item.downloadBytes));
      return fitting.sort((a, b) => Number(b.rank || 0) - Number(a.rank || 0))[0] || null;
    }
  }
  const api = Object.freeze({ MODEL_STATUS, ModelRegistry });
  global.UniversalAssistantModels = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
