// Noble Vine Study & Discipleship · 2.0.0 · Favourite verses
'use strict';
// ======================================================================
// Favourite verses: highlighted in a colour you choose, kept in My Walk
// ======================================================================
var FAV_COLOURS = [['gold', 'Gold'], ['olive', 'Olive'], ['blue', 'Blue'], ['clay', 'Clay'], ['pom', 'Pomegranate'], ['purple', 'Purple']];
function favAll() { return lsGet('nb-favs', {}) || {}; }
function favSave(f) { lsSet('nb-favs', f); }
function favId(b, c, v) { return key(b, c) + '-' + String(v).padStart(3, '0'); }
function favColour() { return S.favColor || 'gold'; }
function favsInChapter(b, c) { var f = favAll(), pre = key(b, c) + '-', out = {}; Object.keys(f).forEach(function (k) { if (k.indexOf(pre) === 0) out[f[k].v] = f[k].color || favColour(); }); return out; }
function favRef(x) { return bn(x.b) + ' ' + x.c + ':' + x.v; }
function favText(x) { var d = chapters[key(x.b, x.c)], v = d ? d.verses.filter(function (y) { return y.v === x.v; })[0] : null; return v ? v.t : ''; }
// Selection bar: add or remove the selected verses
function favToggleSelected() {
  var vs = Array.from(selected).sort(function (a, z) { return a - z; }); if (!vs.length) return;
  var f = favAll(), all = vs.every(function (v) { return f[favId(pos.b, pos.c, v)]; });
  vs.forEach(function (v) {
    var id = favId(pos.b, pos.c, v);
    if (all) { delete f[id]; nvSetTags('f:' + id, []); }
    else if (!f[id]) f[id] = { id: id, b: pos.b, c: pos.c, v: v, color: favColour(), added: Date.now() };
  });
  favSave(f);
  document.getElementById('selClear').onclick();
  toast(all ? (vs.length === 1 ? 'Removed from favourites' : 'Removed ' + vs.length + ' favourites') : (vs.length === 1 ? 'Added to favourite verses' : vs.length + ' verses added to favourites'));
  refreshView();
}
function openFavs(filter) {
  openSheet('Favourite verses');
  var f = favAll(), ids = Object.keys(f).sort(), flt = filter || 'all';
  var used = {}; ids.forEach(function (k) { used[f[k].color || favColour()] = 1; });
  var shown = ids.filter(function (k) { return flt === 'all' || (f[k].color || favColour()) === flt; });
  var h = '<p class="hint" style="margin-top:0">' + (ids.length ? ids.length + (ids.length === 1 ? ' favourite verse' : ' favourite verses') + '. Tap one to read it, or tap ••• to change its colour or themes.' : 'No favourites yet. While reading, tap a verse, then tap <b>♥ Favourite</b> in the bar at the bottom.') + '</p>';
  if (ids.length) h += '<div class="ilbar" style="margin-bottom:.8rem"><button data-ff="all" class="' + (flt === 'all' ? 'on' : '') + '">All</button>' +
    FAV_COLOURS.filter(function (c) { return used[c[0]]; }).map(function (c) { return '<button data-ff="' + c[0] + '" class="fchip c-' + c[0] + (flt === c[0] ? ' on' : '') + '"><i></i>' + c[1] + '</button>'; }).join('') + '</div>';
  var lastB = -1;
  shown.forEach(function (k) {
    var x = f[k];
    if (x.b !== lastB) { h += (lastB >= 0 ? '</div>' : '') + '<div class="mlab">' + esc(BOOKS[x.b][0]) + '</div><div class="mgrp">'; lastB = x.b; }
    var tags = nvTagsOf('f:' + k).map(function (id) { var t = nvTagById(id); return t ? '<span class="tchip sm c-' + t.color + '">' + esc(t.name) + '</span>' : ''; }).join('');
    h += '<div class="favrow c-' + (x.color || favColour()) + '"><button type="button" class="favmain" data-fo="' + esc(k) + '"><span class="favbar"></span><span class="mrow-t"><span class="mrow-h">' + esc(favRef(x)) + '</span>' +
      '<span class="favtxt">' + fmtVerse(noteSnippet(favText(x), 160)) + '</span>' + (tags ? '<span class="tchips">' + tags + '</span>' : '') + '</span></button>' +
      '<button type="button" class="favmore" data-fm="' + esc(k) + '" aria-label="Colour and themes for ' + esc(favRef(x)) + '">•••</button></div><div class="favedit" id="fe-' + esc(k) + '" hidden></div>';
  });
  if (lastB >= 0) h += '</div>';
  h += '<div class="actions"><button class="quiet" id="favSet">Default highlight colour</button></div>';
  sheetBody.innerHTML = h;
  sheetBody.querySelectorAll('[data-ff]').forEach(function (el) { el.onclick = function () { openFavs(el.dataset.ff); }; });
  sheetBody.querySelectorAll('[data-fo]').forEach(function (el) { el.onclick = function () { var x = f[el.dataset.fo]; closeSheet(); closeSearch(); showChapter(x.b, x.c, [x.v]); }; });
  sheetBody.querySelectorAll('[data-fm]').forEach(function (el) {
    el.onclick = function () {
      var k = el.dataset.fm, box = document.getElementById('fe-' + k), x = f[k];
      if (!box.hidden) { box.hidden = true; return; }
      box.hidden = false;
      box.innerHTML = '<div class="set-t">Colour</div><div class="favcols">' + FAV_COLOURS.map(function (c) { return '<button type="button" class="favcol c-' + c[0] + ((x.color || favColour()) === c[0] ? ' on' : '') + '" data-fc="' + c[0] + '" aria-label="' + c[1] + '"></button>'; }).join('') + '</div>' +
        '<div class="set-t" style="margin-top:.7rem">Themes</div><div id="ft-' + k + '"></div><div class="actions"><button class="danger" data-fx="1">Remove from favourites</button></div>';
      nvMountTags('ft-' + k, 'f:' + k);
      box.querySelectorAll('[data-fc]').forEach(function (b) { b.onclick = function () { var a = favAll(); if (a[k]) { a[k].color = b.dataset.fc; favSave(a); } openFavs(flt); }; });
      box.querySelector('[data-fx]').onclick = function () { var a = favAll(); delete a[k]; favSave(a); nvSetTags('f:' + k, []); toast('Removed from favourites'); openFavs(flt); };
    };
  });
  document.getElementById('favSet').onclick = openSettings;
}
function favSettingsHtml() {
  return '<div class="set"><div class="set-t">Favourite verses: highlight colour</div><div class="favcols" id="sFavCol">' + FAV_COLOURS.map(function (c) { return '<button type="button" class="favcol c-' + c[0] + (favColour() === c[0] ? ' on' : '') + '" data-val="' + c[0] + '" aria-label="' + c[1] + '"></button>'; }).join('') +
    '</div><p class="status">New favourites use this colour. Each favourite can be given its own colour in Favourite verses.</p></div>';
}
function favBindSettings() {
  var box = document.getElementById('sFavCol'); if (!box) return;
  box.querySelectorAll('button').forEach(function (b) { b.onclick = function () { S.favColor = b.dataset.val; saveSettings(); box.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
}
