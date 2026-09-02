/* =========================================================================
 * QW.Regions — dünyayı adlandırılmış BÖLGELERE böler
 *
 * Tek bir gürültü alanı, harita ne kadar büyük olursa olsun her yeri
 * birbirine benzetir. Bu katman dünyaya Voronoi hücreleri serper; her hücre
 * kendi adı, iklim eğilimi ve karakteri olan bir "yer"dir. Biyom seçimi bu
 * eğilimlerle sapmaya uğradığı için bölgeler birbirinden ayrı okunur:
 * bir bölge buzul yaylası, komşusu mantar havzasıdır.
 *
 * Ayrıca bölgeler arasındaki dağ duvarlarında GEÇİTLER açılır — büyük
 * haritada yön duygusu veren, adlandırılmış dar koridorlar.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils;

  /* Bölge arketipleri: iklim eğilimi + karakter */
  /* clamp: bölgenin iklimini kendi karakterine hapseden alt/üst sınırlar.
     Sapma tek başına enlem soğumasına ya da sırt gürültüsüne yenilebiliyordu;
     bu sınırlar bölgenin adını taşıdığı biyomu garanti eder. */
  const ARCHETYPES = [
    { id: 'ashflats',  bias: { m: -0.10, t: +0.05, e: -0.05 }, biome: 'plains',
      clamp: { tMin: 0.36, mMin: 0.30, mMax: 0.50, eMin: 0.36, eMax: 0.72 },
      name: { tr: 'Kül Düzlükleri', en: 'Ash Flats' } },
    { id: 'glasssea',  bias: { m: -0.30, t: +0.22, e: -0.02 }, biome: 'desert',
      clamp: { tMin: 0.58, mMax: 0.30, eMin: 0.36, eMax: 0.78 },
      name: { tr: 'Cam Denizi', en: 'The Glass Sea' } },
    { id: 'dunes',     bias: { m: -0.24, t: +0.18, e: +0.02 }, biome: 'desert',
      clamp: { tMin: 0.56, mMax: 0.32, eMin: 0.36, eMax: 0.78 },
      name: { tr: 'Kavrulmuş Kumullar', en: 'Scorched Dunes' } },
    { id: 'frostplat', bias: { m: +0.05, t: -0.34, e: +0.05 }, biome: 'glacier',
      clamp: { tMax: 0.28, eMin: 0.36, eMax: 0.80 },
      name: { tr: 'Don Yaylası', en: 'Frost Plateau' } },
    { id: 'whitewaste',bias: { m: -0.05, t: -0.28, e: -0.02 }, biome: 'glacier',
      clamp: { tMax: 0.30, eMin: 0.36, eMax: 0.78 },
      name: { tr: 'Beyaz Çorak', en: 'The White Waste' } },
    { id: 'mycobasin', bias: { m: +0.26, t: +0.06, e: -0.06 }, biome: 'forest',
      clamp: { tMin: 0.44, mMin: 0.56, mMax: 0.66, eMin: 0.36, eMax: 0.74 },
      name: { tr: 'Miselyum Havzası', en: 'Mycelium Basin' } },
    { id: 'sporewood', bias: { m: +0.22, t: +0.02, e: 0 },     biome: 'forest',
      clamp: { tMin: 0.44, mMin: 0.55, mMax: 0.64, eMin: 0.36, eMax: 0.74 },
      name: { tr: 'Spor Korusu', en: 'Sporewood' } },
    { id: 'rotmarsh',  bias: { m: +0.34, t: +0.12, e: -0.12 }, biome: 'swamp',
      clamp: { tMin: 0.50, mMin: 0.68, eMin: 0.36, eMax: 0.58 },
      name: { tr: 'Çürük Bataklık', en: 'The Rot Marsh' } },
    { id: 'acidfen',   bias: { m: +0.30, t: +0.10, e: -0.10 }, biome: 'swamp',
      clamp: { tMin: 0.50, mMin: 0.68, eMin: 0.36, eMax: 0.58 },
      name: { tr: 'Asit Fenni', en: 'Acid Fen' } },
    { id: 'riftlands', bias: { m: -0.06, t: +0.02, e: +0.14 }, biome: 'canyon', rugged: 1,
      clamp: { eMin: 0.44, eMax: 0.80, rgMin: 0.90 },
      name: { tr: 'Yarık Toprakları', en: 'The Riftlands' } },
    { id: 'brokenspur',bias: { m: -0.10, t: -0.04, e: +0.18 }, biome: 'canyon', rugged: 1,
      clamp: { eMin: 0.44, eMax: 0.80, rgMin: 0.90 },
      name: { tr: 'Kırık Mahmuz', en: 'Broken Spur' } },
    { id: 'ironridge', bias: { m: -0.08, t: -0.06, e: +0.24 }, biome: 'mountain', rugged: 1.3,
      clamp: { eMin: 0.62, rgMin: 0.90 },
      name: { tr: 'Demir Sırt', en: 'Iron Ridge' } },
    { id: 'shorelands',bias: { m: +0.10, t: +0.06, e: -0.20 }, biome: 'shore',
      clamp: { tMin: 0.40, eMin: 0.29, eMax: 0.335, mMax: 0.62 },
      name: { tr: 'Tuz Kıyıları', en: 'The Salt Shores' } },
    { id: 'stillwater',bias: { m: +0.14, t: +0.04, e: -0.26 }, biome: 'shore',
      clamp: { tMin: 0.40, eMin: 0.29, eMax: 0.335, mMax: 0.62 },
      name: { tr: 'Durgun Su', en: 'Stillwater' } },
    { id: 'graypan',   bias: { m: -0.02, t: 0, e: -0.04 },     biome: 'plains',
      clamp: { tMin: 0.36, mMin: 0.32, mMax: 0.50, eMin: 0.36, eMax: 0.72 },
      name: { tr: 'Gri Tava', en: 'The Grey Pan' } },
    { id: 'lastfield', bias: { m: +0.06, t: +0.02, e: -0.03 }, biome: 'plains',
      clamp: { tMin: 0.36, mMin: 0.32, mMax: 0.50, eMin: 0.36, eMax: 0.72 },
      name: { tr: 'Son Tarla', en: 'The Last Field' } }
  ];

  const R = QW.Regions = { cells: [], passes: [], _grid: null, _gw: 0, _cell: 24 };

  /* ------------------------------------------------------------------
   * ÜRETİM — Voronoi hücreleri + geçitler
   * ---------------------------------------------------------------- */
  R.generate = function (seed, W, H) {
    const rnd = U.rng(seed ^ 0x5eed1e);
    R.cells = [];
    R.passes = [];

    /* Poisson benzeri dağılım: hücreler birbirine çok yaklaşmasın */
    const target = Math.max(10, Math.round((W * H) / (150 * 150)));
    const minDist = Math.sqrt((W * H) / target) * 0.62;
    const pts = [];
    let guard = 0;
    while (pts.length < target && guard++ < target * 400) {
      const x = 20 + rnd() * (W - 40), y = 20 + rnd() * (H - 40);
      if (pts.every(p => U.dist(p.x, p.y, x, y) > minDist)) pts.push({ x, y });
    }

    /* Arketipleri çeşitliliği koruyacak biçimde dağıt */
    const bag = [];
    while (bag.length < pts.length) {
      rnd.shuffle(ARCHETYPES).forEach(a => { if (bag.length < pts.length) bag.push(a); });
    }

    pts.forEach((p, i) => {
      const arch = bag[i];
      R.cells.push({
        i, x: p.x, y: p.y, arch,
        name: arch.name,
        /* Aynı arketip iki kez düşerse ikincisi "Alt" olarak ayrışır */
        rugged: arch.rugged || 0
      });
    });

    /* Aynı isimden birden fazla varsa numaralandır */
    const seen = {};
    R.cells.forEach(c => {
      const k = c.arch.id;
      seen[k] = (seen[k] || 0) + 1;
      if (seen[k] > 1) {
        c.name = { tr: QW.L(c.arch.name) + ' ' + romans(seen[k]),
                   en: QW.L(c.arch.name) + ' ' + romans(seen[k]) };
      }
    });

    buildGrid(W, H);
    buildPasses(rnd, W, H);
    buildPassGrid();
    return R.cells;
  };

  function romans(n) { return ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][n] || String(n); }

  /* Hücre araması her tile için pahalı olurdu; kaba bir ızgara önbelleklenir */
  function buildGrid(W, H) {
    const CS = R._cell;
    const gw = Math.ceil(W / CS), gh = Math.ceil(H / CS);
    const grid = new Int16Array(gw * gh);
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const x = gx * CS + CS / 2, y = gy * CS + CS / 2;
        let best = 0, bd = Infinity;
        for (let i = 0; i < R.cells.length; i++) {
          const d = U.dist2(R.cells[i].x, R.cells[i].y, x, y);
          if (d < bd) { bd = d; best = i; }
        }
        grid[gy * gw + gx] = best;
      }
    }
    R._grid = grid; R._gw = gw; R._gh = gh;
  }

  /* Komşu hücre çiftleri arasında birer geçit noktası işaretle */
  function buildPasses(rnd, W, H) {
    const pairs = {};
    const CS = R._cell;
    for (let gy = 1; gy < R._gh; gy++) {
      for (let gx = 1; gx < R._gw; gx++) {
        const a = R._grid[gy * R._gw + gx];
        const b = R._grid[gy * R._gw + gx - 1];
        const c = R._grid[(gy - 1) * R._gw + gx];
        [[a, b], [a, c]].forEach(([p, q]) => {
          if (p === q) return;
          const key = Math.min(p, q) + ':' + Math.max(p, q);
          if (!pairs[key]) pairs[key] = [];
          pairs[key].push({ x: gx * CS + CS / 2, y: gy * CS + CS / 2 });
        });
      }
    }
    /* Her sınır bir geçit olmamalı: yalnızca engebeli bölgelere komşu olan,
       yani gerçekten "duvarı delen" sınırlar adlandırılır. Sayı da sınırlıdır,
       yoksa harita listesi anlamsız biçimde şişer. */
    const cand = [];
    Object.keys(pairs).forEach(key => {
      const pts = pairs[key];
      if (pts.length < 3) return;
      const [a, b] = key.split(':').map(Number);
      const rug = (R.cells[a].rugged || 0) + (R.cells[b].rugged || 0);
      if (rug <= 0) return;                     // düz araziler arası sınır geçit değildir
      const mid = pts[Math.floor(pts.length / 2)];
      cand.push({ x: Math.round(mid.x), y: Math.round(mid.y), a, b, r: 5, rug, span: pts.length });
    });
    cand.sort((p, q) => (q.rug - p.rug) || (q.span - p.span));
    cand.slice(0, 14).forEach(ps => {
      ps.name = {
        tr: QW.L(R.cells[ps.a].name) + ' – ' + QW.L(R.cells[ps.b].name) + ' Geçidi',
        en: QW.L(R.cells[ps.a].name) + ' – ' + QW.L(R.cells[ps.b].name) + ' Pass'
      };
      R.passes.push(ps);
    });
  }

  /* ------------------------------------------------------------------
   * SORGU
   * ---------------------------------------------------------------- */
  R.at = function (tx, ty) {
    if (!R._grid) return null;
    const CS = R._cell;
    const gx = U.clamp(Math.floor(tx / CS), 0, R._gw - 1);
    const gy = U.clamp(Math.floor(ty / CS), 0, R._gh - 1);
    return R.cells[R._grid[gy * R._gw + gx]] || null;
  };

  R.nameAt = function (tx, ty) {
    const c = R.at(tx, ty);
    return c ? QW.L(c.name) : '';
  };

  /* Geçit yakınında mıyız? Geçitler dağ duvarını delen tek yoldur.
     Her tile için 14 geçidi taramak chunk üretimini yavaşlatıyordu; kaba bir
     uzamsal tabloyla çoğu tile tek bir sözlük aramasıyla elenir. */
  const PCS = 16;                 // geçit tablosu hücre boyu
  R._pgrid = null;

  function buildPassGrid() {
    const g = new Map();
    R.passes.forEach(p => {
      const rad = p.r + 2;
      const x0 = Math.floor((p.x - rad) / PCS), x1 = Math.floor((p.x + rad) / PCS);
      const y0 = Math.floor((p.y - rad) / PCS), y1 = Math.floor((p.y + rad) / PCS);
      for (let gy = y0; gy <= y1; gy++) {
        for (let gx = x0; gx <= x1; gx++) {
          const k = gx + ',' + gy;
          if (!g.has(k)) g.set(k, []);
          g.get(k).push(p);
        }
      }
    });
    R._pgrid = g;
  }

  R.passNear = function (tx, ty, extra) {
    if (!R._pgrid) return null;
    const list = R._pgrid.get(Math.floor(tx / PCS) + ',' + Math.floor(ty / PCS));
    if (!list) return null;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (U.dist(tx, ty, p.x, p.y) <= p.r + (extra || 0)) return p;
    }
    return null;
  };

  /* Bölgenin iklim sapması — world.js biyom seçiminde kullanır */
  R.biasAt = function (tx, ty) {
    const c = R.at(tx, ty);
    return c ? c.arch.bias : null;
  };

  R.clampAt = function (tx, ty) {
    const c = R.at(tx, ty);
    return c ? (c.arch.clamp || null) : null;
  };

  R.serialize = () => ({ n: R.cells.length });
  R.ARCHETYPES = ARCHETYPES;

})(window.QW);
