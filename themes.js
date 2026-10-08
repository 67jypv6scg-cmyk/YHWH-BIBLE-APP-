// Noble Vine Study & Discipleship · 2.0.0 · Themes for notes and verses
'use strict';
// ======================================================================
// Themes: tag notes, prophetic words, teaching notes and favourites; find them by theme
// ======================================================================
var NV_STARTER_THEMES = ['Covenant', 'Torah & commandments', 'Sabbath & appointed times', 'The Names', 'Messiah', 'Faith & trust', 'Prayer', 'Repentance',
  'Grace & mercy', 'Holiness', 'Kingdom', 'Prophecy', 'Healing', 'Provision', 'Wisdom', 'Israel & the nations'];
var NV_TAG_COLOURS = ['gold', 'olive', 'blue', 'clay', 'pom', 'purple', 'stone'];
function nvTagData() {
  var d = lsGet('nb-tags', null);
  if (!d || !Array.isArray(d.list)) {
    d = { list: NV_STARTER_THEMES.map(function (n, i) { return { id: 't' + (i + 1), name: n, color: NV_TAG_COLOURS[i % NV_TAG_COLOURS.length] }; }), map: {} };
    lsSet('nb-tags', d);
  }
  if (!d.map) d.map = {};
  return d;
}
function nvTagSave(d) { lsSet('nb-tags', d); }
function nvTagById(id) { return nvTagData().list.filter(function (t) { return t.id === id; })[0] || null; }
function nvTagsOf(itemKey) { var d = nvTagData(); return (d.map[itemKey] || []).filter(function (id) { return nvTagById(id); }); }
function nvSetTags(itemKey, ids) { var d = nvTagData(); if (ids && ids.length) d.map[itemKey] = ids; else delete d.map[itemKey]; nvTagSave(d); }
function nvTagChip(t, on, extra) { return '<button type="button" class="tchip c-' + t.color + (on ? ' on' : '') + '" ' + (extra || '') + ' aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(t.name) + '</button>'; }
// A row of theme chips under a note: the chosen ones, plus "+ Theme" to choose more
function nvMountTags(elId, itemKey) {
  var box = document.getElementById(elId); if (!box) return;
  var open = false;
  function render() {
    var d = nvTagData(), mine = nvTagsOf(itemKey);
    var h = '<div class="tchips">' + mine.map(function (id) { return nvTagChip(nvTagById(id), true, 'data-tt="' + id + '"'); }).join('') +
      '<button type="button" class="tchip add" data-tadd="1">' + (open ? 'Done' : (mine.length ? '+ Theme' : '+ Add a theme')) + '</button></div>';
    if (open) {
      h += '<div class="tpick">' + d.list.map(function (t) { return nvTagChip(t, mine.indexOf(t.id) >= 0, 'data-tt="' + t.id + '"'); }).join('') +
        '<span class="tnew"><input type="text" id="' + elId + '-new" placeholder="New theme" maxlength="40" aria-label="New theme name"><button type="button" class="tchip add" data-tnew="1">Add</button></span></div>';
    }
    box.innerHTML = h;
    box.querySelectorAll('[data-tt]').forEach(function (b) {
      b.onclick = function () { var cur = nvTagsOf(itemKey), id = b.dataset.tt, i = cur.indexOf(id); if (i >= 0) cur.splice(i, 1); else cur.push(id); nvSetTags(itemKey, cur); render(); };
    });
    box.querySelector('[data-tadd]').onclick = function () { open = !open; render(); };
    var nb = box.querySelector('[data-tnew]');
    if (nb) {
      var inp = document.getElementById(elId + '-new');
      var add = function () { var t = nvAddTheme(inp.value); if (t) { var cur = nvTagsOf(itemKey); cur.push(t.id); nvSetTags(itemKey, cur); render(); } };
      nb.onclick = add; inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); add(); } };
    }
  }
  render();
}
function nvAddTheme(name) {
  name = String(name || '').trim().slice(0, 40); if (!name) return null;
  var d = nvTagData(), hit = d.list.filter(function (t) { return t.name.toLowerCase() === name.toLowerCase(); })[0];
  if (hit) return hit;
  var t = { id: 't' + Date.now().toString(36), name: name, color: NV_TAG_COLOURS[d.list.length % NV_TAG_COLOURS.length] };
  d.list.push(t); nvTagSave(d); return t;
}
// Everything tagged with a theme, ready to list
async function nvTaggedItems(id) {
  var d = nvTagData(), out = [], teach = teachAll(), favs = favAll(), proph = {}, dreams = {};
  try { (await prophAll()).forEach(function (x) { proph[x.id] = x; }); } catch (e) {}
  try { (await dreamAll()).forEach(function (x) { dreams[x.id] = x; }); } catch (e) {}
  Object.keys(d.map).forEach(function (k) {
    if ((d.map[k] || []).indexOf(id) < 0) return;
    var kind = k.charAt(0), ref = k.slice(2), x;
    if (kind === 'v' && (x = vnotes[ref])) out.push({ kind: 'Note', title: vnoteRef(x), sub: noteSnippet(x.text || '', 90), c: 'purple', ic: 'pen', open: function () { openNoteEditor(x.book, x.ch, x.v1, x.v2, 'list'); } });
    else if (kind === 'p' && (x = pnotes[ref])) out.push({ kind: 'Day note', title: x.dayLabel || 'Reading plan', sub: noteSnippet(x.text || '', 90), c: 'purple', ic: 'pen', open: function () { openPlanNote(x); } });
    else if (kind === 't' && (x = teach[ref])) out.push({ kind: 'Teaching note', title: x.title || 'Untitled', sub: '', c: 'purple', ic: 'teach', open: function () { openTeach(ref); } });
    else if (kind === 'w' && (x = proph[ref])) out.push({ kind: 'Prophetic word', title: x.title || 'Untitled word', sub: x.from || '', c: 'gold', ic: 'spark', open: function () { openProph(ref); } });
    else if (kind === 'd' && (x = dreams[ref])) out.push({ kind: 'Dream', title: x.title || 'Untitled dream', sub: x.place || '', c: 'indigo', ic: 'moon', open: function () { openDream(ref); } });
    else if (kind === 'f' && (x = favs[ref])) out.push({ kind: 'Favourite', title: favRef(x), sub: noteSnippet(nameText(favText(x)), 90), c: x.color || favColour(), ic: 'star', open: function () { closeSheet(); closeSearch(); showChapter(x.b, x.c, [x.v]); } });
  });
  return out;
}
function nvItemRow(x, i) {
  return '<button type="button" class="mrow" data-ti="' + i + '">' + rnbDisc(x.c, x.ic) + '<span class="mrow-t"><span class="jk c-' + x.c + '">' + esc(x.kind) + '</span><span class="mrow-h">' + esc(x.title) + '</span>' + (x.sub ? '<span class="mrow-s">' + esc(x.sub) + '</span>' : '') + '</span><span class="mrow-c">' + rnbIcon('chev', 18) + '</span></button>';
}
async function openThemes(editing) {
  openSheet('Themes'); var tok = sheetSeq;
  var d = nvTagData(), counts = {};
  Object.keys(d.map).forEach(function (k) { (d.map[k] || []).forEach(function (id) { counts[id] = (counts[id] || 0) + 1; }); });
  var h = '<p class="hint" style="margin-top:0">Tag your notes, words, dreams, teaching notes and favourite verses with themes, then find them all here. You can also search <b>#covenant</b>, for example.</p>';
  if (!editing) {
    h += '<div class="mgrp">' + d.list.map(function (t) {
      return '<button type="button" class="mrow" data-th="' + t.id + '"><span class="tdot c-' + t.color + '"></span><span class="mrow-t"><span class="mrow-h">' + esc(t.name) + '</span></span><span class="tcount">' + (counts[t.id] || 0) + '</span><span class="mrow-c">' + rnbIcon('chev', 18) + '</span></button>';
    }).join('') + '</div><div class="actions"><button class="quiet" id="thEdit">Add or change themes</button></div>';
  } else {
    h += '<div class="mgrp">' + d.list.map(function (t) {
      return '<div class="thedit"><span class="tdot c-' + t.color + '" data-tc="' + t.id + '" role="button" tabindex="0" aria-label="Change colour of ' + esc(t.name) + '"></span><input type="text" value="' + esc(t.name) + '" data-tn="' + t.id + '" maxlength="40" aria-label="Theme name"><button type="button" class="tdel" data-td="' + t.id + '" aria-label="Remove ' + esc(t.name) + '">✕</button></div>';
    }).join('') + '</div><label class="field" style="margin-top:1rem"><span>New theme</span><input type="text" id="thNew" maxlength="40" placeholder="For example: Shepherding"></label>' +
      '<div class="actions"><button class="primary" id="thAdd">Add theme</button><button class="quiet" id="thDone">Done</button></div><p class="status">Tap a coloured dot to change its colour. Removing a theme takes it off your notes, but the notes themselves are kept.</p>';
  }
  if (tok !== sheetSeq) return;
  sheetBody.innerHTML = h;
  sheetBody.querySelectorAll('[data-th]').forEach(function (el) { el.onclick = function () { openTheme(el.dataset.th); }; });
  var e1 = document.getElementById('thEdit'); if (e1) e1.onclick = function () { openThemes(true); };
  var dn = document.getElementById('thDone'); if (dn) dn.onclick = function () { openThemes(false); };
  sheetBody.querySelectorAll('[data-tn]').forEach(function (el) { el.onchange = function () { var v = el.value.trim(); if (!v) return; var dd = nvTagData(); dd.list.forEach(function (t) { if (t.id === el.dataset.tn) t.name = v.slice(0, 40); }); nvTagSave(dd); }; });
  sheetBody.querySelectorAll('[data-tc]').forEach(function (el) {
    el.onclick = function () { var dd = nvTagData(); dd.list.forEach(function (t) { if (t.id === el.dataset.tc) t.color = NV_TAG_COLOURS[(NV_TAG_COLOURS.indexOf(t.color) + 1) % NV_TAG_COLOURS.length]; }); nvTagSave(dd); openThemes(true); };
  });
  sheetBody.querySelectorAll('[data-td]').forEach(function (el) {
    el.onclick = function () {
      if (el.dataset.armed !== '1') { el.dataset.armed = '1'; el.textContent = 'Remove?'; return; }
      var dd = nvTagData(), id = el.dataset.td;
      dd.list = dd.list.filter(function (t) { return t.id !== id; });
      Object.keys(dd.map).forEach(function (k) { dd.map[k] = dd.map[k].filter(function (x) { return x !== id; }); if (!dd.map[k].length) delete dd.map[k]; });
      nvTagSave(dd); openThemes(true);
    };
  });
  var ad = document.getElementById('thAdd'); if (ad) ad.onclick = function () { var t = nvAddTheme(document.getElementById('thNew').value); if (t) { toast('Theme added'); openThemes(true); } };
}
async function openTheme(id) {
  var t = nvTagById(id); if (!t) return openThemes();
  openSheet(t.name); var tok = sheetSeq;
  sheetBody.innerHTML = '<p class="hint">Gathering…</p>';
  var items = await nvTaggedItems(id);
  if (tok !== sheetSeq) return;
  sheetBody.innerHTML = '<button class="backlink" id="thBack">‹ All themes</button>' +
    (items.length ? '<div class="mgrp">' + items.map(nvItemRow).join('') + '</div>' : '<p class="hint">Nothing tagged with this theme yet. Open a note, prophetic word, teaching note or favourite and tap <b>+ Add a theme</b>.</p>');
  document.getElementById('thBack').onclick = function () { openThemes(); };
  sheetBody.querySelectorAll('[data-ti]').forEach(function (el) { el.onclick = function () { items[+el.dataset.ti].open(); }; });
}
// Search box: "#covenant" lists everything with that theme
async function nvThemeSearch(q) {
  var d = nvTagData(), ql = q.toLowerCase().trim();
  var hits = d.list.filter(function (t) { return !ql || t.name.toLowerCase().indexOf(ql) >= 0; });
  var h = '<div class="res-head"><span class="count">' + (hits.length ? 'Themes matching “#' + esc(q) + '”' : 'No theme called “' + esc(q) + '”') + '</span></div>';
  var all = [];
  for (var i = 0; i < hits.length; i++) {
    var items = await nvTaggedItems(hits[i].id);
    h += '<div class="nsec"><span class="tdot c-' + hits[i].color + '"></span> ' + esc(hits[i].name) + ' · ' + items.length + '</div>';
    items.forEach(function (x) { h += nvItemRow(x, all.length).replace('class="mrow"', 'class="mrow hit"'); all.push(x); });
  }
  if (qEl.value.trim().charAt(0) !== '#') return;
  main.innerHTML = h;
  main.querySelectorAll('[data-ti]').forEach(function (el) { el.onclick = function () { all[+el.dataset.ti].open(); }; });
}
