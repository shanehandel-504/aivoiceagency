/* ===== AVA HQ — service worker (scope /hq/ only) =====================
   Network-first so the live board.json ledger is always fresh; falls back
   to cache when offline. Shell is pre-cached for first offline load.
   Scoped to /hq/ — never intercepts the marketing site. ================ */
var CACHE = "ava-hq-v1";
var SHELL = [
  "/hq/", "/hq/index.html", "/hq/manifest.webmanifest", "/hq/board.json",
  "/work/kit.css", "/brand/favicon.svg", "/brand/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () {})
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200 && res.type === "basic") {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () { return caches.match(req); })
  );
});
