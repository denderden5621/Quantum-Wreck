/* =========================================================================
 * QW.NPCs — kamp karakterleri, takas ağları ve diyaloglar
 * QW.NPCState — çalışma zamanı durumu (stok, tanışıklık, kilit açma)
 * ========================================================================= */
(function (QW) {
  'use strict';

  const N = {};
  function npc(id, o) { o.id = id; N[id] = o; return o; }

  /* --------------------------------------------------------------------
   * YERALTI SİNYALCİSİ "EKO"
   * ------------------------------------------------------------------ */
  npc('eko', {
    name: { tr: 'Eko', en: 'Eko' },
    title: { tr: 'Yeraltı Sinyalcisi', en: 'Underground Signalman' },
    biomePref: ['plains', 'wreck', 'desert'],
    color: '#7aa2ff', sprite: { s: 'npc_eko', c: '#7aa2ff', c2: '#2b3f7a' },
    music: 'camp',
    greet: [
      { tr: 'Sinyali duydun mu? Hayır, duyamazsın. Ben duyuyorum çünkü dinlemeyi biliyorum.',
        en: 'Did you hear the signal? No, you cannot. I hear it because I know how to listen.' },
      { tr: 'Bana kaset mekanizması getir. Şu Sanyo tarzı olanlardan — makara motoru hâlâ dönüyorsa gerisini ben hallederim.',
        en: 'Bring me cassette decks. The Sanyo-style ones — if the reel motor still turns, I handle the rest.' },
      { tr: 'CD okuyucu lensleri de olur. O küçük lazer optikleri bugün kimsenin yapamadığı kadar temiz odaklıyor.',
        en: 'CD reader lenses too. Those tiny laser optics focus cleaner than anything built today.' }
    ],
    lines: {
      trade: { tr: 'Eski teknoloji hurdası neyin var? Karşılığında zırhına iletişim koyarım.',
               en: 'What old-tech scrap have you got? I will put comms on your armour for it.' },
      nothing: { tr: 'Elin boş. Antika getir, sinyal vereyim.', en: 'Empty handed. Bring antiques, I will give you signal.' },
      done: { tr: 'Bu kadar. Bobinleri sarmam lazım.', en: 'That is it. I have coils to wind.' }
    },
    barter: [
      { give: { cassette_mech: 1, copper: 2 }, get: { id: 'antenna', n: 2 },
        label: { tr: 'Kaset motoru → Anten dizisi', en: 'Tape motor → Antenna array' } },
      { give: { cd_lens: 1, quartz: 1 }, get: { id: 'lens_opt', n: 2 },
        label: { tr: 'CD lensi → Optik lens', en: 'CD lens → Optical lens' } },
      { give: { cassette_mech: 2, cd_lens: 1 }, unlock: 'r_comms', once: true,
        label: { tr: 'Antika seti → İLETİŞİM MODÜLÜ ŞEMASI', en: 'Antique set → COMMS MODULE SCHEMATIC' } },
      { give: { cd_lens: 2, cassette_mech: 2, esp32: 1 }, get: { id: 'comms_module', n: 1 },
        label: { tr: 'Tam set → Hazır iletişim modülü', en: 'Full set → Assembled comms module' } }
    ],
    shop: [
      { id: 'esp32', price: 70, stock: 2 },
      { id: 'pcb', price: 26, stock: 6 },
      { id: 'power_cell', price: 20, stock: 8 },
      { id: 'ration', price: 14, stock: 10 }
    ],
    buys: ['cassette_mech', 'cd_lens', 'scrap', 'copper', 'silicon'],
    quest: 'q_eko'
  });

  /* --------------------------------------------------------------------
   * HAVA KEŞİFÇİSİ "VALKYRIE"
   * ------------------------------------------------------------------ */
  npc('valkyrie', {
    name: { tr: 'Valkyrie', en: 'Valkyrie' },
    title: { tr: 'Hava Keşifçisi', en: 'Air Scout' },
    biomePref: ['canyon', 'mountain'],
    color: '#8fd0ff', sprite: { s: 'npc_valk', c: '#8fd0ff', c2: '#2a4a70' },
    music: 'camp',
    greet: [
      { tr: 'Uçurumun kenarında yaşıyorum çünkü rüzgâr burada dürüst.',
        en: 'I live on the cliff edge because the wind here is honest.' },
      { tr: 'Bana türbülans profili getir — gerçek uçuş verisi. Karşılığında dronunun beynini veririm.',
        en: 'Bring me turbulence profiles — real flight data. I will give your drone its brain.' },
      { tr: 'Pervaneyi öne koy. Çekişli konfigürasyon gövdeyi bozulmamış havada tutar; itişli olan kendi girdabını yutar.',
        en: 'Put the prop up front. A puller keeps the airframe in clean air; a pusher eats its own wake.' }
    ],
    lines: {
      trade: { tr: 'Veri karşılığı şema. Adil takas.', en: 'Data for schematics. A fair trade.' },
      nothing: { tr: 'Veri yoksa uçuş da yok.', en: 'No data, no flight.' },
      done: { tr: 'Rüzgâr dönüyor. Git.', en: 'The wind is turning. Go.' }
    },
    barter: [
      { give: { aero_data: 2 }, unlock: 'r_flight_ctrl', once: true,
        label: { tr: 'Uçuş verisi → UÇUŞ KONTROLCÜSÜ ŞEMASI', en: 'Flight data → FLIGHT CONTROLLER SCHEMATIC' } },
      { give: { aero_data: 3, flight_ctrl: 1 }, unlock: 'r_drone', once: true,
        label: { tr: 'Kontrolcü + veri → KEŞİF İHA\'SI ŞEMASI', en: 'Controller + data → EXPLORATION UAV SCHEMATIC' } },
      { give: { aero_data: 1, titanium: 2 }, get: { id: 'prop_blade', n: 4 },
        label: { tr: 'Veri + titanyum → 4 pervane kanadı', en: 'Data + titanium → 4 propeller blades' } },
      { give: { aero_data: 2, battery: 1 }, get: { id: 'battery', n: 2 },
        label: { tr: 'Batarya optimizasyonu (menzil +)', en: 'Battery optimisation (range +)' } }
    ],
    shop: [
      { id: 'servo', price: 42, stock: 4 },
      { id: 'prop_blade', price: 30, stock: 8 },
      { id: 'battery', price: 60, stock: 2 },
      { id: 'stim', price: 26, stock: 6 }
    ],
    buys: ['aero_data', 'titanium', 'quartz'],
    quest: 'q_valk'
  });

  /* --------------------------------------------------------------------
   * GÖÇEBE TAMİRCİ "KRANK"
   * ------------------------------------------------------------------ */
  npc('krank', {
    name: { tr: 'Krank', en: 'Krank' },
    title: { tr: 'Göçebe Tamirci', en: 'Nomad Mechanic' },
    biomePref: ['plains', 'glacier', 'mountain'],
    color: '#ffd166', sprite: { s: 'npc_krank', c: '#ffd166', c2: '#6a4a10' },
    music: 'camp',
    greet: [
      { tr: 'Kablo. İşlenmiş titanyum kablo. Onun dışında hiçbir şeyle iş yapmam.',
        en: 'Cable. Drawn titanium cable. I do not deal in anything else.' },
      { tr: 'Rover\'ında tek aynakol olsun. Ön aktarıcı çamurda ilk kırılan şeydir.',
        en: 'Run a single chainring on your rover. The front derailleur is the first thing mud kills.' },
      { tr: 'Fren mi? Mekanik disk. Kabloyu sahada değiştirirsin, hidrolik hattı patlarsa yürürsün.',
        en: 'Brakes? Mechanical disc. You can swap a cable in the field; if a hydraulic line bursts, you walk.' }
    ],
    lines: {
      trade: { tr: 'Dayanıklılık modülleri burada. Fiyat kablo.', en: 'Durability modules here. The price is cable.' },
      nothing: { tr: 'Kablo yok, konuşma yok.', en: 'No cable, no conversation.' },
      done: { tr: 'Yolun açık olsun. Zinciri yağla.', en: 'Safe roads. Oil the chain.' }
    },
    barter: [
      { give: { ti_wire: 2 }, unlock: 'r_rover', once: true,
        label: { tr: 'Kablo x2 → ARAZİ ROVER\'I ŞEMASI', en: 'Cable x2 → TERRAIN ROVER SCHEMATIC' } },
      { give: { ti_wire: 3, ice_shard: 4 }, unlock: 'r_suit_thermal', once: true,
        label: { tr: 'Kablo + buz → TERMAL ZIRH ŞEMASI', en: 'Cable + ice → THERMAL ARMOUR SCHEMATIC' } },
      { give: { ti_wire: 1, titanium: 2 }, get: { id: 'disc_brake', n: 1 },
        label: { tr: 'Kablo → Mekanik disk fren', en: 'Cable → Mechanical disc brake' } },
      { give: { ti_wire: 1, scrap: 3 }, get: { id: 'chainring', n: 1 },
        label: { tr: 'Kablo → Tekli aynakol', en: 'Cable → Single chainring' } },
      { give: { ti_wire: 2, rubber_sap: 2 }, get: { id: 'veh_upgrade_dura', n: 1 }, special: 'dura',
        label: { tr: 'Kablo → Araç dayanıklılık modülü (+40 kalıcı)', en: 'Cable → Vehicle durability module (+40 permanent)' } }
    ],
    shop: [
      { id: 'frame_alloy', price: 90, stock: 1 },
      { id: 'tire_knobby', price: 34, stock: 4 },
      { id: 'repair_kit', price: 52, stock: 6 },
      { id: 'titanium', price: 18, stock: 10 }
    ],
    buys: ['ti_wire', 'titanium', 'scrap', 'rubber_sap'],
    quest: 'q_krank'
  });

  /* --------------------------------------------------------------------
   * KAYIP ARŞİVCİ "TOME"
   * ------------------------------------------------------------------ */
  npc('tome', {
    name: { tr: 'Tome', en: 'Tome' },
    title: { tr: 'Kayıp Arşivci', en: 'Lost Archivist' },
    biomePref: ['forest', 'plains', 'swamp'],
    color: '#c79bff', sprite: { s: 'npc_tome', c: '#c79bff', c2: '#3a2070' },
    music: 'camp',
    greet: [
      { tr: 'Kütüphane çöktü ama kataloğu ben taşıyorum. Kafamda ve kristallerde.',
        en: 'The library collapsed, but I carry the catalogue. In my head and in crystals.' },
      { tr: 'Veri kristali getir. Karşılığında okuyacak bir şey veririm — kare kare renklendirdiğim fantastik seriler.',
        en: 'Bring data crystals. I will give you something to read — fantasy series I colourised panel by panel.' },
      { tr: 'Ateşin başında oku. Stres düşer. Bunu bir ilaç kadar ciddiye al.',
        en: 'Read them by the fire. Stress drops. Take that as seriously as medicine.' }
    ],
    lines: {
      trade: { tr: 'Kristal karşılığı arşiv. Kâğıt yok ama renk var.', en: 'Archive for crystal. No paper, but there is colour.' },
      nothing: { tr: 'Kristalin yok. Yıkık kütüphanelere bak, güveler oralarda taşıyor.',
                 en: 'No crystals. Look in the ruined libraries — the moths carry them.' },
      done: { tr: 'İyi okumalar, gezgin.', en: 'Good reading, traveller.' }
    },
    barter: [
      { give: { data_crystal: 1 }, get: { id: 'manga_garden', n: 1 },
        label: { tr: 'Kristal → Yıldız Bahçesi Cilt 1 (renklendirilmiş)', en: 'Crystal → Star Garden Vol. 1 (colourised)' } },
      { give: { data_crystal: 2 }, get: { id: 'manga_leviathan', n: 1 },
        label: { tr: 'Kristal x2 → Kum Leviathan\'ı Cilt 3', en: 'Crystal x2 → Sand Leviathan Vol. 3' } },
      { give: { data_crystal: 4 }, get: { id: 'comic_archive', n: 1 },
        label: { tr: 'Kristal x4 → Dijital çizgi roman arşivi', en: 'Crystal x4 → Digital comic archive' } },
      { give: { data_crystal: 3, quartz: 2 }, get: { id: 'ship_log', n: 1 }, once: true,
        label: { tr: 'Kristal → Argos\'un kayıp seyir kaydı', en: "Crystal → The Argos' lost flight log" } }
    ],
    shop: [
      { id: 'spore_tea', price: 30, stock: 6 },
      { id: 'medkit', price: 40, stock: 5 },
      { id: 'data_crystal', price: 55, stock: 2 }
    ],
    buys: ['data_crystal', 'spore_cap', 'quartz'],
    quest: 'q_tome'
  });

  /* --------------------------------------------------------------------
   * MERKEZ İSTASYON TÜCCARLARI
   * ------------------------------------------------------------------ */
  npc('station_quartermaster', {
    name: { tr: 'Levazımcı Vela', en: 'Quartermaster Vela' },
    title: { tr: 'Merkez İstasyon', en: 'Central Station' },
    station: true, biomePref: ['plains'],
    color: '#4df2c8', sprite: { s: 'npc_vela', c: '#4df2c8', c2: '#0e6a55' },
    music: 'camp',
    greet: [
      { tr: 'Merkez İstasyon\'a hoş geldin. Enerji Kredisi geçer, hikâye geçmez.',
        en: 'Welcome to Central Station. Energy Credits work here. Stories do not.' },
      { tr: 'Temel ihtiyaç ne varsa raftadır. Tezgâh da açık — bazı şemalar sadece burada çalışır.',
        en: 'Every necessity is on the shelf. The bench is open too — some schematics only run here.' }
    ],
    lines: {
      trade: { tr: 'Al, sat, tezgâhı kullan.', en: 'Buy, sell, use the bench.' },
      nothing: { tr: 'Kredi lazım.', en: 'You need credits.' },
      done: { tr: 'İstasyon her zaman açık.', en: 'The station is always open.' }
    },
    barter: [
      { give: { core_fragment: 0 }, get: null }
    ],
    shop: [
      { id: 'medkit', price: 38, stock: 12 },
      { id: 'o2_canister', price: 28, stock: 12 },
      { id: 'ration', price: 13, stock: 20 },
      { id: 'stim', price: 24, stock: 8 },
      { id: 'antirad', price: 44, stock: 6 },
      { id: 'coolant', price: 34, stock: 6 },
      { id: 'repair_kit', price: 50, stock: 6 },
      { id: 'power_cell', price: 18, stock: 12 },
      { id: 'silicon', price: 9, stock: 20 },
      { id: 'copper', price: 8, stock: 20 }
    ],
    buys: '*',
    bench: 'station',
    schematics: [
      { unlock: 'r_shield', price: 260 },
      { unlock: 'r_rail', price: 300 },
      { unlock: 'r_suit_rad', price: 340 },
      { unlock: 'r_lance', price: 520 }
    ]
  });

  npc('station_broker', {
    name: { tr: 'Simsar Odd', en: 'Broker Odd' },
    title: { tr: 'Merkez İstasyon', en: 'Central Station' },
    station: true, biomePref: ['plains'],
    color: '#ffd166', sprite: { s: 'npc_odd', c: '#ffd166', c2: '#6a4a10' },
    music: 'camp',
    greet: [
      { tr: 'Hurdanı getir. Ben ağırlığına değil, kime lazım olduğuna bakarım.',
        en: 'Bring me your scrap. I do not price by weight, I price by who needs it.' },
      { tr: 'Kuantum parçası mı? Ona dokunmam. O şey bakana bakıyor.',
        en: 'A core fragment? I do not touch those. That thing looks back.' }
    ],
    lines: {
      trade: { tr: 'Fiyatlar bugün iyi.', en: 'Prices are good today.' },
      nothing: { tr: 'Boş elle gelme.', en: 'Do not come empty handed.' },
      done: { tr: 'Yine bekleriz.', en: 'Come again.' }
    },
    barter: [
      { give: { scrap: 10 }, get: { id: 'power_cell', n: 3 },
        label: { tr: 'Hurda x10 → Enerji hücresi x3', en: 'Scrap x10 → Power cell x3' } },
      { give: { silicon: 6, copper: 6 }, get: { id: 'pcb', n: 4 },
        label: { tr: 'Silikon+bakır → Devre kartı x4', en: 'Silicon+copper → PCB x4' } },
      { give: { acid_sac: 3 }, get: { id: 'ti_wire', n: 1 },
        label: { tr: 'Asit kesesi x3 → Titanyum kablo', en: 'Acid sac x3 → Titanium cable' } }
    ],
    shop: [
      { id: 'cassette_mech', price: 60, stock: 2 },
      { id: 'cd_lens', price: 66, stock: 2 },
      { id: 'ti_wire', price: 70, stock: 3 },
      { id: 'quartz', price: 16, stock: 10 },
      { id: 'bio_fiber', price: 8, stock: 20 },
      { id: 'rubber_sap', price: 12, stock: 12 }
    ],
    buys: '*'
  });

  /* ====================================================================
   * ÇALIŞMA ZAMANI DURUMU
   * ================================================================== */
  const State = QW.NPCState = {
    data: {},       // id -> { met, stock:{}, doneBarters:[], talks }

    reset() {
      State.data = {};
      Object.keys(N).forEach(id => {
        State.data[id] = { met: false, talks: 0, doneBarters: [], stock: {} };
        (N[id].shop || []).forEach(s => { State.data[id].stock[s.id] = s.stock; });
      });
    },

    of(id) {
      if (!State.data[id]) {
        State.data[id] = { met: false, talks: 0, doneBarters: [], stock: {} };
        (N[id].shop || []).forEach(s => { State.data[id].stock[s.id] = s.stock; });
      }
      return State.data[id];
    },

    /* Tüccar stokları her gün yenilenir */
    restock() {
      Object.keys(N).forEach(id => {
        const st = State.of(id);
        (N[id].shop || []).forEach(s => {
          st.stock[s.id] = Math.min(s.stock, (st.stock[s.id] || 0) + Math.ceil(s.stock / 2));
        });
      });
    },

    serialize: () => QW.Utils.deepCopy(State.data),
    load(d) { State.reset(); if (d) Object.keys(d).forEach(k => { State.data[k] = d[k]; }); }
  };

  QW.NPCs = {
    db: N,
    get: id => N[id] || null,
    all: () => Object.keys(N),
    camps: () => Object.keys(N).filter(k => !N[k].station),
    stationFolk: () => Object.keys(N).filter(k => N[k].station),
    add: (id, o) => npc(id, o)
  };

})(window.QW);
