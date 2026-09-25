const CACHE = "pickup-rush-v52-stage-rewards";
const ASSETS = ["./mission-rewards.js?v=52", "./stage-start.css?v=52", "./items.js?v=52", "./shop.css?v=52", "./queue-cut.js?v=52", "./queue-cut-scene.js?v=52", "./queue-cut.css?v=52", "./bright.css?v=52", "./art/sunny-terminal-v1.png", "./puzzle.js?v=52", "./puzzle-scene.js?v=52", "./studio.html", "./studio.js?v=52", "./studio.css?v=52", "./fleet.js?v=52", "./station-scene.js?v=52", "./brand/ninetosix-logo.png", "./emergency.js?v=52", "./emergency.css?v=52", "./sfx.js?v=52", "./festival.css?v=52", "./boot.js?v=52", "./loading.css?v=52", "./home.css?v=52", "./art/night-terminal-v1.png", "./district-scene.js?v=52", "./campaign-layouts-v4.js?v=52", "./audio/lantern-lane.mp3", "./garage.js?v=52", "./music.js?v=52", "./campaign.js?v=52", "./campaign-layouts.js?v=52", "./demand.js?v=52", "./lobby.css?v=52", "./lobby-scene.js?v=52", "./progress.js?v=52", "./session.js?v=52", "./index.html", "./style.css?v=52", "./game.js?v=52", "./app.js?v=52", "./traffic.js?v=52", "./scene.js?v=52", "./market.js?v=52", "./market-scene.js?v=52", "./appearance.js?v=52", "./geometry.js?v=52", "./layout.js?v=52", "./platform.js?v=52", "./manifest.webmanifest?v=52"];
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
