const CACHE = "pickup-rush-v53-item-prices";
const ASSETS = ["./mission-rewards.js?v=53", "./stage-start.css?v=53", "./items.js?v=53", "./shop.css?v=53", "./queue-cut.js?v=53", "./queue-cut-scene.js?v=53", "./queue-cut.css?v=53", "./bright.css?v=53", "./art/sunny-terminal-v1.png", "./puzzle.js?v=53", "./puzzle-scene.js?v=53", "./studio.html", "./studio.js?v=53", "./studio.css?v=53", "./fleet.js?v=53", "./station-scene.js?v=53", "./brand/ninetosix-logo.png", "./emergency.js?v=53", "./emergency.css?v=53", "./sfx.js?v=53", "./festival.css?v=53", "./boot.js?v=53", "./loading.css?v=53", "./home.css?v=53", "./art/night-terminal-v1.png", "./district-scene.js?v=53", "./campaign-layouts-v4.js?v=53", "./audio/lantern-lane.mp3", "./garage.js?v=53", "./music.js?v=53", "./campaign.js?v=53", "./campaign-layouts.js?v=53", "./demand.js?v=53", "./lobby.css?v=53", "./lobby-scene.js?v=53", "./progress.js?v=53", "./session.js?v=53", "./index.html", "./style.css?v=53", "./game.js?v=53", "./app.js?v=53", "./traffic.js?v=53", "./scene.js?v=53", "./market.js?v=53", "./market-scene.js?v=53", "./appearance.js?v=53", "./geometry.js?v=53", "./layout.js?v=53", "./platform.js?v=53", "./manifest.webmanifest?v=53"];
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
    const page=new URL(event.request.url).pathname.endsWith("/studio.html")?"./studio.html":"./index.html";
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(page, copy));
          return response;
        })
        .catch(() => caches.match(page)),
    );
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
