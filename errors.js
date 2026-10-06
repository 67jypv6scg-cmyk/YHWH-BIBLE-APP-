// Noble Vine Study & Discipleship · 2.1.2 · Problem log
'use strict';
// ======================================================================
// Problem log: keeps the last few errors on this device, so you can send them to Claude
// ======================================================================
var APP_VERSION = '2.1.2 beta';
function nvLogError(msg, where) {
  try {
    var list = JSON.parse(localStorage.getItem('nv-errors') || '[]');
    list.push({ t: Date.now(), m: String(msg || 'Unknown error').slice(0, 400), w: String(where || '').slice(0, 200), v: APP_VERSION });
    localStorage.setItem('nv-errors', JSON.stringify(list.slice(-30)));
  } catch (e) {}
}
window.addEventListener('error', function (e) {
  if (!e || !e.message) return;   // failed downloads of pictures or fonts are not app errors
  nvLogError(e.message, (e.filename || '').split('/').pop().split('?')[0] + ':' + (e.lineno || 0));
});
window.addEventListener('unhandledrejection', function (e) {
  var r = e && e.reason;
  nvLogError(r && (r.message || r.code) || r, 'promise');
});
function openErrorLog() {
  openSheet('Report a problem');
  var list = [];
  try { list = JSON.parse(localStorage.getItem('nv-errors') || '[]'); } catch (e) {}
  var text = 'Noble Vine ' + APP_VERSION + ' · ' + navigator.userAgent + '\n' + list.map(function (x) {
    return new Date(x.t).toISOString().replace('T', ' ').slice(0, 16) + '  ' + x.m + (x.w ? '  [' + x.w + ']' : '');
  }).join('\n');
  sheetBody.innerHTML = '<p class="hint" style="margin-top:0">If something isn’t working, describe what you were doing and send it to Brad or Claude together with the details below.</p>' +
    (list.length ? '<p class="status">' + list.length + (list.length === 1 ? ' problem' : ' problems') + ' recorded on this device.</p><pre class="errlog">' + esc(text) + '</pre>' : '<p class="hint">No problems have been recorded. All is well.</p>') +
    '<div class="actions">' + (list.length ? '<button class="primary" id="elCopy">Copy the details</button><button class="quiet" id="elClear">Clear</button>' : '') + '</div>';
  var c = document.getElementById('elCopy'); if (c) c.onclick = function () { copyText(text); };
  var x = document.getElementById('elClear'); if (x) x.onclick = function () { try { localStorage.removeItem('nv-errors'); } catch (e) {} openErrorLog(); };
}
// ---- Start-up watchdog (2.1): a clear message if the app stalls or part of it fails to download ----
var nvReady = false, nvLoadFail = false;
function nvAppReady() { nvReady = true; var n = document.getElementById('nvStartNote'); if (n && !nvLoadFail) n.remove(); }
function nvStartupNote(msg, force) {
  if (nvReady && !force) return;
  var n = document.getElementById('nvStartNote');
  if (!n) { n = document.createElement('div'); n.id = 'nvStartNote'; n.className = 'nvstart'; n.setAttribute('role', 'alert'); document.body.appendChild(n); }
  n.innerHTML = '<p>' + msg + '</p><div class="nvstart-a"><button type="button" id="nvStartRefresh">Refresh</button><button type="button" id="nvStartReport">Report a problem</button></div>';
  document.getElementById('nvStartRefresh').onclick = function () { location.reload(); };
  document.getElementById('nvStartReport').onclick = function () { try { var sp = document.getElementById('nvSplash'); if (sp) sp.remove(); openErrorLog(); } catch (e) { alert(JSON.stringify(JSON.parse(localStorage.getItem('nv-errors') || '[]').slice(-5))); } };
}
// A script or stylesheet that fails to download is not reported as a normal error, so watch for it here
window.addEventListener('error', function (e) {
  var t = e && e.target;
  if (!t || (t.tagName !== 'SCRIPT' && t.tagName !== 'LINK')) return;
  var src = String(t.src || t.href || '');
  if (src.indexOf(location.origin) !== 0) return;   // outside files such as Google Fonts: the app works without them
  var file = String(t.src || t.href || '').split('/').pop().split('?')[0];
  nvLogError('Could not load ' + file, 'download');
  nvLoadFail = true;
  nvStartupNote('Part of the app (' + file + ') didn’t download, so some things may not work. Check your connection and tap Refresh.', true);
}, true);
window.addEventListener('error', function (e) { if (e && e.message && !nvReady) nvStartupNote('Something went wrong while opening the app. Tap Refresh to try again.'); });
setTimeout(function () { if (!nvReady) nvStartupNote('The app is taking longer than usual to open. You can wait a moment, or tap Refresh.'); }, 8000);
