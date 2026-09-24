const CACHE = "pickup-rush-v29";
const ASSETS = ["./district-scene.js?v=29", "./campaign-layouts-v4.js?v=29", "./audio/lantern-lane.mp3", "./garage.js?v=29", "./music.js?v=29", "./campaign.js?v=29", "./campaign-layouts.js?v=29", "./demand.js?v=29", "./lobby.css?v=29", "./lobby-scene.js?v=29", "./progress.js?v=29", "./session.js?v=29", "./index.html", "./style.css?v=29", "./game.js?v=29", "./app.js?v=29", "./traffic.js?v=29", "./scene.js?v=29", "./market.js?v=29", "./market-scene.js?v=29", "./appearance.js?v=29", "./geometry.js?v=29", "./layout.js?v=29", "./platform.js?v=29", "./manifest.webmanifest?v=29"];
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
