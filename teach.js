// Noble Vine Study & Discipleship · 2.0.0 · Teaching notes
'use strict';
// ======================================================================
// Teaching notes: your own titled notes, with headings, lists, tables and verse links
// ======================================================================
function teachAll() { return lsGet('nb-teach', {}) || {}; }
function teachSave(t) { lsSet('nb-teach', t); }
function teachText(html) { var d = document.createElement('div'); d.innerHTML = html || ''; return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
function cleanTeachHtml(html) {
  var d = document.createElement('div'); d.innerHTML = html || '';
  d.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach(function (x) { x.remove(); });
  d.querySelectorAll('*').forEach(function (el) { Array.from(el.attributes).forEach(function (a) { if (/^on/i.test(a.name) || (a.name === 'href' && /^\s*javascript:/i.test(a.value))) el.removeAttribute(a.name); }); });
  d.querySelectorAll('a.vref').forEach(function (a) { a.replaceWith(document.createTextNode(a.textContent)); });
  d.querySelectorAll('td[data-l]').forEach(function (td) { td.removeAttribute('data-l'); });
  return d.innerHTML;
}
var REF_RE = /\b((?:[1-3]\s?)?[A-Z][a-z]+\.?)\s(\d{1,3}):(\d{1,3})(?:\s?[–-]\s?(\d{1,3}))?/g;
function linkRefs(root) {
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], n;
  while ((n = walker.nextNode())) if (!n.parentNode.closest('a') && REF_RE.test(n.nodeValue)) nodes.push(n);
  nodes.forEach(function (node) {
    var t = node.nodeValue, frag = document.createDocumentFragment(), last = 0, m;
    REF_RE.lastIndex = 0;
    while ((m = REF_RE.exec(t))) {
      var b = findBook(m[1].replace(/\.$/, ''));
      if (b < 0 || +m[2] > BOOKS[b][1]) continue;
      frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      var a = document.createElement('a'); a.className = 'vref'; a.textContent = m[0];
      a.dataset.b = b; a.dataset.c = m[2]; a.dataset.v1 = m[3]; a.dataset.v2 = m[4] || m[3];
      frag.appendChild(a); last = m.index + m[0].length;
    }
    if (!last) return;
    frag.appendChild(document.createTextNode(t.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
  root.querySelectorAll('a.vref').forEach(function (a) {
    a.onclick = function (e) {
      e.preventDefault();
      var vs = []; for (var v = +a.dataset.v1; v <= +a.dataset.v2 && vs.length < 200; v++) vs.push(v);
      closeSheet(); closeSearch(); showChapter(+a.dataset.b, +a.dataset.c, vs);
    };
  });
}
function labelTables(root) {
  root.querySelectorAll('table').forEach(function (tb) {
    var hs = Array.from(tb.querySelectorAll('thead th')).map(function (th) { return th.textContent.trim(); });
    if (!hs.length) return;
    tb.querySelectorAll('tbody tr').forEach(function (tr) { Array.from(tr.children).forEach(function (td, i) { if (hs[i] && i !== 1) td.setAttribute('data-l', hs[i]); }); });
  });
}
function openTeachList() {
  openSheet('Teaching notes');
  var all = teachAll(), ids = Object.keys(all).sort(function (a, z) { return (all[z].updated || 0) - (all[a].updated || 0); });
  var h = '<label class="field"><span>Search your teaching notes</span><input type="text" id="tlQ" placeholder="A word or phrase"></label><div id="tlList"></div>' +
    '<div class="actions"><button class="primary" id="tlNew">+ New teaching note</button></div>' +
    '<p class="status">Teaching notes are included in your backups, and they show up when you search the Bible from the top bar.</p>';
  sheetBody.innerHTML = h;
  function list(q) {
    var ws = q.toLowerCase().split(/\s+/).filter(Boolean);
    var shown = ids.filter(function (k) { var t = (all[k].title + ' ' + teachText(all[k].html)).toLowerCase(); return ws.every(function (w) { return t.indexOf(w) >= 0; }); });
    document.getElementById('tlList').innerHTML = shown.length ? shown.map(function (k) {
      var t = all[k], d = new Date(t.updated || t.created || Date.now());
      return '<button class="dl-item" data-t="' + esc(k) + '" style="width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--rule);padding:.7rem 0;color:var(--ink);display:flex;justify-content:space-between;gap:1rem"><span style="font-weight:600">' + esc(t.title || 'Untitled') + '</span><span class="status" style="margin:0">' + esc(d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })) + '</span></button>';
    }).join('') : '<p class="hint">' + (ids.length ? 'No teaching notes match.' : 'No teaching notes yet. Start one below, or restore a teaching-notes file from Back up and restore.') + '</p>';
    sheetBody.querySelectorAll('[data-t]').forEach(function (el) { el.onclick = function () { openTeach(el.dataset.t); }; });
  }
  list('');
  document.getElementById('tlQ').oninput = function () { list(this.value.trim()); };
  document.getElementById('tlNew').onclick = function () {
    var a = teachAll(), id = 't' + Date.now();
    a[id] = { id: id, title: 'New teaching note', html: '<p></p>', created: Date.now(), updated: Date.now() };
    teachSave(a); openTeach(id, true);
  };
}
function openTeach(id, edit) {
  var all = teachAll(), t = all[id]; if (!t) return openTeachList();
  openSheet(edit ? 'Editing' : 'Teaching note');
  if (!edit) {
    sheetBody.innerHTML = '<button class="backlink" id="tvBack">‹ Teaching notes</button><h1 class="ch-title" style="font-size:1.6rem;margin:.2rem 0 .8rem">' + esc(t.title || 'Untitled') + '</h1>' +
      (/hebrew alphabet/i.test(t.title || '') ? '<div class="actions" style="margin:-.3rem 0 1rem"><button class="primary" id="tvCards">Practise with flip cards</button></div>' : '') +
      '<div class="tagbox" id="tvTags" style="margin:-.3rem 0 1rem"></div><div class="tn" id="tvBody">' + cleanTeachHtml(t.html) + '</div>' +
      '<div class="actions" style="margin-top:1.2rem"><button class="primary" id="tvEdit">Edit</button><button class="quiet" id="tvBack2">‹ Teaching notes</button></div>';
    var body = document.getElementById('tvBody'); labelTables(body); linkRefs(body);
    nvMountTags('tvTags', 't:' + id);
    document.getElementById('tvBack').onclick = openTeachList; document.getElementById('tvBack2').onclick = openTeachList;
    document.getElementById('tvEdit').onclick = function () { openTeach(id, true); };
    var tc2 = document.getElementById('tvCards'); if (tc2) tc2.onclick = openAlefCards;
    return;
  }
  sheetBody.innerHTML = '<label class="field"><span>Title</span><input type="text" id="teTitle" value="' + esc(t.title || '') + '"></label>' +
    '<div class="tnbar"><button data-cmd="h2">Heading</button><button data-cmd="h3">Subheading</button><button data-cmd="p">Text</button><button data-cmd="bold"><b>B</b></button><button data-cmd="italic"><i>I</i></button><button data-cmd="insertUnorderedList">• List</button><button data-cmd="insertOrderedList">1. List</button><button id="teDone" style="margin-left:auto;background:var(--accent);color:var(--accent-ink);border-color:var(--accent)">Done</button></div>' +
    '<div class="tn" id="teBody" contenteditable="true">' + cleanTeachHtml(t.html) + '</div>' +
    '<p class="status" id="teStat">Type a reference such as Isaiah 9:6 and it becomes a link when you finish editing.</p>' +
    '<div class="actions"><button class="quiet" id="teDel">Delete this note</button></div>';
  var tb = document.getElementById('teBody'), ti = document.getElementById('teTitle'), timer = null;
  function save() { var a = teachAll(); if (!a[id]) return; a[id].title = ti.value.trim() || 'Untitled'; a[id].html = cleanTeachHtml(tb.innerHTML); a[id].updated = Date.now(); teachSave(a); document.getElementById('teStat').textContent = 'Saved'; }
  function later() { clearTimeout(timer); timer = setTimeout(save, 600); }
  tb.oninput = later; ti.oninput = later;
  sheetBody.querySelectorAll('[data-cmd]').forEach(function (b) {
    b.onmousedown = function (e) { e.preventDefault(); };
    b.onclick = function () {
      var c = b.dataset.cmd; tb.focus();
      try { if (c === 'h2' || c === 'h3' || c === 'p') document.execCommand('formatBlock', false, c.toUpperCase()); else document.execCommand(c, false, null); } catch (e) {}
      later();
    };
  });
  document.getElementById('teDone').onclick = function () { clearTimeout(timer); save(); openTeach(id); };
  var del = document.getElementById('teDel');
  del.onclick = function () {
    if (del.dataset.armed !== '1') { del.dataset.armed = '1'; del.textContent = 'Tap again to delete'; return; }
    var a = teachAll(); delete a[id]; teachSave(a); toast('Teaching note deleted'); openTeachList();
  };
}
