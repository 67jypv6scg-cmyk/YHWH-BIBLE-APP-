// Noble Vine Study & Discipleship · 2.0.0 · Reading plans
'use strict';
// ======================================================================
// Reading plan
// ======================================================================
var plan = null, planCtx = null, planTimers = {};
var plans = { bible: null, study: null }, planSlot = 'bible';
function usePlan(sl) { planSlot = sl; plan = plans[sl]; return plan; }
function streamLabel(si) { return plan && plan.kind === 'study' ? BOOKS[plan.book][0] : STREAMS[si].label; }
var STREAMS = [
  { label: 'Tanakh', books: BOOKS.map(function (b, i) { return i; }).filter(function (i) { return i < NT_START && i !== 18 && i !== 19; }) },
  { label: 'Psalms & Proverbs', books: [18, 19] },
  { label: 'New Testament', books: BOOKS.map(function (b, i) { return i; }).filter(function (i) { return i >= NT_START; }) }
];
var PLAN_TYPES = {
  '1y': { name: 'Whole Bible in a year', days: 365, passes: 1, scope: 'all' },
  '6m': { name: 'Whole Bible in 6 months', days: 182, passes: 1, scope: 'all' },
  '3x': { name: 'Whole Bible three times a year', days: 122, passes: 3, scope: 'all' },
  'trial': { name: 'Trial plan', days: 7, passes: 1, scope: 'imported' }
};
function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function parseYmd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function addDays(s, n) { var d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); }
function dayDiff(a, b) { var A = parseYmd(a), B = parseYmd(b); return Math.round((Date.UTC(B.getFullYear(), B.getMonth(), B.getDate()) - Date.UTC(A.getFullYear(), A.getMonth(), A.getDate())) / 86400000); }
function todayYmd() { return ymd(new Date()); }
function niceDate(s) { return parseYmd(s).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); }

function chWeight(b, c) {
  var d = chapters[key(b, c)];
  if (d) return d.verses.reduce(function (a, x) { return a + x.t.split(/\s+/).length; }, 0) || 1;
  return b === 18 ? 300 : b === 19 ? 450 : 650;   // estimate until the chapter is imported
}
function buildSchedule(days, scope) {
  var perDay = []; for (var i = 0; i < days; i++) perDay.push([[], [], []]);
  STREAMS.forEach(function (st, si) {
    var list = [];
    st.books.forEach(function (b) { for (var c = 1; c <= BOOKS[b][1]; c++) if (scope === 'all' || has(b, c)) list.push({ b: b, c: c, w: chWeight(b, c) }); });
    if (!list.length) return;
    var W = list.reduce(function (a, x) { return a + x.w; }, 0), T = W / days, cum = 0;
    list.forEach(function (x) {
      var d = Math.min(days - 1, Math.floor((cum + x.w / 2) / T));
      perDay[d][si].push(key(x.b, x.c)); cum += x.w;
    });
  });
  return perDay.map(function (d) { return d.map(function (s) { return s.join(','); }).join('|'); });
}
function totalDays() { return plan.days * plan.passes; }
function dayList(d) {
  var out = [], row = plan.schedule[(d - 1) % plan.days] || '';
  row.split('|').forEach(function (part, si) {
    if (!part) return;
    part.split(',').forEach(function (k) { var b = +k.slice(0, 2) - 1, c = +k.slice(3); out.push({ s: si, b: b, c: c, k: k }); });
  });
  return out;
}
function passOf(d) { return Math.floor((d - 1) / plan.days) + 1; }
function dayInPass(d) { return (d - 1) % plan.days + 1; }
function dayLabel(d) { if (plan.offset) return 'Day ' + (d + plan.offset) + ' of ' + (plan.days + plan.offset); if (plan.kind === 'study') return 'Day ' + d + ' of ' + totalDays(); return plan.passes > 1 ? 'Round ' + passOf(d) + ' of ' + plan.passes + ' · Day ' + dayInPass(d) + ' of ' + plan.days : 'Day ' + d + ' of ' + plan.days; }
function shortDay(d) { if (plan.offset) return 'Day ' + (d + plan.offset) + ' of ' + (plan.days + plan.offset); if (plan.kind === 'study') return 'Day ' + d + ' of ' + totalDays(); return plan.passes > 1 ? 'Day ' + dayInPass(d) + ' of ' + plan.days + ' (round ' + passOf(d) + ')' : 'Day ' + d + ' of ' + plan.days; }
function dateOf(d) { return addDays(plan.start, d - 1); }
function expectedDay() {
  var ref = plan.pausedFrom || todayYmd();
  return Math.max(0, Math.min(totalDays(), dayDiff(plan.start, ref) + 1));
}
function isDone(d) { return !!(plan.done && plan.done[d]); }
function firstOpen() { for (var d = 1; d <= totalDays(); d++) if (!isDone(d)) return d; return 0; }
function doneCount() { var n = 0; for (var d = 1; d <= totalDays(); d++) if (isDone(d)) n++; return n; }
function behindCount() { var e = expectedDay(), n = 0; for (var d = 1; d < e; d++) if (!isDone(d)) n++; return n; }
function ticked(d, k) { return !!(plan.ticks && plan.ticks[d + '_' + k]); }
function setTick(d, k, on) { plan.ticks = plan.ticks || {}; if (on) plan.ticks[d + '_' + k] = 1; else delete plan.ticks[d + '_' + k]; }
function setDone(d, on) {
  plan.done = plan.done || {};
  if (on) { plan.done[d] = Date.now(); dayList(d).forEach(function (x) { setTick(d, x.k, true); }); }
  else delete plan.done[d];
}

async function loadPlan() {
  if (store.mode === 'db') {
    try { var snap = await store.planRef.get(); plans.bible = snap.exists ? snap.data() : null; } catch (e) { plans.bible = null; }
    try { var snap2 = await store.studyRef.get(); plans.study = snap2.exists ? snap2.data() : null; } catch (e) { plans.study = null; }
    if (plans.bible && !plans.bible.schedule) plans.bible = null;
    if (plans.study && !plans.study.schedule) plans.study = null;
  } else { plans.bible = lsGet('nb-plan', null); plans.study = lsGet('nb-study', null); }
  usePlan('bible');
  updateTodayBtn();
}
function savePlan(now) {
  var sl = planSlot; plans[sl] = plan;
  lsSet(sl === 'study' ? 'nb-study' : 'nb-plan', plan);
  updateTodayBtn();
  if (store.mode !== 'db') return;
  clearTimeout(planTimers[sl]);
  var go = function () {
    var ref = sl === 'study' ? store.studyRef : store.planRef, v = plans[sl];
    var p = v ? ref.set(JSON.parse(JSON.stringify(v))) : ref.delete();
    withTimeout(p, 20000).catch(function () { toast('Plan progress didn’t save. It will retry with your next change.'); });
  };
  if (now) go(); else planTimers[sl] = setTimeout(go, 700);
}
// Plan-day notes: saved with the plan's identity, day, date and passages
function pnoteId(d) { return 'p' + plan.created + '_' + d; }
async function getNote(d) { var n = pnotes[pnoteId(d)]; return n ? n.text : ''; }
function putNote(d, text, stat) {
  var id = pnoteId(d);
  var doc = { id: id, planCreated: plan.created, planName: plan.name, day: d, dayLabel: dayLabel(d), date: dateOf(d), refs: groupRefs(dayList(d)), text: text, updated: Date.now() };
  queueNote('p', doc, stat);
}

var todayBtn = document.getElementById('todayBtn');
function updateTodayBtn() {
  if (plans.bible || plans.study) { todayBtn.textContent = 'Today'; todayBtn.classList.remove('plain'); }
  else { todayBtn.textContent = 'Plan'; todayBtn.classList.add('plain'); }
}
todayBtn.onclick = function () { openToday(); };
function openToday() {
  openSheet('Today');
  nvCheckOneOff();
  var h = greeting() + nvOneOffOffer() + votdHtml() + memCardHtml();
  ['bible', 'study'].forEach(function (sl) {
    usePlan(sl);
    if (!plan) {
      h += '<div class="actions" style="margin-bottom:1rem"><button class="quiet" id="' + (sl === 'study' ? 'tdStudy' : 'tdBible') + '">' + (sl === 'study' ? 'Start a book study' : 'Start a Bible plan') + '</button></div>';
      return;
    }
    var nextD = firstOpen(), total = totalDays(), pct = Math.round(doneCount() / total * 100), b = behindCount();
    var head = sl === 'study'
      ? esc(BOOKS[plan.book][0]) + (nextD ? ' · day ' + nextD + ' of ' + total : ' · complete')
      : (nextD ? (plan.passes > 1 ? 'Round ' + passOf(nextD) + ' · day ' + dayInPass(nextD) : 'Day ' + (nextD + (plan.offset || 0))) : 'Plan complete');
    var reads = nextD ? esc(groupRefs(dayList(nextD))) + (plan.kind === 'study' && plan.mode === 'whole' ? ', the whole book' : '') : '';
    var status = plan.pausedFrom ? 'Paused' : b > 0 ? b + (b === 1 ? ' day' : ' days') + ' behind' : (sl === 'study' && plan.mode === 'whole' ? 'Read all the way through daily' : 'On track');
    h += '<div class="card"><div class="tc-l"><span>' + (sl === 'study' ? 'Book study' : esc(plan.name)) + '</span><button data-change="' + sl + '">' + (sl === 'study' ? 'Change book' : 'Change plan') + '</button></div><h3>' + head + '</h3>' + (reads ? '<p class="tc-r">' + reads + '</p>' : '') +
      '<div class="meter"><i style="width:' + pct + '%"></i></div><p class="hint" style="margin:0">' + pct + '% through · ' + esc(status) + '</p>' +
      '<div class="actions">' + (nextD ? '<button class="primary" data-read="' + sl + '">Read</button><button class="quiet" data-note="' + sl + '">Day note</button>'
        : sl === 'study' ? '<button class="primary" id="tdNext">Choose the next book</button>' : '') +
      '<button class="quiet" data-track="' + sl + '">Tracker</button></div></div>';
  });
  usePlan('bible');
  sheetBody.innerHTML = h;
  sheetBody.querySelectorAll('[data-read]').forEach(function (el) { el.onclick = function () { usePlan(el.dataset.read); openPlanDay(firstOpen()); }; });
  sheetBody.querySelectorAll('[data-note]').forEach(function (el) { el.onclick = function () { usePlan(el.dataset.note); openDayDetail(firstOpen()); }; });
  sheetBody.querySelectorAll('[data-track]').forEach(function (el) { el.onclick = function () { usePlan(el.dataset.track); openTracker(); }; });
  sheetBody.querySelectorAll('[data-change]').forEach(function (el) { el.onclick = function () { if (el.dataset.change === 'study') openStudySetup(); else openPlanSetup(); }; });
  bindVotd(); bindMemCard(); nvBindOneOff();
  var x = document.getElementById('tdBible'); if (x) x.onclick = openPlanSetup;
  x = document.getElementById('tdStudy'); if (x) x.onclick = openStudySetup;
  x = document.getElementById('tdNext'); if (x) x.onclick = openStudySetup;
}
function openPlanDay(d) {
  var list = dayList(d);
  if (!list.length) { closeSheet(); openDayDetail(d); return; }
  var i = 0; while (i < list.length - 1 && ticked(d, list[i].k)) i++;
  planCtx = { slot: planSlot, d: d, list: list, i: i };
  closeSheet(); closeSearch();
  showChapter(list[i].b, list[i].c);
}
function planBanner() {
  if (!planCtx) return '';
  usePlan(planCtx.slot || 'bible');
  var d = planCtx.d, cur = planCtx.list[planCtx.i];
  var chips = planCtx.list.map(function (x, i) {
    return '<button class="daychip' + (i === planCtx.i ? ' now' : ticked(d, x.k) ? ' done' : '') + '" data-pi="' + i + '">' + (ticked(d, x.k) && i !== planCtx.i ? '✓ ' : '') + esc(bn(x.b) + ' ' + x.c) + '</button>';
  }).join('');
  return '<div class="planbar"><div class="pb-t"><b>' + esc(shortDay(d)) + '</b><span>' + esc(streamLabel(cur.s)) + ' · reading ' + (planCtx.i + 1) + ' of ' + planCtx.list.length + '</span></div>' +
    '<button id="pbTrack">Tracker</button><button id="pbExit" aria-label="Leave the plan and read freely">✕</button></div><div class="daychips">' + chips + '</div>';
}
function planNavHtml() {
  usePlan(planCtx.slot || 'bible');
  var i = planCtx.i, list = planCtx.list, d = planCtx.d;
  var prev = i > 0 ? list[i - 1] : null, next = i < list.length - 1 ? list[i + 1] : null;
  var h = '<nav class="plannav">';
  if (next) h += '<button class="primary big" id="pnNext">Next: ' + esc(bn(next.b) + ' ' + next.c) + ' ›</button>';
  else h += '<button class="primary big" id="pnDone">' + (isDone(d) ? '✓ Day complete' : 'Mark ' + esc(shortDay(d).replace(/ of \d+/, '')) + ' complete') + '</button>';
  h += '<div class="row"><button id="pnPrev"' + (prev ? '' : ' disabled') + '>‹ ' + (prev ? esc(bn(prev.b) + ' ' + prev.c) : 'Start of day') + '</button><button id="pnTrack">Tracker</button></div></nav>';
  return h;
}
function bindPlanBits() {
  if (!planCtx) return;
  usePlan(planCtx.slot || 'bible');
  var d = planCtx.d;
  function go(i) { planCtx.i = i; var x = planCtx.list[i]; showChapter(x.b, x.c); }
  var ex = document.getElementById('pbExit'); if (ex) ex.onclick = function () { planCtx = null; showChapter(pos.b, pos.c); toast('Reading freely. Tap Today to return to the plan.'); };
  ['pbTrack', 'pnTrack'].forEach(function (id) { var el = document.getElementById(id); if (el) el.onclick = openTracker; });
  main.querySelectorAll('.daychip').forEach(function (el) { el.onclick = function () { go(+el.dataset.pi); }; });
  var nx = document.getElementById('pnNext');
  if (nx) nx.onclick = function () { setTick(d, planCtx.list[planCtx.i].k, true); savePlan(); go(planCtx.i + 1); };
  var pv = document.getElementById('pnPrev');
  if (pv && !pv.disabled) pv.onclick = function () { go(planCtx.i - 1); };
  var dn = document.getElementById('pnDone');
  if (dn) dn.onclick = function () {
    if (isDone(d)) { openTracker(); return; }
    setDone(d, true); savePlan(true);
    dayFinished(d);
  };
}
function dayFinished(d) {
  planCtx = null;
  var nextD = firstOpen(), all = !nextD;
  var b = behindCount();
  main.innerHTML = '<div class="empty"><div class="mark" style="font-size:3rem">✓</div><h2>' + esc(shortDay(d)) + ' complete</h2>' +
    '<p>' + (all ? (plan.kind === 'study' ? 'You’ve finished your study of ' + esc(BOOKS[plan.book][0]) + '.' : 'You’ve finished the whole plan. Well done.') : b > 0 ? 'You’re ' + b + (b === 1 ? ' day' : ' days') + ' behind. Read on whenever you’re ready.' : nextD > expectedDay() ? 'You’re up to date. The next reading is ' + esc(shortDay(nextD)) + '.' : 'Next up: ' + esc(shortDay(nextD)) + '.') + '</p>' +
    '<div class="actions" style="justify-content:center">' + (!all ? '<button class="primary" id="fNext">Read ' + esc(shortDay(nextD).replace(/ of \d+/, '')) + ' now</button>' : '') +
    '<button class="quiet" id="fToday">Today</button><button class="quiet" id="fTrack">Tracker</button><button class="quiet" id="fFree">Read freely</button></div></div>';
  document.getElementById('refBtn').textContent = 'Books';
  var n = document.getElementById('fNext'); if (n) n.onclick = function () { openPlanDay(nextD); };
  document.getElementById('fTrack').onclick = openTracker;
  document.getElementById('fToday').onclick = openToday;
  document.getElementById('fFree').onclick = function () { showChapter(pos.b, pos.c); };
  window.scrollTo(0, 0);
}

function openPlanSetup() {
  openSheet('Bible reading plan');
  var imported = Object.keys(chapters).length;
  var choice = '1y', trialDays = 7, start = todayYmd();
  function render() {
    var t = PLAN_TYPES[choice], days = choice === 'trial' ? trialDays : t.days;
    var sched = buildSchedule(days, t.scope);
    var tmp = { schedule: sched, days: days, passes: t.passes };
    var prevPlan = plan; plan = tmp;
    var pvw = [1, 2, 3].filter(function (d) { return d <= days; }).map(function (d) {
      var l = dayList(d);
      return '<p><b>Day ' + d + ':</b> ' + (l.length ? esc(groupRefs(l)) : '<span class="hint">nothing to read</span>') + '</p>';
    }).join('');
    plan = prevPlan;
    sheetBody.innerHTML =
      (plans.bible ? '<p class="hint" style="margin-top:0;color:var(--ink)">This replaces your current plan, ' + esc(plans.bible.name) + '. Your day notes from it are kept in My notes.</p>' : '') +
      '<p class="hint" style="margin-top:0">Each day mixes a Tanakh portion, a reading from Psalms or Proverbs, and a New Testament portion, balanced so every day is about the same length.</p>' +
      nvOneOffOffer() +
      opt('1y', 'Whole Bible in a year', '365 days · about 3 to 4 chapters a day') +
      opt('6m', 'Whole Bible in 6 months', '182 days · about 6½ chapters a day') +
      opt('3x', 'Whole Bible three times a year', 'Three rounds of 122 days · about 10 chapters a day') +
      (choice !== 'trial' && imported < 1189 ? '<p class="hint" style="color:var(--name)">Only ' + imported + ' of 1,189 chapters are imported. The plan will work, but days are balanced more accurately once every book is in.</p>' : '') +
      '<label class="field"><span>Start date</span><input type="date" id="pStart" value="' + start + '"></label>' +
      '<div class="card"><h3>First days</h3>' + pvw + '</div>' +
      '<div class="actions"><button class="primary" id="pGo">' + (plans.bible ? 'Switch to this plan' : 'Start plan') + '</button></div>';
    nvBindOneOff();
    sheetBody.querySelectorAll('.opt-card').forEach(function (el) { el.onclick = function () { choice = el.dataset.t; render(); }; });
    var tl = document.getElementById('tLen');
    if (tl) tl.querySelectorAll('button').forEach(function (b) { b.onclick = function () { trialDays = +b.dataset.val; render(); }; });
    document.getElementById('pStart').onchange = function () { if (this.value) start = this.value; };
    document.getElementById('pGo').onclick = function () {
      usePlan('bible');
      plan = { type: choice, name: choice === 'trial' ? 'Trial plan (' + days + ' days)' : t.name, days: days, passes: t.passes, scope: t.scope,
        start: start, schedule: sched, done: {}, ticks: {}, pausedFrom: null, created: Date.now() };
      savePlan(true);
      toast('Plan started. Tap Today any time.');
      openPlanDay(firstOpen());
    };
  }
  function opt(id, title, sub) { return '<button class="opt-card' + (choice === id ? ' on' : '') + '" data-t="' + id + '"><b>' + title + '</b><span>' + sub + '</span></button>'; }
  render();
}
function openStudySetup() {
  openSheet('Book study');
  var book = null, mode = null;
  function grid(from, to) {
    var h = '<div class="bkgrid">';
    for (var i = from; i < to; i++) h += '<button data-bk="' + i + '"' + (i === book ? ' class="on"' : '') + '>' + esc(BOOKS[i][0]) + '</button>';
    return h + '</div>';
  }
  function render() {
    var h = '';
    if (book === null) h += '<p class="hint" style="margin-top:0">Pick a book to study in depth. It runs alongside your Bible plan, with its own tracker and day notes.</p>';
    else {
      var n = BOOKS[book][1], have = 0;
      for (var c = 1; c <= n; c++) if (has(book, c)) have++;
      h += '<div class="card"><h3>' + esc(BOOKS[book][0]) + '</h3><p class="hint">' + n + (n === 1 ? ' chapter' : ' chapters') + '</p>' +
        '<div class="set" style="margin-top:.6rem">' + segBtns('sMode', [['chapter', 'A chapter a day'], ['whole', 'Whole book daily']], mode) + '</div>' +
        '<p class="hint">' + (mode === 'whole' ? 'Read all ' + n + (n === 1 ? ' chapter' : ' chapters') + ' every day for 30 days.' : 'One chapter a day for ' + n + (n === 1 ? ' day.' : ' days.')) + '</p>' +
        (have < n ? '<p class="hint" style="color:var(--name)">' + (n - have) + ' of ' + n + ' chapters aren’t imported yet. Import them before you start, or as you go.</p>' : '') +
        '<div class="actions"><button class="primary" id="sGo">' + (plans.study ? 'Switch to this book' : 'Start study') + '</button></div></div><div class="grp">Change book</div>';
    }
    h += '<div class="grp">Tanakh</div>' + grid(0, NT_START) + '<div class="grp">New Testament</div>' + grid(NT_START, BOOKS.length);
    sheetBody.innerHTML = h;
    sheetBody.querySelectorAll('[data-bk]').forEach(function (el) {
      el.onclick = function () { book = +el.dataset.bk; mode = BOOKS[book][1] <= 6 ? 'whole' : 'chapter'; render(); sheetBody.scrollTop = 0; var sc = sheetBody.closest('.sheet'); if (sc) sc.scrollTop = 0; };
    });
    var sm = document.getElementById('sMode');
    if (sm) sm.querySelectorAll('button').forEach(function (b) { b.onclick = function () { mode = b.dataset.val; render(); }; });
    var go = document.getElementById('sGo');
    if (go) go.onclick = function () {
      var n = BOOKS[book][1], rows = [], all = [];
      for (var c = 1; c <= n; c++) { all.push(key(book, c)); rows.push(key(book, c)); }
      if (mode === 'whole') rows = [all.join(',')];
      usePlan('study');
      plan = { kind: 'study', type: 'study', book: book, mode: mode,
        name: BOOKS[book][0] + (mode === 'whole' ? ' · whole book daily' : ' · a chapter a day'),
        days: mode === 'whole' ? 1 : n, passes: mode === 'whole' ? 30 : 1, scope: 'all',
        start: todayYmd(), schedule: rows, done: {}, ticks: {}, pausedFrom: null, created: Date.now() };
      savePlan(true);
      toast('Study started. Tap Today any time.');
      openPlanDay(firstOpen());
    };
  }
  render();
}
