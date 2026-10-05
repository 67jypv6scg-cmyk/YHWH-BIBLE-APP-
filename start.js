// Noble Vine Study & Discipleship · 2.0.0 · Start-up
'use strict';
// ======================================================================
// Start
// ======================================================================
(async function start() {
  await idbPreload();
  nvRegisterUpdates();
  Object.assign(S, lsGet('nb-settings', {}));
  applyLook();
  await initStore();
  try { if (window.claude && typeof window.claude.use === 'function') downloads = await window.claude.use('downloads'); } catch (e) {}
  if (!downloads) downloads = { save: async function (o) {
    var file = new File([o.data], o.filename, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return; }
      catch (e) { if (e && e.name === 'AbortError') throw { code: 'declined' }; }
    }
    var url = URL.createObjectURL(file), a = document.createElement('a');
    a.href = url; a.download = o.filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  } };
  try { await loadAll(); } catch (e) { toast('Couldn’t load your Bible. Check your connection.'); }
  if (S.name === 'Yahweh') { S.name = 'Yahowah'; saveSettings(); }
  if (Array.isArray(S.cmp) && S.cmp.indexOf('kjv') >= 0) { S.cmp = ['esv', 'web', 'asv']; saveSettings(); }
  if (!S.fixRuach1) { var fixedR = fixRuachArticles(); S.fixRuach1 = true; saveSettings(); if (fixedR) setTimeout(function () { toast('Tidied “the Ruach ha-Qodesh” in ' + fixedR.toLocaleString() + ' verses'); }, 4200); }
  if (!S.fixAdonai1) { var fixedN = fixAdonaiArticles(); S.fixAdonai1 = true; saveSettings(); if (fixedN) setTimeout(function () { toast('Tidied the wording around Adonai in ' + fixedN.toLocaleString() + ' verses'); }, 1800); }
  if (S.bibleName) MEM_MODES[0][1] = bibleShort();
  try { await loadPlan(); } catch (e) {}
  try { nvCheckOneOff(); } catch (e) {}
  try { await loadNotes(); } catch (e) {}
  applyLook();
  var at = S.last && has(S.last.b, S.last.c) ? S.last : firstLoaded();
  if (at) showChapter(at.b, at.c); else renderEmpty();
  if (at) {
    var away = Date.now() - lastActive(), rs = getResume(), view = (function () { try { return localStorage.getItem('nb-view'); } catch (e) { return null; } })();
    var firstToday = S.todaySeen !== todayYmd();
    if (firstToday) { S.todaySeen = todayYmd(); saveSettings(); }
    if (lastActive() && away < AWAY_MS) {
      // a short trip away: pick up exactly where you were
      if (rs && rs.k === 'import') openImport(rs.b, rs.c);
      else if (view !== 'read') showHome();
    } else {
      hiddenSet('nb-hide', {});
      showHome();
      var mode = selahMode();
      if (mode === 'away' || (mode === 'daily' && firstToday)) showSelah();
    }
  }
  markActive();
  nvHideSplash();
})();

window.__nb = { parseImport: parseImport, parseRef: parseRef, runSearch: runSearch, chapters: function () { return chapters; } };
