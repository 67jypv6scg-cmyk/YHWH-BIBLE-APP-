// Noble Vine Study & Discipleship · 2.1.0 · Reading a chapter, selecting verses
'use strict';
// ======================================================================
// Rendering helpers
// ======================================================================
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
// fmtVerse lives in names.js, which shows the divine Names the way each reader chooses
var main = document.getElementById('main');
var toastEl = document.getElementById('toast');
var toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2200); }
function applyLook() {
  document.documentElement.setAttribute('data-theme', S.theme === 'light' ? 'light' : 'dark');
  document.documentElement.style.setProperty('--size', S.size + 'px');
}

// ======================================================================
// Reading view
// ======================================================================
var pos = { b: 0, c: 1 };
var selected = new Set();
function firstLoaded() {
  for (var b = 0; b < BOOKS.length; b++) for (var c = 1; c <= BOOKS[b][1]; c++) if (has(b, c)) return { b: b, c: c };
  return null;
}
function neighbour(dir) {
  var b = pos.b, c = pos.c;
  for (var guard = 0; guard < 1300; guard++) {
    c += dir;
    if (c < 1) { b--; if (b < 0) return null; c = BOOKS[b][1]; }
    if (c > BOOKS[b][1]) { b++; if (b >= BOOKS.length) return null; c = 1; }
    if (has(b, c)) return { b: b, c: c };
  }
  return null;
}
function showChapter(b, c, verses) {
  leaveHome();
  cmpView = null; hebView = null;
  if (planCtx) { var pc = planCtx.list[planCtx.i]; if (!pc || pc.b !== b || pc.c !== c) planCtx = null; }
  pos = { b: b, c: c };
  S.last = { b: b, c: c }; saveSettings();
  selected.clear(); updateSelbar();
  document.getElementById('refBtn').textContent = bn(b) + ' ' + c;
  var doc = chapters[key(b, c)];
  if (!doc) {
    if (!Object.keys(chapters).length) return renderEmpty();
    main.innerHTML = planBanner() + '<div class="empty"><h2>' + esc(BOOKS[b][0] + ' ' + c) + '</h2><p>This chapter hasn’t been imported yet.</p><button class="primary" id="impHere">Import it now</button></div>' + (planCtx ? planNavHtml() : '');
    document.getElementById('impHere').onclick = function () { openImport(b, c); };
    var em = main.querySelector('.empty'); if (em) { var cb = document.createElement('button'); cb.className = 'quiet'; cb.style.marginTop = '.8rem'; cb.textContent = 'Compare versions'; cb.onclick = function () { showCompare(b, c); }; em.appendChild(cb); }
    bindPlanBits();
    window.scrollTo(0, 0);
    return;
  }
  var noteAt = {}, notedV = {};
  notesForChapter(b, c).forEach(function (n) { (noteAt[n.v1] = noteAt[n.v1] || []).push(n); for (var v = n.v1; v <= n.v2; v++) notedV[v] = 1; });
  var favV = favsInChapter(b, c);
  var headAt = {};
  (doc.heads || []).forEach(function (h) { (headAt[h.v] = headAt[h.v] || []).push(h.t); });
  var html = planBanner() + '<h1 class="ch-title">' + esc(bn(b) + ' ' + c) + '</h1><p class="ch-sub">' + esc(S.bibleName ? S.bibleName : 'Restored Names Bible') + '</p>' + '<div style="display:flex;gap:.5rem;flex-wrap:wrap">' + (b < NT_START ? '<button class="hebbtn" id="toHeb">א Hebrew</button>' : '') + '<button class="hebbtn" id="toCmp">Compare</button><button class="hebbtn" id="toVoice">🎙 Record</button><button type="button" class="hebbtn" id="toPanel" aria-pressed="false">▥ Study panel</button></div>' + '<div class="text"><p>';
  doc.verses.forEach(function (x, i) {
    if (headAt[x.v]) {
      html += '</p>';
      headAt[x.v].forEach(function (h) { html += '<h2 class="shead">' + fmtVerse(h) + '</h2>'; });
      html += '<p>';
    }
    var marks = (noteAt[x.v] || []).map(function (n) { return '<button class="nmark" data-note="' + esc(n.id) + '" aria-label="Your note on ' + esc(vnoteRef(n)) + '">✎</button>'; }).join('');
    html += '<span class="v' + (notedV[x.v] ? ' noted' : '') + (favV[x.v] ? ' fav c-' + favV[x.v] : '') + '" data-v="' + x.v + '" id="v' + x.v + '"><span class="vn">' + x.v + '</span>' + marks + fmtVerse(x.t) + '</span> ';
  });
  html += '</p></div>';
  var prev = neighbour(-1), next = neighbour(1);
  if (planCtx) html += planNavHtml(); else html += '<nav class="chnav"><button id="prevCh"' + (prev ? '' : ' disabled') + '>‹ ' + (prev ? esc(BOOKS[prev.b][0] + ' ' + prev.c) : 'Start') + '</button>' +
          '<button id="nextCh"' + (next ? '' : ' disabled') + '>' + (next ? esc(BOOKS[next.b][0] + ' ' + next.c) : 'End') + ' ›</button></nav>';
  main.innerHTML = html;
  hebView = null;
  cmpView = null;
  var th = document.getElementById('toHeb'); if (th) th.onclick = function () { showHebrew(b, c); };
  var tc = document.getElementById('toCmp'); if (tc) tc.onclick = function () { showCompare(b, c); };
  var tpn = document.getElementById('toPanel'); if (tpn) tpn.onclick = nvPanelToggle;
  var tvo = document.getElementById('toVoice');
  if (tvo) { tvo.onclick = async function () { var own = await recGet(recKey('en', b, c, null)); if (own && !memSpeaking) { playOwn(own); toast('Playing your recording · tap again for options'); tvo.onclick = function () { stopOwn(); stopMem(); openRecorder({ lang: 'en', b: b, c: c, vs: null, text: versesHtml(b, c, null) }); }; } else { stopOwn(); stopMem(); openRecorder({ lang: 'en', b: b, c: c, vs: null, text: versesHtml(b, c, null) }); } }; refreshVoiceMarks(); }
  bindPlanBits();
  if (!planCtx) {
    if (prev) document.getElementById('prevCh').onclick = function () { showChapter(prev.b, prev.c); };
    if (next) document.getElementById('nextCh').onclick = function () { showChapter(next.b, next.c); };
  }
  main.querySelectorAll('.nmark').forEach(function (el) {
    el.addEventListener('click', function (e) { e.stopPropagation(); var n = vnotes[el.dataset.note]; if (n) openNoteEditor(n.book, n.ch, n.v1, n.v2, 'read'); });
  });
  main.querySelectorAll('.v').forEach(function (el) {
    el.addEventListener('click', function () {
      var v = +el.dataset.v;
      if (selected.has(v)) { selected.delete(v); el.classList.remove('sel'); } else { selected.add(v); el.classList.add('sel'); }
      updateSelbar();
    });
  });
  if (verses && verses.length) {
    var first = document.getElementById('v' + verses[0]);
    if (first) {
      first.scrollIntoView({ block: 'center' });
      verses.forEach(function (v) {
        var el = document.getElementById('v' + v);
        if (el) { el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 2200); }
      });
    }
  } else window.scrollTo(0, 0);
  setTimeout(nvNameTip, 600);
}
function renderEmpty() {
  leaveHome();
  document.getElementById('refBtn').textContent = 'Books';
  main.innerHTML = '<div class="empty"><div class="mark">יהוה</div><h2>Your Bible is empty</h2>' +
    '<p>Import your Bible text: a whole Bible file at once, or a few chapters at a time. The footnote marks are cleaned away and the Names are restored as each chapter goes in.</p>' +
    '<button class="primary" id="impFirst">Import chapters</button> <button class="quiet" id="impWhole">Import a whole Bible file</button><p class="status" style="margin-top:1.4rem">' + esc(storageNote()) + '</p></div>';
  document.getElementById('impFirst').onclick = function () { openImport(0, 1); };
  var iw = document.getElementById('impWhole'); if (iw) iw.onclick = openWholeImport;
}
function storageNote() {
  return store.mode === 'db' ? 'Saved to your account, so it’s the same on your iPad and phone.' : 'Saved on this device. Use Backup to move it to your other device.';
}
function updateSelbar() {
  var bar = document.getElementById('selbar');
  if (!selected.size) { bar.classList.add('hidden'); return; }
  document.getElementById('selLbl').textContent = refLabel(pos.b, pos.c, Array.from(selected));
  bar.classList.remove('hidden');
  nvPanelVerse();
}
function copyText(txt) {
  function fallback() {
    var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta); toast(ok ? 'Copied' : 'Couldn’t copy on this device');
  }
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast('Copied'); }, fallback); else fallback(); }
  catch (e) { fallback(); }
}
document.getElementById('selRec').onclick = function () { if (!selected.size) return; var vs = Array.from(selected).sort(function (a, z) { return a - z; }); openRecorder({ lang: 'en', b: pos.b, c: pos.c, vs: vs, text: versesHtml(pos.b, pos.c, vs) }); };
document.getElementById('selCom').onclick = function () { if (selected.size) openCommentary(pos.b, pos.c, Math.min.apply(null, Array.from(selected))); };
document.getElementById('selMem').onclick = function () { if (selected.size) openMemAdd(pos.b, pos.c, Array.from(selected)); };
document.getElementById('selFav').onclick = function () { favToggleSelected(); };
document.getElementById('selCopy').onclick = function () {
  var doc = chapters[key(pos.b, pos.c)]; if (!doc) return;
  var vs = Array.from(selected).sort(function (a, z) { return a - z; });
  var body = doc.verses.filter(function (x) { return selected.has(x.v); })
    .map(function (x) { return (vs.length > 1 ? x.v + ' ' : '') + nameText(x.t); }).join(' ');
  copyText('“' + body + '” (' + refLabel(pos.b, pos.c, vs) + ')');
};
document.getElementById('selClear').onclick = function () {
  selected.clear(); main.querySelectorAll('.v.sel').forEach(function (e) { e.classList.remove('sel'); }); updateSelbar();
};
