const CACHE = "pickup-rush-v51-shop-items";
const ASSETS = ["./items.js?v=51", "./shop.css?v=51", "./queue-cut.js?v=51", "./queue-cut-scene.js?v=51", "./queue-cut.css?v=51", "./bright.css?v=51", "./art/sunny-terminal-v1.png", "./puzzle.js?v=51", "./puzzle-scene.js?v=51", "./studio.html", "./studio.js?v=51", "./studio.css?v=51", "./fleet.js?v=51", "./station-scene.js?v=51", "./brand/ninetosix-logo.png", "./emergency.js?v=51", "./emergency.css?v=51", "./sfx.js?v=51", "./festival.css?v=51", "./boot.js?v=51", "./loading.css?v=51", "./home.css?v=51", "./art/night-terminal-v1.png", "./district-scene.js?v=51", "./campaign-layouts-v4.js?v=51", "./audio/lantern-lane.mp3", "./garage.js?v=51", "./music.js?v=51", "./campaign.js?v=51", "./campaign-layouts.js?v=51", "./demand.js?v=51", "./lobby.css?v=51", "./lobby-scene.js?v=51", "./progress.js?v=51", "./session.js?v=51", "./index.html", "./style.css?v=51", "./game.js?v=51", "./app.js?v=51", "./traffic.js?v=51", "./scene.js?v=51", "./market.js?v=51", "./market-scene.js?v=51", "./appearance.js?v=51", "./geometry.js?v=51", "./layout.js?v=51", "./platform.js?v=51", "./manifest.webmanifest?v=51"];
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
