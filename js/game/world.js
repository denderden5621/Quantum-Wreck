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

  /* warm : ışık ucunun çekildiği renk (güneşin o biyomdaki karakteri)
     cool : gölge ucunun çekildiği renk (gökyüzü dönüş ışığı)
     spread: rampa kontrastı — kaya sert, bitki örtüsü yumuşak
     rough: yamaç gölgelendirmesinin şiddeti (0 = düz, 1 = sarp)          */
  const BIOMES = {
    sea:      { key: 'sea',      t: T.WATER, base: '#16324f', alt: '#1d4a72', det: '#3f8fb8', name: 'b_sea',
                warm: '#7fd8e8', cool: '#0a1430', spread: 0.34, rough: 0.15 },
    shore:    { key: 'shore',    t: T.WALK,  base: '#c2b083', alt: '#ac9a70', det: '#ded0a6', name: 'b_shore',
                warm: '#ffe9b0', cool: '#2a3358', spread: 0.30, rough: 0.35 },
    desert:   { key: 'desert',   t: T.SAND,  base: '#d6bf85', alt: '#c1a86c', det: '#efe6c2', name: 'b_desert',
                warm: '#fff0bc', cool: '#4a3a62', spread: 0.32, rough: 0.55 },
    plains:   { key: 'plains',   t: T.WALK,  base: '#6d7360', alt: '#5b6150', det: '#8a9077', name: 'b_plains',
                warm: '#d8d98a', cool: '#22304a', spread: 0.38, rough: 0.45 },
    forest:   { key: 'forest',   t: T.WALK,  base: '#3d5645', alt: '#324a3a', det: '#7d5aa0', name: 'b_forest',
                warm: '#a8c46a', cool: '#141f38', spread: 0.44, rough: 0.50 },
    glacier:  { key: 'glacier',  t: T.WALK,  base: '#cbe2f0', alt: '#b2d0e4', det: '#8fbcd8', name: 'b_glacier',
                warm: '#ffffff', cool: '#2e4a80', spread: 0.34, rough: 0.60 },
    swamp:    { key: 'swamp',    t: T.SWAMP, base: '#46543a', alt: '#3a4a30', det: '#89b444', name: 'b_swamp',
                warm: '#9fc45a', cool: '#16221c', spread: 0.40, rough: 0.25 },
    canyon:   { key: 'canyon',   t: T.WALK,  base: '#8a5c3c', alt: '#754a2f', det: '#a97a52', name: 'b_canyon',
                warm: '#f0b070', cool: '#2e1e3e', spread: 0.48, rough: 0.95 },
    chasm:    { key: 'chasm',    t: T.CHASM, base: '#140f0c', alt: '#241a14', det: '#3a2a20', name: 'b_canyon',
                warm: '#5a4030', cool: '#000000', spread: 0.55, rough: 1.00 },
    mountain: { key: 'mountain', t: T.ROCK,  base: '#79808e', alt: '#666d7b', det: '#98a0ae', name: 'b_mountain',
                warm: '#e6e2d0', cool: '#26304e', spread: 0.50, rough: 1.00 },
    wreck:    { key: 'wreck',    t: T.WALK,  base: '#5c6270', alt: '#4a5060', det: '#8a94a8', name: 'b_wreck',
                warm: '#c8d4e8', cool: '#1a2036', spread: 0.42, rough: 0.40 }
  };

  /* ------------------------------------------------------------------
   * 16-BİT BİYOM RAMPALARI
   *
   * Her biyom artık 3 değil 9 tona sahip. Rampa taban renkten hue
   * kaydırmalı olarak türetilir: gölge soğur ve doygunlaşır, ışık ısınır
   * ve solar. `warm` her biyomun ışık karakterini ayarlar (çöl sıcak,
   * buzul soğuk), `spread` kontrastı belirler (kaya sert, bataklık yumuşak).
   * ---------------------------------------------------------------- */
  const RAMP_N = 9;
  function buildRamps() {
    Object.keys(BIOMES).forEach(k => {
      const b = BIOMES[k];
      const sp = b.spread === undefined ? 0.40 : b.spread;
      b.ramp = U.ramp(b.base, RAMP_N, sp);
      /* Işık ucu biyomun kendi sıcaklığına doğru çekilir */
      if (b.warm) {
        for (let i = Math.ceil(RAMP_N / 2); i < RAMP_N; i++) {
          const t = (i - (RAMP_N - 1) / 2) / ((RAMP_N - 1) / 2);
          b.ramp[i] = U.mixHex(b.ramp[i], b.warm, t * 0.45);
        }
      }
      /* Gölge ucu ortam rengine (gökyüzü dönüşü) doğru çekilir */
      const cool = b.cool || '#1b2340';
      for (let i = 0; i < RAMP_N / 2; i++) {
        const t = ((RAMP_N - 1) / 2 - i) / ((RAMP_N - 1) / 2);
        b.ramp[i] = U.mixHex(b.ramp[i], cool, t * 0.30);
      }
      b.detRamp = U.ramp(b.det, 5, 0.34);
      b.altRamp = U.ramp(b.alt, 5, 0.34);
      b.ao = U.mixHex(b.ramp[0], cool, 0.45);      // kenar gölgesi
    });
  }
  buildRamps();

  const Wd = QW.World = {
    TILE, CH, CHPX, W, H, T, BIOMES,
    seed: 0, spawn: { x: 0, y: 0 },
    pois: [], nodes: {}, harvested: {}, discovered: {}, looted: {},
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
    Wd.harvested = {}; Wd.discovered = {}; Wd.beacons = []; Wd.looted = {};
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
    let eShade = e;                       // sınırlanmamış yükseklik (gölge için)
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
      /* Gölgelendirme için HAM yükseklik: aşağıdaki sınırlayıcılar bölge
         içinde yüksekliği sabitliyor (biyom kimliğini garanti etmek için).
         Bu, arazi ışığının girdisini düzleştiriyordu. Biyom seçimi sınırlı
         değeri kullanmaya devam eder; yamaç ışığı ham alanı okur. */
      eShade = e;
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

    /* Geçitler ve onlara bağlı koridorlar: duvarı delen yol, daima yürünür */
    const pass = QW.Regions.corridorAt(tx, ty);
    let b;
    /* Yamaç + sırt kabartması — kenar sönümlemesi uygulanmış HAM yükseklik */
    Wd._elev.set(key, eShade * U.clamp(edge, 0, 1) + rg * 0.30);
    if (pass) {
      b = (ee < 0.30) ? BIOMES.shore : BIOMES.canyon;
      return cache(key, b);
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
    if (Wd._biomeCache.size > 240000) { Wd._biomeCache.clear(); Wd._elev.clear(); }
    Wd._biomeCache.set(key, b);
    return b;
  }

  /* ------------------------------------------------------------------
   * YÜKSEKLİK ALANI — 16-bit arazi gölgelendirmesinin girdisi
   *
   * 8-bit arazi düz bir renk tarlasıdır; 16-bit arazide yamaçlar vardır:
   * ışığa bakan yüzler açılır, arka yüzler koyulur. Bunun için biyom
   * seçiminde zaten hesaplanan yükseklik saklanır (yeniden hesaplanmaz).
   * ---------------------------------------------------------------- */
  Wd._elev = new Map();
  Wd.elevAt = function (tx, ty) {
    const key = tx * 100000 + ty;
    let v = Wd._elev.get(key);
    if (v === undefined) {
      /* Doğrudan rawBiome: biomeAt enkaz sahasında erken döner ve yükseklik
         hiç yazılmazdı; orası düz bir plato olup çevresinde sahte bir ışık
         halesi yaratıyordu. Örtü kararını biomeAt yine kendisi veriyor. */
      rawBiome(tx, ty);
      v = Wd._elev.get(key);
    }
    return v === undefined ? 0.5 : v;
  };

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

  /* ------------------------------------------------------------------
   * SİNYAL AĞI (hızlı seyahat)
   *
   * 832x832'lik bir haritada iki uç arasını yürümek altı dakika sürüyordu.
   * Keşfedilmiş yerleşimler ve kurulan fenerler bir ağ oluşturur; aralarında
   * yolculuk bedavaya değildir: saat ilerler, dayanıklılık gider, yolda
   * pusuya düşme ihtimali vardır.
   * ---------------------------------------------------------------- */
  Wd.travelNodes = function () {
    return Wd.pois.filter(p =>
      (p.kind === 'wreck' || p.kind === 'station' || p.kind === 'city' ||
       p.kind === 'camp' || p.kind === 'oasis') &&
      Wd.isDiscovered(p.x, p.y) &&
      !(p.kind === 'oasis' && !p.healed));
  };

  /* Yolculuk maliyeti: mesafeye göre saat + dayanıklılık */
  Wd.travelCost = function (poi) {
    const t = QW.Player.tilePos();
    const d = U.dist(t.tx, t.ty, poi.x, poi.y);
    const caps = QW.Vehicles.caps();
    const speedup = caps.speed && caps.speed > 1 ? caps.speed : 1;
    const hours = Math.max(1, Math.round(d / 26 / speedup));
    const stamina = Math.round(d / 5 / speedup);
    return { d: Math.round(d), hours, stamina };
  };

  Wd.travelTo = function (poi) {
    const cost = Wd.travelCost(poi);
    if (QW.Player.sta < cost.stamina * 0.5) {
      QW.HUD.toast(QW.t('ft_tired'), 'bad');
      QW.Audio.sfx('deny');
      return false;
    }
    QW.Player.x = poi.x * TILE + 8;
    QW.Player.y = (poi.y + 2) * TILE + 8;
    QW.Player.sta = Math.max(0, QW.Player.sta - cost.stamina);
    QW.Player.addStress(cost.hours * 0.8);
    /* Saat ilerler; gün dönerse gün sayacı da artar */
    Wd.time += cost.hours / 24;
    while (Wd.time >= 1) { Wd.time -= 1; Wd.day++; QW.bus.emit('newday', Wd.day); }
    Wd.discover(poi.x, poi.y, 12);
    QW.Entities.clearEnemies();
    QW.Audio.sfx('scan');
    QW.HUD.toast(QW.t('ft_done', { name: QW.L(poi.name), h: cost.hours }), 'good');
    /* Uzun yolculukta pusu riski */
    if (cost.d > 60 && Math.random() < 0.22) {
      QW.HUD.toast(QW.t('ft_danger'), 'bad');
      QW.Player.damage(6 + cost.hours, null);
    }
    QW.Save.write(true);
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

  /* ------------------------------------------------------------------
   * YOL ÜSTÜ İŞARETLERİ
   *
   * 66 POI'yi 692.000 tile'a yaymak yürüyüşü boşaltıyordu (dakikada iki
   * ilgi noktası). Bunlar POI listesine girmeyen, tile karmasından türeyen
   * küçük sahnelerdir: düşmüş bir keşif direği, kemik yığını, terk edilmiş
   * kamp, sinyal önbelleği. Sık, ucuz ve her biri kısa bir buluş.
   * ---------------------------------------------------------------- */
  const LANDMARKS = [
    { id: 'marker',  loot: ['scrap', 'copper'],                    n: [1, 2],
      name: { tr: 'Keşif Direği', en: 'Survey Marker' } },
    { id: 'bones',   loot: ['bio_fiber', 'acid_sac'],              n: [1, 3],
      name: { tr: 'Kemik Yığını', en: 'Bone Pile' } },
    { id: 'camp',    loot: ['ration', 'scrap', 'power_cell'],      n: [1, 2],
      name: { tr: 'Terk Edilmiş Kamp', en: 'Abandoned Camp' } },
    { id: 'cache',   loot: ['pcb', 'quartz', 'silicon', 'copper'], n: [1, 2],
      name: { tr: 'Sinyal Önbelleği', en: 'Signal Cache' } },
    { id: 'mast',    loot: ['antenna', 'scrap', 'cd_lens'],        n: [1, 1],
      name: { tr: 'Çökmüş Anten', en: 'Collapsed Mast' } },
    { id: 'crate',   loot: ['power_cell', 'medkit', 'o2_canister'],n: [1, 2],
      name: { tr: 'Kargo Sandığı', en: 'Cargo Crate' } }
  ];

  const LM_DENSITY = 0.005;    // ~1 / 200 tile — yürüyüşü noktalayacak sıklık

  Wd.landmarkAt = function (tx, ty) {
    const b = Wd.biomeAt(tx, ty);
    if (b.t === T.WATER || b.t === T.ROCK || b.t === T.CHASM) return null;
    if (U.hash2(tx, ty, Wd.seed + 5150) > LM_DENSITY) return null;
    /* Enkazın hemen dibi öğretici alanı — orayı kalabalıklaştırma.
       (Tüm POI listesini taramak chunk üretiminde tile başına 66 mesafe
       hesabı demekti; ucuz bir sınır kontrolü yeterli.) */
    const sp = Wd.spawn;
    if (Math.abs(tx - sp.x) < 9 && Math.abs(ty - sp.y) < 9) return null;
    const idx = Math.floor(U.hash2(tx, ty, Wd.seed + 6161) * LANDMARKS.length);
    const def = LANDMARKS[Math.min(idx, LANDMARKS.length - 1)];
    const key = tx + ',' + ty;
    if (Wd.looted[key] !== undefined && Wd.day - Wd.looted[key] < 6) return null;
    return { tx, ty, def };
  };

  Wd.lootLandmark = function (lm) {
    const got = [];
    const n = lm.def.n[0] + Math.floor(U.hash2(lm.tx, lm.ty, Wd.seed + 77) * (lm.def.n[1] - lm.def.n[0] + 1));
    for (let i = 0; i < n; i++) {
      const id = lm.def.loot[Math.floor(Math.random() * lm.def.loot.length)];
      const cnt = (id === 'cd_lens' || id === 'antenna' || id === 'pcb') ? 1 : U.irange(1, 3);
      if (QW.Inventory.add(id, cnt, true)) got.push(QW.Items.name(id) + ' x' + cnt);
    }
    Wd.looted[lm.tx + ',' + lm.ty] = Wd.day;
    Wd.invalidate(lm.tx, lm.ty);
    return got;
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

    /* Rampa renklerini bir kez 32-bit'e çevir */
    const rampCache = new Map();
    function rampOf(b) {
      let r = rampCache.get(b);
      if (!r) {
        r = { ramp: b.ramp.map(col), det: b.detRamp.map(col), alt: b.altRamp.map(col), ao: col(b.ao) };
        rampCache.set(b, r);
      }
      return r;
    }

    const MID = (RAMP_N - 1) / 2;
    let hasWater = false;                 // su parıltısı geçişi için

    /* Yükseklik ızgarası chunk başına BİR kez toplanır (CH+2)².
       Tile döngüsünde komşu komşu sorgulamak 1280 arama demekti; bu 324. */
    const EG = CH + 2;
    const eg = new Float32Array(EG * EG);
    for (let j = 0; j < EG; j++) {
      for (let i = 0; i < EG; i++) eg[j * EG + i] = Wd.elevAt(t0x + i - 1, t0y + j - 1);
    }
    const egAt = (i, j) => eg[(j + 1) * EG + (i + 1)];

    /* Tile merkezlerindeki YAMAÇ IŞIĞI. Piksel döngüsünde bu ızgara
       çift doğrusal aradeğerlenir; ışık tile sınırında kırılmaz. Tile
       başına sabit bir ışık, 16 piksellik yorgan kareleri üretiyordu. */
    const lg = new Float32Array(EG * EG);
    for (let j = 0; j < EG; j++) {
      for (let i = 0; i < EG; i++) {
        const gx = eg[j * EG + Math.min(EG - 1, i + 1)] - eg[j * EG + Math.max(0, i - 1)];
        const gy = eg[Math.min(EG - 1, j + 1) * EG + i] - eg[Math.max(0, j - 1) * EG + i];
        const bb = Wd.biomeAt(t0x + i - 1, t0y + j - 1);
        const rg2 = bb.rough === undefined ? 0.5 : bb.rough;
        let v = (-gx * 0.62 - gy * 0.78) * 38 * rg2;
        lg[j * EG + i] = v < -3.2 ? -3.2 : v > 3.2 ? 3.2 : v;
      }
    }
    const lgAt = (i, j) => lg[(j + 1) * EG + (i + 1)];

    for (let ly = 0; ly < CH; ly++) {
      for (let lx = 0; lx < CH; lx++) {
        const tx = t0x + lx, ty = t0y + ly;
        const b = Wd.biomeAt(tx, ty);
        if (b.t === T.WATER) hasWater = true;
        /* Komşu biyomlar — kenar harmanlaması ve kenar gölgesi için */
        const nb = [Wd.biomeAt(tx, ty - 1), Wd.biomeAt(tx + 1, ty),
                    Wd.biomeAt(tx, ty + 1), Wd.biomeAt(tx - 1, ty)];
        const R = rampOf(b);

        /* --- YAMAÇ IŞIĞI ---------------------------------------------
           Işık sol üstten gelir (16-bit arazi sanatının değişmez kuralı).
           Yükseklik alanının eğimi alınır: ışığa bakan yamaç rampada
           yukarı, arka yamaç aşağı kayar. Düz araziyi bir renk tarlası
           olmaktan çıkarıp yüzeye çeviren şey budur. */
        const eC = egAt(lx, ly);
        /* Tile'ın dört köşesindeki ışık: merkez ile komşuların ortalaması.
           Piksel döngüsü bunların arasını doğrusal olarak dolduracak. */
        const l00 = lgAt(lx, ly);
        const lTL = (l00 + lgAt(lx - 1, ly) + lgAt(lx, ly - 1) + lgAt(lx - 1, ly - 1)) * 0.25;
        const lTR = (l00 + lgAt(lx + 1, ly) + lgAt(lx, ly - 1) + lgAt(lx + 1, ly - 1)) * 0.25;
        const lBL = (l00 + lgAt(lx - 1, ly) + lgAt(lx, ly + 1) + lgAt(lx - 1, ly + 1)) * 0.25;
        const lBR = (l00 + lgAt(lx + 1, ly) + lgAt(lx, ly + 1) + lgAt(lx + 1, ly + 1)) * 0.25;
        const tileLit = l00;

        /* --- KENAR GÖLGESİ (AO) --------------------------------------
           Su, uçurum ve kaya kenarına komşu tile'lar koyulur; yükseklik
           farkı olan yerde zemin "oturur". */
        let aoN = 0;
        for (let i = 0; i < 4; i++) {
          const o = nb[i];
          if (o === b) continue;
          if (o.t === T.WATER || o.t === T.CHASM) aoN |= (1 << i);
          else if (egAt(lx + (i === 1 ? 1 : i === 3 ? -1 : 0),
                        ly + (i === 0 ? -1 : i === 2 ? 1 : 0)) > eC + 0.045) aoN |= (1 << i);
        }

        /* Kenar harmanlaması kararları — tile başına bir kez */
        const eN = nb[0] !== b, eE = nb[1] !== b, eS = nb[2] !== b, eW = nb[3] !== b;
        const edgeAny = eN || eE || eS || eW;
        const rN = eN ? rampOf(nb[0]) : null, rE = eE ? rampOf(nb[1]) : null;
        const rS = eS ? rampOf(nb[2]) : null, rW = eW ? rampOf(nb[3]) : null;

        const rough = b.rough === undefined ? 0.5 : b.rough;
        const detIx = Math.round(2 + tileLit * 0.8) < 0 ? 0 : (Math.round(2 + tileLit * 0.8) > 4 ? 4 : Math.round(2 + tileLit * 0.8));
        const detCol = R.det[detIx];
        const LAST = RAMP_N - 1;

        for (let py = 0; py < TILE; py++) {
          const wy = ty * TILE + py;
          const rowOff = (ly * TILE + py) * CHPX + lx * TILE;
          const v = (py + 0.5) / TILE;
          let lit = lTL + (lBL - lTL) * v;                       // sol kenar ışığı
          const litStep = ((lTR + (lBR - lTR) * v) - lit) / TILE; // sağa doğru artım
          for (let px = 0; px < TILE; px++, lit += litStep) {
            const wx = tx * TILE + px;

            const h = U.hash2(wx, wy, Wd.seed);
            const bay = P.bayer(wx, wy);

            /* Rampa konumu: taban orta basamak. Doku grenini ve yamaç
               ışığını TEK bir sürekli değere toplayıp bayer ile
               kuantalıyoruz — böylece 9 tonla sürekli gradyan görünümü
               elde edilir (ordered dithering, 16-bit'in klasik hilesi). */
            let lvl = MID + lit
              + (h - 0.5) * 0.55              // zemin greni (ışık artık taşıyor)
              + (bay - 0.5) * 0.95;           // sıralı dither -> sürekli gradyan

            /* Kenar gölgesi bandı */
            if (aoN) {
              if ((aoN & 1) && py < 3) lvl -= (3 - py) * 0.85;
              if ((aoN & 2) && px > TILE - 4) lvl -= (px - (TILE - 4)) * 0.85;
              if ((aoN & 4) && py > TILE - 4) lvl -= (py - (TILE - 4)) * 0.85;
              if ((aoN & 8) && px < 3) lvl -= (3 - px) * 0.85;
            }

            let c;
            if (h > 0.972) {
              c = detCol;                     // seyrek detay pikselleri
            } else {
              let ix = (lvl + 0.5) | 0;
              c = R.ramp[ix < 0 ? 0 : ix > LAST ? LAST : ix];
            }

            /* Kenar harmanlaması: komşu biyoma doğru taramalı geçiş.
               Hangi kenarların harmanlanacağı tile başına sabittir; karar
               döngü dışında verilir, burada yalnızca ağırlık hesaplanır. */
            if (edgeAny) {
              let RB = null, w = 0;
              /* Band 4 -> 8 piksel: dar bir bantta iki biyom düz bir duvar
                 gibi çarpışıyordu. Genişlik ayrıca dünya koordinatlı gürültüyle
                 dalgalandırılır; sınır ızgaraya değil araziye uyar. */
              const wob = (U.hash2(wx, wy, Wd.seed + 7717) - 0.5) * 3.4;
              if (eN && py < 8) { RB = rN; w = (8 - py + wob) * 0.125; }
              else if (eE && px > TILE - 9) { RB = rE; w = (px - (TILE - 9) + wob) * 0.125; }
              else if (eS && py > TILE - 9) { RB = rS; w = (py - (TILE - 9) + wob) * 0.125; }
              else if (eW && px < 8) { RB = rW; w = (8 - px + wob) * 0.125; }
              if (RB && bay < w * 0.95) {
                let ix = (MID + (h - 0.5) * 1.15 + (bay - 0.5) * 0.85 + 0.5) | 0;
                c = RB.ramp[ix < 0 ? 0 : ix > LAST ? LAST : ix];
              }
            }

            buf[rowOff + px] = c;
          }
        }

        /* Tile üstü detaylar — dünya koordinatına bağlı, tekrarsız */
        decorate(buf, lx, ly, tx, ty, b, col);
      }
    }

    ctx.putImageData(img, 0, 0);
    cv._water = hasWater;                 // su yoksa parıltı geçişi hiç taranmaz
    /* Kaynak düğümleri ve POI süslemeleri canvas üstüne çizilir */
    for (let ly = 0; ly < CH; ly++) for (let lx = 0; lx < CH; lx++) {
      const tx = t0x + lx, ty = t0y + ly;
      const n = Wd.nodeAt(tx, ty);
      if (n) QW.Sprites.drawNode(ctx, lx * TILE, ly * TILE, n.item);
      const lm = Wd.landmarkAt(tx, ty);
      if (lm) QW.Sprites.drawLandmark(ctx, lx * TILE, ly * TILE, lm.def.id);
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
  /* ------------------------------------------------------------------
   * GÜNÜN SAATİNE GÖRE RENK DERECELENDİRMESİ
   *
   * Tek bir siyah alfa örtüsü sahneyi yalnızca karartır ve donuklaştırır.
   * 16-bit oyunların gece/gündüzü ise renk KAYDIRIR: gece gölgeler maviye
   * düşer ama ay ışığı vurguları soğuk-parlak kalır; şafak ve akşam sıcak
   * bir tabaka ekler. Bunu iki geçişle yapıyoruz — çarpımsal bir renk
   * (gölgeleri boyar) ve üstüne hafif bir ekleme (vurguları ısıtır).
   * ---------------------------------------------------------------- */
  Wd.lightOverlay = function () {
    const t = Wd.time;
    /* mul: multiply katmanı (renk + alfa), add: lighter katmanı */
    let mul = '#33509a', mulA = 0, add = '#000000', addA = 0;
    if (t < 0.18) {                       // derin gece
      mul = '#2c4b96'; mulA = 0.52; add = '#22407a'; addA = 0.07;
    } else if (t < 0.30) {                // şafak
      const k = (t - 0.18) / 0.12;
      mul = U.mixHex('#2c4b96', '#ffb27a', k); mulA = U.lerp(0.52, 0.10, k);
      add = '#ff9a5a'; addA = U.lerp(0.07, 0.16, k) * (1 - Math.abs(k - 0.6) * 1.2);
    } else if (t < 0.66) {                // gündüz
      mulA = 0; add = '#fff2c8'; addA = 0.04;
    } else if (t < 0.82) {                // akşam
      const k = (t - 0.66) / 0.16;
      mul = U.mixHex('#ffc890', '#2c4b96', k); mulA = U.lerp(0.06, 0.48, k);
      add = '#ff7a4a'; addA = 0.16 * (1 - Math.abs(k - 0.35) * 1.6);
    } else {                              // gece
      mul = '#2c4b96'; mulA = 0.52; add = '#22407a'; addA = 0.07;
    }
    return { mul, mulA: Math.max(0, mulA), add, addA: Math.max(0, addA),
             /* geriye dönük uyum: eski çağıranlar için düz alfa */
             a: Math.max(0, mulA), col: mul };
  };

  /* Bu chunk'ta hiç su var mı? (önbellekteki karo görüntüsünden okunur) */
  Wd.chunkHasWater = function (cx, cy) {
    const c = Wd._chunks.get(cx + ',' + cy);
    return c ? !!c._water : true;         // henüz üretilmediyse temkinli davran
  };

  /* Sahnenin üstüne uygulanacak iki geçişli derecelendirme */
  Wd.applyGrade = function (ctx, w, h) {
    const L = Wd.lightOverlay();
    if (L.mulA > 0.02) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = L.mulA;
      ctx.fillStyle = L.mul;
      ctx.fillRect(0, 0, w, h);
    }
    if (L.addA > 0.05) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = L.addA;
      ctx.fillStyle = L.add;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
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
      harvested: pruneHarvested(), disc: packDiscovered(), looted: Wd.looted,
      beacons: Wd.beacons,
      pois: Wd.pois.map(p => ({ id: p.id, cleared: !!p.cleared, looted: !!p.looted, lootDay: p.lootDay || 0, healed: !!p.healed }))
    };
  };
  Wd.load = function (d) {
    Wd.generate(d.seed);
    Wd.spawn = d.spawn || Wd.spawn;
    Wd.day = d.day || 1; Wd.time = d.time || 0.32;
    Wd.harvested = d.harvested || {};
    Wd.looted = d.looted || {};
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
