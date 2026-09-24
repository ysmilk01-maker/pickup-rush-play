const CACHE = "pickup-rush-v34-opening";
const ASSETS = ["./boot.js?v=34", "./loading.css?v=34", "./home.css?v=34", "./art/night-terminal-v1.png", "./district-scene.js?v=34", "./campaign-layouts-v4.js?v=34", "./audio/lantern-lane.mp3", "./garage.js?v=34", "./music.js?v=34", "./campaign.js?v=34", "./campaign-layouts.js?v=34", "./demand.js?v=34", "./lobby.css?v=34", "./lobby-scene.js?v=34", "./progress.js?v=34", "./session.js?v=34", "./index.html", "./style.css?v=34", "./game.js?v=34", "./app.js?v=34", "./traffic.js?v=34", "./scene.js?v=34", "./market.js?v=34", "./market-scene.js?v=34", "./appearance.js?v=34", "./geometry.js?v=34", "./layout.js?v=34", "./platform.js?v=34", "./manifest.webmanifest?v=34"];
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
