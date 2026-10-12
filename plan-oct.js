// Noble Vine Study & Discipleship · 2.7 · Bespoke plan: the whole Bible, 13 October to 30 November 2026
'use strict';
// Every day: an Old Testament portion, a Psalms portion (all 150 Psalms) and a New Testament portion,
// balanced so each day is about the same length. Offered in Bible reading plan; your current plan is kept
// safe and comes back when this one is finished.
var NV_OCT = { id: 'oct49', name: 'Whole Bible · 13 Oct to 30 Nov 2026', start: '2026-10-13', days: 49, prevKey: 'nb-plan-prev-oct', doneKey: 'nv-oct-done' };
function nvOctDone() { try { return localStorage.getItem(NV_OCT.doneKey) === '1'; } catch (e) { return false; } }
function nvOctSchedule() {
  var ot = [], nt = [], ps = [];
  for (var b = 0; b < BOOKS.length; b++) for (var c = 1; c <= BOOKS[b][1]; c++) (b === 18 ? ps : b < NT_START ? ot : nt).push({ b: b, c: c, w: chWeight(b, c) });
  var perDay = []; for (var i = 0; i < NV_OCT.days; i++) perDay.push([[], [], []]);
  [ot, ps, nt].forEach(function (list, si) {
    var W = list.reduce(function (a, x) { return a + x.w; }, 0), T = W / NV_OCT.days, cum = 0;
    list.forEach(function (x) { var d = Math.min(NV_OCT.days - 1, Math.floor((cum + x.w / 2) / T)); perDay[d][si].push(key(x.b, x.c)); cum += x.w; });
  });
  return perDay.map(function (d) { return d.map(function (s) { return s.join(','); }).join('|'); });
}
function nvStartOct() {
  try { if (plans.bible && !(plans.bible.type === NV_OCT.id)) localStorage.setItem(NV_OCT.prevKey, JSON.stringify(plans.bible)); } catch (e) {}
  usePlan('bible');
  plan = { type: NV_OCT.id, name: NV_OCT.name, days: NV_OCT.days, passes: 1, scope: 'all', start: NV_OCT.start, schedule: nvOctSchedule(), done: {}, ticks: {}, pausedFrom: null, created: Date.now() };
  savePlan(true);
  toast('Plan started. Day 1 is 13 October.');
  openPlanDay(firstOpen());
}
// When it is finished: retire it and bring back the plan you had before
function nvCheckOct() {
  var p = plans.bible; if (!p || p.type !== NV_OCT.id) return;
  var sl = planSlot; usePlan('bible');
  if (firstOpen()) { usePlan(sl); return; }
  try { localStorage.setItem(NV_OCT.doneKey, '1'); } catch (e) {}
  var prev = null; try { prev = JSON.parse(localStorage.getItem(NV_OCT.prevKey) || 'null'); localStorage.removeItem(NV_OCT.prevKey); } catch (e) {}
  plan = prev && prev.schedule ? prev : null; savePlan(true); usePlan(sl);
  setTimeout(function () { toast('The whole Bible, 13 Oct to 30 Nov: complete. Well done!' + (prev ? ' Your earlier plan is back.' : '')); }, 600);
}
var nvOctReadyOrig = window.nvAppReady;
window.nvAppReady = function () { if (nvOctReadyOrig) nvOctReadyOrig.apply(this, arguments); try { nvCheckOct(); } catch (e) {} };

function nvOctCard() {
  var prev = plan, sched = nvOctSchedule(), pvw = '';
  plan = { schedule: sched, days: NV_OCT.days, passes: 1 };
  try { pvw = [1, 2, 3].map(function (d) { var l = dayList(d); return '<p style="margin:.2rem 0"><b>Day ' + d + ':</b> ' + esc(groupRefs(l)) + '</p>'; }).join(''); } catch (e) {}
  plan = prev;
  var cur = plans.bible && plans.bible.type === NV_OCT.id;
  return '<div class="card" id="nvOctCard" style="border-color:color-mix(in srgb, var(--c-gold) 40%, transparent)"><div class="tc-l"><span>Bespoke plan</span></div><h3>The whole Bible · 13 Oct to 30 Nov</h3>' +
    '<p class="tc-r">49 days. Every day: an Old Testament portion, the Psalms (all 150) and a New Testament portion, about 24 chapters a day.</p>' + pvw +
    '<p class="hint" style="margin:.4rem 0 0">' + (cur ? 'This is your current plan.' : (plans.bible ? 'Your current plan is kept safe and comes back when you finish.' : 'Starts on 13 October.')) + '</p>' +
    (cur ? '' : '<div class="actions"><button class="primary" id="nvOctGo">Start this plan</button></div>') + '</div>';
}
onReady(function () {
  new MutationObserver(function () {
    var first = sheetBody.querySelector('.opt-card');
    if (!first || !document.getElementById('pStart') || document.getElementById('nvOctCard') || nvOctDone()) return;
    first.insertAdjacentHTML('beforebegin', nvOctCard());
    var b = document.getElementById('nvOctGo'); if (b) b.onclick = function () { closeSheet(); nvStartOct(); };
  }).observe(sheetBody, { childList: true });
});
