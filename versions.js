// Noble Vine Study & Discipleship · 2.0.0 · WEB and ASV downloads
'use strict';
// Public-domain comparison versions (WEB, ASV), downloaded once from getBible.net and kept exactly as published
function verLabel(id, long) { var v = VERSIONS.filter(function (x) { return x.id === id; })[0]; return v ? (long ? v.name : v.label) : String(id).toUpperCase(); }
async function downloadVer(id, stat) {
  var all = {}, nm = verLabel(id, true);
  stat('Downloading the ' + nm + '…');
  try {
    var txt = await fetchText('https://api.getbible.net/v2/' + id + '.json', function (g, t) { stat('Downloading the ' + nm + '… ' + (g / 1048576).toFixed(1) + ' MB' + (t ? ' of ' + (t / 1048576).toFixed(1) + ' MB' : '')); });
    var j = JSON.parse(txt); (j.books || []).forEach(function (bk) { getbibleBook(bk, all); });
  } catch (e) { all = {}; }
  if (Object.keys(all).length < 66) {
    for (var n = 1; n <= 66; n++) {
      if (all[n - 1]) continue;
      stat('Downloading the ' + nm + '… book ' + n + ' of 66');
      var r = await fetch('https://api.getbible.net/v2/' + id + '/' + n + '.json');
      if (!r.ok) throw new Error('download ' + r.status);
      var bj = await r.json(); if (!bj.nr && !bj.book_nr) bj.nr = n; getbibleBook(bj, all);
    }
  }
  var bks = Object.keys(all).map(Number);
  if (bks.length < 66) throw new Error('format');
  stat('Saving to this device…');
  for (var i = 0; i < bks.length; i++) { await verPut(id + ':' + bks[i], all[bks[i]]); verCache[id + ':' + bks[i]] = all[bks[i]]; }
  var meta = await verLoadMeta(); meta[id] = { when: Date.now(), books: 66 }; await verPut('meta', meta);
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
}
function mvRow(meta, id) {
  return '<div class="wrow"><span>' + verLabel(id) + '</span><span>' + (meta[id] ? 'Whole Bible, downloaded' : window.claude ? 'Downloads in your installed app' : '<button class="backlink" data-mvdl="' + id + '" style="margin:0">Download (about 5 MB)</button>') + '</span></div>';
}
