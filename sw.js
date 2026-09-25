const CACHE = "pickup-rush-v55-paid-undo";
const ASSETS = ["./shuffle.js?v=55", "./timing.js?v=55", "./stage-times.js?v=55", "./mission-rewards.js?v=55", "./stage-start.css?v=55", "./items.js?v=55", "./shop.css?v=55", "./queue-cut.js?v=55", "./queue-cut-scene.js?v=55", "./queue-cut.css?v=55", "./bright.css?v=55", "./art/sunny-terminal-v1.png", "./puzzle.js?v=55", "./puzzle-scene.js?v=55", "./studio.html", "./studio.js?v=55", "./studio.css?v=55", "./fleet.js?v=55", "./station-scene.js?v=55", "./brand/ninetosix-logo.png", "./emergency.js?v=55", "./emergency.css?v=55", "./sfx.js?v=55", "./festival.css?v=55", "./boot.js?v=55", "./loading.css?v=55", "./home.css?v=55", "./art/night-terminal-v1.png", "./district-scene.js?v=55", "./campaign-layouts-v4.js?v=55", "./audio/lantern-lane.mp3", "./garage.js?v=55", "./music.js?v=55", "./campaign.js?v=55", "./campaign-layouts.js?v=55", "./demand.js?v=55", "./lobby.css?v=55", "./lobby-scene.js?v=55", "./progress.js?v=55", "./session.js?v=55", "./index.html", "./style.css?v=55", "./game.js?v=55", "./app.js?v=55", "./traffic.js?v=55", "./scene.js?v=55", "./market.js?v=55", "./market-scene.js?v=55", "./appearance.js?v=55", "./geometry.js?v=55", "./layout.js?v=55", "./platform.js?v=55", "./manifest.webmanifest?v=55"];
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
