const CACHE = "pickup-rush-v57-cut-choice";
const ASSETS = ["./shuffle.js?v=57", "./timing.js?v=57", "./stage-times.js?v=57", "./mission-rewards.js?v=57", "./stage-start.css?v=57", "./items.js?v=57", "./shop.css?v=57", "./queue-cut.js?v=57", "./queue-cut-scene.js?v=57", "./queue-cut.css?v=57", "./bright.css?v=57", "./art/sunny-terminal-v1.png", "./puzzle.js?v=57", "./puzzle-scene.js?v=57", "./studio.html", "./studio.js?v=57", "./studio.css?v=57", "./fleet.js?v=57", "./station-scene.js?v=57", "./brand/ninetosix-logo.png", "./emergency.js?v=57", "./emergency.css?v=57", "./sfx.js?v=57", "./festival.css?v=57", "./boot.js?v=57", "./loading.css?v=57", "./home.css?v=57", "./art/night-terminal-v1.png", "./district-scene.js?v=57", "./campaign-layouts-v4.js?v=57", "./audio/lantern-lane.mp3", "./garage.js?v=57", "./music.js?v=57", "./campaign.js?v=57", "./campaign-layouts.js?v=57", "./demand.js?v=57", "./lobby.css?v=57", "./lobby-scene.js?v=57", "./progress.js?v=57", "./session.js?v=57", "./index.html", "./style.css?v=57", "./game.js?v=57", "./app.js?v=57", "./traffic.js?v=57", "./scene.js?v=57", "./market.js?v=57", "./market-scene.js?v=57", "./appearance.js?v=57", "./geometry.js?v=57", "./layout.js?v=57", "./platform.js?v=57", "./manifest.webmanifest?v=57"];
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
