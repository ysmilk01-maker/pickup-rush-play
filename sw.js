const CACHE = "pickup-rush-v27";
const ASSETS = ["./audio/lantern-lane.mp3", "./garage.js?v=27", "./music.js?v=27", "./campaign.js?v=27", "./campaign-layouts.js?v=27", "./demand.js?v=27", "./lobby.css?v=27", "./lobby-scene.js?v=27", "./progress.js?v=27", "./session.js?v=27", "./index.html", "./style.css?v=27", "./game.js?v=27", "./app.js?v=27", "./traffic.js?v=27", "./scene.js?v=27", "./market.js?v=27", "./market-scene.js?v=27", "./appearance.js?v=27", "./geometry.js?v=27", "./layout.js?v=27", "./platform.js?v=27", "./manifest.webmanifest?v=27"];
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
