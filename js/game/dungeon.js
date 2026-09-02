/* =========================================================================
 * QW.Dungeon — Zelda usulü kilit-anahtar zindan üreteci
 *
 * Araştırmadan çıkan yapı (Boss Keys / "Zelda kalıbı"):
 *   1. Zindan bir ODA GRAFIĞIDIR; ilerleme kilitlerle denetlenir.
 *   2. Her zindanın bir CİHAZI vardır: önce bulunur, sonra bulmacalarla
 *      kendini öğretir, en sonunda BOSS onunla yenilir.
 *   3. Anahtar daima kilidinden ÖNCE erişilebilir olmalıdır.
 *
 * Üretim "ileriye doğru büyütme" ile yapılır: her adımda yalnızca şu an
 * erişilebilir odalardan yeni oda açılır; bir kapı kilitlendiğinde anahtarı
 * o ana kadar erişilebilir olan kümeye konur. Bu sayede zindan İNŞA GEREĞİ
 * çözülebilirdir — sonradan doğrulama gerekmez (yine de test ediyoruz).
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils;

  /* Oda ızgarası: klasik el konsolu oranı, 10x8 tile (160x128 px) */
  const RW = 10, RH = 8;

  /* Zindan cihazları — her biri bir engeli açar ve bossta işe yarar */
  const DEVICES = {
    grapnel: {
      id: 'dev_grapnel', barrier: 'gap',
      name: { tr: 'Kanca Fırlatıcı', en: 'Grapnel Launcher' },
      desc: { tr: 'Karşı kenara kanca atar. Boşlukları geçer, uzaktaki mandalları çeker.',
              en: 'Fires a hook to the far ledge. Crosses gaps and pulls distant latches.' },
      hint: { tr: 'Boşluğun karşısına kanca at.', en: 'Hook across the gap.' } },
    torch: {
      id: 'dev_torch', barrier: 'ice',
      name: { tr: 'Termal Mızrak', en: 'Thermal Lance' },
      desc: { tr: 'Yoğunlaştırılmış ısı huzmesi. Buz tıkaçlarını eritir, donmuş mekanizmayı çözer.',
              en: 'A focused heat beam. Melts ice plugs and frees frozen mechanisms.' },
      hint: { tr: 'Buz tıkacını erit.', en: 'Melt the ice plug.' } },
    resonator: {
      id: 'dev_resonator', barrier: 'sealed',
      name: { tr: 'Rezonatör', en: 'Resonator' },
      desc: { tr: 'Kapının kilit frekansını bulup mühürü titreşimle açar.',
              en: 'Finds a door’s lock frequency and shakes the seal open.' },
      hint: { tr: 'Mühürlü kapıyı titreşimle aç.', en: 'Shake the sealed door open.' } },
    magboot: {
      id: 'dev_magboot', barrier: 'mag',
      name: { tr: 'Manyetik Pabuç', en: 'Mag Cleats' },
      desc: { tr: 'Manyetik zemine kilitlenir. Rüzgâr ve eğim seni sürükleyemez.',
              en: 'Locks to magnetic plating. Wind and slope cannot drag you.' },
      hint: { tr: 'Manyetik zeminde yürü.', en: 'Walk the magnetic floor.' } },
    phase: {
      id: 'dev_phase', barrier: 'phase',
      name: { tr: 'Faz Bobini', en: 'Phase Coil' },
      desc: { tr: 'Kısa süre madde fazını kaydırır. Enerji perdelerinden geçirir.',
              en: 'Briefly shifts your phase. Carries you through energy curtains.' },
      hint: { tr: 'Enerji perdesinden geç.', en: 'Step through the energy curtain.' } }
  };

  /* Zindan tanımları — her biyomun hâkimi artık bir zindanın sonundadır */
  const DUNGEONS = {
    glacier: { id: 'd_glacier', device: 'torch', boss: 'boss_ice_worm', rooms: 11, locks: 2,
      name: { tr: 'Donmuş Tesis', en: 'The Frozen Facility' },
      tile: { floor: '#2e4356', wall: '#8fbcd8', deco: '#cbe2f0' } },
    swamp: { id: 'd_swamp', device: 'grapnel', boss: 'boss_acid_golem', rooms: 12, locks: 2,
      name: { tr: 'Batık Arıtma', en: 'The Sunken Works' },
      tile: { floor: '#2a3a24', wall: '#6a8a44', deco: '#89b444' } },
    desert: { id: 'd_desert', device: 'resonator', boss: 'boss_sand_leviathan', rooms: 12, locks: 3,
      name: { tr: 'Cam Mezar', en: 'The Glass Tomb' },
      tile: { floor: '#3a3020', wall: '#c1a86c', deco: '#efe6c2' } },
    forest: { id: 'd_forest', device: 'phase', boss: 'boss_spore_titan', rooms: 13, locks: 3,
      name: { tr: 'Miselyum Sarnıcı', en: 'The Mycelium Cistern' },
      tile: { floor: '#241a2e', wall: '#7d5aa0', deco: '#c07de0' } },
    canyon: { id: 'd_canyon', device: 'magboot', boss: 'boss_storm_harrier', rooms: 13, locks: 3,
      name: { tr: 'Rüzgâr Kulesi', en: 'The Wind Tower' },
      tile: { floor: '#3a2a1e', wall: '#a97a52', deco: '#d0a070' } }
  };

  const D = QW.Dungeon = { RW, RH, DEVICES, DUNGEONS };

  D.def = biome => DUNGEONS[biome] || null;
  D.deviceDef = key => DEVICES[key] || null;

  /* ------------------------------------------------------------------
   * ÜRETİM
   * ---------------------------------------------------------------- */
  D.generate = function (biome, seed) {
    const def = DUNGEONS[biome];
    if (!def) return null;
    const rnd = U.rng((seed ^ U.hash(def.id)) >>> 0);
    const dev = DEVICES[def.device];

    /* --- 1. Odaları kilitsiz büyüt, sonra kilitleri OMURGAYA diz ---
       Araştırmadaki Ocarina ilkesi: oyuncunun elinde aynı anda yalnızca tek
       bir açılabilir kilit bulunsun. Genel amaçlı anahtarı yanlış kapıya
       harcayıp kilitlenmek ancak böyle imkânsız olur. Bu yüzden kilitler
       rastgele kenarlara değil, girişten boss odasına giden tek yol üzerine
       sırayla konur; i. kilidin anahtarı (i-1). kilidin açtığı alandadır. */
    const GW = 6, GH = 5;
    const grid = {};
    const key = (x, y) => x + ',' + y;
    const startX = Math.floor(GW / 2), startY = GH - 1;
    const start = mkRoom(startX, startY, 'entrance');
    grid[key(startX, startY)] = start;

    const rooms = [start];
    const edges = [];

    while (rooms.length < def.rooms) {
      const f = [];
      rooms.forEach(r => {
        [[0, -1, 'n'], [1, 0, 'e'], [0, 1, 's'], [-1, 0, 'w']].forEach(([dx, dy, dir]) => {
          const nx = r.gx + dx, ny = r.gy + dy;
          if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) return;
          if (grid[key(nx, ny)]) return;
          f.push({ from: r, nx, ny, dir });
        });
      });
      if (!f.length) break;
      const pick = f[Math.floor(rnd() * f.length)];
      const room = mkRoom(pick.nx, pick.ny, 'normal');
      grid[key(pick.nx, pick.ny)] = room;
      rooms.push(room);
      edges.push({ a: pick.from, b: room, dir: pick.dir, lock: null });
    }

    /* --- 2. Boss odası: en uzaktaki odanın ötesinde --- */
    const far = farthest(start, rooms, edges);
    const bossPos = freeNeighbour(far, grid, GW, GH, rnd);
    let bossRoom;
    if (bossPos) {
      bossRoom = mkRoom(bossPos.x, bossPos.y, 'boss');
      grid[key(bossPos.x, bossPos.y)] = bossRoom;
      rooms.push(bossRoom);
      edges.push({ a: far, b: bossRoom, dir: bossPos.dir, lock: 'boss' });
    } else {
      far.kind = 'boss';
      bossRoom = far;
    }

    /* --- 3. Omurga: girişten boss odasına giden tek yol --- */
    const adj = new Map(rooms.map(r => [r, []]));
    edges.forEach(e => { adj.get(e.a).push({ r: e.b, e }); adj.get(e.b).push({ r: e.a, e }); });
    const parent = new Map([[start, null]]);
    const bfs = [start];
    while (bfs.length) {
      const r = bfs.shift();
      adj.get(r).forEach(({ r: n, e }) => {
        if (parent.has(n)) return;
        parent.set(n, { room: r, edge: e });
        bfs.push(n);
      });
    }
    const spine = [];                       // boss'tan girişe doğru kenarlar
    for (let cur = bossRoom; parent.get(cur); cur = parent.get(cur).room) {
      spine.push(parent.get(cur));
    }
    spine.reverse();                        // girişten boss'a

    /* Bir kenarın "kesilmesi" hâlinde girişten erişilebilen odalar */
    function reachableWithout(cutEdges) {
      const seen = new Set([start]);
      const q = [start];
      while (q.length) {
        const r = q.shift();
        adj.get(r).forEach(({ r: n, e }) => {
          if (cutEdges.has(e) || seen.has(n)) return;
          seen.add(n); q.push(n);
        });
      }
      return seen;
    }

    /* --- 4. Kilitleri omurgaya sırayla yerleştir --- */
    const inner = spine.filter(s2 => s2.edge.lock !== 'boss');
    const lockCount = Math.min(def.locks, Math.max(0, inner.length - 1));
    const chosen = [];
    if (lockCount > 0) {
      /* Omurgayı eşit aralıklarla böl */
      for (let i = 1; i <= lockCount; i++) {
        const idx = Math.min(inner.length - 1, Math.round(i * inner.length / (lockCount + 1)));
        if (!chosen.includes(inner[idx])) chosen.push(inner[idx]);
      }
    }
    const cut = new Set();
    chosen.forEach(s2 => {
      s2.edge.lock = 'key';
      /* Anahtar, BU kilit ve sonrakiler kapalıyken erişilebilen bir odada */
      const barrier = new Set(cut); barrier.add(s2.edge);
      const before = Array.from(reachableWithout(barrier))
        .filter(r => r !== start || rooms.length < 3);
      const host = before[Math.floor(rnd() * before.length)] || start;
      host.contains.push({ type: 'smallkey' });
      cut.add(s2.edge);
    });

    /* --- 5. Cihaz: hiçbir kilidin ardında olmayan bir odada --- */
    const preLock = Array.from(reachableWithout(new Set(chosen.length ? [chosen[0].edge] : [])))
      .filter(r => r !== start && r !== bossRoom);
    const deviceRoom = preLock[Math.floor(rnd() * preLock.length)] || rooms[1] || start;
    deviceRoom.kind = 'device';
    deviceRoom.contains.push({ type: 'device' });

    /* --- 6. Cihaz engelleri: yan dallarda, cihaz alındıktan SONRA ---
       Engel, cihaza giden yolun üstüne konamaz: yoksa cihazı almak için
       cihazın kendisi gerekir. */
    const toDevice = new Set();
    for (let cur = deviceRoom; parent.get(cur); cur = parent.get(cur).room) {
      toDevice.add(parent.get(cur).edge);
    }
    let barriersLeft = 3;
    edges.forEach(e => {
      if (barriersLeft <= 0 || e.lock) return;
      if (spine.some(s2 => s2.edge === e)) return;      // omurgayı engelle kapatma
      if (toDevice.has(e)) return;                       // cihaza giden yolu kapatma
      if (rnd() < 0.45) { e.lock = dev.barrier; barriersLeft--; }
    });

    /* --- 7. Boss anahtarı: boss kapısından önce erişilebilir bir odada --- */
    const bossEdge = spine[spine.length - 1] ? spine[spine.length - 1].edge : null;
    const beforeBoss = Array.from(reachableWithout(new Set(bossEdge ? [bossEdge] : [])))
      .filter(r => r !== bossRoom && r !== start);
    const bkHost = beforeBoss[Math.floor(rnd() * beforeBoss.length)] || start;
    bkHost.contains.push({ type: 'bosskey' });

    /* --- 8. Harita, pusula ve hazineler --- */
    const others = rooms.filter(r => r.kind === 'normal' && !r.contains.length);
    if (others.length) others.splice(Math.floor(rnd() * others.length), 1)[0].contains.push({ type: 'map' });
    if (others.length) others.splice(Math.floor(rnd() * others.length), 1)[0].contains.push({ type: 'compass' });
    others.forEach(r => { if (rnd() < 0.55) r.contains.push({ type: 'chest' }); });

    /* --- 4. Oda içi düzen ve düşmanlar --- */
    rooms.forEach(r => layoutRoom(r, def, rnd, edges));

    return {
      id: def.id, biome, def, device: def.device, deviceDef: dev,
      rooms, edges, grid, start, bossRoom,
      GW, GH,
      /* çalışma zamanı durumu */
      state: {
        cur: start.id, keys: 0, bossKey: false, hasDevice: false,
        map: false, compass: false, opened: {}, cleared: {}, visited: {}, solved: {},
        beaten: false
      }
    };
  };

  /* ---------------------- yardımcılar ---------------------- */
  let _rid = 0;
  function mkRoom(gx, gy, kind) {
    return { id: 'r' + (++_rid), gx, gy, kind, contains: [], tiles: null, enemies: [] };
  }

  function pickHost(list, rnd) {
    const pool = list.filter(r => r.kind !== 'boss');
    return pool[Math.floor(rnd() * pool.length)] || list[0];
  }

  function farthest(start, rooms, edges) {
    const adj = new Map();
    rooms.forEach(r => adj.set(r, []));
    edges.forEach(e => { adj.get(e.a).push(e.b); adj.get(e.b).push(e.a); });
    const dist = new Map([[start, 0]]);
    const q = [start];
    let best = start;
    while (q.length) {
      const r = q.shift();
      (adj.get(r) || []).forEach(n => {
        if (dist.has(n)) return;
        dist.set(n, dist.get(r) + 1);
        if (dist.get(n) > dist.get(best)) best = n;
        q.push(n);
      });
    }
    return best;
  }

  function freeNeighbour(room, grid, GW, GH, rnd) {
    const opts = [[0, -1, 'n'], [1, 0, 'e'], [0, 1, 's'], [-1, 0, 'w']]
      .map(([dx, dy, dir]) => ({ x: room.gx + dx, y: room.gy + dy, dir }))
      .filter(p => p.x >= 0 && p.y >= 0 && p.x < GW && p.y < GH && !grid[p.x + ',' + p.y]);
    if (!opts.length) return null;
    return opts[Math.floor(rnd() * opts.length)];
  }

  /* ------------------------------------------------------------------
   * ODA DÜZENİ — duvarlar, kapı boşlukları, engeller
   * tile kodları: 0 zemin, 1 duvar, 2 çukur, 3 sandık yeri, 4 itilebilir kasa,
   *               5 basınç plakası, 6 dekor
   * ---------------------------------------------------------------- */
  function layoutRoom(room, def, rnd, edges) {
    const t = [];
    for (let y = 0; y < RH; y++) {
      const row = [];
      for (let x = 0; x < RW; x++) {
        row.push((x === 0 || y === 0 || x === RW - 1 || y === RH - 1) ? 1 : 0);
      }
      t.push(row);
    }
    /* Kapı boşlukları */
    room.doors = {};
    edges.forEach(e => {
      let dir = null, other = null;
      if (e.a === room) { dir = e.dir; other = e.b; }
      else if (e.b === room) { dir = opposite(e.dir); other = e.a; }
      if (!dir) return;
      room.doors[dir] = { to: other.id, lock: e.lock, edge: e };
      carveDoor(t, dir);
    });

    /* Giriş odasının güney duvarında zindandan çıkış vardır. Başlangıç odası
       her zaman en alt sırada üretildiği için burada gerçek bir kapı olamaz. */
    if (room.kind === 'entrance') { room.exit = true; carveDoor(t, 's'); }

    /* İç engeller — oda türüne göre */
    const cx = RW >> 1, cy = RH >> 1;
    if (room.kind === 'boss') {
      /* Boss odası boş ve geniş kalır */
    } else if (room.contains.some(c => c.type === 'device')) {
      /* Cihaz odası: ortada kaide, çevresi açık */
      t[cy][cx] = 6;
    } else {
      const style = rnd();
      if (style < 0.22) {
        /* sütunlar */
        for (let y = 2; y < RH - 2; y += 2) for (let x = 2; x < RW - 2; x += 3) t[y][x] = 1;
      } else if (style < 0.42 && def.device === 'grapnel') {
        /* Çukur şeridi yalnızca KANCA zindanında çıkar: her zindanın engel
           dili kendi cihazını öğretir. Geçilemeyecek bir engel koymak,
           oyuncuya çözümü olmayan bir bulmaca göstermektir. */
        const y = 2 + Math.floor(rnd() * (RH - 5));
        for (let x = 2; x < RW - 2; x++) if (rnd() < 0.8) t[y][x] = 2;
      } else if (style < 0.60) {
        /* kasa + plaka bulmacası */
        t[cy][cx - 2] = 4;
        t[cy][cx + 2] = 5;
        room.puzzle = 'plate';
      } else if (style < 0.75) {
        /* köşe blokları */
        t[2][2] = 1; t[2][RW - 3] = 1; t[RH - 3][2] = 1; t[RH - 3][RW - 3] = 1;
      }
      /* Düşman odası */
      if (room.kind === 'normal' && rnd() < 0.55) {
        room.combat = 1 + (rnd() < 0.4 ? 1 : 0);
      }
    }

    /* Eşyalar odanın orta bandında durur; engeller oraya denk gelirse eşya
       duvarın içinde kalır. Bandı temizleyerek her içeriği alınabilir kıl. */
    if (room.contains && room.contains.length) {
      const my = RH >> 1;
      for (let x = 2; x < RW - 2; x++) {
        for (let y = my - 1; y <= my; y++) if (t[y][x] === 1 || t[y][x] === 2) t[y][x] = 0;
      }
    }
    room.tiles = t;
    /* Bozulmamış kopya: bulmaca çözülmeden odadan çıkılırsa kasalar
       başlangıç yerine döner (klasik Zelda oda sıfırlaması). Kasayı kapıya
       itip kalıcı olarak tıkamak böylece imkânsızdır. */
    room.tiles0 = t.map(r => r.slice());
  }

  function carveDoor(t, dir) {
    const mx = RW >> 1, my = RH >> 1;
    if (dir === 'n') { t[0][mx] = 0; t[0][mx - 1] = 0; }
    if (dir === 's') { t[RH - 1][mx] = 0; t[RH - 1][mx - 1] = 0; }
    /* Yan kapılar da kuzey/güney gibi İKİ tile yüksekliğinde açılır: tek tile
       genişliğinde bir boşluk oyuncunun çarpışma kutusundan dar kalıyor ve
       kapı geçilemez oluyordu. */
    if (dir === 'w') { t[my][0] = 0; t[my - 1][0] = 0; }
    if (dir === 'e') { t[my][RW - 1] = 0; t[my - 1][RW - 1] = 0; }
  }

  function opposite(d) { return d === 'n' ? 's' : d === 's' ? 'n' : d === 'e' ? 'w' : 'e'; }
  D.opposite = opposite;

  /* ------------------------------------------------------------------
   * ÇÖZÜLEBİLİRLİK DOĞRULAMASI
   * Üretim inşa gereği çözülebilir olmalı; bu fonksiyon bunu bağımsızca
   * kanıtlar: elde ne varsa onunla nereye gidilebiliyor diye sabit nokta
   * araması yapar ve boss odasına ulaşılıp ulaşılmadığını söyler.
   * ---------------------------------------------------------------- */
  D.verify = function (dj) {
    /* Anahtarlar genel amaçlıdır; açgözlü harcama yanlış "çözülemez" sonucu
       verebilir. Bu yüzden önce KİLİTSİZ yayılım yapılır, sonra elde anahtar
       varken açılabilecek kilitlerden biri açılır ve yayılım tekrarlanır.
       Omurga tasarımı gereği her an en fazla bir kilit açık olduğundan bu
       arama hem doğru hem ucuzdur. */
    const collected = new Set();
    let keys = 0, bossKey = false, hasDevice = false;
    const seen = new Set([dj.start]);

    const collect = room => {
      (room.contains || []).forEach((c, i) => {
        const tag = room.id + ':' + i;
        if (collected.has(tag)) return;
        collected.add(tag);
        if (c.type === 'smallkey') keys++;
        if (c.type === 'bosskey') bossKey = true;
        if (c.type === 'device') hasDevice = true;
      });
    };

    const spread = () => {
      let grew = true;
      while (grew) {
        grew = false;
        dj.edges.forEach(e => {
          const aS = seen.has(e.a), bS = seen.has(e.b);
          if (aS === bS) return;
          const target = aS ? e.b : e.a;
          let pass = false;
          if (!e.lock) pass = true;
          else if (e.lock === 'boss') pass = bossKey;
          else if (e.lock !== 'key') pass = hasDevice;
          if (pass) { seen.add(target); collect(target); grew = true; }
        });
      }
    };

    collect(dj.start);
    spread();

    let guard = 0;
    while (guard++ < 60) {
      if (keys <= 0) break;
      const openable = dj.edges.filter(e => e.lock === 'key' && !e.used &&
        (seen.has(e.a) !== seen.has(e.b)));
      if (!openable.length) break;
      openable[0].used = true;
      keys--;
      const target = seen.has(openable[0].a) ? openable[0].b : openable[0].a;
      seen.add(target); collect(target);
      spread();
    }
    dj.edges.forEach(e => { delete e.used; });

    return {
      ok: seen.has(dj.bossRoom),
      reached: seen.size, total: dj.rooms.length,
      hasDevice, bossKey
    };
  };

})(window.QW);
