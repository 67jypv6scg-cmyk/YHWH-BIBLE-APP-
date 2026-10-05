// Noble Vine Study & Discipleship · 2.0.0 · Update banner
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
