// Noble Vine Study & Discipleship · 2.0.0 · How the divine Names are shown; tap-to-learn cards; Names guide
'use strict';
// ======================================================================
// The divine Names: how they are shown, and the "tap to learn" cards
// The RNB text keeps the Hebrew forms; how they appear is chosen in Settings at any time.
// ======================================================================
var NV_NAMEINFO = {
  name: { heb: 'יהוה', title: 'The Name', mean: 'The personal Name of the Creator, revealed to Moses at the burning bush: “This is My name forever” (Exodus 3:15). It is linked to the Hebrew verb “to be”.', trad: '“the LORD” (or “GOD” after “Lord”)' },
  mess: { heb: 'יהושע', title: 'The Messiah’s name', mean: 'Means “Yah saves”: “you are to give Him the name Yeshua, because He will save His people from their sins” (Matthew 1:21).', trad: '“Jesus”' },
  elohim: { heb: 'אֱלֹהִים', say: 'Elohim', title: 'Mighty One, God', mean: 'The Hebrew word for God. It is plural in form, yet used of the one Creator with singular verbs: “In the beginning Elohim created” (Genesis 1:1).', trad: '“God”', nt: 'In the New Testament it stands for the Greek word theos, “God”.' },
  adonai: { heb: 'אֲדֹנָי', say: 'Adonai', title: 'My Lord, my Master', mean: 'A title of honour, not the Name. Where the Hebrew has both, the RNB writes “Adonai יהוה”.', trad: '“Lord”', nt: 'In the New Testament it stands for the Greek word kurios, “Lord, Master”.' },
  messiah: { heb: 'מָשִׁיחַ', say: 'Mashiach', title: 'The Anointed One', mean: 'The Hebrew title behind the Greek “Christos”. Kings and priests were anointed with oil; the Messiah is the Anointed King.', trad: '“Christ”' },
  ruach: { heb: 'רוּחַ הַקֹּדֶשׁ', say: 'Ruach ha-Qodesh', title: 'The Holy Spirit', mean: '“Ruach” means wind, breath or spirit; “ha-Qodesh” means “the Holiness”. The Spirit who gives life and makes holy.', trad: '“the Holy Spirit”' }
};
var NV_GUIDE_EXTRA = [
  { heb: 'יה', say: 'Yah', title: 'The short form of the Name', mean: 'As in “Hallelu-Yah”, praise Yah (Psalm 150:6).' },
  { heb: 'אֵל', say: 'El', title: 'God, Mighty One', mean: 'The short word for God, often joined with a title.' },
  { heb: 'אֵל שַׁדַּי', say: 'El Shaddai', title: 'God Almighty', mean: 'The Name by which He appeared to Abraham, Isaac and Jacob (Exodus 6:3).' },
  { heb: 'אֵל עֶלְיוֹן', say: 'El Elyon', title: 'God Most High', mean: 'Melchizedek was priest of El Elyon (Genesis 14:18).' }
];
var NV_NAME_RE = /(יהוה|יהושע|Yahowah|Yehovah|Yehoshua|Yeshua|Elohim|Adonai|Messiah|Ruach ha-Qodesh)|([\u0590-\u05FF]+)/g;
function nvKindOf(w) {
  if (w === 'יהוה' || w === 'Yahowah' || w === 'Yehovah') return 'name';
  if (w === 'יהושע' || w === 'Yeshua' || w === 'Yehoshua') return 'mess';
  if (w === 'Elohim') return 'elohim';
  if (w === 'Adonai') return 'adonai';
  if (w === 'Messiah') return 'messiah';
  return 'ruach';
}
function nvSay(kind) { return kind === 'name' ? memName() : kind === 'mess' ? memMessiah() : NV_NAMEINFO[kind].say; }
function nvShowOf(kind) { return (kind === 'name' ? S.nameShow : S.messShow) || 'heb'; }
function nvHebBdi(h) { return '<bdi class="heb" dir="rtl">' + h + '</bdi>'; }
// HTML for one Name in the reading text
function nvNameHtml(kind, word) {
  var inner = esc(word);
  if (kind === 'name' || kind === 'mess') {
    var show = nvShowOf(kind), heb = NV_NAMEINFO[kind].heb, say = esc(nvSay(kind)), trad = kind === 'name' ? 'LORD' : 'Jesus';
    inner = show === 'eng' ? say : show === 'both' ? nvHebBdi(heb) + ' <span class="nm-say">(' + say + ')</span>' : show === 'trad' ? nvHebBdi(heb) + ' <span class="nm-trad">[' + trad + ']</span>' : nvHebBdi(heb);
  }
  return '<span class="nmw' + (S.shade ? ' nm' : '') + (S.nameHint === false ? '' : ' nmu') + '" data-nm="' + kind + '" role="button" tabindex="0" aria-label="' + esc(nvSay(kind)) + ', tap to learn more">' + inner + '</span>';
}
// Reading text with the Names marked (replaces the earlier simple version)
function fmtVerse(t) {
  return esc(t).replace(NV_NAME_RE, function (m, nm, other) {
    if (nm) return nvNameHtml(nvKindOf(nm), nm);
    return '<bdi class="heb' + (S.shade ? ' nm' : '') + '" dir="rtl">' + other + '</bdi>';
  });
}
// Plain-text version, for copying a verse
function nameText(t) {
  return String(t).replace(/יהוה|יהושע|Yahowah|Yehovah|Yehoshua|Yeshua/g, function (w) {
    var kind = nvKindOf(w), show = nvShowOf(kind), heb = NV_NAMEINFO[kind].heb, say = nvSay(kind);
    return show === 'eng' ? say : show === 'both' ? heb + '\u200E (' + say + ')' : show === 'trad' ? heb + '\u200E [' + (kind === 'name' ? 'LORD' : 'Jesus') + ']' : heb + '\u200E';
  });
}
// The small card that explains a Name
function nvNameCard(kind) {
  var info = NV_NAMEINFO[kind]; if (!info) return;
  var c = document.getElementById('nmCard');
  if (!c) { c = document.createElement('div'); c.id = 'nmCard'; c.className = 'nmcard'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', 'About this Name'); document.body.appendChild(c); }
  var nt = info.nt && typeof pos !== 'undefined' && pos.b >= NT_START && !homeOn;
  c.innerHTML = '<div class="nmc-top"><div><div class="nmc-k">Hebrew name</div><div class="nmc-t">' + esc(info.title) + '</div></div><bdi class="nmc-heb" dir="rtl">' + info.heb + '</bdi></div>' +
    '<div class="nmc-say">Said <b>' + esc(nvSay(kind)) + '</b></div><p>' + esc(info.mean) + '</p>' + (nt ? '<p class="nmc-nt">' + esc(info.nt) + '</p>' : '') +
    '<p class="nmc-tr">Most English Bibles: ' + esc(info.trad) + '</p>' +
    '<div class="actions" style="margin-top:.6rem"><button class="quiet" id="nmcGuide">Names guide</button><button class="primary" id="nmcClose">Close</button></div>';
  c.classList.add('show');
  document.getElementById('nmcClose').onclick = nvCloseNameCard;
  document.getElementById('nmcGuide').onclick = function () { nvCloseNameCard(); openNamesGuide(); };
  setTimeout(function () { var b = document.getElementById('nmcClose'); if (b) b.focus(); }, 30);
}
function nvCloseNameCard() { var c = document.getElementById('nmCard'); if (c) c.classList.remove('show'); }
document.addEventListener('click', function (e) {
  var w = e.target.closest && e.target.closest('.nmw');
  if (w) { e.stopPropagation(); e.preventDefault(); nvNameCard(w.dataset.nm); return; }
  var c = document.getElementById('nmCard');
  if (c && c.classList.contains('show') && !c.contains(e.target)) nvCloseNameCard();
}, true);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') nvCloseNameCard();
  var w = e.target.closest && e.target.closest('.nmw');
  if (w && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nvNameCard(w.dataset.nm); }
});
function openNamesGuide() {
  openSheet('Names guide');
  var row = function (heb, say, title, mean) {
    return '<div class="ngrow"><bdi class="ng-heb" dir="rtl">' + heb + '</bdi><div><div class="ng-t">' + esc(say) + ' · <span>' + esc(title) + '</span></div><div class="ng-m">' + esc(mean) + '</div></div></div>';
  };
  sheetBody.innerHTML = '<p class="hint" style="margin-top:0">In the Restored Names Bible, the Hebrew Names and titles are kept as Scripture first gave them. Here is what each one means, and how most English Bibles print it.</p>' +
    '<div class="mgrp">' + ['name', 'mess', 'elohim', 'adonai', 'messiah', 'ruach'].map(function (k) { var i = NV_NAMEINFO[k]; return row(i.heb, nvSay(k), i.title, i.mean + ' Most English Bibles: ' + i.trad + '.'); }).join('') + '</div>' +
    '<div class="mlab">Other Names you will meet</div><div class="mgrp">' + NV_GUIDE_EXTRA.map(function (i) { return row(i.heb, i.say, i.title, i.mean); }).join('') + '</div>' +
    (typeof nvWhyNames === 'function' ? nvWhyNames() : '') +
    '<div class="actions"><button class="quiet" id="ngSet">Change how the Names are shown</button></div>';
  document.getElementById('ngSet').onclick = openSettings;
}
// Settings: how the Names are shown
function nvNamesSettingsHtml() {
  var opts = function (kind) {
    var heb = NV_NAMEINFO[kind].heb, say = esc(nvSay(kind)), trad = kind === 'name' ? 'LORD' : 'Jesus';
    return [['heb', '<span class="heb">' + heb + '</span>'], ['eng', say], ['both', '<span class="heb">' + heb + '</span> (' + say + ')'], ['trad', '<span class="heb">' + heb + '</span> [' + trad + ']']];
  };
  return '<div class="set"><div class="set-t">How the Name is shown</div>' + segBtns('sNmShow', opts('name'), nvShowOf('name')) +
    '<div class="set-t" style="margin-top:.9rem">How the Messiah’s name is shown</div>' + segBtns('sMsShow', opts('mess'), nvShowOf('mess')) +
    '<label class="check"><input type="checkbox" id="sNmHint"' + (S.nameHint === false ? '' : ' checked') + '> <span>Underline the Names lightly, as a reminder you can tap them</span></label>' +
    '<div class="actions" style="margin-top:.3rem"><button class="quiet" id="sNmGuide">Names guide</button></div>' +
    '<p class="status">Changes show straight away, across the whole Bible.</p></div>';
}
function nvBindNamesSettings() {
  [['sNmShow', 'nameShow'], ['sMsShow', 'messShow']].forEach(function (p) {
    var box = document.getElementById(p[0]); if (!box) return;
    box.querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { S[p[1]] = b.dataset.val; saveSettings(); box.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); };
    });
  });
  var h = document.getElementById('sNmHint'); if (h) h.onchange = function () { S.nameHint = this.checked; saveSettings(); };
  var g = document.getElementById('sNmGuide'); if (g) g.onclick = openNamesGuide;
}
// A one-time welcome tip the first time someone reads
function nvNameTip() {
  if (S.nameTipSeen) return;
  S.nameTipSeen = true; saveSettings();
  var c = document.getElementById('nmCard');
  if (!c) { c = document.createElement('div'); c.id = 'nmCard'; c.className = 'nmcard'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', 'The Names'); document.body.appendChild(c); }
  c.innerHTML = '<div class="nmc-k">Welcome to the Restored Names Bible</div><div class="nmc-t" style="margin:.2rem 0 .5rem">Words in gold are the Hebrew Names, restored</div>' +
    '<p>Tap any of them to learn what it means. How would you like the Name to appear?</p><div class="seg" id="nmtShow">' +
    [['heb', '<span class="heb">יהוה</span>'], ['eng', esc(memName())], ['both', '<span class="heb">יהוה</span> (' + esc(memName()) + ')']].map(function (o) { return '<button data-val="' + o[0] + '" class="' + (nvShowOf('name') === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') +
    '</div><p class="status">You can change this any time in Settings.</p><div class="actions" style="margin-top:.6rem"><button class="primary" id="nmtOk">Got it</button></div>';
  c.classList.add('show');
  c.querySelectorAll('#nmtShow button').forEach(function (b) {
    b.onclick = function (e) { e.stopPropagation(); S.nameShow = b.dataset.val; S.messShow = b.dataset.val; saveSettings(); c.querySelectorAll('#nmtShow button').forEach(function (x) { x.classList.toggle('on', x === b); }); refreshView(); };
  });
  document.getElementById('nmtOk').onclick = function () { S.nameTipSeen = true; saveSettings(); nvCloseNameCard(); };
}
