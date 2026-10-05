// Noble Vine Study & Discipleship · 2.0.0 · Whole-Bible import, Bible name
'use strict';
// Whole-Bible import, version labels
function bibleName() { return S.bibleName || 'Restored Names Bible'; }
function bibleShort() { var n = S.bibleName; if (!n) return 'RNB'; var w = n.split(/\s+/).filter(Boolean); return w.length > 1 ? w.map(function (x) { return x.charAt(0).toUpperCase(); }).join('').slice(0, 4) : n.slice(0, 6); }
function gwLink(b, c, v, t) {
  return '<a href="https://www.biblegateway.com/passage/?search=' + encodeURIComponent(BOOKS[b][0] + ' ' + c).replace(/%20/g, '+') + '&version=' + v + '" target="_blank" rel="noopener"><span>' + t + '</span><span>Bible Gateway ↗</span></a>';
}
// Import a whole Bible from a text file: one verse per line, "Genesis 1:1<TAB>text"
function parseWholeFile(text) {
  var out = {}, books = {}, verses = 0;
  text.replace(/\r\n?/g, '\n').split('\n').forEach(function (line) {
    var m = line.match(/^\uFEFF?\s*((?:[1-3]\s)?[A-Za-z][A-Za-z ]*?)\s+(\d{1,3}):(\d{1,3})\t(.+)$/);
    if (!m) return;
    var b = findBook(m[1]); if (b < 0) return;
    var c = +m[2], v = +m[3]; if (c < 1 || c > BOOKS[b][1]) return;
    var k = key(b, c);
    if (!out[k]) out[k] = { key: k, book: b, ch: c, verses: [] };
    out[k].verses.push({ v: v, t: m[4].trim() }); books[b] = 1; verses++;
  });
  var list = Object.keys(out).sort().map(function (k) { out[k].verses.sort(function (a, z) { return a.v - z.v; }); return out[k]; });
  return { list: list, books: Object.keys(books).length, verses: verses };
}
function openWholeImport() {
  openSheet('Import a whole Bible');
  sheetBody.innerHTML = '<p class="hint" style="margin-top:0">Choose a Bible saved as a text file with one verse per line, such as bsb.txt. Your Names settings are applied to every verse as it goes in.</p>' +
    '<input type="file" id="wFile" accept=".txt,text/plain" class="hidden"><div class="actions"><button class="primary" id="wPick">Choose text file</button></div><div id="wRes"></div>';
  var file = document.getElementById('wFile'), res = document.getElementById('wRes');
  document.getElementById('wPick').onclick = function () { file.value = ''; file.click(); };
  file.onchange = function () {
    var f = file.files && file.files[0]; if (!f) return;
    res.innerHTML = '<p class="hint">Reading the file…</p>';
    var rd = new FileReader();
    rd.onerror = function () { res.innerHTML = '<p class="hint" style="color:var(--name)">That file couldn’t be read.</p>'; };
    rd.onload = function () {
      var p = parseWholeFile(String(rd.result || ''));
      if (!p.list.length) { res.innerHTML = '<p class="hint" style="color:var(--name)">No verses found. This expects lines like “Genesis 1:1”, a tab, then the verse.</p>'; return; }
      var have = Object.keys(chapters).length;
      res.innerHTML = '<div class="card" style="margin-top:1rem"><h3>Found ' + p.books + ' books</h3><p class="hint">' + p.list.length.toLocaleString() + ' chapters · ' + p.verses.toLocaleString() + ' verses</p></div>' +
        '<label class="field"><span>Name for your Bible</span><input type="text" id="wName" value="' + esc(S.bibleName || 'Restored Names Bible') + '"></label>' +
        '<div class="set"><div class="set-t">The Name, where the text prints LORD or GOD</div>' + segBtns('wNm', [['heb', '<span class="heb">יהוה</span>'], ['Yahowah', 'Yahowah'], ['Yehovah', 'Yehovah']], S.name) +
        '<div class="set-t" style="margin-top:.8rem">Lord, in ordinary type (Adonai in the Hebrew)</div>' + segBtns('wLd', [['keep', 'Lord'], ['Adonai', 'Adonai'], ['Master', 'Master']], S.lord) +
        '<p class="hint">The Messiah’s name, Elohim and the other choices follow your Settings.</p></div>' +
        (have ? '<label class="check"><input type="checkbox" id="wRep" checked> <span>Replace everything now in my Bible (' + have + ' chapters). Notes, plans, memory verses and recordings are kept.</span></label>' : '') +
        '<div class="actions"><button class="primary" id="wGo">Import ' + p.list.length.toLocaleString() + ' chapters</button></div>' +
        '<div class="meter" id="wMeter" style="display:none"><i style="width:0%"></i></div><p class="status" id="wStat" aria-live="polite"></p>';
      [['wNm', 'name'], ['wLd', 'lord']].forEach(function (x) {
        document.getElementById(x[0]).querySelectorAll('button').forEach(function (bt) {
          bt.onclick = function () { S[x[1]] = bt.dataset.val; saveSettings(); document.getElementById(x[0]).querySelectorAll('button').forEach(function (y) { y.classList.toggle('on', y === bt); }); };
        });
      });
      document.getElementById('wGo').onclick = async function () {
        var btn = this, st = document.getElementById('wStat'), meter = document.getElementById('wMeter'), rep = document.getElementById('wRep');
        btn.disabled = true; st.style.color = ''; meter.style.display = '';
        var nm = (document.getElementById('wName').value || '').trim().slice(0, 60) || 'Restored Names Bible';
        try {
          if (rep && rep.checked) {
            var ks = Object.keys(chapters);
            for (var i = 0; i < ks.length; i++) {
              await removeChapter(ks[i]);
              if (i % 50 === 0) { st.textContent = 'Clearing your old text… ' + (i + 1) + ' of ' + ks.length; await sleep(0); }
            }
          }
          for (var j = 0; j < p.list.length; j++) {
            var c = p.list[j];
            await putChapter({ key: c.key, book: c.book, ch: c.ch, verses: c.verses.map(function (x) { return { v: x.v, t: restore(x.t) }; }), heads: [], updated: Date.now() });
            if (j % 25 === 0 || j === p.list.length - 1) {
              meter.firstChild.style.width = Math.round((j + 1) / p.list.length * 100) + '%';
              st.textContent = 'Saving ' + (j + 1).toLocaleString() + ' of ' + p.list.length.toLocaleString() + ' · ' + BOOKS[c.book][0] + ' ' + c.ch;
              await sleep(0);
            }
          }
          st.textContent = 'Finishing…';
          if (typeof idbQueue !== 'undefined') await idbQueue;
          S.bibleName = nm; MEM_MODES[0][1] = bibleShort(); saveSettings();
          st.textContent = 'Done. ' + p.list.length.toLocaleString() + ' chapters are now in ' + nm + '.';
          btn.textContent = 'Imported';
          var go = document.createElement('button'); go.className = 'quiet'; go.textContent = 'Read Genesis 1';
          go.onclick = function () { closeSheet(); showChapter(0, 1); };
          btn.parentNode.appendChild(go);
        } catch (e) {
          btn.disabled = false; btn.textContent = 'Try again'; st.style.color = 'var(--name)';
          st.textContent = 'Stopped: ' + ((e && (e.code || e.message)) || 'error') + '. Tap Try again to carry on.';
        }
      };
    };
    rd.readAsText(f);
  };
}
