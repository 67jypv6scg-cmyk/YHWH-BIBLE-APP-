// Noble Vine Study & Discipleship · 2.0.0 · Verse of the day, pictures
'use strict';
// ======================================================================
// Verse of the day
// ======================================================================
var VOTD = ('0.1.1 0.1.27 0.1.31 0.2.7 0.3.15 0.9.13 0.12.1-3 0.15.6 0.17.7 0.18.14 0.22.14 0.28.15 0.50.20 ' +
  '1.3.14 1.14.14 1.15.2 1.19.5-6 1.20.2-3 1.33.14 1.34.6 2.19.18 2.20.26 3.6.24-26 3.23.19 ' +
  '4.4.29 4.6.4-5 4.7.9 4.8.3 4.10.12 4.30.19 4.31.6 4.31.8 5.1.9 5.24.15 7.1.16 8.2.2 8.16.7 9.22.31 10.8.61 ' +
  '12.16.11 12.16.34 13.7.14 13.16.9 15.8.10 17.19.25 17.42.2 ' +
  '18.1.1-2 18.16.11 18.18.2 18.19.7 18.19.14 18.23.1 18.23.4 18.25.4-5 18.27.1 18.27.14 18.30.5 18.31.24 18.32.8 18.34.8 18.37.4 18.37.5 ' +
  '18.40.1 18.46.1 18.46.10 18.51.10 18.55.22 18.62.1 18.63.1 18.84.11 18.90.12 18.91.1-2 18.95.6 18.100.4-5 18.103.2 18.103.12 18.118.24 ' +
  '18.119.11 18.119.105 18.119.165 18.121.1-2 18.127.1 18.133.1 18.139.14 18.143.8 18.145.18 18.147.3 ' +
  '19.1.7 19.3.5-6 19.3.9 19.4.23 19.9.10 19.16.3 19.16.9 19.18.10 19.22.6 19.27.17 19.28.9 19.31.30 20.3.1 20.12.13 ' +
  '22.9.6 22.26.3 22.30.15 22.40.8 22.40.31 22.41.10 22.43.2 22.43.19 22.53.5 22.55.8-9 22.55.11 22.56.6-7 22.58.13-14 22.61.1 22.64.8 ' +
  '23.17.7 23.29.11 23.31.33 23.33.3 24.3.22-23 25.36.26-27 26.2.20-21 27.6.6 28.2.32 29.5.24 32.6.8 32.7.18 34.2.14 34.3.17-18 35.3.17 ' +
  '37.4.6 37.14.9 38.3.6 38.4.4 ' +
  '39.4.4 39.5.6 39.5.8 39.5.14 39.5.17-18 39.6.33 39.7.7 39.7.24 39.11.28-29 39.22.37-39 39.28.19-20 40.10.27 40.12.29-30 41.1.37 41.6.31 41.11.28 ' +
  '42.1.1 42.1.14 42.3.16 42.8.12 42.8.31-32 42.10.10 42.11.25 42.13.34 42.14.6 42.14.15 42.14.27 42.15.5 42.16.33 43.1.8 43.2.38 43.4.12 43.17.11 ' +
  '44.3.31 44.5.8 44.7.12 44.8.1 44.8.28 44.8.38-39 44.10.9 44.11.17-18 44.12.1 44.12.2 44.12.12 44.15.13 45.10.13 45.13.4-5 45.15.58 45.16.13-14 ' +
  '46.4.17-18 46.5.17 46.10.5 46.12.9 47.2.20 47.5.1 47.5.22-23 47.6.9 48.2.8-10 48.2.19 48.3.20 48.4.32 48.6.10-11 ' +
  '49.1.6 49.2.3 49.3.13-14 49.4.6-7 49.4.8 49.4.13 49.4.19 50.2.6-7 50.3.2 50.3.17 50.3.23 51.5.16-18 54.1.7 54.3.16-17 54.4.7 55.2.11-12 ' +
  '57.4.12 57.4.16 57.10.23 57.11.1 57.11.6 57.12.1-2 57.13.5 57.13.8 58.1.5 58.1.22 58.4.8 59.1.15-16 59.2.9 59.5.7 60.3.9 ' +
  '61.1.9 61.2.3-4 61.4.18 61.4.19 61.5.3 64.1.24-25 65.3.20 65.12.17 65.14.12 65.21.4 65.22.14').split(' ').map(function (x) {
  var a = x.split('.'), r = a[2].split('-');
  return { b: +a[0], c: +a[1], v1: +r[0], v2: +(r[1] || r[0]) };
});
function dayNumber() { var d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }
function verseOfDay() {
  var n = VOTD.length, step = 97, start = dayNumber() % n;
  for (var i = 0; i < n; i++) {
    var r = VOTD[((start + i) * step) % n], doc = chapters[key(r.b, r.c)];
    if (!doc) continue;
    var vs = doc.verses.filter(function (x) { return x.v >= r.v1 && x.v <= r.v2; });
    if (!vs.length) continue;
    return { b: r.b, c: r.c, v1: r.v1, v2: r.v2, text: vs.map(function (x) { return x.t; }).join(' ') };
  }
  return null;
}
function votdRef(r) { return bn(r.b) + ' ' + r.c + ':' + r.v1 + (r.v2 > r.v1 ? '–' + r.v2 : ''); }

// Painted landscapes, a different one each day
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var SCENES = [
  { sky: ['#F6C89F', '#E89A84', '#8C7AA6'], sun: '#FFE9C2', hills: ['#9C88A8', '#75688F', '#4E4A6E', '#2F3049'] },
  { sky: ['#BFD9EA', '#DCEBEF', '#F3EFD9'], sun: '#FFFBEA', hills: ['#9FB79A', '#6F9467', '#4C7445', '#2E4E2B'] },
  { sky: ['#F3D18A', '#EDB46A', '#D98B4E'], sun: '#FFF1C9', hills: ['#C99A63', '#A97B47', '#7E5A33', '#4F3A22'] },
  { sky: ['#F0A262', '#C9677A', '#4E3F78'], sun: '#FFD7A0', hills: ['#5D4E7E', '#423D66', '#2C2B4A', '#1B1C31'] },
  { sky: ['#0E1A33', '#1E2E52', '#3C4C78'], sun: '#F1EEDB', hills: ['#2A3758', '#1F2A45', '#151D33', '#0C1222'], night: true },
  { sky: ['#CFE3DA', '#E8EFE3', '#F7F1DE'], sun: '#FFFFFF', hills: ['#A8BFB0', '#7FA08B', '#5A7F68', '#36543F'], mist: true }
];
function paintedBg(day) {
  var R = rng(day * 9301 + 49297), sc = SCENES[day % SCENES.length], W = 800, H = 520;
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice">' +
    '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sc.sky[0] + '"/><stop offset=".55" stop-color="' + sc.sky[1] + '"/><stop offset="1" stop-color="' + sc.sky[2] + '"/></linearGradient>' +
    '<radialGradient id="g"><stop offset="0" stop-color="' + sc.sun + '" stop-opacity=".9"/><stop offset="1" stop-color="' + sc.sun + '" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="' + W + '" height="' + H + '" fill="url(#s)"/>';
  if (sc.night) for (var i = 0; i < 70; i++) svg += '<circle cx="' + (R() * W).toFixed(0) + '" cy="' + (R() * H * .5).toFixed(0) + '" r="' + (R() * 1.3 + .3).toFixed(1) + '" fill="#fff" opacity="' + (R() * .7 + .2).toFixed(2) + '"/>';
  var sx = 120 + R() * 560, sy = 120 + R() * 110, sr = sc.night ? 22 : 34 + R() * 16;
  svg += '<circle cx="' + sx.toFixed(0) + '" cy="' + sy.toFixed(0) + '" r="' + (sr * 4).toFixed(0) + '" fill="url(#g)"/><circle cx="' + sx.toFixed(0) + '" cy="' + sy.toFixed(0) + '" r="' + sr.toFixed(0) + '" fill="' + sc.sun + '"/>';
  sc.hills.forEach(function (col, li) {
    var base = H * (0.50 + li * 0.11), amp = 24 + li * 10 + R() * 18, f1 = 0.004 + R() * 0.006, f2 = 0.011 + R() * 0.01, p1 = R() * 6, p2 = R() * 6;
    var d = 'M0 ' + H;
    for (var x = 0; x <= W; x += 16) d += ' L' + x + ' ' + (base - amp * (Math.sin(x * f1 + p1) * .7 + Math.sin(x * f2 + p2) * .3)).toFixed(1);
    d += ' L' + W + ' ' + H + ' Z';
    svg += '<path d="' + d + '" fill="' + col + '"/>';
    if (sc.mist && li < 3) svg += '<rect y="' + (base - 10).toFixed(0) + '" width="' + W + '" height="60" fill="#FFFFFF" opacity=".16"/>';
  });
  svg += '</svg>';
  return "url('data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg).replace(/'/g, '%27') + "')";
}

// Your own pictures: kept on this device (and in backups)
var picDb = null, picCache = null;
function picOpen() {
  if (picDb) return Promise.resolve(picDb);
  return dbTimeout(new Promise(function (res) {
    try {
      var r = indexedDB.open('nrb-pictures', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('pics', { keyPath: 'id' }); };
      r.onsuccess = function () { picDb = r.result; res(picDb); };
      r.onerror = function () { res(null); };
    } catch (e) { res(null); }
  }));
}
async function picsAll() {
  if (picCache) return picCache;
  var db = await picOpen(); if (!db) return [];
  picCache = await new Promise(function (res) {
    var out = [];
    try {
      var cur = db.transaction('pics', 'readonly').objectStore('pics').openCursor();
      cur.onsuccess = function () { var c = cur.result; if (c) { out.push(c.value); c.continue(); } else res(out); };
      cur.onerror = function () { res(out); };
    } catch (e) { res(out); }
  });
  picCache.sort(function (a, z) { return a.added - z.added; });
  return picCache;
}
async function picPut(rec) {
  var db = await picOpen(); if (!db) throw new Error('nostore');
  await new Promise(function (res, rej) { var tx = db.transaction('pics', 'readwrite'); tx.objectStore('pics').put(rec); tx.oncomplete = res; tx.onerror = tx.onabort = function () { rej(tx.error); }; });
  picCache = null;
}
async function picDel(id) {
  var db = await picOpen(); if (!db) return;
  await new Promise(function (res) { var tx = db.transaction('pics', 'readwrite'); tx.objectStore('pics').delete(id); tx.oncomplete = res; tx.onerror = res; });
  picCache = null;
}
function shrinkImage(file) {
  return new Promise(function (res, rej) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var m = 1600, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, m / Math.max(w, h));
      var cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url); res(cv.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('bad image')); };
    img.src = url;
  });
}
function votdHtml() {
  var r = verseOfDay();
  if (!r) return '<div class="votd" id="votd" style="background-image:' + paintedBg(dayNumber()) + '"><div class="votd-in"><p class="votd-l">Verse of the day</p><p class="votd-t" style="font-size:1.1rem">Import a few more books and a verse of the day will appear here.</p></div><div class="votd-a"><button id="vdPics">Pictures</button></div></div>';
  return '<div class="votd" id="votd" style="background-image:' + paintedBg(dayNumber()) + '"><div class="votd-in"><p class="votd-l">Verse of the day</p><p class="votd-r">' + esc(votdRef(r)) + '</p>' +
    '<p class="votd-t">' + fmtVerse(r.text) + '</p></div><div class="votd-a"><button id="vdRead" data-b="' + r.b + '" data-c="' + r.c + '" data-v1="' + r.v1 + '" data-v2="' + r.v2 + '">Read chapter</button><button id="vdPics">Pictures</button></div></div>';
}
function bindVotd() {
  var rd = document.getElementById('vdRead');
  if (rd) rd.onclick = function () {
    var vs = []; for (var v = +rd.dataset.v1; v <= +rd.dataset.v2; v++) vs.push(v);
    planCtx = null; closeSheet(); closeSearch(); showChapter(+rd.dataset.b, +rd.dataset.c, vs);
  };
  var pb = document.getElementById('vdPics'); if (pb) pb.onclick = openPictures;
  picsAll().then(function (list) {
    var el = document.getElementById('votd');
    if (el && list.length) el.style.backgroundImage = 'url("' + list[dayNumber() % list.length].data + '")';
  });
}
function greeting() {
  var h = new Date().getHours(), g = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return '<p class="greet">' + g + (S.greet ? ', ' + esc(S.greet) : '') + '</p><p class="greet-d">' + esc(new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })) + '</p>';
}
async function openPictures() {
  openSheet('Pictures'); var tok = sheetSeq;
  if (tok !== sheetSeq) return; sheetBody.innerHTML = '<p class="hint">Loading…</p>';
  var list = await picsAll();
  var h = '<button class="backlink" id="pcBack">‹ Today</button>' +
    '<p class="hint" style="margin-top:0">Your pictures show behind the verse of the day, a different one each day. They’re kept on this device and included in your backups. ' +
    (list.length ? '' : 'Until you add some, the app paints a landscape for each day.') + '</p>';
  if (list.length) h += '<div class="picgrid">' + list.map(function (p) { return '<div><img src="' + p.data + '" alt=""><button data-del="' + esc(p.id) + '" aria-label="Remove this picture">✕</button></div>'; }).join('') + '</div>';
  h += '<div class="actions"><button class="primary" id="pcAdd">Add from Photos</button></div><p class="status" id="pcStat"></p>' +
    '<input type="file" id="pcFile" accept="image/*" multiple hidden>';
  if (tok !== sheetSeq) return; sheetBody.innerHTML = h;
  document.getElementById('pcBack').onclick = openToday;
  var inp = document.getElementById('pcFile'), st = document.getElementById('pcStat');
  document.getElementById('pcAdd').onclick = function () { inp.click(); };
  inp.onchange = async function () {
    var files = Array.from(inp.files || []); if (!files.length) return;
    var added = 0;
    for (var i = 0; i < files.length; i++) {
      st.textContent = 'Adding picture ' + (i + 1) + ' of ' + files.length + '…';
      try { var data = await shrinkImage(files[i]); await picPut({ id: 'pic' + Date.now() + '_' + i, data: data, added: Date.now() + i }); added++; }
      catch (e) { if (e && e.message === 'nostore') { st.textContent = 'Pictures can’t be saved in this view.'; return; } }
    }
    toast(added + (added === 1 ? ' picture added' : ' pictures added'));
    openPictures();
  };
  sheetBody.querySelectorAll('[data-del]').forEach(function (el) {
    el.onclick = async function () {
      if (el.dataset.armed !== '1') { el.dataset.armed = '1'; el.textContent = '?'; el.setAttribute('aria-label', 'Tap again to remove'); return; }
      await picDel(el.dataset.del); openPictures();
    };
  });
}
