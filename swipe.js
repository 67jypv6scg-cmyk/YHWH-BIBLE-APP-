// Noble Vine Study & Discipleship · 2.4.0 · Swipe between chapters
'use strict';
// Standalone: swipe left for the next chapter, right for the previous one. It simply presses the buttons
// that are already on the page, so it can be switched off or removed without touching anything else.
var nvSwipe = { x: 0, y: 0, t: 0, ok: false };
function nvSwipeOn() { return S.swipe !== false; }
function nvSwipeAllowed(target) {
  if (!nvSwipeOn()) return false;
  if (typeof homeOn !== 'undefined' && homeOn) return false;
  if (!document.getElementById('sheet').classList.contains('hidden')) return false;
  if (typeof selected !== 'undefined' && selected.size) return false;
  if (typeof hebView !== 'undefined' && hebView) return false;
  if (typeof cmpView !== 'undefined' && cmpView) return false;
  if (!target || !target.closest) return false;
  if (target !== document.body && target !== document.documentElement && !main.contains(target)) return false; // empty space below a short chapter counts too
  if (target.closest('input, textarea, select, audio, [contenteditable], .planbar, .nvtools, .refchips')) return false;
  return true;
}
document.addEventListener('touchstart', function (e) {
  nvSwipe.ok = false;
  if (e.touches.length !== 1) return;
  var t = e.touches[0], w = window.innerWidth;
  if (t.clientX < 28 || t.clientX > w - 28) return; // leave the screen edges to iOS
  if (!nvSwipeAllowed(e.target)) return;
  nvSwipe.x = t.clientX; nvSwipe.y = t.clientY; nvSwipe.t = Date.now(); nvSwipe.ok = true;
}, { passive: true });
document.addEventListener('touchend', function (e) {
  if (!nvSwipe.ok) return; nvSwipe.ok = false;
  var t = e.changedTouches[0], dx = t.clientX - nvSwipe.x, dy = t.clientY - nvSwipe.y;
  if (Date.now() - nvSwipe.t > 900 || Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.5) return;
  var sel = window.getSelection && window.getSelection(); if (sel && String(sel).length) return;
  var btn = document.querySelector(dx < 0 ? '#nextCh, #pnNext' : '#prevCh, #pnPrev');
  if (!btn || btn.disabled) return;
  btn.click();
  try { if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) main.animate([{ transform: 'translateX(' + (dx < 0 ? 28 : -28) + 'px)', opacity: 0.35 }, { transform: 'none', opacity: 1 }], { duration: 200, easing: 'ease-out' }); } catch (x) {}
}, { passive: true });
// A setting, placed under the Study tools one when Settings is opened
function nvSwipeSettingsHtml() {
  return '<div class="set" id="sSwipeBox"><div class="set-t">Swipe to change chapter</div>' + segBtns('sSwipe', [['on', 'On'], ['off', 'Off']], nvSwipeOn() ? 'on' : 'off') +
    '<p class="status">While reading, swipe left for the next chapter and right for the previous one. In a reading plan it moves through that day’s readings.</p></div>';
}
onReady(function () {
  new MutationObserver(function () {
    var anchor = document.getElementById('sTools'); if (!anchor || document.getElementById('sSwipeBox')) return;
    var host = anchor.closest('.set') || anchor.parentNode;
    host.insertAdjacentHTML('afterend', nvSwipeSettingsHtml());
    var box = document.getElementById('sSwipe');
    box.querySelectorAll('button').forEach(function (bt) {
      bt.onclick = function () { S.swipe = bt.dataset.val !== 'off'; saveSettings(); box.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === bt); }); };
    });
  }).observe(sheetBody, { childList: true });
});
