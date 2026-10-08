// Noble Vine Study & Discipleship · 2.6 · Opening animation (once a day)
// Standalone: the wordmark is already there, the vine grows and "Study & Discipleship" comes in with it,
// a light sweeps across, then the logo dissolves into Selah. Tap anywhere to skip.
'use strict';
var NVO_KEY = 'nv-open-day', NVO_OFF = 'nv-opening';
var NVO = { active: false, released: false, queue: null };
function nvoOn() { try { return localStorage.getItem(NVO_OFF) !== 'off'; } catch (e) { return true; } }
function nvoToday() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function nvoRelease() { NVO.released = true; var q = NVO.queue; NVO.queue = null; if (q) { try { q(); } catch (e) {} } }

// Hold Selah back until the logo starts to dissolve, so it is not used up behind the animation.
if (typeof showSelah === 'function') {
  var nvoShowSelah = showSelah;
  window.showSelah = function () {
    var a = arguments, self = this;
    if (NVO.active && !NVO.released) { NVO.queue = function () { return nvoShowSelah.apply(self, a); }; return Promise.resolve(); }
    return nvoShowSelah.apply(this, a);
  };
}

function nvoPlay(opts) {
  opts = opts || {};
  if (document.getElementById('nvOpen') || typeof NV_SPRIG === 'undefined') return;
  var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var vw = Math.min(window.innerWidth, 520), LW = Math.min(340, Math.round(vw * 0.86)), LH = Math.round(LW * 192 / 368);
  var el = document.createElement('div'); el.id = 'nvOpen'; el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:fixed;inset:0;z-index:9000;background:#0B0C0A;display:flex;align-items:center;justify-content:center;touch-action:manipulation;cursor:pointer';
  el.innerHTML = '<div id="nvoLk" style="will-change:transform,opacity,filter;margin-top:-6vh"><svg width="' + LW + '" height="' + LH + '" viewBox="8 0 368 192" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;display:block">' +
    '<defs><clipPath id="nvoC"><rect x="96" y="0" width="106" height="132.4"/></clipPath>' +
    '<linearGradient id="nvoWv" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="22"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>' +
    '<mask id="nvoMs" maskUnits="userSpaceOnUse" x="60" y="-30" width="200" height="200"><rect x="60" y="-30" width="200" height="200" fill="url(#nvoWv)"/><rect id="nvoMf" x="60" y="150" width="200" height="40" fill="#fff"/></mask>' +
    '<linearGradient id="nvoSh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF0C0" stop-opacity="0"/><stop offset=".5" stop-color="#FFF4D2" stop-opacity="1"/><stop offset="1" stop-color="#FFF0C0" stop-opacity="0"/></linearGradient>' +
    '<mask id="nvoMl" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="230"><g fill="#fff" clip-path="url(#nvoC)">' + NV_SPRIG + '</g><g fill="#fff">' + NV_NOBLE + '</g></mask></defs>' +
    '<g mask="url(#nvoMs)"><g id="nvoSp" fill="#9DB49A" clip-path="url(#nvoC)">' + NV_SPRIG + '</g></g>' +
    '<g fill="#EFE9DA">' + NV_NOBLE + '</g>' +
    '<g mask="url(#nvoMl)"><rect id="nvoShr" x="-200" y="-10" width="150" height="240" fill="url(#nvoSh)" transform="skewX(-18)" opacity="0"/></g></svg><div class="nvsd" id="nvoSb" style="opacity:0;text-align:center;font-size:' + Math.max(11, Math.round(LW * 0.052)) + 'px">STUDY &amp; DISCIPLESHIP</div></div>';
  document.body.appendChild(el);
  NVO.active = true; NVO.released = false;
  try { localStorage.setItem(NVO_KEY, nvoToday()); } catch (e) {}
  var $ = function (id) { return document.getElementById(id); };
  var eio = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  var cl = function (x, a, b) { return Math.max(0, Math.min(1, (x - a) / (b - a))); };
  var lk = $('nvoLk'), wv = $('nvoWv'), mf = $('nvoMf'), sp = $('nvoSp'), sb = $('nvoSb'), shr = $('nvoShr');
  var TOTAL = reduce ? 1.5 : 4.0, DIS = reduce ? 0.9 : 3.24, end = false;
  function draw(T) {
    var t = T / 2;
    if (reduce) { sp.setAttribute('transform', ''); mf.setAttribute('y', -30); wv.setAttribute('y1', -60); wv.setAttribute('y2', -30); sb.style.opacity = 1; }
    else {
      var e = eio(cl(t, 0.05, 1.1)), edge = 150 - e * 180;
      wv.setAttribute('y1', edge - 22); wv.setAttribute('y2', edge); mf.setAttribute('y', edge);
      var sc = 0.9 + 0.1 * e; sp.setAttribute('transform', 'translate(149 123) scale(' + sc + ') translate(-149 -123)');
      sb.style.opacity = eio(cl(t, 0.05, 1.1));
      var s = eio(cl(t, 1.2, 1.64)); shr.setAttribute('x', -170 + s * 620); shr.setAttribute('opacity', s > 0 && s < 1 ? 1 : 0);
    }
    var d = eio(cl(T, DIS, TOTAL));
    if (d > 0 && !NVO.released) nvoRelease();
    lk.style.transform = 'translateY(' + (-34 * d) + 'px) scale(' + (1 - 0.05 * d) + ')'; lk.style.opacity = 1 - d; lk.style.filter = d > 0.01 ? 'blur(' + (d * 7) + 'px)' : 'none';
    el.style.background = 'rgba(11,12,10,' + (1 - eio(cl(T, DIS + 0.08, TOTAL))) + ')';
  }
  function finish() { end = true; el.style.pointerEvents = 'none'; if (el.parentNode) el.parentNode.removeChild(el); NVO.active = false; nvoRelease(); }
  var start = performance.now(), first = true, skipFrom = null;
  function frame(now) {
    if (end) return;
    var T = (now - start) / 1000;
    if (first) { first = false; if (T > 0.8 && !reduce) { reduce = true; TOTAL = 1.5; DIS = T; } }   // very slow start: just fade
    if (skipFrom !== null) { var k = (now - skipFrom) / 350; if (k >= 1) return finish(); el.style.opacity = 1 - k; if (!NVO.released) nvoRelease(); requestAnimationFrame(frame); return; }
    draw(Math.min(T, TOTAL));
    if (T >= TOTAL) return finish();
    requestAnimationFrame(frame);
  }
  el.addEventListener('click', function () { if (skipFrom === null) skipFrom = performance.now(); });
  draw(0); requestAnimationFrame(frame);
  setTimeout(function () { if (!end) finish(); }, 7000);   // safety net
}

// ---- once a day, on the first opening ----
(function () {
  try {
    if (!nvoOn()) return;
    if (localStorage.getItem(NVO_KEY) === nvoToday()) return;
    var la = +localStorage.getItem('nb-active') || 0;
    if (la && Date.now() - la < 30 * 60 * 1000) return;   // a short trip away: do not interrupt
    nvoPlay();
  } catch (e) {}
})();

// ---- Settings: on/off and "play it now" ----
onReady(function () {
  new MutationObserver(function () {
    var anchor = document.getElementById('sRememberBox') || document.getElementById('sSwipeBox') || (document.getElementById('sTools') && (document.getElementById('sTools').closest('.set') || document.getElementById('sTools').parentNode));
    if (!anchor || document.getElementById('sOpeningBox')) return;
    anchor.insertAdjacentHTML('afterend', '<div class="set" id="sOpeningBox"><div class="set-t">Opening animation</div>' + segBtns('sOpening', [['on', 'On'], ['off', 'Off']], nvoOn() ? 'on' : 'off') +
      '<p class="status">Plays once, the first time you open the app each day. Tap to skip it.</p><div class="actions"><button type="button" class="quiet" id="sOpeningPlay">Play it now</button></div></div>');
    var box = document.getElementById('sOpening');
    box.querySelectorAll('button').forEach(function (bt) {
      bt.onclick = function () {
        var on = bt.dataset.val !== 'off';
        try { localStorage.setItem(NVO_OFF, on ? 'on' : 'off'); } catch (e) {}
        S.opening = on; saveSettings();
        box.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === bt); });
      };
    });
    document.getElementById('sOpeningPlay').onclick = function () { nvoPlay({ preview: true }); };
  }).observe(sheetBody, { childList: true });
});
