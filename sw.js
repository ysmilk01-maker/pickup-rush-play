const CACHE = "pickup-rush-v4";
const ASSETS = ["./", "./index.html", "./style.css?v=4", "./game.js?v=4", "./app.js?v=4", "./platform.js?v=4", "./manifest.webmanifest?v=4"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
