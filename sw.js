const CACHE = "pickup-rush-v56-speed-prices";
const ASSETS = ["./shuffle.js?v=56", "./timing.js?v=56", "./stage-times.js?v=56", "./mission-rewards.js?v=56", "./stage-start.css?v=56", "./items.js?v=56", "./shop.css?v=56", "./queue-cut.js?v=56", "./queue-cut-scene.js?v=56", "./queue-cut.css?v=56", "./bright.css?v=56", "./art/sunny-terminal-v1.png", "./puzzle.js?v=56", "./puzzle-scene.js?v=56", "./studio.html", "./studio.js?v=56", "./studio.css?v=56", "./fleet.js?v=56", "./station-scene.js?v=56", "./brand/ninetosix-logo.png", "./emergency.js?v=56", "./emergency.css?v=56", "./sfx.js?v=56", "./festival.css?v=56", "./boot.js?v=56", "./loading.css?v=56", "./home.css?v=56", "./art/night-terminal-v1.png", "./district-scene.js?v=56", "./campaign-layouts-v4.js?v=56", "./audio/lantern-lane.mp3", "./garage.js?v=56", "./music.js?v=56", "./campaign.js?v=56", "./campaign-layouts.js?v=56", "./demand.js?v=56", "./lobby.css?v=56", "./lobby-scene.js?v=56", "./progress.js?v=56", "./session.js?v=56", "./index.html", "./style.css?v=56", "./game.js?v=56", "./app.js?v=56", "./traffic.js?v=56", "./scene.js?v=56", "./market.js?v=56", "./market-scene.js?v=56", "./appearance.js?v=56", "./geometry.js?v=56", "./layout.js?v=56", "./platform.js?v=56", "./manifest.webmanifest?v=56"];
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
