const CACHE = "pickup-rush-v23";
const ASSETS = ["./lobby.css?v=23", "./lobby-scene.js?v=23", "./progress.js?v=23", "./session.js?v=23", "./index.html", "./style.css?v=23", "./game.js?v=23", "./app.js?v=23", "./traffic.js?v=23", "./scene.js?v=23", "./market.js?v=23", "./market-scene.js?v=23", "./appearance.js?v=23", "./geometry.js?v=23", "./layout.js?v=23", "./platform.js?v=23", "./manifest.webmanifest?v=23"];
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
