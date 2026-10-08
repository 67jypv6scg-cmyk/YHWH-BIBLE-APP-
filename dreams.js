// Noble Vine Study & Discipleship · 2.3.0 · My dreams
'use strict';
// ---- My dreams: typed, pasted or recorded, with scriptures linked; kept only on this device (and in your own backups) ----
var dreamDb = null;
function dreamOpen() {
  if (dreamDb) return Promise.resolve(dreamDb);
  return dbTimeout(new Promise(function (res) {
    try { var r = indexedDB.open('nrb-dreams', 1); r.onupgradeneeded = function () { r.result.createObjectStore('items', { keyPath: 'id' }); }; r.onsuccess = function () { dreamDb = r.result; res(dreamDb); }; r.onerror = function () { res(null); }; }
    catch (e) { res(null); }
  }));
}
async function dreamAll() { var db = await dreamOpen(); if (!db) return []; return new Promise(function (res) { var out = []; try { var cur = db.transaction('items').objectStore('items').openCursor(); cur.onsuccess = function () { var c = cur.result; if (c) { out.push(c.value); c.continue(); } else res(out); }; cur.onerror = function () { res(out); }; } catch (e) { res(out); } }); }
async function dreamGet(id) { var db = await dreamOpen(); if (!db) return null; return new Promise(function (res) { try { var q = db.transaction('items').objectStore('items').get(id); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; } catch (e) { res(null); } }); }
async function dreamPut(x) { var db = await dreamOpen(); if (!db) throw new Error('nostore'); return new Promise(function (res, rej) { var tx = db.transaction('items', 'readwrite'); tx.objectStore('items').put(x); tx.oncomplete = res; tx.onerror = tx.onabort = function () { rej(tx.error || new Error('space')); }; }); }
async function dreamDel(id) { var db = await dreamOpen(); if (!db) return; return new Promise(function (res) { var tx = db.transaction('items', 'readwrite'); tx.objectStore('items').delete(id); tx.oncomplete = res; tx.onerror = res; }); }
async function dreamExport() { var all = await dreamAll(), out = []; for (var i = 0; i < all.length; i++) { var x = Object.assign({}, all[i]); if (x.audio) { x.audioData = await blobToDataURL(x.audio); delete x.audio; } out.push(x); } return out; }
async function dreamImport(x) {
  if (!x || !x.id) return;
  var have = await dreamGet(x.id); if (have && (have.updated || 0) >= (x.updated || 0)) return;
  var y = Object.assign({}, x); if (y.audioData) { y.audio = dataURLToBlob(y.audioData); delete y.audioData; }
  await dreamPut(y);
}
function dreamDate(s) { try { return parseYmd(s).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return s || ''; } }

// ---- scripture references (shared with My words) ----
function nvRefLabel(r) { return BOOKS[r.b][0] + ' ' + r.c + ':' + r.v1 + (r.v2 > r.v1 ? '–' + r.v2 : ''); }
function nvScanRefs(text) {
  var out = [], seen = {}, m; REF_RE.lastIndex = 0;
  while ((m = REF_RE.exec(text || ''))) {
    var b = findBook(m[1].replace(/\.$/, '')); if (b < 0 || +m[2] > BOOKS[b][1]) continue;
    var r = { b: b, c: +m[2], v1: +m[3], v2: +(m[4] || m[3]) }; if (r.v2 < r.v1) r.v2 = r.v1;
    var k = r.b + '.' + r.c + '.' + r.v1 + '.' + r.v2; if (!seen[k]) { seen[k] = 1; out.push(r); }
  }
  return out;
}
// Linked (chosen) plus found in the text
function dreamRefs(x) {
  var seen = {}, out = [];
  (x.refs || []).concat(nvScanRefs((x.title || '') + ' ' + (x.text || ''))).forEach(function (r) { var k = r.b + '.' + r.c + '.' + r.v1 + '.' + r.v2; if (!seen[k]) { seen[k] = 1; out.push(r); } });
  return out;
}
function nvRefText(r) {
  var doc = chapters[key(r.b, r.c)]; if (!doc) return '';
  return doc.verses.filter(function (v) { return v.v >= r.v1 && v.v <= r.v2; }).map(function (v) { return v.t; }).join(' ');
}
function nvOpenRef(r) { var vs = []; for (var v = r.v1; v <= r.v2 && vs.length < 200; v++) vs.push(v); closeSheet(); closeSearch(); leaveHome(); showChapter(r.b, r.c, vs); }
// Dreams and words that touch a chapter (verse = optional)
async function nvLinkedFor(b, c, verse) {
  var out = [];
  function hit(refs) { return refs.some(function (r) { return r.b === b && r.c === c && (!verse || (verse >= r.v1 && verse <= r.v2)); }); }
  try { (await dreamAll()).forEach(function (x) { var hs = dreamRefs(x).filter(function (r) { return r.b === b && r.c === c && (!verse || (verse >= r.v1 && verse <= r.v2)); }); if (hs.length) out.push({ kind: 'Dream', title: x.title || 'Untitled dream', ref: nvRefLabel(hs[0]), c: 'indigo', ic: 'moon', open: function () { openDream(x.id); } }); }); } catch (e) {}
  try { (await prophAll()).forEach(function (x) { var rs = nvScanRefs((x.title || '') + ' ' + (x.text || '')); var hs = rs.filter(function (r) { return r.b === b && r.c === c && (!verse || (verse >= r.v1 && verse <= r.v2)); }); if (hs.length) out.push({ kind: 'Word', title: x.title || 'Untitled word', ref: nvRefLabel(hs[0]), c: 'gold', ic: 'spark', open: function () { openProph(x.id); } }); }); } catch (e) {}
  return out;
}
// At the foot of a chapter: "Linked to this chapter"
async function nvLinkedStrip(b, c) {
  var items = await nvLinkedFor(b, c); if (!items.length) return;
  if (pos.b !== b || pos.c !== c) return;
  var nav = main.querySelector('.chnav, .plannav'); var box = document.createElement('div'); box.className = 'nvlink';
  box.innerHTML = '<div class="nsec">Linked to this chapter · ' + items.length + '</div><div class="mgrp">' + items.map(function (x, i) {
    return '<button type="button" class="mrow" data-ln="' + i + '">' + rnbDisc(x.c, x.ic, 36) + '<span class="mrow-t"><span class="jk c-' + x.c + '">' + x.kind + ' · ' + esc(x.ref) + '</span><span class="mrow-h">' + esc(x.title) + '</span></span><span class="mrow-c">' + rnbIcon('chev', 18) + '</span></button>';
  }).join('') + '</div>';
  if (nav) nav.parentNode.insertBefore(box, nav); else main.appendChild(box);
  box.querySelectorAll('[data-ln]').forEach(function (el) { el.onclick = function () { items[+el.dataset.ln].open(); }; });
}

async function openDreamList() {
  openSheet('My dreams'); var tok = sheetSeq;
  if (tok !== sheetSeq) return; sheetBody.innerHTML = '<p class="hint">Loading…</p>';
  var all = (await dreamAll()).sort(function (a, z) { return (z.date || '').localeCompare(a.date || '') || (z.created || 0) - (a.created || 0); });
  if (tok !== sheetSeq) return; sheetBody.innerHTML = '<p class="hint" style="margin-top:0">Keep your dreams: speak them, type them, or paste them from another app, and link the scriptures that come to mind. They stay on this device only, never on GitHub, and travel only in your own backups.</p>' +
    '<div class="actions" style="margin-top:0"><button class="primary" id="drNew">+ New dream</button></div>' +
    (all.length > 3 ? '<label class="field" style="margin-top:1rem"><span>Search your dreams</span><input type="text" id="drQ" placeholder="A word, a place, a verse or a name"></label>' : '') +
    '<div class="mgrp" id="drList" style="margin-top:1rem"></div>';
  function list(q) {
    var ws = (q || '').toLowerCase().split(/\s+/).filter(Boolean);
    var shown = all.filter(function (x) { var t = ((x.title || '') + ' ' + (x.place || '') + ' ' + (x.text || '') + ' ' + dreamRefs(x).map(nvRefLabel).join(' ')).toLowerCase(); return ws.every(function (w) { return t.indexOf(w) >= 0; }); });
    var box = document.getElementById('drList');
    box.style.display = shown.length ? '' : 'none';
    box.innerHTML = shown.map(function (x) {
      var rs = dreamRefs(x).slice(0, 3).map(nvRefLabel).join(', ');
      return '<button type="button" class="mrow" data-dr="' + esc(x.id) + '">' + rnbDisc('indigo', x.audio ? 'mic' : 'moon') + '<span class="mrow-t"><span class="mrow-h">' + esc(x.title || 'Untitled dream') + '</span><span class="mrow-s">' +
        esc([dreamDate(x.date), rs].filter(Boolean).join(' · ')) + (x.audio ? ' · voice note' : '') + '</span></span><span class="mrow-c">' + rnbIcon('chev', 18) + '</span></button>';
    }).join('');
    box.querySelectorAll('[data-dr]').forEach(function (el) { el.onclick = function () { openDream(el.dataset.dr); }; });
  }
  list('');
  if (!all.length) sheetBody.insertAdjacentHTML('beforeend', '<p class="hint" style="margin-top:1rem">No dreams kept yet.</p>');
  var q = document.getElementById('drQ'); if (q) q.oninput = function () { list(q.value); };
  document.getElementById('drNew').onclick = function () { openDream(null); };
}
async function openDream(id) {
  var x = id ? await dreamGet(id) : null;
  if (!x) x = { id: 'dr' + Date.now(), title: '', place: '', date: todayYmd(), text: '', refs: [], created: Date.now(), updated: Date.now() };
  if (!x.refs) x.refs = [];
  var isNew = !id, url = null, stream = null, rec = null, chunks = [], t0 = 0, tick = null, adding = false, draft = null;
  openSheet(isNew ? 'New dream' : 'Dream'); var tok = sheetSeq;
  function stopAll() { if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } clearInterval(tick); }
  function render() {
    if (url) { URL.revokeObjectURL(url); url = null; }
    if (x.audio) url = URL.createObjectURL(x.audio);
    var linked = x.refs, auto = dreamRefs({ refs: [], title: x.title, text: x.text }).filter(function (r) { return !linked.some(function (l) { return l.b === r.b && l.c === r.c && l.v1 === r.v1 && l.v2 === r.v2; }); });
    function card(r, i, removable) {
      var t = nvRefText(r);
      return '<div class="drref"><div class="drref-h">' + esc(nvRefLabel(r)) + '</div>' + (t ? '<div class="drref-t">' + fmtVerse(t.length > 260 ? t.slice(0, 257) + '…' : t) + '</div>' : '<div class="drref-t" style="opacity:.6">This chapter isn’t imported on this device yet.</div>') +
        '<div class="drref-a"><button type="button" class="quiet" data-ro="' + i + (removable ? '' : 'a') + '">Open</button>' + (removable ? '<button type="button" class="quiet" data-rx="' + i + '">Remove</button>' : '') + '</div></div>';
    }
    if (tok !== sheetSeq) return; sheetBody.innerHTML = '<button class="backlink" id="drBack">‹ All dreams</button>' +
      '<label class="field"><span>Title</span><input type="text" id="drTitle" placeholder="For example: The open door" value="' + esc(x.title || '') + '"></label>' +
      '<div class="row2"><label class="field"><span>Place or context (optional)</span><input type="text" id="drPlace" value="' + esc(x.place || '') + '"></label>' +
      '<label class="field"><span>Date</span><input type="date" id="drDate" value="' + esc(x.date || todayYmd()) + '"></label></div>' +
      '<label class="field"><span>The dream</span><textarea id="drText" placeholder="Type it, speak it below, or paste it from Notes, WhatsApp or email…" style="min-height:12rem">' + esc(x.text || '') + '</textarea></label>' +
      '<div class="mlab">Scriptures that come to mind</div>' +
      (linked.map(function (r, i) { return card(r, i, true); }).join('') || '<p class="hint" style="margin-top:0">None linked yet.</p>') +
      (auto.length ? '<div class="mlab" style="margin-top:.8rem">Found in your words</div><div class="refchips">' + auto.map(function (r, i) { return '<button type="button" data-ra="' + i + '">' + esc(nvRefLabel(r)) + '</button>'; }).join('') + '</div>' : '') +
      (adding ? '<div class="drref" style="margin-top:.8rem"><label class="field" style="margin:0"><span>Reference, for example John 10:9 or Rev 3:7-8</span><input type="text" id="drRef" autocapitalize="words" autocomplete="off" placeholder="Book chapter:verse"></label><div id="drPrev" class="drref-t"></div><div class="actions" style="margin-top:.6rem"><button class="primary" id="drAddGo">Add to this dream</button><button class="quiet" id="drAddNo">Cancel</button></div></div>'
        : '<div class="actions" style="margin-top:.6rem"><button class="quiet" id="drAdd">+ Add scripture</button></div>') +
      '<div class="tagbox" id="drTags"></div>' +
      '<div class="mlab">Voice note</div>' +
      (x.audio ? '<audio controls src="' + url + '" style="width:100%"></audio><div class="actions"><button class="quiet" id="drRec">Record again</button><button class="quiet" id="drFile">Replace with a file</button><button class="danger" id="drNoAudio">Remove voice note</button></div>'
        : '<div class="actions" style="margin-top:0"><button class="quiet" id="drRec">Record</button><button class="quiet" id="drFile">Add an audio file</button></div>') +
      '<input type="file" id="drPick" accept="audio/*,.m4a,.mp3,.aac,.wav,.opus,.ogg" class="hidden"><p class="status" id="drStat"></p>' +
      '<div class="actions" style="margin-top:1.4rem"><button class="primary" id="drSave">Save</button>' + (isNew ? '' : '<button class="danger" id="drDel">Delete this dream</button>') + '</div>';
    var st = document.getElementById('drStat');
    nvMountTags('drTags', 'd:' + x.id);
    function grab() { x.title = document.getElementById('drTitle').value.trim(); x.place = document.getElementById('drPlace').value.trim(); x.date = document.getElementById('drDate').value || todayYmd(); x.text = document.getElementById('drText').value; }
    async function save(msg) {
      grab(); x.updated = Date.now();
      if (!x.title && !x.text.trim() && !x.audio && !x.refs.length) { st.textContent = 'Add a title, the dream, a scripture or a voice note first.'; return false; }
      try { await dreamPut(x); isNew = false; if (msg) toast(msg); return true; }
      catch (e) { st.style.color = 'var(--name)'; st.textContent = e && e.message === 'nostore' ? 'This view can’t store dreams. Use the app from your home-screen icon.' : 'Couldn’t save. The device may be short of space.'; return false; }
    }
    document.getElementById('drBack').onclick = function () { stopAll(); openDreamList(); };
    sheetBody.querySelectorAll('[data-ro]').forEach(function (el) { el.onclick = function () { var k = el.dataset.ro; stopAll(); nvOpenRef(k.slice(-1) === 'a' ? auto[parseInt(k, 10)] : linked[+k]); }; });
    sheetBody.querySelectorAll('[data-rx]').forEach(function (el) { el.onclick = function () { grab(); x.refs.splice(+el.dataset.rx, 1); render(); }; });
    sheetBody.querySelectorAll('[data-ra]').forEach(function (el) { el.onclick = function () { grab(); x.refs.push(auto[+el.dataset.ra]); render(); }; });
    var ad = document.getElementById('drAdd'); if (ad) ad.onclick = function () { grab(); adding = true; render(); setTimeout(function () { var i = document.getElementById('drRef'); if (i) i.focus(); }, 50); };
    var no = document.getElementById('drAddNo'); if (no) no.onclick = function () { grab(); adding = false; render(); };
    var ri = document.getElementById('drRef');
    if (ri) {
      function parse() {
        var p = parseRef(ri.value), pv = document.getElementById('drPrev'); draft = null;
        if (!ri.value.trim()) { pv.textContent = ''; return; }
        if (!p || !p.c || !p.vs.length) { pv.textContent = 'Include a chapter and verse, for example John 10:9.'; return; }
        draft = { b: p.b, c: p.c, v1: p.vs[0], v2: p.vs[p.vs.length - 1] };
        var t = nvRefText(draft); pv.innerHTML = '<b>' + esc(nvRefLabel(draft)) + '</b> ' + (t ? fmtVerse(t.length > 260 ? t.slice(0, 257) + '…' : t) : '<span style="opacity:.6">(text not imported on this device)</span>');
      }
      ri.oninput = parse; ri.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('drAddGo').click(); } };
      document.getElementById('drAddGo').onclick = function () { parse(); if (!draft) return; grab(); x.refs.push(draft); adding = false; draft = null; render(); };
    }
    document.getElementById('drSave').onclick = async function () { if (await save('Saved')) { stopAll(); openDreamList(); } };
    var del = document.getElementById('drDel');
    if (del) del.onclick = async function () {
      if (del.dataset.armed !== '1') { del.dataset.armed = '1'; del.textContent = 'Tap again to delete'; return; }
      stopAll(); await dreamDel(x.id); toast('Dream deleted'); openDreamList();
    };
    var na = document.getElementById('drNoAudio');
    if (na) na.onclick = async function () { grab(); delete x.audio; delete x.mime; delete x.dur; await save('Voice note removed'); render(); };
    var pick = document.getElementById('drPick');
    document.getElementById('drFile').onclick = function () { pick.value = ''; pick.click(); };
    pick.onchange = async function () {
      var f = pick.files && pick.files[0]; if (!f) return;
      grab(); x.audio = f.slice(0, f.size, f.type || 'audio/mp4'); x.mime = f.type || 'audio/mp4'; x.audioName = f.name;
      if (await save('Voice note added')) render();
    };
    document.getElementById('drRec').onclick = async function () {
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
