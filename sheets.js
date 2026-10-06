// Noble Vine Study & Discipleship · 2.2.0 · Sheets, book picker, chapter import, Settings
'use strict';
// ======================================================================
// Sheets: picker, import, settings
// ======================================================================
var sheet = document.getElementById('sheet'), scrim = document.getElementById('scrim'), sheetBody = document.getElementById('sheetBody');
var sheetSeq = 0;   // changes every time a sheet opens, so slow loads never draw onto the wrong sheet
function openSheet(title) { sheetSeq++; nvNavOpened(title); document.getElementById('sheetTitle').textContent = title; sheet.classList.remove('hidden'); scrim.classList.remove('hidden'); sheet.scrollTop = 0; }
function closeSheet() { setResume(null); if (!sheet.classList.contains('hidden')) nvNavClosed(); sheet.classList.add('hidden'); scrim.classList.add('hidden'); sheetBody.innerHTML = ''; if (typeof afterSheetClosed === 'function') afterSheetClosed(); }
scrim.onclick = function () { nvUserCloseSheet(); };
document.getElementById('sheetClose').onclick = function () { nvUserCloseSheet(); };
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.classList.contains('hidden')) nvUserCloseSheet(); });

function openPicker(bookSel) {
  openSheet('Books');
  function books() {
    var h = '';
    [['Tanakh', 0, NT_START], ['New Testament', NT_START, BOOKS.length]].forEach(function (g) {
      h += '<div class="grp">' + g[0] + '</div><div class="books">';
      for (var i = g[1]; i < g[2]; i++) h += '<button class="book' + (loadedIn(i) ? ' has' : '') + (i === pos.b ? ' cur' : '') + '" data-b="' + i + '">' + esc(BOOKS[i][0]) + '</button>';
      h += '</div>';
    });
    if (Object.keys(chapters).length) h = '<button class="goto" id="curBook">Chapters of <b>' + esc(BOOKS[pos.b][0]) + '</b> ›</button>' + h;
    sheetBody.innerHTML = h;
    var cb = document.getElementById('curBook'); if (cb) cb.onclick = function () { chaps(pos.b); };
    sheetBody.querySelectorAll('.book').forEach(function (el) { el.onclick = function () { chaps(+el.dataset.b); }; });
  }
  function chaps(b) {
    document.getElementById('sheetTitle').textContent = BOOKS[b][0];
    var n = loadedIn(b);
    var h = '<button class="backlink" id="bk">‹ All books</button><p class="status" style="margin:0 0 .8rem">' + n + ' of ' + BOOKS[b][1] + ' chapters imported</p><div class="chaps">';
    for (var c = 1; c <= BOOKS[b][1]; c++) h += '<button class="chap' + (has(b, c) ? ' has' : '') + (b === pos.b && c === pos.c ? ' cur' : '') + '" data-c="' + c + '">' + c + '</button>';
    h += '</div>';
    sheetBody.innerHTML = h;
    document.getElementById('bk').onclick = function () { document.getElementById('sheetTitle').textContent = 'Books'; books(); };
    sheetBody.querySelectorAll('.chap').forEach(function (el) { el.onclick = function () { closeSheet(); showChapter(b, +el.dataset.c); }; });
  }
  if (typeof bookSel === 'number') chaps(bookSel); else books();
}
document.getElementById('refBtn').onclick = function () { openPicker(); };

function menuOld() {
  openSheet('Menu');
  var cat = function (id, ic, name, desc, items) {
    return '<div class="mcat" data-cat="' + id + '"><button class="mhead"><span class="ic">' + ic + '</span><span class="tx"><span class="nm2">' + name + '</span><span class="ds">' + desc + '</span></span><span class="cv">›</span></button>' +
      (items ? '<div class="msub" hidden>' + items + '</div>' : '') + '</div>';
  };
  sheetBody.innerHTML =
    cat('read', '📖', 'Read', 'Today, reading plans, recordings, full screen', '<button id="mToday">Today</button><button id="mPlan">Reading plans</button><button id="mRecs">My recordings</button><button id="mFull">Full screen</button>') +
    cat('study', '🔍', 'Study', 'Teaching notes, alphabet cards, Hebrew, compare, memory', '<button id="mStudy">Hebrew study</button><button id="mCmp">Compare versions</button><button id="mTeach">Teaching notes</button><button id="mAlef">Alphabet cards</button><button id="mMem">Memory verses</button><button id="mCom">Commentary</button><button id="mNotes">My notes</button>') +
    cat('bible', '📚', 'My Bible', 'Import chapters, versions, backup', '<button id="mImp">Import chapters</button><button id="mWhole">Import a whole Bible file</button><button id="mVer">My versions</button><button id="mBak">Back up and restore</button>') +
    cat('set', '⚙︎', 'Settings', 'Names, text size, your name', '') +
    '<p class="status" style="margin-top:1.2rem">' + esc(storageNote()) + ' ' + Object.keys(chapters).length + ' chapters imported.</p>' +
    '<p class="status" style="margin-top:.3rem">App version 28 · RNB throughout</p>';
  sheetBody.querySelectorAll('.mcat').forEach(function (c) {
    c.querySelector('.mhead').onclick = function () {
      if (c.dataset.cat === 'set') { openSettings(); return; }
      var open = !c.classList.contains('open');
      sheetBody.querySelectorAll('.mcat').forEach(function (o) { o.classList.remove('open'); var sb = o.querySelector('.msub'); if (sb) sb.hidden = true; });
      if (open) { c.classList.add('open'); c.querySelector('.msub').hidden = false; }
    };
  });
  document.getElementById('mToday').onclick = function () { openToday(); };
  document.getElementById('mMem').onclick = openMemList;
  document.getElementById('mRecs').onclick = openRecordings;
  document.getElementById('mTeach').onclick = openTeachList;
  document.getElementById('mAlef').onclick = openAlefCards;
  document.getElementById('mCom').onclick = function () { openCommentary(pos.b, pos.c, 1); };
  var mSetDummy = document.createElement('button'); mSetDummy.id = 'mSet'; mSetDummy.hidden = true; sheetBody.appendChild(mSetDummy);
  document.getElementById('mImp').onclick = function () { openImport(pos.b, nextMissing(pos.b)); };
  document.getElementById('mWhole').onclick = openWholeImport;
  document.getElementById('mSet').onclick = openSettings;
  document.getElementById('mBak').onclick = openBackup;
  document.getElementById('mNotes').onclick = openNotesList;
  document.getElementById('mPlan').onclick = function () { usePlan('bible'); if (plan) openTracker(); else openPlanSetup(); };
  document.getElementById('mStudy').onclick = openStudySection;
  document.getElementById('mCmp').onclick = function () { closeSheet(); closeSearch(); showCompare(pos.b, pos.c); };
  document.getElementById('mVer').onclick = openMyVersions;
  document.getElementById('mFull').onclick = function () { closeSheet(); toggleFull(); };
}
onReady(function () { document.getElementById('menuBtn').onclick = menu; });
function isFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function toggleFull() {
  var el = document.documentElement;
  try {
    if (isFull()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    var req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) throw new Error('none');
    var r = req.call(el);
    if (r && r.catch) r.catch(function () { fullFallback(); });
  } catch (e) { fullFallback(); }
}
function fullFallback() {
  S.autohide = true; saveSettings();
  toast('This device doesn’t allow full screen here. The top bar now slides away as you read; scroll up to bring it back.');
}
// Slide the top bar away while reading down the page; bring it back on scrolling up
(function () {
  var bar = document.querySelector('.bar'), lastY = window.scrollY, ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY, dy = y - lastY;
      var busy = document.activeElement === qEl || !sheet.classList.contains('hidden');
      var tabs = document.getElementById('tabs');
      if (S.autohide !== false && !busy && !homeOn && y > 120 && dy > 6) { bar.classList.add('away'); tabs.classList.add('away'); }
      else if (dy < -6 || y < 60 || busy || homeOn) { bar.classList.remove('away'); tabs.classList.remove('away'); }
      lastY = y; ticking = false;
    });
  }, { passive: true });
})();
function nextMissing(b) { for (var c = 1; c <= BOOKS[b][1]; c++) if (!has(b, c)) return c; return 1; }

function bookOptions(sel) {
  var h = '';
  [['Tanakh', 0, NT_START], ['New Testament', NT_START, BOOKS.length]].forEach(function (g) {
    h += '<optgroup label="' + g[0] + '">';
    for (var i = g[1]; i < g[2]; i++) h += '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>' + esc(BOOKS[i][0]) + '</option>';
    h += '</optgroup>';
  });
  return h;
}
function openImport(b, c) {
  setResume({ k: 'import', b: b, c: c });
  openSheet('Import chapters');
  sheetBody.innerHTML =
    '<p class="hint" style="margin-top:0">Copy as many chapters as you like from your Bible app, with their headings such as “Genesis 4”, and paste them below. The book and chapters are picked up automatically.</p>' +
    '<div class="row3"><label class="field"><span>Book</span><select id="iBook">' + bookOptions(b) + '</select></label>' +
    '<label class="field"><span>Chapter</span><input id="iCh" type="number" inputmode="numeric" min="1" value="' + (c || 1) + '"></label>' +
    '<label class="field"><span>to</span><input id="iTo" type="number" inputmode="numeric" min="1" placeholder="…"></label></div>' +
    '<details class="card" id="iOpts" style="padding:.2rem .9rem"><summary style="cursor:pointer;padding:.6rem 0;font-weight:500">Names and page style <span class="hint" id="iSum" style="font-weight:400"></span></summary>' +
      '<div style="padding:.2rem 0 .8rem">' +
      '<p class="hint" style="margin-top:0">The Name, where the English text prints LORD or GOD</p>' + segBtns('oName', [['heb', '<span class="heb">יהוה</span>'], ['Yahowah', 'Yahowah'], ['Yehovah', 'Yehovah']], S.name) +
      '<p class="hint">The Messiah’s name, where the English text prints Jesus</p>' + segBtns('oJesus', [['heb', '<span class="heb">יהושע</span>'], ['Yehoshua', 'Yehoshua'], ['Yeshua', 'Yeshua'], ['keep', 'Jesus']], S.jesus) +
      '<p class="hint">Lord, in ordinary type</p>' + segBtns('oLord', [['keep', 'Lord'], ['Adonai', 'Adonai'], ['Master', 'Master']], S.lord) +
      '<label class="check"><input type="checkbox" id="oGod"' + (S.god ? ' checked' : '') + '> <span>God → Elohim</span></label>' +
      '<label class="check"><input type="checkbox" id="oChrist"' + (S.christ ? ' checked' : '') + '> <span>Christ → Messiah</span></label>' +
      '<label class="check"><input type="checkbox" id="oSpirit"' + (S.spirit ? ' checked' : '') + '> <span>Holy Spirit → Ruach ha-Qodesh</span></label>' +
      '<label class="check"><input type="checkbox" id="oBrackets"' + (S.brackets ? ' checked' : '') + '> <span>Keep the original English word and add the name in brackets, e.g. the LORD [<span class="heb">יהוה</span>]</span></label>' +
      '<p class="hint" style="margin-top:.8rem">Page</p>' + segBtns('oTheme', [['dark', 'White on black'], ['light', 'Black on white']], S.theme) +
      '<p class="hint" style="margin-top:.8rem">Footnote numbers and cross-reference letters are always removed.</p>' +
      '</div></details>' +
    '<label class="field"><span>Bible text</span><textarea id="iText" placeholder="Genesis 1&#10;&#10;The Creation of the World&#10;1 In the beginning, God created the heavens and the earth…"></textarea></label>' +
    '<p class="detect" id="iDetect" aria-live="polite"></p>' +
    '<div class="actions"><button class="primary" id="iCheck">Check</button><button class="quiet" id="iClear">Clear</button></div>' +
    '<div id="iPrev"></div>' +
    '<div class="grp" style="margin-top:1.6rem">Progress</div><div id="iProg"></div>';
  var bookSel = document.getElementById('iBook'), chIn = document.getElementById('iCh'), txt = document.getElementById('iText');
  function optSummary() {
    var parts = [S.brackets ? 'LORD [' + NAMEF[S.name] + ']' : NAMEF[S.name], S.jesus === 'keep' ? 'Jesus' : JESUSF[S.jesus]];
    if (S.god) parts.push('Elohim'); if (S.christ) parts.push('Messiah'); if (S.spirit) parts.push('Ruach ha-Qodesh');
    if (S.lord !== 'keep') parts.push(S.lord);
    parts.push(S.theme === 'light' ? 'black on white' : 'white on black');
    document.getElementById('iSum').textContent = '· ' + parts.join(' · ');
  }
  function optChanged() { saveSettings(); optSummary(); document.getElementById('iPrev').innerHTML = ''; }
  [['oName', 'name'], ['oJesus', 'jesus'], ['oLord', 'lord'], ['oTheme', 'theme']].forEach(function (p) {
    document.getElementById(p[0]).querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        S[p[1]] = b.dataset.val;
        document.getElementById(p[0]).querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
        if (p[1] === 'theme') { applyLook(); refreshView(); }
        optChanged();
      };
    });
  });
  [['oGod', 'god'], ['oChrist', 'christ'], ['oSpirit', 'spirit'], ['oBrackets', 'brackets']].forEach(function (p) {
    document.getElementById(p[0]).onchange = function () { S[p[1]] = this.checked; optChanged(); };
  });
  optSummary();
  var draft = lsGet('nb-draft', '');
  if (draft) txt.value = draft;
  var toIn = document.getElementById('iTo'), det = document.getElementById('iDetect'), toTouched = false, detT = null;
  toIn.addEventListener('input', function () { toTouched = true; document.getElementById('iPrev').innerHTML = ''; });
  chIn.addEventListener('input', function () { document.getElementById('iPrev').innerHTML = ''; });
  // Read the pasted text as it arrives and fill in the book and chapter range
  function detectNow() {
    var raw = txt.value;
    if (!raw.trim()) { det.textContent = ''; det.className = 'detect'; if (!toTouched) toIn.value = ''; return; }
    var hasHead = raw.split('\n').some(function (l) { return HEAD_RE.test(l.trim()); });
    var parsed;
    try { parsed = parseImport(raw, +bookSel.value, Math.max(1, +chIn.value || 1)); } catch (e) { parsed = []; }
    if (!parsed.length) { det.className = 'detect warn'; det.textContent = 'No verse numbers found yet.'; return; }
    // A paste that starts part-way through a chapter, with no heading: find the saved chapter it continues
    var cont = null;
    var firstLine = (raw.split('\n').map(function (l) { return l.trim(); }).filter(Boolean)[0]) || '';
    var startsMid = !HEAD_RE.test(firstLine) && parsed[0].verses[0].v > 1;
    if (startsMid) {
      var sv = parsed[0].verses[0].v, cur = Math.max(1, +chIn.value || 1), bi = +bookSel.value;
      [cur, cur - 1].some(function (c) {
        var d = c >= 1 && chapters[key(bi, c)];
        if (d && d.verses.length && d.verses[d.verses.length - 1].v >= sv - 1) { cont = { c: c, from: sv, had: d.verses[d.verses.length - 1].v }; return true; }
        return false;
      });
      if (cont && cont.c !== cur) {
        chIn.value = cont.c;
        try { parsed = parseImport(raw, bi, cont.c); } catch (e) { parsed = []; }
        if (!parsed.length) return;
      }
    }
    var bk = parsed[0].book, chs = parsed.filter(function (c) { return c.book === bk; }).map(function (c) { return c.ch; });
    var lo = Math.min.apply(null, chs), hi = Math.max.apply(null, chs);
    if (hasHead) { bookSel.value = bk; chIn.value = lo; prog(); }
    if (!toTouched) toIn.value = hi;
    var verses = parsed.reduce(function (a, c) { return a + c.verses.length; }, 0);
    det.className = 'detect';
    det.textContent = 'Found ' + parsed.length + (parsed.length === 1 ? ' chapter' : ' chapters') + ': ' + BOOKS[bk][0] + ' ' + lo + (hi > lo ? '–' + hi : '') + ' (' + verses + ' verses)';
    if (cont) {
      var lastV = parsed[0].verses[parsed[0].verses.length - 1].v;
      det.textContent = 'Continues ' + BOOKS[bk][0] + ' ' + cont.c + ' from verse ' + cont.from + ' (you have verses 1–' + cont.had + ' saved), adding verses ' + cont.from + '–' + lastV + (parsed.length > 1 ? ', then ' + BOOKS[bk][0] + ' ' + parsed[1].ch + (hi > parsed[1].ch ? '–' + hi : '') : '') + '.';
    } else if (startsMid) {
      det.className = 'detect warn';
      det.textContent += '. This starts at verse ' + parsed[0].verses[0].v + '; check the Chapter box is the chapter you were part-way through.';
    }
  }
  txt.addEventListener('input', function () {
    lsSet('nb-draft', txt.value); document.getElementById('iPrev').innerHTML = '';
    toTouched = false; clearTimeout(detT); detT = setTimeout(detectNow, 350);
  });
  if (txt.value.trim()) setTimeout(detectNow, 50);
  function prog() {
    var bi = +bookSel.value, n = loadedIn(bi);
    var h = '<p class="status" style="margin:0 0 .6rem">' + esc(BOOKS[bi][0]) + ': ' + n + ' of ' + BOOKS[bi][1] + ' chapters</p><div class="chaps">';
    for (var k = 1; k <= BOOKS[bi][1]; k++) h += '<span class="chap' + (has(bi, k) ? ' has' : '') + '" style="text-align:center">' + k + '</span>';
    h += '</div>';
    if (n) h += '<div class="actions"><button class="danger" id="iDel">Remove ' + esc(BOOKS[bi][0]) + ' from my Bible</button></div>';
    document.getElementById('iProg').innerHTML = h;
    var del = document.getElementById('iDel');
    if (del) del.onclick = function () {
      if (del.dataset.armed !== '1') { del.dataset.armed = '1'; del.textContent = 'Tap again to remove all of ' + BOOKS[bi][0]; return; }
      del.disabled = true; del.textContent = 'Removing…';
      (async function () {
        try { for (var k = 1; k <= BOOKS[bi][1]; k++) if (has(bi, k)) await removeChapter(key(bi, k)); toast(BOOKS[bi][0] + ' removed'); }
        catch (e) { toast('Couldn’t remove everything. Try again.'); }
        prog();
      })();
    };
  }
  bookSel.onchange = function () { chIn.value = nextMissing(+bookSel.value); toIn.value = ''; toTouched = false; document.getElementById('iPrev').innerHTML = ''; prog(); if (txt.value.trim()) detectNow(); };
  prog();
  document.getElementById('iClear').onclick = function () { txt.value = ''; lsSet('nb-draft', ''); document.getElementById('iPrev').innerHTML = ''; txt.focus(); };
  document.getElementById('iCheck').onclick = function () {
    var pv = document.getElementById('iPrev');
    txt.blur();
    pv.innerHTML = '<p class="hint" style="margin-top:1rem">Reading the text…</p>';
    setTimeout(function () {
      try { checkNow(pv); }
      catch (e) {
        pv.innerHTML = '<p class="hint" style="margin-top:1rem;color:var(--name)">Something went wrong reading this text (' + esc(e && e.message || String(e)) + '). Please copy this message into your chat with Claude.</p>';
      }
      reveal(pv);
    }, 30);
  };
  function reveal(el) {
    try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { el.scrollIntoView(); }
  }
  function checkNow(pv) {
    var parsed = parseImport(txt.value, +bookSel.value, Math.max(1, +chIn.value || 1));
    var lim = parseInt(toIn.value, 10);
    if (isFinite(lim) && lim >= 1) parsed = parsed.filter(function (c) { return c.ch <= lim; });
    if (!parsed.length) {
      var startTxt = txt.value.trim().slice(0, 160);
      pv.innerHTML = '<p class="hint" style="margin-top:1rem">' + (startTxt ? 'No verse numbers were found in this text, so nothing could be added. It starts like this:</p><p class="hint" style="border-left:3px solid var(--name);padding-left:.7rem;white-space:pre-wrap">' + esc(startTxt) + '</p><p class="hint">Copy these first lines into your chat with Claude so the import can be adjusted to this format.' : 'Paste some chapters first.') + '</p>';
      return;
    }
    var h = '<div class="preview">';
    parsed.forEach(function (c) {
      var ok = c.ch <= BOOKS[c.book][1];
      var mg = mergeChapter(chapters[key(c.book, c.ch)], c);
      var own = c.verses.map(function (x) { return x.v; });
      var nums = mg.verses.map(function (x) { return x.v; });
      var gaps = [];
      for (var i = 1; i < nums.length; i++) if (nums[i] !== nums[i - 1] + 1) gaps.push(nums[i - 1] + 1 + (nums[i] - 1 > nums[i - 1] + 1 ? '–' + (nums[i] - 1) : ''));
      var note = nums[0] !== 1 ? 'starts at verse ' + nums[0] : gaps.length ? 'missing ' + gaps.join(', ') : '';
      var tag = mg.mode === 'replace' ? ' <span class="hint">(replaces)</span>' : mg.mode === 'merge' ? ' <span class="hint">(updates verses ' + esc(spanText(own)) + ')</span>' : '';
      var count = mg.mode === 'merge' ? nums.length + ' verses after update' : nums.length + ' verses';
      h += '<div class="pv"><span>' + esc(BOOKS[c.book][0] + ' ' + c.ch) + tag + '</span><span class="' + (note || !ok ? 'warn' : 'ok') + '">' +
        (!ok ? 'not a real chapter' : count + (note ? ', ' + esc(note) : ' ✓')) + '</span></div>';
    });
    toast(parsed.length + (parsed.length === 1 ? ' chapter' : ' chapters') + ' found. Review them below.');
    h += '</div><p class="hint">Check the verse counts against your source, then add them.</p>' +
      '<div class="actions"><button class="primary" id="iAdd">Add to my Bible</button></div><p class="status" id="iStat" aria-live="polite"></p>';
    pv.innerHTML = h;
    document.getElementById('iAdd').onclick = async function () {
      var btn = this; btn.disabled = true;
      var stat = document.getElementById('iStat');
      stat.style.color = ''; stat.textContent = 'Saving to ' + (store.mode === 'db' ? 'your account' : 'this device') + '…';
      var good = parsed.filter(function (c) { return c.ch <= BOOKS[c.book][1]; });
      try {
        for (var i = 0; i < good.length; i++) {
          btn.textContent = 'Saving ' + (i + 1) + ' of ' + good.length + '…';
          var c = good[i];
          stat.textContent = 'Saving ' + BOOKS[c.book][0] + ' ' + c.ch + '…';
          var mg = mergeChapter(chapters[c.key], c);
          await putChapter({ key: c.key, book: c.book, ch: c.ch, verses: mg.verses, heads: mg.heads, updated: Date.now() });
        }
        var total = good.reduce(function (a, c) { return a + c.verses.length; }, 0);
        var first = good[0], last = good[good.length - 1];
        toast(BOOKS[first.book][0] + ' ' + first.ch + (last.ch !== first.ch ? '–' + last.ch : '') + ': ' + total + ' verses added');
        txt.value = ''; lsSet('nb-draft', '');
        pv.innerHTML = '';
        bookSel.value = first.book; chIn.value = Math.min(last.ch + 1, BOOKS[first.book][1]); toIn.value = ''; toTouched = false; det.textContent = '';
        prog();
        if (!qEl.value.trim()) showChapter(has(pos.b, pos.c) && !good.some(function (g) { return g.book === pos.b && g.ch === pos.c; }) ? pos.b : first.book, has(pos.b, pos.c) && !good.some(function (g) { return g.book === pos.b && g.ch === pos.c; }) ? pos.c : first.ch);
      } catch (e) {
        btn.disabled = false; btn.textContent = 'Try again';
        var saved = good.filter(function (g) { return has(g.book, g.ch); }).map(function (g) { return g.ch; });
        stat.style.color = 'var(--name)';
        stat.textContent = 'Not saved: ' + (e && e.code ? e.code : 'error') + (e && e.message ? ' (' + e.message + ')' : '') + '.' +
          (saved.length ? ' Chapters ' + saved.join(', ') + ' did save.' : '') + ' If this keeps happening, copy this message into your chat with Claude.';
      }
    };
  }
}
function segBtns(id, opts, val) {
  return '<div class="seg" id="' + id + '">' + opts.map(function (o) { return '<button data-val="' + esc(o[0]) + '" class="' + (String(val) === String(o[0]) ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>';
}
function openSettings() {
  openSheet('Settings');
  sheetBody.innerHTML = nvNamesSettingsHtml() + favSettingsHtml() + nvToolsSettingsHtml() + musSettingsHtml() +
    '<div class="set"><div class="set-t">Page</div>' + segBtns('sTheme', [['dark', 'White on black'], ['light', 'Black on white']], S.theme) + '</div>' +
    '<label class="field"><span>Your name, for the greeting on Today</span><input type="text" id="sGreet" value="' + esc(S.greet || '') + '" placeholder="Brad"></label>' +
    '<div class="set"><div class="set-t">Reading voice (English)</div><select id="sVoiceEn" style="width:100%;padding:.5rem;border-radius:8px;background:var(--panel);color:var(--ink);border:1px solid var(--rule)"></select>' +
    '<div class="actions" style="margin-top:.5rem"><button class="quiet orbbtn" id="sVoiceTry"><span class="orb sm"></span>Hear it</button></div>' +
    '<p class="status" id="sVoiceNote" style="margin-top:.3rem">For the most natural sound, download a Premium or Enhanced voice on your device: Settings → Accessibility → Spoken Content → Voices → English. It then appears here.</p></div>' +
    '<div class="set"><div class="set-t">Reading voice (Hebrew)</div><select id="sVoiceHe" style="width:100%;padding:.5rem;border-radius:8px;background:var(--panel);color:var(--ink);border:1px solid var(--rule)"></select></div>' +
    '<div class="set"><div class="set-t">Selah pause</div>' + segBtns('sSelahM', [['away', 'After a break'], ['daily', 'Once a day'], ['off', 'Off']], selahMode()) + '<p class="status" style="margin-top:.3rem">“After a break” shows it whenever you come back after 30 minutes or more away.</p></div>' +
    '<div class="set"><div class="set-t">Page pictures</div><div class="actions" style="margin-top:.2rem"><button class="quiet" id="sPicWord">Today’s Word picture</button><button class="quiet" id="sPicSelah">Selah picture</button></div></div>' +
    '<label class="field"><span>The Name in English letters (used when shown in English, and for memory verses)</span><input type="text" id="sMemName" value="' + esc(memName()) + '"></label>' +
    '<label class="field"><span>The Messiah’s name in English letters</span><input type="text" id="sMemMes" value="' + esc(memMessiah()) + '"></label>' +
    '<div class="set"><div class="set-t">Text size</div>' + segBtns('sSize', [[16, 'Small'], [19, 'Medium'], [22, 'Large'], [26, 'Larger']], S.size) + '</div>' +
    '<div class="set"><label class="check"><input type="checkbox" id="sShade"' + (S.shade ? ' checked' : '') + '> <span>Colour the restored names in gold</span></label>' +
    '<label class="check"><input type="checkbox" id="sHide"' + (S.autohide !== false ? ' checked' : '') + '> <span>Hide the top bar while reading (scroll up to show it)</span></label></div>' +
    '<div class="set"><div class="set-t">Names for chapters you import from now on</div>' +
      '<p class="hint" style="margin-top:0">The Name, where the English text prints LORD or GOD</p>' + segBtns('sName', [['heb', '<span class="heb">יהוה</span>'], ['Yahowah', 'Yahowah'], ['Yehovah', 'Yehovah']], S.name) +
      '<p class="hint">The Messiah’s name, where the English text prints Jesus</p>' + segBtns('sJesus', [['heb', '<span class="heb">יהושע</span>'], ['Yehoshua', 'Yehoshua'], ['Yeshua', 'Yeshua'], ['keep', 'Jesus']], S.jesus) +
      '<p class="hint">Lord, in ordinary type</p>' + segBtns('sLord', [['keep', 'Lord'], ['Adonai', 'Adonai'], ['Master', 'Master']], S.lord) +
      '<label class="check"><input type="checkbox" id="sGod"' + (S.god ? ' checked' : '') + '> <span>God → Elohim</span></label>' +
      '<label class="check"><input type="checkbox" id="sChrist"' + (S.christ ? ' checked' : '') + '> <span>Christ → Messiah</span></label>' +
      '<label class="check"><input type="checkbox" id="sSpirit"' + (S.spirit ? ' checked' : '') + '> <span>Holy Spirit → Ruach ha-Qodesh</span></label>' +
      '<label class="check"><input type="checkbox" id="sBrackets"' + (S.brackets ? ' checked' : '') + '> <span>Keep the original English word and add the name in brackets</span></label>' +
      '<p class="hint">Chapters already imported keep their names. Re-import a chapter to change it.</p></div>' +
    '<p class="status">' + esc(storageNote()) + '</p>';
  function seg(id, k, num) {
    document.getElementById(id).querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        S[k] = num ? +b.dataset.val : b.dataset.val; saveSettings(); applyLook();
        document.getElementById(id).querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
        if (k === 'theme' || k === 'size') refreshView();
      };
    });
  }
  document.getElementById('sGreet').oninput = function () { S.greet = this.value.trim(); saveSettings(); };
  document.getElementById('sMemName').oninput = function () { S.memName = this.value.trim(); saveSettings(); };
  document.querySelectorAll('#sSelahM button').forEach(function (bt) { bt.onclick = function () { S.selahMode = bt.dataset.val; S.selah = bt.dataset.val !== 'off'; saveSettings(); document.querySelectorAll('#sSelahM button').forEach(function (x) { x.classList.toggle('on', x === bt); }); }; });
  document.getElementById('sPicWord').onclick = function () { openPicPicker('word'); };
  document.getElementById('sPicSelah').onclick = function () { openPicPicker('selah'); };
  function fillVoices() {
    [['sVoiceEn', 'en', 'voiceEn'], ['sVoiceHe', 'he', 'voiceHe']].forEach(function (x) {
      var sel = document.getElementById(x[0]); if (!sel) return;
      var vs = voicesFor(x[1]), cur = memVoice(x[1]);
      sel.innerHTML = vs.length ? vs.map(function (v) { var id = v.voiceURI || v.name; return '<option value="' + esc(id) + '"' + (cur && (cur.voiceURI || cur.name) === id ? ' selected' : '') + '>' + esc(voiceLabel(v)) + '</option>'; }).join('')
        : '<option value="">' + (x[1] === 'he' ? 'No Hebrew voice installed' : 'No voices found yet') + '</option>';
      sel.onchange = function () { S[x[2]] = sel.value; saveSettings(); };
    });
  }
  fillVoices();
  try { if (window.speechSynthesis) speechSynthesis.onvoiceschanged = fillVoices; } catch (e) {}
  document.getElementById('sVoiceTry').onclick = function () {
    if (memSpeaking) { stopMem(); return; }
    var line = 'יהוה is my shepherd; I shall not want. He makes me lie down in green pastures.';
    speakMem({ mode: 'esv' }, line.split(' ').map(function (w) { return { w: w }; }), null, 'normal');
  };
  document.getElementById('sMemMes').oninput = function () { S.memMessiah = this.value.trim(); saveSettings(); };
  seg('sTheme', 'theme'); seg('sSize', 'size', true); seg('sName', 'name'); seg('sJesus', 'jesus'); seg('sLord', 'lord');
  nvBindNamesSettings(); favBindSettings(); nvToolsBindSettings(); musBindSettings();
  [['sShade', 'shade'], ['sHide', 'autohide'], ['sGod', 'god'], ['sChrist', 'christ'], ['sSpirit', 'spirit'], ['sBrackets', 'brackets']].forEach(function (p) {
    document.getElementById(p[0]).onchange = function () { S[p[1]] = this.checked; saveSettings(); if (p[1] === 'shade') refreshView(); };
  });
}
function refreshView() { if (homeOn) { showHome(); return; } if (qEl.value.trim()) renderSearch(); else if (cmpView) { var y1 = window.scrollY; showCompare(cmpView.b, cmpView.c).then(function () { window.scrollTo(0, y1); }); } else if (hebView) { var y0 = window.scrollY; showHebrew(hebView.b, hebView.c).then(function () { window.scrollTo(0, y0); }); } else if (has(pos.b, pos.c)) { var y = window.scrollY; showChapter(pos.b, pos.c); window.scrollTo(0, y); } }
