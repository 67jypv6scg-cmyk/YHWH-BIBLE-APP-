// Noble Vine Study & Discipleship · 2.5.0 · Remember where you were
'use strict';
// Standalone. Saves your reading place (chapter, verse at the top, plan reading, Hebrew/Compare view) and any
// half-written note, dream or word, and puts you back when the app has to start again after you leave it.
// It wraps a few existing functions instead of changing them, so it can be removed by deleting its script line.
var NV_WHERE_KEY = 'nv-where', NV_DRAFT_KEY = 'nv-draft', NV_WHERE_MS = 12 * 60 * 60 * 1000;
function nvRememberOn() { return S.remember !== false; }
function nvLsGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
function nvLsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

// ---- 1. Where you are in the Bible ----
function nvTopVerse() {
  var vs = main.querySelectorAll('.v'), bar = document.querySelector('.bar'), top = (bar ? bar.getBoundingClientRect().bottom : 56) + 4;
  for (var i = 0; i < vs.length; i++) if (vs[i].getBoundingClientRect().bottom > top) return +vs[i].dataset.v || null;
  return null;
}
function nvSaveWhere() {
  if (!nvRememberOn() || !nvReady) return;
  if (typeof homeOn !== 'undefined' && homeOn) return;
  if (!pos || typeof pos.b !== 'number') return;
  var w = { t: Date.now(), b: pos.b, c: pos.c, v: null, mode: hebView ? 'heb' : cmpView ? 'cmp' : 'read', plan: null };
  if (w.mode === 'read') w.v = nvTopVerse();
  if (planCtx && w.mode === 'read') w.plan = { slot: planCtx.slot || 'bible', d: planCtx.d, i: planCtx.i };
  nvLsSet(NV_WHERE_KEY, w);
}
var nvWhereT = null;
function nvSaveWhereSoon() { clearTimeout(nvWhereT); nvWhereT = setTimeout(nvSaveWhere, 500); }
window.addEventListener('scroll', nvSaveWhereSoon, { passive: true });
document.addEventListener('visibilitychange', function () { if (document.hidden) { nvSaveWhere(); nvSaveDraft(true); } });
window.addEventListener('pagehide', function () { nvSaveWhere(); nvSaveDraft(true); });
onReady(function () { new MutationObserver(nvSaveWhereSoon).observe(main, { childList: true }); });

async function nvRestoreWhere() {
  var w = nvLsGet(NV_WHERE_KEY);
  if (!w || Date.now() - w.t > NV_WHERE_MS || !has(w.b, w.c)) return false;
  if (w.mode === 'heb') { await showHebrew(w.b, w.c); return true; }
  if (w.mode === 'cmp') { await showCompare(w.b, w.c); return true; }
  try {
    if (w.plan) { usePlan(w.plan.slot); var list = dayList(w.plan.d), x = list && list[w.plan.i]; if (x && x.b === w.b && x.c === w.c) planCtx = { slot: w.plan.slot, d: w.plan.d, list: list, i: w.plan.i }; }
  } catch (e) {}
  showChapter(w.b, w.c);
  if (w.v) setTimeout(function () {
    var el = document.getElementById('v' + w.v), bar = document.querySelector('.bar');
    if (el) { el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -((bar ? bar.getBoundingClientRect().bottom : 56) + 8)); }
  }, 80);
  return true;
}

// ---- 2. Half-written notes, dreams and words ----
var nvDraftCtx = null, nvDraftT = null;
['openDream', 'openProph', 'openNoteEditor', 'openPlanNote'].forEach(function (name) {
  var orig = window[name]; if (typeof orig !== 'function') return;
  window[name] = function () {
    var a = Array.prototype.slice.call(arguments);
    try { JSON.stringify(a); nvDraftCtx = { fn: name, args: a }; } catch (e) { nvDraftCtx = null; }
    return orig.apply(this, arguments);
  };
});
// Opening another sheet, or closing this one on purpose, means the draft was dealt with
(function () {
  var os = window.openSheet, cs = window.closeSheet;
  window.openSheet = function () { nvLsSet(NV_DRAFT_KEY, null); return os.apply(this, arguments); };
  window.closeSheet = function () { nvLsSet(NV_DRAFT_KEY, null); nvDraftCtx = null; return cs.apply(this, arguments); };
})();
function nvSaveDraft(now) {
  if (!nvRememberOn() || !nvDraftCtx) return;
  var fields = {}, any = false;
  sheetBody.querySelectorAll('textarea[id], input[type=text][id]').forEach(function (el) { fields[el.id] = el.value; if (el.value.trim()) any = true; });
  if (!any) return;
  nvLsSet(NV_DRAFT_KEY, { t: Date.now(), ctx: nvDraftCtx, fields: fields });
}
onReady(function () {
  sheetBody.addEventListener('input', function () { clearTimeout(nvDraftT); nvDraftT = setTimeout(nvSaveDraft, 700); });
});
var NV_DRAFT_WHAT = { openDream: 'dream', openProph: 'word', openNoteEditor: 'note', openPlanNote: 'note' };
function nvOfferDraft() {
  var d = nvLsGet(NV_DRAFT_KEY);
  if (!d || !d.ctx || Date.now() - d.t > NV_WHERE_MS || typeof window[d.ctx.fn] !== 'function') { nvLsSet(NV_DRAFT_KEY, null); return; }
  var what = NV_DRAFT_WHAT[d.ctx.fn] || 'note';
  var st = document.createElement('style');
  st.textContent = '#nvDraft{position:fixed;left:12px;right:12px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:60;background:var(--bg,#161816);color:var(--ink,#f3f1ea);border:1px solid var(--rule,rgba(255,255,255,.2));border-radius:14px;padding:.9rem 1rem;box-shadow:0 8px 30px rgba(0,0,0,.45)}#nvDraft b{display:block;margin-bottom:.2rem}#nvDraft .r{display:flex;gap:.6rem;margin-top:.7rem}#nvDraft button{flex:1;padding:.6rem;border-radius:10px;border:1px solid var(--rule,rgba(255,255,255,.2));background:none;color:inherit;font:inherit}#nvDraft button.p{background:var(--accent,#d9b84e);color:#111;border-color:transparent;font-weight:700}';
  var box = document.createElement('div'); box.id = 'nvDraft'; box.setAttribute('role', 'dialog');
  box.innerHTML = '<b>You left a ' + what + ' unfinished</b><span>Pick up where you stopped?</span><div class="r"><button type="button" id="nvDraftNo">Discard</button><button type="button" class="p" id="nvDraftYes">Continue</button></div>';
  document.body.appendChild(st); document.body.appendChild(box);
  function done() { box.remove(); st.remove(); }
  document.getElementById('nvDraftNo').onclick = function () { nvLsSet(NV_DRAFT_KEY, null); done(); };
  document.getElementById('nvDraftYes').onclick = async function () {
    done();
    try { window[d.ctx.fn].apply(null, d.ctx.args); } catch (e) { return; }
    var ids = Object.keys(d.fields), tries = 0;
    (function fill() {
      var ready = ids.every(function (id) { return document.getElementById(id); });
      if (!ready && tries++ < 30) { setTimeout(fill, 100); return; }
      ids.forEach(function (id) { var el = document.getElementById(id); if (el && el.value !== d.fields[id]) { el.value = d.fields[id]; el.dispatchEvent(new Event('input', { bubbles: true })); } });
    })();
  };
}

// ---- 3. Put it all back when the app starts again ----
var nvAppReadyOrig = window.nvAppReady;
window.nvAppReady = function () {
  if (nvAppReadyOrig) nvAppReadyOrig.apply(this, arguments);
  if (!nvRememberOn()) return;
  setTimeout(async function () { try { await nvRestoreWhere(); } catch (e) {} nvOfferDraft(); }, 60);
};

// ---- Settings switch ----
onReady(function () {
  new MutationObserver(function () {
    var anchor = document.getElementById('sSwipeBox') || (document.getElementById('sTools') && (document.getElementById('sTools').closest('.set') || document.getElementById('sTools').parentNode));
    if (!anchor || document.getElementById('sRememberBox')) return;
    anchor.insertAdjacentHTML('afterend', '<div class="set" id="sRememberBox"><div class="set-t">Remember where I was</div>' + segBtns('sRemember', [['on', 'On'], ['off', 'Off']], nvRememberOn() ? 'on' : 'off') +
      '<p class="status">If your phone closes the app while you are away, it puts you back in the same chapter, at the same verse, and offers to bring back anything half-written. A recording in progress cannot be kept.</p></div>');
    var box = document.getElementById('sRemember');
    box.querySelectorAll('button').forEach(function (bt) {
      bt.onclick = function () { S.remember = bt.dataset.val !== 'off'; saveSettings(); if (!S.remember) { nvLsSet(NV_WHERE_KEY, null); nvLsSet(NV_DRAFT_KEY, null); } box.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === bt); }); };
    });
  }).observe(sheetBody, { childList: true });
});
