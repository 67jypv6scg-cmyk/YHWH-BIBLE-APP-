// Offline helper for Noble Vine Study & Discipleship.
// When you upload a new version, change VERSION here and in index.html (the ?v= numbers).
var VERSION = '2.2.0';
var FILES = ['errors.js', 'books.js', 'storage.js', 'import.js', 'reading.js', 'names.js', 'search.js', 'sheets.js', 'notes.js', 'plans.js', 'hebrew.js', 'compare.js', 'alphabet.js', 'voice.js', 'home.js', 'teach.js', 'commentary.js', 'memory.js', 'votd.js', 'tracker.js',
  'bible-import.js', 'tidy.js', 'versions.js', 'menu.js', 'prophecy.js', 'logo.js', 'brand.js', 'oneoff.js', 'backup.js', 'favs.js', 'themes.js', 'music.js', 'update.js', 'back.js', 'panel.js', 'a11y.js', 'tools.js', 'start.js', 'app.css'];
var CORE = ['./', 'index.html', 'manifest.json', 'lora.ttf', 'lora-italic.ttf', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'spotify-dock.js?v=' + VERSION]
  .concat(FILES.map(function (f) { return f + '?v=' + VERSION; }));
self.addEventListener('install', function (e) {
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
  if (url.search.indexOf('nvcheck=') >= 0) return;   // "Check for updates" always asks GitHub directly
  var page = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname);
  if (page) {
    // The app page: newest version first, the saved copy when offline
    e.respondWith(caches.open('app-' + VERSION).then(function (c) {
      var net = fetch(new Request(req.url, { cache: 'no-cache' })).then(function (r) { if (r && r.ok) c.put('index.html', r.clone()); return r; });
      var timeout = new Promise(function (res) { setTimeout(res, 4000); });
      return Promise.race([net, timeout.then(function () { return c.match('index.html'); })]).then(function (r) { return r || c.match('index.html') || net; })
        .catch(function () { return c.match('index.html'); });
    }));
    return;
  }
  // App files carry their version in the address (?v=2.0.0), so a saved copy always matches the page
  e.respondWith(caches.open('app-' + VERSION).then(function (c) {
    return c.match(req).then(function (hit) {
      return hit || fetch(req).then(function (r) { if (r && r.ok) c.put(req, r.clone()); return r; });
    });
  }));
});
