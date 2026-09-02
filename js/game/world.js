/* =========================================================================
 * QW.World — Perlin tabanlı devasa harita, biyomlar, chunk çizimi, POI'ler
 *
 * Harita "tile" ızgarasına oturur ama görsel olarak dikişsizdir: tüm doku
 * gürültüsü DÜNYA piksel koordinatından türetilir, bu yüzden tile sınırında
 * tekrar eden bir desen ya da kopukluk oluşmaz. Biyom sınırları Bayer
 * taramasıyla harmanlanır.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils, P = QW.Pixel;

  const TILE = 16;         // piksel / tile
  const CH = 16;           // tile / chunk
  const CHPX = TILE * CH;  // 256 px
  const W = 832, H = 832;  // dünya boyu (tile) — ~4.7x alan

  /* Geçilebilirlik türleri */
  const T = { WALK: 0, WATER: 1, ROCK: 2, CHASM: 3, SWAMP: 4, SAND: 5, RUIN: 6 };

  const BIOMES = {
    sea:      { key: 'sea',      t: T.WATER, base: '#16324f', alt: '#1d4a72', det: '#3f8fb8', name: 'b_sea' },
    shore:    { key: 'shore',    t: T.WALK,  base: '#c2b083', alt: '#ac9a70', det: '#ded0a6', name: 'b_shore' },
    desert:   { key: 'desert',   t: T.SAND,  base: '#d6bf85', alt: '#c1a86c', det: '#efe6c2', name: 'b_desert' },
    plains:   { key: 'plains',   t: T.WALK,  base: '#6d7360', alt: '#5b6150', det: '#8a9077', name: 'b_plains' },
    forest:   { key: 'forest',   t: T.WALK,  base: '#3d5645', alt: '#324a3a', det: '#7d5aa0', name: 'b_forest' },
    glacier:  { key: 'glacier',  t: T.WALK,  base: '#cbe2f0', alt: '#b2d0e4', det: '#8fbcd8', name: 'b_glacier' },
    swamp:    { key: 'swamp',    t: T.SWAMP, base: '#46543a', alt: '#3a4a30', det: '#89b444', name: 'b_swamp' },
    canyon:   { key: 'canyon',   t: T.WALK,  base: '#8a5c3c', alt: '#754a2f', det: '#a97a52', name: 'b_canyon' },
    chasm:    { key: 'chasm',    t: T.CHASM, base: '#140f0c', alt: '#241a14', det: '#3a2a20', name: 'b_canyon' },
    mountain: { key: 'mountain', t: T.ROCK,  base: '#79808e', alt: '#666d7b', det: '#98a0ae', name: 'b_mountain' },
    wreck:    { key: 'wreck',    t: T.WALK,  base: '#5c6270', alt: '#4a5060', det: '#8a94a8', name: 'b_wreck' }
  };

  const Wd = QW.World = {
    TILE, CH, CHPX, W, H, T, BIOMES,
    seed: 0, spawn: { x: 0, y: 0 },
    pois: [], nodes: {}, harvested: {}, discovered: {},
    day: 1, time: 0.32,      // 0..1 (0 = gece yarısı, 0.5 = öğlen)
    _chunks: new Map(), _order: [],
    _biomeCache: new Map()
  };

  let nElev, nMoist, nTemp, nRidge, nDet;

  /* ---------------------------------------------------------------
   * ÜRETİM
   * ------------------------------------------------------------- */
  Wd.generate = function (seed) {
    Wd.seed = seed >>> 0;
    nElev  = U.Perlin(Wd.seed);
    nMoist = U.Perlin(Wd.seed ^ 0x9e3779b9);
    nTemp  = U.Perlin(Wd.seed ^ 0x85ebca6b);
    nRidge = U.Perlin(Wd.seed ^ 0xc2b2ae35);
    nDet   = U.Perlin(Wd.seed ^ 0x27d4eb2f);
    Wd._chunks.clear(); Wd._order.length = 0; Wd._biomeCache.clear();
    Wd.harvested = {}; Wd.discovered = {}; Wd.beacons = [];
    Wd.day = 1; Wd.time = 0.32;
    /* Bölgeler biyomlardan ÖNCE üretilir: biyom seçimi onların sapmasını okur */
    QW.Regions.generate(Wd.seed, W, H);
    placeSpawn();
    placePOIs();
  };

  /* Enkaz için yürünebilir, denizden uzak bir başlangıç bul */
  function placeSpawn() {
    const rnd = U.rng(Wd.seed ^ 0xabcdef);
    let best = { x: W >> 1, y: H >> 1 }, tries = 0;
    while (tries++ < 400) {
      const x = Math.floor(W * 0.3 + rnd() * W * 0.4);
      const y = Math.floor(H * 0.3 + rnd() * H * 0.4);
      const b = rawBiome(x, y);
      if (b.t === T.WALK && b.key !== 'glacier') {
        let open = true;
        for (let dy = -3; dy <= 3 && open; dy++) for (let dx = -3; dx <= 3; dx++) {
          const bb = rawBiome(x + dx, y + dy);
          if (bb.t !== T.WALK && bb.t !== T.SAND) { open = false; break; }
        }
        if (open) { best = { x, y }; break; }
      }
    }
    Wd.spawn = best;
  }

  /* Biyoma göre uygun konum ara — enkazın çevresindeki halkada, böylece
     dünya devasa olsa da her POI yürüme mesafesinde kalır. */
  function findBiomeSpot(rnd, wanted, minDist, from, maxDist, maxTries) {
    minDist = minDist || 10;
    maxDist = maxDist || 120;
    from = from || Wd.spawn;
    let fallback = null;
    const tries = maxTries || 2200;
    for (let i = 0; i < tries; i++) {
      /* Halka genişledikçe uzağa bakmaya başla */
      const grow = 1 + (i / tries) * 1.6;
      const ang = rnd() * Math.PI * 2;
      const rad = minDist + rnd() * (maxDist * grow - minDist);
      const x = Math.round(U.clamp(from.x + Math.cos(ang) * rad, 8, W - 9));
      const y = Math.round(U.clamp(from.y + Math.sin(ang) * rad, 8, H - 9));
      const b = rawBiome(x, y);
      if (b.t === T.WATER || b.t === T.ROCK || b.t === T.CHASM) continue;
      if (U.dist(x, y, from.x, from.y) < minDist) continue;
      if (!wanted || wanted.indexOf(b.key) >= 0) return { x, y, biome: b.key };
      if (!fallback) fallback = { x, y, biome: b.key };
    }
    return fallback || { x: U.clamp(from.x + 20, 8, W - 9), y: U.clamp(from.y + 20, 8, H - 9), biome: 'plains' };
  }

  function placePOIs() {
    const rnd = U.rng(Wd.seed ^ 0x1234abcd);
    const P0 = [];
    const sp = Wd.spawn;

    /* Enkaz — başlangıç noktası, çekirdek yuvası burada */
    P0.push({ id: 'wreck', kind: 'wreck', x: sp.x, y: sp.y, r: 7,
      name: { tr: 'Göktay Enkazı', en: 'The Göktay Wreck' } });

    /* Merkez İstasyon — ilk büyük yerleşim, enkaza en yakın olanı */
    const st = findBiomeSpot(rnd, ['plains', 'shore', 'desert'], 26, sp, 70);
    P0.push({ id: 'station', kind: 'station', x: st.x, y: st.y, r: 6,
      npcs: QW.NPCs.stationFolk(), city: true,
      name: { tr: 'Merkez İstasyon', en: 'Central Station' } });

    /* BÜYÜK ŞEHİRLER — her biri farklı bir bölgede, kendi karakteriyle */
    const CITIES = [
      { id: 'city_forge', biomes: ['canyon', 'mountain', 'plains'], min: 90, max: 220,
        name: { tr: 'Ocak Şehri', en: 'The Forge' },
        blurb: { tr: 'Yarık kenarına oyulmuş dökümhane şehri. Bacaları hâlâ tütüyor.',
                 en: 'A foundry city cut into the rift wall. Its stacks are still smoking.' } },
      { id: 'city_spire', biomes: ['glacier', 'plains', 'shore'], min: 120, max: 300,
        name: { tr: 'Buz Kulesi', en: 'Icespire' },
        blurb: { tr: 'Buzun içine gömülü bir anten şehri. Yarısı hâlâ sıcak.',
                 en: 'An antenna city sunk into the ice. Half of it is still warm.' } },
      { id: 'city_bazaar', biomes: ['desert', 'shore', 'plains'], min: 110, max: 280,
        name: { tr: 'Kum Pazarı', en: 'The Sand Bazaar' },
        blurb: { tr: 'Devrilmiş bir kargo gemisinin gövdesine kurulmuş kapalı çarşı.',
                 en: 'A covered market built inside the hull of a toppled freighter.' } }
    ];
    CITIES.forEach(c => {
      const s2 = findBiomeSpot(rnd, c.biomes, c.min, sp, c.max, 3500);
      P0.push({ id: c.id, kind: 'city', x: s2.x, y: s2.y, r: 8, city: true,
        npcs: QW.NPCs.stationFolk(), blurb: c.blurb, name: c.name });
    });

    /* GEÇİTLER — bölgeler arası koridorlar haritada adlandırılmış yer olur */
    QW.Regions.passes.forEach((ps, i) => {
      if (U.dist(ps.x, ps.y, sp.x, sp.y) < 14) return;
      P0.push({ id: 'pass_' + i, kind: 'pass', x: ps.x, y: ps.y, r: 3, name: ps.name });
    });

    /* NPC kampları — her biri tercih ettiği biyomda, rastgele konumlu */
    QW.NPCs.camps().forEach((id, i) => {
      const def = QW.NPCs.get(id);
      const s = findBiomeSpot(rnd, def.biomePref, 34 + i * 10, sp, 130 + i * 40);
      P0.push({ id: 'camp_' + id, kind: 'camp', x: s.x, y: s.y, r: 3, npc: id,
        name: def.name });
    });

    /* Bölge hâkimi inleri */
    [['glacier', 'boss_ice_worm'], ['swamp', 'boss_acid_golem'], ['desert', 'boss_sand_leviathan'],
     ['forest', 'boss_spore_titan'], ['canyon', 'boss_storm_harrier']].forEach(([bk, bid]) => {
      const s = findBiomeSpot(rnd, [bk], 70, sp, 300, 6000);
      const e = QW.Enemies.get(bid);
      P0.push({ id: 'lair_' + bk, kind: 'lair', x: s.x, y: s.y, r: 3, boss: bid, biome: bk,
        name: e.name });
    });

    /* Çöken Arşiv — Hafıza Bekçisi Alpha'nın kubbesi (anlatı bölümü) */
    const ar = findBiomeSpot(rnd, ['plains', 'desert', 'shore'], 45, sp, 140);
    P0.push({ id: 'archive', kind: 'archive', x: ar.x, y: ar.y, r: 4,
      boss: 'boss_memory_alpha',
      name: { tr: 'Çöken Arşiv', en: 'The Collapsed Archive' } });

    /* Kuruyan Vaha — Kayıp Leviathan'ın krateri (anlatı bölümü) */
    const oa = findBiomeSpot(rnd, ['swamp', 'shore', 'plains'], 40, sp, 150);
    P0.push({ id: 'oasis', kind: 'oasis', x: oa.x, y: oa.y, r: 4,
      boss: 'boss_lost_leviathan', healed: false,
      name: { tr: 'Kuruyan Vaha', en: 'The Drying Oasis' } });

    /* Yıkık kütüphaneler — veri kristali kaynağı */
    for (let i = 0; i < 14; i++) {
      const s = findBiomeSpot(rnd, ['plains', 'forest', 'desert', 'shore'], 20, sp, 260);
      P0.push({ id: 'ruin_' + i, kind: 'ruin', x: s.x, y: s.y, r: 2,
        loot: ['data_crystal', 'cassette_mech', 'cd_lens', 'quartz', 'scrap'],
        name: { tr: 'Yıkık Kütüphane', en: 'Ruined Library' } });
    }

    /* Düşmüş uydu / kargo kapsülleri — eski teknoloji hurdası */
    for (let i = 0; i < 22; i++) {
      const s = findBiomeSpot(rnd, null, 14, sp, 300);
      P0.push({ id: 'pod_' + i, kind: 'pod', x: s.x, y: s.y, r: 1,
        loot: ['scrap', 'power_cell', 'cassette_mech', 'cd_lens', 'copper', 'pcb'],
        name: { tr: 'Kargo Kapsülü', en: 'Cargo Pod' } });
    }

    Wd.pois = P0;
  }

  /* ---------------------------------------------------------------
   * BİYOM SORGUSU
   * ------------------------------------------------------------- */
  /* fbm çıktısı 0.5 çevresinde yoğunlaşır; kontrastı açarak biyomların
     dünyada dengeli dağılmasını sağlarız. */
  function spread(v, k) { return U.clamp(0.5 + (v - 0.5) * k, 0, 1); }

  function rawBiome(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return BIOMES.sea;
    const key = tx * 100000 + ty;
    const c = Wd._biomeCache.get(key);
    if (c) return c;

    let e = spread(nElev.n01(tx * 0.0068, ty * 0.0068, 5, 2.0, 0.5), 1.9);
    let m = spread(nMoist.n01(tx * 0.011 + 120, ty * 0.011 - 60, 4), 2.2);
    let t = spread(nTemp.n01(tx * 0.0042 - 200, ty * 0.0042 + 90, 3), 2.0);
    /* Kutuplara doğru soğuma — buzullar haritanın kuzey/güney uçlarında */
    const lat = Math.abs(ty - H / 2) / (H / 2);
    t = U.clamp(t * 0.55 + (1 - lat) * 0.45, 0, 1);

    /* BÖLGE SAPMASI — her bölgenin kendi iklim karakteri vardır, böylece
       devasa harita tek bir gürültü tarlası gibi değil, ayrı yerler gibi okunur.
       Hücre bir kez aranır: sapma, sınır ve engebe aynı nesneden okunur. */
    const cell = QW.Regions.at(tx, ty);
    const bias = cell ? cell.arch.bias : null;
    let rugged = 0;
    if (bias) {
      /* Sapma güçlü olmalı: bölge adını taşıdığı biyomla okunmalı */
      m = U.clamp(m + bias.m * 1.7, 0, 1);
      t = U.clamp(t + bias.t * 1.7, 0, 1);
      e = U.clamp(e + bias.e * 1.7, 0, 1);
      rugged = cell.rugged || 0;
      /* Sınırlar: bölge kendi karakterine hapsedilir */
      const cl = cell.arch.clamp;
      if (cl) {
        if (cl.tMin !== undefined) t = Math.max(t, cl.tMin);
        if (cl.tMax !== undefined) t = Math.min(t, cl.tMax);
        if (cl.mMin !== undefined) m = Math.max(m, cl.mMin);
        if (cl.mMax !== undefined) m = Math.min(m, cl.mMax);
        if (cl.eMin !== undefined) e = Math.max(e, cl.eMin);
        if (cl.eMax !== undefined) e = Math.min(e, cl.eMax);
      }
    }

    let rg = nRidge.ridge(tx * 0.018, ty * 0.018, 3) + rugged * 0.05;
    const rgc = QW.Regions.clampAt(tx, ty);
    /* Düz taban: kanyon bandına oturt, uçurum eşiğini (0.945) aşma */
    if (rgc && rgc.rgMin !== undefined) rg = Math.max(rg, rgc.rgMin);

    /* Dünyanın kenarı denize açılır */
    const edge = Math.min(tx, ty, W - 1 - tx, H - 1 - ty) / 26;
    const ee = e * U.clamp(edge, 0, 1);

    /* Geçitler: bölgeler arasındaki duvarı delen tek yol — daima yürünür */
    const pass = QW.Regions.passNear(tx, ty, 0);
    let b;
    if (pass) {
      const d = U.dist(tx, ty, pass.x, pass.y);
      if (d <= pass.r) b = (ee < 0.30) ? BIOMES.shore : BIOMES.canyon;
      else b = null;
      if (b) { cache(key, b); return b; }
    }
    if (ee < 0.28) b = BIOMES.sea;
    else if (ee < 0.325) b = BIOMES.shore;
    else if (ee > 0.86) b = BIOMES.mountain;
    else if (rg > 0.945 && ee > 0.42) b = BIOMES.chasm;
    else if (rg > 0.885 && ee > 0.40) b = BIOMES.canyon;
    else if (t < 0.34) b = BIOMES.glacier;
    else if (m > 0.64 && t > 0.46 && ee < 0.62) b = BIOMES.swamp;
    else if (m > 0.52) b = BIOMES.forest;
    else if (m < 0.36 && t > 0.52) b = BIOMES.desert;
    else b = BIOMES.plains;

    return cache(key, b);
  }

  function cache(key, b) {
    if (Wd._biomeCache.size > 240000) Wd._biomeCache.clear();
    Wd._biomeCache.set(key, b);
    return b;
  }

  /* Enkaz sahası, üstteki biyomu ezer */
  Wd.biomeAt = function (tx, ty) {
    const sp = Wd.spawn;
    if (Math.abs(tx - sp.x) <= 7 && Math.abs(ty - sp.y) <= 7) {
      /* Enkaz sahasının kenarı gürültüyle kırılır — daire gibi görünmesin */
      const d = U.dist(tx, ty, sp.x, sp.y);
      const wobble = nDet ? nDet.n01(tx * 0.32, ty * 0.32, 2) * 2.2 : 0;
      if (d < 4.2 + wobble) return BIOMES.wreck;
    }
    return rawBiome(tx, ty);
  };

  Wd.biomeKeyAt = (tx, ty) => Wd.biomeAt(tx, ty).key;
  Wd.biomeNameAt = function (tx, ty) { return QW.t(Wd.biomeAt(tx, ty).name); };

  /* Geçiş kontrolü — araç yetenekleri engelleri kaldırır */
  Wd.canWalk = function (tx, ty, caps) {
    const b = Wd.biomeAt(tx, ty);
    caps = caps || {};
    switch (b.t) {
      case T.WATER: return false;
      case T.ROCK:  return false;
      case T.CHASM: return !!caps.fly;
      case T.SWAMP: return true;  // girilebilir ama hasar verir
      default: return true;
    }
  };

  /* Zemin hız çarpanı ve tehlike */
  Wd.terrainAt = function (tx, ty, caps) {
    const b = Wd.biomeAt(tx, ty);
    caps = caps || {};
    let spd = 1, hazard = null;
    if (b.t === T.SWAMP) { spd = caps.allTerrain ? 0.95 : 0.55; if (!caps.allTerrain) hazard = 'acid'; }
    else if (b.t === T.SAND) spd = caps.allTerrain ? 1.05 : 0.8;
    else if (b.key === 'glacier') { spd = caps.allTerrain ? 0.95 : 0.85; hazard = 'cold'; }
    else if (b.key === 'forest') spd = 0.9;
    else if (b.key === 'canyon') spd = 0.9;
    return { biome: b, spd, hazard };
  };

  /* ---------------------------------------------------------------
   * KAYNAK DÜĞÜMLERİ (deterministik, hasat edilince gün sayacıyla döner)
   * ------------------------------------------------------------- */
  const NODE_TABLE = {
    desert:   [['silicon', 0.5], ['quartz', 0.2], ['scrap', 0.3]],
    plains:   [['scrap', 0.4], ['copper', 0.3], ['bio_fiber', 0.3]],
    shore:    [['silicon', 0.35], ['scrap', 0.35], ['bio_fiber', 0.3]],
    forest:   [['spore_cap', 0.4], ['bio_fiber', 0.3], ['rubber_sap', 0.3]],
    glacier:  [['ice_shard', 0.6], ['quartz', 0.25], ['titanium', 0.15]],
    swamp:    [['acid_sac', 0.45], ['bio_fiber', 0.3], ['rubber_sap', 0.25]],
    canyon:   [['titanium', 0.4], ['copper', 0.3], ['aero_data', 0.3]],
    mountain: [['titanium', 0.5], ['copper', 0.3], ['quartz', 0.2]],
    wreck:    [['scrap', 0.6], ['copper', 0.2], ['power_cell', 0.2]]
  };
  const NODE_DENSITY = { desert: 0.030, plains: 0.030, shore: 0.026, forest: 0.038, glacier: 0.030,
                         swamp: 0.032, canyon: 0.034, mountain: 0.028, wreck: 0.070, sea: 0, chasm: 0 };

  Wd.nodeAt = function (tx, ty) {
    const b = Wd.biomeAt(tx, ty);
    const dens = NODE_DENSITY[b.key] || 0;
    if (dens <= 0) return null;
    const h = U.hash2(tx, ty, Wd.seed + 7717);
    if (h > dens) return null;
    const table = NODE_TABLE[b.key] || NODE_TABLE.plains;
    const r = U.hash2(tx, ty, Wd.seed + 991);
    let acc = 0, pick = table[0][0];
    for (const [id, p] of table) { acc += p; if (r <= acc) { pick = id; break; } }
    const key = tx + ',' + ty;
    const hv = Wd.harvested[key];
    if (hv !== undefined && Wd.day - hv < 2) return null;  // 2 gün sonra yeniden büyür
    const amount = 1 + Math.floor(U.hash2(tx, ty, Wd.seed + 313) * 3);
    return { tx, ty, item: pick, n: amount, biome: b.key };
  };

  Wd.harvest = function (tx, ty) { Wd.harvested[tx + ',' + ty] = Wd.day; };

  /* Belirli yarıçapta düğüm listesi (radar taraması ve etkileşim için) */
  Wd.nodesAround = function (tx, ty, r) {
    const out = [];
    for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
      const n = Wd.nodeAt(x, y);
      if (n) out.push(n);
    }
    return out;
  };

  /* Kamp feneri — oyuncunun kurduğu kalıcı dinlenme noktası */
  Wd.beacons = [];
  Wd.placeBeacon = function () {
    const t = QW.Player.tilePos();
    if (!Wd.canWalk(t.tx, t.ty, {})) { QW.HUD.toast(QW.t('act_nothing'), 'bad'); return false; }
    /* Yalnızca başka bir dinlenme noktasına çok yakınsa reddet — küçük
       ganimet noktaları (kapsül, harabe) fener kurmayı engellemez. */
    const clash = Wd.pois.some(p => {
      const isRest = p.kind === 'camp' || p.kind === 'station' || p.kind === 'wreck' || p.kind === 'lair';
      return isRest && U.dist(t.tx, t.ty, p.x, p.y) < 10;
    });
    if (clash) { QW.HUD.toast(QW.t('beacon_here'), 'bad'); return false; }
    const p = {
      id: 'beacon_' + Wd.beacons.length + '_' + t.tx + '_' + t.ty,
      kind: 'camp', beacon: true, x: t.tx, y: t.ty, r: 2,
      name: { tr: 'Kamp Feneri', en: 'Camp Beacon' }
    };
    Wd.beacons.push({ x: t.tx, y: t.ty });
    Wd.pois.push(p);
    Wd.invalidate(t.tx, t.ty);
    Wd.discover(t.tx, t.ty, 10);
    QW.HUD.toast(QW.t('beacon_placed'), 'good');
    return true;
  };

  /* İletişim modülü uzak kampların yerini açar */
  Wd.revealCamps = function () {
    let n = 0;
    Wd.pois.forEach(p => {
      if (p.kind === 'camp' || p.kind === 'station') {
        if (!Wd.isDiscovered(p.x, p.y)) n++;
        Wd.discover(p.x, p.y, 6);
      }
    });
    return n;
  };

  Wd.poiAt = function (tx, ty) {
    for (const p of Wd.pois) if (Math.abs(tx - p.x) <= p.r && Math.abs(ty - p.y) <= p.r) return p;
    return null;
  };
  Wd.poiNear = function (tx, ty, extra) {
    for (const p of Wd.pois) if (U.dist(tx, ty, p.x, p.y) <= p.r + (extra || 0)) return p;
    return null;
  };
  Wd.getPoi = id => Wd.pois.find(p => p.id === id) || null;

  /* ---------------------------------------------------------------
   * CHUNK ÇİZİMİ — dikişsiz doku
   * ------------------------------------------------------------- */
  function biomeColors(b) { return b; }

  function drawChunk(cx, cy) {
    const cv = P.canvas(CHPX, CHPX);
    const ctx = P.ctx(cv);
    const img = ctx.createImageData(CHPX, CHPX);
    const buf = new Uint32Array(img.data.buffer);

    /* Renkleri 0xAABBGGRR (little endian) olarak önceden çöz */
    const cacheCol = {};
    function col(hex) {
      let v = cacheCol[hex];
      if (v === undefined) {
        const [r, g, bl] = U.parseHex(hex);
        v = (255 << 24) | (bl << 16) | (g << 8) | r;
        cacheCol[hex] = v;
      }
      return v;
    }

    const t0x = cx * CH, t0y = cy * CH;

    for (let ly = 0; ly < CH; ly++) {
      for (let lx = 0; lx < CH; lx++) {
        const tx = t0x + lx, ty = t0y + ly;
        const b = Wd.biomeAt(tx, ty);
        /* Komşu biyomlar — kenar harmanlaması için */
        const nb = [Wd.biomeAt(tx, ty - 1), Wd.biomeAt(tx + 1, ty),
                    Wd.biomeAt(tx, ty + 1), Wd.biomeAt(tx - 1, ty)];

        const base = col(b.base), alt = col(b.alt), det = col(b.det);

        for (let py = 0; py < TILE; py++) {
          const wy = ty * TILE + py;
          const rowOff = (ly * TILE + py) * CHPX + lx * TILE;
          for (let px = 0; px < TILE; px++) {
            const wx = tx * TILE + px;

            /* Temel doku: dünya koordinatlı hash + bayer -> tekrar etmeyen grenli zemin */
            const h = U.hash2(wx, wy, Wd.seed);
            const bay = P.bayer(wx, wy);
            let c = (h < 0.22 + bay * 0.10) ? alt : base;
            if (h > 0.965) c = det;

            /* Kenar harmanlaması: komşu biyoma doğru taramalı geçiş */
            let bl = null, w = 0;
            if (py < 4 && nb[0] !== b) { bl = nb[0]; w = (4 - py) / 5; }
            else if (px > TILE - 5 && nb[1] !== b) { bl = nb[1]; w = (px - (TILE - 5)) / 5; }
            else if (py > TILE - 5 && nb[2] !== b) { bl = nb[2]; w = (py - (TILE - 5)) / 5; }
            else if (px < 4 && nb[3] !== b) { bl = nb[3]; w = (4 - px) / 5; }
            if (bl && bay < w * 0.85) {
              c = (h < 0.25) ? col(bl.alt) : col(bl.base);
            }

            buf[rowOff + px] = c;
          }
        }

        /* Tile üstü detaylar — dünya koordinatına bağlı, tekrarsız */
        decorate(buf, lx, ly, tx, ty, b, col);
      }
    }

    ctx.putImageData(img, 0, 0);
    /* Kaynak düğümleri ve POI süslemeleri canvas üstüne çizilir */
    for (let ly = 0; ly < CH; ly++) for (let lx = 0; lx < CH; lx++) {
      const tx = t0x + lx, ty = t0y + ly;
      const n = Wd.nodeAt(tx, ty);
      if (n) QW.Sprites.drawNode(ctx, lx * TILE, ly * TILE, n.item);
    }
    Wd.pois.forEach(p => {
      if (p.x >= t0x - 8 && p.x < t0x + CH + 8 && p.y >= t0y - 8 && p.y < t0y + CH + 8) {
        QW.Sprites.drawPoi(ctx, (p.x - t0x) * TILE, (p.y - t0y) * TILE, p);
      }
    });
    return cv;
  }

  /* Zemin süsleri: kaya, ot, buz çatlağı, mantar, cam kırığı */
  function decorate(buf, lx, ly, tx, ty, b, col) {
    const r = U.hash2(tx, ty, Wd.seed + 4242);
    if (r > 0.30) return;
    const ox = lx * TILE + 2 + Math.floor(U.hash2(tx, ty, Wd.seed + 11) * 10);
    const oy = ly * TILE + 2 + Math.floor(U.hash2(tx, ty, Wd.seed + 12) * 10);
    const put = (x, y, c) => {
      if (x < 0 || y < 0 || x >= CHPX || y >= CHPX) return;
      buf[y * CHPX + x] = c;
    };
    const d = col(b.det), a = col(b.alt);

    switch (b.key) {
      case 'plains': case 'shore':
        put(ox, oy, d); put(ox + 1, oy - 1, d); put(ox - 1, oy - 1, d); put(ox, oy - 2, d);
        break;
      case 'desert':
        put(ox, oy, d); put(ox + 1, oy, d); put(ox + 2, oy + 1, d); put(ox - 1, oy + 1, a);
        break;
      case 'forest': {
        const c = col(r < 0.12 ? '#8f5fb8' : b.det);
        put(ox, oy, c); put(ox - 1, oy, c); put(ox + 1, oy, c);
        put(ox, oy - 1, c); put(ox, oy + 1, a); put(ox, oy + 2, a);
        break;
      }
      case 'glacier':
        put(ox, oy, d); put(ox + 1, oy + 1, d); put(ox + 2, oy + 1, d); put(ox + 3, oy + 2, d);
        break;
      case 'swamp': {
        const c = col('#7fae3a');
        put(ox, oy, c); put(ox + 1, oy, c); put(ox, oy + 1, c); put(ox + 1, oy + 1, c);
        put(ox + 2, oy, a);
        break;
      }
      case 'canyon': case 'mountain':
        put(ox, oy, d); put(ox + 1, oy, d); put(ox + 2, oy, a);
        put(ox, oy + 1, a); put(ox + 1, oy + 1, d);
        break;
      case 'wreck':
        put(ox, oy, d); put(ox + 1, oy, d); put(ox + 2, oy, d);
        put(ox, oy + 1, a); put(ox + 2, oy + 1, a);
        break;
      case 'sea':
        if (r < 0.10) { put(ox, oy, d); put(ox + 1, oy, d); put(ox + 2, oy, d); }
        break;
      case 'chasm':
        if (r < 0.08) { put(ox, oy, d); put(ox, oy + 1, d); }
        break;
    }
  }

  Wd.chunk = function (cx, cy) {
    const k = cx + ':' + cy;
    let c = Wd._chunks.get(k);
    if (!c) {
      c = drawChunk(cx, cy);
      Wd._chunks.set(k, c);
      Wd._order.push(k);
      /* Bellek sınırı — en eski chunk'ları at */
      while (Wd._order.length > 60) {
        const old = Wd._order.shift();
        if (old !== k) Wd._chunks.delete(old);
      }
    }
    return c;
  };

  /* Bir tile değiştiğinde (hasat) o chunk yeniden çizilir */
  Wd.invalidate = function (tx, ty) {
    const k = Math.floor(tx / CH) + ':' + Math.floor(ty / CH);
    Wd._chunks.delete(k);
    const i = Wd._order.indexOf(k); if (i >= 0) Wd._order.splice(i, 1);
  };

  /* POI çizimleri chunk sınırlarını aşabilir (vaha ±40 px). Görünüşü değişen
     bir POI'de sadece merkez chunk'ı tazelemek yarısı eski kalan bir görüntü
     bırakır; bu yüzden çevredeki tüm chunk'lar geçersizleştirilir. */
  Wd.invalidateArea = function (tx, ty, rTiles) {
    const r = rTiles || 5;
    for (let y = ty - r; y <= ty + r; y += CH) {
      for (let x = tx - r; x <= tx + r; x += CH) Wd.invalidate(x, y);
    }
    Wd.invalidate(tx + r, ty + r);
    Wd.invalidate(tx - r, ty - r);
    Wd.invalidate(tx + r, ty - r);
    Wd.invalidate(tx - r, ty + r);
  };

  /* ---------------------------------------------------------------
   * ÇİZİM
   * ------------------------------------------------------------- */
  Wd.draw = function (ctx, camX, camY, vw, vh) {
    const c0x = Math.floor(camX / CHPX), c1x = Math.floor((camX + vw) / CHPX);
    const c0y = Math.floor(camY / CHPX), c1y = Math.floor((camY + vh) / CHPX);
    for (let cy = c0y; cy <= c1y; cy++) {
      for (let cx = c0x; cx <= c1x; cx++) {
        if (cx < 0 || cy < 0 || cx * CH >= W || cy * CH >= H) {
          ctx.fillStyle = BIOMES.sea.base;
          ctx.fillRect(cx * CHPX - camX, cy * CHPX - camY, CHPX, CHPX);
          continue;
        }
        ctx.drawImage(Wd.chunk(cx, cy), (cx * CHPX - camX) | 0, (cy * CHPX - camY) | 0);
      }
    }
  };

  /* ---------------------------------------------------------------
   * KEŞİF / MİNİ HARİTA
   * ------------------------------------------------------------- */
  Wd.discover = function (tx, ty, r) {
    const gx = tx >> 2, gy = ty >> 2, rr = Math.max(1, r >> 2);
    for (let y = gy - rr; y <= gy + rr; y++)
      for (let x = gx - rr; x <= gx + rr; x++) Wd.discovered[x + ',' + y] = 1;
  };
  Wd.isDiscovered = (tx, ty) => !!Wd.discovered[(tx >> 2) + ',' + (ty >> 2)];

  Wd.drawMinimap = function (cv, ptx, pty, span, showAll) {
    const ctx = P.ctx(cv);
    const s = cv.width, half = span >> 1;
    ctx.fillStyle = '#04060c'; ctx.fillRect(0, 0, s, s);
    const step = span / s;
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const tx = Math.round(ptx - half + x * step);
        const ty = Math.round(pty - half + y * step);
        if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
        if (!showAll && !Wd.isDiscovered(tx, ty)) continue;
        const b = Wd.biomeAt(tx, ty);
        ctx.fillStyle = b.base;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    /* POI işaretleri */
    Wd.pois.forEach(p => {
      if (!showAll && !Wd.isDiscovered(p.x, p.y)) return;
      const x = Math.round((p.x - (ptx - half)) / step);
      const y = Math.round((p.y - (pty - half)) / step);
      if (x < 0 || y < 0 || x >= s || y >= s) return;
      const c = p.kind === 'station' ? '#4df2c8' : p.kind === 'camp' ? '#ffd166'
              : p.kind === 'lair' ? '#ff5d7a' : p.kind === 'wreck' ? '#ffffff'
              : p.kind === 'city' ? '#ffe08a' : p.kind === 'pass' ? '#b0bcd0'
              : p.kind === 'archive' ? '#8fd0ff' : p.kind === 'oasis' ? (p.healed ? '#4a9fd0' : '#9be24a')
              : '#7aa2ff';
      ctx.fillStyle = c; ctx.fillRect(x - 1, y - 1, 3, 3);
    });
    /* Oyuncu */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect((s >> 1) - 1, (s >> 1) - 1, 2, 2);
    ctx.strokeStyle = '#26365c'; ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, s - 1, s - 1);
  };

  /* ---------------------------------------------------------------
   * ZAMAN
   * ------------------------------------------------------------- */
  const DAY_SECONDS = 360;   // gerçek 6 dakika = 1 oyun günü

  Wd.tickTime = function (dt) {
    Wd.time += dt / DAY_SECONDS;
    while (Wd.time >= 1) {
      Wd.time -= 1; Wd.day++;
      QW.bus.emit('newday', Wd.day);
    }
  };
  Wd.isNight = () => (Wd.time < 0.22 || Wd.time > 0.80);
  Wd.phase = function () {
    const t = Wd.time;
    if (t < 0.22 || t > 0.82) return 'night';
    if (t < 0.30) return 'dawn';
    if (t > 0.72) return 'dusk';
    return 'day';
  };
  Wd.clockString = function () {
    const mins = Math.floor(Wd.time * 24 * 60);
    return U.pad2(Math.floor(mins / 60)) + ':' + U.pad2(mins % 60);
  };
  /* Gece/gündüz renk katmanı */
  Wd.lightOverlay = function () {
    const t = Wd.time;
    let a = 0, col = '#0a1030';
    if (t < 0.20) a = 0.55;
    else if (t < 0.30) { a = U.lerp(0.55, 0, (t - 0.20) / 0.10); col = '#3a2050'; }
    else if (t < 0.70) a = 0;
    else if (t < 0.82) { a = U.lerp(0, 0.45, (t - 0.70) / 0.12); col = '#40203a'; }
    else a = 0.55;
    return { a, col };
  };

  /* ---------------------------------------------------------------
   * KAYIT
   * ------------------------------------------------------------- */
  /* Keşif ızgarası 96x96 hücredir (tile >> 2). Anahtar başına "x,y" dizesi
     yazmak 90 KB'a çıkıyordu; bit maskesi + base64 bunu ~1.5 KB'a indirir ve
     otomatik kaydın maliyetini düşürür. */
  const DG = (W >> 2) + 1;                     // keşif ızgarası genişliği

  function packDiscovered() {
    const bytes = new Uint8Array(Math.ceil(DG * DG / 8));
    Object.keys(Wd.discovered).forEach(k => {
      const c = k.indexOf(',');
      const x = +k.slice(0, c), y = +k.slice(c + 1);
      if (x < 0 || y < 0 || x >= DG || y >= DG) return;
      const bit = y * DG + x;
      bytes[bit >> 3] |= 1 << (bit & 7);
    });
    let bin = '';
    for (let i = 0; i < bytes.length; i += 4096) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 4096));
    }
    return btoa(bin);
  }

  function unpackDiscovered(b64) {
    const out = {};
    if (!b64) return out;
    let bin;
    try { bin = atob(b64); } catch (e) { return out; }
    for (let i = 0; i < bin.length; i++) {
      const byte = bin.charCodeAt(i);
      if (!byte) continue;
      for (let b = 0; b < 8; b++) {
        if (!(byte & (1 << b))) continue;
        const bit = i * 8 + b;
        out[(bit % DG) + ',' + Math.floor(bit / DG)] = 1;
      }
    }
    return out;
  }

  /* Hasat kayıtları 2 günde yenilendiği için eskiyenleri saklamaya gerek yok */
  function pruneHarvested() {
    const out = {};
    Object.keys(Wd.harvested).forEach(k => {
      if (Wd.day - Wd.harvested[k] < 2) out[k] = Wd.harvested[k];
    });
    Wd.harvested = out;
    return out;
  }

  Wd.serialize = function () {
    return {
      seed: Wd.seed, spawn: Wd.spawn, day: Wd.day, time: Wd.time,
      harvested: pruneHarvested(), disc: packDiscovered(),
      beacons: Wd.beacons,
      pois: Wd.pois.map(p => ({ id: p.id, cleared: !!p.cleared, looted: !!p.looted, lootDay: p.lootDay || 0, healed: !!p.healed }))
    };
  };
  Wd.load = function (d) {
    Wd.generate(d.seed);
    Wd.spawn = d.spawn || Wd.spawn;
    Wd.day = d.day || 1; Wd.time = d.time || 0.32;
    Wd.harvested = d.harvested || {};
    Wd.discovered = d.disc ? unpackDiscovered(d.disc) : (d.discovered || {});
    /* Kurulmuş kamp fenerlerini geri yükle */
    Wd.beacons = d.beacons || [];
    Wd.beacons.forEach((b, i) => {
      Wd.pois.push({
        id: 'beacon_' + i + '_' + b.x + '_' + b.y, kind: 'camp', beacon: true,
        x: b.x, y: b.y, r: 2, name: { tr: 'Kamp Feneri', en: 'Camp Beacon' }
      });
    });
    (d.pois || []).forEach(sp => {
      const p = Wd.getPoi(sp.id);
      if (p) {
        p.cleared = sp.cleared; p.looted = sp.looted; p.lootDay = sp.lootDay || 0; p.healed = !!sp.healed;
        if (p.kind === 'oasis' && p.healed) p.name = { tr: 'İyileşen Vaha', en: 'The Healed Oasis' };
      }
    });
    Wd._chunks.clear(); Wd._order.length = 0;
  };

})(window.QW);
