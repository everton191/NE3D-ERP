(function attachAiRuntimeLoader(global) {
  "use strict";
  // The Android LFM bridge is loaded statically by index.html. This list is for
  // lazy recovery and deliberately contains no model-specific legacy runtime.
  const AI_SCRIPTS = Object.freeze([
    "/src/assistant-core/schemas/contracts.js", "/src/assistant-core/context/context-manager.js", "/src/assistant-core/memory/conversation-memory.js",
    "/src/assistant-core/cache/cache-manager.js", "/src/assistant-core/attachments/image-attachment-store.js", "/src/assistant-core/navigation/navigation-registry.js",
    "/src/assistant-core/search/entity-search.js", "/src/assistant-core/tools/tool-registry.js", "/src/assistant-core/ui-contracts/components.js",
    "/src/assistant-core/security/privacy-policy.js", "/src/assistant-core/models/model-registry.js", "/src/assistant-core/models/model-provider.js",
    "/src/assistant-core/models/pwa-model-artifact-store.js", "/src/assistant-core/models/web-local-model-provider.js", "/src/assistant-core/models/device-capability-profiler.js",
    "/src/assistant-core/engine/assistant-core.js", "/apps/simplifica/assistant-pack/index.js", "/src/services/simplifica3dAiActions.js",
    "/src/ai/action-registry.js", "/src/ai/action-search.js", "/src/ai/workflow-tool-graph.js", "/src/ai/deterministic-router.js",
    "/src/ai/ai-telemetry.js", "/src/ai/result-envelope.js", "/src/ai/tool-calling-model.js", "/src/ai/local-tool-model-adapter.js",
    "/src/services/simplifica3dAiRuntime.js", "/src/ai-3d/core.js", "/src/ai-3d/operation-safety.js", "/src/ai-3d/canonical-order.js",
    "/src/ai-3d/order-create-preparation.js", "/src/ai-3d/order-shared-usecases.js", "/src/ai-3d/operational-usecases.js", "/src/ai-3d/rlm/rlm-core.js", "/src/ai-3d/orchestrator.js"
  ]);
  const FEATURE_SCRIPTS = Object.freeze({ reports: Object.freeze(["/src/features/reports/reports-data.js", "/src/features/reports/reports-renderer.js", "/src/features/reports/reports-controller.js", "/src/features/reports/reports-view-model.js"]) });
  let promise = null; let lastError = null;
  const load = (src) => new Promise((resolve, reject) => { if (document.querySelector(`script[data-simplifica-ai-src="${src}"]`)) return resolve(); const script = document.createElement("script"); script.src = src; script.async = false; script.dataset.simplificaAiSrc = src; script.onload = resolve; script.onerror = () => reject(new Error(`AI_SCRIPT_LOAD_FAILED:${src}`)); document.head.appendChild(script); });
  function ensureAiRuntimeLoaded() { if (global.Simplifica3dAiRuntime) return Promise.resolve({ loaded: true, cached: true }); if (promise) return promise; lastError = null; promise = AI_SCRIPTS.reduce((chain, src) => chain.then(() => load(src)), Promise.resolve()).then(() => ({ loaded: true, cached: false })).catch((error) => { lastError = error; promise = null; throw error; }); return promise; }
  const featurePromises = new Map();
  function ensureFeatureLoaded(name) { if (featurePromises.has(name)) return featurePromises.get(name); const scripts = FEATURE_SCRIPTS[name]; if (!scripts) return Promise.reject(new Error(`UNKNOWN_FEATURE:${name}`)); const featurePromise = scripts.reduce((chain, src) => chain.then(() => load(src)), Promise.resolve()).finally(() => featurePromises.delete(name)); featurePromises.set(name, featurePromise); return featurePromise; }
  global.SimplificaAiRuntimeLoader = Object.freeze({ AI_SCRIPTS, FEATURE_SCRIPTS, ensureAiRuntimeLoaded, ensureFeatureLoaded, status: () => Object.freeze({ loading: !!promise, loaded: !!global.Simplifica3dAiRuntime, error: lastError?.message || "" }) });
})(window);
