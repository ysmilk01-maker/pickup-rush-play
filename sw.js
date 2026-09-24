const CACHE = "pickup-rush-v25";
const ASSETS = ["./campaign.js?v=25", "./campaign-layouts.js?v=25", "./demand.js?v=25", "./lobby.css?v=25", "./lobby-scene.js?v=25", "./progress.js?v=25", "./session.js?v=25", "./index.html", "./style.css?v=25", "./game.js?v=25", "./app.js?v=25", "./traffic.js?v=25", "./scene.js?v=25", "./market.js?v=25", "./market-scene.js?v=25", "./appearance.js?v=25", "./geometry.js?v=25", "./layout.js?v=25", "./platform.js?v=25", "./manifest.webmanifest?v=25"];
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
