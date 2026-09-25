const CACHE = "pickup-rush-v58-retry-ad";
const ASSETS = ["./retry.js?v=58", "./shuffle.js?v=58", "./timing.js?v=58", "./stage-times.js?v=58", "./mission-rewards.js?v=58", "./stage-start.css?v=58", "./items.js?v=58", "./shop.css?v=58", "./queue-cut.js?v=58", "./queue-cut-scene.js?v=58", "./queue-cut.css?v=58", "./bright.css?v=58", "./art/sunny-terminal-v1.png", "./puzzle.js?v=58", "./puzzle-scene.js?v=58", "./studio.html", "./studio.js?v=58", "./studio.css?v=58", "./fleet.js?v=58", "./station-scene.js?v=58", "./brand/ninetosix-logo.png", "./emergency.js?v=58", "./emergency.css?v=58", "./sfx.js?v=58", "./festival.css?v=58", "./boot.js?v=58", "./loading.css?v=58", "./home.css?v=58", "./art/night-terminal-v1.png", "./district-scene.js?v=58", "./campaign-layouts-v4.js?v=58", "./audio/lantern-lane.mp3", "./garage.js?v=58", "./music.js?v=58", "./campaign.js?v=58", "./campaign-layouts.js?v=58", "./demand.js?v=58", "./lobby.css?v=58", "./lobby-scene.js?v=58", "./progress.js?v=58", "./session.js?v=58", "./index.html", "./style.css?v=58", "./game.js?v=58", "./app.js?v=58", "./traffic.js?v=58", "./scene.js?v=58", "./market.js?v=58", "./market-scene.js?v=58", "./appearance.js?v=58", "./geometry.js?v=58", "./layout.js?v=58", "./platform.js?v=58", "./manifest.webmanifest?v=58"];
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
