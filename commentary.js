// Noble Vine Study & Discipleship · 2.0.0 · Commentaries
'use strict';
// ======================================================================
// Commentaries (Free Use Bible API, bible.helloao.org). Shown exactly as written.
// ======================================================================
var COMMS = [
  { id: 'tyndale', label: 'Tyndale', name: 'Tyndale Open Study Notes', desc: 'Modern, balanced overview', lic: 'CC BY-SA 4.0, Tyndale House Publishers' },
  { id: 'keil-delitzsch', label: 'Keil & Delitzsch', name: 'Keil & Delitzsch Old Testament Commentary', desc: 'Hebrew scholarship · Old Testament only', lic: 'public domain', ot: true },
  { id: 'john-gill', label: 'Gill', name: 'John Gill’s Exposition', desc: 'Draws on Jewish and rabbinic sources', lic: 'public domain' },
  { id: 'jamieson-fausset-brown', label: 'JFB', name: 'Jamieson-Fausset-Brown', desc: 'Short and verse by verse', lic: 'public domain' },
  { id: 'matthew-henry', label: 'Matthew Henry', name: 'Matthew Henry’s Commentary', desc: 'Devotional and practical', lic: 'public domain' },
  { id: 'adam-clarke', label: 'Clarke', name: 'Adam Clarke’s Commentary', desc: 'Thorough, with Hebrew notes', lic: 'public domain' },
  { id: 'john-calvin', label: 'Calvin', name: 'John Calvin’s Commentaries', desc: 'Reformation classic · not every book', lic: 'public domain' }
];
var USFM = ['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL','MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'];
var SEFARIA = ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','I_Samuel','II_Samuel','I_Kings','II_Kings','I_Chronicles','II_Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song_of_Songs','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi'];
var BIBLEHUB = ['genesis','exodus','leviticus','numbers','deuteronomy','joshua','judges','ruth','1_samuel','2_samuel','1_kings','2_kings','1_chronicles','2_chronicles','ezra','nehemiah','esther','job','psalms','proverbs','ecclesiastes','songs','isaiah','jeremiah','lamentations','ezekiel','daniel','hosea','joel','amos','obadiah','jonah','micah','nahum','habakkuk','zephaniah','haggai','zechariah','malachi','matthew','mark','luke','john','acts','romans','1_corinthians','2_corinthians','galatians','ephesians','philippians','colossians','1_thessalonians','2_thessalonians','1_timothy','2_timothy','titus','philemon','hebrews','james','1_peter','2_peter','1_john','2_john','3_john','jude','revelation'];
var commDb = null, commCache = {};
function commOpen() {
  if (commDb) return Promise.resolve(commDb);
  return dbTimeout(new Promise(function (res) {
    try { var r = indexedDB.open('nrb-comm', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); }; r.onsuccess = function () { commDb = r.result; res(commDb); }; r.onerror = function () { res(null); }; }
    catch (e) { res(null); }
  }));
}
async function commGet(k) { var db = await commOpen(); if (!db) return null; return new Promise(function (res) { try { var q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; } catch (e) { res(null); } }); }
async function commPut(k, v) { var db = await commOpen(); if (!db) return; return new Promise(function (res) { try { var tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = tx.onabort = res; } catch (e) { res(); } }); }
function commText(x) {
  if (x == null) return '';
  if (typeof x === 'string') return x;
  if (Array.isArray(x)) return x.map(commText).join('\n');
  if (typeof x === 'object') return commText(x.text != null ? x.text : x.content != null ? x.content : '');
  return String(x);
}
function commClean(t) { return t.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, '’').replace(/\n{3,}/g, '\n\n').trim(); }
// One chapter of one commentary: { intro, v: { verse: text } }, or { none: true } when it doesn't cover that chapter
async function commChapter(id, b, c) {
  var k = id + ':' + b + ':' + c;
  if (commCache[k]) return commCache[k];
  var saved = await commGet(k); if (saved) { commCache[k] = saved; return saved; }
  var r = await fetch('https://bible.helloao.org/api/c/' + id + '/' + USFM[b] + '/' + c + '.json');
  if (r.status === 404) { var none = { none: true }; commCache[k] = none; return none; }
  if (!r.ok) throw new Error('download ' + r.status);
  var j = await r.json(), out = { intro: commClean(commText(j.chapter && j.chapter.introduction)), bookIntro: c === 1 ? commClean(commText(j.book && j.book.introduction)) : '', v: {} };
  ((j.chapter && j.chapter.content) || []).forEach(function (it) { if (it && it.type === 'verse' && it.number) out.v[it.number] = commClean(commText(it.content)); });
  commCache[k] = out; commPut(k, out);
  return out;
}
function commOn() { var on = Array.isArray(S.commOn) && S.commOn.length ? S.commOn : ['tyndale', 'keil-delitzsch', 'john-gill']; return COMMS.filter(function (x) { return on.indexOf(x.id) >= 0; }); }
function paras(t) { return t.split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean).map(function (x) { return '<p>' + esc(x).replace(/([\u0590-\u05FF][\u0590-\u05FF\s\u05BE]*[\u0590-\u05FF])/g, '<bdi class="heb">$1</bdi>') + '</p>'; }).join(''); }
function commLinks(b, c, v) {
  var h = '<div class="grp" style="margin-top:1.2rem">More on this verse</div><div class="cmlinks">';
  if (b < NT_START) h += '<a href="https://www.sefaria.org/' + SEFARIA[b] + '.' + c + '.' + v + '?with=Commentary&lang=bi" target="_blank" rel="noopener"><span>Jewish commentators on Sefaria</span><span>Rashi, Ramban, Ibn Ezra and more ↗</span></a>';
  h += '<a href="https://biblehub.com/commentaries/' + BIBLEHUB[b] + '/' + c + '-' + v + '.htm" target="_blank" rel="noopener"><span>All commentaries on Bible Hub</span><span>dozens side by side ↗</span></a>' +
    '<a href="https://ref.ly/' + encodeURIComponent(BOOKS[b][0].replace(/\s+/g, '') + c + '.' + v) + '" target="_blank" rel="noopener"><span>Open in Logos</span><span>if you use Logos ↗</span></a></div>';
  return h;
}
async function openCommentary(b, c, v, pick) {
  var list = commOn().filter(function (x) { return !(x.ot && b >= NT_START); });
  if (!list.length) list = COMMS.filter(function (x) { return x.id === 'tyndale'; });
  var cur = list.filter(function (x) { return x.id === (pick || S.commPick); })[0] || list[0];
  openSheet('Commentary · ' + bn(b) + ' ' + c + ':' + v);
  var head = '<div class="cmnav"><button id="cmPrev"' + (v > 1 ? '' : ' disabled') + '>‹ Verse ' + (v - 1 || '') + '</button><span class="status" style="margin:0">Shown exactly as written</span><button id="cmNext">Verse ' + (v + 1) + ' ›</button></div>' +
    '<div class="ilbar" style="margin-bottom:.8rem">' + list.map(function (x) { return '<button data-cm="' + x.id + '" class="' + (x.id === cur.id ? 'on' : '') + '">' + esc(x.label) + '</button>'; }).join('') + '<button id="cmMore">More ›</button></div>';
  sheetBody.innerHTML = head + '<p class="hint">Loading ' + esc(cur.name) + '…</p>';
  var bindHead = function () {
    sheetBody.querySelectorAll('[data-cm]').forEach(function (el) { el.onclick = function () { S.commPick = el.dataset.cm; saveSettings(); openCommentary(b, c, v, el.dataset.cm); }; });
    document.getElementById('cmMore').onclick = function () { openCommSettings(b, c, v); };
    var pv = document.getElementById('cmPrev'); if (v > 1) pv.onclick = function () { openCommentary(b, c, v - 1, cur.id); };
    document.getElementById('cmNext').onclick = function () { openCommentary(b, c, v + 1, cur.id); };
  };
  bindHead();
  var body = '';
  if (window.claude) body = '<p class="hint">Commentaries download in your installed app. Open the Scriptures app from your home-screen icon to read them. The links below work here too.</p>';
  else {
    try {
      var ch = await commChapter(cur.id, b, c);
      if (ch.none) body = '<p class="hint">' + esc(cur.name) + ' doesn’t cover ' + esc(bn(b)) + (b >= NT_START || cur.id !== 'keil-delitzsch' ? '' : ' ' + c) + '. Try another commentary above.</p>';
      else {
        var t = ch.v[v], from = v;
        if (!t) { var ks = Object.keys(ch.v).map(Number).filter(function (n) { return n < v; }).sort(function (a, z) { return z - a; }); if (ks.length) { from = ks[0]; t = ch.v[from]; } }
        body = '<div class="who" style="font-weight:600">' + esc(cur.name) + '</div><p class="status" style="margin:.1rem 0 .8rem">' + esc(cur.desc) + '</p>';
        if (t) {
          if (from !== v) body += '<p class="status" style="margin:-.4rem 0 .8rem">No separate note on verse ' + v + '. This note, on verse ' + from + ', covers it.</p>';
          var full = paras(t), short = t.length > 1600 ? paras(t.slice(0, 1600).replace(/\s+\S*$/, '') + ' …') : '';
          body += '<div class="cmbody" id="cmText">' + (short || full) + '</div>' + (short ? '<button class="backlink" id="cmFull">Read the full note</button>' : '');
          commCache.__full = full;
        } else body += '<p class="hint">No note on this verse.</p>';
        if (ch.intro || ch.bookIntro) body += '<div class="actions"><button class="quiet" id="cmIntro">' + (ch.bookIntro ? 'Introduction to ' + esc(bn(b)) : 'Chapter introduction') + '</button></div>';
        commCache.__intro = paras((ch.bookIntro ? ch.bookIntro + '\n\n' : '') + (ch.intro || ''));
      }
    } catch (e) {
      body = '<p class="hint" style="color:var(--name)">Couldn’t load ' + esc(cur.name) + ' (' + esc((e && e.message) || 'error') + '). Check your connection: each chapter downloads once, then works offline.</p>';
    }
  }
  if (!document.getElementById('cmMore')) return;
  sheetBody.innerHTML = head + body + commLinks(b, c, v) +
    '<p class="status" style="margin-top:1.2rem">' + esc(cur.name) + ': ' + esc(cur.lic) + ', via the Free Use Bible API (bible.helloao.org).</p>';
  bindHead();
  var fb = document.getElementById('cmFull'); if (fb) fb.onclick = function () { document.getElementById('cmText').innerHTML = commCache.__full; fb.remove(); };
  var ib = document.getElementById('cmIntro'); if (ib) ib.onclick = function () { document.getElementById('cmText') ? (document.getElementById('cmText').innerHTML = commCache.__intro) : null; ib.remove(); var fb2 = document.getElementById('cmFull'); if (fb2) fb2.remove(); };
}
function openCommSettings(b, c, v) {
  openSheet('Commentaries');
  var on = commOn().map(function (x) { return x.id; });
  sheetBody.innerHTML = '<button class="backlink" id="csBack">‹ Back to the commentary</button><p class="hint" style="margin-top:0">Choose which commentaries appear as quick buttons. Each chapter downloads the first time you open it, then works offline.</p>' +
    COMMS.map(function (x) { return '<label class="cmtog"><span>' + esc(x.name) + '<small>' + esc(x.desc) + '</small></span><input type="checkbox" data-ct="' + x.id + '"' + (on.indexOf(x.id) >= 0 ? ' checked' : '') + '></label>'; }).join('') +
    '<p class="status" style="margin-top:1rem">All are public domain except Tyndale Open Study Notes (CC BY-SA 4.0). All via the Free Use Bible API.</p>';
  sheetBody.querySelectorAll('[data-ct]').forEach(function (el) {
    el.onchange = function () {
      var cur = commOn().map(function (x) { return x.id; });
      if (el.checked) { if (cur.indexOf(el.dataset.ct) < 0) cur.push(el.dataset.ct); }
      else { cur = cur.filter(function (x) { return x !== el.dataset.ct; }); if (!cur.length) { el.checked = true; toast('Keep at least one'); return; } }
      S.commOn = COMMS.map(function (x) { return x.id; }).filter(function (x) { return cur.indexOf(x) >= 0; }); saveSettings();
    };
  });
  document.getElementById('csBack').onclick = function () { openCommentary(b, c, v); };
}
