const CACHE = "pickup-rush-v42-open-ground";
const ASSETS = ["./station-scene.js?v=42", "./brand/ninetosix-logo.png", "./emergency.js?v=42", "./emergency.css?v=42", "./sfx.js?v=42", "./festival.css?v=42", "./boot.js?v=42", "./loading.css?v=42", "./home.css?v=42", "./art/night-terminal-v1.png", "./district-scene.js?v=42", "./campaign-layouts-v4.js?v=42", "./audio/lantern-lane.mp3", "./garage.js?v=42", "./music.js?v=42", "./campaign.js?v=42", "./campaign-layouts.js?v=42", "./demand.js?v=42", "./lobby.css?v=42", "./lobby-scene.js?v=42", "./progress.js?v=42", "./session.js?v=42", "./index.html", "./style.css?v=42", "./game.js?v=42", "./app.js?v=42", "./traffic.js?v=42", "./scene.js?v=42", "./market.js?v=42", "./market-scene.js?v=42", "./appearance.js?v=42", "./geometry.js?v=42", "./layout.js?v=42", "./platform.js?v=42", "./manifest.webmanifest?v=42"];
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
