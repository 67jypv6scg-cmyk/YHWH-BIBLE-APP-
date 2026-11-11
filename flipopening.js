// Noble Vine Study & Discipleship · 2.11 · Flip-board opening (the airport-board opening from the Noble Vine app)
// Standalone. opening.js hands over to nvoFlip() for the once-a-day opening and "Play it now"; if anything
// here fails, the older opening still plays. Faint tiles flip through the alphabet and settle on the real
// letters of "Noblevine"; the tiles melt away; the sprig and "Study & Discipleship" fade in; it melts into Selah.
'use strict';
var NVF_LETTERS = [{"x": 0.67, "d": "M 42.32 -42.32 L 42.32 0 L 39.82 0 C 38.16 -6.40 35.58 -12.48 32.09 -18.23 C 28.60 -23.98 24.63 -29.43 20.18 -34.59 C 15.73 -39.75 11.14 -44.53 6.40 -48.96 L 6.40 -11.01 C 6.40 -6.89 6.82 -4.14 7.65 -2.73 C 8.48 -1.32 9.73 -0.64 11.40 -0.70 L 11.40 0 L 0 0 L 0 -0.70 C 1.66 -0.64 2.91 -1.32 3.75 -2.73 C 4.58 -4.14 5 -6.89 5 -11.01 L 5 -42.32 C 5 -46.49 4.58 -49.28 3.75 -50.71 C 2.91 -52.15 1.66 -52.82 0 -52.71 L 0 -53.42 L 11.56 -53.42 C 15.41 -49.77 19.18 -45.92 22.87 -41.89 C 26.57 -37.85 29.99 -33.70 33.14 -29.43 C 36.29 -25.16 38.91 -20.82 41 -16.40 L 41 -42.32 C 41 -46.49 40.58 -49.28 39.75 -50.71 C 38.91 -52.15 37.64 -52.82 35.92 -52.71 L 35.92 -53.42 L 47.40 -53.42 L 47.40 -52.71 C 45.68 -52.82 44.41 -52.15 43.57 -50.71 C 42.74 -49.28 42.32 -46.49 42.32 -42.32 Z M 42.32 -42.32 "}, {"x": 45.81, "d": "M 22.25 -42.40 C 19.34 -42.40 16.59 -41.85 14.01 -40.76 C 11.44 -39.67 9.19 -38.14 7.26 -36.18 C 5.33 -34.23 3.82 -31.97 2.73 -29.39 C 1.64 -26.81 1.09 -24.07 1.09 -21.15 C 1.09 -18.25 1.64 -15.50 2.73 -12.92 C 3.82 -10.34 5.33 -8.09 7.26 -6.17 C 9.19 -4.24 11.44 -2.73 14.01 -1.64 C 16.59 -0.54 19.34 0 22.25 0 C 25.16 0 27.91 -0.54 30.48 -1.64 C 33.06 -2.73 35.33 -4.24 37.28 -6.17 C 39.23 -8.09 40.76 -10.34 41.85 -12.92 C 42.95 -15.50 43.5 -18.25 43.5 -21.15 C 43.5 -24.07 42.95 -26.81 41.85 -29.39 C 40.76 -31.97 39.23 -34.23 37.28 -36.18 C 35.33 -38.14 33.06 -39.67 30.48 -40.76 C 27.91 -41.85 25.16 -42.40 22.25 -42.40 Z M 15.70 -39.82 C 18.20 -40.71 20.75 -40.67 23.34 -39.70 C 25.94 -38.74 28.35 -37.06 30.56 -34.67 C 32.78 -32.27 34.48 -29.35 35.68 -25.92 C 36.88 -22.48 37.37 -19.14 37.17 -15.89 C 36.96 -12.64 36.14 -9.81 34.70 -7.42 C 33.27 -5.02 31.33 -3.38 28.89 -2.5 C 26.44 -1.66 23.90 -1.72 21.28 -2.68 C 18.65 -3.65 16.25 -5.33 14.06 -7.73 C 11.87 -10.12 10.15 -13.04 8.90 -16.48 C 7.70 -19.91 7.19 -23.25 7.37 -26.5 C 7.56 -29.75 8.38 -32.58 9.84 -34.98 C 11.30 -37.37 13.25 -38.99 15.70 -39.82 Z M 15.70 -39.82 "}, {"x": 87.97, "d": "M 12.03 -11.01 C 12.03 -9.66 12.14 -8.22 12.37 -6.71 C 12.61 -5.20 13.14 -3.94 13.98 -2.92 C 14.81 -1.91 16.11 -1.40 17.89 -1.40 C 20.64 -1.40 22.97 -2.19 24.90 -3.78 C 26.83 -5.37 28.42 -7.40 29.67 -9.87 C 30.92 -12.35 31.84 -14.94 32.43 -17.64 C 33.03 -20.34 33.36 -22.82 33.42 -25.06 C 33.42 -26.83 33.21 -28.74 32.79 -30.79 C 32.37 -32.85 31.62 -34.67 30.53 -36.26 C 29.43 -37.85 27.84 -38.81 25.76 -39.12 C 23.78 -39.48 21.95 -39.25 20.26 -38.42 C 18.57 -37.58 17.03 -36.46 15.65 -35.06 C 14.28 -33.65 13.07 -32.19 12.03 -30.68 Z M 0 0 L 0 -0.70 C 1.71 -0.64 2.97 -1.32 3.78 -2.73 C 4.59 -4.14 5 -6.89 5 -11.01 L 5 -42.40 C 5 -46.51 4.59 -49.28 3.78 -50.71 C 2.97 -52.15 1.71 -52.82 0 -52.71 L 0 -53.42 C 2.34 -53.42 4.64 -53.89 6.90 -54.82 C 9.17 -55.76 10.88 -57.01 12.03 -58.57 L 12.03 -33.10 C 13.90 -35.71 16.17 -37.91 18.85 -39.70 C 21.53 -41.50 24.51 -42.40 27.79 -42.40 C 30.60 -42.40 32.95 -41.63 34.82 -40.09 C 36.70 -38.56 38.11 -36.53 39.07 -34 C 40.04 -31.47 40.53 -28.73 40.53 -25.76 C 40.53 -22.74 40.07 -19.71 39.15 -16.67 C 38.25 -13.62 36.88 -10.84 35.06 -8.31 C 33.23 -5.78 31 -3.77 28.34 -2.26 C 25.68 -0.75 22.61 0 19.14 0 Z M 0 0 "}, {"x": 128.97, "d": "M 12.03 -11.01 C 12.03 -6.89 12.44 -4.14 13.28 -2.73 C 14.11 -1.32 15.36 -0.64 17.03 -0.70 L 17.03 0 L 0 0 L 0 -0.70 C 1.66 -0.64 2.91 -1.32 3.75 -2.73 C 4.58 -4.14 5 -6.89 5 -11.01 L 5 -42.40 C 5 -46.57 4.58 -49.35 3.75 -50.76 C 2.91 -52.17 1.66 -52.82 0 -52.71 L 0 -53.42 C 2.28 -53.42 4.60 -53.89 6.95 -54.85 C 9.29 -55.82 10.98 -57.06 12.03 -58.57 Z M 12.03 -11.01 "}, {"x": 143.42, "d": "M 22.25 -42.40 C 25.89 -42.40 29.00 -41.54 31.57 -39.82 C 34.16 -38.10 36.14 -35.92 37.51 -33.26 C 38.89 -30.60 39.56 -27.87 39.51 -25.06 C 34.20 -25.06 28.83 -25.06 23.42 -25.06 C 18.01 -25.06 12.65 -25.06 7.34 -25.06 C 7.39 -24.12 7.47 -23.18 7.57 -22.25 C 7.67 -21.31 7.83 -20.35 8.04 -19.37 C 8.77 -16.40 10.00 -13.61 11.75 -11.01 C 13.5 -8.41 15.69 -6.36 18.34 -4.87 C 21 -3.39 23.99 -2.83 27.32 -3.20 C 30.45 -3.56 33.37 -4.85 36.10 -7.06 C 38.84 -9.28 40.86 -12.28 42.17 -16.09 L 42.87 -16.09 C 42.09 -13.01 40.71 -10.26 38.73 -7.84 C 36.75 -5.42 34.34 -3.51 31.5 -2.10 C 28.66 -0.70 25.58 0 22.25 0 C 19.34 0 16.61 -0.54 14.06 -1.64 C 11.50 -2.73 9.25 -4.24 7.29 -6.17 C 5.34 -8.09 3.82 -10.34 2.73 -12.92 C 1.64 -15.50 1.09 -18.25 1.09 -21.15 C 1.09 -24.07 1.64 -26.81 2.73 -29.39 C 3.82 -31.97 5.34 -34.23 7.29 -36.18 C 9.25 -38.14 11.50 -39.67 14.06 -40.76 C 16.61 -41.85 19.34 -42.40 22.25 -42.40 Z M 32.48 -26.46 C 32.11 -30.00 31.03 -32.91 29.23 -35.17 C 27.44 -37.44 25.32 -38.99 22.87 -39.82 C 20.43 -40.66 18.04 -40.66 15.70 -39.82 C 13.25 -38.99 11.30 -37.35 9.84 -34.90 C 8.38 -32.45 7.57 -29.64 7.42 -26.46 Z M 32.48 -26.46 "}, {"x": 202.76, "d": "M 12.26 -38.03 L 23.96 -4.60 L 34.12 -33.5 C 34.64 -34.80 34.67 -36.05 34.20 -37.25 C 34.09 -37.50 33.99 -37.79 33.89 -38.10 C 33.78 -38.42 33.67 -38.70 33.57 -38.96 C 33.21 -40.11 32.64 -40.86 31.89 -41.23 C 31.14 -41.59 30.16 -41.75 28.96 -41.70 L 28.96 -42.40 C 30.84 -42.40 33.03 -42.40 35.53 -42.40 C 38.03 -42.40 40.21 -42.40 42.09 -42.40 L 42.09 -41.70 C 40.84 -41.75 39.82 -41.47 39.04 -40.87 C 38.26 -40.28 37.66 -39.41 37.25 -38.26 L 23.89 0 L 18.20 0 L 4.84 -38.03 C 4.42 -39.22 3.85 -40.14 3.12 -40.79 C 2.39 -41.45 1.35 -41.75 0 -41.70 L 0 -42.40 L 15.39 -42.40 L 15.39 -41.70 C 14.08 -41.75 13.12 -41.49 12.5 -40.92 C 11.87 -40.34 11.79 -39.38 12.26 -38.03 Z M 12.26 -38.03 "}, {"x": 242.2, "d": "M 12.03 -11.01 C 12.03 -6.89 12.44 -4.14 13.28 -2.73 C 14.11 -1.32 15.36 -0.64 17.03 -0.70 L 17.03 0 L 0 0 L 0 -0.70 C 1.66 -0.64 2.91 -1.32 3.75 -2.73 C 4.58 -4.14 5 -6.89 5 -11.01 L 5 -26.15 C 5 -30.32 4.58 -33.11 3.75 -34.54 C 2.91 -35.98 1.66 -36.64 0 -36.54 L 0 -37.25 C 2.28 -37.25 4.60 -37.72 6.95 -38.68 C 9.29 -39.65 10.98 -40.89 12.03 -42.40 Z M 8.51 -53.42 C 9.92 -53.42 11.12 -52.92 12.14 -51.93 C 13.16 -50.94 13.67 -49.75 13.67 -48.34 C 13.67 -46.88 13.16 -45.66 12.14 -44.67 C 11.12 -43.67 9.92 -43.18 8.51 -43.18 C 7.10 -43.18 5.89 -43.67 4.87 -44.67 C 3.86 -45.66 3.35 -46.88 3.35 -48.34 C 3.35 -49.75 3.86 -50.94 4.87 -51.93 C 5.89 -52.92 7.10 -53.42 8.51 -53.42 Z M 8.51 -53.42 "}, {"x": 256.64, "d": "M 48.73 -3.20 C 48.16 -2.05 47.35 -1.23 46.31 -0.73 C 45.26 -0.24 44.17 0 43.03 0 C 40.68 0 38.89 -0.63 37.67 -1.90 C 36.45 -3.18 35.47 -4.73 34.75 -6.56 C 33.60 -9.42 32.75 -12.42 32.20 -15.57 C 31.66 -18.72 31.12 -21.88 30.60 -25.06 C 30.08 -28.23 29.25 -31.25 28.10 -34.12 C 27.32 -36.15 26.31 -37.48 25.06 -38.10 C 23.81 -38.73 22.47 -38.83 21.04 -38.42 C 19.61 -38.00 18.17 -37.17 16.71 -35.92 C 15.83 -35.14 14.98 -34.26 14.17 -33.29 C 13.36 -32.33 12.65 -31.41 12.03 -30.53 L 12.03 -11.01 C 12.03 -6.89 12.44 -4.14 13.28 -2.73 C 14.11 -1.32 15.36 -0.64 17.03 -0.70 L 17.03 0 L 0 0 L 0 -0.70 C 1.66 -0.64 2.91 -1.32 3.75 -2.73 C 4.58 -4.14 5 -6.89 5 -11.01 L 5 -26.15 C 5 -30.32 4.58 -33.11 3.75 -34.54 C 2.91 -35.98 1.66 -36.64 0 -36.54 L 0 -37.25 C 2.28 -37.25 4.60 -37.72 6.95 -38.68 C 9.29 -39.65 10.98 -40.89 12.03 -42.40 L 12.03 -33.03 C 13.17 -34.59 14.43 -36.08 15.81 -37.51 C 17.19 -38.95 18.70 -40.12 20.34 -41.03 C 21.97 -41.94 23.73 -42.40 25.60 -42.40 C 27.42 -42.40 29.13 -41.91 30.71 -40.92 C 32.31 -39.92 33.60 -38.34 34.59 -36.15 C 35.63 -33.96 36.45 -31.46 37.04 -28.65 C 37.64 -25.84 38.18 -22.97 38.65 -20.06 C 39.12 -17.15 39.69 -14.41 40.37 -11.82 C 41.05 -9.25 41.96 -7.08 43.10 -5.31 C 43.62 -4.58 44.35 -3.92 45.29 -3.35 C 46.23 -2.78 47.19 -2.89 48.18 -3.67 Z M 48.73 -3.20 "}, {"x": 302.87, "d": "M 22.25 -42.40 C 25.89 -42.40 29.00 -41.54 31.57 -39.82 C 34.16 -38.10 36.14 -35.92 37.51 -33.26 C 38.89 -30.60 39.56 -27.87 39.51 -25.06 C 34.20 -25.06 28.83 -25.06 23.42 -25.06 C 18.01 -25.06 12.65 -25.06 7.34 -25.06 C 7.39 -24.12 7.47 -23.18 7.57 -22.25 C 7.67 -21.31 7.83 -20.35 8.04 -19.37 C 8.77 -16.40 10.00 -13.61 11.75 -11.01 C 13.5 -8.41 15.69 -6.36 18.34 -4.87 C 21 -3.39 23.99 -2.83 27.32 -3.20 C 30.45 -3.56 33.37 -4.85 36.10 -7.06 C 38.84 -9.28 40.86 -12.28 42.17 -16.09 L 42.87 -16.09 C 42.09 -13.01 40.71 -10.26 38.73 -7.84 C 36.75 -5.42 34.34 -3.51 31.5 -2.10 C 28.66 -0.70 25.58 0 22.25 0 C 19.34 0 16.61 -0.54 14.06 -1.64 C 11.50 -2.73 9.25 -4.24 7.29 -6.17 C 5.34 -8.09 3.82 -10.34 2.73 -12.92 C 1.64 -15.50 1.09 -18.25 1.09 -21.15 C 1.09 -24.07 1.64 -26.81 2.73 -29.39 C 3.82 -31.97 5.34 -34.23 7.29 -36.18 C 9.25 -38.14 11.50 -39.67 14.06 -40.76 C 16.61 -41.85 19.34 -42.40 22.25 -42.40 Z M 32.48 -26.46 C 32.11 -30.00 31.03 -32.91 29.23 -35.17 C 27.44 -37.44 25.32 -38.99 22.87 -39.82 C 20.43 -40.66 18.04 -40.66 15.70 -39.82 C 13.25 -38.99 11.30 -37.35 9.84 -34.90 C 8.38 -32.45 7.57 -29.64 7.42 -26.46 Z M 32.48 -26.46 "}];
var NVF_BOX = [[14.7, 133.9, 47.4, 53.4], [60.9, 144.9, 42.4, 42.4], [102.0, 128.7, 40.5, 58.6], [143.0, 128.7, 17.0, 58.6], [158.5, 144.9, 41.8, 42.4], [216.8, 144.9, 42.1, 42.4], [256.2, 133.9, 17.0, 53.4], [270.6, 144.9, 48.7, 42.4], [318.0, 144.9, 41.8, 42.4]];
var NVF_CHARS = 'Noblevine';

(function () {
  var st = document.createElement('style');
  st.textContent = '@font-face{font-family:"NV Flap";src:url("flap-cormorant-500.woff") format("woff");font-weight:500;font-style:normal;font-display:block}' +
    '#nvOpen .nvf-tile{position:absolute;perspective:260px}' +
    '#nvOpen .nvf-tile .half{position:absolute;left:0;width:100%;height:50%;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;transition:background .3s ease,box-shadow .3s ease}' +
    '#nvOpen .nvf-tile .half.top{top:0;transform-origin:50% 100%;background:linear-gradient(180deg,#171A17,#141714);border-radius:3px 3px 0 0}' +
    '#nvOpen .nvf-tile .half.bot{top:50%;transform-origin:50% 0;background:linear-gradient(180deg,#121412,#0F110F);border-radius:0 0 3px 3px;box-shadow:inset 0 1px 0 #050605}' +
    '#nvOpen .nvf-tile .half.fl{visibility:hidden}' +
    '#nvOpen .nvf-tile .face{position:absolute;left:0;width:100%;height:200%;color:#EFE9DA}' +
    '#nvOpen .nvf-tile .half.top .face{top:0}#nvOpen .nvf-tile .half.bot .face{top:-100%}' +
    '#nvOpen .nvf-tile .face svg{display:block;width:100%;height:100%;overflow:hidden}' +
    '#nvOpen .nvf-tile .face text{fill:#EFE9DA;font-family:"NV Flap",Georgia,serif;font-weight:500}' +
    '#nvOpen .nvf-tile .sh{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none}' +
    '#nvOpen .nvf-board.is-clear .half{background:transparent !important;box-shadow:none !important}' +
    '#nvOpen .nvf-skip{position:absolute;top:calc(14px + env(safe-area-inset-top));right:16px;background:none;border:0;color:#9DB49A;font:500 13px system-ui,sans-serif;letter-spacing:.08em;padding:8px 10px;opacity:.7}';
  document.head.appendChild(st);
})();

function nvoFlip(opts) {
  opts = opts || {};
  if (document.getElementById('nvOpen') || typeof NVO === 'undefined') return false;
  var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var W = Math.min(300, Math.round(Math.min(window.innerWidth, 520) * 0.8)), K = W / 368, X0 = 8, Y0 = 120, Y1 = 214, TH = Y1 - Y0, BASE = 187.3;
  var UP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', LO = 'abcdefghijklmnopqrstuvwxyz';
  var CUT = [12, 61.5, 102.65, 142.75, 159.25, 203, 213, 257.55, 271.9, 318.65, 362];
  var GAP = 95, PAIRS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [6, 7], [7, 8], [8, 9], [9, 10]];
  var el = document.createElement('div'); el.id = 'nvOpen'; el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:fixed;inset:0;z-index:9000;background:#0B0C0A;display:flex;align-items:center;justify-content:center;touch-action:manipulation;cursor:pointer';
  var letters = '';
  NVF_LETTERS.forEach(function (L) { letters += '<g transform="translate(14 128) translate(' + L.x + ' 59.31)"><path d="' + L.d + '"/></g>'; });
  el.innerHTML = '<button type="button" class="nvf-skip" id="nvfSkip">Skip</button>' +
    '<div id="nvfLk" style="position:relative;width:' + W + 'px;display:grid;justify-items:center;margin-top:-6vh;will-change:transform,opacity,filter;color:#EFE9DA">' +
    '<svg width="' + W + '" height="' + (W * 192 / 368) + '" viewBox="8 0 368 192" style="display:block;overflow:visible" aria-hidden="true">' +
    '<defs><clipPath id="nvfC"><rect x="96" y="0" width="106" height="132.4"/></clipPath></defs>' +
    '<g id="nvfSp" opacity="0" fill="currentColor" clip-path="url(#nvfC)">' + NV_SPRIG + '</g>' +
    '<g id="nvfWd" opacity="0" fill="currentColor">' + letters + '</g></svg>' +
    '<div id="nvfBd" class="nvf-board" style="position:absolute;left:0;top:0;width:' + W + 'px;height:' + (W * 192 / 368) + 'px;transition:opacity .14s linear"></div>' +
    '<div class="nvsd" id="nvfTg" style="opacity:0;text-align:center;font-size:' + Math.round(W * 0.043) + 'px;margin-top:8px">STUDY &amp; DISCIPLESHIP</div></div>';
  document.body.appendChild(el);
  NVO.active = true; NVO.released = false;
  try { localStorage.setItem(NVO_KEY, nvoToday()); } catch (e) {}
  var $ = function (id) { return document.getElementById(id); };
  var board = $('nvfBd'), word = $('nvfWd'), sprig = $('nvfSp'), tag = $('nvfTg'), lock = $('nvfLk');
  var clamp = function (x, a, b) { return Math.max(0, Math.min(1, (x - a) / (b - a))); };
  var ease = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  var stopped = false, raf = 0, timers = [], ended = false, skipFrom = null;
  function later(fn, ms) { timers.push(setTimeout(function () { if (!stopped) fn(); }, ms)); }
  function finish() { if (ended) return; ended = true; stopped = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); el.style.pointerEvents = 'none'; if (el.parentNode) el.parentNode.removeChild(el); NVO.active = false; nvoRelease(); }
  function skip() { if (skipFrom !== null || ended) return; skipFrom = performance.now(); stopped = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); nvoRelease(); var f = function (n) { var k = (n - skipFrom) / 350; if (k >= 1) return finish(); el.style.opacity = 1 - k; requestAnimationFrame(f); }; requestAnimationFrame(f); }
  el.addEventListener('click', skip);
  setTimeout(finish, 12000); // safety net

  function face(win, inner) { return '<svg viewBox="' + win.x0 + ' ' + Y0 + ' ' + win.w + ' ' + TH + '" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + inner + '</svg>'; }
  function realLetter(i) { var L = NVF_LETTERS[i]; return '<g fill="currentColor"><g transform="translate(14 128) translate(' + L.x + ' 59.31)"><path d="' + L.d + '"/></g></g>'; }

  // Reduce Motion: the still logo, then on to Selah.
  if (reduce) {
    board.style.opacity = '0'; word.setAttribute('opacity', '1'); sprig.setAttribute('opacity', '1'); tag.style.opacity = '1';
    later(function () { nvoRelease(); lock.style.transition = 'opacity .5s'; lock.style.opacity = '0'; el.style.transition = 'opacity .5s'; el.style.opacity = '0'; setTimeout(finish, 520); }, 1500);
    return true;
  }

  var tiles = PAIRS.map(function (pr, i) {
    var win = { x0: CUT[pr[0]], w: CUT[pr[1]] - CUT[pr[0]], cx: NVF_BOX[i][0] + NVF_BOX[i][2] / 2 };
    var d = document.createElement('div'); d.className = 'nvf-tile';
    d.style.left = (win.x0 - X0) * K + 'px'; d.style.top = Y0 * K + 'px'; d.style.width = win.w * K + 'px'; d.style.height = TH * K + 'px';
    d.innerHTML = '<div class="half top st"><div class="face"></div></div><div class="half bot st"><div class="face"></div></div>' +
      '<div class="half top fl"><div class="face"></div><i class="sh"></i></div><div class="half bot fl"><div class="face"></div><i class="sh"></i></div>';
    board.appendChild(d);
    var ch = NVF_CHARS[i], AL = ch === ch.toUpperCase() ? UP : LO, n = 6 + i + (i > 4 ? 1 : 0), k = AL.indexOf(ch);
    var seq = [' ']; for (var j = n - 1; j >= 1; j--) seq.push(AL[(k - j + 26) % 26]); seq.push('*');
    var times = [], t = i * GAP + (i > 4 ? 40 : 0);
    for (var m = 0; m < seq.length - 1; m++) { var left = seq.length - 2 - m, dd = left === 0 ? 340 : left === 1 ? 240 : left === 2 ? 170 : 120; times.push([t, dd]); t += dd; }
    var q = d.querySelectorAll('.half'), f = d.querySelectorAll('.face'), sh = d.querySelectorAll('.sh');
    return { i: i, win: win, seq: seq, times: times, end: t, st: q[0], sb: q[1], ft: q[2], fb: q[3], fst: f[0], fsb: f[1], fft: f[2], ffb: f[3], sht: sh[0], shb: sh[1], keys: ['', '', '', ''] };
  });
  var settle = Math.max.apply(null, tiles.map(function (T) { return T.end; }));
  function content(T, idx) {
    var c = T.seq[idx];
    if (c === '*') return face(T.win, realLetter(T.i));
    if (c === ' ') return face(T.win, '');
    var upper = NVF_CHARS[T.i] === NVF_CHARS[T.i].toUpperCase();
    return face(T.win, '<text x="' + T.win.cx + '" y="' + BASE + '" font-size="' + (upper ? 85.4 : 110) + '" text-anchor="middle">' + c + '</text>');
  }
  function setFace(T, slot, node, idx) { var key = String(idx); if (T.keys[slot] === key) return; T.keys[slot] = key; node.innerHTML = content(T, idx); }
  function frame(ms) {
    tiles.forEach(function (T) {
      var j = -1, p = 0;
      for (var k = 0; k < T.times.length; k++) { var s = T.times[k][0], d = T.times[k][1]; if (ms >= s && ms < s + d) { j = k; p = (ms - s) / d; break; } }
      if (j < 0) {
        var cur = ms >= T.end ? T.seq.length - 1 : 0;
        setFace(T, 0, T.fst, cur); setFace(T, 1, T.fsb, cur);
        T.ft.style.visibility = 'hidden'; T.fb.style.visibility = 'hidden'; T.st.style.visibility = 'visible'; T.sb.style.visibility = 'visible';
        return;
      }
      var c = j, n = j + 1;
      if (p < .5) {
        setFace(T, 2, T.fft, c); T.ft.style.visibility = 'visible'; T.ft.style.transform = 'rotateX(' + (-180 * p) + 'deg)'; T.fb.style.visibility = 'hidden';
        setFace(T, 0, T.fst, n); T.st.style.visibility = 'visible'; T.sht.style.opacity = (p * 2 * .55).toFixed(3);
        setFace(T, 1, T.fsb, c); T.sb.style.visibility = 'visible';
      } else {
        T.ft.style.visibility = 'hidden'; setFace(T, 3, T.ffb, n); T.fb.style.visibility = 'visible'; T.fb.style.transform = 'rotateX(' + (90 - (p - .5) * 180) + 'deg)';
        setFace(T, 0, T.fst, n); T.st.style.visibility = 'visible';
        setFace(T, 1, T.fsb, c); T.sb.style.visibility = 'visible'; T.shb.style.opacity = ((1 - (p - .5) * 2) * .5).toFixed(3);
      }
    });
  }
  function afterName(T) {
    sprig.setAttribute('opacity', ease(clamp(T, 0, .4)).toFixed(3));
    tag.style.opacity = String(ease(clamp(T, .3, .75)));
    var d = ease(clamp(T, 1.05, 1.65));
    if (d > 0) nvoRelease();
    lock.style.transform = 'translateY(' + (-34 * d) + 'px) scale(' + (1 - .05 * d) + ')';
    lock.style.opacity = String(1 - d);
    lock.style.filter = d > 0.01 ? 'blur(' + (d * 7) + 'px)' : 'none';
    el.style.background = 'rgba(11,12,10,' + (1 - ease(clamp(T, 1.13, 1.65))) + ')';
    return T >= 1.65;
  }
  frame(0);
  later(function () {
    function go() {
      if (stopped) return;
      var s0 = 0;
      function step(now) {
        if (stopped) return;
        if (!s0) s0 = now;
        var ms = now - s0; frame(ms);
        if (ms < settle) { raf = requestAnimationFrame(step); return; }
        frame(settle + 1); board.classList.add('is-clear');
        later(function () {
          word.setAttribute('opacity', '1'); board.style.opacity = '0';
          var s1 = 0;
          function melt(n) { if (stopped) return; if (!s1) s1 = n; if (afterName((n - s1) / 1000)) finish(); else raf = requestAnimationFrame(melt); }
          raf = requestAnimationFrame(melt);
        }, 260);
      }
      raf = requestAnimationFrame(step);
    }
    var fonts = document.fonts;
    if (fonts && fonts.load) Promise.race([fonts.load("500 40px 'NV Flap'"), new Promise(function (r) { setTimeout(r, 1200); })]).then(go, go); else go();
  }, 650);
  return true;
}
