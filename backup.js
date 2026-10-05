// Noble Vine Study & Discipleship · 2.0.0 · Back up and restore
'use strict';
// ======================================================================
// Back up and restore
// ======================================================================
var downloads = null;
function summarise(list) {
  var byBook = {};
  list.forEach(function (c) { (byBook[c.book] = byBook[c.book] || []).push(c.ch); });
  return Object.keys(byBook).map(Number).sort(function (a, z) { return a - z; }).map(function (b) {
    var chs = byBook[b].sort(function (a, z) { return a - z; }), parts = [], st = chs[0], pv = chs[0];
    for (var i = 1; i <= chs.length; i++) {
      if (i < chs.length && chs[i] === pv + 1) { pv = chs[i]; continue; }
      parts.push(st === pv ? st : st + '–' + pv);
      if (i < chs.length) st = pv = chs[i];
    }
    return BOOKS[b][0] + ' ' + parts.join(', ');
  }).join('; ');
}
function openBackup() {
  openSheet('Back up and restore');
  var list = Object.keys(chapters).sort().map(function (k) { return chapters[k]; });
  var verses = list.reduce(function (a, c) { return a + c.verses.length; }, 0);
  sheetBody.innerHTML =
    '<div class="set"><div class="set-t">Export my Bible</div>' +
    '<p class="hint" style="margin-top:0">Saves everything in one backup file: your Bible, notes, prophetic words and voice notes, favourites, themes, plans and recordings' + (list.length ? ': ' + esc(summarise(list)) + ' (' + verses + ' verses)' : '') + ', with your ' + (Object.keys(vnotes).length + Object.keys(pnotes).length) + ' notes and your reading plans. Keep it in Files or iCloud Drive. The installable version of this app will load your Bible from this file.</p>' +
    '<div class="actions"><button class="primary" id="bExport"' + (list.length ? '' : ' disabled') + '>Export my Bible</button></div><p class="status" id="bExStat"></p></div>' +
    '<div class="set"><div class="set-t">Restore from a backup file</div>' +
    '<p class="hint" style="margin-top:0">Adds the chapters from a backup file. Chapters you already have with the same number are replaced; nothing else is removed.</p>' +
    '<input type="file" id="bFile" accept=".json,.txt,application/json,text/plain" class="hidden">' +
    '<div class="actions"><button class="quiet" id="bPick">Choose backup file</button></div><div id="bRes"></div></div>';
  var ex = document.getElementById('bExport'), exStat = document.getElementById('bExStat');
  if (!downloads) { ex.disabled = true; exStat.textContent = 'Saving files isn’t available in this view.'; }
  ex.onclick = async function () {
    var d = new Date(), stamp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var data = JSON.stringify({ app: 'names-restored-bible', format: 1, exported: d.toISOString(), note: 'Restored Names Bible (RNB) with the Names restored.', settings: S, plan: plans.bible, study: plans.study, words: savedWords(), memory: memAll(), teach: teachAll(), pictures: await picsAll(), recordings: await recExport(), prophecies: await prophExport(), favourites: favAll(), themes: nvTagData(), verseNotes: Object.keys(vnotes).map(function (k) { return vnotes[k]; }), planNotes: Object.keys(pnotes).map(function (k) { return pnotes[k]; }), chapters: list });
    ex.disabled = true; exStat.style.color = ''; exStat.textContent = 'Preparing the file…';
    try {
      await downloads.save({ filename: 'Noble Vine backup ' + stamp + '.json', data: new Blob([data]) });
      exStat.textContent = 'Saved. ' + list.length + ' chapters are in the backup.';
    } catch (e) {
      var c = e && e.code;
      exStat.style.color = c === 'declined' ? '' : 'var(--name)';
      exStat.textContent = c === 'declined' ? 'Cancelled.' : c === 'rate_limited' ? 'A save is already waiting for your answer.' : 'Couldn’t save the file (' + (c || 'error') + ').';
      if (c === 'unavailable' || c === 'not_granted' || c === 'capability_disabled' || c === 'capability_removed') { exStat.textContent = 'Saving files isn’t available in this view.'; return; }
    }
    ex.disabled = false;
  };
  var file = document.getElementById('bFile'), res = document.getElementById('bRes');
  document.getElementById('bPick').onclick = function () { file.value = ''; file.click(); };
  file.onchange = function () {
    var f = file.files && file.files[0]; if (!f) return;
    var r = new FileReader();
    r.onerror = function () { res.innerHTML = '<p class="hint" style="color:var(--name)">That file couldn’t be read.</p>'; };
    r.onload = function () {
      var obj;
      var raw = String(r.result || '').replace(/^\uFEFF/, '').trim();
      if (/^%PDF/.test(raw)) { res.innerHTML = '<p class="hint" style="color:var(--name)">That’s a PDF. The app can only read its own backup files, which end in <b>.json</b>. Choose the .json file instead.</p>'; return; }
      try { obj = JSON.parse(raw); } catch (e) { obj = null; }
      if (!obj) { res.innerHTML = '<p class="hint" style="color:var(--name)">That file isn’t one the app can read' + (f.name ? ' (' + esc(f.name) + ')' : '') + '. Choose the backup or teaching-notes file that ends in <b>.json</b>.</p>'; return; }
      var items = obj && obj.app === 'names-restored-bible' && Array.isArray(obj.chapters) ? obj.chapters.filter(function (c) {
        return c && typeof c.book === 'number' && c.book >= 0 && c.book < BOOKS.length && typeof c.ch === 'number' && c.ch >= 1 && c.ch <= BOOKS[c.book][1] && Array.isArray(c.verses) && c.verses.length;
      }) : [];
      var damaged = 0;
      items = items.filter(function (c) {
        var ok = c.verses.every(function (x) { return x && isFinite(+x.v) && +x.v > 0 && typeof x.t === 'string'; });
        if (!ok) damaged++; return ok;
      });
      var vn = obj && Array.isArray(obj.verseNotes) ? obj.verseNotes.filter(function (n) { return n && n.id && typeof n.text === 'string' && n.text.trim(); }) : [];
      var pn = obj && Array.isArray(obj.planNotes) ? obj.planNotes.filter(function (n) { return n && n.id && n.planCreated && typeof n.text === 'string' && n.text.trim(); }) : [];
      var bTeach = obj && obj.teach && typeof obj.teach === 'object' ? obj.teach : {};
      var bMem = obj && obj.memory && typeof obj.memory === 'object' ? obj.memory : {};
      var bWords = obj && obj.words && typeof obj.words === 'object' ? obj.words : {};
      var bRecs = obj && Array.isArray(obj.recordings) ? obj.recordings.filter(function (x) { return x && x.id && typeof x.data === 'string' && x.data.indexOf('data:') === 0; }) : [];
      var bPics = obj && Array.isArray(obj.pictures) ? obj.pictures.filter(function (x) { return x && x.id && typeof x.data === 'string' && x.data.indexOf('data:image/') === 0; }) : [];
      var bFavs = obj && obj.favourites && typeof obj.favourites === 'object' ? obj.favourites : {};
      var bThemes = obj && obj.themes && Array.isArray(obj.themes.list) ? obj.themes : null;
      var bPlans = obj ? [['bible', obj.plan], ['study', obj.study]].filter(function (x) { return x[1] && Array.isArray(x[1].schedule) && x[1].created; }) : [];
      if (!items.length && !vn.length && !pn.length && !bPlans.length && !bPics.length && !bRecs.length && !Object.keys(bTeach).length && !Object.keys(bFavs).length && !(obj.prophecies || []).length) { res.innerHTML = '<p class="hint" style="color:var(--name)">This isn’t a backup from this app, or it has nothing in it.</p>'; return; }
      var replaces = items.filter(function (c) { return has(c.book, c.ch); }).length;
      res.innerHTML = '<p class="hint">This backup has ' + items.length + ' chapters' + (items.length ? ': ' + esc(summarise(items)) : '') + (vn.length + pn.length ? ', and ' + (vn.length + pn.length) + ' notes' : '') + '.' + (bPlans.length ? ' It includes your reading plan progress.' : '') + (bPics.length ? ' It has ' + bPics.length + (bPics.length === 1 ? ' picture.' : ' pictures.') : '') + (bRecs.length ? ' Recordings in your voice: ' + bRecs.length + '.' : '') + (Object.keys(bTeach).length ? ' Teaching notes: ' + Object.keys(bTeach).map(function (k) { return '“' + (bTeach[k].title || 'Untitled') + '”'; }).join(', ') + '.' : '') + (replaces ? ' ' + replaces + ' of them will replace chapters you already have.' : '') + '</p>' +
        (damaged ? '<p class="hint" style="color:var(--name)">' + damaged + (damaged === 1 ? ' chapter looks' : ' chapters look') + ' damaged in this file and will be skipped.</p>' : '') +
        (Object.keys(bFavs).length ? '<p class="hint">Favourite verses: ' + Object.keys(bFavs).length + '.</p>' : '') +
        '<p class="status">Nothing is removed: the backup adds to what is on this device, and replaces chapters with the same number.</p>' +
        '<div class="actions"><button class="primary" id="bRestore">Restore</button></div><p class="status" id="bStat"></p>';
      document.getElementById('bRestore').onclick = async function () {
        var btn = this, st = document.getElementById('bStat'); btn.disabled = true;
        try {
          for (var i = 0; i < items.length; i++) {
            var c = items[i];
            st.textContent = 'Restoring ' + BOOKS[c.book][0] + ' ' + c.ch + ' (' + (i + 1) + ' of ' + items.length + ')…';
            await putChapter({ key: key(c.book, c.ch), book: c.book, ch: c.ch,
              verses: c.verses.map(function (x) { return { v: +x.v, t: String(x.t) }; }),
              heads: (c.heads || []).map(function (x) { return { v: +x.v, t: String(x.t) }; }), updated: Date.now() });
          }
          for (var j = 0; j < vn.length + pn.length; j++) {
            var isV = j < vn.length, n = isV ? vn[j] : pn[j - vn.length];
            st.textContent = 'Restoring notes (' + (j + 1) + ' of ' + (vn.length + pn.length) + ')…';
            var clean = JSON.parse(JSON.stringify(n));
            if (store.mode === 'db') await withTimeout((isV ? store.vnotes : store.notes).doc(clean.id).set(clean), 20000);
            (isV ? vnotes : pnotes)[clean.id] = clean;
          }
          if (store.mode !== 'db') { lsSet('nb-vnotes', vnotes); lsSet('nb-pnotes', pnotes); }
          bPlans.forEach(function (x) {
            var sl = x[0], bp = JSON.parse(JSON.stringify(x[1])), cur = plans[sl];
            usePlan(sl);
            if (!cur) { plan = bp; savePlan(true); }
            else if (cur.created === bp.created) {
              plan.done = Object.assign({}, bp.done || {}, plan.done || {});
              plan.ticks = Object.assign({}, bp.ticks || {}, plan.ticks || {});
              savePlan(true);
            }
          });
          usePlan('bible');
          if (Object.keys(bTeach).length) { var tt = teachAll(); Object.keys(bTeach).forEach(function (k) { var x = bTeach[k]; if (x && typeof x.html === 'string' && (!tt[k] || (x.updated || 0) >= (tt[k].updated || 0))) tt[k] = { id: k, title: String(x.title || 'Untitled'), html: cleanTeachHtml(x.html), created: x.created || Date.now(), updated: x.updated || Date.now() }; }); teachSave(tt); }
          if (Object.keys(bMem).length) { var mm = memAll(); Object.keys(bMem).forEach(function (k) { var x = bMem[k]; if (x && x.id && Array.isArray(x.vs) && (!mm[k] || (x.updated || 0) > (mm[k].updated || 0))) mm[k] = x; }); memSave(mm); }
          if (Object.keys(bWords).length) { var mw = savedWords(); Object.keys(bWords).forEach(function (k) { if (!mw[k] || (bWords[k].updated || 0) > (mw[k].updated || 0)) mw[k] = bWords[k]; }); saveWords(mw); }
          for (var ri = 0; ri < bRecs.length; ri++) { var rx = bRecs[ri], bl = dataURLToBlob(rx.data); if (!bl) continue; var have = await recGet(rx.id); if (!have || (rx.created || 0) > (have.created || 0)) { var nr = Object.assign({}, rx); delete nr.data; nr.blob = bl; try { await recPut(nr); } catch (e) {} } }
          if (Object.keys(bFavs).length) { var ff = favAll(); Object.keys(bFavs).forEach(function (k) { var x = bFavs[k]; if (x && typeof x.b === 'number' && typeof x.c === 'number' && x.v) ff[k] = x; }); favSave(ff); }
          if (bThemes) { var td = nvTagData(), have = {}; td.list.forEach(function (t) { have[t.id] = 1; }); bThemes.list.forEach(function (t) { if (t && t.id && t.name && !have[t.id]) td.list.push(t); });
            Object.keys(bThemes.map || {}).forEach(function (k) { var a = td.map[k] || []; (bThemes.map[k] || []).forEach(function (id) { if (a.indexOf(id) < 0) a.push(id); }); td.map[k] = a; }); nvTagSave(td); }
          var bPro = obj && Array.isArray(obj.prophecies) ? obj.prophecies : [];
          for (var qi = 0; qi < bPro.length; qi++) { try { await prophImport(bPro[qi]); } catch (e) {} }
          if (bPics.length) {
            var have = {}; (await picsAll()).forEach(function (x) { have[x.id] = 1; });
            for (var pi = 0; pi < bPics.length; pi++) if (!have[bPics[pi].id]) { st.textContent = 'Restoring pictures (' + (pi + 1) + ' of ' + bPics.length + ')…'; try { await picPut({ id: bPics[pi].id, data: bPics[pi].data, added: bPics[pi].added || Date.now() + pi }); } catch (e) {} }
          }
          st.textContent = 'Done. ' + items.length + ' chapters' + (vn.length + pn.length ? ' and ' + (vn.length + pn.length) + ' notes' : '') + ' restored.';
          btn.textContent = 'Restored';
          if (!qEl.value.trim() && (items.length || has(pos.b, pos.c))) showChapter(has(pos.b, pos.c) ? pos.b : items[0].book, has(pos.b, pos.c) ? pos.c : items[0].ch);
        } catch (e) {
          btn.disabled = false; st.style.color = 'var(--name)';
          st.textContent = 'Stopped: ' + ((e && e.code) || 'error') + '. Chapters restored so far are kept; tap Restore to finish the rest.';
        }
      };
    };
    r.readAsText(f);
  };
}
