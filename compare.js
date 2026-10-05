// Noble Vine Study & Discipleship · 2.0.0 · Compare versions
'use strict';
// ======================================================================
// Compare versions. Other versions are kept exactly as published: no Names changes, no highlighting.
// ======================================================================
var VERSIONS = [
  { id: 'esv', get label() { return bibleShort(); }, get name() { return bibleName(); } },
  { id: 'web', label: 'WEB', name: 'World English Bible', download: true },
  { id: 'asv', label: 'ASV', name: 'American Standard Version (1901)', download: true }
];
var verDb = null, verCache = {}, verMeta = null;
function verOpen() {
  if (verDb) return Promise.resolve(verDb);
  return dbTimeout(new Promise(function (res) {
    try { var r = indexedDB.open('nrb-versions', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); }; r.onsuccess = function () { verDb = r.result; res(verDb); }; r.onerror = function () { res(null); }; }
    catch (e) { res(null); }
  }));
}
async function verGet(k) { var db = await verOpen(); if (!db) return null; return new Promise(function (res) { try { var q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; } catch (e) { res(null); } }); }
async function verPut(k, v) { var db = await verOpen(); if (!db) throw new Error('nostore'); return new Promise(function (res, rej) { var tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = tx.onabort = function () { rej(tx.error || new Error('space')); }; }); }
async function verDel(k) { var db = await verOpen(); if (!db) return; return new Promise(function (res) { var tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete = res; tx.onerror = res; }); }
async function verLoadMeta() { if (!verMeta) verMeta = (await verGet('meta')) || {}; return verMeta; }
async function verBook(id, b) { var k = id + ':' + b; if (verCache[k]) return verCache[k]; var d = await verGet(k); if (d) verCache[k] = d; return d; }
// Text of one chapter in a version: { verse: text }
async function verChapter(id, b, c) {
  if (id === 'esv') { var d = chapters[key(b, c)]; if (!d) return null; var o = {}; d.verses.forEach(function (x) { o[x.v] = x.t; }); return o; }
  var bk = await verBook(id, b); return bk ? (bk[c] || null) : null;
}
function getbibleBook(bk, into) {
  var b = (+bk.nr || +bk.book_nr) - 1; if (!(b >= 0 && b < 66)) return;
  var out = into[b] = into[b] || {};
  (bk.chapters || []).forEach(function (ch) {
    var c = +ch.chapter; if (!c) return;
    var cv = out[c] = out[c] || {};
    (ch.verses || []).forEach(function (v) { if (v && v.verse && typeof v.text === 'string') cv[+v.verse] = v.text.replace(/\s+$/, ''); });
  });
}
async function downloadKjv(stat) {
  var all = {};
  stat('Downloading the King James Version…');
  try {
    var txt = await fetchText('https://api.getbible.net/v2/kjv.json', function (g, t) { stat('Downloading the King James Version… ' + (g / 1048576).toFixed(1) + ' MB' + (t ? ' of ' + (t / 1048576).toFixed(1) + ' MB' : '')); });
    var j = JSON.parse(txt); (j.books || []).forEach(function (bk) { getbibleBook(bk, all); });
  } catch (e) { all = {}; }
  if (Object.keys(all).length < 66) {
    for (var n = 1; n <= 66; n++) {
      if (all[n - 1]) continue;
      stat('Downloading the King James Version… book ' + n + ' of 66');
      var r = await fetch('https://api.getbible.net/v2/kjv/' + n + '.json');
      if (!r.ok) throw new Error('download ' + r.status);
      var bj = await r.json(); if (!bj.nr && !bj.book_nr) bj.nr = n; getbibleBook(bj, all);
    }
  }
  var bks = Object.keys(all).map(Number);
  if (bks.length < 66) throw new Error('format');
  stat('Saving to this device…');
  for (var i = 0; i < bks.length; i++) { await verPut('kjv:' + bks[i], all[bks[i]]); verCache['kjv:' + bks[i]] = all[bks[i]]; }
  var meta = await verLoadMeta(); meta.kjv = { when: Date.now(), books: 66 }; await verPut('meta', meta);
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
}
function cmpSel() { var s = Array.isArray(S.cmp) && S.cmp.length ? S.cmp.slice(0, 3) : ['esv', 'web', 'asv']; return s.filter(function (id) { return VERSIONS.some(function (v) { return v.id === id; }); }); }

async function showCompare(b, c, flashV) {
  leaveHome();
  hebView = null; planCtx = null; pos = { b: b, c: c }; cmpView = { b: b, c: c };
  selected.clear(); updateSelbar();
  document.getElementById('refBtn').textContent = bn(b) + ' ' + c;
  var sel = cmpSel(), meta = await verLoadMeta(), heb = b < NT_START && S.cmpHeb !== false;
  if (!cmpView || cmpView.b !== b || cmpView.c !== c) return;
  var chips = VERSIONS.map(function (v) { return '<button data-ver="' + v.id + '" class="' + (sel.indexOf(v.id) >= 0 ? 'on' : '') + '">' + v.label + '</button>'; }).join('') +
    (b < NT_START ? '<button data-ver="heb" class="' + (heb ? 'on' : '') + '">א Hebrew</button>' : '');
  var html = '<div class="ilbar"><button id="cmBack">‹ Reading</button><span class="sp"></span>' + chips + '</div>' +
    '<h1 class="ch-title">' + esc(bn(b) + ' ' + c) + '</h1><p class="ch-sub">Compare versions. Only your ' + esc(bibleName()) + ' has the Names restored; the others are shown exactly as published.</p>';
  var missV = sel.filter(function (id) { return id !== 'esv' && !meta[id]; })[0];
  if (missV) {
    html += window.claude ? '<div class="card"><p class="hint" style="margin:0">Public-domain versions download in your installed app. Open the Scriptures app from your home-screen icon to compare with them.</p></div>' :
      '<div class="card"><h3>Download the ' + esc(verLabel(missV, true)) + '</h3><p class="hint">A one-time download of the whole Bible, about 5 MB. After that it works offline. The text is kept exactly as published.</p><div class="actions"><button class="primary" id="kjvGet" data-v="' + missV + '">Download now</button></div><p class="status" id="kjvStat"></p></div>';
  }
  var texts = {}, vset = {};
  for (var i = 0; i < sel.length; i++) { var t = await verChapter(sel[i], b, c); texts[sel[i]] = t; if (t) Object.keys(t).forEach(function (v) { vset[v] = 1; }); }
  var hd = heb ? await hebBook(b) : null, hch = hd && hd[c] ? hd[c] : null;
  if (hch) Object.keys(hch).forEach(function (v) { vset[v] = 1; });
  var vs = Object.keys(vset).map(Number).sort(function (a, z) { return a - z; });
  if (!vs.length) html += '<p class="hint">Nothing to compare yet for this chapter. Import it in ' + esc(bibleName()) + ', or download the WEB or ASV.</p>';
  vs.forEach(function (v) {
    html += '<div class="cmpv" id="cv' + v + '"><div class="cvhead"><div class="vno">Verse ' + v + '</div><button data-cmv="' + v + '">Commentary</button></div>';
    sel.forEach(function (id) {
      var ver = VERSIONS.filter(function (x) { return x.id === id; })[0], t = texts[id] && texts[id][v];
      html += '<div class="cmpr"><span class="lbl" data-v="' + id + '">' + ver.label + '</span><span class="txt' + (t ? '' : ' miss') + '">' +
        (t ? (id === 'esv' ? fmtVerse(t) : esc(t)) : (texts[id] ? 'Not in this version here' : id === 'esv' ? 'Not imported yet' : 'Not downloaded yet')) + '</span></div>';
    });
    if (heb) {
      var ws = hch && hch[v];
      if (ws) html += '<button class="cmph" data-hv="' + v + '"><span class="ws">' + ws.map(function (w) {
          return '<span class="cw"><span class="h">' + esc(w[0]) + '</span><span class="t">' + esc(w[1]) + '</span><span class="g">' + esc(w[2] || '–') + '</span></span>';
        }).join('') + '</span><span class="tap">Hebrew · how it sounds · word for word. Tap for the full interlinear.</span></button>';
      else if (!hd) html += '<div class="cmpr"><span class="lbl">Hebrew</span><span class="txt miss">Download the Hebrew from the א Hebrew view of this book first.</span></div>';
    }
    html += '</div>';
  });
  var nb = c < BOOKS[b][1] ? c + 1 : 0, pb = c > 1 ? c - 1 : 0;
  html += '<nav class="chnav"><button id="cPrev"' + (pb ? '' : ' disabled') + '>‹ ' + (pb ? esc(bn(b) + ' ' + pb) : 'Start') + '</button><button id="cNext"' + (nb ? '' : ' disabled') + '>' + (nb ? esc(bn(b) + ' ' + nb) : 'End') + ' ›</button></nav>' +
    '<div class="grp" style="margin-top:1.4rem">Other translations (links only, nothing stored)</div><div class="cmlinks">' + gwLink(b, c, 'ESV;NKJV;KJV', 'ESV, NKJV and KJV side by side') + gwLink(b, c, 'ESV', 'ESV') + gwLink(b, c, 'NKJV', 'NKJV') + '</div>' +
    '<p class="status" style="margin-top:1.5rem">World English Bible and American Standard Version: public domain, via getBible.net. Hebrew text and word-for-word English: STEP Bible (stepbible.org), Tyndale House, Cambridge, CC BY 4.0.</p>';
  main.innerHTML = html;
  document.getElementById('cmBack').onclick = function () { cmpView = null; showChapter(b, c); };
  if (pb) document.getElementById('cPrev').onclick = function () { showCompare(b, pb); };
  if (nb) document.getElementById('cNext').onclick = function () { showCompare(b, nb); };
  main.querySelectorAll('[data-ver]').forEach(function (el) {
    el.onclick = function () {
      var id = el.dataset.ver;
      if (id === 'heb') { S.cmpHeb = !heb; saveSettings(); showCompare(b, c); return; }
      var cur = cmpSel(), at = cur.indexOf(id);
      if (at >= 0) { if (cur.length === 1) { toast('Keep at least one version'); return; } cur.splice(at, 1); }
      else { if (cur.length >= 3) { toast('Up to three versions at a time'); return; } cur.push(id); }
      S.cmp = VERSIONS.map(function (x) { return x.id; }).filter(function (x) { return cur.indexOf(x) >= 0; }); saveSettings(); showCompare(b, c);
    };
  });
  main.querySelectorAll('[data-hv]').forEach(function (el) { el.onclick = function () { cmpView = null; showHebrew(b, c, +el.dataset.hv); }; });
  main.querySelectorAll('[data-cmv]').forEach(function (el) { el.onclick = function () { openCommentary(b, c, +el.dataset.cmv); }; });
  var kg = document.getElementById('kjvGet');
  if (kg) kg.onclick = async function () {
    var st = document.getElementById('kjvStat'); kg.disabled = true;
    try { await downloadVer(kg.dataset.v, function (m) { st.textContent = m; }); toast(verLabel(kg.dataset.v, true) + ' downloaded'); showCompare(b, c, flashV); }
    catch (e) { kg.disabled = false; st.style.color = 'var(--name)'; st.textContent = (e && e.message === 'nostore') ? 'This view can’t store it. Use the app from your home-screen icon.' : 'The download didn’t work (' + ((e && e.message) || 'error') + '). Check your connection and try again. If it keeps failing, send Claude a screenshot.'; }
  };
  if (flashV && document.getElementById('cv' + flashV)) { var fv = document.getElementById('cv' + flashV); fv.scrollIntoView({ block: 'center' }); fv.classList.add('flash'); setTimeout(function () { fv.classList.remove('flash'); }, 2200); }
  else window.scrollTo(0, 0);
}
async function openMyVersions() {
  openSheet('My versions'); var tok = sheetSeq;
  var meta = await verLoadMeta(), n = Object.keys(chapters).length;
  var h = '<p class="hint" style="margin-top:0">Only your ' + esc(bibleName()) + ' has the Names restored. Every other version is kept exactly as published, for side-by-side teaching.</p>' +
    '<div class="wrow"><span>' + esc(bibleName()) + '</span><span>' + n + (n === 1 ? ' chapter' : ' chapters') + ' imported</span></div>' +
    mvRow(meta, 'web') + mvRow(meta, 'asv') + (meta.kjv ? '<div class="wrow"><span>KJV</span><span>Downloaded earlier · not shown in Compare</span></div>' : '') +
    '<div class="wrow"><span>ESV · NKJV</span><span class="status" style="margin:0">Links in Compare (copyrighted)</span></div>' +
    
    
    '<p class="status" id="mvStat"></p>' +
    '<div class="actions"><button class="primary" id="mvCmp">Compare ' + esc(bn(pos.b) + ' ' + pos.c) + '</button>' + (meta.kjv ? '<button class="quiet" id="mvDel">Remove the KJV</button>' : '') + '</div>' +
    '<p class="status">World English Bible and American Standard Version: public domain, via getBible.net.</p>';
  if (tok !== sheetSeq) return; sheetBody.innerHTML = h;
  document.getElementById('mvCmp').onclick = function () { closeSheet(); closeSearch(); showCompare(pos.b, pos.c); };
  sheetBody.querySelectorAll('[data-mvdl]').forEach(function (bt) { bt.onclick = async function () { var st = document.getElementById('mvStat'); bt.disabled = true; try { await downloadVer(bt.dataset.mvdl, function (m) { st.textContent = m; }); toast(verLabel(bt.dataset.mvdl, true) + ' downloaded'); openMyVersions(); } catch (e) { bt.disabled = false; st.style.color = 'var(--name)'; st.textContent = 'The download didn’t work (' + ((e && e.message) || 'error') + '). Try again on Wi-Fi.'; } }; });
  var dl = document.getElementById('mvKjv');
  if (dl) dl.onclick = async function () {
    var st = document.getElementById('mvStat'); dl.disabled = true;
    try { await downloadKjv(function (m) { st.textContent = m; }); toast('King James Version downloaded'); openMyVersions(); }
    catch (e) { dl.disabled = false; st.style.color = 'var(--name)'; st.textContent = 'The download didn’t work (' + ((e && e.message) || 'error') + '). Try again on Wi-Fi.'; }
  };
  var del = document.getElementById('mvDel');
  if (del) del.onclick = async function () {
    if (del.dataset.armed !== '1') { del.dataset.armed = '1'; del.textContent = 'Tap again to remove'; return; }
    for (var b = 0; b < 66; b++) { await verDel('kjv:' + b); delete verCache['kjv:' + b]; }
    var m = await verLoadMeta(); delete m.kjv; await verPut('meta', m); toast('King James Version removed'); openMyVersions();
  };
}
var cmpView = null;
