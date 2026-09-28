const CACHE = "pickup-rush-v62-bgm";
const ASSETS = ["./mascot.js?v=62", "./stickers.js?v=62", "./mascot.css?v=62", "./cute.css?v=62", "./fonts/jua-korean.woff2", "./fonts/jua-latin.woff2", "./daily.js?v=62", "./retry.js?v=62", "./shuffle.js?v=62", "./timing.js?v=62", "./stage-times.js?v=62", "./mission-rewards.js?v=62", "./stage-start.css?v=62", "./items.js?v=62", "./shop.css?v=62", "./queue-cut.js?v=62", "./queue-cut-scene.js?v=62", "./queue-cut.css?v=62", "./bright.css?v=62", "./art/sunny-terminal-v1.png", "./puzzle.js?v=62", "./puzzle-scene.js?v=62", "./studio.html", "./studio.js?v=62", "./studio.css?v=62", "./fleet.js?v=62", "./station-scene.js?v=62", "./brand/ninetosix-logo.png", "./emergency.js?v=62", "./emergency.css?v=62", "./sfx.js?v=62", "./festival.css?v=62", "./boot.js?v=62", "./loading.css?v=62", "./home.css?v=62", "./art/night-terminal-v1.png", "./district-scene.js?v=62", "./campaign-layouts-v4.js?v=62", "./audio/yue2-lobby-instrumental.mp3", "./audio/yue2-drive-instrumental.mp3", "./garage.js?v=62", "./music.js?v=62", "./campaign.js?v=62", "./campaign-layouts.js?v=62", "./demand.js?v=62", "./lobby.css?v=62", "./lobby-scene.js?v=62", "./progress.js?v=62", "./session.js?v=62", "./index.html", "./style.css?v=62", "./game.js?v=62", "./app.js?v=62", "./traffic.js?v=62", "./scene.js?v=62", "./market.js?v=62", "./market-scene.js?v=62", "./appearance.js?v=62", "./geometry.js?v=62", "./layout.js?v=62", "./platform.js?v=62", "./manifest.webmanifest?v=62"];
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
