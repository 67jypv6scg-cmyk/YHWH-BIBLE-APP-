// Noble Vine Study & Discipleship · 2.0.0 · Saving on this device (IndexedDB) and in the claude.ai copy
'use strict';
// ======================================================================
// Storage: account (db) when available, this device otherwise
// ======================================================================
var store = { mode: 'local', col: null, settingsRef: null };
var chapters = {};          // key -> {book, ch, verses:[{v,t}], heads:[{v,t}]}
var S = { autohide: true, theme: 'dark', size: 19, name: 'heb', jesus: 'heb', god: true, christ: true, spirit: false, brackets: false, lord: 'keep', shade: true, last: null };

// Offline copy: big items (chapters, notes, plan) are kept in IndexedDB, which has room for the whole Bible.
var BIG = { 'nb-favs': 1, 'nb-tags': 1, 'nb-chapters': 1, 'nb-vnotes': 1, 'nb-pnotes': 1, 'nb-plan': 1, 'nb-study': 1, 'nb-words': 1, 'nb-mem': 1, 'nb-teach': 1, 'nb-notes': 1 };
var big = {}, idb = null;
function idbOpen() {
  return new Promise(function (res) {
    try {
      var r = indexedDB.open('names-restored-bible', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { res(null); };
    } catch (e) { res(null); }
  });
}
async function idbPreload() {
  idb = await idbOpen();
  if (!idb) return;
  await new Promise(function (res) {
    var tx = idb.transaction('kv', 'readonly'), st = tx.objectStore('kv'), cur = st.openCursor();
    cur.onsuccess = function () { var c = cur.result; if (c) { big[c.key] = c.value; c.continue(); } else res(); };
    cur.onerror = function () { res(); };
  });
  // Move anything an earlier version left in localStorage
  Object.keys(BIG).forEach(function (k) {
    try { var v = localStorage.getItem(k); if (v != null) { if (!(k in big)) { big[k] = JSON.parse(v); idbPut(k, big[k]); } localStorage.removeItem(k); } } catch (e) {}
  });
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
}
var idbQueue = Promise.resolve();
function idbPut(k, v) {
  if (!idb) return;
  var copy = v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  idbQueue = idbQueue.then(function () {
    return new Promise(function (res) {
      try {
        var tx = idb.transaction('kv', 'readwrite'), st = tx.objectStore('kv');
        if (copy === undefined) st.delete(k); else st.put(copy, k);
        tx.oncomplete = function () { res(); };
        tx.onerror = tx.onabort = function () { toast('This device is out of storage space. The last change wasn’t kept.'); res(); };
      } catch (e) { res(); }
    });
  });
}
function lsGet(k, d) {
  if (BIG[k] && idb) return k in big ? JSON.parse(JSON.stringify(big[k])) : d;
  try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
}
function lsSet(k, v) {
  if (BIG[k] && idb) { big[k] = v; idbPut(k, v); return true; }
  try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
}

async function initStore() {
  var db = null, user = null;
  try { if (window.claude && typeof window.claude.use === 'function') { db = await window.claude.use('db'); user = await window.claude.use('user'); } } catch (e) {}
  var uid = null;
  if (db && user) { try { uid = await user.id(); } catch (e) {} }
  if (db && uid) {
    store.mode = 'db';
    var root = db.collection('data/users/' + uid);
    store.settingsRef = root.doc('settings');
    store.col = root.doc('bible').collection('chapters');
    store.planRef = root.doc('plan');
    store.studyRef = root.doc('study');
    store.notes = root.doc('plan').collection('notes');
    store.vnotes = root.doc('bible').collection('vnotes');
  }
}
async function loadAll() {
  Object.assign(S, lsGet('nb-settings', {}));
  if (store.mode === 'db') {
    try {
      var s = await store.settingsRef.get();
      if (s.exists) Object.assign(S, s.data());
    } catch (e) {}
    var last = '';
    for (var guard = 0; guard < 10; guard++) {
      var q = store.col.orderBy('key').limit(500);
      if (last) q = store.col.where('key', '>', last).orderBy('key').limit(500);
      var snap;
      try { snap = await q.get(); } catch (e) { await sleep(600 + Math.random() * 600); snap = await q.get(); }
      snap.docs.forEach(function (d) { var x = d.data(); if (x && x.key) chapters[x.key] = x; last = x.key; });
      if (snap.size < 500) break;
    }
  } else {
    chapters = {};
    if (idb) {
      Object.keys(big).forEach(function (k) { if (k.indexOf('ch:') === 0) chapters[k.slice(3)] = big[k]; });
      var legacy = big['nb-chapters'];
      if (legacy) {
        Object.keys(legacy).forEach(function (k) { if (!chapters[k]) { chapters[k] = legacy[k]; idbPut('ch:' + k, legacy[k]); } });
        idbPut('nb-chapters', undefined); delete big['nb-chapters'];
      }
    } else chapters = lsGet('nb-chapters', {});
  }
}
var settingsTimer = null;
function saveSettings() {
  lsSet('nb-settings', S);
  if (store.mode !== 'db') return;
  clearTimeout(settingsTimer);
  settingsTimer = setTimeout(function () {
    store.settingsRef.set(JSON.parse(JSON.stringify(S))).catch(function () {});
  }, 800);
}
function withTimeout(p, ms) {
  return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej({ code: 'timeout', message: 'no reply from storage after ' + Math.round(ms / 1000) + 's' }); }, ms); })]);
}
async function putChapter(doc) {
  if (store.mode === 'db') {
    var clean = JSON.parse(JSON.stringify(doc));
    for (var attempt = 1; ; attempt++) {
      try { await withTimeout(store.col.doc(doc.key).set(clean), 20000); break; }
      catch (e) {
        var retry = e && (e.code === 'unavailable' || e.code === 'resource_exhausted' || e.code === 'timeout');
        if (!retry || attempt >= 3) throw e;
        await sleep(800 * attempt + Math.random() * 600);
      }
    }
  }
  chapters[doc.key] = doc;
  if (store.mode !== 'db') {
    if (idb) idbPut('ch:' + doc.key, doc);
    else if (!lsSet('nb-chapters', chapters)) throw { code: 'quota_exceeded', message: 'This device is out of storage space.' };
  }
}
async function removeChapter(k) {
  if (store.mode === 'db') await store.col.doc(k).delete();
  delete chapters[k];
  if (store.mode !== 'db') { if (idb) idbPut('ch:' + k, undefined); else lsSet('nb-chapters', chapters); }
}
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
// Combine a new paste with a chapter already saved: new verses win, existing verses the paste doesn't cover are kept.
function mergeChapter(old, c) {
  if (!old) return { verses: c.verses, heads: c.heads, mode: 'new' };
  var newNums = new Set(c.verses.map(function (x) { return x.v; }));
  var covers = old.verses.every(function (x) { return newNums.has(x.v); });
  if (covers) return { verses: c.verses, heads: c.heads, mode: 'replace' };
  var map = {};
  old.verses.forEach(function (x) { map[x.v] = x.t; });
  c.verses.forEach(function (x) { map[x.v] = x.t; });
  var verses = Object.keys(map).map(Number).sort(function (a, z) { return a - z; }).map(function (v) { return { v: v, t: map[v] }; });
  var heads = (old.heads || []).filter(function (h) { return !newNums.has(h.v); }).concat(c.heads || [])
    .sort(function (a, z) { return a.v - z.v; });
  return { verses: verses, heads: heads, mode: 'merge' };
}
function spanText(nums) {
  var parts = [], st = nums[0], pv = nums[0];
  for (var i = 1; i <= nums.length; i++) {
    if (i < nums.length && nums[i] === pv + 1) { pv = nums[i]; continue; }
    parts.push(st === pv ? String(st) : st + '–' + pv);
    if (i < nums.length) st = pv = nums[i];
  }
  return parts.join(', ');
}
function has(b, c) { return !!chapters[key(b, c)]; }
function loadedIn(b) { var n = 0; for (var c = 1; c <= BOOKS[b][1]; c++) if (has(b, c)) n++; return n; }
