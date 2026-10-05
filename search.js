// Noble Vine Study & Discipleship · 2.0.1 · Search for references, words and #themes
'use strict';
// ======================================================================
// Search: references and words
// ======================================================================
var qEl = document.getElementById('q'), qx = document.getElementById('qx');
var scope = 'all', shown = 150;
function parseRef(q) {
  var m = q.trim().match(/^((?:[1-3]|i{1,3})?\s*[A-Za-z][A-Za-z .]*?)\s*(\d{1,3})?(?:\s*[:.]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?\s*$/i);
  if (!m) return null;
  var b = findBook(m[1]);
  if (b < 0) return null;
  var c = m[2] ? Math.min(+m[2], BOOKS[b][1]) : null;
  var v1 = m[3] ? +m[3] : null, v2 = m[4] ? +m[4] : v1;
  var vs = [];
  if (v1) for (var v = v1; v <= Math.max(v1, v2) && vs.length < 200; v++) vs.push(v);
  return { b: b, c: c, vs: vs, bookOnly: !m[2] };
}
var GROUPS = [['יהוה', 'yahowah', 'yehovah', 'yhwh'], ['יהושע', 'yehoshua', 'yeshua', 'jesus'], ['elohim', 'god']];
function terms(q) {
  var out = [], re = /"([^"]+)"|“([^”]+)”|(\S+)/g, m;
  while ((m = re.exec(q)) !== null) {
    var t = (m[1] || m[2] || m[3]).toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (!t) continue;
    var alts = [t];
    GROUPS.forEach(function (g) { if (g.indexOf(t) >= 0) alts = g.slice(); });
    out.push(alts);
  }
  return out;
}
function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function termRe(alts) { return new RegExp('(^|[^\\p{L}\\p{N}])(' + alts.map(escRe).join('|') + ')', 'iu'); }
function runSearch(q) {
  var ts = terms(q);
  var res = [];
  if (!ts.length) return res;
  var res_ = ts.map(termRe);
  var keys = Object.keys(chapters).sort();
  keys.forEach(function (k) {
    var d = chapters[k];
    if (scope === 'ot' && d.book >= NT_START) return;
    if (scope === 'nt' && d.book < NT_START) return;
    if (scope === 'book' && d.book !== pos.b) return;
    d.verses.forEach(function (x) {
      for (var i = 0; i < res_.length; i++) if (!res_[i].test(x.t)) return;
      res.push({ b: d.book, c: d.ch, v: x.v, t: x.t });
    });
  });
  return { list: res, ts: ts };
}
function highlight(t, ts) {
  var h = fmtVerse(t);
  // highlight on escaped HTML text outside tags
  ts.forEach(function (alts) {
    var re = new RegExp('(^|[^\\p{L}\\p{N}])(' + alts.map(function (a) { return escRe(esc(a)); }).join('|') + ')', 'giu');
    h = h.split(/(<[^>]+>)/).map(function (part) { return part.charAt(0) === '<' ? part : part.replace(re, '$1<mark>$2</mark>'); }).join('');
  });
  return h;
}
function renderSearch() {
  leaveHome();
  var q = qEl.value.trim();
  qx.classList.toggle('hidden', !q);
  if (!q) { showChapter(pos.b, pos.c); return; }
  if (q.charAt(0) === '#') { nvThemeSearch(q.slice(1)); return; }
  var ref = parseRef(q);
  if (ref && !ref.bookOnly) return; // references open on Enter / Go
  var html = '';
  if (ref && ref.bookOnly) {
    html += '<button class="goto" id="gotoBook">Go to <b>' + esc(BOOKS[ref.b][0]) + '</b></button>';
  }
  if (q.replace(/\s/g, '').length < 2) { main.innerHTML = html + '<p class="hint">Keep typing…</p>'; bindGoto(ref); return; }
  var r = runSearch(q);
  var n = r.list.length;
  var nh = searchNotes(r.ts);
  html += '<div class="res-head"><span class="count">' + (n ? n + (n === 1 ? ' verse' : ' verses') : 'No verses found') + '</span><div class="scope">' +
    [['all', 'All'], ['ot', 'Tanakh'], ['nt', 'New Testament'], ['book', BOOKS[pos.b][0]]].map(function (s) {
      return '<button class="chip' + (scope === s[0] ? ' on' : '') + '" data-scope="' + s[0] + '">' + esc(s[1]) + '</button>';
    }).join('') + '</div></div>';
  if (nh.length) {
    html += '<div class="nsec" style="margin-top:0">Your notes · ' + nh.length + '</div>';
    nh.slice(0, 30).forEach(function (x, i) {
      html += '<button class="hit" data-nh="' + i + '"><span class="ref" style="color:var(--name)">' + esc(x.label) + '</span><span class="t">' + highlight(noteSnippet(x.n.text, 220), r.ts) + '</span></button>';
    });
    html += '<div class="nsec">Bible</div>';
  }
  r.list.slice(0, shown).forEach(function (x, i) {
    html += '<button class="hit" data-i="' + i + '"><span class="ref">' + esc(BOOKS[x.b][0] + ' ' + x.c + ':' + x.v) + '</span><span class="t">' + highlight(x.t, r.ts) + '</span></button>';
  });
  if (n > shown) html += '<button class="quiet more" id="more">Show more (' + (n - shown) + ' left)</button>';
  if (!n && !Object.keys(chapters).length) html += '<p class="hint">Nothing has been imported yet.</p>';
  main.innerHTML = html;
  bindGoto(ref);
  main.querySelectorAll('.chip').forEach(function (b) { b.onclick = function () { scope = b.dataset.scope; shown = 150; renderSearch(); }; });
  main.querySelectorAll('.hit[data-i]').forEach(function (b) {
    b.onclick = function () { var x = r.list[+b.dataset.i], q0 = qEl.value; closeSearch(); showChapter(x.b, x.c, [x.v]); nvReturnTo('Search results', function () { qEl.value = q0; renderSearch(); }); };
  });
  main.querySelectorAll('.hit[data-nh]').forEach(function (b) {
    b.onclick = function () { var x = nh[+b.dataset.nh]; if (x.kind === 'v') openNoteEditor(x.n.book, x.n.ch, x.n.v1, x.n.v2, 'search'); else if (x.kind === 't') openTeach(x.id); else openPlanNote(x.n); };
  });
  var more = document.getElementById('more'); if (more) more.onclick = function () { shown += 150; renderSearch(); };
  window.scrollTo(0, 0);
}
function bindGoto(ref) {
  var g = document.getElementById('gotoBook');
  if (g) g.onclick = function () { closeSearch(); openPicker(ref.b); };
}
function closeSearch() { qEl.value = ''; qx.classList.add('hidden'); qEl.blur(); }
var sT;
qEl.addEventListener('input', function () { shown = 150; clearTimeout(sT); sT = setTimeout(renderSearch, 180); });
qEl.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter') return;
  e.preventDefault(); clearTimeout(sT);
  var ref = parseRef(qEl.value);
  if (ref && !ref.bookOnly) { closeSearch(); showChapter(ref.b, ref.c || 1, ref.vs); }
  else { clearTimeout(sT); renderSearch(); qEl.blur(); }
});
qx.onclick = function () { closeSearch(); showChapter(pos.b, pos.c); };
