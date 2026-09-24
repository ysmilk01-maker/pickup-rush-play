const CACHE = "pickup-rush-v36-festival";
const ASSETS = ["./festival.css?v=36", "./boot.js?v=36", "./loading.css?v=36", "./home.css?v=36", "./art/night-terminal-v1.png", "./district-scene.js?v=36", "./campaign-layouts-v4.js?v=36", "./audio/lantern-lane.mp3", "./garage.js?v=36", "./music.js?v=36", "./campaign.js?v=36", "./campaign-layouts.js?v=36", "./demand.js?v=36", "./lobby.css?v=36", "./lobby-scene.js?v=36", "./progress.js?v=36", "./session.js?v=36", "./index.html", "./style.css?v=36", "./game.js?v=36", "./app.js?v=36", "./traffic.js?v=36", "./scene.js?v=36", "./market.js?v=36", "./market-scene.js?v=36", "./appearance.js?v=36", "./geometry.js?v=36", "./layout.js?v=36", "./platform.js?v=36", "./manifest.webmanifest?v=36"];
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
