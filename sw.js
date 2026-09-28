const CACHE = "pickup-rush-v61-mascot";
const ASSETS = ["./mascot.js?v=61", "./stickers.js?v=61", "./mascot.css?v=61", "./cute.css?v=61", "./fonts/jua-korean.woff2", "./fonts/jua-latin.woff2", "./daily.js?v=61", "./retry.js?v=61", "./shuffle.js?v=61", "./timing.js?v=61", "./stage-times.js?v=61", "./mission-rewards.js?v=61", "./stage-start.css?v=61", "./items.js?v=61", "./shop.css?v=61", "./queue-cut.js?v=61", "./queue-cut-scene.js?v=61", "./queue-cut.css?v=61", "./bright.css?v=61", "./art/sunny-terminal-v1.png", "./puzzle.js?v=61", "./puzzle-scene.js?v=61", "./studio.html", "./studio.js?v=61", "./studio.css?v=61", "./fleet.js?v=61", "./station-scene.js?v=61", "./brand/ninetosix-logo.png", "./emergency.js?v=61", "./emergency.css?v=61", "./sfx.js?v=61", "./festival.css?v=61", "./boot.js?v=61", "./loading.css?v=61", "./home.css?v=61", "./art/night-terminal-v1.png", "./district-scene.js?v=61", "./campaign-layouts-v4.js?v=61", "./audio/lantern-lane.mp3", "./garage.js?v=61", "./music.js?v=61", "./campaign.js?v=61", "./campaign-layouts.js?v=61", "./demand.js?v=61", "./lobby.css?v=61", "./lobby-scene.js?v=61", "./progress.js?v=61", "./session.js?v=61", "./index.html", "./style.css?v=61", "./game.js?v=61", "./app.js?v=61", "./traffic.js?v=61", "./scene.js?v=61", "./market.js?v=61", "./market-scene.js?v=61", "./appearance.js?v=61", "./geometry.js?v=61", "./layout.js?v=61", "./platform.js?v=61", "./manifest.webmanifest?v=61"];
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
