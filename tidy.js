// Noble Vine Study & Discipleship · 2.0.0 · One-time text tidies (Adonai, Ruach ha-Qodesh)
'use strict';
// One-time tidy: "the Adonai" reads awkwardly in English, so drop the article ("an angel of Adonai", "Adonai said")
function fixAdonaiArticles() {
  var n = 0, re = /\b[Tt]he Adonai\b/g;
  Object.keys(chapters).forEach(function (k) {
    var d = chapters[k], ch = false;
    d.verses.forEach(function (x) { var t = x.t.replace(re, 'Adonai'); if (t !== x.t) { x.t = t; ch = true; n++; } });
    (d.heads || []).forEach(function (x) { var t = x.t.replace(re, 'Adonai'); if (t !== x.t) { x.t = t; ch = true; } });
    if (ch) putChapter(d).catch(function () {});
  });
  return n;
}
// One-time tidy: "ha-" already means "the", so "the Ruach ha-Qodesh" becomes "Ruach ha-Qodesh"
function fixRuachArticles() {
  var n = 0, re = /\b[Tt]he Ruach ha-Qodesh\b/g;
  Object.keys(chapters).forEach(function (k) {
    var d = chapters[k], ch = false;
    d.verses.forEach(function (x) { var t = x.t.replace(re, 'Ruach ha-Qodesh'); if (t !== x.t) { x.t = t; ch = true; n++; } });
    (d.heads || []).forEach(function (x) { var t = x.t.replace(re, 'Ruach ha-Qodesh'); if (t !== x.t) { x.t = t; ch = true; } });
    if (ch) putChapter(d).catch(function () {});
  });
  return n;
}
