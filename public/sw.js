// Peak System service worker: makes the app open offline.
// - App shell (index.html) and all artwork are precached on install.
// - Navigations: network first, cached copy when offline.
// - Hashed build assets, icons, bundled artwork and fonts: cache first.
const CACHE = "peak-system-v3";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./art/001B-ascent-mountain-range.webp",
  "./art/003-phase1-foundation-banner.webp",
  "./art/006A-phase2-walls-banner.webp",
  "./art/006B-phase3-city-banner.webp",
  "./art/006C-phase4-zenith-banner.webp",
  "./art/012A-badge-fire.webp",
  "./art/012B-badge-flex.webp",
  "./art/012C-badge-diamond.webp",
  "./art/012D-badge-trophy.webp",
  "./art/012E-badge-crown.webp",
  "./art/016A-habit-slot1-crown-blue.webp",
  "./art/016B-habit-slot2-sunrise-flex.webp",
  "./art/016C-habit-slot3-book.webp",
  "./art/016D-habit-slot4-bolt.webp",
  "./art/017-icon-camera.webp",
  "./art/020-icon-airplane.webp",
  "./art/020-icon-stopwatch.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  const sameOrigin = url.origin === self.location.origin;
  const cacheable =
    sameOrigin ||
    url.hostname.endsWith("fonts.googleapis.com") ||
    url.hostname.endsWith("fonts.gstatic.com");
  if (!cacheable) return;

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok || res.type === "opaque") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});
