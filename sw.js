const CACHE = "pickup-rush-v59-daily";
const ASSETS = ["./daily.js?v=59", "./retry.js?v=59", "./shuffle.js?v=59", "./timing.js?v=59", "./stage-times.js?v=59", "./mission-rewards.js?v=59", "./stage-start.css?v=59", "./items.js?v=59", "./shop.css?v=59", "./queue-cut.js?v=59", "./queue-cut-scene.js?v=59", "./queue-cut.css?v=59", "./bright.css?v=59", "./art/sunny-terminal-v1.png", "./puzzle.js?v=59", "./puzzle-scene.js?v=59", "./studio.html", "./studio.js?v=59", "./studio.css?v=59", "./fleet.js?v=59", "./station-scene.js?v=59", "./brand/ninetosix-logo.png", "./emergency.js?v=59", "./emergency.css?v=59", "./sfx.js?v=59", "./festival.css?v=59", "./boot.js?v=59", "./loading.css?v=59", "./home.css?v=59", "./art/night-terminal-v1.png", "./district-scene.js?v=59", "./campaign-layouts-v4.js?v=59", "./audio/lantern-lane.mp3", "./garage.js?v=59", "./music.js?v=59", "./campaign.js?v=59", "./campaign-layouts.js?v=59", "./demand.js?v=59", "./lobby.css?v=59", "./lobby-scene.js?v=59", "./progress.js?v=59", "./session.js?v=59", "./index.html", "./style.css?v=59", "./game.js?v=59", "./app.js?v=59", "./traffic.js?v=59", "./scene.js?v=59", "./market.js?v=59", "./market-scene.js?v=59", "./appearance.js?v=59", "./geometry.js?v=59", "./layout.js?v=59", "./platform.js?v=59", "./manifest.webmanifest?v=59"];
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
