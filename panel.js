// Noble Vine Study & Discipleship · 2.1.0 · Study panel: the Bible beside Hebrew, commentary, Compare or notes
'use strict';
// ======================================================================
// Study panel. On a wide screen it sits beside the text; on an upright phone it slides up
// over the lower half. It follows the verse you tap, or the verse at the top as you scroll.
// ======================================================================
var nvPanel = { el: null, b: -1, c: -1, v: 1, seq: 0, tall: false, scrollT: null };
var NV_PANEL_TABS = [['heb', 'Hebrew', 'blue'], ['com', 'Commentary', 'stone'], ['cmp', 'Compare', 'olive'], ['notes', 'Notes', 'purple']];
function nvPanelWide() { return window.innerWidth >= 820 && window.innerWidth > window.innerHeight * 0.95; }
function nvPanelTab() { var t = S.panelTab || 'heb'; if (t === 'heb' && nvPanel.b >= NT_START) return 'com'; return t; }
function nvPanelReading() { return !homeOn && !!main.querySelector('.text') && has(pos.b, pos.c); }
function nvPanelEnsure() {
  if (nvPanel.el) return nvPanel.el;
  var el = nvPanel.el = document.createElement('aside');
  el.id = 'nvPanel'; el.className = 'nvpanel'; el.setAttribute('aria-label', 'Study panel'); el.hidden = true;
  el.innerHTML = '<div class="nvp-handle" id="nvpHandle" role="button" tabindex="0" aria-label="Make the panel taller or shorter"><span></span></div>' +
    '<div class="nvp-head"><span class="nvp-t" id="nvpTitle">Study panel</span><button type="button" class="nvp-x" id="nvpClose" aria-label="Close the study panel">✕</button></div>' +
    '<div class="nvp-tabs" role="tablist" aria-label="Study panel">' + NV_PANEL_TABS.map(function (t) { return '<button type="button" role="tab" class="nvp-tab c-' + t[2] + '" data-pt="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
    '<div class="nvp-body" id="nvpBody" role="tabpanel"></div>';
  document.body.appendChild(el);
  document.getElementById('nvpClose').onclick = function () { S.panelOn = false; saveSettings(); nvPanelUpdate(); };
  var hd = document.getElementById('nvpHandle');
  hd.onclick = function () { nvPanel.tall = !nvPanel.tall; el.classList.toggle('tall', nvPanel.tall); };
  hd.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hd.onclick(); } };
  el.querySelectorAll('[data-pt]').forEach(function (b) { b.onclick = function () { S.panelTab = b.dataset.pt; saveSettings(); nvPanelRender(); }; });
  return el;
}
// Show or hide the panel to match the screen: only while reading a chapter, and only when switched on
function nvPanelUpdate() {
  var on = S.panelOn && nvPanelReading();
  var el = nvPanelEnsure();
  el.hidden = !on;
  document.body.classList.toggle('panel-on', !!on);
  document.body.classList.toggle('panel-side', !!on && nvPanelWide());
  var tb = document.getElementById('toPanel'); if (tb) { tb.classList.toggle('on', !!S.panelOn); tb.setAttribute('aria-pressed', S.panelOn ? 'true' : 'false'); }
  if (!on) return;
  if (nvPanel.b !== pos.b || nvPanel.c !== pos.c) { nvPanel.b = pos.b; nvPanel.c = pos.c; nvPanel.v = selected.size ? Math.min.apply(null, Array.from(selected)) : nvPanelTopVerse(); }
  nvPanelRender();
}
function nvPanelToggle() { S.panelOn = !S.panelOn; saveSettings(); nvPanelUpdate(); if (S.panelOn) toast('Tap a verse to study it in the panel'); }
function nvPanelTopVerse() {
  var vs = main.querySelectorAll('.v'), top = (document.body.classList.contains('panel-side') ? 0 : 0) + 90;
  for (var i = 0; i < vs.length; i++) { var r = vs[i].getBoundingClientRect(); if (r.bottom > top) return +vs[i].dataset.v; }
  return 1;
}
// The verse to study: the first selected verse, otherwise the one at the top of the screen
function nvPanelVerse() {
  if (!S.panelOn || !nvPanel.el || nvPanel.el.hidden) return;
  var v = selected.size ? Math.min.apply(null, Array.from(selected)) : nvPanelTopVerse();
  if (v !== nvPanel.v) { nvPanel.v = v; nvPanelRender(); }
}
window.addEventListener('scroll', function () {
  if (!S.panelOn || selected.size || !nvPanel.el || nvPanel.el.hidden) return;
  clearTimeout(nvPanel.scrollT); nvPanel.scrollT = setTimeout(nvPanelVerse, 250);
}, { passive: true });
window.addEventListener('resize', function () { if (nvPanel.el && !nvPanel.el.hidden) nvPanelUpdate(); });
async function nvPanelRender() {
  var el = nvPanelEnsure(), body = document.getElementById('nvpBody'), tab = nvPanelTab(), b = nvPanel.b, c = nvPanel.c, v = nvPanel.v, my = ++nvPanel.seq;
  document.getElementById('nvpTitle').textContent = 'Study panel · ' + bn(b) + ' ' + c + ':' + v;
  el.querySelectorAll('[data-pt]').forEach(function (t) { var on = t.dataset.pt === tab; t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.hidden = t.dataset.pt === 'heb' && b >= NT_START; });
  var h = '';
  try {
    if (tab === 'heb') h = await nvPanelHebrew(b, c, v);
    else if (tab === 'com') h = await nvPanelCommentary(b, c, v);
    else if (tab === 'cmp') h = await nvPanelCompare(b, c, v);
    else h = nvPanelNotes(b, c, v);
  } catch (e) { h = '<p class="hint">This couldn’t be loaded (' + esc((e && e.message) || 'error') + '). Check your connection and try again.</p>'; }
  if (my !== nvPanel.seq) return;
  body.innerHTML = h; body.scrollTop = 0;
  nvPanelBind(body, b, c, v, tab);
}
async function nvPanelHebrew(b, c, v) {
  var set = hebSetFor(b); if (!set) return '<p class="hint">Hebrew is available for the Tanakh, Genesis to Malachi.</p>';
  var data = await hebBook(b);
  if (!data) return '<p class="hint">The Hebrew for ' + esc(set.label) + ' isn’t on this device yet. It’s a one-time download of ' + esc(set.size) + '; Wi-Fi is best.</p>' +
    (window.claude ? '<p class="hint">Download it in your installed app, from the home-screen icon.</p>' : '<div class="actions"><button type="button" class="primary" id="nvpHebGet">Download the Hebrew</button></div><p class="status" id="nvpHebStat"></p>');
  var ws = data[c] && data[c][v];
  if (!ws) return '<p class="hint">No Hebrew found for verse ' + v + '.</p>';
  return '<div class="nvp-k c-blue">Verse ' + v + ' · Hebrew, sound, meaning</div><div class="nvp-words">' + ws.map(function (w, i) {
    return '<button type="button" class="nvp-w" data-pw="' + i + '"><span class="h" dir="rtl">' + esc(w[0]) + '</span><span class="t">' + esc(w[1]) + '</span><span class="g">' + esc(w[2] || '–') + '</span></button>';
  }).join('') + '</div><p class="status">Tap a word for its full study. Hebrew: STEP Bible, CC BY 4.0.</p>';
}
async function nvPanelCommentary(b, c, v) {
  var list = commOn().filter(function (x) { return !(x.ot && b >= NT_START); });
  if (!list.length) list = COMMS.filter(function (x) { return x.id === 'tyndale'; });
  var cur = list.filter(function (x) { return x.id === S.commPick; })[0] || list[0];
  var head = '<div class="nvp-chips">' + list.map(function (x) { return '<button type="button" class="nvp-chip' + (x.id === cur.id ? ' on' : '') + '" data-pc="' + x.id + '">' + esc(x.label) + '</button>'; }).join('') + '</div>';
  if (window.claude) return head + '<p class="hint">Commentaries download in your installed app.</p>';
  var ch = await commChapter(cur.id, b, c);
  if (ch.none) return head + '<p class="hint">' + esc(cur.name) + ' doesn’t cover ' + esc(bn(b)) + '. Try another above.</p>';
  var t = ch.v[v], from = v;
  if (!t) { var ks = Object.keys(ch.v).map(Number).filter(function (n) { return n < v; }).sort(function (a, z) { return z - a; }); if (ks.length) { from = ks[0]; t = ch.v[from]; } }
  if (!t) return head + '<p class="hint">No note on verse ' + v + '.</p>';
  var short = t.length > 1400 ? t.slice(0, 1400).replace(/\s+\S*$/, '') + ' …' : t;
  return head + '<div class="nvp-k c-stone">Verse ' + v + ' · ' + esc(cur.name) + '</div>' + (from !== v ? '<p class="status">This note, on verse ' + from + ', covers it.</p>' : '') +
    '<div class="cmbody">' + paras(short) + '</div>' + (short !== t ? '<div class="actions"><button type="button" class="quiet" id="nvpComFull">Read the full note</button></div>' : '') +
    '<p class="status">' + esc(cur.name) + ': ' + esc(cur.lic) + '.</p>';
}
async function nvPanelCompare(b, c, v) {
  var sel = cmpSel(), meta = await verLoadMeta(), out = '<div class="nvp-k c-olive">Verse ' + v + '</div>';
  for (var i = 0; i < sel.length; i++) {
    var id = sel[i], ver = VERSIONS.filter(function (x) { return x.id === id; })[0]; if (!ver) continue;
    var tx = await verChapter(id, b, c), t = tx && tx[v];
    out += '<div class="cmpr"><span class="lbl" data-v="' + id + '">' + esc(ver.label) + '</span><span class="txt' + (t ? '' : ' miss') + '">' +
      (t ? (id === 'esv' ? fmtVerse(t) : esc(t)) : (id === 'esv' ? 'Not imported yet' : meta[id] ? 'Not in this version' : 'Not downloaded yet: open Compare to download it')) + '</span></div>';
  }
  return out + '<div class="actions"><button type="button" class="quiet" id="nvpCmpFull">Open Compare for the whole chapter</button></div>';
}
function nvPanelNotes(b, c, v) {
  var ns = notesForChapter(b, c);
  var h = '<div class="nvp-k c-purple">Your notes · ' + esc(bn(b) + ' ' + c) + '</div>';
  if (!ns.length) h += '<p class="hint">No notes on this chapter yet.</p>';
  ns.forEach(function (n) {
    var here = v >= n.v1 && v <= n.v2;
    var tags = nvTagsOf('v:' + n.id).map(function (id) { var t = nvTagById(id); return t ? '<span class="tchip sm c-' + t.color + '">' + esc(t.name) + '</span>' : ''; }).join(' ');
    h += '<button type="button" class="nvp-note' + (here ? ' here' : '') + '" data-pn="' + esc(n.id) + '"><span class="nvp-nref">' + esc(vnoteRef(n)) + '</span><span class="nvp-ntxt">' + esc(noteSnippet(n.text, 400)) + '</span>' + (tags ? '<span class="tchips">' + tags + '</span>' : '') + '</button>';
  });
  return h + '<button type="button" class="nvp-add" id="nvpAdd">+ Write a note on verse ' + v + '</button>';
}
function nvPanelBind(body, b, c, v, tab) {
  body.querySelectorAll('[data-pw]').forEach(function (el) {
    el.onclick = async function () { var d = await hebBook(b), ws = d[c][v], i = +el.dataset.pw; openWordStudy({ b: b, c: c, v: v, i: i, n: ws.length, w: ws[i] }); };
  });
  var hg = document.getElementById('nvpHebGet');
  if (hg) hg.onclick = async function () { var st = document.getElementById('nvpHebStat'); hg.disabled = true; try { await hebDownload(hebSetFor(b), function (m) { st.textContent = m; }); nvPanelRender(); } catch (e) { hg.disabled = false; st.textContent = 'The download didn’t work. Check your connection and try again.'; } };
  body.querySelectorAll('[data-pc]').forEach(function (el) { el.onclick = function () { S.commPick = el.dataset.pc; saveSettings(); nvPanelRender(); }; });
  var cf = document.getElementById('nvpComFull'); if (cf) cf.onclick = function () { openCommentary(b, c, v); };
  var cm = document.getElementById('nvpCmpFull'); if (cm) cm.onclick = function () { showCompare(b, c, v); };
  body.querySelectorAll('[data-pn]').forEach(function (el) { el.onclick = function () { var n = vnotes[el.dataset.pn]; if (n) openNoteEditor(n.book, n.ch, n.v1, n.v2, 'read'); }; });
  var ad = document.getElementById('nvpAdd'); if (ad) ad.onclick = function () { openNoteEditor(b, c, v, v, 'read'); };
}
// When a note is saved, keep the Notes tab fresh
function nvPanelRefreshNotes() { if (nvPanel.el && !nvPanel.el.hidden && nvPanelTab() === 'notes') nvPanelRender(); }
onReady(function () {
  // Whenever the main screen changes (a chapter, Hebrew, Compare, search, Home), show or hide the panel to match
  new MutationObserver(function () { nvPanelUpdate(); }).observe(main, { childList: true });
});
