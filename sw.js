const CACHE = "pickup-rush-v41-station";
const ASSETS = ["./station-scene.js?v=41", "./brand/ninetosix-logo.png", "./emergency.js?v=41", "./emergency.css?v=41", "./sfx.js?v=41", "./festival.css?v=41", "./boot.js?v=41", "./loading.css?v=41", "./home.css?v=41", "./art/night-terminal-v1.png", "./district-scene.js?v=41", "./campaign-layouts-v4.js?v=41", "./audio/lantern-lane.mp3", "./garage.js?v=41", "./music.js?v=41", "./campaign.js?v=41", "./campaign-layouts.js?v=41", "./demand.js?v=41", "./lobby.css?v=41", "./lobby-scene.js?v=41", "./progress.js?v=41", "./session.js?v=41", "./index.html", "./style.css?v=41", "./game.js?v=41", "./app.js?v=41", "./traffic.js?v=41", "./scene.js?v=41", "./market.js?v=41", "./market-scene.js?v=41", "./appearance.js?v=41", "./geometry.js?v=41", "./layout.js?v=41", "./platform.js?v=41", "./manifest.webmanifest?v=41"];
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
