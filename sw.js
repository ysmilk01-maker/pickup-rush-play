const CACHE = "pickup-rush-v37-sound";
const ASSETS = ["./sfx.js?v=37", "./festival.css?v=37", "./boot.js?v=37", "./loading.css?v=37", "./home.css?v=37", "./art/night-terminal-v1.png", "./district-scene.js?v=37", "./campaign-layouts-v4.js?v=37", "./audio/lantern-lane.mp3", "./garage.js?v=37", "./music.js?v=37", "./campaign.js?v=37", "./campaign-layouts.js?v=37", "./demand.js?v=37", "./lobby.css?v=37", "./lobby-scene.js?v=37", "./progress.js?v=37", "./session.js?v=37", "./index.html", "./style.css?v=37", "./game.js?v=37", "./app.js?v=37", "./traffic.js?v=37", "./scene.js?v=37", "./market.js?v=37", "./market-scene.js?v=37", "./appearance.js?v=37", "./geometry.js?v=37", "./layout.js?v=37", "./platform.js?v=37", "./manifest.webmanifest?v=37"];
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
