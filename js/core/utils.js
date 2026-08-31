/* =========================================================================
 * QW.Utils — matematik, rastgelelik, Perlin gürültüsü, yardımcı fonksiyonlar
 * Bu dosya global `QW` ad alanını (namespace) oluşturur.
 * ========================================================================= */
window.QW = window.QW || {};

(function (QW) {
  'use strict';

  const U = QW.Utils = {};

  /* ---------------- temel matematik ---------------- */
  U.clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.inv = (a, b, v) => (b - a) === 0 ? 0 : (v - a) / (b - a);
  U.smooth = t => t * t * (3 - 2 * t);
  U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  U.dist2 = (x1, y1, x2, y2) => (x2 - x1) ** 2 + (y2 - y1) ** 2;
  U.approach = (cur, target, step) =>
    cur < target ? Math.min(cur + step, target) : Math.max(cur - step, target);

  /* ---------------- deterministik RNG (mulberry32) ---------------- */
  U.rng = function (seed) {
    let a = seed >>> 0;
    const f = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.int = (n) => Math.floor(f() * n);
    f.range = (a2, b2) => a2 + f() * (b2 - a2);
    f.irange = (a2, b2) => a2 + Math.floor(f() * (b2 - a2 + 1));
    f.pick = arr => arr[Math.floor(f() * arr.length)];
    f.chance = p => f() < p;
    f.shuffle = arr => {
      const c = arr.slice();
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(f() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    };
    return f;
  };

  /* Global oyun rastgeleliği (savaş, loot vb. — dünya üretimi kendi RNG'sini kullanır) */
  U.rand = Math.random;
  U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  U.chance = p => Math.random() < p;
  U.irange = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  U.roll = (n, sides) => { let s = 0; for (let i = 0; i < n; i++) s += 1 + Math.floor(Math.random() * sides); return s; };

  /* ---------------- 32-bit hash (string -> seed) ---------------- */
  U.hash = function (str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  /* İki tam sayıdan deterministik 0..1 değeri (tile detayları için) */
  U.hash2 = function (x, y, seed) {
    let h = (x * 374761393 + y * 668265263 + (seed | 0) * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  /* ---------------- Perlin / değer gürültüsü ---------------- */
  U.Perlin = function (seed) {
    const rnd = U.rng(seed);
    const p = new Uint8Array(512);
    const perm = [];
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const grad = (h, x, y) => {
      switch (h & 7) {
        case 0: return  x + y; case 1: return  x - y;
        case 2: return -x + y; case 3: return -x - y;
        case 4: return  x;     case 5: return -x;
        case 6: return  y;     default: return -y;
      }
    };

    const noise2 = function (x, y) {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
      const xf = x - Math.floor(x), yf = y - Math.floor(y);
      const u = fade(xf), v = fade(yf);
      const aa = p[p[X] + Y], ab = p[p[X] + Y + 1];
      const ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
      const x1 = U.lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
      const x2 = U.lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
      return U.lerp(x1, x2, v); // ~ -1..1
    };

    /* Fraktal Brown hareketi — büyük, tekrarsız araziler için */
    const fbm = function (x, y, oct, lac, gain) {
      oct = oct || 4; lac = lac || 2.0; gain = gain || 0.5;
      let amp = 1, freq = 1, sum = 0, norm = 0;
      for (let i = 0; i < oct; i++) {
        sum += noise2(x * freq, y * freq) * amp;
        norm += amp; amp *= gain; freq *= lac;
      }
      return sum / norm; // ~ -1..1
    };

    return {
      noise2,
      fbm,
      /* 0..1 aralığına normalize edilmiş fbm */
      n01: (x, y, oct, lac, gain) => U.clamp(fbm(x, y, oct, lac, gain) * 0.5 + 0.5, 0, 1),
      /* Sırt/kanyon gürültüsü — keskin hatlar üretir */
      ridge: (x, y, oct) => {
        let amp = 1, freq = 1, sum = 0, norm = 0;
        for (let i = 0; i < (oct || 4); i++) {
          sum += (1 - Math.abs(noise2(x * freq, y * freq))) * amp;
          norm += amp; amp *= 0.5; freq *= 2;
        }
        return sum / norm;
      }
    };
  };

  /* ---------------- renk yardımcıları ---------------- */
  U.hex = function (r, g, b) {
    return '#' + ((1 << 24) + (U.clamp(r | 0, 0, 255) << 16) + (U.clamp(g | 0, 0, 255) << 8) + U.clamp(b | 0, 0, 255)).toString(16).slice(1);
  };
  U.parseHex = function (h) {
    const s = h.replace('#', '');
    const n = parseInt(s.length === 3 ? s.split('').map(c => c + c).join('') : s, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.shade = function (hexc, amt) { // amt: -1..1
    const [r, g, b] = U.parseHex(hexc);
    const f = amt < 0 ? (1 + amt) : 1;
    const add = amt > 0 ? amt * 255 : 0;
    return U.hex(r * f + add, g * f + add, b * f + add);
  };
  U.mixHex = function (a, b, t) {
    const A = U.parseHex(a), B = U.parseHex(b);
    return U.hex(U.lerp(A[0], B[0], t), U.lerp(A[1], B[1], t), U.lerp(A[2], B[2], t));
  };

  /* ---------------- çeşitli ---------------- */
  U.now = () => performance.now();
  U.pad2 = n => (n < 10 ? '0' : '') + n;
  U.uid = (() => { let i = 0; return (p) => (p || 'id') + '_' + (++i); })();
  U.deepCopy = o => JSON.parse(JSON.stringify(o));

  /* Dokunmatik + fare uyumlu tıklama bağlayıcı.
     touchstart anında tepki verir (mobilde 300 ms gecikme olmaz), ardından
     gelen sentetik click yok sayılır; farede normal click çalışır. */
  U.tap = function (node, fn) {
    let last = 0;
    const run = e => { e.preventDefault(); e.stopPropagation(); fn(e); };
    node.addEventListener('touchstart', e => { last = Date.now(); run(e); }, { passive: false });
    node.addEventListener('click', e => { if (Date.now() - last < 700) return; run(e); });
    return node;
  };

  /* Basit olay yayıcı — modüller arası gevşek bağ için */
  U.Emitter = function () {
    const map = {};
    return {
      on(ev, fn) { (map[ev] = map[ev] || []).push(fn); return () => this.off(ev, fn); },
      off(ev, fn) { if (map[ev]) map[ev] = map[ev].filter(f => f !== fn); },
      emit(ev, ...a) { (map[ev] || []).forEach(f => { try { f(...a); } catch (e) { console.error(e); } }); }
    };
  };

  QW.bus = U.Emitter();

})(window.QW);
