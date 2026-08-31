/* =========================================================================
 * QW.Pixel — piksel çizim yardımcıları, ekran ölçekleme, 3x5 bitmap font
 * Tüm çizim tamsayı koordinatlarda yapılır; smoothing kapalıdır.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const P = QW.Pixel = {};
  const U = QW.Utils;

  P.canvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0);
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return c;
  };
  P.ctx = function (c) {
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return x;
  };

  /* --------------------------------------------------------------
   * Ekran — iç çözünürlük cihaz oranına göre hesaplanır, CSS ölçekler
   * -------------------------------------------------------------- */
  const S = P.Screen = {
    cv: null, ctx: null, w: 320, h: 180, scale: 1, portrait: false
  };

  S.attach = function (canvas) {
    S.cv = canvas;
    S.ctx = P.ctx(canvas);
    S.resize();
    window.addEventListener('resize', S.resize);
    window.addEventListener('orientationchange', () => setTimeout(S.resize, 120));
  };

  S.resize = function () {
    const vw = window.innerWidth, vh = window.innerHeight;
    const aspect = vw / vh;
    S.portrait = aspect < 1;
    /* Kısa kenarı ~168-200 piksel tutarak gerçek 8-bit yoğunluğu koru */
    let h, w;
    if (S.portrait) {
      w = 200;
      h = Math.round(w / aspect);
      if (h > 400) { h = 400; w = Math.round(h * aspect); }
    } else {
      h = 180;
      w = Math.round(h * aspect);
      if (w > 480) { w = 480; h = Math.round(w / aspect); }
    }
    w = Math.max(160, Math.min(520, w | 0));
    h = Math.max(140, Math.min(460, h | 0));
    if (S.cv.width !== w || S.cv.height !== h) {
      S.cv.width = w; S.cv.height = h;
      S.ctx = P.ctx(S.cv);
    }
    S.w = w; S.h = h;
    S.scale = Math.min(vw / w, vh / h);
    QW.bus.emit('resize', w, h);
  };

  /* --------------------------------------------------------------
   * Çizim yardımcıları
   * -------------------------------------------------------------- */
  P.rect = function (ctx, x, y, w, h, col) {
    ctx.fillStyle = col; ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  };
  P.frame = function (ctx, x, y, w, h, col, t) {
    t = t || 1; ctx.fillStyle = col;
    ctx.fillRect(x | 0, y | 0, w | 0, t);
    ctx.fillRect(x | 0, (y + h - t) | 0, w | 0, t);
    ctx.fillRect(x | 0, y | 0, t, h | 0);
    ctx.fillRect((x + w - t) | 0, y | 0, t, h | 0);
  };
  P.dot = function (ctx, x, y, col) { ctx.fillStyle = col; ctx.fillRect(x | 0, y | 0, 1, 1); };

  /* Bayer 4x4 tarama — biyom geçişlerini dikişsiz harmanlar */
  const BAYER4 = [
    [0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]
  ];
  P.bayer = function (x, y) { return BAYER4[y & 3][x & 3] / 16; };

  /* Elips / daire (piksel) */
  P.circle = function (ctx, cx, cy, r, col) {
    ctx.fillStyle = col;
    for (let y = -r; y <= r; y++) {
      const dx = Math.floor(Math.sqrt(r * r - y * y));
      ctx.fillRect((cx - dx) | 0, (cy + y) | 0, dx * 2 + 1, 1);
    }
  };

  /* --------------------------------------------------------------
   * 3x5 bitmap font — canvas üstü küçük etiketler ve hasar sayıları
   * -------------------------------------------------------------- */
  const F = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111',
    '3': '111001111001111', '4': '101101111001001', '5': '111100111001111',
    '6': '111100111101111', '7': '111001001001001', '8': '111101111101111',
    '9': '111101111001111',
    'A': '111101111101101', 'B': '110101110101110', 'C': '111100100100111',
    'D': '110101101101110', 'E': '111100110100111', 'F': '111100110100100',
    'G': '111100101101111', 'H': '101101111101101', 'I': '111010010010111',
    'J': '001001001101111', 'K': '101101110101101', 'L': '100100100100111',
    'M': '101111111101101', 'N': '110101101101101', 'O': '111101101101111',
    'P': '111101111100100', 'Q': '111101101111011', 'R': '110101110101101',
    'S': '111100111001111', 'T': '111010010010010', 'U': '101101101101111',
    'V': '101101101101010', 'W': '101101111111101', 'X': '101101010101101',
    'Y': '101101111010010', 'Z': '111001010100111',
    '+': '000010111010000', '-': '000000111000000', '!': '010010010000010',
    '.': '000000000000010', ':': '000010000010000', '%': '101001010100101',
    '/': '001001010100100', '?': '111001011000010', '*': '101010101000000',
    ' ': '000000000000000', '#': '101111101111101', '>': '100010001010100',
    '<': '001010100010001', '=': '000111000111000'
  };

  P.text = function (ctx, str, x, y, col, scale, shadow) {
    scale = scale || 1;
    str = String(str).toUpperCase();
    let cx = x | 0;
    for (let i = 0; i < str.length; i++) {
      const g = F[str[i]];
      if (g) {
        for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
          if (g[r * 3 + c] === '1') {
            if (shadow) { ctx.fillStyle = shadow; ctx.fillRect(cx + c * scale + scale, y + r * scale + scale, scale, scale); }
          }
        }
        ctx.fillStyle = col;
        for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
          if (g[r * 3 + c] === '1') ctx.fillRect(cx + c * scale, y + r * scale, scale, scale);
        }
      }
      cx += 4 * scale;
    }
    return cx - x;
  };
  P.textW = (str, scale) => String(str).length * 4 * (scale || 1) - (scale || 1);

  /* --------------------------------------------------------------
   * Önbellekli sprite üretici — aynı parametre ile bir kez çizer
   * -------------------------------------------------------------- */
  const cache = new Map();
  P.cached = function (key, w, h, drawFn) {
    let c = cache.get(key);
    if (!c) { c = P.canvas(w, h); drawFn(P.ctx(c), c); cache.set(key, c); }
    return c;
  };
  P.clearCache = function (prefix) {
    if (!prefix) { cache.clear(); return; }
    for (const k of Array.from(cache.keys())) if (k.indexOf(prefix) === 0) cache.delete(k);
  };

})(window.QW);
