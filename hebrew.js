// Noble Vine Study & Discipleship · 2.0.0 · Hebrew interlinear and word study (STEP Bible)
'use strict';
// ======================================================================
// Hebrew study: interlinear and word study (STEP Bible data, CC BY 4.0)
// ======================================================================
function dbTimeout(pr) { return Promise.race([pr, new Promise(function (res) { setTimeout(function () { res(null); }, 1500); })]); }
var HEB_SETS = [{ name: 'TAHOT Gen-Deu', books: [0, 1, 2, 3, 4], label: 'Genesis to Deuteronomy', size: 'about 25 to 30 MB' },
  { name: 'TAHOT Jos-Est', books: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], label: 'Joshua to Esther', size: 'about 30 MB' },
  { name: 'TAHOT Job-Sng', books: [17, 18, 19, 20, 21], label: 'Job to the Song of Songs', size: 'about 15 MB' },
  { name: 'TAHOT Isa-Mal', books: [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38], label: 'Isaiah to Malachi', size: 'about 30 MB' }];
var STEP_API = 'https://api.github.com/repos/STEPBible/STEPBible-Data/contents/';
var STEP_RAW = 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/';
var STEP_ABBR = ['Gen','Exo','Lev','Num','Deu','Jos','Jdg','Rut','1Sa','2Sa','1Ki','2Ki','1Ch','2Ch','Ezr','Neh','Est','Job','Psa','Pro','Ecc','Sng','Isa','Jer','Lam','Ezk','Dan','Hos','Jol','Amo','Oba','Jon','Mic','Nam','Hab','Zep','Hag','Zec','Mal'];
var hebDb = null, hebBooks = {}, hebLex = null, hebMeta = null, hebView = null;
function hebOpen() {
  if (hebDb) return Promise.resolve(hebDb);
  return dbTimeout(new Promise(function (res) {
    try {
      var r = indexedDB.open('nrb-hebrew', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onsuccess = function () { hebDb = r.result; res(hebDb); };
      r.onerror = function () { res(null); };
    } catch (e) { res(null); }
  }));
}
async function hebGet(k) {
  var db = await hebOpen(); if (!db) return null;
  return new Promise(function (res) { try { var q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; } catch (e) { res(null); } });
}
async function hebPut(k, v) {
  var db = await hebOpen(); if (!db) throw new Error('nostore');
  return new Promise(function (res, rej) { var tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = tx.onabort = function () { rej(tx.error || new Error('space')); }; });
}
async function hebLoadMeta() { if (!hebMeta) hebMeta = (await hebGet('meta')) || { books: [] }; return hebMeta; }
async function hebBook(b) { if (hebBooks[b]) return hebBooks[b]; var d = await hebGet('book:' + b); if (d) hebBooks[b] = d; return d; }
async function hebLexicon() { if (!hebLex) hebLex = (await hebGet('lex')) || {}; return hebLex; }
function hebSetFor(b) { return HEB_SETS.filter(function (x) { return x.books.indexOf(b) >= 0; })[0] || null; }

async function stepFileUrl(folder, prefix, fallback) {
  try {
    var r = await fetch(STEP_API + encodeURIComponent(folder));
    if (r.ok) {
      var list = await r.json();
      var f = list.filter(function (x) { return x.name && x.name.indexOf(prefix) === 0 && /\.txt$/i.test(x.name); })[0];
      if (f && f.download_url) return f.download_url;
    }
  } catch (e) {}
  return STEP_RAW + encodeURIComponent(folder) + '/' + encodeURIComponent(fallback);
}
async function fetchText(url, onProgress) {
  var r = await fetch(url);
  if (!r.ok) throw new Error('download ' + r.status);
  if (!r.body || !r.body.getReader) return await r.text();
  var total = +r.headers.get('content-length') || 0, got = 0, chunks = [], rd = r.body.getReader();
  while (true) {
    var x = await rd.read(); if (x.done) break;
    chunks.push(x.value); got += x.value.length; if (onProgress) onProgress(got, total);
  }
  var all = new Uint8Array(got), o = 0; chunks.forEach(function (c) { all.set(c, o); o += c.length; });
  return new TextDecoder('utf-8').decode(all);
}
function cleanHeb(h) { return h.replace(/[\/\\]/g, '').trim(); }
function mainStrong(st) {
  var m = st.match(/\{(H\d{4}[A-Za-z]?)\}/); if (m) return m[1];
  var all = st.match(/H\d{4}[A-Za-z]?/g) || [];
  for (var i = all.length - 1; i >= 0; i--) if (+all[i].slice(1, 5) < 9000) return all[i];
  return all[0] || '';
}
// Parse the STEP Bible tab-separated Hebrew text into { book: { chapter: { verse: [[heb, sound, gloss, strong, grammar], ...] } } }
function parseTahot(text) {
  var out = {}, seen = {}, col = { heb: 1, tr: 2, gl: 3, st: 4, mo: 5 };
  var lines = text.split(/\r?\n/);
  for (var i = 0; i < lines.length; i++) {
    var ln = lines[i];
    if (/Transliteration/.test(ln) && /Translation/.test(ln) && ln.indexOf('\t') > 0) {
      var hd = ln.split('\t').map(function (x) { return x.trim().toLowerCase(); });
      var find = function (re, d) { for (var k = 0; k < hd.length; k++) if (re.test(hd[k])) return k; return d; };
      col = { heb: find(/^hebrew/, 1), tr: find(/^translit/, 2), gl: find(/^translation/, 3), st: find(/strong/, 4), mo: find(/^grammar|^morph/, 5) };
      continue;
    }
    var m = ln.match(/^([1-3]?[A-Z][a-z]{2})\.(\d+)\.(\d+)[^#\t]*#(\d+)/);
    if (!m) continue;
    var b = STEP_ABBR.indexOf(m[1]); if (b < 0) continue;
    var c = +m[2], v = +m[3], id = b + '.' + c + '.' + v + '.' + m[4];
    if (seen[id]) continue; seen[id] = 1;
    var f = ln.split('\t');
    var heb = cleanHeb(f[col.heb] || ''); if (!heb) continue;
    var gl = (f[col.gl] || '').replace(/\//g, ' ').replace(/\s+/g, ' ').replace(/<([^>]*)>/g, function (x, y) { return /obj/i.test(y) ? '–' : y; }).trim();
    var tr = (f[col.tr] || '').replace(/\//g, '').replace(/\./g, '·').trim();
    var bk = out[b] = out[b] || {}, ch = bk[c] = bk[c] || {}, vv = ch[v] = ch[v] || [];
    vv.push([heb, tr, gl, (f[col.st] || '').trim(), (f[col.mo] || '').trim()]);
  }
  return out;
}
function parseTbesh(text) {
  var lex = {};
  text.split(/\r?\n/).forEach(function (ln) {
    var m = ln.match(/^(H\d{4}[A-Za-z]?)\t/); if (!m || lex[m[1]]) return;
    var f = ln.split('\t'), hi = -1;
    for (var i = 1; i < f.length; i++) if (/[\u0590-\u05FF]/.test(f[i])) { hi = i; break; }
    if (hi < 0) return;
    var mi = -1; for (var j = hi + 1; j < f.length; j++) if (/^[HA]:/.test(f[j])) { mi = j; break; }
    var gi = mi > 0 ? mi + 1 : hi + 3;
    var def = (f[gi + 1] || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    lex[m[1]] = { h: f[hi].trim(), t: (f[hi + 1] || '').trim(), g: (f[gi] || '').trim(), d: def.slice(0, 1600) };
  });
  return lex;
}
async function hebDownload(set, stat) {
  stat('Finding the Hebrew text…');
  var tUrl = await stepFileUrl('Translators Amalgamated OT+NT', set.name, set.name + ' - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt');
  var lUrl = await stepFileUrl('Lexicons', 'TBESH', 'TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt');
  var mb = function (n) { return (n / 1048576).toFixed(1) + ' MB'; };
  var txt = await fetchText(tUrl, function (g, t) { stat('Downloading the Hebrew text… ' + mb(g) + (t ? ' of ' + mb(t) : '')); });
  stat('Setting out the words…');
  await new Promise(function (r) { setTimeout(r, 30); });
  var data = parseTahot(txt); txt = null;
  var got = Object.keys(data).map(Number);
  if (!got.length) throw new Error('format');
  var lex = await hebLexicon();
  if (!Object.keys(lex).length) {
    var lt = await fetchText(lUrl, function (g, t) { stat('Downloading the lexicon… ' + mb(g) + (t ? ' of ' + mb(t) : '')); });
    lex = parseTbesh(lt); lt = null;
    await hebPut('lex', lex); hebLex = lex;
  }
  stat('Saving to this device…');
  for (var i = 0; i < got.length; i++) { await hebPut('book:' + got[i], data[got[i]]); hebBooks[got[i]] = data[got[i]]; }
  var meta = await hebLoadMeta();
  got.forEach(function (b) { if (meta.books.indexOf(b) < 0) meta.books.push(b); });
  meta.books.sort(function (a, z) { return a - z; }); meta.when = Date.now();
  await hebPut('meta', meta);
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
}

// Grammar in plain English (OpenScriptures-style codes used by STEP Bible)
var STEMS = { q: 'simple (Qal)', N: 'passive/reflexive (Niphal)', p: 'intensive (Piel)', P: 'intensive passive (Pual)', h: 'causative (Hiphil)', H: 'causative passive (Hophal)', t: 'reflexive (Hithpael)', o: 'intensive (Polel)', O: 'intensive passive (Polal)', r: 'reflexive (Hithpolel)', m: 'intensive (Poel)', M: 'intensive passive (Poal)', k: 'intensive (Palel)', K: 'intensive passive (Pulal)', Q: 'simple passive (Qal passive)', l: 'intensive (Pilpel)', L: 'intensive passive (Polpal)', f: 'reflexive (Hithpalpel)', D: 'reflexive (Nithpael)', j: 'intensive (Pealal)', i: 'intensive (Pilel)', u: 'reflexive passive (Hothpaal)', c: 'causative (Tiphil)', v: 'reflexive (Hishtaphel)', w: 'reflexive (Nithpalel)', y: 'reflexive (Nithpoel)', z: 'reflexive (Hithpoel)' };
var VTYPE = { p: 'completed action (perfect)', q: 'completed, in sequence (and…)', i: 'ongoing or future (imperfect)', w: 'narrative “and he…” (wayyiqtol)', h: 'wish: “let me / let us” (cohortative)', j: 'wish: “let him / may he” (jussive)', v: 'command (imperative)', r: 'participle: “…ing”', s: 'passive participle: “…ed”', a: 'infinitive absolute', c: 'infinitive: “to …”' };
var PERS = { '1cs': 'I', '1cp': 'we', '2ms': 'you (m.)', '2fs': 'you (f.)', '2mp': 'you all (m.)', '2fp': 'you all (f.)', '3ms': 'he', '3fs': 'she', '3mp': 'they (m.)', '3fp': 'they (f.)', '3cp': 'they', '2cs': 'you', '1bs': 'I', '1bp': 'we', '3bp': 'they' };
var GEN = { m: 'masculine', f: 'feminine', b: 'both genders', c: 'common' }, NUM = { s: 'singular', p: 'plural', d: 'dual' }, STATE = { a: '', c: 'construct (“of”)', d: 'definite' };
function morphPart(code) {
  var c = code.charAt(0), r = code.slice(1);
  if (c === 'V') {
    var st = STEMS[r.charAt(0)] || '', ty = VTYPE[r.charAt(1)] || '', pg = r.slice(2, 5), who = PERS[pg] || '';
    if (!who && /^[mfbc][spd]/.test(r.slice(2))) who = [GEN[r.charAt(2)], NUM[r.charAt(3)]].filter(Boolean).join(' ');
    return ['verb', st, ty, who].filter(Boolean).join(' · ');
  }
  if (c === 'N') { var nt = r.charAt(0) === 'p' ? 'proper name' : r.charAt(0) === 'g' ? 'people/place name' : 'noun'; return [nt, GEN[r.charAt(1)], NUM[r.charAt(2)], STATE[r.charAt(3)]].filter(Boolean).join(' · '); }
  if (c === 'A') { var at = { a: 'adjective', c: 'number', o: 'ordinal number', g: 'adjective (people/place)' }[r.charAt(0)] || 'adjective'; return [at, GEN[r.charAt(1)], NUM[r.charAt(2)], STATE[r.charAt(3)]].filter(Boolean).join(' · '); }
  if (c === 'R') return r.charAt(0) === 'd' ? 'preposition with “the”' : 'preposition';
  if (c === 'C') return 'conjunction';
  if (c === 'D') return 'adverb';
  if (c === 'P') return ({ d: 'demonstrative pronoun', f: 'indefinite pronoun', i: 'question word', p: 'personal pronoun', r: 'relative pronoun' }[r.charAt(0)] || 'pronoun') + (PERS[r.slice(1, 4)] ? ' · ' + PERS[r.slice(1, 4)] : '');
  if (c === 'S') return r.charAt(0) === 'p' ? 'suffix: ' + (PERS[r.slice(1, 4)] || '').replace(/^I$/, 'my/me').replace(/^he$/, 'his/him').replace(/^she$/, 'her').replace(/^we$/, 'our/us').replace(/^they/, 'their/them').replace(/^you/, 'your/you') : r.charAt(0) === 'd' ? 'suffix: direction (“-ward”)' : 'suffix';
  if (c === 'T') return ({ a: 'affirming particle', d: 'the', e: 'exhortation', i: 'question particle', j: 'interjection', m: 'demonstrative', n: 'negative (“not”)', o: 'direct-object marker (untranslated)', r: 'relative (“who/which”)' }[r.charAt(0)] || 'particle');
  return '';
}
function morphPlain(mo, full) {
  if (!mo) return '';
  var lang = mo.charAt(0) === 'A' ? 'Aramaic · ' : '';
  var parts = mo.replace(/^[HA]/, '').split('/').map(morphPart).filter(Boolean);
  if (!full) { var main = parts.filter(function (x) { return /^(verb|noun|proper|people|adjective|number|ordinal|personal|demonstrative pronoun|adverb)/.test(x); })[0] || parts[parts.length - 1] || ''; return main.split(' · ').slice(0, 3).join(' · '); }
  return lang + parts.join('  +  ');
}
function glossNames(g) { return g; }   // STEP Bible's English is shown exactly as published

// Interlinear view
async function showHebrew(b, c, flashV) {
  leaveHome();
  hebView = { b: b, c: c }; cmpView = null; planCtx = null; pos = { b: b, c: c };
  selected.clear(); updateSelbar();
  document.getElementById('refBtn').textContent = bn(b) + ' ' + c;
  var set = hebSetFor(b);
  var head = '<div class="ilbar"><button id="ilBack">‹ English</button><span class="sp"></span>' +
    '<button data-il="tr" class="' + (S.ilTr !== false ? 'on' : '') + '">Sound</button><button data-il="gl" class="' + (S.ilGl !== false ? 'on' : '') + '">English</button><button data-il="mo" class="' + (S.ilMo ? 'on' : '') + '">Grammar</button></div>' +
    '<h1 class="ch-title">' + esc(bn(b) + ' ' + c) + '</h1><p class="ch-sub">Hebrew, word by word. Tap any word to study it.</p>';
  var bindHead = function () {
    document.getElementById('ilBack').onclick = function () { hebView = null; if (has(b, c)) showChapter(b, c); else { main.innerHTML = ''; showChapter(b, c); } };
    main.querySelectorAll('[data-il]').forEach(function (el) { el.onclick = function () { var k = { tr: 'ilTr', gl: 'ilGl', mo: 'ilMo' }[el.dataset.il]; S[k] = k === 'ilMo' ? !S[k] : S[k] === false; saveSettings(); showHebrew(b, c); }; });
  };
  if (!set) { main.innerHTML = head + '<div class="card"><p>The Hebrew study trial covers Genesis to Deuteronomy for now. The other books come next.</p></div>'; bindHead(); window.scrollTo(0, 0); return; }
  var data = await hebBook(b);
  if (!hebView || hebView.b !== b || hebView.c !== c) return;
  if (!data && window.claude) {
    main.innerHTML = head + '<div class="card"><h3>Hebrew study lives in your installed app</h3><p class="hint">This claude.ai copy can’t download the Hebrew. Open the Scriptures app from your home-screen icon, and tap א Hebrew there.</p></div>';
    bindHead(); window.scrollTo(0, 0); return;
  }
  if (!data) {
    main.innerHTML = head + '<div class="card"><h3>Download the Hebrew</h3><p class="hint">The Hebrew text and lexicon for ' + esc(set.label) + ' aren’t on this device yet. It’s a one-time download of ' + esc(set.size) + ', so Wi-Fi is best. After that it works offline.</p>' +
      '<div class="actions"><button class="primary" id="hbGet">Download now</button></div><p class="status" id="hbStat"></p></div>' +
      '<p class="status">Hebrew text, glosses and lexicon from STEP Bible (stepbible.org), Tyndale House, Cambridge. CC BY 4.0.</p>';
    bindHead();
    document.getElementById('hbGet').onclick = async function () {
      var btn = this, st = document.getElementById('hbStat'); btn.disabled = true;
      try { await hebDownload(set, function (m) { st.textContent = m; }); toast('Hebrew downloaded'); showHebrew(b, c, flashV); }
      catch (e) {
        btn.disabled = false; st.style.color = 'var(--name)';
        st.textContent = e && e.message === 'nostore' ? 'This view can’t store the Hebrew. Use the app from your home-screen icon.' :
          e && e.message === 'format' ? 'The Hebrew file came through, but in a layout the app didn’t recognise. Send Claude a screenshot of this message.' :
          'The download didn’t work (' + ((e && e.message) || 'error') + '). Check your connection and try again. If it keeps failing, send Claude a screenshot.';
      }
    };
    window.scrollTo(0, 0); return;
  }
  var ch = data[c] || {}, vs = Object.keys(ch).map(Number).sort(function (a, z) { return a - z; });
  var showTr = S.ilTr !== false, showGl = S.ilGl !== false, showMo = !!S.ilMo, html = head;
  if (!vs.length) html += '<p class="hint">No Hebrew found for this chapter.</p>';
  vs.forEach(function (v) {
    html += '<div class="ilv" id="hv' + v + '"><span class="vno">' + v + '</span>';
    ch[v].forEach(function (w, i) {
      html += '<button class="iw" data-v="' + v + '" data-i="' + i + '"><span class="h" dir="rtl">' + esc(w[0]) + '</span>' +
        (showGl ? '<span class="g">' + esc(glossNames(w[2]) || '–') + '</span>' : '') +
        (showTr ? '<span class="t">' + esc(w[1]) + '</span>' : '') +
        (showMo ? '<span class="m">' + esc(morphPlain(w[4])) + '</span>' : '') + '</button>';
    });
    html += '</div>';
  });
  var nb = c < BOOKS[b][1] ? { b: b, c: c + 1 } : null, pb = c > 1 ? { b: b, c: c - 1 } : null;
  html += '<nav class="chnav"><button id="hPrev"' + (pb ? '' : ' disabled') + '>‹ ' + (pb ? esc(bn(b) + ' ' + pb.c) : 'Start') + '</button><button id="hNext"' + (nb ? '' : ' disabled') + '>' + (nb ? esc(bn(b) + ' ' + nb.c) : 'End') + ' ›</button></nav>' +
    '<p class="status" style="margin-top:1.5rem">Hebrew text, glosses and lexicon: STEP Bible (stepbible.org), Tyndale House, Cambridge. CC BY 4.0.</p>';
  main.innerHTML = html; bindHead();
  if (pb) document.getElementById('hPrev').onclick = function () { showHebrew(b, c - 1); };
  if (nb) document.getElementById('hNext').onclick = function () { showHebrew(b, c + 1); };
  main.querySelectorAll('.iw').forEach(function (el) {
    el.onclick = function () {
      main.querySelectorAll('.iw.sel').forEach(function (x) { x.classList.remove('sel'); });
      el.classList.add('sel');
      var v = +el.dataset.v, i = +el.dataset.i;
      openWordStudy({ b: b, c: c, v: v, i: i, n: ch[v].length, w: ch[v][i] });
    };
  });
  if (flashV && document.getElementById('hv' + flashV)) {
    var fv = document.getElementById('hv' + flashV); fv.scrollIntoView({ block: 'center' }); fv.classList.add('flash'); setTimeout(function () { fv.classList.remove('flash'); }, 2200);
  } else window.scrollTo(0, 0);
}

// Word study
function savedWords() { return lsGet('nb-words', {}) || {}; }
function saveWords(w) { lsSet('nb-words', w); }
async function wordOccurrences(key) {
  var meta = await hebLoadMeta(), out = [];
  for (var k = 0; k < meta.books.length; k++) {
    var b = meta.books[k], d = await hebBook(b); if (!d) continue;
    Object.keys(d).map(Number).sort(function (a, z) { return a - z; }).forEach(function (c) {
      Object.keys(d[c]).map(Number).sort(function (a, z) { return a - z; }).forEach(function (v) {
        if (d[c][v].some(function (w) { return mainStrong(w[3]) === key; })) out.push({ b: b, c: c, v: v });
      });
    });
  }
  return out;
}
async function openWordStudy(at, keyOnly) {
  var w = at ? at.w : null, key = keyOnly || mainStrong(w[3]);
  var lex = await hebLexicon(), L = lex[key] || lex[key.replace(/[A-Za-z]$/, '')] || null;
  var sv = savedWords(), saved = sv[key];
  openSheet('Word study');
  var title = w ? esc(w[1]) + ' · “' + esc(glossNames(w[2])) + '”' : esc(L ? L.t : key) + (L ? ' · “' + esc(glossNames(L.g)) + '”' : '');
  var h = '<div class="wsh"><div><div style="font-size:1.1rem">' + title + '</div><div class="status" style="margin:.2rem 0 0">' +
    (at ? esc(bn(at.b) + ' ' + at.c + ':' + at.v) + ', word ' + (at.i + 1) + ' of ' + at.n : 'Saved word') + '</div></div><div class="hw">' + esc(w ? w[0] : (L ? L.h : '')) + '</div></div>';
  h += '<div style="margin-top:.6rem">' +
    (L ? '<div class="wrow"><span>Root word</span><span><bdi class="heb">' + esc(L.h) + '</bdi> · ' + esc(L.t) + '</span></div>' : '') +
    '<div class="wrow"><span>Strong’s</span><span>' + esc(key || '–') + '</span></div>' +
    (L && L.g ? '<div class="wrow"><span>Meaning</span><span>' + esc(glossNames(L.g)) + '</span></div>' : '') +
    (w && w[4] ? '<div class="wrow"><span>Grammar</span><span>' + esc(morphPlain(w[4], true)) + '</span></div>' : '') + '</div>';
  if (L && L.d) h += '<p class="wdef" id="wDef">' + esc(L.d.length > 420 ? L.d.slice(0, 420) + '…' : L.d) + '</p>' + (L.d.length > 420 ? '<button class="backlink" id="wMore">Read the full entry</button>' : '');
  h += '<div class="grp" style="margin-top:1rem">Every place this word appears</div><div id="wOcc"><p class="hint">Searching…</p></div>';
  if (at) h += '<div class="actions" style="margin-top:.2rem"><button class="quiet" id="wCom">Commentary on ' + esc(bn(at.b) + ' ' + at.c + ':' + at.v) + '</button></div>';
  h += '<div class="actions"><button class="' + (saved ? 'quiet' : 'primary') + '" id="wSave">' + (saved ? '✓ In my word studies' : 'Save to my word studies') + '</button></div>';
  h += '<div id="wNoteBox"' + (saved ? '' : ' hidden') + '><div class="grp">My notes on this word</div><textarea id="wNote" placeholder="What does this word show? Notes for teaching…" style="min-height:6rem"></textarea><p class="status" id="wNoteStat"></p></div>';
  sheetBody.innerHTML = h;
  var wc = document.getElementById('wCom'); if (wc) wc.onclick = function () { openCommentary(at.b, at.c, at.v); };
  var more = document.getElementById('wMore'); if (more) more.onclick = function () { document.getElementById('wDef').textContent = L.d; more.remove(); };
  var note = document.getElementById('wNote'); if (saved) note.value = saved.note || '';
  note.oninput = function () { var x = savedWords(); if (x[key]) { x[key].note = note.value; x[key].updated = Date.now(); saveWords(x); document.getElementById('wNoteStat').textContent = 'Saved'; } };
  document.getElementById('wSave').onclick = function () {
    var x = savedWords();
    if (x[key]) { openStudySection(); return; }
    x[key] = { key: key, heb: L ? L.h : (w ? w[0] : ''), tr: L ? L.t : (w ? w[1] : ''), gloss: L ? L.g : (w ? w[2] : ''), ref: at ? { b: at.b, c: at.c, v: at.v } : null, note: '', added: Date.now() };
    saveWords(x); toast('Saved to your word studies');
    this.textContent = '✓ In my word studies'; this.className = 'quiet'; document.getElementById('wNoteBox').hidden = false; note.focus();
  };
  var occ = await wordOccurrences(key), box = document.getElementById('wOcc'); if (!box) return;
  var meta = await hebLoadMeta(), span = meta.books.length ? BOOKS[meta.books[0]][0] + (meta.books.length > 1 ? '–' + BOOKS[meta.books[meta.books.length - 1]][0] : '') : '';
  var showAll = false;
  function renderOcc() {
    var list = showAll ? occ : occ.slice(0, 24);
    box.innerHTML = '<p class="hint" style="margin:0">' + occ.length + (occ.length === 1 ? ' verse' : ' verses') + ' in ' + esc(span) + ', the books downloaded so far.</p><div class="refchips">' +
      list.map(function (r, i) { return '<button data-o="' + i + '">' + esc(bn(r.b).replace(/^(\w{3})\w*/, '$1') + ' ' + r.c + ':' + r.v) + '</button>'; }).join('') +
      (!showAll && occ.length > 24 ? '<button id="wAll">Show all ' + occ.length + ' ›</button>' : '') + '</div>';
    box.querySelectorAll('[data-o]').forEach(function (el) { el.onclick = function () { var r = occ[+el.dataset.o]; closeSheet(); closeSearch(); showHebrew(r.b, r.c, r.v); }; });
    var a = document.getElementById('wAll'); if (a) a.onclick = function () { showAll = true; renderOcc(); };
  }
  renderOcc();
}

// Study section
async function openStudySection() {
  openSheet('Hebrew study'); var tok = sheetSeq;
  var x = savedWords(), keys = Object.keys(x).sort(function (a, z) { return (x[z].added || 0) - (x[a].added || 0); });
  var meta = await hebLoadMeta();
  var h = '<p class="hint" style="margin-top:0">Read any passage in Hebrew, word by word, and save the words you study. On a chapter, tap <b>א Hebrew</b> to switch.</p>' +
    '<label class="field"><span>Go to a passage in Hebrew</span><input type="text" id="stRef" placeholder="Genesis 15 or Deut 6:4"></label>' +
    '<div class="actions" style="margin-top:-.4rem"><button class="primary" id="stGo">Open in Hebrew</button></div><p class="status" id="stStat"></p>';
  h += '<div class="grp" style="margin-top:1.2rem">My word studies</div>';
  if (!keys.length) h += '<p class="hint">None yet. While reading in Hebrew, tap a word, then <b>Save to my word studies</b>.</p>';
  keys.forEach(function (k) {
    var s = x[k];
    h += '<button class="dl-item" data-w="' + esc(k) + '" style="width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--rule);padding:.6rem 0;color:var(--ink);display:flex;justify-content:space-between;gap:.8rem">' +
      '<span><bdi class="heb" style="font-size:1.25rem">' + esc(s.heb) + '</bdi> ' + esc(s.tr) + ' · ' + esc(glossNames(s.gloss || '')) + '</span><span class="status" style="margin:0">' + (s.ref ? esc(bn(s.ref.b) + ' ' + s.ref.c + ':' + s.ref.v) : '') + (s.note ? ' · note' : '') + '</span></button>';
  });
  h += '<div class="grp" style="margin-top:1.2rem">On this device</div><p class="hint">' + (meta.books.length ? 'Hebrew downloaded for ' + esc(BOOKS[meta.books[0]][0] + (meta.books.length > 1 ? ' to ' + BOOKS[meta.books[meta.books.length - 1]][0] : '')) + '.' : 'No Hebrew downloaded yet. It downloads the first time you open a book in Hebrew.') + '</p>' +
    '<p class="status">Hebrew text, glosses and lexicon: STEP Bible (stepbible.org), Tyndale House, Cambridge. CC BY 4.0.</p>';
  if (tok !== sheetSeq) return; sheetBody.innerHTML = h;
  document.getElementById('stGo').onclick = function () {
    var r = parseRef(document.getElementById('stRef').value || '');
    if (!r || r.b >= 39) { document.getElementById('stStat').textContent = r ? 'Hebrew study covers the Tanakh (Genesis to Malachi).' : 'Type a book and chapter, such as Genesis 15.'; return; }
    closeSheet(); closeSearch(); showHebrew(r.b, r.c || 1, r.vs && r.vs[0]);
  };
  document.getElementById('stRef').onkeydown = function (e) { if (e.key === 'Enter') document.getElementById('stGo').click(); };
  sheetBody.querySelectorAll('[data-w]').forEach(function (el) {
    el.onclick = async function () {
      var s = x[el.dataset.w];
      if (s.ref) { var d = await hebBook(s.ref.b); var ws = d && d[s.ref.c] && d[s.ref.c][s.ref.v]; var i = ws ? ws.findIndex(function (w) { return mainStrong(w[3]) === s.key; }) : -1;
        if (i >= 0) { openWordStudy({ b: s.ref.b, c: s.ref.c, v: s.ref.v, i: i, n: ws.length, w: ws[i] }); return; } }
      openWordStudy(null, s.key);
    };
  });
}
