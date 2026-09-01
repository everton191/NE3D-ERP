const CACHE_NAME = "simplifica-3d-v1039-orders-filter-menu-20260901";
const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./src/storefront/styles/tokens.css",
  "./src/storefront/styles/components.css",
  "./src/storefront/styles/layouts.css",
  "./src/storefront/renderers/publicV3.js",
  "./src/storefront/renderers/editorV3.js",
  "./app.js",
  "./src/config/runtimeFeatures.js",
  "./src/services/errorTelemetry.js",
  "./src/services/diagnosticsService.js",
  "./src/services/smartLoaderService.js",
  "./src/services/safeAreaManager.js",
  "./src/services/themeAuthorityV3.js",
  "./src/services/googleMotionEnhancer.js",
  "./src/services/printerMonitoringService.js",
  "./src/services/adMobService.js",
  "./src/services/adSenseService.js",
  "./src/services/monetizationLimits.js",
  "./src/services/calculatorDomain.js",
  "./src/services/simplifica3dAiActions.js",
  "./src/services/simplifica3dAiRuntime.js",
  "./src/services/simplifica3dFinancialCore.js",
  "./src/assistant-core/schemas/contracts.js",
  "./src/assistant-core/context/context-manager.js",
  "./src/assistant-core/memory/conversation-memory.js",
  "./src/assistant-core/cache/cache-manager.js",
  "./src/assistant-core/attachments/image-attachment-store.js",
  "./src/assistant-core/navigation/navigation-registry.js",
  "./src/assistant-core/search/entity-search.js",
  "./src/assistant-core/tools/tool-registry.js",
  "./src/assistant-core/ui-contracts/components.js",
  "./src/assistant-core/security/privacy-policy.js",
  "./src/assistant-core/models/model-registry.js",
  "./src/assistant-core/models/model-provider.js",
  "./src/assistant-core/models/pwa-model-artifact-store.js",
  "./src/assistant-core/models/web-local-model-provider.js",
  "./src/assistant-core/models/device-capability-profiler.js",
  "./src/assistant-core/engine/assistant-core.js",
  "./apps/simplifica/assistant-pack/index.js",
  "./models/functiongemma/web-artifacts.js",
  "./src/ai/action-registry.js",
  "./src/ai/action-search.js",
  "./src/ai/deterministic-router.js",
  "./src/ai/ai-telemetry.js",
  "./src/ai/result-envelope.js",
  "./src/ai/tool-calling-model.js",
  "./src/ai/functiongemma-adapter.js",
  "./src/ai/functiongemma-native-runtime.js",
  "./src/ai/functiongemma-web-runtime.js",
  "./assets/vendor/wllama/index.min.js",
  "./assets/vendor/wllama/wllama.wasm",
  "./assets/vendor/wllama/LICENCE",
  "./src/ai-3d/core.js",
  "./src/ai-3d/operation-safety.js",
  "./src/ai-3d/canonical-order.js",
  "./src/ai-3d/order-create-preparation.js",
  "./src/ai-3d/order-create-executor.js",
  "./src/ai-3d/order-shared-usecases.js",
  "./src/ai-3d/rlm/rlm-core.js",
  "./src/ai-3d/orchestrator.js",
  "./src/styles/google-expressive-motion.css",
  "./assets/vendor/jspdf.umd.min.js",
  "./assets/vendor/qrcode.min.js",
  "./assets/simplifica-cover.svg",
  "./assets/simplifica-brand-cover.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png",
  "./assets/intro.mp4",
  "./assets/storefront-v3/examples/hero-3d-products.jpg",
  "./assets/storefront-v3/examples/category-decoracao.jpg",
  "./assets/storefront-v3/examples/category-colecionaveis.jpg",
  "./assets/storefront-v3/examples/category-acessorios.jpg",
  "./assets/storefront-v3/examples/category-utilidades.jpg",
  "./assets/storefront-v3/examples/category-chaveiros.jpg",
  "./assets/storefront-v3/examples/category-pecas-tecnicas.jpg",
  "./assets/storefront-v3/examples/product-dino.jpg",
  "./assets/storefront-v3/examples/product-eiffel.jpg",
  "./assets/storefront-v3/examples/product-support.jpg",
  "./assets/storefront-v3/examples/product-vase.jpg",
  "./assets/storefront-v3/examples/product-keychain.jpg",
  "./assets/storefront-v3/examples/product-dragon.jpg",
  "./manifest.webmanifest",
  "./icon.svg",
  "./ads.txt"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (/^\/models\/functiongemma\/.*\.gguf$/i.test(url.pathname)) {
    // O GGUF já possui armazenamento próprio, checksum e retomada. Nunca duplique
    // centenas de MB no Cache Storage do service worker.
    event.respondWith(fetch(event.request));
    return;
  }
  const deveIgnorarCache = [
    "/",
    "/index.html",
    "/app.js",
    "/style.css",
    "/styles/ui-v3/index.css",
    "/styles/ui-v3/screens/operational.css",
    "/styles/ui-v3/screens/finance.css",
    "/styles/ui-v3/screens/settings.css",
    "/styles/ui-v3/screens/reading.css",
    "/src/storefront/styles/tokens.css",
    "/src/storefront/styles/components.css",
    "/src/storefront/styles/layouts.css",
    "/src/storefront/renderers/publicV3.js",
    "/src/storefront/renderers/editorV3.js",
    "/sw.js",
    "/src/services/themeAuthorityV3.js",
    "/src/services/safeAreaManager.js",
    "/src/services/smartLoaderService.js",
    "/src/services/printerMonitoringService.js",
    "/models/models-manifest.v1.json",
    "/assets/intro.mp4"
  ].includes(url.pathname);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(event.request, deveIgnorarCache ? { cache: "no-store" } : undefined).then((response) => {
      if (!response.ok || deveIgnorarCache) return response;
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => {
      return caches.match(event.request).then((cached) => {
        return cached || Response.error();
      });
    })
  );
});
