const CACHE_NAME = "simplifica-3d-v231-package-1-20260705";
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
  "./src/services/errorTelemetry.js",
  "./src/services/diagnosticsService.js",
  "./src/services/smartLoaderService.js",
  "./src/services/safeAreaManager.js",
  "./src/services/themeAuthorityV2.js",
  "./src/services/googleMotionEnhancer.js",
  "./src/services/printerMonitoringService.js",
  "./src/services/adMobService.js",
  "./src/services/adSenseService.js",
  "./src/services/monetizationLimits.js",
  "./themes/base/design-system-v2.css",
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
  const deveIgnorarCache = [
    "/",
    "/index.html",
    "/app.js",
    "/style.css",
    "/src/storefront/styles/tokens.css",
    "/src/storefront/styles/components.css",
    "/src/storefront/styles/layouts.css",
    "/src/storefront/renderers/publicV3.js",
    "/src/storefront/renderers/editorV3.js",
    "/themes/base/design-system-v2.css",
    "/sw.js",
    "/src/services/themeAuthorityV2.js",
    "/src/services/safeAreaManager.js",
    "/src/services/smartLoaderService.js",
    "/src/services/printerMonitoringService.js",
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
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => {
      return caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return caches.match("./index.html");
      });
    })
  );
});
