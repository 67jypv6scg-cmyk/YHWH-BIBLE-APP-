// Noble Vine Study & Discipleship · 2.1.1 · Update banner
'use strict';
// ======================================================================
// Updates: the offline helper (sw.js) keeps a copy of the app; when a new version
// has been uploaded, a small banner offers to refresh.
// ======================================================================
function nvRegisterUpdates() {
  if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;
  var hadController = !!navigator.serviceWorker.controller, shown = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController || shown) return; shown = true;
    var b = document.createElement('div'); b.className = 'nvupd'; b.setAttribute('role', 'status');
    b.innerHTML = '<span>A new version of Noble Vine is ready.</span><button type="button" id="nvUpd">Refresh</button>';
    document.body.appendChild(b);
    document.getElementById('nvUpd').onclick = function () { location.reload(); };
  });
  try { navigator.serviceWorker.register('sw.js').then(function (reg) { if (reg && reg.update) setInterval(function () { reg.update(); }, 30 * 60 * 1000); }); } catch (e) {}
}
// ---- Check for updates (2.1.1): fetch the newest version straight away ----
async function nvCheckForUpdates() {
  var btn = document.getElementById('mUpd'); if (btn) { btn.disabled = true; btn.textContent = 'Checking…'; }
  var latest = null;
  try {
    var r = await fetch('menu.js?nvcheck=' + Date.now(), { cache: 'no-store' });
    if (r.ok) { var m = (await r.text()).match(/var APP_VER = '([^']*)'/); if (m) latest = m[1]; }
  } catch (e) {}
  if (!latest) { toast('Couldn’t check just now. Are you online?'); if (btn) { btn.disabled = false; btn.textContent = 'Check for updates'; } return; }
  if (latest === APP_VER) { toast('You have the latest version: ' + APP_VER.replace('Noble Vine · ', '')); if (btn) { btn.disabled = false; btn.textContent = 'Check for updates'; } return; }
  toast('Updating to ' + latest.replace('Noble Vine · ', '') + '…');
  try {
    if ('serviceWorker' in navigator) { var reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); }
    if (window.caches) { var keys = await caches.keys(); await Promise.all(keys.filter(function (k) { return k.indexOf('app-') === 0; }).map(function (k) { return caches.delete(k); })); }
  } catch (e) {}
  setTimeout(function () { location.reload(); }, 900);
}
