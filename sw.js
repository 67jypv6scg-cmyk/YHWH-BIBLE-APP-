// Offline helper for The Scriptures, Names Restored.
// Change VERSION whenever you upload a new index.html so devices pick it up.
var VERSION = 'v5';
var CORE = ['./', 'index.html', 'manifest.json', 'lora.ttf', 'lora-italic.ttf', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open('app-' + VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('app-') === 0 && k !== 'app-' + VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // Hebrew font from Google: keep a copy the first time it loads
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open('fonts').then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (r) { c.put(req, r.clone()); return r; });
      });
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // The app itself: use the saved copy at once, refresh it quietly when online
  e.respondWith(caches.open('app-' + VERSION).then(function (c) {
    var key = req.mode === 'navigate' ? 'index.html' : req;
    return c.match(key).then(function (hit) {
      var net = fetch(req).then(function (r) { if (r && r.ok) c.put(key, r.clone()); return r; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
