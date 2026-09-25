const CACHE = "pickup-rush-v54-200-shuffle-time";
const ASSETS = ["./shuffle.js?v=54", "./timing.js?v=54", "./stage-times.js?v=54", "./mission-rewards.js?v=54", "./stage-start.css?v=54", "./items.js?v=54", "./shop.css?v=54", "./queue-cut.js?v=54", "./queue-cut-scene.js?v=54", "./queue-cut.css?v=54", "./bright.css?v=54", "./art/sunny-terminal-v1.png", "./puzzle.js?v=54", "./puzzle-scene.js?v=54", "./studio.html", "./studio.js?v=54", "./studio.css?v=54", "./fleet.js?v=54", "./station-scene.js?v=54", "./brand/ninetosix-logo.png", "./emergency.js?v=54", "./emergency.css?v=54", "./sfx.js?v=54", "./festival.css?v=54", "./boot.js?v=54", "./loading.css?v=54", "./home.css?v=54", "./art/night-terminal-v1.png", "./district-scene.js?v=54", "./campaign-layouts-v4.js?v=54", "./audio/lantern-lane.mp3", "./garage.js?v=54", "./music.js?v=54", "./campaign.js?v=54", "./campaign-layouts.js?v=54", "./demand.js?v=54", "./lobby.css?v=54", "./lobby-scene.js?v=54", "./progress.js?v=54", "./session.js?v=54", "./index.html", "./style.css?v=54", "./game.js?v=54", "./app.js?v=54", "./traffic.js?v=54", "./scene.js?v=54", "./market.js?v=54", "./market-scene.js?v=54", "./appearance.js?v=54", "./geometry.js?v=54", "./layout.js?v=54", "./platform.js?v=54", "./manifest.webmanifest?v=54"];
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
