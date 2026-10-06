// Noble Vine Study & Discipleship · 2.2.0 · Study tools on the side
'use strict';
// ======================================================================
// Study tools: a discreet sprig button at the edge of the screen while reading.
// It tucks into the edge while you scroll, and opens only when you tap the sprig.
// With verses selected, the tools act on those verses.
// ======================================================================
var nvTools = { el: null, scrollT: null, drag: null };
var NV_TOOLS = [
  { id: 'heb', label: 'Hebrew', c: 'blue', heb: 'א', verse: true, ot: true },
  { id: 'cmp', label: 'Compare', c: 'olive', ic: 'compare', verse: true },
  { id: 'panel', label: 'Study panel', c: 'gold', ic: 'panel' },
  { id: 'com', label: 'Commentary', c: 'stone', ic: 'comment', verse: true },
  { id: 'note', label: 'Note', c: 'purple', ic: 'pen', verse: true },
  { id: 'rec', label: 'Record', c: 'clay', ic: 'mic' }
];
function nvToolsIcon(n) {
  var P = { compare: '<rect x="3.5" y="5" width="7" height="14" rx="1.5"/><rect x="13.5" y="5" width="7" height="14" rx="1.5"/>', panel: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M13 4.5v15"/>',
    comment: '<path d="M4 5h16v11H9l-5 4z"/>', pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 7l3 3"/>', mic: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>' };
  return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>';
}
function nvToolsSel() { var vs = Array.from(selected).sort(function (a, z) { return a - z; }); return vs.length ? { v1: vs[0], v2: vs[vs.length - 1] } : null; }
function nvToolsEnsure() {
  if (nvTools.el) return nvTools.el;
  var el = nvTools.el = document.createElement('div');
  el.id = 'nvTools'; el.className = 'nvtools'; el.hidden = true;
  el.innerHTML = '<div class="nvt-scrim" id="nvtScrim"></div><div class="nvt-rail" id="nvtRail" role="menu" aria-label="Study tools"></div>' +
    '<button type="button" class="nvt-fab" id="nvtFab" aria-label="Study tools" aria-expanded="false" aria-controls="nvtRail"><span class="nvt-sprig">' + nvSprig(26, 2.2) + '</span><span class="nvt-x">' + nvToolsIcon('x') + '</span></button>';
  document.body.appendChild(el);
  var fab = document.getElementById('nvtFab');
  fab.addEventListener('pointerdown', function (e) { nvTools.drag = { y: e.clientY, start: nvToolsY(), moved: false, id: e.pointerId }; });
  fab.addEventListener('pointermove', function (e) {
    var d = nvTools.drag; if (!d || el.classList.contains('open')) return;
    if (!d.moved && Math.abs(e.clientY - d.y) < 10) return;
    if (!d.moved) { d.moved = true; try { fab.setPointerCapture(d.id); } catch (x) {} }
    var y = Math.max(90, Math.min(window.innerHeight - 140, d.start - (e.clientY - d.y)));
    el.style.setProperty('--nvt-y', y + 'px');
  });
  fab.addEventListener('pointerup', function () {
    var d = nvTools.drag; nvTools.drag = null;
    if (d && d.moved) { S.toolsY = parseInt(getComputedStyle(el).getPropertyValue('--nvt-y'), 10) || null; saveSettings(); fab.dataset.justDragged = '1'; setTimeout(function () { delete fab.dataset.justDragged; }, 50); }
  });
  fab.addEventListener('click', function () {
    if (fab.dataset.justDragged) return;
    nvToolsOpen(!el.classList.contains('open'));
  });
  document.getElementById('nvtScrim').onclick = function () { nvToolsOpen(false); };
  el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { nvToolsOpen(false); fab.focus(); } });
  return el;
}
function nvToolsY() { return S.toolsY || 150; }
function nvToolsOpen(on) {
  var el = nvToolsEnsure(), fab = document.getElementById('nvtFab');
  if (on) nvToolsRail();
  el.classList.toggle('open', !!on); el.classList.remove('tucked');
  fab.setAttribute('aria-expanded', on ? 'true' : 'false'); fab.setAttribute('aria-label', on ? 'Close study tools' : 'Study tools');
  if (on) setTimeout(function () { var f = el.querySelector('.nvt-item'); if (f) f.focus(); }, 60);
}
function nvToolsRail() {
  var sel = nvToolsSel(), b = pos.b, c = pos.c;
  var vtxt = sel ? (sel.v1 === sel.v2 ? 'v. ' + sel.v1 : 'vv. ' + sel.v1 + '–' + sel.v2) : '';
  var h = sel ? '<div class="nvt-head">' + esc(bn(b) + ' ' + c + ':' + sel.v1 + (sel.v2 !== sel.v1 ? '–' + sel.v2 : '')) + ' selected</div>' : '';
  NV_TOOLS.forEach(function (t) {
    if (t.ot && b >= NT_START) return;
    var label = t.label + (t.id === 'panel' ? (S.panelOn ? ': close' : '') : (sel && t.verse ? ' · ' + vtxt : ''));
    h += '<button type="button" class="nvt-item c-' + t.c + '" role="menuitem" data-tool="' + t.id + '"><span class="nvt-lab">' + esc(label) + '</span><span class="nvt-disc">' + (t.heb ? '<span class="nvt-heb">' + t.heb + '</span>' : nvToolsIcon(t.ic)) + '</span></button>';
  });
  var rail = document.getElementById('nvtRail'); rail.innerHTML = h;
  rail.querySelectorAll('[data-tool]').forEach(function (btn) { btn.onclick = function () { nvToolsRun(btn.dataset.tool); }; });
}
function nvToolsRun(id) {
  var sel = nvToolsSel(), b = pos.b, c = pos.c, v = sel ? sel.v1 : nvPanelTopVerse();
  nvToolsOpen(false);
  if (id === 'heb') showHebrew(b, c, sel ? v : undefined);
  else if (id === 'cmp') showCompare(b, c, sel ? v : undefined);
  else if (id === 'panel') nvPanelToggle();
  else if (id === 'com') openCommentary(b, c, v);
  else if (id === 'note') openNoteEditor(b, c, sel ? sel.v1 : v, sel ? sel.v2 : v, 'read');
  else if (id === 'rec') { var r = document.getElementById('toVoice'); if (r) r.click(); }
}
// Shown only while reading a chapter (and when switched on in Settings)
function nvToolsUpdate() {
  var on = S.toolsOn !== false && !homeOn && !!main.querySelector('.text') && has(pos.b, pos.c);
  var el = nvToolsEnsure(); el.hidden = !on;
  el.classList.toggle('left', S.toolsSide === 'left');
  el.style.setProperty('--nvt-y', (document.body.classList.contains('nvm-on') ? Math.max(nvToolsY(), 230) : nvToolsY()) + 'px');
  if (!on) nvToolsOpen(false);
}
// Tuck into the edge while scrolling; back to a small sprig a moment after you stop
window.addEventListener('scroll', function () {
  var el = nvTools.el; if (!el || el.hidden || el.classList.contains('open')) return;
  el.classList.add('tucked');
  clearTimeout(nvTools.scrollT); nvTools.scrollT = setTimeout(function () { el.classList.remove('tucked'); }, 1500);
}, { passive: true });
function nvToolsSettingsHtml() {
  return '<div class="set"><div class="set-t">Study tools button</div>' + segBtns('sTools', [['right', 'Right edge'], ['left', 'Left edge'], ['off', 'Off']], S.toolsOn === false ? 'off' : (S.toolsSide || 'right')) +
    '<p class="status">The sprig at the edge of a chapter. It tucks away while you scroll; tap it for Hebrew, Compare, the study panel, commentary, notes and recording. Drag it up or down to move it.</p></div>';
}
function nvToolsBindSettings() {
  var box = document.getElementById('sTools'); if (!box) return;
  box.querySelectorAll('button').forEach(function (bt) {
    bt.onclick = function () { var v = bt.dataset.val; S.toolsOn = v !== 'off'; if (v !== 'off') S.toolsSide = v; saveSettings(); box.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === bt); }); nvToolsUpdate(); };
  });
}
onReady(function () { new MutationObserver(function () { nvToolsUpdate(); }).observe(main, { childList: true }); nvToolsUpdate(); });
