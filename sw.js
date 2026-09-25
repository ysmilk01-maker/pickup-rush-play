const CACHE = "pickup-rush-v47-puzzle-paths";
const ASSETS = ["./puzzle.js?v=47", "./puzzle-scene.js?v=47", "./studio.html", "./studio.js?v=47", "./studio.css?v=47", "./fleet.js?v=47", "./station-scene.js?v=47", "./brand/ninetosix-logo.png", "./emergency.js?v=47", "./emergency.css?v=47", "./sfx.js?v=47", "./festival.css?v=47", "./boot.js?v=47", "./loading.css?v=47", "./home.css?v=47", "./art/night-terminal-v1.png", "./district-scene.js?v=47", "./campaign-layouts-v4.js?v=47", "./audio/lantern-lane.mp3", "./garage.js?v=47", "./music.js?v=47", "./campaign.js?v=47", "./campaign-layouts.js?v=47", "./demand.js?v=47", "./lobby.css?v=47", "./lobby-scene.js?v=47", "./progress.js?v=47", "./session.js?v=47", "./index.html", "./style.css?v=47", "./game.js?v=47", "./app.js?v=47", "./traffic.js?v=47", "./scene.js?v=47", "./market.js?v=47", "./market-scene.js?v=47", "./appearance.js?v=47", "./geometry.js?v=47", "./layout.js?v=47", "./platform.js?v=47", "./manifest.webmanifest?v=47"];
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
