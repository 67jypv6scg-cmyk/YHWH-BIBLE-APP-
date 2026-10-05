// Noble Vine Study & Discipleship · 2.0.0 · Importing text and restoring the Names
'use strict';
// ======================================================================
// Import: clean-up, parse into chapters and verses, restore the names
// ======================================================================
var COMMON = new Set(('a an and the he she it they them their his her him its is are was were be been being am i we us our you your yours me my mine ' +
  'of to in on at by for from with without into onto upon over under out up down off about above after before behind below beneath beside between beyond ' +
  'but or nor so yet if then than that this these those there here where when while who whom whose which what why how all any each every both either neither ' +
  'no not none one two three four five six seven eight nine ten some such own same other another many much more most few less least only also even again ' +
  'as because since until till unless though although whether lest shall should will would may might must can could do does did done have has had having ' +
  'said say says saying spoke speak told tell came come comes go goes went gone gave give given took take taken made make makes saw see seen knew know known ' +
  'let lord god man men woman women son sons daughter daughters father fathers mother brother brothers sister wife husband child children people ' +
  'land earth heaven heavens water waters day days night light dark darkness life death house city king kings word words name hand hands eyes eye face ' +
  'heart soul spirit blood bread wine fruit tree trees seed field garden good evil great little old new first last now very thing things ' +
  'called call behold bring brought bear bore born dwell dwelt eat ate drink hear heard answered answer blessed bless curse cursed fear sent send ' +
  'set put sat stood returned turned became become began lived live died die dead kill killed built build left right walk walked way ways ' +
  'away among around against along toward towards through throughout therefore thus indeed truly surely forth near far long whole ' +
  'ah oh lo yes nay art thou thee thy hath doth unto amen ' +
  'able beast beasts serpent ground dust rib flesh bone bones naked ashamed wise food delight desired eaten touch midst opened sewed leaves ' +
  'read rest reason rain rise risen rose road rock rod room root rule ruler rulers break breath brethren bright broad brown burn burned ' +
  'ark age ages air altar angel angels anger arm arms army ask asked ass bag bank bare bed best bird birds boat body book bow box boy branch ' +
  'camp care cast cattle cause cloud cold count cover cup cut deep desert door dream dry east end enemy ever evening faith fall family ' +
  'fast feast feet fell fight fill find fine fire fish flock flood floor fly foot form found free friend gate gather glory gold grace grain ' +
  'grass grave grow guard hair half hall hard harvest head health heat high hill hold holy honor horse hour hunger idol iron journey joy ' +
  'judge judgment keep kind kingdom lamb law lay lead learn lie lift line lion lip lips love lot low mark meat meet mercy mind money moon morning ' +
  'mount mountain mouth neck nation nations north oath offer offering oil open order pass path peace place plain plant poor power praise pray ' +
  'prayer priest promise pure rich ring river sabbath salt sand save sea season seat servant serve shadow sheep shepherd shield side sight ' +
  'sign silver sin sing sleep smoke south stand star stars stone stones strength strong sun sword table teach temple tent test throne time ' +
  'tongue top tower tribe truth voice war wash watch west wheat white wind wing wings winter wood work world worship wrath year years young ' +
  'band bold sold fold slay slew clay swine beat shear tone lone flay spray stay sway play gray grey fray bray dove fled bled bout bash ' +
  'brow crow glow slow snow show flow blow scare scar star tart dare fare hare pare ware rare mare spare stare share').split(' '));

function stripCrossRefs(text) {
  var expected = null;
  var re = /(^|[\s“‘"'(\u2014\u2013\[])([a-z])([A-Z“‘"'][A-Za-z’'-]*|[a-z][A-Za-z’'-]*)/g;
  return text.replace(re, function (m, pre, letter, rest) {
    var marker;
    if (/^[A-Z“‘"']/.test(rest)) marker = true;
    else {
      var full = (letter + rest).toLowerCase().replace(/[’'-].*$/, '');
      var core = rest.toLowerCase().replace(/[’'-].*$/, '');
      if (COMMON.has(full)) marker = false;
      else if (COMMON.has(core)) marker = expected === null || letter === expected;
      else marker = expected !== null && letter === expected;
    }
    if (!marker) return m;
    expected = String.fromCharCode((letter.charCodeAt(0) - 97 + 1) % 26 + 97);
    return pre + rest;
  });
}
function cleanup(raw) {
  var SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  var t = raw.replace(/\r\n?/g, '\n').replace(/[\u00A0\u2009\u202F\u2002\u2003]/g, ' ')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, function (m) { return ' ' + m.split('').map(function (c) { return SUP.indexOf(c); }).join('') + ' '; });
  var cut = t.search(/^\s*(Footnotes|Cross References)\s*$/mi);
  if (cut >= 0) t = t.slice(0, cut);
  t = t.split('\n').filter(function (l) {
    return !/English Standard Version|Crossway|^\s*\(?ESV\)?\s*$|^\s*\[\d+\]\s+\d+:\d+/.test(l);
  }).join('\n');
  t = t.replace(/\[(\d{1,3})\]\s*/g, ' $1 ');
  // verse numbers glued to the start of a word: "1In", "3but"
  t = t.replace(/(^|[\s“‘"(])(\d{1,3})(?=[A-Za-z“‘"'])(?!st\b|nd\b|rd\b|th\b)/gm, '$1$2 ');
  t = t.replace(/([A-Za-z\u0590-\u05FF.,;:!?’”'")\]])\d{1,2}(?=[\s.,;:!?’”'")\]—–]|$)/gm, '$1');
  t = stripCrossRefs(t);
  return t;
}
var HEAD_RE = new RegExp('^(' + BOOKS.map(function (b) { return b[0]; }).join('|') + '|Psalm|Song of Songs)\\s+(\\d{1,3})(?::\\d{1,3}(?:\\s*[-–]\\s*\\d{1,3}(?::\\d{1,3})?)?)?(?:\\s*\\(?ESV\\)?)?$', 'i');
var SMALL = new Set('with from into upon over unto that than them they this what when your their onto about after before under among'.split(' '));
function isSectionHeading(line) {
  if (line.length > 70 || /[.,;:!?”’"')\]]$/.test(line) || !/^[A-Z‘“"']/.test(line) || /\d/.test(line)) return false;
  var words = line.split(/\s+/);
  if (words.length > 9) return false;
  return words.every(function (w) { var c = w.replace(/^[‘“"'(]/, ''); return c.length <= 3 || SMALL.has(c.toLowerCase()) || /^[A-Z]/.test(c); });
}
function parseImport(raw, bookIdx, startCh) {
  var lines = cleanup(raw).split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  var out = {}, order = [];
  var book = bookIdx, chap = startCh, verse = null, awaiting = true, pendingHeads = [], cur = null;
  function ensure(c) {
    var k = key(book, c);
    if (!out[k]) { out[k] = { key: k, book: book, ch: c, verses: [], heads: [] }; order.push(k); }
    return out[k];
  }
  function startVerse(v) {
    cur = ensure(chap);
    cur.verses.push({ v: v, t: '' });
    pendingHeads.forEach(function (h) { cur.heads.push({ v: v, t: h }); });
    pendingHeads = [];
  }
  function append(txt) {
    txt = txt.trim();
    if (!txt || !cur || !cur.verses.length) return;
    var last = cur.verses[cur.verses.length - 1];
    last.t = last.t ? last.t + ' ' + txt : txt;
  }
  var firstBookSet = false;
  lines.forEach(function (line) {
    var h = line.match(HEAD_RE);
    if (h) {
      var name = h[1].toLowerCase() === 'psalm' ? 'Psalms' : h[1].toLowerCase() === 'song of songs' ? 'Song of Solomon' : h[1];
      var bi = BOOKS.findIndex(function (b) { return b[0].toLowerCase() === name.toLowerCase(); });
      if (bi >= 0 && !firstBookSet && !order.length) book = bi;
      firstBookSet = true;
      chap = +h[2]; verse = null; awaiting = true;
      return;
    }
    var chm = line.match(/^chapter\s+(\d{1,3})$/i);
    if (chm) { chap = +chm[1]; verse = null; awaiting = true; return; }
    if (isSectionHeading(line)) { pendingHeads.push(line); return; }
    var re = /(^|[\s“‘"(\[])(\d{1,3})(?=\s|$)/g, m, pos = 0;
    while ((m = re.exec(line)) !== null) {
      var n = +m[2], ok = false, nv = null, nc = chap;
      if (awaiting) { ok = true; nv = (n === chap || n === 1) ? 1 : n; }
      else if (n === verse + 1) { ok = true; nv = n; }
      else if (n === chap + 1) { ok = true; nc = n; nv = 1; }
      else if (m.index === 0 && n > verse && n <= verse + 20) { ok = true; nv = n; }
      if (!ok) continue;
      var numStart = m.index + m[1].length;
      append(line.slice(pos, numStart));
      chap = nc; verse = nv; awaiting = false;
      startVerse(nv);
      pos = numStart + m[2].length;
    }
    append(line.slice(pos));
  });
  var list = order.map(function (k) {
    var c = out[k];
    c.verses = c.verses.filter(function (x) { return x.t; });
    c.verses.forEach(function (x) { x.t = restore(x.t); });
    c.heads.forEach(function (x) { x.t = restore(x.t); });
    return c;
  }).filter(function (c) { return c.verses.length; });
  return list;
}
var NAMEF = { heb: 'יהוה', Yahowah: 'Yahowah', Yehovah: 'Yehovah' };
var JESUSF = { heb: 'יהושע', Yehoshua: 'Yehoshua', Yeshua: 'Yeshua', keep: 'Jesus' };
function restore(t) {
  var name = NAMEF[S.name] || 'יהוה', lordWord = S.lord === 'keep' ? 'Lord' : S.lord;
  var rules = [[/\bLord GOD\b/g, lordWord + ' ' + name], [/\b[Tt]he LORD\b/g, name], [/\bLORD\b/g, name], [/\bGOD\b/g, name]];
  if (S.jesus !== 'keep') rules.push([/\bJesus\b/g, JESUSF[S.jesus]]);
  if (S.christ) rules.push([/\bChrist\b/g, 'Messiah']);
  if (S.god) rules.push([/\bGod\b/g, 'Elohim']);
  if (S.spirit) rules.push([/\b[Tt]he Holy Spirit\b/g, 'Ruach ha-Qodesh']);
  if (S.spirit) rules.push([/\bHoly Spirit\b/g, 'Ruach ha-Qodesh']);
  if (S.lord === 'Adonai') rules.push([/\b[Tt]he Lord\b/g, 'Adonai']);
  if (S.lord !== 'keep') rules.push([/\bLord\b/g, S.lord]);
  // Protect replaced text from later rules using placeholders
  var bag = [];
  rules.forEach(function (r) {
    t = t.replace(r[0], function (m) { bag.push(S.brackets ? m + ' [' + r[1] + ']' : r[1]); return '\uE000' + (bag.length - 1) + '\uE001'; });
  });
  return t.replace(/\uE000(\d+)\uE001/g, function (m, i) { return bag[+i]; });
}
