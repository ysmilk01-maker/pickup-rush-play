const CACHE = "pickup-rush-v18";
const ASSETS = ["./index.html", "./style.css?v=18", "./game.js?v=18", "./app.js?v=18", "./traffic.js?v=18", "./scene.js?v=18", "./market.js?v=18", "./market-scene.js?v=18", "./appearance.js?v=18", "./geometry.js?v=18", "./layout.js?v=18", "./platform.js?v=18", "./manifest.webmanifest?v=18"];
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
