const CACHE = "pickup-rush-v60-cute";
const ASSETS = ["./cute.css?v=60", "./fonts/jua-korean.woff2", "./fonts/jua-latin.woff2", "./daily.js?v=60", "./retry.js?v=60", "./shuffle.js?v=60", "./timing.js?v=60", "./stage-times.js?v=60", "./mission-rewards.js?v=60", "./stage-start.css?v=60", "./items.js?v=60", "./shop.css?v=60", "./queue-cut.js?v=60", "./queue-cut-scene.js?v=60", "./queue-cut.css?v=60", "./bright.css?v=60", "./art/sunny-terminal-v1.png", "./puzzle.js?v=60", "./puzzle-scene.js?v=60", "./studio.html", "./studio.js?v=60", "./studio.css?v=60", "./fleet.js?v=60", "./station-scene.js?v=60", "./brand/ninetosix-logo.png", "./emergency.js?v=60", "./emergency.css?v=60", "./sfx.js?v=60", "./festival.css?v=60", "./boot.js?v=60", "./loading.css?v=60", "./home.css?v=60", "./art/night-terminal-v1.png", "./district-scene.js?v=60", "./campaign-layouts-v4.js?v=60", "./audio/lantern-lane.mp3", "./garage.js?v=60", "./music.js?v=60", "./campaign.js?v=60", "./campaign-layouts.js?v=60", "./demand.js?v=60", "./lobby.css?v=60", "./lobby-scene.js?v=60", "./progress.js?v=60", "./session.js?v=60", "./index.html", "./style.css?v=60", "./game.js?v=60", "./app.js?v=60", "./traffic.js?v=60", "./scene.js?v=60", "./market.js?v=60", "./market-scene.js?v=60", "./appearance.js?v=60", "./geometry.js?v=60", "./layout.js?v=60", "./platform.js?v=60", "./manifest.webmanifest?v=60"];
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
