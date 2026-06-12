const CACHE_NAME = "simplifica-3d-v167-store-v3-theme-isolation-20260612";
const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./storefront-v3.css",
  "./app.js",
  "./src/services/errorTelemetry.js",
  "./src/services/diagnosticsService.js",
  "./src/services/safeAreaManager.js",
  "./src/services/themeAuthorityV2.js",
  "./src/services/adMobService.js",
  "./src/services/adSenseService.js",
  "./src/services/monetizationLimits.js",
  "./modules/store-editor/storeEditorRenderer.js",
  "./modules/store-editor/storeEditorTabs.js",
  "./modules/store-editor/storeEditorPreview.js",
  "./modules/store-editor/storeEditorProducts.js",
  "./themes/base/design-system-v2.css",
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
    "/storefront-v3.css",
    "/themes/base/design-system-v2.css",
    "/sw.js",
    "/modules/store-editor/storeEditorRenderer.js",
    "/modules/store-editor/storeEditorTabs.js",
    "/modules/store-editor/storeEditorPreview.js",
    "/modules/store-editor/storeEditorProducts.js",
    "/src/services/themeAuthorityV2.js",
    "/src/services/safeAreaManager.js",
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
