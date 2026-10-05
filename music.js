// Noble Vine Study & Discipleship · 2.0.0 · My music player
'use strict';
// ======================================================================
// My music: songs you have saved in Files or iCloud Drive, playing while you read.
// Settings → Music player chooses My music, Spotify (the earlier dock) or Off.
// ======================================================================
var mus = { db: null, list: [], idx: -1, audio: null, url: null, loaded: false };
function musMode() { return S.musicMode || 'mine'; }
function musOpen() {
  if (mus.db) return Promise.resolve(mus.db);
  return dbTimeout(new Promise(function (res) {
    try { var r = indexedDB.open('nrb-music', 1); r.onupgradeneeded = function () { r.result.createObjectStore('tracks', { keyPath: 'id' }); }; r.onsuccess = function () { mus.db = r.result; res(mus.db); }; r.onerror = function () { res(null); }; }
    catch (e) { res(null); }
  }));
}
async function musLoad() {
  var db = await musOpen(); if (!db) { mus.list = []; return; }
  mus.list = await new Promise(function (res) { var out = []; try { var cur = db.transaction('tracks').objectStore('tracks').openCursor(); cur.onsuccess = function () { var c = cur.result; if (c) { out.push(c.value); c.continue(); } else res(out); }; cur.onerror = function () { res(out); }; } catch (e) { res(out); } });
  mus.list.sort(function (a, z) { return (a.order || 0) - (z.order || 0); });
  mus.loaded = true;
}
async function musPut(t) { var db = await musOpen(); if (!db) throw new Error('nostore'); return new Promise(function (res, rej) { var tx = db.transaction('tracks', 'readwrite'); tx.objectStore('tracks').put(t); tx.oncomplete = res; tx.onerror = tx.onabort = function () { rej(tx.error || new Error('space')); }; }); }
async function musDel(id) { var db = await musOpen(); if (!db) return; return new Promise(function (res) { var tx = db.transaction('tracks', 'readwrite'); tx.objectStore('tracks').delete(id); tx.oncomplete = res; tx.onerror = res; }); }
function musCur() { return mus.list[mus.idx] || null; }
function musFmt(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function musAudio() {
  if (mus.audio) return mus.audio;
  var a = mus.audio = new Audio(); a.preload = 'metadata';
  a.addEventListener('timeupdate', musTick);
  a.addEventListener('play', musPaint); a.addEventListener('pause', musPaint);
  a.addEventListener('ended', function () { if (S.musRepeat === 'one') { a.currentTime = 0; a.play(); } else musNext(true); });
  return a;
}
function musLoadTrack(i, play) {
  var t = mus.list[i]; if (!t) return;
  mus.idx = i; var a = musAudio();
  if (mus.url) URL.revokeObjectURL(mus.url);
  mus.url = URL.createObjectURL(t.blob); a.src = mus.url;
  if (play) { var p = a.play(); if (p && p.catch) p.catch(function () { musPaint(); }); }
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.name, artist: 'My music', album: 'Noble Vine' });
      navigator.mediaSession.setActionHandler('play', function () { musPlayPause(); });
      navigator.mediaSession.setActionHandler('pause', function () { musPlayPause(); });
      navigator.mediaSession.setActionHandler('nexttrack', function () { musNext(); });
      navigator.mediaSession.setActionHandler('previoustrack', function () { musPrev(); });
    } catch (e) {}
  }
  musPaint();
}
function musPlaying() { return mus.audio && !mus.audio.paused; }
function musPlayPause() {
  if (!mus.list.length) { openMusicList(); return; }
  if (mus.idx < 0) { musLoadTrack(S.musShuffle ? Math.floor(Math.random() * mus.list.length) : 0, true); return; }
  var a = musAudio(); if (a.paused) { var p = a.play(); if (p && p.catch) p.catch(function () {}); } else a.pause();
}
function musNext(auto) {
  if (!mus.list.length) return;
  var n;
  if (S.musShuffle && mus.list.length > 1) { do { n = Math.floor(Math.random() * mus.list.length); } while (n === mus.idx); }
  else n = mus.idx + 1;
  if (n >= mus.list.length) { if (auto && S.musRepeat !== 'all') { musPaint(); return; } n = 0; }
  musLoadTrack(n, true);
}
function musPrev() {
  if (!mus.list.length) return;
  var a = musAudio(); if (a.currentTime > 3) { a.currentTime = 0; return; }
  musLoadTrack(mus.idx > 0 ? mus.idx - 1 : mus.list.length - 1, true);
}
// The slim player bar above the tab bar
function musMini() {
  var el = document.getElementById('nvMini');
  var show = musMode() === 'mine' && mus.list.length > 0 && mus.idx >= 0;
  document.body.classList.toggle('nvm-on', !!show);
  if (!show) { if (el) el.hidden = true; return; }
  if (!el) {
    el = document.createElement('div'); el.id = 'nvMini'; el.className = 'nvmini';
    el.innerHTML = '<button type="button" class="nvm-main" id="nvmOpen" aria-label="Open the music player"><span class="nvm-art">' + nvSprig(20, 2.4) + '</span><span class="nvm-t"><span id="nvmTitle"></span><span id="nvmSub"></span></span></button>' +
      '<button type="button" class="nvm-btn on" id="nvmPlay" aria-label="Play"></button><button type="button" class="nvm-btn" id="nvmNext" aria-label="Next song">' + musIc('next') + '</button><span class="nvm-bar"><i id="nvmProg"></i></span>';
    document.body.appendChild(el);
    document.getElementById('nvmOpen').onclick = openPlayer;
    document.getElementById('nvmPlay').onclick = musPlayPause;
    document.getElementById('nvmNext').onclick = function () { musNext(); };
  }
  el.hidden = false;
  var t = musCur();
  document.getElementById('nvmTitle').textContent = t ? t.name : '';
  document.getElementById('nvmSub').textContent = 'My music · ' + (mus.idx + 1) + ' of ' + mus.list.length;
  var pb = document.getElementById('nvmPlay'); pb.innerHTML = musIc(musPlaying() ? 'pause' : 'play'); pb.setAttribute('aria-label', musPlaying() ? 'Pause' : 'Play');
}
function musIc(n) {
  var P = { play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>', pause: '<rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/>',
    next: '<path d="M6 5l9 7-9 7z"/><path d="M18 5v14"/>', prev: '<path d="M18 5l-9 7 9 7z"/><path d="M6 5v14"/>',
    shuffle: '<path d="M4 7h3c4 0 6 10 10 10h3"/><path d="M4 17h3c1.6 0 2.8-1.2 3.8-2.8"/><path d="M13.2 9.8C14.2 8.2 15.4 7 17 7h3"/><path d="M18 4l3 3-3 3"/><path d="M18 14l3 3-3 3"/>',
    repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h13"/><path d="M17 3l3 3-3 3"/><path d="M20 13v2a3 3 0 0 1-3 3H4"/><path d="M7 21l-3-3 3-3"/>',
    up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>' };
  return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>';
}
function musTick() {
  var a = mus.audio; if (!a) return;
  var pct = a.duration ? (a.currentTime / a.duration * 100) : 0;
  var mp = document.getElementById('nvmProg'); if (mp) mp.style.width = pct + '%';
  var r = document.getElementById('plSeek'); if (r && !r.dataset.drag) { r.value = Math.round(pct * 10); }
  var t1 = document.getElementById('plT1'), t2 = document.getElementById('plT2');
  if (t1) t1.textContent = musFmt(a.currentTime); if (t2) t2.textContent = '−' + musFmt((a.duration || 0) - a.currentTime);
}
function musPaint() { musMini(); var pp = document.getElementById('plPlay'); if (pp) { pp.innerHTML = musIc(musPlaying() ? 'pause' : 'play'); pp.setAttribute('aria-label', musPlaying() ? 'Pause' : 'Play'); } var tt = document.getElementById('plTitle'); if (tt) { var t = musCur(); tt.textContent = t ? t.name : 'Nothing playing'; } }
// Full player
async function openPlayer() {
  if (!mus.loaded) await musLoad();
  if (!mus.list.length) { openMusicList(); return; }
  openSheet('My music');
  if (mus.idx < 0) musLoadTrack(0, false);
  var t = musCur();
  sheetBody.innerHTML = '<div class="plart">' + nvSprig(120, 1.3) + '</div><div class="pl-t" id="plTitle">' + esc(t ? t.name : '') + '</div><div class="pl-s">' + esc(t && t.src ? t.src : 'Saved from Files') + '</div>' +
    '<input type="range" id="plSeek" class="plseek" min="0" max="1000" value="0" aria-label="Position in the song"><div class="pl-times"><span id="plT1">0:00</span><span id="plT2">0:00</span></div>' +
    '<div class="plctl"><button type="button" class="plsm' + (S.musShuffle ? ' on' : '') + '" id="plShuf" aria-label="Shuffle" aria-pressed="' + !!S.musShuffle + '">' + musIc('shuffle') + '</button>' +
    '<button type="button" class="plbtn" id="plPrev" aria-label="Previous song">' + musIc('prev') + '</button><button type="button" class="plbtn big" id="plPlay"></button>' +
    '<button type="button" class="plbtn" id="plNext" aria-label="Next song">' + musIc('next') + '</button>' +
    '<button type="button" class="plsm' + (S.musRepeat && S.musRepeat !== 'off' ? ' on' : '') + '" id="plRep" aria-label="Repeat: ' + (S.musRepeat || 'off') + '">' + musIc('repeat') + (S.musRepeat === 'one' ? '<b>1</b>' : '') + '</button></div>' +
    '<div class="actions" style="justify-content:center"><button class="quiet" id="plList">My music list</button><button class="quiet" id="plAdd">+ Add music</button></div>' +
    '<p class="status" style="text-align:center">The music keeps playing while you read. On iPhone it may pause if the screen locks.</p>';
  musPaint(); musTick();
  document.getElementById('plPlay').onclick = musPlayPause;
  document.getElementById('plPrev').onclick = musPrev;
  document.getElementById('plNext').onclick = function () { musNext(); };
  document.getElementById('plShuf').onclick = function () { S.musShuffle = !S.musShuffle; saveSettings(); openPlayer(); };
  document.getElementById('plRep').onclick = function () { S.musRepeat = S.musRepeat === 'all' ? 'one' : S.musRepeat === 'one' ? 'off' : 'all'; saveSettings(); openPlayer(); };
  document.getElementById('plList').onclick = openMusicList;
  document.getElementById('plAdd').onclick = function () { openMusicList(true); };
  var seek = document.getElementById('plSeek');
  seek.oninput = function () { seek.dataset.drag = '1'; };
  seek.onchange = function () { var a = musAudio(); if (a.duration) a.currentTime = seek.value / 1000 * a.duration; delete seek.dataset.drag; };
}
// The list of songs
async function openMusicList(pick) {
  openSheet('My music'); var tok = sheetSeq;
  if (!mus.loaded) await musLoad();
  if (tok !== sheetSeq) return;
  var editing = false;
  function render() {
    var total = mus.list.reduce(function (n, t) { return n + (t.dur || 0); }, 0);
    sheetBody.innerHTML = (musMode() !== 'mine' ? '<div class="card"><p style="margin:0">The music player is set to <b>' + (musMode() === 'spotify' ? 'Spotify' : 'Off') + '</b>. Choose <b>My music</b> in Settings to use your own songs.</p><div class="actions"><button class="primary" id="mlMode">Use My music</button></div></div>' : '') +
      '<p class="hint" style="margin-top:0">' + (mus.list.length ? mus.list.length + (mus.list.length === 1 ? ' song' : ' songs') + ' · ' + Math.round(total / 60) + ' minutes · kept on this device' : 'Add songs you have saved in Files or iCloud Drive, such as MP3s you have bought, worship albums or your own recordings. They stay on this device.') + '</p>' +
      '<div class="actions" style="margin-top:0"><button class="primary" id="mlAdd">Add from Files</button>' + (mus.list.length ? '<button class="quiet" id="mlPlay">' + (S.musShuffle ? 'Shuffle play' : 'Play all') + '</button><button class="quiet" id="mlEdit">' + (editing ? 'Done' : 'Edit') + '</button>' : '') + '</div>' +
      '<input type="file" id="mlFile" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.opus" multiple class="hidden"><p class="status" id="mlStat"></p>' +
      (mus.list.length ? '<div class="mgrp" style="margin-top:1rem">' + mus.list.map(function (t, i) {
        var now = i === mus.idx;
        return '<div class="mrow mlrow' + (now ? ' now' : '') + '"><button type="button" class="ml-main" data-mi="' + i + '"><span class="ml-num">' + (now && musPlaying() ? '♪' : i + 1) + '</span><span class="mrow-t"><span class="mrow-h">' + esc(t.name) + '</span><span class="mrow-s">' + esc(t.src || 'Saved from Files') + ' · ' + musFmt(t.dur) + '</span></span></button>' +
          (editing ? '<button type="button" class="ml-ed" data-mu="' + i + '" aria-label="Move ' + esc(t.name) + ' up">' + musIc('up') + '</button><button type="button" class="ml-ed" data-md="' + i + '" aria-label="Move ' + esc(t.name) + ' down">' + musIc('down') + '</button><button type="button" class="ml-ed del" data-mx="' + i + '" aria-label="Remove ' + esc(t.name) + '">✕</button>' : '') + '</div>';
      }).join('') + '</div>' : '') +
      '<p class="status" style="margin-top:1rem">Songs from Spotify, Apple Music or YouTube Music can’t be added: those apps lock their downloads. Songs you own as files work.</p>';
    var md = document.getElementById('mlMode'); if (md) md.onclick = function () { S.musicMode = 'mine'; saveSettings(); location.reload(); };
    var inp = document.getElementById('mlFile'), st = document.getElementById('mlStat');
    document.getElementById('mlAdd').onclick = function () { inp.value = ''; inp.click(); };
    inp.onchange = async function () {
      var files = Array.from(inp.files || []); if (!files.length) return;
      var base = mus.list.length ? Math.max.apply(null, mus.list.map(function (t) { return t.order || 0; })) + 1 : 1;
      for (var i = 0; i < files.length; i++) {
        st.textContent = 'Adding ' + (i + 1) + ' of ' + files.length + '…';
        var f = files[i], dur = await new Promise(function (res) { var a = new Audio(), u = URL.createObjectURL(f); a.preload = 'metadata'; a.onloadedmetadata = function () { res(a.duration || 0); URL.revokeObjectURL(u); }; a.onerror = function () { res(0); URL.revokeObjectURL(u); }; a.src = u; setTimeout(function () { res(0); }, 5000); });
        var t = { id: 'm' + Date.now().toString(36) + i, name: f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' '), type: f.type || 'audio/mpeg', blob: f.slice(0, f.size, f.type || 'audio/mpeg'), dur: dur, src: 'Saved from Files', added: Date.now(), order: base + i };
        try { await musPut(t); mus.list.push(t); } catch (e) { st.textContent = 'This device is out of space, so not every song was added.'; break; }
      }
      toast(files.length === 1 ? 'Song added' : files.length + ' songs added'); render(); musMini();
    };
    var pl = document.getElementById('mlPlay'); if (pl) pl.onclick = function () { musLoadTrack(S.musShuffle ? Math.floor(Math.random() * mus.list.length) : 0, true); openPlayer(); };
    var ed = document.getElementById('mlEdit'); if (ed) ed.onclick = function () { editing = !editing; render(); };
    sheetBody.querySelectorAll('[data-mi]').forEach(function (b) { b.onclick = function () { if (editing) return; musLoadTrack(+b.dataset.mi, true); openPlayer(); }; });
    var move = async function (i, j) {
      if (j < 0 || j >= mus.list.length) return;
      var cur = musCur(), t = mus.list[i]; mus.list[i] = mus.list[j]; mus.list[j] = t;
      for (var k = 0; k < mus.list.length; k++) { mus.list[k].order = k + 1; await musPut(mus.list[k]); }
      mus.idx = cur ? mus.list.indexOf(cur) : -1; render(); musMini();
    };
    sheetBody.querySelectorAll('[data-mu]').forEach(function (b) { b.onclick = function () { move(+b.dataset.mu, +b.dataset.mu - 1); }; });
    sheetBody.querySelectorAll('[data-md]').forEach(function (b) { b.onclick = function () { move(+b.dataset.md, +b.dataset.md + 1); }; });
    sheetBody.querySelectorAll('[data-mx]').forEach(function (b) {
      b.onclick = async function () {
        if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = '?'; return; }
        var i = +b.dataset.mx, t = mus.list[i], cur = musCur();
        if (cur === t) { musAudio().pause(); mus.idx = -1; }
        await musDel(t.id); mus.list.splice(i, 1); if (cur && cur !== t) mus.idx = mus.list.indexOf(cur);
        render(); musMini();
      };
    });
    if (pick === true) { pick = false; setTimeout(function () { document.getElementById('mlAdd').click(); }, 60); }
  }
  render();
}
function musSettingsHtml() {
  return '<div class="set"><div class="set-t">Music player</div>' + segBtns('sMusic', [['mine', 'My music'], ['spotify', 'Spotify'], ['off', 'Off']], musMode()) +
    '<p class="status"><b>My music</b> plays songs you have saved in Files or iCloud Drive: free, no account needed. <b>Spotify</b> brings back the Spotify dock as before. The app restarts when you switch.</p></div>';
}
function musBindSettings() {
  var box = document.getElementById('sMusic'); if (!box) return;
  box.querySelectorAll('button').forEach(function (b) { b.onclick = function () { if (b.dataset.val === musMode()) return; S.musicMode = b.dataset.val; saveSettings(); toast('Switching the music player…'); setTimeout(function () { location.reload(); }, 700); }; });
}
onReady(function () { if (musMode() === 'mine') musLoad().then(function () { if (mus.list.length && S.musLast) { var i = mus.list.findIndex(function (t) { return t.id === S.musLast; }); if (i >= 0) musLoadTrack(i, false); } musMini(); }); });
// Remember the song you were on
setInterval(function () { var t = musCur(); if (t && S.musLast !== t.id) { S.musLast = t.id; saveSettings(); } }, 15000);
