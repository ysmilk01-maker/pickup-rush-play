const CACHE = "pickup-rush-v31";
const ASSETS = ["./district-scene.js?v=31", "./campaign-layouts-v4.js?v=31", "./audio/lantern-lane.mp3", "./garage.js?v=31", "./music.js?v=31", "./campaign.js?v=31", "./campaign-layouts.js?v=31", "./demand.js?v=31", "./lobby.css?v=31", "./lobby-scene.js?v=31", "./progress.js?v=31", "./session.js?v=31", "./index.html", "./style.css?v=31", "./game.js?v=31", "./app.js?v=31", "./traffic.js?v=31", "./scene.js?v=31", "./market.js?v=31", "./market-scene.js?v=31", "./appearance.js?v=31", "./geometry.js?v=31", "./layout.js?v=31", "./platform.js?v=31", "./manifest.webmanifest?v=31"];
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
