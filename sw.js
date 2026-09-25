const CACHE = "pickup-rush-v44-region-fleets";
const ASSETS = ["./fleet.js?v=44", "./station-scene.js?v=44", "./brand/ninetosix-logo.png", "./emergency.js?v=44", "./emergency.css?v=44", "./sfx.js?v=44", "./festival.css?v=44", "./boot.js?v=44", "./loading.css?v=44", "./home.css?v=44", "./art/night-terminal-v1.png", "./district-scene.js?v=44", "./campaign-layouts-v4.js?v=44", "./audio/lantern-lane.mp3", "./garage.js?v=44", "./music.js?v=44", "./campaign.js?v=44", "./campaign-layouts.js?v=44", "./demand.js?v=44", "./lobby.css?v=44", "./lobby-scene.js?v=44", "./progress.js?v=44", "./session.js?v=44", "./index.html", "./style.css?v=44", "./game.js?v=44", "./app.js?v=44", "./traffic.js?v=44", "./scene.js?v=44", "./market.js?v=44", "./market-scene.js?v=44", "./appearance.js?v=44", "./geometry.js?v=44", "./layout.js?v=44", "./platform.js?v=44", "./manifest.webmanifest?v=44"];
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
