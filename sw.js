const CACHE = "pickup-rush-v20";
const ASSETS = ["./index.html", "./style.css?v=20", "./game.js?v=20", "./app.js?v=20", "./traffic.js?v=20", "./scene.js?v=20", "./market.js?v=20", "./market-scene.js?v=20", "./appearance.js?v=20", "./geometry.js?v=20", "./layout.js?v=20", "./platform.js?v=20", "./manifest.webmanifest?v=20"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html")),
    );
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
