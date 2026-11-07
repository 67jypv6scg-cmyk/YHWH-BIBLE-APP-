// Noble Vine Study & Discipleship · 2.10 · Quick return
// Standalone. When you leave the app for a few minutes and come back (copying to Notes, for example) and your
// phone has to start it again, this (1) skips the long Noble Vine splash and goes straight to where you were,
// (2) brings back the plan screen (Today or the tracker) if that is what you had open, and (3) re-finds your
// place in today's plan reading even if the plan has moved on a little. It wraps a few functions and changes none
// of them, so deleting its script line removes it. Longer absences still open as before (home page, opening animation).
'use strict';
var NVQ_MS = 10 * 60 * 1000, nvqHold = false, nvqSheet = null;
function nvqWhere() { var w = nvLsGet(NV_WHERE_KEY); return w && Date.now() - w.t < NVQ_MS ? w : null; }
function nvqQuick() { return nvRememberOn() && !!nvqWhere(); }
function nvqReveal() {
  if (!nvqHold) return; nvqHold = false; nvSplashDone = true;
  var el = document.getElementById('nvSplash'); if (!el) return;
  el.style.transition = 'opacity .18s'; el.classList.add('gone');
  setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 500);
}

// 1. The splash waits for your place to be put back, then goes at once
(function () {
  var hide0 = window.nvHideSplash;
  window.nvHideSplash = function () {
    if (nvSplashDone) return;
    if (nvqQuick()) { nvqHold = true; setTimeout(nvqReveal, 2500); return; }
    return hide0.apply(this, arguments);
  };
})();

// 2. Remember which plan screen was open
function nvqTrack(name, kind) {
  var orig = window[name]; if (typeof orig !== 'function') return;
  window[name] = function () { var r = orig.apply(this, arguments); nvqSheet = { kind: kind, slot: typeof planSlot !== 'undefined' ? planSlot : 'bible' }; return r; };
}
nvqTrack('openToday', 'today'); nvqTrack('openTracker', 'tracker');
(function () {
  var os = window.openSheet, cs = window.closeSheet;
  window.openSheet = function () { nvqSheet = null; return os.apply(this, arguments); };
  window.closeSheet = function () { nvqSheet = null; return cs.apply(this, arguments); };
  var sw0 = window.nvSaveWhere;
  window.nvSaveWhere = function () {
    var r = sw0.apply(this, arguments);
    try {
      var w = nvLsGet(NV_WHERE_KEY);
      if (w && w.mode === 'read') { var open = !document.getElementById('sheet').classList.contains('hidden'); if (open && nvqSheet) w.sheet = nvqSheet; else delete w.sheet; nvLsSet(NV_WHERE_KEY, w); }
    } catch (e) {}
    return r;
  };
})();

// 3. Put it back: find the chapter in the plan day by name, then reopen the plan screen
(function () {
  var rw0 = window.nvRestoreWhere;
  window.nvRestoreWhere = async function () {
    var ok = false;
    try {
      var w = nvLsGet(NV_WHERE_KEY);
      if (w && w.plan) {
        try {
          usePlan(w.plan.slot); var list = dayList(w.plan.d), at = -1;
          (list || []).forEach(function (x, i) { if (at < 0 && x.b === w.b && x.c === w.c) at = i; });
          if (at >= 0 && at !== w.plan.i) { w.plan.i = at; nvLsSet(NV_WHERE_KEY, w); }
        } catch (e) {}
      }
      ok = await rw0.apply(this, arguments);
      if (ok && w && w.sheet) {
        setTimeout(function () {
          try { usePlan(w.sheet.slot || 'bible'); if (w.sheet.kind === 'tracker') openTracker(); else if (w.sheet.kind === 'today') openToday(); } catch (e) {}
        }, 120);
      }
    } finally { setTimeout(nvqReveal, 200); }
    return ok;
  };
})();
