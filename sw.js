const CACHE = "pickup-rush-v38-emergency";
const ASSETS = ["./emergency.js?v=38", "./emergency.css?v=38", "./sfx.js?v=38", "./festival.css?v=38", "./boot.js?v=38", "./loading.css?v=38", "./home.css?v=38", "./art/night-terminal-v1.png", "./district-scene.js?v=38", "./campaign-layouts-v4.js?v=38", "./audio/lantern-lane.mp3", "./garage.js?v=38", "./music.js?v=38", "./campaign.js?v=38", "./campaign-layouts.js?v=38", "./demand.js?v=38", "./lobby.css?v=38", "./lobby-scene.js?v=38", "./progress.js?v=38", "./session.js?v=38", "./index.html", "./style.css?v=38", "./game.js?v=38", "./app.js?v=38", "./traffic.js?v=38", "./scene.js?v=38", "./market.js?v=38", "./market-scene.js?v=38", "./appearance.js?v=38", "./geometry.js?v=38", "./layout.js?v=38", "./platform.js?v=38", "./manifest.webmanifest?v=38"];
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
