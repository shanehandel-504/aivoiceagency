/* ===== AVA WORK DECK — service worker ============================
   Scope: /work/ ONLY. Never touches the frozen homepage or any
   route outside /work/. Network-first (fresh on every online load),
   cache fallback for offline. Bump CACHE on shared-asset changes. == */
var CACHE = "workdeck-v1";
var CORE = [
  "/work/", "/work/kit.css", "/work/kit.js", "/work/manifest.webmanifest",
  "/work/todo/", "/work/prompts/", "/work/social/", "/work/elevenlabs/", "/work/links/"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) {
      return fetch(u).then(function (r) { if (r && r.ok) return c.put(u, r); }).catch(function () {});
    }));
  }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin || url.pathname.indexOf("/work/") !== 0) return;

  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy).catch(function () {}); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (m) { return m || caches.match("/work/"); });
    })
  );
});
