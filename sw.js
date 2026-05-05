const CACHE_NAME = "simplifica-3d-v51-superadmin-search-test";
const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./src/services/errorTelemetry.js",
  "./src/services/adMobService.js",
  "./src/services/monetizationLimits.js",
  "./assets/vendor/jspdf.umd.min.js",
  "./assets/vendor/qrcode.min.js",
  "./assets/simplifica-cover.svg",
  "./assets/simplifica-brand-cover.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png",
  "./assets/intro.mp4",
  "./manifest.webmanifest",
  "./icon.svg"
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
    "/sw.js",
    "/assets/intro.mp4"
  ].includes(url.pathname);

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
