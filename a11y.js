// Noble Vine Study & Discipleship · 2.1.0 · Keyboard and screen-reader support for sheets and full-screen pages
'use strict';
// ======================================================================
// When a sheet or a full-screen page opens, focus moves into it and Tab stays inside it;
// when it closes, focus returns to the button that opened it.
// ======================================================================
var nvFocus = { from: null };
function nvTrapTab(box, e) {
  if (e.key !== 'Tab') return;
  var els = Array.prototype.filter.call(box.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'), function (x) { return x.offsetParent !== null && !x.hidden; });
  if (!els.length) return;
  var first = els[0], last = els[els.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
function nvWatchOverlay(el, firstFocus) {
  if (!el) return;
  new MutationObserver(function () {
    var open = !el.classList.contains('hidden');
    if (open && !el.dataset.nvOpen) {
      el.dataset.nvOpen = '1'; nvFocus.from = document.activeElement;
      setTimeout(function () { var f = firstFocus(); if (f && document.activeElement && !el.contains(document.activeElement)) f.focus(); }, 30);
    } else if (!open && el.dataset.nvOpen) {
      delete el.dataset.nvOpen;
      var back = nvFocus.from; nvFocus.from = null;
      if (back && document.contains(back) && back.focus) try { back.focus(); } catch (e) {}
    }
  }).observe(el, { attributes: true, attributeFilter: ['class'] });
  el.addEventListener('keydown', function (e) { nvTrapTab(el, e); });
}
onReady(function () {
  var title = document.getElementById('sheetTitle'); if (title) title.setAttribute('tabindex', '-1');
  nvWatchOverlay(document.getElementById('sheet'), function () { return document.getElementById('sheetTitle'); });
  nvWatchOverlay(document.getElementById('wordpage'), function () { return document.getElementById('wpClose'); });
  nvWatchOverlay(document.getElementById('selah'), function () { return document.getElementById('selah'); });
  var sel = document.getElementById('selah'); if (sel) { sel.setAttribute('tabindex', '-1'); sel.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.key === 'Enter') sel.click(); }); }
  var wp = document.getElementById('wordpage'); if (wp) wp.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var x = document.getElementById('wpClose'); if (x) x.click(); } });
});
