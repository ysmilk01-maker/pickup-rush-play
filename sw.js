const CACHE = "pickup-rush-v30";
const ASSETS = ["./district-scene.js?v=30", "./campaign-layouts-v4.js?v=30", "./audio/lantern-lane.mp3", "./garage.js?v=30", "./music.js?v=30", "./campaign.js?v=30", "./campaign-layouts.js?v=30", "./demand.js?v=30", "./lobby.css?v=30", "./lobby-scene.js?v=30", "./progress.js?v=30", "./session.js?v=30", "./index.html", "./style.css?v=30", "./game.js?v=30", "./app.js?v=30", "./traffic.js?v=30", "./scene.js?v=30", "./market.js?v=30", "./market-scene.js?v=30", "./appearance.js?v=30", "./geometry.js?v=30", "./layout.js?v=30", "./platform.js?v=30", "./manifest.webmanifest?v=30"];
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
