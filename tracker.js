// Noble Vine Study & Discipleship · 2.0.0 · Plan tracker and day details
'use strict';
function groupRefs(list) {
  var out = [], i = 0;
  while (i < list.length) {
    var j = i;
    while (j + 1 < list.length && list[j + 1].b === list[i].b && list[j + 1].c === list[j].c + 1) j++;
    out.push(bn(list[i].b, j === i) + ' ' + list[i].c + (j > i ? '–' + list[j].c : ''));
    i = j + 1;
  }
  return out.join(' · ');
}
function openTracker() {
  if (!plan) return openPlanSetup();
  openSheet(plan.name);
  var total = totalDays(), done = doneCount(), e = expectedDay(), b = behindCount(), nextD = firstOpen();
  var pct = Math.round(done / total * 100);
  var status = plan.pausedFrom ? 'Paused since ' + niceDate(plan.pausedFrom) + '.' :
    e === 0 ? 'Starts ' + niceDate(plan.start) + '.' :
    b === 0 ? 'You’re on track.' : 'You’re ' + b + (b === 1 ? ' day' : ' days') + ' behind.';
  var h = '<div class="card"><p class="bigstat">' + (nextD ? esc(dayLabel(nextD)) : 'Plan complete') + '</p>' +
    '<div class="meter"><i style="width:' + pct + '%"></i></div>' +
    '<p class="hint" style="margin:0">' + done + ' of ' + total + ' days read (' + pct + '%) · ' + esc(status) + '</p>' +
    '<div class="actions">' + (nextD ? '<button class="primary" id="tRead">Read ' + esc(shortDay(nextD).replace(/ of \d+/, '')) + '</button>' : '') + '</div></div>';
  if (b > 0 && !plan.pausedFrom) {
    h += '<div class="card"><h3>Catching up</h3><p class="hint">Read the missed days at your own pace, or move the plan back so you’re on track again. Your end date moves back by ' + b + (b === 1 ? ' day' : ' days') + '.</p>' +
      '<div class="actions"><button class="quiet" id="tShift">Move the plan back ' + b + (b === 1 ? ' day' : ' days') + '</button></div></div>';
  }
  var groups = plan.kind === 'study' ? 1 : plan.passes, per = plan.kind === 'study' ? total : plan.days;
  for (var p = 1; p <= groups; p++) {
    if (groups > 1) h += '<div class="grp">Round ' + p + '</div>'; else h += '<div class="grp">Days</div>';
    h += '<div class="days">';
    for (var k = 1; k <= per; k++) {
      var d = (p - 1) * per + k;
      var cls = isDone(d) ? ' done' : d < e ? ' miss' : '';
      if (d === e && !plan.pausedFrom) cls += ' today';
      h += '<button class="day' + cls + '" data-d="' + d + '" aria-label="' + esc(dayLabel(d)) + '">' + k + '</button>';
    }
    h += '</div>';
  }
  h += '<div class="legend"><span><i style="background:var(--accent);border-color:var(--accent)"></i>Read</span><span><i style="border-color:var(--name)"></i>Missed</span><span><i style="box-shadow:0 0 0 2px var(--ink) inset"></i>Today</span></div>';
  var endD = dateOf(total);
  h += '<p class="status" style="margin-top:1rem">Started ' + niceDate(plan.start) + ' · finishes ' + niceDate(endD) + (plan.pausedFrom ? ' (plus the paused days)' : '') + '</p>';
  h += '<div class="actions" style="margin-top:1.2rem"><button class="quiet" id="tPause">' + (plan.pausedFrom ? 'Resume' : 'Pause') + (plan.kind === 'study' ? ' study' : ' plan') + '</button><button class="danger" id="tEnd">' + (plan.kind === 'study' ? 'End study' : 'End plan') + '</button></div>';
  sheetBody.innerHTML = h;
  var r = document.getElementById('tRead'); if (r) r.onclick = function () { openPlanDay(nextD); };
  sheetBody.querySelectorAll('.day').forEach(function (el) { el.onclick = function () { openDayDetail(+el.dataset.d); }; });
  var sh = document.getElementById('tShift');
  if (sh) sh.onclick = function () { plan.start = addDays(plan.start, b); savePlan(true); toast('Plan moved back ' + b + (b === 1 ? ' day' : ' days') + '.'); openTracker(); };
  document.getElementById('tPause').onclick = function () {
    if (plan.pausedFrom) { var gap = Math.max(0, dayDiff(plan.pausedFrom, todayYmd())); plan.start = addDays(plan.start, gap); plan.pausedFrom = null; toast('Plan resumed.'); }
    else { plan.pausedFrom = todayYmd(); toast('Plan paused. Days won’t count as missed until you resume.'); }
    savePlan(true); openTracker();
  };
  var en = document.getElementById('tEnd');
  en.onclick = function () {
    if (en.dataset.armed !== '1') { en.dataset.armed = '1'; en.textContent = plan.kind === 'study' ? 'Tap again to end the study' : 'Tap again to end the plan'; return; }
    plan = null; planCtx = null; savePlan(true); closeSheet(); toast('Plan ended. Your Bible and notes are untouched.'); showChapter(pos.b, pos.c);
  };
}
async function openDayDetail(d) {
  openSheet(dayLabel(d));
  var list = dayList(d);
  var h = '<button class="backlink" id="ddBack">‹ Tracker</button><p class="status" style="margin:0 0 .8rem">' + niceDate(dateOf(d)) + (isDone(d) ? ' · read' : '') + '</p>';
  if (!list.length) h += '<p class="hint">Nothing is scheduled for this day. A day to catch up, or to reflect.</p>';
  var lastS = -1;
  list.forEach(function (x, i) {
    if (x.s !== lastS) { h += '<div class="grp">' + esc(streamLabel(x.s)) + '</div>'; lastS = x.s; }
    h += '<div class="dl-item"><input type="checkbox" data-k="' + x.k + '"' + (ticked(d, x.k) ? ' checked' : '') + ' aria-label="Read ' + esc(bn(x.b) + ' ' + x.c) + '"><span class="nm2">' + esc(bn(x.b) + ' ' + x.c) + (has(x.b, x.c) ? '' : '<small>not imported yet</small>') + '</span><button data-i="' + i + '">Read</button></div>';
  });
  h += '<div class="actions"><button class="' + (isDone(d) ? 'quiet' : 'primary') + '" id="ddDone">' + (isDone(d) ? 'Mark as not read' : 'Mark day as read') + '</button></div>';
  h += '<div class="grp" style="margin-top:1.4rem">My notes for this day</div><textarea id="ddNote" placeholder="What stood out? Thoughts for teaching…" style="min-height:8rem"></textarea><div class="tagbox" id="ddTags"></div><p class="status" id="ddNoteStat"></p>';
  sheetBody.innerHTML = h;
  document.getElementById('ddBack').onclick = openTracker;
  sheetBody.querySelectorAll('.dl-item input').forEach(function (el) {
    el.onchange = function () {
      setTick(d, el.dataset.k, el.checked);
      var all = list.every(function (x) { return ticked(d, x.k); });
      if (all && !isDone(d)) { setDone(d, true); toast(shortDay(d) + ' complete'); }
      if (!el.checked && isDone(d)) setDone(d, false);
      savePlan();
      var btn = document.getElementById('ddDone'); btn.textContent = isDone(d) ? 'Mark as not read' : 'Mark day as read'; btn.className = isDone(d) ? 'quiet' : 'primary';
    };
  });
  sheetBody.querySelectorAll('.dl-item button').forEach(function (el) {
    el.onclick = function () { var i = +el.dataset.i; planCtx = { slot: planSlot, d: d, list: list, i: i }; closeSheet(); closeSearch(); showChapter(list[i].b, list[i].c); };
  });
  document.getElementById('ddDone').onclick = function () {
    if (isDone(d)) { setDone(d, false); plan.ticks = plan.ticks || {}; list.forEach(function (x) { delete plan.ticks[d + '_' + x.k]; }); }
    else setDone(d, true);
    savePlan(true); openDayDetail(d);
  };
  var ta = document.getElementById('ddNote'), st = document.getElementById('ddNoteStat');
  nvMountTags('ddTags', 'p:' + pnoteId(d));
  ta.disabled = true; ta.value = await getNote(d); ta.disabled = false;
  ta.addEventListener('input', function () { st.textContent = 'Saving…'; putNote(d, ta.value, st); });
}
