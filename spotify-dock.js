/* Music dock for "The Scriptures, Names Restored"
   Controls Spotify from inside the app. Add to index.html, just above </body>:
   <script src="spotify-dock.js"></script> */
(function () {
'use strict';
var CLIENT_ID = '59fc07791a5c4d3c80acd62d237d560e';
var REDIRECT = location.origin + location.pathname;
var SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative';
var API = 'https://api.spotify.com/v1';

// ---------- small helpers ----------
function sget(k) { try { return localStorage.getItem('sd_' + k); } catch (e) { return null; } }
function sset(k, v) { try { localStorage.setItem('sd_' + k, v); } catch (e) {} }
function sdel(k) { try { localStorage.removeItem('sd_' + k); } catch (e) {} }
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function standalone() { return !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches)); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function fail(code) { var e = new Error(code); e.code = code; return e; }

var IC = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 5.5v13"/><path d="M18 5.5 9 12l9 6.5z" fill="currentColor"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 5.5v13"/><path d="M6 5.5 15 12l-9 6.5z" fill="currentColor"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9.5 6 6 6-6"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5.5l10-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>'
};

// ---------- styles: the same glass as the tab bar ----------
var css = [
'#sd{--g-bg:rgba(20,24,20,.82);--g-fg:#fff;--g-soft:rgba(255,255,255,.64);--g-line:rgba(255,255,255,.13);--g-acc:#A9C596;--g-acc-ink:#0B0D0B;--g-hi:rgba(255,255,255,.08);',
'  position:fixed;z-index:29;right:.7rem;bottom:calc(env(safe-area-inset-bottom,0px) + 4.85rem);transition:bottom .25s ease;font-family:var(--serif,Georgia,serif);color:var(--g-fg)}',
'html[data-theme="light"] body:not(.home) #sd{--g-bg:rgba(255,255,255,.8);--g-fg:#1F2A22;--g-soft:#5B665D;--g-line:rgba(0,0,0,.09);--g-acc:#3F5634;--g-acc-ink:#fff;--g-hi:rgba(0,0,0,.05)}',
'#sd.low{bottom:calc(env(safe-area-inset-bottom,0px) + .7rem)}',
'#sd.wide{left:.7rem;max-width:30rem;margin:0 auto}',
'@media (prefers-reduced-motion:reduce){#sd{transition:none}}',
'#sd button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}',
'#sd button:focus-visible,#sd input:focus-visible{outline:2px solid var(--g-acc);outline-offset:2px}',
'#sd .glass{background:var(--g-bg);border:1px solid var(--g-line);-webkit-backdrop-filter:blur(20px) saturate(1.5);backdrop-filter:blur(20px) saturate(1.5);box-shadow:0 8px 30px rgba(0,0,0,.35)}',
'#sd .sd-mini{width:2.9rem;height:2.9rem;border-radius:50%;display:grid;place-items:center;padding:0}',
'#sd .sd-mini svg{width:1.3rem;height:1.3rem}',
'#sd .sd-mini.on{color:var(--g-acc)}',
'#sd .sd-box{border-radius:1.4rem;overflow:hidden}',
'#sd .sd-bar{display:flex;align-items:center;gap:.35rem;padding:.42rem .45rem}',
'#sd .sd-art{flex:none;width:2.6rem;height:2.6rem;border-radius:.55rem;overflow:hidden;background:var(--g-hi);display:grid;place-items:center;color:var(--g-soft)}',
'#sd .sd-art svg{width:1.2rem;height:1.2rem}',
'#sd .sd-art img{width:100%;height:100%;object-fit:cover;display:block}',
'#sd .sd-meta{flex:1;min-width:0;background:none;border:0;text-align:left;padding:.15rem .3rem}',
'#sd .sd-t,#sd .sd-a{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'#sd .sd-t{font-size:.92rem;font-weight:600}',
'#sd .sd-a{font-size:.78rem;color:var(--g-soft)}',
'#sd .sd-b{flex:none;width:2.4rem;height:2.4rem;border-radius:50%;border:0;background:none;display:grid;place-items:center;padding:0}',
'#sd .sd-b svg{width:1.2rem;height:1.2rem}',
'#sd .sd-b:active{background:var(--g-hi)}',
'#sd .sd-play{background:var(--g-acc);color:var(--g-acc-ink)}',
'#sd .sd-play:active{background:var(--g-acc);opacity:.85}',
'#sd .sd-panel{border-top:1px solid var(--g-line);padding:.3rem 1rem 1rem;max-height:52vh;overflow-y:auto;overscroll-behavior:contain}',
'#sd .sd-box>.sd-panel:first-child{border-top:0;padding-top:1rem}',
'#sd .sd-h{font-size:1.05rem;font-weight:500;margin:0 0 .3rem}',
'#sd .sd-p{font-size:.86rem;color:var(--g-soft);margin:0 0 .8rem;line-height:1.5}',
'#sd .sd-grp{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--g-soft);margin:1rem 0 .4rem}',
'#sd input[type=range]{width:100%;accent-color:var(--g-acc)}',
'#sd .sd-row{display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--g-line);padding:.6rem .1rem;font-size:.95rem}',
'#sd .sd-row:last-child{border-bottom:0}',
'#sd .sd-row small{display:block;color:var(--g-soft);font-size:.76rem}',
'#sd .sd-paste{display:flex;gap:.45rem}',
'#sd .sd-paste input{flex:1;min-width:0;font:inherit;font-size:16px;color:var(--g-fg);background:var(--g-hi);border:1px solid var(--g-line);border-radius:999px;padding:.45rem .9rem}',
'#sd .sd-btn{background:var(--g-acc);color:var(--g-acc-ink);border:0;border-radius:999px;padding:.5rem 1.1rem;font-weight:500;white-space:nowrap}',
'#sd .sd-btn.q{background:none;color:var(--g-acc);border:1px solid var(--g-acc)}',
'#sd .sd-acts{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.8rem}',
'#sd .sd-link{background:none;border:0;color:var(--g-soft);padding:.3rem 0;font-size:.85rem;text-decoration:underline;text-underline-offset:.2em}',
'#sd .sd-msg{font-size:.85rem;color:var(--g-acc);margin:.6rem 0 0;min-height:1em}',
'body.sd-on main{padding-bottom:11rem}',
'body.sd-on .selbar{bottom:calc(9.2rem + env(safe-area-inset-bottom,0px)) !important}',
'body.sd-on .toast{bottom:calc(9.5rem + env(safe-area-inset-bottom,0px)) !important}',
'#home .hin{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 9.5rem)}'
].join('\n');
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var dock = document.createElement('div');
dock.id = 'sd'; dock.setAttribute('aria-label', 'Music');
document.body.appendChild(dock);

// Follow the tab bar when it slides away while reading
var tabs = $('tabs');
function syncLow() { dock.classList.toggle('low', !!tabs && tabs.classList.contains('away')); }
if (tabs && window.MutationObserver) new MutationObserver(syncLow).observe(tabs, { attributes: true, attributeFilter: ['class'] });

// ---------- sign-in (PKCE: no server or secret needed) ----------
function b64(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
async function login() {
  var verifier = b64(crypto.getRandomValues(new Uint8Array(48)));
  sset('verifier', verifier);
  var challenge = b64(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  location.href = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
    client_id: CLIENT_ID, response_type: 'code', redirect_uri: REDIRECT,
    code_challenge_method: 'S256', code_challenge: challenge, scope: SCOPES, state: verifier
  });
}
async function tokenRequest(params) {
  var p = { client_id: CLIENT_ID }; Object.keys(params).forEach(function (k) { p[k] = params[k]; });
  var r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(p)
  });
  var j = {}; try { j = await r.json(); } catch (e) {}
  if (!j.access_token) { var e = fail(j.error === 'invalid_grant' ? 'GRANT' : 'SIGNIN'); e.detail = j.error_description || j.error || ('status ' + r.status); throw e; }
  sset('token', j.access_token);
  sset('expires', String(Date.now() + (j.expires_in || 3600) * 1000 - 60000));
  if (j.refresh_token) sset('refresh', j.refresh_token);
}
function connected() { return !!(sget('refresh') || sget('token')); }
var refreshing = null;
async function token() {
  if (sget('token') && Date.now() < +(sget('expires') || 0)) return sget('token');
  if (!sget('refresh')) return null;
  if (!refreshing) refreshing = tokenRequest({ grant_type: 'refresh_token', refresh_token: sget('refresh') })
    .catch(function (e) { if (e.code === 'GRANT') disconnect(true); throw e; })
    .finally(function () { refreshing = null; });
  await refreshing;
  return sget('token');
}
function disconnect(silent) {
  ['token', 'expires', 'refresh'].forEach(sdel);
  state = null; lists = null;
  if (!silent) { view = 'mini'; sset('view', view); }
  else msg = 'Spotify needs connecting again.';
  render();
}

async function api(path, method, body, again) {
  var t = await token();
  if (!t) throw fail('AUTH');
  var r = await fetch(API + path, {
    method: method || 'GET',
    headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (r.status === 401 && !again) { sset('expires', '0'); return api(path, method, body, true); }
  if (r.status === 204 || r.status === 202) return {};
  if (r.status === 404 && path.indexOf('/me/player') === 0) throw fail('NO_DEVICE');
  if (r.status === 403) throw fail('FORBIDDEN');
  if (r.status === 429) throw fail('BUSY');
  if (!r.ok) throw fail('HTTP');
  var txt = await r.text();
  try { return txt ? JSON.parse(txt) : {}; } catch (e) { return {}; }
}
function errText(e) {
  var c = e && e.code;
  if (c === 'NO_DEVICE') return 'Open Spotify on your phone once, then try again.';
  if (c === 'FORBIDDEN') return 'Spotify didn’t allow that from this app.';
  if (c === 'AUTH' || c === 'GRANT') return 'Connect Spotify again.';
  if (c === 'BUSY') return 'Spotify asked for a pause. Try again in a moment.';
  return 'That didn’t work. Check your connection.';
}

// ---------- player ----------
var state = null, msg = '', lists = null, view = (sget('view') || 'mini').replace('-chosen', ''), dragging = false;
function playing() { return !!(state && state.is_playing); }
async function refresh() {
  if (!connected()) return;
  try { state = await api('/me/player'); }
  catch (e) { if (e.code === 'AUTH' || e.code === 'GRANT') return; }
  if (view === 'mini' && playing() && sget('view') !== 'mini-chosen') { view = 'bar'; render(); return; }
  paint();
}
async function deviceId() {
  var d = await api('/me/player/devices');
  var list = (d && d.devices) || [];
  var dev = list.filter(function (x) { return x.is_active; })[0] || list.filter(function (x) { return !x.is_restricted; })[0];
  if (!dev) throw fail('NO_DEVICE');
  return dev.id;
}
async function act(fn) {
  try { await fn(''); }
  catch (e) {
    if (e.code === 'NO_DEVICE') {
      try { var id = await deviceId(); await fn('?device_id=' + encodeURIComponent(id)); }
      catch (e2) { flash(errText(e2)); }
    } else flash(errText(e));
  }
  setTimeout(refresh, 600);
}
function toggle() {
  var was = playing(); if (state) state.is_playing = !was; paint();
  act(function (q) { return api('/me/player/' + (was ? 'pause' : 'play') + q, 'PUT'); });
}
function next() { act(function (q) { return api('/me/player/next' + q, 'POST'); }); }
function prev() { act(function (q) { return api('/me/player/previous' + q, 'POST'); }); }
function setVolume(v) { act(function (q) { return api('/me/player/volume?volume_percent=' + v + (q ? '&' + q.slice(1) : ''), 'PUT'); }); }
function playContext(uri) { act(function (q) { return api('/me/player/play' + q, 'PUT', { context_uri: uri }); }); }

function savedLinks() { try { return JSON.parse(sget('links') || '[]'); } catch (e) { return []; } }
async function pasted(link) {
  var m = String(link || '').match(/(playlist|album)[\/:]([A-Za-z0-9]{10,})/);
  if (!m) { flash('That isn’t a Spotify playlist or album link.'); return; }
  var uri = 'spotify:' + m[1] + ':' + m[2], name = m[1] === 'album' ? 'Album' : 'Playlist';
  try { var info = await api('/' + m[1] + 's/' + m[2] + (m[1] === 'playlist' ? '?fields=name' : '')); if (info && info.name) name = info.name; } catch (e) {}
  var ls = savedLinks().filter(function (x) { return x.uri !== uri; });
  ls.unshift({ uri: uri, name: name }); sset('links', JSON.stringify(ls.slice(0, 8)));
  playContext(uri); render();
}
async function loadLists() {
  var box = $('sdLists'); if (!box) return;
  if (!lists) {
    box.innerHTML = '<p class="sd-p" style="margin:.2rem 0">Loading your playlists…</p>';
    try { var j = await api('/me/playlists?limit=50'); lists = (j.items || []).filter(Boolean).map(function (p) { return { uri: p.uri, name: p.name, n: p.tracks && p.tracks.total }; }); }
    catch (e) { lists = { err: e.code }; }
  }
  box = $('sdLists'); if (!box) return;
  if (lists.err) { box.innerHTML = '<p class="sd-p" style="margin:.2rem 0">Spotify doesn’t let this app list your playlists. Paste a playlist link below instead; it stays here for next time.</p>'; return; }
  if (!lists.length) { box.innerHTML = '<p class="sd-p" style="margin:.2rem 0">No playlists found. Paste a playlist link below.</p>'; return; }
  box.innerHTML = lists.map(function (p, i) { return '<button class="sd-row" data-pl="' + i + '">' + esc(p.name) + (p.n ? '<small>' + p.n + ' songs</small>' : '') + '</button>'; }).join('');
  box.querySelectorAll('[data-pl]').forEach(function (b) { b.onclick = function () { playContext(lists[+b.dataset.pl].uri); }; });
}

// ---------- drawing ----------
var flashT = null;
function flash(t) {
  msg = t;
  var a = $('sdA'), m = $('sdMsg');
  if (m) m.textContent = t;
  if (a) { a.textContent = t; clearTimeout(flashT); flashT = setTimeout(function () { msg = ''; paint(); }, 3500); }
}
function setView(v, chosen) {
  view = v; sset('view', chosen && v === 'mini' ? 'mini-chosen' : v); render();
}
function barHtml() {
  return '<div class="sd-bar">' +
    '<span class="sd-art" id="sdArt">' + IC.note + '</span>' +
    '<button class="sd-meta" id="sdMeta" aria-label="Music options"><span class="sd-t" id="sdT"></span><span class="sd-a" id="sdA"></span></button>' +
    '<button class="sd-b" id="sdPrev" aria-label="Previous">' + IC.prev + '</button>' +
    '<button class="sd-b sd-play" id="sdPlay" aria-label="Play">' + IC.play + '</button>' +
    '<button class="sd-b" id="sdNext" aria-label="Next">' + IC.next + '</button>' +
    '<button class="sd-b" id="sdMin" aria-label="Hide music controls">' + IC.down + '</button></div>';
}
function render() {
  var on = connected();
  if (view === 'bar' && !on) view = 'mini';
  document.body.classList.toggle('sd-on', view !== 'mini');
  dock.classList.toggle('wide', view !== 'mini');
  syncLow();
  if (view === 'mini') {
    dock.innerHTML = '<button class="sd-mini glass' + (playing() ? ' on' : '') + '" id="sdOpen" aria-label="Music">' + IC.note + '</button>';
    $('sdOpen').onclick = function () { setView(on ? 'bar' : 'panel'); };
    return;
  }
  if (!on) {
    dock.innerHTML = '<div class="sd-box glass"><div class="sd-panel">' +
      '<p class="sd-h">Music while you read</p>' +
      '<p class="sd-p">Connect your Spotify account to play, pause and choose songs here, without leaving the app. The music plays through Spotify on your phone.</p>' +
      '<div class="sd-acts"><button class="sd-btn" id="sdConnect">Connect Spotify</button><button class="sd-btn q" id="sdClose">Not now</button></div>' +
      (standalone() ? '<div class="sd-grp">Connected in Safari instead?</div><p class="sd-p">If connecting opened Safari, finish there, open the music panel in Safari and tap Copy connection code. Then paste it here.</p>' +
        '<div class="sd-paste"><input id="sdCode" placeholder="Connection code" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="sd-btn" id="sdUseCode">Use code</button></div>' : '') +
      '<p class="sd-msg" id="sdMsg">' + esc(msg) + '</p></div></div>';
    $('sdConnect').onclick = login;
    $('sdClose').onclick = function () { msg = ''; setView('mini', true); };
    var uc = $('sdUseCode');
    if (uc) uc.onclick = async function () {
      var c = ($('sdCode').value || '').trim(); if (!c) return;
      uc.disabled = true;
      try { await tokenRequest({ grant_type: 'refresh_token', refresh_token: c }); msg = ''; setView('bar'); refresh(); }
      catch (e) { uc.disabled = false; flash('That code didn’t work. Copy a fresh one and try again.'); }
    };
    return;
  }
  var h = '<div class="sd-box glass">' + barHtml();
  if (view === 'panel') {
    var links = savedLinks();
    h += '<div class="sd-panel">' +
      '<div class="sd-grp">Volume</div><input type="range" id="sdVol" min="0" max="100" value="50" aria-label="Volume"><p class="sd-p" id="sdVolNote" style="margin:.2rem 0 0" hidden>Spotify on iPhone sets its own volume. Use your phone’s volume buttons.</p>' +
      '<div class="sd-grp">Your playlists</div><div id="sdLists"></div>' +
      (links.length ? '<div class="sd-grp">Saved links</div>' + links.map(function (l, i) { return '<button class="sd-row" data-lk="' + i + '">' + esc(l.name) + '</button>'; }).join('') : '') +
      '<div class="sd-grp">Play a playlist or album link</div><div class="sd-paste"><input id="sdLink" placeholder="Paste a Spotify link" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="sd-btn" id="sdGo">Play</button></div>' +
      '<p class="sd-msg" id="sdMsg">' + esc(msg) + '</p>' +
      '<div class="sd-acts">' + (!standalone() ? '<button class="sd-link" id="sdCopy">Copy connection code for the home-screen app</button>' : '') + '<button class="sd-link" id="sdOff">Disconnect Spotify</button></div>' +
      '</div>';
  }
  h += '</div>';
  dock.innerHTML = h;
  $('sdMeta').onclick = function () { setView(view === 'panel' ? 'bar' : 'panel'); };
  $('sdPlay').onclick = toggle; $('sdNext').onclick = next; $('sdPrev').onclick = prev;
  $('sdMin').onclick = function () { setView('mini', true); };
  if (view === 'panel') {
    var vol = $('sdVol');
    vol.addEventListener('pointerdown', function () { dragging = true; });
    vol.addEventListener('change', function () { dragging = false; setVolume(vol.value); });
    dock.querySelectorAll('[data-lk]').forEach(function (b) { b.onclick = function () { playContext(savedLinks()[+b.dataset.lk].uri); }; });
    var inp = $('sdLink');
    $('sdGo').onclick = function () { pasted(inp.value.trim()); };
    inp.onkeydown = function (e) { if (e.key === 'Enter') pasted(inp.value.trim()); };
    $('sdOff').onclick = function () {
      var b = $('sdOff');
      if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Tap again to disconnect'; return; }
      disconnect();
    };
    var cp = $('sdCopy');
    if (cp) cp.onclick = function () {
      var code = sget('refresh'); if (!code) return;
      var done = function () { flash('Copied. Open the home-screen app, tap ♪, and paste it under “Connected in Safari instead?”.'); };
      try { navigator.clipboard.writeText(code).then(done, function () { window.prompt('Copy this code:', code); }); }
      catch (e) { window.prompt('Copy this code:', code); }
    };
    loadLists();
  }
  paint();
}
function paint() {
  var t = $('sdT');
  if (!t) { var mb = $('sdOpen'); if (mb) mb.classList.toggle('on', playing()); return; }
  var it = state && state.item;
  t.textContent = it ? it.name : 'Nothing playing';
  var sub = it ? (it.artists ? it.artists.map(function (a) { return a.name; }).join(', ') : (it.show && it.show.name) || '') : 'Tap here to choose music';
  $('sdA').textContent = msg || sub;
  var imgs = it && ((it.album && it.album.images) || it.images) || [], src = imgs.length ? imgs[imgs.length - 1].url : '';
  var art = $('sdArt');
  if (art.dataset.src !== src) { art.dataset.src = src; art.innerHTML = src ? '<img src="' + esc(src) + '" alt="">' : IC.note; }
  var pb = $('sdPlay');
  pb.innerHTML = playing() ? IC.pause : IC.play;
  pb.setAttribute('aria-label', playing() ? 'Pause' : 'Play');
  var vol = $('sdVol'), dev = state && state.device;
  if (vol && dev) {
    if (!dragging && dev.volume_percent != null) vol.value = dev.volume_percent;
    var fixed = dev.supports_volume === false;
    vol.disabled = fixed; $('sdVolNote').hidden = !fixed;
  }
}

// ---------- start ----------
(async function () {
  var qs = new URLSearchParams(location.search), code = qs.get('code'), err = qs.get('error');
  if (code || err) {
    try { history.replaceState(null, '', REDIRECT + location.hash); } catch (e) {}
    if (code) {
      try {
        await tokenRequest({ grant_type: 'authorization_code', code: code, redirect_uri: REDIRECT, code_verifier: sget('verifier') || qs.get('state') || '' });
        sdel('verifier'); view = 'panel'; sset('view', 'bar'); msg = 'Spotify connected. Choose something to play.';
      } catch (e) { view = 'panel'; msg = 'Connecting didn’t finish (' + (e.detail || e.message) + '). Tap Connect Spotify to try again.'; }
    } else { view = 'panel'; msg = err === 'access_denied' ? 'Connection cancelled.' : 'Spotify said: ' + err; }
  }
  render();
  if (connected()) refresh();
  setInterval(function () { if (connected() && !document.hidden) refresh(); }, 6000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
})();
})();
