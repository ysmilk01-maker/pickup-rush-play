const CACHE = "pickup-rush-v39-brand";
const ASSETS = ["./brand/ninetosix-logo.png", "./emergency.js?v=39", "./emergency.css?v=39", "./sfx.js?v=39", "./festival.css?v=39", "./boot.js?v=39", "./loading.css?v=39", "./home.css?v=39", "./art/night-terminal-v1.png", "./district-scene.js?v=39", "./campaign-layouts-v4.js?v=39", "./audio/lantern-lane.mp3", "./garage.js?v=39", "./music.js?v=39", "./campaign.js?v=39", "./campaign-layouts.js?v=39", "./demand.js?v=39", "./lobby.css?v=39", "./lobby-scene.js?v=39", "./progress.js?v=39", "./session.js?v=39", "./index.html", "./style.css?v=39", "./game.js?v=39", "./app.js?v=39", "./traffic.js?v=39", "./scene.js?v=39", "./market.js?v=39", "./market-scene.js?v=39", "./appearance.js?v=39", "./geometry.js?v=39", "./layout.js?v=39", "./platform.js?v=39", "./manifest.webmanifest?v=39"];
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
