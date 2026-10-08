// Noble Vine Study & Discipleship · 2.1.0 · Opening screen, About, Your journey
'use strict';
var nvN = 0;
function nvSprig(w, bold) {
  var id = 'nvc' + (++nvN), h = Math.round(w * 134 / 108);
  return '<svg class="nvsprig" width="' + w + '" height="' + h + '" viewBox="95 0 108 134" aria-hidden="true"><defs><clipPath id="' + id + '"><rect x="96" y="0" width="106" height="132.4"/></clipPath></defs>' +
    '<g clip-path="url(#' + id + ')" fill="currentColor"' + (bold ? ' stroke="currentColor" stroke-width="' + bold + '" stroke-linejoin="round"' : '') + '>' + NV_SPRIG + '</g></svg>';
}
function nvLockup(w) {
  var id = 'nvc' + (++nvN), h = Math.round(w * 224 / 368);
  return '<svg class="nvlock" width="' + w + '" height="' + h + '" viewBox="8 0 368 224" role="img" aria-label="Noble Vine Restoration Ministries"><defs><clipPath id="' + id + '"><rect x="96" y="0" width="106" height="132.4"/></clipPath></defs>' +
    '<g class="nv-sp" fill="currentColor" clip-path="url(#' + id + ')">' + NV_SPRIG + '</g><g class="nv-wm" fill="currentColor">' + NV_NOBLE + '</g><g class="nv-sb" fill="currentColor">' + NV_SUB + '</g></svg>';
}
var nvSplashDone = false;
function nvHideSplash() {
  if (nvSplashDone) return; nvSplashDone = true;
  var el = document.getElementById('nvSplash'); if (!el) return;
  var wait = Math.max(0, 1500 - (window.performance ? performance.now() : 0));
  setTimeout(function () { el.classList.add('gone'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700); }, wait);
}
(function () { var el = document.getElementById('nvSplash'); if (el) { el.insertAdjacentHTML('afterbegin', nvAppMark(Math.min(330, Math.round(window.innerWidth * 0.8)))); } setTimeout(nvHideSplash, 7000); })();
function openAbout() {
  openSheet('About Noble Vine');
  var d = chapters[key(42, 15)], v5 = d ? d.verses.filter(function (x) { return x.v === 5; })[0] : null;
  sheetBody.innerHTML = '<div class="nvcard" style="margin-top:0">' + nvAppMark(260) + '<div class="nvfrom">' + NV_FROM + '</div></div>' +
    (v5 ? '<p class="nvverse">' + fmtVerse(v5.t) + '</p><p class="status" style="text-align:center;margin-top:0">John 15:5</p>' : '') +
    nvWhyNames() + '<div class="mlab">About the app</div><p>Noble Vine Study &amp; Discipleship is a work of Noble Vine Restoration Ministries. It brings together the Restored Names Bible (RNB) and a record of your walk: your notes, prophetic words, reading plans, recordings and the verses you hide in your heart.</p>' +
    '<div class="actions"><button type="button" class="quiet" id="abCredits">Credits and licences</button></div><p class="status">' + APP_VER + '</p>';
  document.getElementById('abCredits').onclick = openCredits;
}
// Your journey: everything you have kept, newest first
async function nvJourney() {
  var out = [];
  function add(when, c, ic, kind, title, sub, open) { if (when) out.push({ when: when, c: c, ic: ic, kind: kind, title: title, sub: sub || '', open: open }); }
  Object.keys(vnotes).forEach(function (k) { var n = vnotes[k]; add(n.updated || n.created, 'purple', 'pen', 'Note', vnoteRef(n), noteSnippet(n.text || '', 70), function () { openNoteEditor(n.book, n.ch, n.v1, n.v2, 'list'); }); });
  Object.keys(pnotes).forEach(function (k) { var n = pnotes[k]; add(n.updated, 'purple', 'pen', 'Day note', n.dayLabel || 'Reading plan', noteSnippet(n.text || '', 70), function () { openPlanNote(n); }); });
  var fv = favAll(); Object.keys(fv).forEach(function (k) { var x = fv[k]; add(x.added, x.color || favColour(), 'star', 'Favourite verse', favRef(x), noteSnippet(nameText(favText(x)), 70), function () { closeSheet(); closeSearch(); showChapter(x.b, x.c, [x.v]); }); });
  var mm = memAll(); Object.keys(mm).forEach(function (k) { var x = mm[k]; add(x.updated || x.added, 'pom', 'heart', 'Memory verse', memRef(x), memDueLabel(x), function () { practiseMem(x.id); }); });
  var tt = teachAll(); Object.keys(tt).forEach(function (k) { var x = tt[k]; add(x.updated || x.created, 'purple', 'teach', 'Teaching note', x.title || 'Untitled', '', function () { openTeach(k); }); });
  ['bible', 'study'].forEach(function (sl) {
    var p = plans[sl]; if (!p || !p.done) return;
    Object.keys(p.done).forEach(function (d) { add(p.done[d], 'clay', 'route', sl === 'study' ? 'Book study' : 'Reading plan', 'Day ' + d + ' complete', p.name || '', function () { usePlan(sl); openTracker(); }); });
  });
  try { (await prophAll()).forEach(function (x) { var t = x.date ? parseYmd(x.date).getTime() + 43200000 : x.created; add(t, 'gold', x.audio ? 'mic' : 'spark', 'My word', x.title || 'Untitled word', x.from || '', function () { openProph(x.id); }); }); } catch (e) {}
  try { (await dreamAll()).forEach(function (x) { var t = x.date ? parseYmd(x.date).getTime() + 43200000 : x.created; add(t, 'indigo', x.audio ? 'mic' : 'moon', 'Dream', x.title || 'Untitled dream', x.place || '', function () { openDream(x.id); }); }); } catch (e) {}
  try { (await recAll()).forEach(function (r) { add(r.created, 'clay', 'mic', 'Recording', recLabel(r), fmtDur(r.dur), openRecordings); }); } catch (e) {}
  return out.sort(function (a, z) { return z.when - a.when; });
}
function nvRow(x, i) {
  return '<button type="button" class="mrow" data-j="' + i + '">' + rnbDisc(x.c, x.ic) + '<span class="mrow-t"><span class="jk c-' + x.c + '">' + esc(x.kind) + '</span><span class="mrow-h">' + esc(x.title) + '</span>' + (x.sub ? '<span class="mrow-s">' + esc(x.sub) + '</span>' : '') + '</span><span class="jd">' + esc(new Date(x.when).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })) + '</span></button>';
}
async function nvFillJourney() {
  var box = document.getElementById('jHome'); if (!box) return;
  var all = document.getElementById('jAll'); if (all) all.onclick = openJourney;
  var list = await nvJourney(); if (!document.getElementById('jHome')) return;
  if (!list.length) return;
  box.innerHTML = list.slice(0, 4).map(nvRow).join('');
  box.querySelectorAll('[data-j]').forEach(function (el) { el.onclick = function () { list[+el.dataset.j].open(); }; });
}
async function openJourney() {
  openSheet('Your journey'); var tok = sheetSeq;
  if (tok !== sheetSeq) return; sheetBody.innerHTML = '<p class="hint">Gathering your journey…</p>';
  var list = await nvJourney(), h = '<p class="hint" style="margin-top:0">Everything you have kept, newest first: notes, prophetic words, plan days, memory verses, teaching notes and recordings.</p>', month = '';
  if (!list.length) h += '<p class="hint">Nothing yet. As you read, write and pray, your journey gathers here.</p>';
  list.forEach(function (x, i) {
    var m = new Date(x.when).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (m !== month) { h += (month ? '</div>' : '') + '<div class="mlab">' + esc(m) + '</div><div class="mgrp">'; month = m; }
    h += nvRow(x, i);
  });
  if (month) h += '</div>';
  if (tok !== sheetSeq) return; sheetBody.innerHTML = h;
  sheetBody.querySelectorAll('[data-j]').forEach(function (el) { el.onclick = function () { list[+el.dataset.j].open(); }; });
}
// ---- Noble Vine Study & Discipleship: app mark and "why the Names" ----
var NV_FROM = 'from Noble Vine Restoration Ministries';
function nvAppMark(w) {
  var id = 'nvc' + (++nvN), h = Math.round(w * 192 / 368);
  return '<div class="nvmark"><svg class="nvlock" width="' + w + '" height="' + h + '" viewBox="8 0 368 192" role="img" aria-label="Noble Vine"><defs><clipPath id="' + id + '"><rect x="96" y="0" width="106" height="132.4"/></clipPath></defs>' +
    '<g class="nv-sp" fill="currentColor" clip-path="url(#' + id + ')">' + NV_SPRIG + '</g><g class="nv-wm" fill="currentColor">' + NV_NOBLE + '</g></svg>' +
    '<div class="nvsd" style="font-size:' + Math.max(11, Math.round(w * 0.052)) + 'px">STUDY &amp; DISCIPLESHIP</div></div>';
}
function nvWhyNames() {
  var d = chapters[key(1, 3)], v = d ? d.verses.filter(function (x) { return x.v === 15; })[0] : null;
  return '<div class="mlab">Why the Names are restored</div><div class="nvwhy">' +
    '<p>Most English Bibles replace the Creator’s own Name, <bdi class="heb">יהוה</bdi>, with “the LORD”, nearly 7,000 times. The Restored Names Bible puts the Name back wherever the Hebrew has it.</p>' +
    '<p>The Messiah’s name is given in its Hebrew form, <bdi class="heb">יהושע</bdi>. Titles such as Elohim and Adonai are kept as titles, so the Name and the titles stay distinct, as they are in the Hebrew.</p>' +
    (v ? '<p class="nvverse" style="margin:.4rem 0 .2rem">' + fmtVerse(v.t) + '</p><p class="status" style="text-align:center;margin:0 0 .8rem">Exodus 3:15</p>' : '') +
    '<p>Nothing else is changed. The RNB is built on a public-domain modern English translation, and every other version in Compare is shown exactly as published, so you can always see what has been restored and why.</p></div>';
}
// ---- Credits and licences (2.1) ----
function openCredits() {
  openSheet('Credits and licences');
  var row = function (t, d) { return '<div class="ngrow" style="display:block"><div class="ng-t">' + t + '</div><div class="ng-m">' + d + '</div></div>'; };
  sheetBody.innerHTML = '<p class="hint" style="margin-top:0">With thanks to everyone whose work makes this app possible.</p>' +
    '<div class="mlab">Scripture</div><div class="mgrp">' +
      row('Restored Names Bible (RNB)', 'Based on the Berean Standard Bible, which its publisher has dedicated to the public domain. The divine Names and titles are restored by Noble Vine Restoration Ministries; nothing else in the text is changed. The RNB is not published or endorsed by the BSB’s publishers.') +
      row('World English Bible (WEB)', 'Public domain. Shown in Compare exactly as published, unaltered. Downloaded via getBible.net.') +
      row('American Standard Version (ASV, 1901)', 'Public domain. Shown in Compare exactly as published. Downloaded via getBible.net.') +
      row('ESV, NKJV and KJV', 'Not included in the app. Compare offers links to read them on Bible Gateway; the names are trademarks of their publishers.') +
    '</div><div class="mlab">Hebrew</div><div class="mgrp">' +
      row('Hebrew text, word-by-word English and lexicon', 'STEP Bible (stepbible.org), Tyndale House, Cambridge. Licensed under Creative Commons Attribution 4.0 (CC BY 4.0).') +
    '</div><div class="mlab">Commentaries</div><div class="mgrp">' +
      row('Tyndale Open Study Notes', 'Tyndale House Publishers. Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0). Shown unchanged.') +
      row('Keil &amp; Delitzsch, John Gill, Jamieson-Fausset-Brown, Matthew Henry, Adam Clarke, John Calvin', 'Public domain. Shown exactly as written.') +
      row('Commentary delivery', 'Via the Free Use Bible API (bible.helloao.org).') +
    '</div><div class="mlab">Design</div><div class="mgrp">' +
      row('Fonts', 'Lora, Frank Ruhl Libre and Cinzel, under the SIL Open Font License.') +
      row('Noble Vine logo', '© Noble Vine Restoration Ministries. All rights reserved.') +
    '</div><p class="status" style="margin-top:1rem">' + APP_VER + '</p>';
}
