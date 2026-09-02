/* =========================================================================
 * QW.Path — ızgara tabanlı A* yol bulma
 *
 * Düşmanlar daha önce hedefe doğru düz yürüyüp engele çarpınca hızlarını
 * ters çeviriyordu; kıyı, uçurum ve kanyon kenarlarında sürekli takılıp
 * kalıyorlardı. Bu modül engelin etrafından dolaşan bir yol üretir.
 *
 * Arama düğüm sayısıyla sınırlıdır (varsayılan 600): uzun mesafede tam yol
 * yerine en umut verici düğüme kadar olan kısmi yol döner, bu da yaratığın
 * doğru yöne ilerlemesi için yeterlidir ve kare bütçesini korur.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils;

  /* --- ikili yığın (min-heap): açık listenin en ucuz düğümünü verir --- */
  function Heap() {
    const a = [];
    return {
      get size() { return a.length; },
      push(node) {
        a.push(node);
        let i = a.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (a[p].f <= a[i].f) break;
          const t = a[p]; a[p] = a[i]; a[i] = t; i = p;
        }
      },
      pop() {
        const top = a[0], last = a.pop();
        if (a.length) {
          a[0] = last;
          let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = l + 1;
            let m = i;
            if (l < a.length && a[l].f < a[m].f) m = l;
            if (r < a.length && a[r].f < a[m].f) m = r;
            if (m === i) break;
            const t = a[m]; a[m] = a[i]; a[i] = t; i = m;
          }
        }
        return top;
      }
    };
  }

  const DIRS = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]
  ];

  const P = QW.Path = { lastNodes: 0 };

  /* Sekizgen mesafe — köşegen hareketi olan ızgarada kabul edilebilir sezgisel */
  function heuristic(ax, ay, bx, by) {
    const dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
    return (dx + dy) + (1.414 - 2) * Math.min(dx, dy);
  }

  /**
   * @param {number} sx,sy  başlangıç tile
   * @param {number} gx,gy  hedef tile
   * @param {object} caps   araç yetenekleri (uçuş engelleri kaldırır)
   * @param {object} opt    { maxNodes, maxRange }
   * @returns {Array<{x,y}>|null} tile listesi (başlangıç hariç) ya da null
   */
  P.find = function (sx, sy, gx, gy, caps, opt) {
    opt = opt || {};
    const maxNodes = opt.maxNodes || 600;
    const maxRange = opt.maxRange || 40;
    const W = QW.World;

    if (sx === gx && sy === gy) return [];
    if (heuristic(sx, sy, gx, gy) > maxRange * 1.5) return null;

    const open = Heap();
    const seen = new Map();          // key -> {g, px, py, closed}
    const key = (x, y) => x * 100000 + y;

    const startKey = key(sx, sy);
    seen.set(startKey, { g: 0, px: -1, py: -1, closed: false });
    open.push({ x: sx, y: sy, f: heuristic(sx, sy, gx, gy) });

    let nodes = 0;
    let best = { x: sx, y: sy, h: heuristic(sx, sy, gx, gy) };
    let found = false;

    while (open.size && nodes < maxNodes) {
      const cur = open.pop();
      const ck = key(cur.x, cur.y);
      const rec = seen.get(ck);
      if (!rec || rec.closed) continue;
      rec.closed = true;
      nodes++;

      if (cur.x === gx && cur.y === gy) { found = true; break; }

      const h = heuristic(cur.x, cur.y, gx, gy);
      if (h < best.h) best = { x: cur.x, y: cur.y, h };

      for (let d = 0; d < DIRS.length; d++) {
        const nx = cur.x + DIRS[d][0], ny = cur.y + DIRS[d][1];
        if (Math.abs(nx - sx) > maxRange || Math.abs(ny - sy) > maxRange) continue;
        if (!W.canWalk(nx, ny, caps)) continue;
        /* Köşegen geçişte iki komşunun da açık olması gerekir — köşe kesilmez */
        if (DIRS[d][0] && DIRS[d][1]) {
          if (!W.canWalk(cur.x + DIRS[d][0], cur.y, caps)) continue;
          if (!W.canWalk(cur.x, cur.y + DIRS[d][1], caps)) continue;
        }
        const nk = key(nx, ny);
        const ng = rec.g + DIRS[d][2] * terrainCost(nx, ny, caps);
        const old = seen.get(nk);
        if (old && ng >= old.g) continue;
        seen.set(nk, { g: ng, px: cur.x, py: cur.y, closed: false });
        open.push({ x: nx, y: ny, f: ng + heuristic(nx, ny, gx, gy) });
      }
    }

    P.lastNodes = nodes;

    /* Hedefe varılamadıysa hedefe en çok yaklaşan düğüme kadar yürü */
    const endX = found ? gx : best.x, endY = found ? gy : best.y;
    if (endX === sx && endY === sy) return null;

    const path = [];
    let cx = endX, cy = endY, guard = 0;
    while (guard++ < maxNodes + 4) {
      path.push({ x: cx, y: cy });
      const r = seen.get(key(cx, cy));
      if (!r || r.px < 0) break;
      cx = r.px; cy = r.py;
    }
    path.pop();          // başlangıç düğümünü at
    path.reverse();
    return path.length ? path : null;
  };

  /* Bataklık ve gevşek kum yavaşlatır — yol bulucu bunlardan kaçınmayı tercih eder */
  function terrainCost(tx, ty, caps) {
    const b = QW.World.biomeAt(tx, ty);
    if (b.t === QW.World.T.SWAMP) return caps && caps.allTerrain ? 1 : 2.2;
    if (b.t === QW.World.T.SAND) return caps && caps.allTerrain ? 1 : 1.3;
    return 1;
  }

  /* Düz görüş hattı — açıkken yol bulmaya hiç gerek yoktur */
  P.lineOfSight = function (sx, sy, gx, gy, caps) {
    let x = sx, y = sy;
    const dx = Math.abs(gx - sx), dy = Math.abs(gy - sy);
    const stepX = sx < gx ? 1 : -1, stepY = sy < gy ? 1 : -1;
    let err = dx - dy, guard = 0;
    while (guard++ < 64) {
      if (x === gx && y === gy) return true;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += stepX; }
      if (e2 < dx) { err += dx; y += stepY; }
      if (!QW.World.canWalk(x, y, caps)) return false;
    }
    return false;
  };

})(window.QW);
