const CACHE = "pickup-rush-v3";
const ASSETS = ["./", "./index.html", "./style.css?v=3", "./game.js?v=3", "./app.js?v=3", "./platform.js?v=3", "./manifest.webmanifest?v=3"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
