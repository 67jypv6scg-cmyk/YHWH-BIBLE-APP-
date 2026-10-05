// Noble Vine Study & Discipleship · 2.0.1 · Back buttons
'use strict';
// ======================================================================
// Back: every sheet remembers the one before it ("‹ Back" at the top of the sheet), and when a
// sheet takes you into the Bible, a "‹" button in the top bar brings you back to where you were.
// ======================================================================
var nvNav = { pending: null, current: null, stack: [], going: false, userClose: false, ret: null };
// Each screen that opens a sheet is wrapped, so the app knows how to reopen it
function nvWrapSheetOpeners() {
  Object.getOwnPropertyNames(window).forEach(function (n) {
    if (n === 'openSheet' || n === 'closeSheet' || n.indexOf('nv') === 0 && n !== 'nvThemeSearch' && n.indexOf('nvJourney') < 0) return;
    var f; try { f = window[n]; } catch (e) { return; }
    if (typeof f !== 'function' || f.__nvWrapped) return;
    var src; try { src = Function.prototype.toString.call(f); } catch (e) { return; }
    if (src.indexOf('openSheet(') < 0 || src.indexOf('[native code]') >= 0) return;
    var w = function () { nvNav.pending = { fn: w, args: Array.prototype.slice.call(arguments) }; return f.apply(this, arguments); };
    w.__nvWrapped = true;
    try { window[n] = w; } catch (e) {}
  });
}
// Called by openSheet each time a sheet opens
function nvNavOpened(title) {
  var entry = nvNav.pending || { fn: null, args: [] }; nvNav.pending = null; entry.title = title;
  var wasOpen = nvNav.current && !document.getElementById('sheet').classList.contains('hidden');
  if (!nvNav.going && wasOpen && nvNav.current.fn && entry.fn !== nvNav.current.fn) nvNav.stack.push(nvNav.current);
  if (!wasOpen && !nvNav.going) nvNav.stack = [];
  nvNav.current = entry; nvNav.going = false;
  var b = document.getElementById('sheetBack'), prev = nvNav.stack[nvNav.stack.length - 1];
  if (b) { b.hidden = !prev; if (prev) { b.textContent = '‹ ' + (prev.title.length > 16 ? 'Back' : prev.title); b.setAttribute('aria-label', 'Back to ' + prev.title); } }
  nvHideTopBack();
}
function nvSheetBack() {
  var prev = nvNav.stack.pop(); if (!prev || !prev.fn) return;
  nvNav.going = true; prev.fn.apply(null, prev.args);
}
// Called by closeSheet: closing with Done forgets the trail; being taken into the Bible keeps it for "‹"
function nvNavClosed() {
  if (nvNav.userClose || !nvNav.current || !nvNav.current.fn) { nvNav.ret = null; nvHideTopBack(); }
  else { nvNav.ret = { entry: nvNav.current, stack: nvNav.stack.slice() }; setTimeout(nvShowTopBack, 0); }
  nvNav.userClose = false; nvNav.current = null; nvNav.stack = [];
}
function nvUserCloseSheet() { nvNav.userClose = true; closeSheet(); }
// For screens that are not sheets (search results)
function nvReturnTo(title, fn) { nvNav.ret = { entry: { title: title, fn: fn, args: [], view: true }, stack: [] }; setTimeout(nvShowTopBack, 0); }
function nvShowTopBack() {
  var b = document.getElementById('navBack'); if (!b || !nvNav.ret) return;
  b.hidden = false; b.setAttribute('aria-label', 'Back to ' + nvNav.ret.entry.title); b.title = 'Back to ' + nvNav.ret.entry.title;
  var l = document.getElementById('navBackL'); if (l) l.textContent = nvNav.ret.entry.title.length > 14 ? 'Back' : nvNav.ret.entry.title;
}
function nvHideTopBack() { var b = document.getElementById('navBack'); if (b) b.hidden = true; }
function nvTopBack() {
  var r = nvNav.ret; nvNav.ret = null; nvHideTopBack(); if (!r) return;
  if (r.entry.view) { r.entry.fn(); return; }
  nvNav.going = true; r.entry.fn.apply(null, r.entry.args);
  nvNav.stack = r.stack;
  var b = document.getElementById('sheetBack'), prev = nvNav.stack[nvNav.stack.length - 1];
  if (b) { b.hidden = !prev; if (prev) b.textContent = '‹ ' + (prev.title.length > 16 ? 'Back' : prev.title); }
}
onReady(function () {
  nvWrapSheetOpeners();
  var sb = document.getElementById('sheetBack'); if (sb) sb.onclick = nvSheetBack;
  var nb = document.getElementById('navBack'); if (nb) nb.onclick = nvTopBack;
  // The Home, Plan and More tabs start afresh
  document.querySelectorAll('#tabs button').forEach(function (t) { t.addEventListener('click', function () { if (t.dataset.tab !== 'read') { nvNav.ret = null; nvHideTopBack(); } }); });
});
