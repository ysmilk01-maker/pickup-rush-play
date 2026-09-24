const CACHE = "pickup-rush-v24";
const ASSETS = ["./demand.js?v=24", "./lobby.css?v=24", "./lobby-scene.js?v=24", "./progress.js?v=24", "./session.js?v=24", "./index.html", "./style.css?v=24", "./game.js?v=24", "./app.js?v=24", "./traffic.js?v=24", "./scene.js?v=24", "./market.js?v=24", "./market-scene.js?v=24", "./appearance.js?v=24", "./geometry.js?v=24", "./layout.js?v=24", "./platform.js?v=24", "./manifest.webmanifest?v=24"];
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
