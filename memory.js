// Noble Vine Study & Discipleship · 2.0.0 · Memory verses
'use strict';
// ======================================================================
// Memory verses: listen, fade, first letters, type (or pick, in Hebrew), recite; spaced reviews
// ======================================================================
var MEM_MODES = [['esv', 'RNB'], ['web', 'WEB'], ['snd', 'Hebrew sounds'], ['heb', 'Hebrew'], ['kjv', 'KJV']];
var MEM_STEPS = ['Listen', 'Fade', 'Letters', 'Type', 'Recite'];
var MEM_GAPS = [1, 3, 7, 14, 30, 60, 120];
function memAll() { return lsGet('nb-mem', {}) || {}; }
function memSave(m) { lsSet('nb-mem', m); }
function memRef(it) { return refLabel(it.b, it.c, it.vs); }
function memDaysTo(it) { return Math.round((parseYmd(it.due) - parseYmd(todayYmd())) / 86400000); }
function memDueLabel(it) { var d = memDaysTo(it); return it.known && d > 0 ? 'Known ✓' : d <= 0 ? 'Due today' : d === 1 ? 'Review tomorrow' : 'Review in ' + d + ' days'; }
function plainHeb(h) { return h.replace(/[\u0591-\u05AF\u05BD\u05C0\u05C3\u05C6]/g, '').replace(/\s+/g, ' ').trim(); }
// Words of a passage in the chosen way of learning: [{ w: shown word, s: sound (Hebrew only) }]
async function memWords(it) {
  var out = [];
  if (it.mode === 'esv' || it.mode === 'kjv' || it.mode === 'web') {
    for (var i = 0; i < it.vs.length; i++) {
      var t = it.mode === 'esv' ? (chapters[key(it.b, it.c)] || { verses: [] }).verses.filter(function (x) { return x.v === it.vs[i]; }).map(function (x) { return x.t; })[0]
        : ((await verChapter(it.mode, it.b, it.c)) || {})[it.vs[i]];
      if (!t) return null;
      if (it.mode !== 'esv') t = restore(t);   // memorising uses your Names; the KJV itself stays unchanged elsewhere
      t.split(/\s+/).filter(Boolean).forEach(function (w) { out.push({ w: w, name: /יהוה|יהושע/.test(w) }); });
    }
    return out;
  }
  var d = await hebBook(it.b); if (!d || !d[it.c]) return null;
  for (var j = 0; j < it.vs.length; j++) {
    var ws = d[it.c][it.vs[j]]; if (!ws) return null;
    ws.forEach(function (w) {
      var h = plainHeb(w[0]); if (!h.replace(/[־׀]/g, '')) return;
      var sk = h.replace(/[^\u05D0-\u05EA]/g, ''), at = sk.indexOf('יהוה');
      if (at >= 0) {   // the Name: plain יהוה, said and spelled your way
        var pre = sk.slice(0, at), snd = pre.split('').map(function (ch) { return ({ 'ו': 've·', 'ל': 'la·', 'ב': 'ba·', 'כ': 'ka·', 'מ': 'me·', 'ה': 'ha·', 'ש': 'she·' })[ch] || ''; }).join('') + memName();
        out.push(it.mode === 'heb' ? { w: pre + 'יהוה', s: snd, name: true, say: memName() } : { w: snd, h: pre + 'יהוה', name: true, say: memName() });
        return;
      }
      out.push(it.mode === 'heb' ? { w: h, s: w[1] } : { w: w[1], h: h });
    });
  }
  return out;
}
function firstLetter(w) { var m = w.match(/[\p{L}\p{N}]/u); return m ? m[0] : ''; }
function isHebrewWord(w) { return /[\u05D0-\u05EA]/.test(w); }
function memName() { return (S.memName || 'Yahowah').trim() || 'Yahowah'; }
function memMessiah() { return (S.memMessiah || 'Yeshua').trim() || 'Yeshua'; }
var MEM_RATES = { slow: { he: 0.42, en: 0.72 }, steady: { he: 0.58, en: 0.85 }, normal: { he: 0.78, en: 0.95 } };
var memSpeaking = null;
// Voices: your chosen voice first, otherwise the most natural one installed (Premium, then Enhanced)
var NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Ralph|Kathy|Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley)\b/i;
function voiceQuality(v) { var id = (v.voiceURI || '') + ' ' + (v.name || ''); return /premium/i.test(id) ? 2 : /enhanced|neural|natural/i.test(id) ? 1 : 0; }
function voicesFor(lang) {
  var vs = (window.speechSynthesis ? speechSynthesis.getVoices() : []).filter(function (v) { return v.lang && v.lang.toLowerCase().replace('_', '-').indexOf(lang) === 0 && !NOVELTY.test(v.name || ''); });
  return vs.sort(function (a, z) {
    var q = voiceQuality(z) - voiceQuality(a); if (q) return q;
    var g = (/GB|UK/i.test(z.lang) ? 1 : 0) - (/GB|UK/i.test(a.lang) ? 1 : 0); if (g && lang === 'en') return g;
    return (a.name || '').localeCompare(z.name || '');
  });
}
function voiceLabel(v) { var q = voiceQuality(v); return (v.name || 'Voice').replace(/\s*\((Enhanced|Premium)\)/i, '') + ' · ' + v.lang + (q === 2 ? ' · Premium' : q === 1 ? ' · Enhanced' : ''); }
function memVoice(lang) {
  var vs = voicesFor(lang), want = lang === 'en' ? S.voiceEn : S.voiceHe;
  if (want) { var hit = vs.filter(function (v) { return (v.voiceURI || v.name) === want; })[0]; if (hit) return hit; }
  return vs[0] || null;
}
function memSegments(it, words) {
  var heb = it.mode === 'heb' || it.mode === 'snd';
  return words.map(function (x, i) {
    if (!heb) return { t: x.w.replace(/יהוה/g, memName()).replace(/יהושע/g, memMessiah()), lang: 'en', i: i };
    if (x.name) return { t: x.say || memName(), lang: 'en', i: i };
    return { t: it.mode === 'heb' ? x.w : x.h, lang: 'he', i: i };
  });
}
function orbLive(on) { document.querySelectorAll('.orb').forEach(function (o) { o.classList.toggle('live', !!on); }); }
function stopMem() { if (recAudio) stopOwn(); memSpeaking = null; orbLive(false); try { speechSynthesis.cancel(); } catch (e) {} document.querySelectorAll('.memtext .speaking').forEach(function (x) { x.classList.remove('speaking'); }); }
function speakMem(it, words, done, rk) {
  try {
    if (!window.speechSynthesis) { toast('Reading aloud isn’t available on this device'); return; }
    stopMem();
    var segs = memSegments(it, words), rate = MEM_RATES[rk || S.memRate || 'slow'] || MEM_RATES.slow, wbw = rk ? false : !!S.memWbw;
    if (segs.some(function (x) { return x.lang === 'he'; }) && speechSynthesis.getVoices().length && !memVoice('he')) toast('No Hebrew voice on this device. Add one in Settings → Accessibility → Spoken Content → Voices.');
    var token = {}; memSpeaking = token; orbLive(true);
    var userDone = done; done = function () { orbLive(false); if (userDone) userDone(); };
    var mark = function (i) { document.querySelectorAll('.memtext .speaking').forEach(function (x) { x.classList.remove('speaking'); }); var el = document.querySelector('.memtext [data-wi="' + i + '"]'); if (el) el.classList.add('speaking'); };
    var say = function (text, lang, onend) {
      var u = new SpeechSynthesisUtterance(text); u.lang = lang === 'he' ? 'he-IL' : 'en-GB'; u.rate = rate[lang];
      var v = memVoice(lang); if (v) u.voice = v;
      u.onend = u.onerror = function () { if (memSpeaking === token && onend) onend(); };
      speechSynthesis.speak(u);
    };
    if (wbw) {
      var k = 0, gap = S.memRate === 'normal' ? 250 : S.memRate === 'steady' ? 450 : 700;
      var next = function () { if (memSpeaking !== token) return; if (k >= segs.length) { mark(-1); memSpeaking = null; if (done) done(); return; } var sg = segs[k++]; mark(sg.i); say(sg.t, sg.lang, function () { setTimeout(next, gap); }); };
      next();
    } else {
      var runs = []; segs.forEach(function (sg) { var last = runs[runs.length - 1]; if (last && last.lang === sg.lang) last.t += ' ' + sg.t; else runs.push({ t: sg.t, lang: sg.lang }); });
      var r = 0, go = function () { if (memSpeaking !== token) return; if (r >= runs.length) { memSpeaking = null; if (done) done(); return; } var x = runs[r++]; say(x.t, x.lang, go); };
      go();
    }
  } catch (e) { toast('Couldn’t read aloud here'); }
}
function memPreviewHtml(it, words) {
  if (!words) return '<p class="hint">' + (it.mode === 'web' || it.mode === 'kjv' ? 'Download the World English Bible first (Study → Compare versions).' : it.mode === 'esv' ? 'Import this chapter first.' : 'Download the Hebrew for this book first: open the chapter and tap א Hebrew.') + '</p>';
  if (it.mode === 'heb') return '<div class="memtext he">' + words.map(function (x) { return esc(x.w); }).join(' ') + '</div>';
  return '<div class="memtext">' + (it.mode === 'esv' ? fmtVerse(words.map(function (x) { return x.w; }).join(' ')) : esc(words.map(function (x) { return x.w; }).join(' '))) + '</div>';
}
function memCardHtml() {
  var all = memAll(), ids = Object.keys(all); if (!ids.length) return '';
  ids.sort(function (a, z) { return all[a].due < all[z].due ? -1 : all[a].due > all[z].due ? 1 : 0; });
  var it = all[ids[0]], due = ids.filter(function (k) { return memDaysTo(all[k]) <= 0; }).length, stg = Math.min(it.stage || 0, 4);
  var steps = MEM_STEPS.map(function (x, i) { return '<i class="' + (i < stg ? 'dn' : '') + '"></i>'; }).join('');
  return '<div class="card"><div class="tc-l"><span>Memory verse · ' + esc(memDueLabel(it)) + (due > 1 ? ' · ' + (due - 1) + ' more due' : '') + '</span><button id="tdMemAll">All</button></div>' +
    '<h3>' + esc(memRef(it)) + '</h3><p class="hint" style="margin:0">' + esc(MEM_MODES.filter(function (m) { return m[0] === it.mode; })[0][1]) + ' · with your Names</p>' +
    '<div class="memsteps">' + steps + '</div><div class="memsl">' + MEM_STEPS.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>' +
    '<div class="actions"><button class="primary" id="tdMemGo" data-id="' + esc(it.id) + '">Practise</button></div></div>';
}
function bindMemCard() {
  var g = document.getElementById('tdMemGo'); if (g) g.onclick = function () { practiseMem(g.dataset.id); };
  var a = document.getElementById('tdMemAll'); if (a) a.onclick = openMemList;
}
async function openMemAdd(b, c, vs) {
  vs = vs.slice().sort(function (a, z) { return a - z; });
  openSheet('Memorise ' + refLabel(b, c, vs)); var tok = sheetSeq;
  if (tok !== sheetSeq) return; sheetBody.innerHTML = '<p class="hint">Getting the passage ready…</p>';
  var hebOk = b < NT_START && !!(await hebBook(b)), kjvOk = !!(await verBook('web', b)), mode = 'esv';
  async function render() {
    var it = { b: b, c: c, vs: vs, mode: mode }, words = await memWords(it);
    var chips = MEM_MODES.filter(function (m) { return m[0] !== 'kjv'; }).map(function (m) {
      var ok = m[0] === 'esv' || (m[0] === 'web' ? kjvOk : hebOk);
      return '<button data-val="' + m[0] + '" class="' + (m[0] === mode ? 'on' : '') + '"' + (ok ? '' : ' disabled') + '>' + m[1] + '</button>';
    }).join('');
    if (tok !== sheetSeq) return; sheetBody.innerHTML = '<p class="hint" style="margin-top:0">How would you like to learn it? Memory verses always use your Names: the Name said and spelled ' + esc(memName()) + ', the Messiah ' + esc(memMessiah()) + '.</p><div class="seg" id="mmMode">' + chips + '</div>' +
      (window.claude ? '<p class="status">WEB and the Hebrew options work in your installed app, from the home-screen icon.</p>' : b >= NT_START ? '<p class="status">Hebrew is for the Tanakh.</p>' : !hebOk ? '<p class="status">For Hebrew, first open this chapter and tap א Hebrew to download it.</p>' : '') +
      (it.mode === 'snd' && words ? '<div class="memtext">' + esc(words.map(function (x) { return x.w; }).join(' ')) + '</div>' : memPreviewHtml(it, words)) +
      '<div class="actions"><button class="primary" id="mmGo"' + (words ? '' : ' disabled') + '>Start memorising</button></div>';
    sheetBody.querySelectorAll('#mmMode button').forEach(function (el) { el.onclick = function () { mode = el.dataset.val; render(); }; });
    document.getElementById('mmGo').onclick = function () {
      var all = memAll(), id = 'm' + Date.now();
      all[id] = { id: id, b: b, c: c, vs: vs, mode: mode, stage: 0, due: todayYmd(), added: Date.now(), updated: Date.now() };
      memSave(all); selected.clear(); updateSelbar(); main.querySelectorAll('.v.sel').forEach(function (x) { x.classList.remove('sel'); });
      toast('Added to your memory verses'); practiseMem(id);
    };
  }
  render();
}
async function openMemList() {
  openSheet('Memory verses');
  var all = memAll(), ids = Object.keys(all).sort(function (a, z) { return all[a].due < all[z].due ? -1 : 1; });
  var h = '<p class="hint" style="margin-top:0">To add a passage, select its verses while reading and tap <b>Memorise</b>, or type it here.</p>' +
    '<label class="field"><span>Add a passage</span><input type="text" id="mlRef" placeholder="Deuteronomy 6:4-5"></label>' +
    '<div class="actions" style="margin-top:-.4rem"><button class="primary" id="mlAdd">Choose how to learn it</button></div><p class="status" id="mlStat"></p>';
  h += '<div class="grp" style="margin-top:1rem">My memory verses</div>';
  if (!ids.length) h += '<p class="hint">None yet.</p>';
  ids.forEach(function (k) {
    var it = all[k];
    h += '<div class="wrow" style="align-items:center"><button class="backlink" data-go="' + esc(k) + '" style="margin:0;text-align:left;color:var(--ink)">' + esc(memRef(it)) + ' <span class="status" style="margin:0">· ' + esc(MEM_MODES.filter(function (m) { return m[0] === it.mode; })[0][1]) + '</span></button>' +
      '<span style="display:flex;gap:.6rem;align-items:center"><span class="status" style="margin:0;color:' + (memDaysTo(it) <= 0 ? 'var(--name)' : 'var(--soft)') + '">' + esc(memDueLabel(it)) + '</span><button class="backlink" data-del="' + esc(k) + '" style="margin:0" aria-label="Remove">✕</button></span></div>';
  });
  sheetBody.innerHTML = h;
  document.getElementById('mlAdd').onclick = function () {
    var r = parseRef(document.getElementById('mlRef').value || '');
    if (!r || !r.c || !r.vs.length) { document.getElementById('mlStat').textContent = 'Type a book, chapter and verses, such as Psalm 119:11 or Deut 6:4-5.'; return; }
    openMemAdd(r.b, r.c, r.vs);
  };
  sheetBody.querySelectorAll('[data-go]').forEach(function (el) { el.onclick = function () { practiseMem(el.dataset.go); }; });
  sheetBody.querySelectorAll('[data-del]').forEach(function (el) {
    el.onclick = function () {
      if (el.dataset.armed !== '1') { el.dataset.armed = '1'; el.textContent = 'Remove?'; return; }
      var a = memAll(); delete a[el.dataset.del]; memSave(a); openMemList();
    };
  });
}
async function practiseMem(id) {
  var all = memAll(), it = all[id]; if (!it) return openMemList();
  openSheet(memRef(it)); var tok = sheetSeq;
  if (tok !== sheetSeq) return; sheetBody.innerHTML = '<p class="hint">Getting the passage ready…</p>';
  var words = await memWords(it);
  if (!words) { if (tok !== sheetSeq) return; sheetBody.innerHTML = memPreviewHtml(it, null) + '<div class="actions"><button class="quiet" id="mpBack">‹ Memory verses</button></div>'; document.getElementById('mpBack').onclick = openMemList; return; }
  var step = Math.min(it.stage || 0, 4), heb = it.mode === 'heb', showSnd = S.memSnd !== false;
  var hidden = new Set(), pos2 = 0, errors = 0, wrongTiles = new Set();
  var lettered = words.map(function (x, i) { return firstLetter(x.w) ? i : -1; }).filter(function (i) { return i >= 0; });
  function stepsBar() {
    return '<div class="memsteps">' + MEM_STEPS.map(function (x, i) { return '<i class="' + (i <= step ? 'dn' : '') + '"></i>'; }).join('') + '</div><div class="memsl">' +
      MEM_STEPS.map(function (x, i) { return '<span style="' + (i === step ? 'color:var(--ink);font-weight:600' : '') + '">' + (i === 3 && heb ? 'Pick' : x) + '</span>'; }).join('') + '</div>';
  }
  function wordHtml(x, cls) {
    if (heb) return '<span class="memhw ' + (cls || '') + '"><span class="memw ' + (cls || '') + '">' + esc(x.w) + '</span>' + (showSnd && cls !== 'gap' ? '<span class="s">' + esc(x.s) + '</span>' : '') + '</span>';
    return '<span class="memw ' + (cls || '') + '">' + (it.mode === 'esv' && cls !== 'gap' ? fmtVerse(x.w) : esc(x.w)) + '</span>';
  }
  function body(inner, buttons) {
    if (tok !== sheetSeq) return; sheetBody.innerHTML = stepsBar() + inner + '<div class="actions">' + buttons + '</div>' +
      '<div class="actions" style="margin-top:.4rem">' + (step > 0 ? '<button class="quiet" id="mpEasier">‹ Easier step</button>' : '') + '<button class="quiet" id="mpList">All memory verses</button></div>';
    var e = document.getElementById('mpEasier'); if (e) e.onclick = function () { step--; reset(); render(); };
    document.getElementById('mpList').onclick = openMemList;
    var l = document.getElementById('mpListen'); if (l) l.onclick = function () { listenPassage(it.mode === 'heb' || it.mode === 'snd' ? 'he' : 'en', it.b, it.c, it.vs, it, words); };
    var mr = document.getElementById('mpRec'); if (mr) mr.onclick = function () { stopMem(); var heb2 = it.mode === 'heb' || it.mode === 'snd'; openRecorder({ lang: heb2 ? 'he' : 'en', b: it.b, c: it.c, vs: it.vs, text: heb2 ? words.map(function (x) { return esc(it.mode === 'heb' ? x.w : x.h); }).join(' ') : versesHtml(it.b, it.c, it.vs), back: function () { practiseMem(id); } }); };
    var nx = document.getElementById('mpNext'); if (nx) nx.onclick = function () { stopMem(); step++; reset(); render(); };
    var sd = document.getElementById('mpSnd'); if (sd) sd.onclick = function () { S.memSnd = !showSnd; showSnd = S.memSnd; saveSettings(); render(); };
  }
  function reset() { hidden.clear(); pos2 = 0; errors = 0; wrongTiles.clear(); }
  var sndBtn = heb ? '<button class="quiet" id="mpSnd">' + (showSnd ? 'Hide sounds' : 'Show sounds') + '</button>' : '';
  var cls = 'memtext' + (heb ? ' he' : '');
  function render() {
    if (step === 0) {
      var rt = S.memRate || 'slow';
      body('<p class="hint">Read it aloud, or listen, two or three times. Your Names are used throughout.</p><div class="' + cls + '">' + words.map(function (x, i) { return '<span data-wi="' + i + '">' + wordHtml(x) + '</span>'; }).join(' ') + '</div>' +
        '<div class="ilbar" style="margin:.2rem 0 .4rem"><span class="status" style="margin:0">Speed</span>' + [['slow', 'Slow'], ['steady', 'Steady'], ['normal', 'Normal']].map(function (o) { return '<button data-rate="' + o[0] + '" class="' + (rt === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') +
        '<button id="mpWbw" class="' + (S.memWbw ? 'on' : '') + '">Word by word</button></div>',
        '<button class="quiet orbbtn" id="mpListen"><span class="orb sm"></span>Listen</button><button class="quiet" id="mpStop">■ Stop</button><button class="quiet" id="mpRec">🎙 Record mine</button><button class="primary" id="mpNext">Next: fade the words</button>' + sndBtn);
      sheetBody.querySelectorAll('[data-rate]').forEach(function (el) { el.onclick = function () { stopMem(); S.memRate = el.dataset.rate; saveSettings(); render(); }; });
      document.getElementById('mpWbw').onclick = function () { stopMem(); S.memWbw = !S.memWbw; saveSettings(); render(); };
      document.getElementById('mpStop').onclick = stopMem;
    } else if (step === 1) {
      var allGone = hidden.size >= lettered.length;
      body('<p class="hint">Say the whole passage, filling the gaps. Tap a gap to peek.</p><div class="' + cls + '">' + words.map(function (x, i) { return '<span data-i="' + i + '">' + wordHtml(x, hidden.has(i) ? 'gap' : '') + '</span>'; }).join(' ') + '</div>',
        (allGone ? '<button class="primary" id="mpNext">Next: first letters</button>' : '<button class="primary" id="mpMore">Hide more words</button><button class="quiet" id="mpNext">Skip ahead</button>') + sndBtn);
      var mo = document.getElementById('mpMore');
      if (mo) mo.onclick = function () {
        var left = lettered.filter(function (i) { return !hidden.has(i); }), n = Math.max(1, Math.ceil(lettered.length / 4));
        for (var k = 0; k < n && left.length; k++) { var r = Math.floor(Math.random() * left.length); hidden.add(left[r]); left.splice(r, 1); }
        render();
      };
      sheetBody.querySelectorAll('[data-i]').forEach(function (el) { el.onclick = function () { var w = el.querySelector('.gap'); if (w) { w.classList.add('peek'); w.style.color = 'var(--soft)'; setTimeout(function () { w.classList.remove('peek'); w.style.color = ''; }, 1500); } }; });
      sheetBody.querySelectorAll('.memw.gap').forEach(function (g) { g.style.color = 'transparent'; });
    } else if (step === 2) {
      var letters = words.map(function (x) {
        var f = firstLetter(x.w), tail = x.w.replace(/^.*[\p{L}\p{N}]/u, '');
        return heb ? '<span class="memhw"><span class="memw">' + esc(f || x.w) + '</span></span>' : '<span class="memw">' + esc((f || '') + (f ? tail : x.w)) + '</span>';
      }).join(' ');
      body('<p class="hint">Say each word from its first letter. Tap the text to check yourself.</p><div class="' + cls + '" id="mpLet" style="cursor:pointer">' + letters + '</div>',
        '<button class="primary" id="mpNext">Next: ' + (heb ? 'pick the words' : 'type it') + '</button>');
      var showing = false;
      document.getElementById('mpLet').onclick = function () { showing = !showing; this.innerHTML = showing ? words.map(function (x) { return wordHtml(x); }).join(' ') : letters; };
    } else if (step === 3 && heb) {
      var done = pos2 >= words.length;
      var shown = words.map(function (x, i) { return i < pos2 ? wordHtml(x, 'ok') : ''; }).join(' ') + (done ? '' : '<span class="memslot"></span>');
      var tiles = '';
      if (!done) {
        var right = words[pos2].w, pool = words.map(function (x) { return x.w; }).filter(function (w, i, a) { return w !== right && a.indexOf(w) === i; });
        var opts = [right]; while (opts.length < 3 && pool.length) opts.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        opts.sort(function () { return Math.random() - .5; });
        tiles = '<div class="memtiles">' + opts.map(function (o) { return '<button data-t="' + esc(o) + '"' + (wrongTiles.has(o) ? ' class="wrong"' : '') + '>' + esc(o) + '</button>'; }).join('') + '</div><p class="status" style="text-align:center">' + pos2 + ' of ' + words.length + ' · tap the word that comes next</p>';
      }
      body('<div class="' + cls + '">' + shown + '</div>' + tiles + (done ? '<p class="hint">Done: ' + (words.length - errors) + ' of ' + words.length + ' right first time.</p>' : ''),
        (done ? '<button class="primary" id="mpNext">Next: recite</button>' : '') + sndBtn);
      sheetBody.querySelectorAll('[data-t]').forEach(function (el) {
        el.onclick = function () {
          if (el.dataset.t === words[pos2].w) { pos2++; wrongTiles.clear(); render(); }
          else { if (!wrongTiles.has(el.dataset.t)) errors++; wrongTiles.add(el.dataset.t); el.classList.add('wrong'); }
        };
      });
    } else if (step === 3) {
      var fin = pos2 >= words.length;
      var html = words.map(function (x, i) { return wordHtml(x, i < pos2 ? (x.miss ? 'bad' : 'ok') : 'todo'); }).map(function (h, i) { return i < pos2 ? h : '<span class="memw todo">' + '_'.repeat(Math.min(6, Math.max(2, words[i].w.length))) + '</span>'; }).join(' ');
      body('<p class="hint">' + (fin ? 'Done: ' + (words.length - errors) + ' of ' + words.length + ' right.' : 'Type the first letter of each word. Tap here if the keyboard isn’t showing.') + '</p><div class="' + cls + '" id="mpType">' + html + '</div><p class="status" id="mpMsg"></p><input class="memtype" id="mpKey" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">',
        fin ? '<button class="primary" id="mpNext">Next: recite</button>' : '');
      var inp = document.getElementById('mpKey');
      var advanceAuto = function () { while (pos2 < words.length && (!firstLetter(words[pos2].w) || isHebrewWord(words[pos2].w))) pos2++; };
      advanceAuto();
      if (!fin) {
        document.getElementById('mpType').onclick = function () { inp.focus(); };
        setTimeout(function () { try { inp.focus(); } catch (e) {} }, 60);
        inp.oninput = function () {
          var ch = inp.value.slice(-1).toLowerCase(); inp.value = ''; if (!ch || pos2 >= words.length) return;
          var want = firstLetter(words[pos2].w).toLowerCase();
          if (ch === want) { pos2++; advanceAuto(); render(); }
          else { errors++; words[pos2].miss = true; var m = document.getElementById('mpMsg'); if (m) m.textContent = '“' + words[pos2].w.replace(/[^\p{L}\p{N}’']/gu, '') + '”. Keep going.'; pos2++; advanceAuto(); setTimeout(render, 700); }
        };
      }
      if (fin) words.forEach(function (x) { delete x.miss; });
    } else {
      body('<p class="hint">Say the whole passage from memory, then check.</p><div class="' + cls + '" id="mpRec" style="min-height:5rem;color:var(--soft)">' + esc(memRef(it)) + '</div>',
        '<button class="primary" id="mpShow">Show the passage</button>');
      document.getElementById('mpShow').onclick = function () {
        document.getElementById('mpRec').style.color = ''; document.getElementById('mpRec').innerHTML = words.map(function (x) { return wordHtml(x); }).join(' ');
        this.parentNode.innerHTML = '<button class="primary" data-r="2">I got it</button><button class="quiet" data-r="1">Nearly</button><button class="quiet" data-r="0">Not yet</button>';
        sheetBody.querySelectorAll('[data-r]').forEach(function (el) { el.onclick = function () { finish(+el.dataset.r); }; });
      };
    }
  }
  function finish(r) {
    var a = memAll(), x = a[id]; if (!x) return;
    var st = x.stage || 0;
    if (r === 2) { st++; x.due = addDays(todayYmd(), MEM_GAPS[Math.min(st - 1, MEM_GAPS.length - 1)]); }
    else if (r === 1) x.due = addDays(todayYmd(), 1);
    else { st = Math.max(0, st - 1); x.due = addDays(todayYmd(), 1); }
    x.stage = st; x.known = st >= 5; x.updated = Date.now(); x.last = todayYmd(); a[id] = x; memSave(a);
    var d = memDaysTo(x);
    if (tok !== sheetSeq) return; sheetBody.innerHTML = stepsBar() + '<div class="card" style="margin-top:1rem"><h3>' + (r === 2 ? 'Well done.' : r === 1 ? 'Nearly there.' : 'It’ll come.') + '</h3><p class="hint">' +
      (x.known ? 'You know this one. Light refresher reviews will keep it fresh.' : 'Next review ' + (d <= 1 ? 'tomorrow' : 'in ' + d + ' days') + (r === 2 && st < 5 ? ', starting one step further on.' : '.')) + '</p>' +
      '<div class="actions"><button class="primary" id="mfToday">Today</button><button class="quiet" id="mfList">All memory verses</button></div></div>';
    document.getElementById('mfToday').onclick = openToday; document.getElementById('mfList').onclick = openMemList;
  }
  render();
}
