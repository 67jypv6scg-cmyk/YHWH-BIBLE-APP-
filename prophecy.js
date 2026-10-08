// Noble Vine Study & Discipleship · 2.0.0 · Prophetic words
'use strict';
// ---- Prophetic words: typed, pasted or recorded; kept only on this device (and in your own backups) ----
var prophDb = null;
function prophOpen() {
  if (prophDb) return Promise.resolve(prophDb);
  return dbTimeout(new Promise(function (res) {
    try { var r = indexedDB.open('nrb-prophecy', 1); r.onupgradeneeded = function () { r.result.createObjectStore('items', { keyPath: 'id' }); }; r.onsuccess = function () { prophDb = r.result; res(prophDb); }; r.onerror = function () { res(null); }; }
    catch (e) { res(null); }
  }));
}
async function prophAll() { var db = await prophOpen(); if (!db) return []; return new Promise(function (res) { var out = []; try { var cur = db.transaction('items').objectStore('items').openCursor(); cur.onsuccess = function () { var c = cur.result; if (c) { out.push(c.value); c.continue(); } else res(out); }; cur.onerror = function () { res(out); }; } catch (e) { res(out); } }); }
async function prophGet(id) { var db = await prophOpen(); if (!db) return null; return new Promise(function (res) { try { var q = db.transaction('items').objectStore('items').get(id); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; } catch (e) { res(null); } }); }
async function prophPut(x) { var db = await prophOpen(); if (!db) throw new Error('nostore'); return new Promise(function (res, rej) { var tx = db.transaction('items', 'readwrite'); tx.objectStore('items').put(x); tx.oncomplete = res; tx.onerror = tx.onabort = function () { rej(tx.error || new Error('space')); }; }); }
async function prophDel(id) { var db = await prophOpen(); if (!db) return; return new Promise(function (res) { var tx = db.transaction('items', 'readwrite'); tx.objectStore('items').delete(id); tx.oncomplete = res; tx.onerror = res; }); }
async function prophExport() { var all = await prophAll(), out = []; for (var i = 0; i < all.length; i++) { var x = Object.assign({}, all[i]); if (x.audio) { x.audioData = await blobToDataURL(x.audio); delete x.audio; } out.push(x); } return out; }
async function prophImport(x) {
  if (!x || !x.id) return;
  var have = await prophGet(x.id); if (have && (have.updated || 0) >= (x.updated || 0)) return;
  var y = Object.assign({}, x); if (y.audioData) { y.audio = dataURLToBlob(y.audioData); delete y.audioData; }
  await prophPut(y);
}
function prophDate(s) { try { return parseYmd(s).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return s || ''; } }
async function openProphList() {
  openSheet('My words'); var tok = sheetSeq;
  if (tok !== sheetSeq) return; sheetBody.innerHTML = '<p class="hint">Loading…</p>';
  var all = (await prophAll()).sort(function (a, z) { return (z.date || '').localeCompare(a.date || '') || (z.created || 0) - (a.created || 0); });
  if (tok !== sheetSeq) return; sheetBody.innerHTML = '<p class="hint" style="margin-top:0">Encouraging words spoken over you. Type them, paste them from another app, or keep the voice note. They stay on this device only, never on GitHub, and travel only in your own backups.</p>' +
    '<div class="actions" style="margin-top:0"><button class="primary" id="prNew">+ New word</button></div>' +
    (all.length > 3 ? '<label class="field" style="margin-top:1rem"><span>Search your words</span><input type="text" id="prQ" placeholder="A word, a name or a verse"></label>' : '') +
    '<div class="mgrp" id="prList" style="margin-top:1rem"></div>';
  function list(q) {
    var ws = (q || '').toLowerCase().split(/\s+/).filter(Boolean);
    var shown = all.filter(function (x) { var t = ((x.title || '') + ' ' + (x.from || '') + ' ' + (x.text || '')).toLowerCase(); return ws.every(function (w) { return t.indexOf(w) >= 0; }); });
    var box = document.getElementById('prList');
    box.style.display = shown.length ? '' : 'none';
    box.innerHTML = shown.map(function (x) {
      return '<button type="button" class="mrow" data-pr="' + esc(x.id) + '">' + rnbDisc('gold', x.audio ? 'mic' : 'spark') + '<span class="mrow-t"><span class="mrow-h">' + esc(x.title || 'Untitled word') + '</span><span class="mrow-s">' +
        esc([prophDate(x.date), x.from].filter(Boolean).join(' · ')) + (x.audio ? ' · voice note' : '') + '</span></span><span class="mrow-c">' + rnbIcon('chev', 18) + '</span></button>';
    }).join('');
    box.querySelectorAll('[data-pr]').forEach(function (el) { el.onclick = function () { openProph(el.dataset.pr); }; });
    if (!all.length) box.insertAdjacentHTML('afterend', '');
  }
  list('');
  if (!all.length) sheetBody.insertAdjacentHTML('beforeend', '<p class="hint" style="margin-top:1rem">No words kept yet.</p>');
  var q = document.getElementById('prQ'); if (q) q.oninput = function () { list(q.value); };
  document.getElementById('prNew').onclick = function () { openProph(null); };
}
async function openProph(id) {
  var x = id ? await prophGet(id) : null;
  if (!x) x = { id: 'pw' + Date.now(), title: '', from: '', date: todayYmd(), text: '', created: Date.now(), updated: Date.now() };
  var isNew = !id, url = null, stream = null, rec = null, chunks = [], t0 = 0, tick = null;
  openSheet(isNew ? 'New word' : 'Word'); var tok = sheetSeq;
  function stopAll() { if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } clearInterval(tick); }
  function refs(text) {
    var out = [], seen = {}, m; REF_RE.lastIndex = 0;
    while ((m = REF_RE.exec(text || ''))) { var b = findBook(m[1].replace(/\.$/, '')); if (b < 0 || +m[2] > BOOKS[b][1]) continue; var k = m[0]; if (!seen[k]) { seen[k] = 1; out.push({ label: k, b: b, c: +m[2], v1: +m[3], v2: +(m[4] || m[3]) }); } }
    return out;
  }
  function render() {
    if (url) { URL.revokeObjectURL(url); url = null; }
    if (x.audio) url = URL.createObjectURL(x.audio);
    var rf = refs(x.text);
    if (tok !== sheetSeq) return; sheetBody.innerHTML = '<button class="backlink" id="pwBack">‹ All words</button>' +
      '<label class="field"><span>Title</span><input type="text" id="pwTitle" placeholder="For example: A word about the farm" value="' + esc(x.title || '') + '"></label>' +
      '<div class="row2"><label class="field"><span>Given by (optional)</span><input type="text" id="pwFrom" value="' + esc(x.from || '') + '"></label>' +
      '<label class="field"><span>Date</span><input type="date" id="pwDate" value="' + esc(x.date || todayYmd()) + '"></label></div>' +
      '<label class="field"><span>The word</span><textarea id="pwText" placeholder="Type it, or paste it from Notes, WhatsApp or email…" style="min-height:12rem">' + esc(x.text || '') + '</textarea></label>' +
      '<div class="tagbox" id="pwTags"></div>' +
      (rf.length ? '<div class="mlab" style="margin-top:.4rem">Scriptures in this word</div><div class="refchips">' + rf.map(function (r, i) { return '<button type="button" data-rf="' + i + '">' + esc(r.label) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="mlab">Voice note</div>' +
      (x.audio ? '<audio controls src="' + url + '" style="width:100%"></audio><div class="actions"><button class="quiet" id="pwRec">Record again</button><button class="quiet" id="pwFile">Replace with a file</button><button class="danger" id="pwNoAudio">Remove voice note</button></div>'
        : '<div class="actions" style="margin-top:0"><button class="quiet" id="pwRec">Record</button><button class="quiet" id="pwFile">Add an audio file</button></div>') +
      '<input type="file" id="pwPick" accept="audio/*,.m4a,.mp3,.aac,.wav,.opus,.ogg" class="hidden"><p class="status" id="pwStat"></p>' +
      '<div class="actions" style="margin-top:1.4rem"><button class="primary" id="pwSave">Save</button>' + (isNew ? '' : '<button class="danger" id="pwDel">Delete this word</button>') + '</div>';
    var st = document.getElementById('pwStat');
    nvMountTags('pwTags', 'w:' + x.id);
    document.getElementById('pwBack').onclick = function () { stopAll(); openProphList(); };
    sheetBody.querySelectorAll('[data-rf]').forEach(function (el) { el.onclick = function () { var r = rf[+el.dataset.rf], vs = []; for (var v = r.v1; v <= r.v2 && vs.length < 200; v++) vs.push(v); stopAll(); closeSheet(); closeSearch(); leaveHome(); showChapter(r.b, r.c, vs); }; });
    function grab() { x.title = document.getElementById('pwTitle').value.trim(); x.from = document.getElementById('pwFrom').value.trim(); x.date = document.getElementById('pwDate').value || todayYmd(); x.text = document.getElementById('pwText').value; }
    async function save(msg) {
      grab(); x.updated = Date.now();
      if (!x.title && !x.text.trim() && !x.audio) { st.textContent = 'Add a title, the words, or a voice note first.'; return false; }
      try { await prophPut(x); isNew = false; if (msg) toast(msg); return true; }
      catch (e) { st.style.color = 'var(--name)'; st.textContent = e && e.message === 'nostore' ? 'This view can’t store words. Use the app from your home-screen icon.' : 'Couldn’t save. The device may be short of space.'; return false; }
    }
    document.getElementById('pwSave').onclick = async function () { if (await save('Saved')) { stopAll(); openProphList(); } };
    var del = document.getElementById('pwDel');
    if (del) del.onclick = async function () {
      if (del.dataset.armed !== '1') { del.dataset.armed = '1'; del.textContent = 'Tap again to delete'; return; }
      stopAll(); await prophDel(x.id); toast('Word deleted'); openProphList();
    };
    var na = document.getElementById('pwNoAudio');
    if (na) na.onclick = async function () { grab(); delete x.audio; delete x.mime; delete x.dur; await save('Voice note removed'); render(); };
    var pick = document.getElementById('pwPick');
    document.getElementById('pwFile').onclick = function () { pick.value = ''; pick.click(); };
    pick.onchange = async function () {
      var f = pick.files && pick.files[0]; if (!f) return;
      grab(); x.audio = f.slice(0, f.size, f.type || 'audio/mp4'); x.mime = f.type || 'audio/mp4'; x.audioName = f.name;
      if (await save('Voice note added')) render();
    };
    document.getElementById('pwRec').onclick = async function () {
      var btn = this;
      if (rec && rec.state === 'recording') { try { rec.stop(); } catch (e) {} return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { st.textContent = 'Recording isn’t available here. Use the app from your home-screen icon, or add an audio file.'; return; }
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
      catch (e) { st.textContent = 'The microphone wasn’t allowed. Allow it when asked, or add an audio file instead.'; return; }
      var mime = pickMime(); chunks = [];
      try { rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); } catch (e) { rec = new MediaRecorder(stream); }
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = async function () {
        stopAll();
        var dur = (Date.now() - t0) / 1000, blob = new Blob(chunks, { type: (rec.mimeType || mime || 'audio/mp4').split(';')[0] });
        rec = null;
        if (dur < 0.8 || !blob.size) { st.textContent = 'That was too short. Try again.'; btn.textContent = 'Record'; return; }
        grab(); x.audio = blob; x.mime = blob.type; x.dur = dur;
        if (await save('Voice note saved')) render();
      };
      rec.start(); t0 = Date.now();
      btn.textContent = '■ Stop recording';
      tick = setInterval(function () { st.textContent = 'Recording… ' + fmtDur((Date.now() - t0) / 1000); }, 250);
    };
  }
  render();
}
