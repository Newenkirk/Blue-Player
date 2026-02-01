// sw.js
const CACHE = "blueplayer-G24";

const ASSETS = [
  "./",
  "./index.html?v=G24",
  "./style.css?v=G24",
  "./slow.js?v=G24",
  "./app.js?v=G24",
  "./manifest.json",
  "./BluePlayer192.png",
  "./BluePlayer512.png",
  "./BluePlayer.png",
  "./Click.wav",
  "./Select.wav"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match("./index.html?v=G24"))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match("./index.html?v=G24"));
    })
  );
});
