// Noble Vine Study & Discipleship · 2.0.0 · Verse notes and plan-day notes
'use strict';
// ======================================================================
// Notes: on verses, and on reading-plan days
// ======================================================================
var vnotes = {}, pnotes = {};
function pad3(n) { return String(n).padStart(3, '0'); }
function vnoteId(b, c, v1, v2) { return key(b, c) + '-' + pad3(v1) + (v2 > v1 ? '_' + pad3(v2) : ''); }
function vnoteRef(n) { return bn(n.book) + ' ' + n.ch + ':' + n.v1 + (n.v2 > n.v1 ? '–' + n.v2 : ''); }
async function loadNotes() {
  if (store.mode === 'db') {
    var last = '';
    for (var g = 0; g < 10; g++) {
      var q = last ? store.vnotes.where('id', '>', last).orderBy('id').limit(500) : store.vnotes.orderBy('id').limit(500);
      var snap = await q.get();
      snap.docs.forEach(function (d) { var x = d.data(); if (x && x.id) { vnotes[x.id] = x; last = x.id; } });
      if (snap.size < 500) break;
    }
    var ps = await store.notes.limit(1000).get();
    var legacy = [];
    ps.docs.forEach(function (d) { var x = d.data() || {}; if (x.planCreated) pnotes[x.id] = x; else if (x.text) legacy.push({ docId: d.id, x: x }); });
    // Older day notes (saved before notes were tied to a plan): move them onto the current plan
    if (legacy.length && plan) {
      for (var i = 0; i < legacy.length; i++) {
        var L = legacy[i], day = +L.x.day || +String(L.docId).replace(/\D/g, '');
        if (!day || day > totalDays()) continue;
        var doc = { id: pnoteId(day), planCreated: plan.created, planName: plan.name, day: day, dayLabel: dayLabel(day), date: dateOf(day), refs: groupRefs(dayList(day)), text: L.x.text, updated: Date.now() };
        try { await store.notes.doc(doc.id).set(doc); await store.notes.doc(L.docId).delete(); pnotes[doc.id] = doc; } catch (e) {}
      }
    }
  } else {
    vnotes = lsGet('nb-vnotes', {});
    pnotes = lsGet('nb-pnotes', {});
    var old = lsGet('nb-notes', null);
    if (old && plan) {
      Object.keys(old).forEach(function (d) {
        d = +d; if (!old[d] || d > totalDays()) return;
        pnotes[pnoteId(d)] = { id: pnoteId(d), planCreated: plan.created, planName: plan.name, day: d, dayLabel: dayLabel(d), date: dateOf(d), refs: groupRefs(dayList(d)), text: old[d], updated: Date.now() };
      });
      lsSet('nb-pnotes', pnotes); lsSet('nb-notes', undefined); delete big['nb-notes'];
    }
  }
}
var noteTimers = {};
function queueNote(kind, doc, stat) {
  var bag = kind === 'v' ? vnotes : pnotes, empty = !doc.text.trim();
  var existed = !!bag[doc.id];
  if (empty) delete bag[doc.id]; else bag[doc.id] = doc;
  if (stat) stat.textContent = 'Saving…';
  clearTimeout(noteTimers[doc.id]);
  noteTimers[doc.id] = setTimeout(function () {
    var done = function () { if (stat) stat.textContent = empty ? (existed ? 'Note removed' : '') : 'Saved'; };
    var fail = function () { if (stat) stat.textContent = 'Not saved yet. Keep typing to retry.'; };
    if (store.mode === 'db') {
      var col = kind === 'v' ? store.vnotes : store.notes;
      withTimeout(empty ? col.doc(doc.id).delete() : col.doc(doc.id).set(doc), 20000).then(done, fail);
    } else { lsSet(kind === 'v' ? 'nb-vnotes' : 'nb-pnotes', bag) ? done() : fail(); }
  }, 700);
  if (kind === 'v' && existed !== !empty) markersChanged = true;
}
var markersChanged = false;
function notesForChapter(b, c) {
  var pre = key(b, c) + '-', out = [];
  Object.keys(vnotes).forEach(function (id) { if (id.indexOf(pre) === 0) out.push(vnotes[id]); });
  return out.sort(function (a, z) { return a.v1 - z.v1; });
}
function openNoteEditor(b, c, v1, v2, from) {
  var id = vnoteId(b, c, v1, v2), n = vnotes[id];
  openSheet('Note · ' + bn(b) + ' ' + c + ':' + v1 + (v2 > v1 ? '–' + v2 : ''));
  var doc = chapters[key(b, c)];
  var quote = doc ? doc.verses.filter(function (x) { return x.v >= v1 && x.v <= v2; }).map(function (x) { return '<span class="vn">' + x.v + '</span>' + fmtVerse(x.t); }).join(' ') : '';
  sheetBody.innerHTML = (quote ? '<div class="quote">' + quote + '</div>' : '') +
    '<textarea id="neText" placeholder="Your note on this passage…" style="min-height:11rem"></textarea><div class="tagbox" id="neTags"></div><p class="status" id="neStat">' + (n ? 'Last edited ' + new Date(n.updated).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '') + '</p>' +
    '<div class="actions">' + (from === 'list' || from === 'search' ? '<button class="quiet" id="neGo">Open in the Bible</button>' : '') + (n ? '<button class="danger" id="neDel">Delete note</button>' : '') + '</div>';
  var ta = document.getElementById('neText'), st = document.getElementById('neStat');
  nvMountTags('neTags', 'v:' + id);
  ta.value = n ? n.text : '';
  if (!n) setTimeout(function () { ta.focus(); }, 60);
  ta.addEventListener('input', function () {
    queueNote('v', { id: id, book: b, ch: c, v1: v1, v2: v2, text: ta.value, created: n ? n.created : Date.now(), updated: Date.now() }, st);
  });
  var go = document.getElementById('neGo');
  if (go) go.onclick = function () { closeSheet(); closeSearch(); var vs = []; for (var v = v1; v <= v2; v++) vs.push(v); showChapter(b, c, vs); };
  var del = document.getElementById('neDel');
  if (del) del.onclick = function () {
    if (del.dataset.armed !== '1') { del.dataset.armed = '1'; del.textContent = 'Tap again to delete'; return; }
    ta.value = ''; queueNote('v', { id: id, text: '' }, st); closeSheet(); toast('Note deleted');
  };
}
function afterSheetClosed() {
  if (markersChanged) { markersChanged = false; if (!qEl.value.trim()) refreshView(); }
}
function noteSnippet(t, n) { t = t.replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; }
function openNotesList() {
  openSheet('My notes');
  var vs = Object.keys(vnotes).sort().map(function (k) { return vnotes[k]; });
  var ps = Object.keys(pnotes).map(function (k) { return pnotes[k]; }).sort(function (a, z) { return (a.planCreated - z.planCreated) || (a.day - z.day); });
  var h = '';
  if (!vs.length && !ps.length) h = '<p class="hint" style="margin-top:0">No notes yet. While reading, tap a verse (or several), then tap <b>Note</b>. Notes on reading-plan days appear here too.</p>';
  if (vs.length) {
    h += '<div class="nsec">On verses · ' + vs.length + '</div>';
    vs.forEach(function (n) { h += '<button class="hit" data-v="' + esc(n.id) + '"><span class="ref">' + esc(vnoteRef(n)) + '</span><span class="t">' + esc(noteSnippet(n.text, 160)) + '</span></button>'; });
  }
  if (ps.length) {
    var lastPlan = null;
    ps.forEach(function (n) {
      if (n.planCreated !== lastPlan) { h += '<div class="nsec">' + esc(n.planName || 'Reading plan') + ((plans.bible && plans.bible.created === n.planCreated) || (plans.study && plans.study.created === n.planCreated) ? ' (current)' : '') + '</div>'; lastPlan = n.planCreated; }
      h += '<button class="hit" data-p="' + esc(n.id) + '"><span class="ref">' + esc((n.dayLabel || 'Day ' + n.day) + ' · ' + niceDate(n.date)) + '</span><span class="hint" style="display:block;margin-bottom:.15rem">' + esc(n.refs || '') + '</span><span class="t">' + esc(noteSnippet(n.text, 160)) + '</span></button>';
    });
  }
  sheetBody.innerHTML = h;
  sheetBody.querySelectorAll('[data-v]').forEach(function (el) { el.onclick = function () { var n = vnotes[el.dataset.v]; openNoteEditor(n.book, n.ch, n.v1, n.v2, 'list'); }; });
  sheetBody.querySelectorAll('[data-p]').forEach(function (el) { el.onclick = function () { openPlanNote(pnotes[el.dataset.p]); }; });
}
function openPlanNote(n) {
  var cs = ['bible', 'study'].filter(function (sl) { return plans[sl] && plans[sl].created === n.planCreated; })[0];
  if (cs) { usePlan(cs); openDayDetail(n.day); return; }
  openSheet((n.planName || 'Reading plan') + ' · ' + (n.dayLabel || 'Day ' + n.day));
  sheetBody.innerHTML = '<p class="status" style="margin-top:0">' + esc(niceDate(n.date)) + ' · ' + esc(n.refs || '') + '</p>' +
    '<textarea id="pnText" style="min-height:11rem"></textarea><p class="status" id="pnStat">From an earlier plan. You can still edit or delete it.</p>' +
    '<div class="actions"><button class="quiet" id="pnList">‹ My notes</button><button class="danger" id="pnDel">Delete note</button></div>';
  var ta = document.getElementById('pnText'), st = document.getElementById('pnStat');
  ta.value = n.text;
  ta.addEventListener('input', function () { var d = Object.assign({}, n, { text: ta.value, updated: Date.now() }); queueNote('p', d, st); n = d; });
  document.getElementById('pnList').onclick = openNotesList;
  var del = document.getElementById('pnDel');
  del.onclick = function () {
    if (del.dataset.armed !== '1') { del.dataset.armed = '1'; del.textContent = 'Tap again to delete'; return; }
    queueNote('p', { id: n.id, text: '' }, st); openNotesList(); toast('Note deleted');
  };
}
function searchNotes(ts) {
  var res_ = ts.map(termRe), out = [];
  Object.keys(vnotes).sort().forEach(function (k) {
    var n = vnotes[k];
    if (scope === 'ot' && n.book >= NT_START) return;
    if (scope === 'nt' && n.book < NT_START) return;
    if (scope === 'book' && n.book !== pos.b) return;
    if (res_.every(function (r) { return r.test(n.text); })) out.push({ kind: 'v', n: n, label: 'Note · ' + vnoteRef(n) });
  });
  if (scope === 'all') { var ta = teachAll(); Object.keys(ta).forEach(function (k) {
    var t = ta[k], txt = (t.title || '') + ' — ' + teachText(t.html);
    if (res_.every(function (r) { return r.test(txt); })) out.push({ kind: 't', id: k, n: { text: txt }, label: 'Teaching · ' + (t.title || 'Untitled') });
  }); }
  if (scope === 'all') Object.keys(pnotes).forEach(function (k) {
    var n = pnotes[k];
    if (res_.every(function (r) { return r.test(n.text); })) out.push({ kind: 'p', n: n, label: 'Plan note · ' + (n.dayLabel || 'Day ' + n.day) });
  });
  return out;
}
document.getElementById('selNote').onclick = function () {
  var vs = Array.from(selected).sort(function (a, z) { return a - z; });
  if (!vs.length) return;
  var b = pos.b, c = pos.c, v1 = vs[0], v2 = vs[vs.length - 1];
  document.getElementById('selClear').onclick();
  openNoteEditor(b, c, v1, v2, 'read');
};
