const CACHE = "pickup-rush-v49-sunny-festival";
const ASSETS = ["./bright.css?v=49", "./art/sunny-terminal-v1.png", "./puzzle.js?v=49", "./puzzle-scene.js?v=49", "./studio.html", "./studio.js?v=49", "./studio.css?v=49", "./fleet.js?v=49", "./station-scene.js?v=49", "./brand/ninetosix-logo.png", "./emergency.js?v=49", "./emergency.css?v=49", "./sfx.js?v=49", "./festival.css?v=49", "./boot.js?v=49", "./loading.css?v=49", "./home.css?v=49", "./art/night-terminal-v1.png", "./district-scene.js?v=49", "./campaign-layouts-v4.js?v=49", "./audio/lantern-lane.mp3", "./garage.js?v=49", "./music.js?v=49", "./campaign.js?v=49", "./campaign-layouts.js?v=49", "./demand.js?v=49", "./lobby.css?v=49", "./lobby-scene.js?v=49", "./progress.js?v=49", "./session.js?v=49", "./index.html", "./style.css?v=49", "./game.js?v=49", "./app.js?v=49", "./traffic.js?v=49", "./scene.js?v=49", "./market.js?v=49", "./market-scene.js?v=49", "./appearance.js?v=49", "./geometry.js?v=49", "./layout.js?v=49", "./platform.js?v=49", "./manifest.webmanifest?v=49"];
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
