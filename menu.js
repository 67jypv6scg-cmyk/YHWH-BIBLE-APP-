// Noble Vine Study & Discipleship · 2.2.0 · The More menu and Study hub
'use strict';
// ---- RNB look: the More menu and the Study hub ----
var APP_VER = 'Noble Vine · 2.2 beta';
var RNB_IC = {
  book: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5V20"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16"/>',
  mic: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
  expand: '<path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/>',
  compare: '<rect x="3.5" y="5" width="7" height="14" rx="1.5"/><rect x="13.5" y="5" width="7" height="14" rx="1.5"/>',
  teach: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6"/><path d="M10 17h6"/>',
  cards: '<rect x="4" y="7" width="12" height="13" rx="2"/><path d="M8 4h10a2 2 0 0 1 2 2v11"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  comment: '<path d="M4 5h16v11H9l-5 4z"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 7l3 3"/>',
  import: '<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  layers: '<path d="m12 3.5 8.5 4.7L12 13 3.5 8.2z"/><path d="m3.5 12.5 8.5 4.8 8.5-4.8"/>',
  box: '<rect x="4" y="8" width="16" height="12" rx="1.5"/><path d="M3 4h18v4H3z"/><path d="M10 12h4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
  tag: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.4 1.4 0 0 1 0 2l-6.6 6.6a1.4 1.4 0 0 1-2 0z"/><circle cx="8" cy="8" r="1.4"/>',
  note: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  bug: '<circle cx="12" cy="13" r="5.5"/><path d="M12 7.5V5M8 6l1.5 2M16 6l-1.5 2M4 13h2.5M17.5 13H20M5.5 18.5l2-1.5M18.5 18.5l-2-1.5"/>',
  chev: '<path d="M9 6l6 6-6 6"/>'
};
function rnbIcon(n, size) { return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + RNB_IC[n] + '</svg>'; }
function rnbDisc(c, n, size) {
  size = size || 40;
  var inner = n === 'aleph' ? '<span class="dsc-he">א</span>' : rnbIcon(n, Math.round(size * 0.5));
  return '<span class="dsc c-' + c + '" style="width:' + size + 'px;height:' + size + 'px">' + inner + '</span>';
}
function rnbMenuRow(id, c, ic, title, sub) {
  return '<button type="button" class="mrow" id="' + id + '">' + rnbDisc(c, ic) + '<span class="mrow-t"><span class="mrow-h">' + title + '</span><span class="mrow-s">' + sub + '</span></span><span class="mrow-c">' + rnbIcon('chev', 18) + '</span></button>';
}
function rnbGroup(label, rows) {
  if (rows.length === 1) return '<div class="mgrp mgrp-solo">' + rows[0] + '</div>';
  var id = 'g' + label.replace(/\W/g, ''), open = (S.menuOpen || '') === id;
  var names = rows.map(function (r) { var m = r.match(/class="mrow-h">([^<]*)</); return m ? m[1] : ''; }).filter(Boolean);
  var dots = rows.slice(0, 4).map(function (r) { var m = r.match(/class="dsc c-(\w+)"/); return '<i class="c-' + (m ? m[1] : 'stone') + '"></i>'; }).join('');
  return '<div class="mfold' + (open ? ' open' : '') + '" data-fold="' + id + '"><button type="button" class="mgh" aria-expanded="' + open + '"><span class="mgdots">' + dots + '</span>' +
    '<span class="mrow-t"><span class="mgh-t">' + label + '</span><span class="mrow-s">' + names.join(' · ') + '</span></span><span class="mgch">' + rnbIcon('chev', 18) + '</span></button>' +
    '<div class="mgrp"' + (open ? '' : ' hidden') + '>' + rows.join('') + '</div></div>';
}
function menu() {
  openSheet('More');
  var last = S.last && has(S.last.b, S.last.c) ? S.last : firstLoaded();
  usePlan('bible'); var pd = plan ? firstOpen() : 0;
  var mem = memAll(), due = Object.keys(mem).filter(function (k) { return memDaysTo(mem[k]) <= 0; }).length;
  var bits = [];
  if (last) bits.push(bn(last.b) + ' ' + last.c);
  if (pd) bits.push('Day ' + (pd + (plan.offset || 0)) + ' of your plan');
  if (due) bits.push(due + (due === 1 ? ' memory verse due' : ' memory verses due'));
  var chips = [['clay', 'book'], ['gold', 'route'], ['blue', 'aleph'], ['olive', 'compare'], ['purple', 'teach'], ['pom', 'heart'], ['stone', 'gear']].map(function (x, i) {
    return '<span class="mchip" style="margin-left:' + (i ? -8 : 0) + 'px">' + rnbDisc(x[0], x[1], 44) + '</span>';
  }).join('');
  sheetBody.innerHTML =
    '<div class="mhero"><div class="mchips">' + chips + '</div><div class="mhero-h">' + (last ? 'Pick up where you left off' : 'Welcome to your RNB') + '</div>' +
    '<div class="mhero-s">' + esc(bits.join(' · ') || 'Import your Bible to begin') + '</div><button type="button" class="mhero-b" id="mCont">' + (last ? 'Continue reading' : 'Import my Bible') + '</button></div>' +
    rnbGroup('Read', [rnbMenuRow('mToday', 'clay', 'book', 'Today', 'Plan, verse of the day, memory'), rnbMenuRow('mPlan', 'gold', 'route', 'Reading plans', 'Whole Bible and book studies'),
      rnbMenuRow('mMusic', 'purple', 'note', 'My music', 'Songs you have saved, while you read'), rnbMenuRow('mFull', 'stone', 'expand', 'Full screen', 'Hide the bars while reading')]) +
    rnbGroup('My Walk', [rnbMenuRow('mJourney', 'olive', 'layers', 'My journey', 'Everything you have kept, by date'), rnbMenuRow('mProph', 'gold', 'spark', 'Prophetic words', 'Words spoken over you, typed or recorded'), rnbMenuRow('mFavs', 'gold', 'star', 'Favourite verses', 'Highlighted in your colours'), rnbMenuRow('mThemes', 'purple', 'tag', 'Themes', 'Notes and verses by theme'),
      rnbMenuRow('mNotes', 'purple', 'pen', 'My notes', 'Verse notes and day notes'), rnbMenuRow('mMem', 'pom', 'heart', 'Memory verses', 'Hide the Word in your heart'),
      rnbMenuRow('mRecs', 'clay', 'mic', 'My recordings', 'Passages in your own voice')]) +
    rnbGroup('Study', [rnbMenuRow('mStudy', 'blue', 'aleph', 'Hebrew study', 'Interlinear and word study'), rnbMenuRow('mNames', 'gold', 'aleph', 'Names guide', 'What each Hebrew Name means'), rnbMenuRow('mCmp', 'olive', 'compare', 'Compare versions', esc(bibleShort()) + ', WEB, ASV and the Hebrew'),
      rnbMenuRow('mTeach', 'purple', 'teach', 'Teaching notes', 'Your series and reference sheets'), rnbMenuRow('mAlef', 'gold', 'cards', 'Alphabet cards', 'Aleph to Tav, flip and learn'),
      rnbMenuRow('mCom', 'stone', 'comment', 'Commentary', 'Tyndale, Keil &amp; Delitzsch, Gill')]) +
    rnbGroup('My Bible', [rnbMenuRow('mWhole', 'olive', 'import', 'Import a whole Bible', 'From a text file such as bsb.txt'), rnbMenuRow('mImp', 'olive', 'pen', 'Import chapters', 'Paste a few chapters at a time'),
      rnbMenuRow('mVer', 'blue', 'layers', 'My versions', 'Downloads and links'), rnbMenuRow('mBak', 'stone', 'box', 'Back up and restore', 'Keep everything safe')]) +
    rnbGroup('Settings', [rnbMenuRow('mSet', 'stone', 'gear', 'Settings', 'Names, text size, voices, pictures')]) +
    '<div class="nvcard">' + nvAppMark(230) + '<div class="nvfrom">' + NV_FROM + '</div><button type="button" class="mhero-b" id="mAbout" style="margin-top:1rem">About Noble Vine</button><button type="button" class="backlink" id="mUpd" style="margin:.9rem 0 0">Check for updates</button><button type="button" class="backlink" id="mBug" style="margin:.7rem 0 0">Report a problem</button></div>' +
    '<p class="status" style="margin-top:1.2rem;text-align:center">' + esc(storageNote()) + ' ' + Object.keys(chapters).length.toLocaleString() + ' chapters.<br>' + APP_VER + '</p>';
  sheetBody.querySelectorAll('.mfold').forEach(function (f) {
    f.querySelector('.mgh').onclick = function () {
      var willOpen = !f.classList.contains('open');
      sheetBody.querySelectorAll('.mfold').forEach(function (o) { o.classList.remove('open'); o.querySelector('.mgrp').hidden = true; o.querySelector('.mgh').setAttribute('aria-expanded', 'false'); });
      if (willOpen) { f.classList.add('open'); f.querySelector('.mgrp').hidden = false; f.querySelector('.mgh').setAttribute('aria-expanded', 'true'); setTimeout(function () { try { f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {} }, 40); }
      S.menuOpen = willOpen ? f.dataset.fold : ''; saveSettings();
    };
  });
  var on = function (id, fn) { var el = document.getElementById(id); if (el) el.onclick = fn; };
  on('mCont', function () { if (last) { closeSheet(); leaveHome(); showChapter(last.b, last.c); } else openWholeImport(); });
  on('mToday', function () { openToday(); });
  on('mPlan', function () { usePlan('bible'); if (plan) openTracker(); else openPlanSetup(); });
  on('mRecs', openRecordings);
  on('mFull', function () { closeSheet(); toggleFull(); });
  on('mStudy', openStudySection);
  on('mCmp', function () { closeSheet(); closeSearch(); showCompare(pos.b, pos.c); });
  on('mTeach', openTeachList);
  on('mAlef', openAlefCards);
  on('mMem', openMemList);
  on('mCom', function () { openCommentary(pos.b, pos.c, 1); });
  on('mNotes', openNotesList);
  on('mWhole', openWholeImport);
  on('mImp', function () { openImport(pos.b, nextMissing(pos.b)); });
  on('mVer', openMyVersions);
  on('mBak', openBackup);
  on('mSet', openSettings);
  on('mProph', openProphList);
  on('mJourney', openJourney);
  on('mAbout', openAbout);
  on('mBug', openErrorLog);
  on('mUpd', nvCheckForUpdates);
  on('mMusic', function () { openPlayer(); });
  on('mFavs', function () { openFavs(); });
  on('mThemes', function () { openThemes(); });
  on('mNames', openNamesGuide);
}
function openStudyHub() {
  openSheet('Study');
  var tiles = [
    ['blue', 'aleph', 'Hebrew study', 'Interlinear, word study and saved words', openStudySection],
    ['olive', 'compare', 'Compare', esc(bibleShort()) + ', WEB, ASV and the Hebrew', function () { closeSheet(); closeSearch(); showCompare(pos.b, pos.c); }],
    ['purple', 'teach', 'Teaching notes', 'Your series and reference sheets', openTeachList],
    ['pom', 'heart', 'Memory verses', 'Listen, fade, letters, recite', openMemList],
    ['gold', 'cards', 'Alphabet cards', 'Aleph to Tav, pictograph to block', openAlefCards],
    ['stone', 'comment', 'Commentary', 'Tyndale, Keil &amp; Delitzsch, Gill', function () { openCommentary(pos.b, pos.c, 1); }]
  ];
  var w = savedWords(), wk = Object.keys(w).sort(function (a, z) { return (w[z].added || 0) - (w[a].added || 0); }).slice(0, 3);
  sheetBody.innerHTML = '<p class="hint" style="margin-top:0">Dig into the Hebrew, compare and remember.</p><div class="sgrid">' +
    tiles.map(function (t, i) { return '<button type="button" class="stile c-' + t[0] + '" data-st="' + i + '">' + rnbDisc(t[0], t[1], 44) + '<b>' + t[2] + '</b><span class="s">' + t[3] + '</span></button>'; }).join('') + '</div>' +
    (wk.length ? '<div class="mlab">Recent word studies</div><div class="mgrp">' + wk.map(function (k) {
      var s = w[k];
      return '<button type="button" class="mrow" data-sw="1"><span class="dsc-he c-blue" style="font-size:1.6rem;min-width:3.6rem;text-align:center">' + esc(s.heb || '') + '</span><span class="mrow-t"><span class="mrow-h">' + esc((s.tr || '') + (s.gloss ? ' · ' + s.gloss : '')) + '</span><span class="mrow-s">' + (s.ref ? esc(bn(s.ref.b) + ' ' + s.ref.c + ':' + s.ref.v) : 'Saved word') + '</span></span><span class="mrow-c">' + rnbIcon('chev', 18) + '</span></button>';
    }).join('') + '</div>' : '');
  sheetBody.querySelectorAll('[data-st]').forEach(function (el) { el.onclick = tiles[+el.dataset.st][4]; });
  sheetBody.querySelectorAll('[data-sw]').forEach(function (el) { el.onclick = openStudySection; });
}
