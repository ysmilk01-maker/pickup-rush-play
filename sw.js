const CACHE = "pickup-rush-v16";
const ASSETS = ["./index.html", "./style.css?v=16", "./game.js?v=16", "./app.js?v=16", "./traffic.js?v=16", "./scene.js?v=16", "./market.js?v=16", "./market-scene.js?v=16", "./appearance.js?v=16", "./geometry.js?v=16", "./layout.js?v=16", "./platform.js?v=16", "./manifest.webmanifest?v=16"];
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
