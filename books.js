// Noble Vine Study & Discipleship · 2.0.0 · Bible books, references, helpers
'use strict';
// Runs a setup step once every file has loaded (for steps that use code from later files)
function onReady(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else setTimeout(fn, 0); }
// ======================================================================
// Books
// ======================================================================
var BOOKS = [['Genesis',50],['Exodus',40],['Leviticus',27],['Numbers',36],['Deuteronomy',34],['Joshua',24],['Judges',21],['Ruth',4],
  ['1 Samuel',31],['2 Samuel',24],['1 Kings',22],['2 Kings',25],['1 Chronicles',29],['2 Chronicles',36],['Ezra',10],['Nehemiah',13],
  ['Esther',10],['Job',42],['Psalms',150],['Proverbs',31],['Ecclesiastes',12],['Song of Solomon',8],['Isaiah',66],['Jeremiah',52],
  ['Lamentations',5],['Ezekiel',48],['Daniel',12],['Hosea',14],['Joel',3],['Amos',9],['Obadiah',1],['Jonah',4],['Micah',7],['Nahum',3],
  ['Habakkuk',3],['Zephaniah',3],['Haggai',2],['Zechariah',14],['Malachi',4],
  ['Matthew',28],['Mark',16],['Luke',24],['John',21],['Acts',28],['Romans',16],['1 Corinthians',16],['2 Corinthians',13],['Galatians',6],
  ['Ephesians',6],['Philippians',4],['Colossians',4],['1 Thessalonians',5],['2 Thessalonians',3],['1 Timothy',6],['2 Timothy',4],['Titus',3],
  ['Philemon',1],['Hebrews',13],['James',5],['1 Peter',5],['2 Peter',3],['1 John',5],['2 John',1],['3 John',1],['Jude',1],['Revelation',22]];
var NT_START = 39;
var ALIAS = {
  gn:0, ge:0, bereshit:0, bereshith:0, bereshis:0,
  ex:1, exod:1, shemot:1, shemoth:1,
  lv:2, le:2, vayikra:2, wayyiqra:2,
  nu:3, nm:3, bamidbar:3, bemidbar:3,
  dt:4, deut:4, devarim:4, debarim:4,
  jdg:6, jg:6, jgs:6,
  '1sa':8, '2sa':9, '1ki':10, '2ki':11, '1kgs':10, '2kgs':11, '1ch':12, '2ch':13, '1chr':12, '2chr':13,
  ps:18, psa:18, pss:18, psalm:18, pr:19, prv:19, ec:20, ecc:20, qoh:20, sos:21, song:21, songofsongs:21, canticles:21,
  ezk:25, jl:28, am:29, ob:30, jon:31, mic:32, na:33, hab:34, zep:35, hag:36, zec:37, mal:38,
  mt:39, mk:40, lk:41, jn:42, jhn:42, ac:43, ro:44, '1co':45, '2co':46, ga:47, eph:48, php:49, col:50,
  '1th':51, '2th':52, '1ti':53, '2ti':54, tit:55, phm:56, heb:57, jas:58, '1pe':59, '2pe':60, '1jn':61, '2jn':62, '3jn':63, jude:64, rv:65, re:65, rev:65
};
function normBook(s) {
  return s.toLowerCase().replace(/\./g, '').replace(/^(iii|ii|i)\s+/, function (m) { return { 'iii ': '3', 'ii ': '2', 'i ': '1' }[m] || m; })
    .replace(/^(1st|first)\s*/, '1').replace(/^(2nd|second)\s*/, '2').replace(/^(3rd|third)\s*/, '3').replace(/\s+/g, '');
}
var NORM_NAMES = BOOKS.map(function (b) { return normBook(b[0]); });
function findBook(s) {
  var n = normBook(s);
  if (!n || n.length < 2) return -1;
  if (Object.prototype.hasOwnProperty.call(ALIAS, n)) return ALIAS[n];
  for (var i = 0; i < NORM_NAMES.length; i++) if (NORM_NAMES[i] === n) return i;
  if (n.length < 3 && !/^\d/.test(n)) return -1;
  for (var j = 0; j < NORM_NAMES.length; j++) if (NORM_NAMES[j].indexOf(n) === 0) return j;
  return -1;
}
function bn(b, one) { return b === 18 && one !== false ? 'Psalm' : BOOKS[b][0]; }
function key(b, c) { return String(b + 1).padStart(2, '0') + '-' + String(c).padStart(3, '0'); }
function refLabel(b, c, vs) {
  var s = bn(b) + ' ' + c;
  if (!vs || !vs.length) return s;
  vs = vs.slice().sort(function (a, z) { return a - z; });
  var parts = [], st = vs[0], pv = vs[0];
  for (var i = 1; i <= vs.length; i++) {
    if (i < vs.length && vs[i] === pv + 1) { pv = vs[i]; continue; }
    parts.push(st === pv ? String(st) : st + '–' + pv);
    if (i < vs.length) { st = pv = vs[i]; }
  }
  return s + ':' + parts.join(', ');
}
