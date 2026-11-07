// Noble Vine Study & Discipleship · 2.8 · Send
// Standalone. Adds a Send button to the verse bar (the bar now slides sideways, most-used buttons first) and a
// Send button on notes written in the app. Send opens a small sheet: choose what to send, see the exact text,
// then send it to Apple Notes as a new note, add it to a note you already have (through one small Shortcut),
// copy it, or save it as a note in this app.
'use strict';
var NVS = { ctx: null };
function nvsGet(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
function nvsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

// ---- styles ----
(function () {
  var st = document.createElement('style');
  st.textContent =
    '.selbar .selscroll{display:flex;gap:.4rem;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;flex:1 1 0;min-width:0;padding:.1rem .1rem .15rem;-webkit-mask-image:linear-gradient(90deg,#000 88%,transparent);mask-image:linear-gradient(90deg,#000 88%,transparent)}' +
    '.selbar .selscroll::-webkit-scrollbar{display:none}' +
    '.selbar .selscroll button{flex:none}' +
    '.selbar #selSend{background:var(--name);color:var(--bg);font-weight:600;order:-3}' +
    '.selbar #selCopy{order:-2}.selbar #selNote{order:-1}' +
    '.selbar .selscroll>*{order:0}' +
    '@media (max-width:560px){.selbar{flex-wrap:wrap}.selbar .lbl{flex:1 0 100%}.selbar .selscroll{flex:1 1 0}}' +
    '.nvs-ref{font-family:var(--serif);font-size:1.05rem;margin:0 0 .6rem}' +
    '.nvs-opt{display:flex;gap:.6rem;align-items:flex-start;width:100%;text-align:left;background:none;border:1px solid var(--rule);border-radius:12px;padding:.6rem .8rem;margin-bottom:.45rem;color:var(--ink)}' +
    '.nvs-opt .rd{flex:none;width:.95rem;height:.95rem;border:2px solid var(--soft);border-radius:50%;margin-top:.2rem}' +
    '.nvs-opt.on{border-color:var(--accent);background:var(--sel)}.nvs-opt.on .rd{border-color:var(--accent);background:radial-gradient(var(--accent) 45%,transparent 50%)}' +
    '.nvs-opt b{display:block;font-weight:500}.nvs-opt small{color:var(--soft);font-size:.82rem}' +
    '#nvsText{width:100%;min-height:8rem;margin:.4rem 0 .8rem;font-family:var(--serif);font-size:1rem;line-height:1.5;padding:.7rem;border-radius:10px;border:1px dashed var(--rule);background:var(--bg);color:var(--ink)}' +
    '.nvs-go{display:flex;flex-direction:column;gap:.5rem}' +
    '.nvs-go button{width:100%;text-align:left;padding:.7rem .9rem;border-radius:12px;border:1px solid var(--rule);background:none;color:var(--ink)}' +
    '.nvs-go button.main{background:var(--name);color:var(--bg);border-color:var(--name);font-weight:600}' +
    '.nvs-go button small{display:block;font-weight:400;opacity:.8;font-size:.82rem}' +
    '.nvs-help{margin-top:.8rem;border:1px solid var(--rule);border-radius:12px;padding:.2rem .9rem}.nvs-help summary{cursor:pointer;padding:.55rem 0}' +
    '.nvs-help ol{padding-left:1.2rem;margin:.2rem 0 .6rem}.nvs-help li{margin-bottom:.35rem}' +
    '.nvs-sc{display:flex;gap:.5rem;align-items:center;margin:.3rem 0 .6rem}.nvs-sc input{flex:1;min-width:0}';
  document.head.appendChild(st);
})();

// ---- the verse bar: slides sideways, Send added ----
(function () {
  var bar = document.getElementById('selbar'); if (!bar || document.getElementById('selSend')) return;
  var scroll = document.createElement('div'); scroll.className = 'selscroll';
  var send = document.createElement('button'); send.type = 'button'; send.id = 'selSend'; send.textContent = 'Send';
  var ids = ['selSend', 'selCopy', 'selNote', 'selFav', 'selMem', 'selCom', 'selRec'];
  scroll.appendChild(send);
  ['selCopy', 'selNote', 'selFav', 'selMem', 'selCom', 'selRec'].forEach(function (id) { var b = document.getElementById(id); if (b) scroll.appendChild(b); });
  bar.insertBefore(scroll, document.getElementById('selClear'));
  send.onclick = function () { nvsFromSelection(); };
})();

// ---- text building ----
function nvsVerseLines(b, c, vs) {
  var doc = chapters[key(b, c)]; if (!doc) return '';
  return doc.verses.filter(function (x) { return vs.indexOf(x.v) >= 0; }).map(function (x) { return (vs.length > 1 ? x.v + ' ' : '') + nameText(x.t); }).join(' ');
}
function nvsRef(b, c, vs) { return refLabel(b, c, vs) + ' (' + (typeof bibleShort === 'function' ? bibleShort() : 'RNB') + ')'; }
function nvsFromSelection() {
  var vs = Array.from(selected).sort(function (a, z) { return a - z; }); if (!vs.length) return;
  var b = pos.b, c = pos.c, v1 = vs[0], v2 = vs[vs.length - 1];
  var n = typeof vnotes !== 'undefined' ? vnotes[vnoteId(b, c, v1, v2)] : null;
  nvsOpen({ kind: 'verse', b: b, c: c, vs: vs, noteText: n && n.text ? n.text : '' });
}
function nvsBuild(s, fmt) {
  var ref = nvsRef(s.b, s.c, s.vs), q = nvsVerseLines(s.b, s.c, s.vs), t;
  if (s.kind === 'verse') {
    if (fmt === 'ref') t = ref + '\n\n';
    else if (fmt === 'note') t = ref + '\n“' + q + '”\n\n' + s.noteText;
    else t = ref + '\n“' + q + '”';
  } else {
    if (fmt === 'only') t = s.noteText;
    else t = ref + '\n“' + q + '”\n\n' + s.noteText;
  }
  return t;
}

// ---- the Send sheet ----
function nvsOpen(s) {
  var opts = s.kind === 'verse'
    ? [['verse', 'Verse and reference', 'The words, then ' + refLabel(s.b, s.c, s.vs)], ['ref', 'Reference only', 'Just the reference, to write your own thoughts'], s.noteText ? ['note', 'Verse, reference and my note', 'Adds the note you wrote on this verse'] : null]
    : [['verse', 'Note and its verses', 'Your words, with the verses written out above them'], ['only', 'Note only', 'Just what you wrote']];
  opts = opts.filter(Boolean);
  var fmt = nvsGet('nvs-fmt-' + s.kind, opts[0][0]); if (!opts.some(function (o) { return o[0] === fmt; })) fmt = opts[0][0];
  var scName = nvsGet('nvs-shortcut', 'Add to Note');
  openSheet(s.kind === 'verse' ? 'Send this verse' : 'Send this note');
  function render(keepText) {
    var cur = keepText ? document.getElementById('nvsText').value : null;
    sheetBody.innerHTML = '<p class="nvs-ref">' + esc(refLabel(s.b, s.c, s.vs)) + '</p>' +
      opts.map(function (o) { return '<button type="button" class="nvs-opt' + (o[0] === fmt ? ' on' : '') + '" data-f="' + o[0] + '"><span class="rd"></span><span><b>' + esc(o[1]) + '</b><small>' + esc(o[2]) + '</small></span></button>'; }).join('') +
      '<textarea id="nvsText" aria-label="The text that will be sent"></textarea>' +
      '<div class="nvs-go">' +
      '<button type="button" class="main" id="nvsNew">Send to Notes as a new note<small>Opens Apple’s share sheet. Pick Notes and your folder.</small></button>' +
      '<button type="button" id="nvsAdd">Add to a note I already have<small>Uses your “' + esc(scName) + '” Shortcut (set up once, see below).</small></button>' +
      (s.kind === 'verse' ? '<button type="button" id="nvsApp">Save as a note in this app<small>Opens the note editor for this verse.</small></button>' : '') +
      '<button type="button" id="nvsCopy">Copy</button></div>' +
      '<details class="nvs-help"><summary>Set up “Add to a note I already have” (once)</summary>' +
      '<p class="hint" style="margin-top:0">Apple does not let apps write into Notes, so a small Shortcut does the adding. Make it once on each device (iPhone and iPad).</p>' +
      '<ol><li>Open the <b>Shortcuts</b> app, tap <b>+</b>, and name the shortcut exactly as below.</li>' +
      '<li>Add <b>Find Notes</b>. Tap <b>Add Filter</b>, choose <b>Folder</b>, leave it on <b>is</b>, then tap the blue word after it and pick your folder (for example BIBLE TEACHING). Folders are chosen here, not in a later action.</li>' +
      '<li>Tap <b>Add Sort</b>: <b>Last Modified</b>, <b>Latest First</b>, and set the limit to about 30.</li>' +
      '<li>Add <b>Choose from List</b> and set its prompt to “Add to which note?”.</li>' +
      '<li>Add <b>Text</b>. Press return once for a blank line, then tap after it and insert the <b>Shortcut Input</b> variable.</li>' +
      '<li>Add <b>Append to Note</b>. Set the first blue word to that <b>Text</b> and the second to <b>Chosen Item</b>. Do not pick a fixed note.</li>' +
      '<li>Tap <b>Done</b>. The first time, allow it to access Notes.</li></ol>' +
      '<div class="nvs-sc"><label for="nvsSc" class="hint" style="margin:0">Shortcut name</label><input type="text" id="nvsSc" value="' + esc(scName) + '"></div></details>';
    var ta = document.getElementById('nvsText'); ta.value = cur !== null ? cur : nvsBuild(s, fmt);
    sheetBody.querySelectorAll('.nvs-opt').forEach(function (el) { el.onclick = function () { fmt = el.dataset.f; nvsSet('nvs-fmt-' + s.kind, fmt); render(false); }; });
    document.getElementById('nvsSc').onchange = function () { scName = this.value.trim() || 'Add to Note'; nvsSet('nvs-shortcut', scName); };
    document.getElementById('nvsCopy').onclick = function () { copyText(ta.value); };
    document.getElementById('nvsNew').onclick = function () {
      var txt = ta.value;
      if (navigator.share) { navigator.share({ text: txt }).catch(function (e) { if (e && e.name === 'AbortError') return; copyText(txt); toast('Sharing isn’t available here, so it was copied'); }); }
      else { copyText(txt); toast('Sharing isn’t available here, so it was copied'); }
    };
    document.getElementById('nvsAdd').onclick = function () {
      var txt = ta.value; scName = document.getElementById('nvsSc').value.trim() || 'Add to Note'; nvsSet('nvs-shortcut', scName);
      try { if (navigator.clipboard) navigator.clipboard.writeText(txt); } catch (e) {}
      toast('Opening Shortcuts…');
      window.location.href = 'shortcuts://run-shortcut?name=' + encodeURIComponent(scName) + '&input=text&text=' + encodeURIComponent(txt);
    };
    var app = document.getElementById('nvsApp');
    if (app) app.onclick = function () { closeSheet(); var n = document.getElementById('selNote'); if (n) n.onclick(); };
  }
  render(false);
}

// ---- Send on notes written in the app ----
var nvsOrigNoteEditor = typeof openNoteEditor === 'function' ? openNoteEditor : null;
if (nvsOrigNoteEditor) {
  window.openNoteEditor = function (b, c, v1, v2, from) {
    var r = nvsOrigNoteEditor.apply(this, arguments);
    try {
      var ta = document.getElementById('neText'); if (!ta || document.getElementById('nvsNoteSend')) return r;
      var box = sheetBody.querySelector('.actions'); if (!box) { box = document.createElement('div'); box.className = 'actions'; sheetBody.appendChild(box); }
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'primary'; btn.id = 'nvsNoteSend'; btn.textContent = 'Send';
      box.insertBefore(btn, box.firstChild);
      btn.onclick = function () {
        var txt = ta.value.trim(); if (!txt) { toast('Write your note first'); return; }
        var vs = []; for (var v = v1; v <= v2; v++) vs.push(v);
        var keep = ta.value;
        nvsOpen({ kind: 'note', b: b, c: c, vs: vs, noteText: keep });
      };
    } catch (e) {}
    return r;
  };
}
