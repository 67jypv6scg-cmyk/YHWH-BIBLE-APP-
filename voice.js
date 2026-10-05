// Noble Vine Study & Discipleship · 2.0.0 · Recording passages in your own voice
'use strict';
// ======================================================================
// Your voice: record passages and hear them instead of the synthetic voice
// ======================================================================
var recDb = null, recAudio = null, recURL = null;
function recOpen() {
  if (recDb) return Promise.resolve(recDb);
  return dbTimeout(new Promise(function (res) {
    try { var r = indexedDB.open('nrb-voice', 1); r.onupgradeneeded = function () { r.result.createObjectStore('rec', { keyPath: 'id' }); }; r.onsuccess = function () { recDb = r.result; res(recDb); }; r.onerror = function () { res(null); }; }
    catch (e) { res(null); }
  }));
}
function recKey(lang, b, c, vs) { return lang + ':' + b + ':' + c + ':' + (vs && vs.length ? vs.slice().sort(function (a, z) { return a - z; }).join(',') : 'all'); }
async function recGet(id) { var db = await recOpen(); if (!db) return null; return new Promise(function (res) { try { var q = db.transaction('rec').objectStore('rec').get(id); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; } catch (e) { res(null); } }); }
async function recAll() { var db = await recOpen(); if (!db) return []; return new Promise(function (res) { var out = []; try { var cur = db.transaction('rec').objectStore('rec').openCursor(); cur.onsuccess = function () { var c = cur.result; if (c) { out.push(c.value); c.continue(); } else res(out); }; cur.onerror = function () { res(out); }; } catch (e) { res(out); } }); }
async function recPut(rec) { var db = await recOpen(); if (!db) throw new Error('nostore'); return new Promise(function (res, rej) { var tx = db.transaction('rec', 'readwrite'); tx.objectStore('rec').put(rec); tx.oncomplete = res; tx.onerror = tx.onabort = function () { rej(tx.error || new Error('space')); }; }); }
async function recDel(id) { var db = await recOpen(); if (!db) return; return new Promise(function (res) { var tx = db.transaction('rec', 'readwrite'); tx.objectStore('rec').delete(id); tx.oncomplete = res; tx.onerror = res; }); }
function recLabel(r) { return refLabel(r.b, r.c, r.vs && r.vs.length ? r.vs : null) + (r.lang === 'he' ? ' · Hebrew' : ''); }
function fmtDur(sec) { sec = Math.round(sec || 0); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
function stopOwn() { if (recAudio) { try { recAudio.pause(); } catch (e) {} recAudio = null; } if (recURL) { URL.revokeObjectURL(recURL); recURL = null; } }
function playOwn(rec, done) {
  stopMem(); stopOwn();
  recURL = URL.createObjectURL(rec.blob); recAudio = new Audio(recURL);
  var token = {}; memSpeaking = token; orbLive(true);
  var end = function () { if (memSpeaking === token) { memSpeaking = null; orbLive(false); } stopOwn(); if (done) done(); };
  recAudio.onended = end; recAudio.onerror = end;
  var pr = recAudio.play(); if (pr && pr.catch) pr.catch(end);
}
// Listen: your own recording if you've made one for exactly this passage, otherwise the chosen voice
async function listenPassage(lang, b, c, vs, it, words, rk) {
  if (memSpeaking) { stopMem(); return; }
  var own = await recGet(recKey(lang, b, c, vs));
  if (own) playOwn(own); else speakMem(it, words, null, rk);
}
function pickMime() {
  var c = ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm'];
  for (var i = 0; i < c.length; i++) try { if (window.MediaRecorder && MediaRecorder.isTypeSupported(c[i])) return c[i]; } catch (e) {}
  return '';
}
async function openRecorder(o) {
  // o: { lang, b, c, vs (array or null for whole chapter), text (html for the prompter), back }
  var id = recKey(o.lang, o.b, o.c, o.vs), existing = await recGet(id), title = refLabel(o.b, o.c, o.vs && o.vs.length ? o.vs : null);
  openSheet('Your voice · ' + title); var tok = sheetSeq;
  var stream = null, rec = null, chunks = [], t0 = 0, tick = null, fresh = null;
  function stopStream() { if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } clearInterval(tick); }
  function idle() {
    var has = fresh || existing;
    if (tok !== sheetSeq) return; sheetBody.innerHTML = (o.back ? '<button class="backlink" id="rcBack">‹ Back</button>' : '') +
      '<p class="hint" style="margin-top:0">' + (has ? 'Your recording of ' + esc(title) + (has.dur ? ' · ' + fmtDur(has.dur) : '') + '. It plays whenever you tap Listen here.' : 'Read the passage aloud in your own voice. Your recording then plays whenever you tap Listen for this passage, instead of the synthetic voice.') + '</p>' +
      '<div class="prompter' + (o.lang === 'he' ? ' he' : '') + '">' + o.text + '</div>' +
      '<button class="recbig" id="rcGo" aria-label="Start recording"></button><div class="rectime" id="rcTime">' + (has ? 'Tap to record again' : 'Tap to record') + '</div>' +
      '<div class="actions" style="justify-content:center">' + (has ? '<button class="quiet orbbtn" id="rcPlay"><span class="orb sm"></span>Play</button>' : '') +
      (fresh ? '<button class="primary" id="rcSave">Save</button>' : '') + (existing && !fresh ? '<button class="quiet" id="rcDel">Delete</button>' : '') + '</div>' +
      '<p class="status" id="rcStat" style="text-align:center"></p>';
    var bk = document.getElementById('rcBack'); if (bk) bk.onclick = function () { stopOwn(); stopMem(); o.back(); };
    document.getElementById('rcGo').onclick = start;
    var pl = document.getElementById('rcPlay'); if (pl) pl.onclick = function () { if (memSpeaking) { stopMem(); stopOwn(); return; } playOwn(fresh || existing); };
    var sv = document.getElementById('rcSave');
    if (sv) sv.onclick = async function () {
      try { await recPut(fresh); existing = fresh; fresh = null; toast('Saved in your voice'); idle(); refreshVoiceMarks(); }
      catch (e) { document.getElementById('rcStat').textContent = e && e.message === 'nostore' ? 'Recordings can only be saved in your installed app.' : 'Couldn’t save. The device may be short of space.'; }
    };
    var dl = document.getElementById('rcDel');
    if (dl) dl.onclick = async function () {
      if (dl.dataset.armed !== '1') { dl.dataset.armed = '1'; dl.textContent = 'Tap again to delete'; return; }
      stopOwn(); await recDel(id); existing = null; toast('Recording deleted'); idle(); refreshVoiceMarks();
    };
  }
  async function start() {
    stopOwn(); stopMem();
    var st = document.getElementById('rcStat');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { st.textContent = 'Recording isn’t available here. Use the app from your home-screen icon.'; return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { st.textContent = window.claude ? 'Recording works in your installed app, from the home-screen icon.' : 'The microphone wasn’t allowed. Allow it when asked, or in your phone’s Settings for this app.'; return; }
    var mime = pickMime(); chunks = [];
    try { rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); } catch (e) { rec = new MediaRecorder(stream); }
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = function () {
      stopStream();
      var dur = (Date.now() - t0) / 1000, blob = new Blob(chunks, { type: (rec.mimeType || mime || 'audio/mp4').split(';')[0] });
      if (dur < 0.8 || !blob.size) { idle(); document.getElementById('rcStat').textContent = 'That was too short. Try again.'; return; }
      fresh = { id: id, lang: o.lang, b: o.b, c: o.c, vs: o.vs && o.vs.length ? o.vs.slice() : null, blob: blob, mime: blob.type, dur: dur, created: Date.now() };
      idle(); document.getElementById('rcStat').textContent = 'Play it back. If you’re happy, tap Save. Or tap the red button to try again.';
    };
    rec.start(); t0 = Date.now();
    var go = document.getElementById('rcGo'); go.classList.add('on'); go.setAttribute('aria-label', 'Stop recording');
    var tm = document.getElementById('rcTime'); tm.textContent = '0:00 · tap to stop';
    tick = setInterval(function () { tm.textContent = fmtDur((Date.now() - t0) / 1000) + ' · tap to stop'; }, 250);
    go.onclick = function () { try { rec.stop(); } catch (e) { stopStream(); idle(); } };
  }
  idle();
}
function versesHtml(b, c, vs) {
  var doc = chapters[key(b, c)]; if (!doc) return '';
  return doc.verses.filter(function (x) { return !vs || !vs.length || vs.indexOf(x.v) >= 0; }).map(function (x) { return '<sup>' + x.v + '</sup>' + fmtVerse(x.t); }).join(' ');
}
async function refreshVoiceMarks() {
  if (homeOn) { var r = verseOfDay(); var m = document.getElementById('hMine'); if (r && m) { var own = await recGet(recKey('en', r.b, r.c, rangeOf(r))); m.hidden = !own; } }
  var cb = document.getElementById('toVoice');
  if (cb && !homeOn) { var ch = await recGet(recKey('en', pos.b, pos.c, null)); cb.textContent = ch ? '▶ Your voice' : '🎙 Record'; }
}
function rangeOf(r) { var vs = []; for (var v = r.v1; v <= r.v2; v++) vs.push(v); return vs; }
async function openRecordings() {
  openSheet('My recordings'); var tok = sheetSeq;
  var all = (await recAll()).sort(function (a, z) { return a.b - z.b || a.c - z.c || ((a.vs || [0])[0] - (z.vs || [0])[0]); });
  var tot = all.reduce(function (n, r) { return n + (r.blob ? r.blob.size : 0); }, 0);
  if (tok !== sheetSeq) return; sheetBody.innerHTML = '<p class="hint" style="margin-top:0">Passages you’ve read in your own voice. Record from Today’s Word, a chapter’s 🎙 button, selected verses, or a memory verse.</p>' +
    (all.length ? all.map(function (r, i) { return '<div class="wrow" style="align-items:center"><span>' + esc(recLabel(r)) + ' <span class="status" style="margin:0">· ' + fmtDur(r.dur) + '</span></span><span style="display:flex;gap:.8rem"><button class="backlink" data-play="' + i + '" style="margin:0">Play</button><button class="backlink" data-open="' + i + '" style="margin:0">Open</button></span></div>'; }).join('') : '<p class="hint">No recordings yet.</p>') +
    '<p class="status" style="margin-top:1rem">' + (all.length ? all.length + (all.length === 1 ? ' recording' : ' recordings') + ' · ' + (tot / 1048576).toFixed(1) + ' MB on this device. They travel in your backups.' : '') + '</p>';
  sheetBody.querySelectorAll('[data-play]').forEach(function (el) { el.onclick = function () { if (memSpeaking) { stopMem(); stopOwn(); return; } playOwn(all[+el.dataset.play]); }; });
  sheetBody.querySelectorAll('[data-open]').forEach(function (el) { el.onclick = function () { var r = all[+el.dataset.open]; closeSheet(); showChapter(r.b, r.c, r.vs || []); }; });
}
function blobToDataURL(b) { return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = function () { res(null); }; fr.readAsDataURL(b); }); }
async function recExport() { var all = await recAll(), out = []; for (var i = 0; i < all.length; i++) { var d = await blobToDataURL(all[i].blob); if (d) { var x = Object.assign({}, all[i]); delete x.blob; x.data = d; out.push(x); } } return out; }
function dataURLToBlob(d) { var m = d.match(/^data:([^;,]+)?(;base64)?,(.*)$/); if (!m) return null; var bin = atob(m[3]), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: m[1] || 'audio/mp4' }); }
