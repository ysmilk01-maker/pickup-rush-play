const CACHE = "pickup-rush-v33-home2";
const ASSETS = ["./home.css?v=33", "./art/night-terminal-v1.png", "./district-scene.js?v=33", "./campaign-layouts-v4.js?v=33", "./audio/lantern-lane.mp3", "./garage.js?v=33", "./music.js?v=33", "./campaign.js?v=33", "./campaign-layouts.js?v=33", "./demand.js?v=33", "./lobby.css?v=33", "./lobby-scene.js?v=33", "./progress.js?v=33", "./session.js?v=33", "./index.html", "./style.css?v=33", "./game.js?v=33", "./app.js?v=33", "./traffic.js?v=33", "./scene.js?v=33", "./market.js?v=33", "./market-scene.js?v=33", "./appearance.js?v=33", "./geometry.js?v=33", "./layout.js?v=33", "./platform.js?v=33", "./manifest.webmanifest?v=33"];
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
