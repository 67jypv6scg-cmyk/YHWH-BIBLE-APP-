// Offline helper for The Scriptures, Names Restored.
// Change VERSION whenever you upload a new index.html.
var VERSION = 'v20';
var CORE = ['./', 'index.html', 'manifest.json', 'lora.ttf', 'lora-italic.ttf', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  // cache: 'reload' skips the browser's own short-term cache, so a new upload is always picked up
  e.waitUntil(caches.open('app-' + VERSION).then(function (c) {
    return Promise.all(CORE.map(function (u) { return fetch(new Request(u, { cache: 'reload' })).then(function (r) { if (r.ok) return c.put(u, r); }).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
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
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open('fonts').then(function (c) {
      return c.match(req).then(function (hit) { return hit || fetch(req).then(function (r) { c.put(req, r.clone()); return r; }); });
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  var page = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname);
  if (page) {
    // The app page: always try the newest version first, fall back to the saved copy when offline
    e.respondWith(caches.open('app-' + VERSION).then(function (c) {
      var net = fetch(new Request(req.url, { cache: 'no-cache' })).then(function (r) { if (r && r.ok) c.put('index.html', r.clone()); return r; });
      var timeout = new Promise(function (res) { setTimeout(res, 4000); });
      return Promise.race([net, timeout.then(function () { return c.match('index.html'); })]).then(function (r) { return r || c.match('index.html') || net; })
        .catch(function () { return c.match('index.html'); });
    }));
    return;
  }
  e.respondWith(caches.open('app-' + VERSION).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (r) { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
