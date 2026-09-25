const CACHE = "pickup-rush-v43-full-sfx";
const ASSETS = ["./station-scene.js?v=43", "./brand/ninetosix-logo.png", "./emergency.js?v=43", "./emergency.css?v=43", "./sfx.js?v=43", "./festival.css?v=43", "./boot.js?v=43", "./loading.css?v=43", "./home.css?v=43", "./art/night-terminal-v1.png", "./district-scene.js?v=43", "./campaign-layouts-v4.js?v=43", "./audio/lantern-lane.mp3", "./garage.js?v=43", "./music.js?v=43", "./campaign.js?v=43", "./campaign-layouts.js?v=43", "./demand.js?v=43", "./lobby.css?v=43", "./lobby-scene.js?v=43", "./progress.js?v=43", "./session.js?v=43", "./index.html", "./style.css?v=43", "./game.js?v=43", "./app.js?v=43", "./traffic.js?v=43", "./scene.js?v=43", "./market.js?v=43", "./market-scene.js?v=43", "./appearance.js?v=43", "./geometry.js?v=43", "./layout.js?v=43", "./platform.js?v=43", "./manifest.webmanifest?v=43"];
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
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html")),
    );
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
