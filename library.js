// Noble Vine Study & Discipleship · 2.9 · My library
// Standalone. A read-only, searchable copy of chosen Apple Notes folders (starting with BIBLE TEACHING).
// Apple Notes stays the master. A small Shortcut gathers the notes and copies them; the app takes that text,
// keeps it on this device, turns scripture references into links, and lists the notes under "Linked to this chapter".
// Nothing is ever written back to Apple Notes, and nothing here changes My dreams, My words or anything else.
'use strict';
var NVL = { db: null, wait: 'nvl-wait', sc: 'nvl-shortcut' };
function nvlGet(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
function nvlSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

(function () {
  var s = document.createElement('style');
  s.textContent = '.nvl-read{font-size:1.02rem;line-height:1.7;white-space:pre-wrap;word-wrap:break-word;margin-top:.8rem}' +
    '.nvl-ro{font-size:.82rem;opacity:.7;margin:.2rem 0 0}' +
    '.nvl-meta{display:flex;justify-content:space-between;gap:.6rem;font-size:.85rem;opacity:.75;margin:.8rem 0 .4rem}' +
    '.nvl-fold{font-size:.78rem;letter-spacing:.07em;text-transform:uppercase;opacity:.7;margin:1.1rem 0 .3rem}' +
    '.nvl-box{border:1px solid rgba(128,128,128,.35);border-radius:14px;padding:.9rem 1rem;margin:1rem 0}' +
    '.nvl-box h4{margin:0 0 .35rem;font-size:1rem}' +
    '.nvl-box textarea{width:100%;min-height:5.5rem;margin-top:.5rem;font:inherit;font-size:.9rem;box-sizing:border-box}' +
    '.nvl-help{margin-top:1rem;font-size:.92rem}.nvl-help summary{cursor:pointer;font-weight:600}.nvl-help ol{padding-left:1.2rem;margin:.6rem 0}.nvl-help li{margin:.35rem 0}' +
    '.nvl-help code{background:rgba(128,128,128,.18);border-radius:5px;padding:0 .3rem;word-break:break-all}';
  document.head.appendChild(s);
})();

// ---- storage (this device only) ----
function nvlOpenDb() {
  if (NVL.db) return Promise.resolve(NVL.db);
  return dbTimeout(new Promise(function (res) {
    try { var r = indexedDB.open('nrb-library', 1); r.onupgradeneeded = function () { r.result.createObjectStore('items', { keyPath: 'id' }); }; r.onsuccess = function () { NVL.db = r.result; res(NVL.db); }; r.onerror = function () { res(null); }; }
    catch (e) { res(null); }
  }));
}
async function nvlAll() {
  var db = await nvlOpenDb(); if (!db) return [];
  return new Promise(function (res) { var out = []; try { var cur = db.transaction('items').objectStore('items').openCursor(); cur.onsuccess = function () { var c = cur.result; if (c) { out.push(c.value); c.continue(); } else res(out); }; cur.onerror = function () { res(out); }; } catch (e) { res(out); } });
}
async function nvlGetOne(id) { var all = await nvlAll(); return all.filter(function (x) { return x.id === id; })[0] || null; }
// Replace every note belonging to the folders in this batch; other folders are left alone.
async function nvlStore(notes) {
  var db = await nvlOpenDb(); if (!db) throw new Error('nostore');
  var folders = {}; notes.forEach(function (n) { folders[n.folder] = 1; });
  var old = await nvlAll();
  return new Promise(function (res, rej) {
    var tx = db.transaction('items', 'readwrite'), os = tx.objectStore('items');
    old.forEach(function (o) { if (folders[o.folder]) os.delete(o.id); });
    notes.forEach(function (n) { os.put(n); });
    tx.oncomplete = res; tx.onerror = tx.onabort = function () { rej(tx.error || new Error('space')); };
  });
}

// ---- reading what the Shortcut copied ----
// Each note starts with a line like  ---NOTE: BIBLE TEACHING---  (or =====NOTE|BIBLE TEACHING=====) followed by the note's own text.
function nvlParse(text) {
  var out = [], t = String(text || '').replace(/\r\n?/g, '\n');
  var re = /^[=\-]{3,}\s*NOTE\s*[:|]?\s*([^\n=\-]*?)\s*[=\-]{3,}[ \t]*$/gim, marks = [], m;
  while ((m = re.exec(t))) marks.push({ at: m.index, end: m.index + m[0].length, folder: (m[1] || '').trim() || 'My library' });
  marks.forEach(function (mk, i) {
    var body = t.slice(mk.end, i + 1 < marks.length ? marks[i + 1].at : t.length).replace(/^\n+/, '').replace(/\s+$/, '');
    if (!body) return;
    var lines = body.split('\n'), title = '';
    while (lines.length && !title) title = lines.shift().trim();
    out.push({ folder: mk.folder, title: title || 'Untitled', text: lines.join('\n').replace(/^\n+/, '') });
  });
  var n = {}; out.forEach(function (o) { n[o.folder] = (n[o.folder] || 0) + 1; o.id = o.folder + '#' + n[o.folder]; o.n = n[o.folder]; });
  return out;
}
async function nvlImportText(text) {
  var notes = nvlParse(text);
  if (!notes.length) { toast('Nothing to import. Run the shortcut first, then try again.'); return false; }
  var stamp = Date.now(); notes.forEach(function (n) { n.imported = stamp; });
  try { await nvlStore(notes); } catch (e) { toast('Could not save the library on this device.'); return false; }
  nvlSet('nvl-last', String(stamp));
  toast('Library updated · ' + notes.length + (notes.length === 1 ? ' note' : ' notes'));
  return true;
}

// ---- the library screens ----
function nvlRefs(n) { return nvScanRefs((n.title || '') + ' ' + (n.text || '')); }
function nvlWhen() {
  var t = +nvlGet('nvl-last', '0'); if (!t) return 'Not refreshed yet';
  var d = new Date(t), now = new Date(), same = d.toDateString() === now.toDateString();
  return 'Last refreshed: ' + (same ? 'today, ' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ', ') + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
async function openLibrary(opts) {
  opts = opts || {};
  openSheet('My library'); var tok = sheetSeq;
  var all = await nvlAll(); if (tok !== sheetSeq) return;
  all.sort(function (a, z) { return a.folder.localeCompare(z.folder) || a.n - z.n; });
  var sc = nvlGet(NVL.sc, 'Send Library');
  sheetBody.innerHTML = '<p class="hint" style="margin-top:0">A read-only copy of your Apple Notes teaching folder. Apple Notes stays the master: change a note there, then tap Refresh. The copy stays on this device.</p>' +
    '<div class="actions" style="margin-top:0"><button class="primary" id="nvlRef">Refresh from Apple Notes</button></div>' +
    '<div class="nvl-box" id="nvlPaste"' + (opts.prompt ? '' : ' hidden') + '><h4>Ready to import</h4><p class="hint" style="margin:0">The shortcut has copied your notes. Tap below to bring them in (iOS may ask you to allow paste).</p>' +
    '<div class="actions"><button class="primary" id="nvlImp">Import the copied notes</button></div>' +
    '<textarea id="nvlTxt" placeholder="If that button does nothing, paste the copied text here" aria-label="Paste copied notes"></textarea><div class="actions"><button id="nvlImp2">Import pasted text</button></div></div>' +
    (all.length > 3 ? '<label class="field" style="margin-top:1rem"><span>Search your library</span><input type="text" id="nvlQ" placeholder="A word, a verse or a name"></label>' : '') +
    '<div class="nvl-meta"><span>' + esc(nvlWhen()) + '</span><span>' + all.length + (all.length === 1 ? ' note' : ' notes') + '</span></div><div id="nvlList"></div>' +
    (all.length ? '' : '<p class="hint">Nothing here yet. Tap Refresh to bring in your notes.</p>') +
    '<details class="nvl-help"><summary>Set up the shortcut (once)</summary><ol>' +
    '<li>In Shortcuts, make a new shortcut called <code id="nvlScName">' + esc(sc) + '</code>.</li>' +
    '<li>Add <b>Find Notes</b> where <b>Folder</b> is the folder you want (for example BIBLE TEACHING). If two folders share a name, pick the one that lists only that folder\'s notes.</li>' +
    '<li>Add <b>Repeat with Each</b> (it uses the notes it found).</li>' +
    '<li>Inside the repeat, add <b>Text</b>. Type <code>---NOTE: BIBLE TEACHING---</code>, press return, then insert the <b>Repeat Item</b> variable.</li>' +
    '<li>After <b>End Repeat</b>, add <b>Combine Text</b> (Repeat Results, with New Lines), then <b>Copy to Clipboard</b> (Combined Text).</li>' +
    '<li>If iOS says it cannot share that many notes: Settings, Apps, Shortcuts, Advanced, turn on <b>Allow Sharing Large Amounts of Data</b>.</li></ol>' +
    '<label class="field"><span>Shortcut name</span><input type="text" id="nvlSc" value="' + esc(sc) + '"></label>' +
    '<p class="hint">To add another folder later, add another Find Notes and Repeat block with its own folder name in the first line.</p></details>';
  function draw(q) {
    var ws = (q || '').toLowerCase().split(/\s+/).filter(Boolean), last = null, h = '';
    all.filter(function (n) { var t = (n.title + ' ' + n.text + ' ' + nvlRefs(n).map(nvRefLabel).join(' ')).toLowerCase(); return ws.every(function (w) { return t.indexOf(w) >= 0; }); }).forEach(function (n) {
      if (n.folder !== last) { h += '<div class="nvl-fold">' + esc(n.folder) + '</div>'; last = n.folder; }
      var rs = nvlRefs(n).slice(0, 3).map(nvRefLabel).join(', '), snip = (n.text || '').replace(/\s+/g, ' ').slice(0, 80);
      h += '<button type="button" class="mrow" data-nvl="' + esc(n.id) + '">' + rnbDisc('olive', 'book') + '<span class="mrow-t"><span class="mrow-h">' + esc(n.title) + '</span><span class="mrow-s">' + esc([snip, snip.indexOf(rs) < 0 ? rs : ''].filter(Boolean).join(' · ')) + '</span></span><span class="mrow-c">' + rnbIcon('chev', 18) + '</span></button>';
    });
    var box = document.getElementById('nvlList'); box.innerHTML = h || (all.length ? '<p class="hint">No notes match.</p>' : '');
    box.querySelectorAll('[data-nvl]').forEach(function (el) { el.onclick = function () { openLibNote(el.dataset.nvl); }; });
  }
  draw('');
  var q = document.getElementById('nvlQ'); if (q) q.oninput = function () { draw(q.value); };
  document.getElementById('nvlSc').oninput = function (e) { var v = e.target.value.trim() || 'Send Library'; nvlSet(NVL.sc, v); document.getElementById('nvlScName').textContent = v; };
  document.getElementById('nvlRef').onclick = function () {
    nvlSet(NVL.wait, String(Date.now()));
    document.getElementById('nvlPaste').hidden = false;
    window.location.href = 'shortcuts://run-shortcut?name=' + encodeURIComponent(nvlGet(NVL.sc, 'Send Library'));
  };
  async function done(txt) { if (await nvlImportText(txt)) { nvlSet(NVL.wait, ''); openLibrary(); } }
  document.getElementById('nvlImp').onclick = function () {
    if (!navigator.clipboard || !navigator.clipboard.readText) { toast('Paste the text into the box instead.'); return; }
    navigator.clipboard.readText().then(done, function () { toast('Paste the text into the box instead.'); });
  };
  document.getElementById('nvlImp2').onclick = function () { done(document.getElementById('nvlTxt').value); };
}
async function openLibNote(id) {
  var n = await nvlGetOne(id); if (!n) return;
  openSheet(n.folder); var tok = sheetSeq; if (tok !== sheetSeq) return;
  sheetBody.innerHTML = '<h3 style="margin:0">' + esc(n.title) + '</h3><p class="nvl-ro">Copy from Apple Notes · read-only</p><div class="nvl-read" id="nvlBody">' + esc(n.text || '') + '</div>' +
    '<div class="actions"><button id="nvlCp">Copy text</button><button id="nvlOpenN">Open Apple Notes</button><button id="nvlBk">‹ Library</button></div>';
  linkRefs(document.getElementById('nvlBody'));
  document.getElementById('nvlCp').onclick = function () { copyText(n.title + '\n\n' + (n.text || '')); };
  document.getElementById('nvlOpenN').onclick = function () { window.location.href = 'mobilenotes://'; };
  document.getElementById('nvlBk').onclick = function () { openLibrary(); };
}

// ---- menu row, beside My dreams ----
onReady(function () {
  new MutationObserver(function () {
    var d = document.getElementById('mDreams'); if (!d || document.getElementById('mLib')) return;
    d.insertAdjacentHTML('afterend', rnbMenuRow('mLib', 'olive', 'book', 'My library', 'Your Apple Notes teaching, to read and search'));
    document.getElementById('mLib').onclick = function () { openLibrary(); };
  }).observe(sheetBody, { childList: true, subtree: true });
});

// ---- coming back from the Shortcut: open the import step ----
document.addEventListener('visibilitychange', function () {
  if (document.hidden) return;
  var t = +nvlGet(NVL.wait, '0'); if (!t) return;
  if (Date.now() - t > 10 * 60 * 1000) { nvlSet(NVL.wait, ''); return; }
  openLibrary({ prompt: true });
});

// ---- notes with a verse show under "Linked to this chapter", like dreams and words ----
if (typeof nvLinkedFor === 'function') {
  var nvlLinkedFor0 = nvLinkedFor;
  nvLinkedFor = async function (b, c, verse) {
    var out = await nvlLinkedFor0(b, c, verse);
    try {
      (await nvlAll()).forEach(function (n) {
        var hs = nvlRefs(n).filter(function (r) { return r.b === b && r.c === c && (!verse || (verse >= r.v1 && verse <= r.v2)); });
        if (hs.length) out.push({ kind: 'Teaching', title: n.title, ref: nvRefLabel(hs[0]), c: 'olive', ic: 'book', open: function () { openLibNote(n.id); } });
      });
    } catch (e) {}
    return out;
  };
}
