const CACHE = "pickup-rush-v32";
const ASSETS = ["./district-scene.js?v=32", "./campaign-layouts-v4.js?v=32", "./audio/lantern-lane.mp3", "./garage.js?v=32", "./music.js?v=32", "./campaign.js?v=32", "./campaign-layouts.js?v=32", "./demand.js?v=32", "./lobby.css?v=32", "./lobby-scene.js?v=32", "./progress.js?v=32", "./session.js?v=32", "./index.html", "./style.css?v=32", "./game.js?v=32", "./app.js?v=32", "./traffic.js?v=32", "./scene.js?v=32", "./market.js?v=32", "./market-scene.js?v=32", "./appearance.js?v=32", "./geometry.js?v=32", "./layout.js?v=32", "./platform.js?v=32", "./manifest.webmanifest?v=32"];
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
