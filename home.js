// Noble Vine Study & Discipleship · 2.0.0 · Home screen, appointed times, Selah
'use strict';
// ======================================================================
// Home: greeting, Today's Word with the Listen orb, live tiles, glass tab bar, Selah
// ======================================================================
var homeOn = false;
var TORN = {
  olive: ['#2b3420','#36412a','#46522f','#5e6436','#857d3e','#b39a3e','#d6b74a','#e9cf5c','#f2e07f','#f8eeb5'],
  clay: ['#3b1d14','#53281b','#6f3423','#8b432c','#a4553a','#c47249','#e08f5c','#eca97a','#f6c79f','#fde3c8'],
  tekhelet: ['#0f2433','#163243','#1d4256','#255469','#2f6f86','#4a8ea2','#6aa9b9','#93c4ce','#b8dade','#d8eef0'],
  pomegranate: ['#3a0d16','#4f121e','#681827','#811f31','#9b2c3a','#b94350','#d36066','#e58584','#f2b0ab','#fbdcd9'],
  purple: ['#1e1230','#2a1942','#382357','#472e6c','#5a3d82','#71539a','#8b6fb2','#a98cc8','#cbb6e0','#ebe2f6'],
  stone: ['#1d1b22','#2a2630','#3a3440','#4d4552','#655a66','#82727c','#a08c93','#bfa9ad','#dcc9c8','#f1e6e1']
};
function tornSvg(pal, seed, w, h) {
  var P = TORN[pal], R = rng(seed), ox = -w * .08, oy = h * (.45 + R() * .3), rmax = Math.max(w, h) * 1.05;
  var out = '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><filter id="tf' + seed + '" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".45"/></filter></defs><rect width="' + w + '" height="' + h + '" fill="' + P[0] + '"/>';
  for (var k = 1; k < P.length; k++) {
    var r = rmax * (1 - k / (P.length + .6)), jag = k < 5 ? rmax * .018 : rmax * .004, pts = [];
    for (var a = -100; a <= 100; a += 2.5) { var t = a * Math.PI / 180, rr = r * (1 + .1 * Math.cos(t * 2)) + (R() - .5) * jag * 2; pts.push((ox + rr * Math.cos(t) * 1.18).toFixed(1) + ',' + (oy + rr * Math.sin(t)).toFixed(1)); }
    out += '<polygon points="' + (ox - 5) + ',' + (oy + r * 1.4).toFixed(1) + ' ' + pts.join(' ') + ' ' + (ox - 5) + ',' + (oy - r * 1.4).toFixed(1) + '" fill="' + P[k] + '" filter="url(#tf' + seed + ')"/>';
  }
  return out + '</svg>';
}
// Pictures for the full-screen pages: your pinned photo, or the day's painted sky
async function pageBg(slot) {
  var id = S[slot === 'selah' ? 'picSelah' : 'picWord'];
  if (id) { var list = await picsAll(), hit = list.filter(function (p) { return p.id === id; })[0]; if (hit) return 'url("' + hit.data + '")'; }
  return paintedBg(dayNumber() + (slot === 'selah' ? 3 : 0));
}
async function openPicPicker(slot, after) {
  openSheet(slot === 'selah' ? 'Selah picture' : 'Today’s Word picture'); var tok = sheetSeq;
  var key = slot === 'selah' ? 'picSelah' : 'picWord', cur = S[key] || '', list = await picsAll();
  var h = '<p class="hint" style="margin-top:0">Choose the background for ' + (slot === 'selah' ? 'the Selah page' : 'the Today’s Word page') + '. It stays until you change it.</p><div class="pp-grid">' +
    '<button data-pp="" class="' + (cur ? '' : 'on') + '" style="background-image:' + paintedBg(dayNumber() + (slot === 'selah' ? 3 : 0)).replace(/"/g, '&quot;') + '"><span>Painted sky</span></button>' +
    list.map(function (p) { return '<button data-pp="' + esc(p.id) + '" class="' + (p.id === cur ? 'on' : '') + '" style="background-image:url(&quot;' + p.data + '&quot;)"></button>'; }).join('') + '</div>' +
    '<div class="actions"><button class="quiet" id="ppAdd">Add from Photos</button><button class="primary" id="ppDone">Done</button></div>';
  if (tok !== sheetSeq) return; sheetBody.innerHTML = h;
  sheetBody.querySelectorAll('[data-pp]').forEach(function (b) { b.onclick = function () { S[key] = b.dataset.pp; saveSettings(); sheetBody.querySelectorAll('[data-pp]').forEach(function (x) { x.classList.toggle('on', x === b); }); if (after) after(); }; });
  document.getElementById('ppAdd').onclick = openPictures;
  document.getElementById('ppDone').onclick = function () { closeSheet(); if (after) after(); };
}
// Cards you dismiss stay hidden until you come back after a break (or tomorrow); appointed times until tomorrow
function hiddenGet(name) { try { return JSON.parse(localStorage.getItem(name) || '{}'); } catch (e) { return {}; } }
function hiddenSet(name, v) { try { localStorage.setItem(name, JSON.stringify(v)); } catch (e) {} }
function isHidden(k) { var h = hiddenGet('nb-hide'); return h[k] === todayYmd(); }
function isFeastHidden(k) { var h = hiddenGet('nb-fhide'); return h[k] === todayYmd(); }
function swipeable(el, onGone) {
  var x0 = null, y0 = 0, dx = 0, moved = false;
  el.addEventListener('pointerdown', function (e) { if (e.target.closest('.x')) return; x0 = e.clientX; y0 = e.clientY; dx = 0; moved = false; el.style.transition = 'none'; });
  el.addEventListener('pointermove', function (e) {
    if (x0 === null) return; var ddx = e.clientX - x0;
    if (!moved && Math.abs(e.clientY - y0) > Math.abs(ddx)) { x0 = null; el.style.transition = ''; el.style.transform = ''; return; }
    if (Math.abs(ddx) > 6) moved = true; dx = Math.min(0, ddx); el.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / 40) + 'deg)';
  });
  var end = function () { if (x0 === null) return; el.style.transition = ''; el.style.transform = ''; if (dx < -70) { el.dataset.swiped = '1'; onGone(el); } x0 = null; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); el.addEventListener('pointerleave', end);
  var xb = el.querySelector('.x'); if (xb) xb.onclick = function (e) { e.stopPropagation(); onGone(el); };
  el.addEventListener('click', function (e) { if (el.dataset.swiped === '1' || moved) { e.stopPropagation(); e.preventDefault(); el.dataset.swiped = ''; moved = false; } }, true);
}
var undoTimer = null;
function offerUndo(label, undo) {
  var u = document.getElementById('hUndo'); if (u) u.remove();
  u = document.createElement('div'); u.className = 'hundo'; u.id = 'hUndo'; u.innerHTML = esc(label) + ' <button>Undo</button>'; document.body.appendChild(u);
  u.querySelector('button').onclick = function () { u.remove(); undo(); };
  clearTimeout(undoTimer); undoTimer = setTimeout(function () { if (u.parentNode) u.remove(); }, 4000);
}
async function openWordPage() {
  var r = verseOfDay(); if (!r) return;
  var el = document.getElementById('wordpage');
  el.innerHTML = '<div class="wp-top"><button class="wp-btn" id="wpClose" aria-label="Close">✕</button><button class="wp-btn" id="wpPic" aria-label="Choose picture">' + ICONS.image + '</button></div>' +
    '<div class="wp-in"><div class="wp-lab">Today’s Word</div><div class="wp-ref">' + esc(votdRef(r)) + '</div><p class="wp-vs">' + fmtVerse(r.text) + '</p>' +
    '<div class="wp-acts"><button id="wpListen"><span class="orb sm"></span>Listen</button><button id="wpRec">🎙 Record</button><button id="wpRead">Read chapter</button></div></div>';
  el.style.backgroundImage = await pageBg('word'); el.classList.remove('hidden');
  document.getElementById('wpClose').onclick = function () { stopMem(); el.classList.add('hidden'); };
  document.getElementById('wpPic').onclick = function () { openPicPicker('word', async function () { el.style.backgroundImage = await pageBg('word'); }); };
  document.getElementById('wpListen').onclick = function () { var words = r.text.split(/\s+/).filter(Boolean).map(function (w) { return { w: w }; }); listenPassage('en', r.b, r.c, rangeOf(r), { mode: 'esv' }, words, 'normal'); };
  document.getElementById('wpRec').onclick = function () { openRecorder({ lang: 'en', b: r.b, c: r.c, vs: rangeOf(r), text: versesHtml(r.b, r.c, rangeOf(r)) }); };
  document.getElementById('wpRead').onclick = function () { stopMem(); el.classList.add('hidden'); leaveHome(); showChapter(r.b, r.c, rangeOf(r)); };
}
var ICONS = {
  route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16"/></svg>',
  mark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3.5 8.5 4.7L12 13 3.5 8.2z"/><path d="m3.5 12.5 8.5 4.8 8.5-4.8"/><path d="m3.5 16.5 8.5 4.8 8.5-4.8"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5V20"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="20" height="20"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 16-5-5-9 8.5"/></svg>'
};
function heGreeting() {
  var h = new Date().getHours();
  if (h >= 5 && h < 12) return ['בֹּקֶר טוֹב', 'Boker tov', 'Good morning'];
  if (h >= 12 && h < 18) return ['צָהֳרַיִם טוֹבִים', 'Tsohorayim tovim', 'Good afternoon'];
  return ['עֶרֶב טוֹב', 'Erev tov', 'Good evening'];
}
function setTab(t) { document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === t); }); }
function leaveHome() { stopSlides(); if (!homeOn) return; try { localStorage.setItem('nb-view', 'read'); } catch (e) {} homeOn = false; document.body.classList.remove('home'); document.getElementById('home').classList.add('hidden'); setTab('read'); }
var slideTimer = null, slideIdx = 0, slideFront = 1;
function stopSlides() { clearInterval(slideTimer); slideTimer = null; }
async function startSlides() {
  stopSlides();
  if (S.homeSlide === false || !homeOn) return;
  var pics = await picsAll(), n = pics.length >= 2 ? pics.length : SCENES.length;
  slideIdx = pics.length >= 2 ? dayNumber() % pics.length : dayNumber() % SCENES.length;
  slideTimer = setInterval(function () {
    if (!homeOn || document.hidden) return;
    slideIdx = (slideIdx + 1) % n;
    var bg = pics.length >= 2 ? 'url("' + pics[slideIdx].data + '")' : paintedBg(dayNumber() - (dayNumber() % SCENES.length) + slideIdx);
    var a = document.getElementById('hbg'), b = document.getElementById('hbg2'); if (!a || !b) return stopSlides();
    var show = slideFront === 1 ? b : a, hide = slideFront === 1 ? a : b;
    show.style.backgroundImage = bg; show.style.opacity = 1; hide.style.opacity = 0; slideFront = slideFront === 1 ? 2 : 1;
  }, 10000);
}
async function homeBackground() {
  var list = await picsAll();
  return list.length ? 'url("' + list[dayNumber() % list.length].data + '")' : paintedBg(dayNumber());
}
// ======================================================================
// Appointed times (Leviticus 23), worked out from the standard Hebrew calendar.
// Months counted from Aviv/Nisan (Exodus 12:2). No year numbers, no Tishri new year.
// ======================================================================
var HEB_FMT = null;
try { HEB_FMT = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long', timeZone: 'UTC' }); } catch (e) { HEB_FMT = null; }
var HEB_MONTHS = [[/^nisan/, 1, 'Aviv (Nisan)'], [/^iy/, 2, 'Iyar'], [/^siv/, 3, 'Sivan'], [/^tam/, 4, 'Tammuz'], [/^av/, 5, 'Av'], [/^elul/, 6, 'Elul'],
  [/^tish/, 7, 'Tishri'], [/^(mar)?(c?h|kh)esh/, 8, 'Heshvan'], [/^kis/, 9, 'Kislev'], [/^tev/, 10, 'Tevet'], [/^sh?e?vat|^shvat/, 11, 'Shevat'],
  [/^adar ii/, 13, 'Adar II'], [/^adar i?$/, 12, 'Adar'], [/^adar/, 12, 'Adar']];
var FEASTS = [
  { m: 1, d: 1, n: 1, name: 'Beginning of months', sub: 'The New Year', ref: 'Exodus 12:2', b: 'Exodus', c: 12, v: [1, 2], eve: true },
  { m: 1, d: 14, n: 1, name: 'Pesach', sub: 'Passover', ref: 'Leviticus 23:5', c: 23, v: [4, 5], same: true },
  { m: 1, d: 15, n: 7, name: 'Unleavened Bread', sub: 'Chag HaMatzot', ref: 'Leviticus 23:6–8', c: 23, v: [6, 8] },
  { m: 1, d: 16, n: 1, name: 'Firstfruits', sub: 'Reishit', ref: 'Leviticus 23:10–11', c: 23, v: [9, 14] },
  { m: 3, d: 6, n: 1, name: 'Shavuot', sub: 'Feast of Weeks', ref: 'Leviticus 23:15–16', c: 23, v: [15, 22] },
  { m: 7, d: 1, n: 1, name: 'Yom Teruah', sub: 'Day of Trumpets', ref: 'Leviticus 23:24', c: 23, v: [23, 25] },
  { m: 7, d: 10, n: 1, name: 'Yom Kippur', sub: 'Day of Atonement', ref: 'Leviticus 23:27', c: 23, v: [26, 32] },
  { m: 7, d: 15, n: 7, name: 'Sukkot', sub: 'Feast of Tabernacles', ref: 'Leviticus 23:34', c: 23, v: [33, 36] },
  { m: 7, d: 22, n: 1, name: 'The Eighth Day', sub: 'Shemini Atzeret', ref: 'Leviticus 23:36', c: 23, v: [36, 36] }
];
function hebOf(dt) {
  if (!HEB_FMT) return null;
  try {
    var parts = HEB_FMT.formatToParts(new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), 12)));
    var day = 0, mon = '';
    parts.forEach(function (p) { if (p.type === 'day') day = parseInt(p.value, 10); if (p.type === 'month') mon = p.value.toLowerCase().trim(); });
    if (!day || !mon || /^\d+$/.test(mon)) return null;
    for (var i = 0; i < HEB_MONTHS.length; i++) if (HEB_MONTHS[i][0].test(mon)) return { m: HEB_MONTHS[i][1], d: day, name: HEB_MONTHS[i][2] };
  } catch (e) {}
  return null;
}
function ordinal(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function hebDateLine(dt) { var h = hebOf(dt); return h ? ordinal(h.d) + ' day of the ' + ordinal(h.m) + ' month' : ''; }
function addDaysDt(dt, n) { var x = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()); x.setDate(x.getDate() + n); return x; }
function feastsAhead(days) {
  var out = [], t0 = addDaysDt(new Date(), 0);
  for (var i = -8; i <= days; i++) {
    var dt = addDaysDt(t0, i), h = hebOf(dt); if (!h) { if (i === -8) return null; continue; }
    FEASTS.forEach(function (f) { if (f.m === h.m && f.d === h.d) out.push({ f: f, date: dt, off: i }); });
  }
  return out;
}
function feastStatus(e) {
  // e.off = days from today to the feast's first (daytime) date. Hebrew days begin at sunset the evening before.
  var f = e.f, last = e.off + f.n - 1;
  if (f.same) { if (e.off === 0) return { now: true, k: 'Tonight at sunset' }; if (e.off > 0 && e.off <= 3) return { soon: true, k: 'In ' + e.off + (e.off === 1 ? ' day' : ' days') }; return e.off > 0 ? {} : null; }
  if (e.off === 1) return { now: true, k: 'Begins tonight at sunset' };
  if (e.off <= 0 && last >= 0) {
    var k = f.n > 1 ? 'Today · day ' + (1 - e.off) + ' of ' + f.n : 'Today';
    if (last === 0 && f.n > 1) k = 'Last day · ends at sunset';
    return { now: true, k: k };
  }
  if (e.off > 1 && e.off <= 4) return { soon: true, k: 'Begins at sunset in ' + (e.off - 1) + (e.off === 2 ? ' day' : ' days') };
  return e.off > 1 ? {} : null;
}
function feastWhen(e) {
  var start = e.f.same ? e.date : addDaysDt(e.date, -1);
  return 'From sunset ' + start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + (start.getFullYear() !== new Date().getFullYear() ? ' ' + start.getFullYear() : '');
}
function feastHtml() {
  var all = feastsAhead(420); if (!all) return '';
  var now = [], next = [];
  all.forEach(function (e, i) { var st = feastStatus(e); if (!st) return; e.st = st; e.i = i; if (st.now || st.soon) now.push(e); else next.push(e); });
  window._feasts = all;
  var h = '<div class="hfeast">';
  now.slice(0, 2).forEach(function (e) {
    h += '<button class="hfb" data-feast="' + e.i + '"><span class="k">' + esc(e.st.k) + '</span><span class="t">' + esc(e.f.name) + '</span>' +
      '<span class="s">' + esc(e.f.sub) + ' · ' + esc(ordinal(e.f.d) + (e.f.n > 1 ? '–' + ordinal(e.f.d + e.f.n - 1) : '')) + ' day of the ' + esc(ordinal(e.f.m)) + ' month</span><span class="r">' + esc(e.f.ref) + ' ›</span></button>';
  });
  var up = next.slice(0, 3);
  if (up.length) {
    h += '<div class="hflab">Coming up</div><div class="hfrow">' + up.map(function (e) {
      return '<button class="hfc" data-feast="' + e.i + '"><span class="t">' + esc(e.f.name) + '</span><span class="s">' + esc(feastWhen(e)) + '</span></button>';
    }).join('') + '</div>';
  }
  return h + '</div>';
}
function wireFeasts(root) {
  root.querySelectorAll('[data-feast]').forEach(function (el) {
    el.onclick = function () {
      var e = (window._feasts || [])[+el.dataset.feast]; if (!e) return;
      var b = findBook(e.f.b || 'Leviticus'); if (b < 0) return;
      var vs = []; for (var v = e.f.v[0]; v <= e.f.v[1]; v++) vs.push(v);
      showChapter(b, e.f.c, vs);
    };
  });
}
function showHome() {
  try { localStorage.setItem('nb-view', 'home'); } catch (e) {}
  homeOn = true; closeSearch && qEl.value && (qEl.value = '');
  document.body.classList.add('home'); setTab('home');
  var el = document.getElementById('home'); el.classList.remove('hidden');
  var g = heGreeting(), r = verseOfDay(), dn = dayNumber();
  usePlan('bible');
  var nextD = plan ? firstOpen() : 0, list = nextD ? dayList(nextD) : [];
  var planT = plan ? (nextD ? (plan.passes > 1 ? 'Round ' + passOf(nextD) + ' · day ' + dayInPass(nextD) : 'Day ' + (nextD + (plan.offset || 0))) : 'Plan complete') : 'Start a plan';
  var planS = plan ? (nextD ? list.length + (list.length === 1 ? ' reading' : ' readings') + ' · ' + esc(groupRefs(list)) : 'Well done') : 'A year · 6 months · 3× a year';
  var last = S.last && has(S.last.b, S.last.c) ? S.last : firstLoaded();
  var mem = memAll(), mids = Object.keys(mem).sort(function (a, z) { return mem[a].due < mem[z].due ? -1 : 1; }), m0 = mids.length ? mem[mids[0]] : null;
  var study = plans.study, sD = study ? (function () { usePlan('study'); var d = firstOpen(); usePlan('bible'); return d; })() : 0;
  var card = function (key, pal, seed, inner, cls) { return isHidden(key) ? '' : '<div class="pc' + (cls ? ' ' + cls : '') + '" data-card="' + key + '" role="button" tabindex="0"><div class="art">' + tornSvg(pal, seed, cls && cls.indexOf('mini') >= 0 ? 200 : 400, cls && cls.indexOf('mini') >= 0 ? 90 : 170) + '</div><button class="x" aria-label="Dismiss">✕</button><div class="bd">' + inner + '</div></div>'; };
  var h = '<div class="h2in"><div class="h2brand">' + nvSprig(34, 2.2) + '</div><div class="h2he"><bdi>' + g[0] + '</bdi> · ' + g[1] + '</div><div class="h2gr">' + g[2] + (S.greet ? ', ' + esc(S.greet) : '') + '</div>' +
    '<div class="h2dt">' + esc(new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })) + (typeof hebDateLine === 'function' && hebDateLine(new Date()) ? ' · ' + esc(hebDateLine(new Date())) : '') + '</div>';
  var selah = card('selah', 'stone', dn * 7 + 5, '<span class="k">Selah</span><span class="t">Pause. Breathe.</span><span class="s">Be still, and know · Psalm 46:10</span>', 'slim');
  var word = card('word', 'olive', dn * 7 + 1, r ? '<span class="k">' + esc(votdRef(r)) + '</span><div class="vs">' + fmtVerse(r.text) + '</div>' : '<span class="t">Today’s Word</span><span class="s">Import a few more books and a verse will appear here.</span>');
  if (selah) h += '<div style="height:1rem"></div>' + selah;
  if (word) h += '<div class="h2sec">Today’s Word</div>' + word;
  var tiles = [
    card('plan', 'clay', dn * 7 + 2, '<span class="k">Walk the Plan</span><span class="t">' + esc(planT) + '</span><span class="s">' + planS + '</span>', 'mini'),
    card('cont', 'tekhelet', dn * 7 + 3, '<span class="k">Continue</span><span class="t">' + (last ? esc(bn(last.b) + ' ' + last.c) : 'Import chapters') + '</span><span class="s">' + (last ? 'Pick up where you left off' : 'Add your Bible text') + '</span>', 'mini'),
    card('mem', 'pomegranate', dn * 7 + 4, '<span class="k">Hide it in your heart</span><span class="t">' + (m0 ? esc(memRef(m0)) : 'Add a verse') + '</span><span class="s">' + (m0 ? esc(memDueLabel(m0)) : 'Start memorising') + '</span>', 'mini'),
    card('deep', 'purple', dn * 7 + 6, '<span class="k">Go Deeper</span><span class="t">Study</span><span class="s">Hebrew · Compare · Notes</span>', 'mini'),
    study ? card('study', 'olive', dn * 7 + 8, '<span class="k">Book study</span><span class="t">' + esc(bn(study.book)) + (sD ? ' · day ' + sD : ' · complete') + '</span>', 'mini wide') : ''
  ].filter(Boolean);
  if (tiles.length) h += '<div class="h2sec">For you today</div><div class="pgrid">' + tiles.join('') + '</div>';
  h += '<div class="h2sec">Your journey <small><button type="button" class="jall" id="jAll">See all</button></small></div><div class="jlist" id="jHome"><div class="jempty">Your notes, prophetic words and milestones will gather here.</div></div>';
  // Appointed times: one compact stack
  var all = typeof feastsAhead === 'function' ? feastsAhead(420) : null, deck = [];
  if (all) {
    var nowL = [], next = [];
    all.forEach(function (e, i) { var st = feastStatus(e); if (!st) return; e.st = st; e.i = i; if (st.now || st.soon) nowL.push(e); else next.push(e); });
    window._feasts = all;
    deck = nowL.slice(0, 3).map(function (e) { return { e: e, k: e.st.k, s: e.f.sub + ' · ' + e.f.ref }; })
      .concat(next.slice(0, 3).map(function (e) { return { e: e, k: 'Coming up', s: feastWhen(e) + ' · ' + e.f.ref }; }))
      .filter(function (x) { x.key = x.e.f.name + '|' + (x.e.date ? new Date(x.e.date).toDateString() : ''); return !isFeastHidden(x.key); });
  }
  h += '<div class="h2sec">Appointed times <small id="fCount"></small></div><div class="fdeck" id="fDeck"><div class="fempty">All caught up · back tomorrow</div>' +
    deck.map(function (x, i) { return '<div class="fdk" data-fk="' + esc(x.key) + '" data-feast="' + x.e.i + '" role="button" tabindex="0"><span class="k">' + esc(x.k) + '</span><span class="t">' + esc(x.e.f.name) + '</span><span class="s">' + esc(x.s) + '</span><button class="x" aria-label="Dismiss">✕</button></div>'; }).join('') + '</div></div>';
  el.innerHTML = h; el.scrollTop = 0;
  nvFillJourney();
  // cards: tap to open, swipe or ✕ to hide
  var open = {
    selah: function () { showSelah(true); }, word: openWordPage,
    plan: function () { usePlan('bible'); if (!plan) { openPlanSetup(); return; } var d = firstOpen(); if (d) openPlanDay(d); else openTracker(); },
    cont: function () { if (last) { leaveHome(); showChapter(last.b, last.c); } else openImport(pos.b, nextMissing(pos.b)); },
    mem: function () { if (m0) practiseMem(m0.id); else openMemList(); },
    deep: function () { openStudyHub(); },
    study: function () { usePlan('study'); var d = firstOpen(); if (d) openPlanDay(d); else openTracker(); }
  };
  el.querySelectorAll('[data-card]').forEach(function (c) {
    var k = c.dataset.card;
    c.addEventListener('click', function () { if (open[k]) open[k](); });
    swipeable(c, function () {
      c.classList.add('gone'); var hh = hiddenGet('nb-hide'); hh[k] = todayYmd(); hiddenSet('nb-hide', hh);
      offerUndo('Hidden for now', function () { var h2 = hiddenGet('nb-hide'); delete h2[k]; hiddenSet('nb-hide', h2); showHome(); });
    });
  });
  var fd = document.getElementById('fDeck');
  function layoutDeck() {
    var cs = [].slice.call(fd.querySelectorAll('.fdk:not(.gone)'));
    cs.forEach(function (c, i) { c.style.zIndex = 10 - i; c.style.transform = 'translateY(' + (i * 9) + 'px) scale(' + (1 - i * .04) + ')'; c.style.opacity = i > 2 ? 0 : 1 - i * .25; });
    var tot = fd.querySelectorAll('.fdk').length;
    document.getElementById('fCount').textContent = cs.length ? (tot - cs.length + 1) + ' of ' + tot + ' · swipe' : (tot ? 'done for today' : '');
  }
  fd.querySelectorAll('.fdk').forEach(function (c) {
    c.addEventListener('click', function () {
      var e = (window._feasts || [])[+c.dataset.feast]; if (!e) return;
      var b = findBook(e.f.b || 'Leviticus'); if (b < 0) return;
      var vs = []; for (var v = e.f.v[0]; v <= e.f.v[1]; v++) vs.push(v);
      showChapter(b, e.f.c, vs);
    });
    swipeable(c, function () {
      c.classList.add('gone'); var hh = hiddenGet('nb-fhide'); hh[c.dataset.fk] = todayYmd(); hiddenSet('nb-fhide', hh); setTimeout(layoutDeck, 20);
      offerUndo('Hidden until tomorrow', function () { var h2 = hiddenGet('nb-fhide'); delete h2[c.dataset.fk]; hiddenSet('nb-fhide', h2); showHome(); });
    });
  });
  layoutDeck();
}
function selahMode() { return S.selahMode || (S.selah === false ? 'off' : 'away'); }
var AWAY_MS = 30 * 60 * 1000;
function markActive() { try { localStorage.setItem('nb-active', String(Date.now())); } catch (e) {} }
function lastActive() { try { return +localStorage.getItem('nb-active') || 0; } catch (e) { return 0; } }
function setResume(r) { try { if (r) localStorage.setItem('nb-resume', JSON.stringify(r)); else localStorage.removeItem('nb-resume'); } catch (e) {} }
function getResume() { try { return JSON.parse(localStorage.getItem('nb-resume') || 'null'); } catch (e) { return null; } }
document.addEventListener('visibilitychange', function () {
  if (document.hidden) { markActive(); return; }
  var away = Date.now() - lastActive(); markActive();
  if (away >= AWAY_MS && selahMode() === 'away' && document.getElementById('sheet').classList.contains('hidden')) showSelah();
});
window.addEventListener('pagehide', markActive);
setInterval(function () { if (!document.hidden) markActive(); }, 60000);
async function showSelah(fromCard) {
  var el = document.getElementById('selah');
  el.innerHTML = '<div class="sin"><div class="sk">SELAH</div><div class="st">Pause.<br>Breathe.<br>Be still, and know.</div><div class="sr">Psalm 46:10</div><div class="sh">סֶלָה</div></div>' +
    '<button class="wp-btn" id="slPic" aria-label="Choose picture" style="position:absolute;top:calc(env(safe-area-inset-top,0px) + .9rem);right:1rem;z-index:2">' + ICONS.image + '</button><div class="stap">Tap anywhere to continue</div>';
  el.style.backgroundImage = await pageBg('selah');
  el.classList.remove('hidden'); requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('show'); }); });
  var done = false, close = function () { if (done) return; done = true; el.classList.remove('show'); setTimeout(function () { el.classList.add('hidden'); }, 800); };
  el.onclick = close;
  document.getElementById('slPic').onclick = function (e) { e.stopPropagation(); close(); openPicPicker('selah'); };
  if (!fromCard) setTimeout(close, 8000);
}
document.querySelectorAll('#tabs button').forEach(function (b) {
  b.onclick = function () {
    var t = b.dataset.tab;
    if (t === 'home') { closeSheet(); showHome(); return; }
    if (t === 'read') { closeSheet(); leaveHome(); if (qEl.value) { qEl.value = ''; } if (has(pos.b, pos.c)) showChapter(pos.b, pos.c); else { var a = firstLoaded(); if (a) showChapter(a.b, a.c); else renderEmpty(); } return; }
    if (t === 'plan') { openToday(); return; }
    if (t === 'search') { closeSheet(); leaveHome(); setTab('search'); document.querySelector('.bar').classList.remove('away'); setTimeout(function () { qEl.focus(); }, 50); return; }
    if (t === 'more') { menu(); return; }
  };
});
