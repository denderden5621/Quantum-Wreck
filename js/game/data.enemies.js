/* =========================================================================
 * QW.Enemies — düşman ve bölge hâkimi (boss) veritabanı
 *  weak  : radar ile bulunabilen zayıf nokta anahtarı
 *  moves : { id, w(ağırlık), dmg, kind } — sıra tabanlı yapay zekâ havuzu
 *  drop  : { id, n, p(olasılık) }
 * ========================================================================= */
(function (QW) {
  'use strict';

  const E = {};
  function en(id, o) { o.id = id; E[id] = o; return o; }

  /* ------------------------- SIRADAN DÜŞMANLAR ------------------------- */
  en('scrap_crawler', {
    name: { tr: 'Hurda Sürüngeni', en: 'Scrap Crawler' },
    biome: ['plains', 'shore', 'wreck'], lvl: 1, hp: 26, atk: 6, def: 2, spd: 5, xp: 8, ec: 6,
    weak: 'joint', sprite: { s: 'crawler', c: '#8a94a8', c2: '#d98b45' },
    moves: [{ id: 'bite', w: 3, dmg: 1.0 }, { id: 'skitter', w: 1, dmg: 0.6, kind: 'evade' }],
    drop: [{ id: 'scrap', n: 2, p: 0.9 }, { id: 'copper', n: 1, p: 0.4 }],
    desc: { tr: 'Enkaz parçalarını kendine kabuk yapmış mekanik asalak.', en: 'A mechanical parasite that wears wreckage as a shell.' }
  });

  en('glass_hopper', {
    name: { tr: 'Cam Çekirgesi', en: 'Glass Hopper' },
    biome: ['desert'], lvl: 2, hp: 34, atk: 9, def: 3, spd: 8, xp: 12, ec: 9,
    weak: 'shell', sprite: { s: 'hopper', c: '#e6d9a8', c2: '#8a7a45' },
    moves: [{ id: 'slash', w: 3, dmg: 1.0 }, { id: 'leap', w: 2, dmg: 1.4, kind: 'heavy' }],
    drop: [{ id: 'silicon', n: 2, p: 0.8 }, { id: 'quartz', n: 1, p: 0.35 }],
    desc: { tr: 'Erimiş kumdan kabuğu güneşte kör edici parlar.', en: 'Its fused-sand carapace glares blindingly in the sun.' }
  });

  en('rad_jackal', {
    name: { tr: 'Radyasyon Çakalı', en: 'Rad Jackal' },
    biome: ['plains', 'desert', 'canyon'], lvl: 3, hp: 40, atk: 11, def: 3, spd: 9, xp: 16, ec: 12,
    weak: 'core', sprite: { s: 'jackal', c: '#c9d06a', c2: '#5e6a1c' },
    moves: [{ id: 'bite', w: 3, dmg: 1.0 }, { id: 'howl', w: 1, dmg: 0, kind: 'buff' }, { id: 'rend', w: 2, dmg: 1.3 }],
    drop: [{ id: 'bio_fiber', n: 2, p: 0.7 }, { id: 'power_cell', n: 1, p: 0.25 }],
    desc: { tr: 'Fırtına sonrası sürüler hâlinde iner. Işıldayan gözleri var.', en: 'Comes down in packs after a storm. Its eyes glow.' }
  });

  en('spore_walker', {
    name: { tr: 'Spor Yürüyücüsü', en: 'Spore Walker' },
    biome: ['forest'], lvl: 3, hp: 46, atk: 10, def: 5, spd: 4, xp: 18, ec: 11,
    weak: 'vent', sprite: { s: 'walker', c: '#c07de0', c2: '#4a2a6a' },
    moves: [{ id: 'slam', w: 3, dmg: 1.1 }, { id: 'spore', w: 2, dmg: 0.7, kind: 'poison' }],
    drop: [{ id: 'spore_cap', n: 3, p: 0.9 }, { id: 'rubber_sap', n: 1, p: 0.5 }],
    desc: { tr: 'Mantar gövdesi üzerinde yürüyen bir koloni. Nefes almaz, salgılar.', en: 'A colony walking on a fungal trunk. It does not breathe; it exhales.' }
  });

  en('frost_lurker', {
    name: { tr: 'Buz Pususu', en: 'Frost Lurker' },
    biome: ['glacier'], lvl: 4, hp: 52, atk: 13, def: 6, spd: 6, xp: 22, ec: 15,
    weak: 'shell', resist: { cold: 0.9 }, sprite: { s: 'lurker', c: '#cfeaff', c2: '#3f7aa0' },
    moves: [{ id: 'claw', w: 3, dmg: 1.0 }, { id: 'freeze', w: 2, dmg: 0.9, kind: 'stun' }],
    drop: [{ id: 'ice_shard', n: 3, p: 0.9 }, { id: 'quartz', n: 1, p: 0.3 }],
    desc: { tr: 'Buzun içinde bekler, gölgen üstünden geçince açılır.', en: 'It waits inside the ice and opens when your shadow crosses it.' }
  });

  en('acid_leech', {
    name: { tr: 'Asit Sülüğü', en: 'Acid Leech' },
    biome: ['swamp'], lvl: 4, hp: 44, atk: 14, def: 4, spd: 7, xp: 22, ec: 16,
    weak: 'core', resist: { acid: 1 }, sprite: { s: 'leech', c: '#9be24a', c2: '#3a6a12' },
    moves: [{ id: 'spit', w: 3, dmg: 1.1, kind: 'acid' }, { id: 'latch', w: 2, dmg: 0.8, kind: 'drain' }],
    drop: [{ id: 'acid_sac', n: 2, p: 0.85 }, { id: 'bio_fiber', n: 2, p: 0.4 }],
    desc: { tr: 'Zırhı çözüp altındaki ısıyı arar.', en: 'It dissolves armour and hunts the heat beneath.' }
  });

  en('canyon_shrike', {
    name: { tr: 'Kanyon Şahini', en: 'Canyon Shrike' },
    biome: ['canyon', 'mountain'], lvl: 5, hp: 48, atk: 16, def: 4, spd: 12, xp: 26, ec: 18,
    weak: 'optics', sprite: { s: 'shrike', c: '#b98a5a', c2: '#4a2f18' },
    moves: [{ id: 'dive', w: 3, dmg: 1.3, kind: 'heavy' }, { id: 'gust', w: 1, dmg: 0.5, kind: 'evade' }],
    drop: [{ id: 'aero_data', n: 1, p: 0.5 }, { id: 'bio_fiber', n: 2, p: 0.5 }],
    desc: { tr: 'Termal yükselişleri kullanır. Valkyrie ondan uçmayı öğrenmiş.', en: 'It rides thermals. Valkyrie learned to fly by watching it.' }
  });

  en('husk_drone', {
    name: { tr: 'Kabuk Dron', en: 'Husk Drone' },
    biome: ['wreck', 'plains', 'canyon'], lvl: 5, hp: 56, atk: 15, def: 8, spd: 8, xp: 28, ec: 24,
    weak: 'optics', sprite: { s: 'drone', c: '#7aa2ff', c2: '#26386e' },
    moves: [{ id: 'laser', w: 3, dmg: 1.2 }, { id: 'shieldup', w: 1, dmg: 0, kind: 'shield' }, { id: 'ram', w: 2, dmg: 1.1 }],
    drop: [{ id: 'scrap', n: 3, p: 0.9 }, { id: 'pcb', n: 1, p: 0.3 }, { id: 'power_cell', n: 1, p: 0.35 }],
    desc: { tr: 'Göktay\'ın kayıp keşif dronu. Artık dost tanımıyor.', en: "A lost survey drone from the Göktay. It no longer recognises friends." }
  });

  en('mire_stalker', {
    name: { tr: 'Batak Avcısı', en: 'Mire Stalker' },
    biome: ['swamp', 'forest'], lvl: 6, hp: 68, atk: 18, def: 7, spd: 9, xp: 34, ec: 26,
    weak: 'joint', sprite: { s: 'stalker', c: '#6a7f5a', c2: '#28321f' },
    moves: [{ id: 'rake', w: 3, dmg: 1.1 }, { id: 'ambush', w: 2, dmg: 1.5, kind: 'heavy' }, { id: 'venom', w: 1, dmg: 0.7, kind: 'poison' }],
    drop: [{ id: 'acid_sac', n: 2, p: 0.6 }, { id: 'titanium', n: 1, p: 0.35 }],
    desc: { tr: 'Bataklıkta sadece sırtı görünür. Sonra görünmez.', en: 'In the marsh you see only its back. Then you see nothing.' }
  });

  en('shard_golem', {
    name: { tr: 'Kırık Golem', en: 'Shard Golem' },
    biome: ['mountain', 'glacier'], lvl: 7, hp: 90, atk: 20, def: 12, spd: 3, xp: 42, ec: 34,
    weak: 'core', sprite: { s: 'golem', c: '#9fb0c4', c2: '#4a5566' },
    moves: [{ id: 'smash', w: 3, dmg: 1.2 }, { id: 'brace', w: 1, dmg: 0, kind: 'defend' }, { id: 'quake', w: 2, dmg: 1.4, kind: 'heavy' }],
    drop: [{ id: 'titanium', n: 3, p: 0.8 }, { id: 'quartz', n: 2, p: 0.5 }],
    desc: { tr: 'Sırtlardan kopan kaya, kuantum alanıyla ayağa kalkmış.', en: 'Rock torn from the ridges, stood upright by the quantum field.' }
  });

  en('void_moth', {
    name: { tr: 'Boşluk Güvesi', en: 'Void Moth' },
    biome: ['forest', 'canyon', 'plains'], lvl: 8, hp: 74, atk: 23, def: 6, spd: 13, xp: 46, ec: 38,
    night: true, weak: 'optics', sprite: { s: 'moth', c: '#a58bff', c2: '#3a2070' },
    moves: [{ id: 'dust', w: 2, dmg: 0.8, kind: 'poison' }, { id: 'phase', w: 2, dmg: 1.4 }, { id: 'blink', w: 1, dmg: 0, kind: 'evade' }],
    drop: [{ id: 'data_crystal', n: 1, p: 0.3 }, { id: 'quartz', n: 2, p: 0.5 }],
    desc: { tr: 'Yalnızca geceleri, anomalinin kenarında görülür.', en: 'Seen only at night, at the edge of the anomaly.' }
  });

  en('salvage_wraith', {
    name: { tr: 'Enkaz Hayaleti', en: 'Salvage Wraith' },
    biome: ['wreck', 'desert', 'mountain'], lvl: 9, hp: 88, atk: 26, def: 9, spd: 10, xp: 55, ec: 44,
    night: true, weak: 'vent', sprite: { s: 'wraith', c: '#4df2c8', c2: '#0e6a55' },
    moves: [{ id: 'grasp', w: 3, dmg: 1.1, kind: 'drain' }, { id: 'wail', w: 2, dmg: 1.0, kind: 'stress' }],
    drop: [{ id: 'data_crystal', n: 1, p: 0.45 }, { id: 'cassette_mech', n: 1, p: 0.2 }, { id: 'cd_lens', n: 1, p: 0.2 }],
    desc: { tr: 'Düşen gemilerin ölmemiş kayıtları. Sana kendi sesinle sesleniyor.', en: 'The undead logs of fallen ships. It calls you in your own voice.' }
  });

  /* --------------------------- BÖLGE HÂKİMLERİ --------------------------- */
  en('boss_ice_worm', {
    boss: true, biomeBoss: 'glacier',
    name: { tr: 'Buz Solucanı', en: 'Ice Worm' },
    biome: ['glacier'], lvl: 10, hp: 320, atk: 26, def: 14, spd: 6, xp: 200, ec: 180,
    weak: 'vent', resist: { cold: 1 }, vuln: { heat: 1.6 },
    sprite: { s: 'worm', c: '#cfeaff', c2: '#2f6fa0' },
    moves: [
      { id: 'burrow', w: 2, dmg: 0, kind: 'evade' },
      { id: 'ice_lance', w: 3, dmg: 1.2, kind: 'stun' },
      { id: 'avalanche', w: 2, dmg: 1.6, kind: 'heavy' },
      { id: 'freeze_breath', w: 2, dmg: 1.1, kind: 'freeze' }
    ],
    drop: [{ id: 'core_fragment', n: 1, p: 1 }, { id: 'ice_shard', n: 6, p: 1 }, { id: 'titanium', n: 4, p: 1 }],
    desc: { tr: 'Buzulun altında yüzyıllardır dönüyor. Sıcaklık farkını avlar — ısı ona zarar verir.',
            en: 'It has circled beneath the glacier for centuries. It hunts thermal gradients — and heat wounds it.' },
    intro: { tr: 'Buz altından bir gövde kabarıyor. Zemin çatlıyor.', en: 'A body swells beneath the ice. The ground splits.' }
  });

  en('boss_acid_golem', {
    boss: true, biomeBoss: 'swamp',
    name: { tr: 'Asit Golemi', en: 'Acid Golem' },
    biome: ['swamp'], lvl: 12, hp: 380, atk: 30, def: 18, spd: 4, xp: 240, ec: 210,
    weak: 'core', resist: { acid: 1 }, vuln: { cold: 1.5 },
    sprite: { s: 'agolem', c: '#9be24a', c2: '#2f5a10' },
    moves: [
      { id: 'acid_wave', w: 3, dmg: 1.2, kind: 'acid' },
      { id: 'harden', w: 2, dmg: 0, kind: 'defend' },
      { id: 'crush', w: 3, dmg: 1.5, kind: 'heavy' },
      { id: 'split', w: 1, dmg: 0.9, kind: 'poison' }
    ],
    drop: [{ id: 'core_fragment', n: 1, p: 1 }, { id: 'acid_sac', n: 6, p: 1 }, { id: 'ti_wire', n: 2, p: 1 }],
    desc: { tr: 'Bataklığın kendisi ayağa kalkmış. Soğuk onu katılaştırır.', en: 'The marsh itself stood up. Cold makes it brittle.' },
    intro: { tr: 'Çamur yükseliyor ve bir omuz oluşturuyor.', en: 'The mud rises and forms a shoulder.' }
  });

  en('boss_sand_leviathan', {
    boss: true, biomeBoss: 'desert',
    name: { tr: 'Kum Leviathanı', en: 'Sand Leviathan' },
    biome: ['desert'], lvl: 11, hp: 340, atk: 28, def: 12, spd: 9, xp: 220, ec: 195,
    weak: 'optics', vuln: { shock: 1.5 },
    sprite: { s: 'levi', c: '#e6cf95', c2: '#8a6a2a' },
    moves: [
      { id: 'sand_blast', w: 3, dmg: 1.1, kind: 'blind' },
      { id: 'dive', w: 2, dmg: 0, kind: 'evade' },
      { id: 'swallow', w: 2, dmg: 1.7, kind: 'heavy' },
      { id: 'glass_spray', w: 2, dmg: 1.2 }
    ],
    drop: [{ id: 'core_fragment', n: 1, p: 1 }, { id: 'silicon', n: 8, p: 1 }, { id: 'quartz', n: 4, p: 1 }],
    desc: { tr: 'Cam çölünün altındaki akıntı. Elektrik onun duyularını bozar.', en: 'The current beneath the glass desert. Electricity ruins its senses.' },
    intro: { tr: 'Kum bir dalga gibi yükseliyor — ama dalga sana dönüyor.', en: 'The sand rises like a wave — but the wave turns towards you.' }
  });

  en('boss_spore_titan', {
    boss: true, biomeBoss: 'forest',
    name: { tr: 'Spor Devi', en: 'Spore Titan' },
    biome: ['forest'], lvl: 13, hp: 420, atk: 27, def: 16, spd: 5, xp: 260, ec: 230,
    weak: 'vent', vuln: { heat: 1.4 },
    sprite: { s: 'titan', c: '#c07de0', c2: '#40206a' },
    moves: [
      { id: 'bloom', w: 3, dmg: 1.0, kind: 'poison' },
      { id: 'root_grab', w: 2, dmg: 1.2, kind: 'stun' },
      { id: 'regrow', w: 2, dmg: 0, kind: 'heal' },
      { id: 'slam', w: 3, dmg: 1.4, kind: 'heavy' }
    ],
    drop: [{ id: 'core_fragment', n: 1, p: 1 }, { id: 'spore_cap', n: 8, p: 1 }, { id: 'rubber_sap', n: 4, p: 1 }],
    desc: { tr: 'Ormanın merkez düğümü. Kestiğin her kol yeniden çıkar; kökü yakmalısın.',
            en: 'The forest\'s central node. Every limb you cut regrows; you must burn the root.' },
    intro: { tr: 'Miselyum ağı titriyor. Orman bir vücut hâline geliyor.', en: 'The mycelial net shudders. The forest becomes a body.' }
  });

  en('boss_storm_harrier', {
    boss: true, biomeBoss: 'canyon',
    name: { tr: 'Fırtına Harrier\'ı', en: 'Storm Harrier' },
    biome: ['canyon'], lvl: 14, hp: 360, atk: 34, def: 13, spd: 16, xp: 300, ec: 260,
    weak: 'joint', vuln: { shock: 1.3 },
    sprite: { s: 'harrier', c: '#8fb6ff', c2: '#26386e' },
    moves: [
      { id: 'cyclone', w: 3, dmg: 1.2 },
      { id: 'updraft', w: 2, dmg: 0, kind: 'evade' },
      { id: 'talon', w: 3, dmg: 1.5, kind: 'heavy' },
      { id: 'screech', w: 2, dmg: 0.9, kind: 'stress' }
    ],
    drop: [{ id: 'core_fragment', n: 1, p: 1 }, { id: 'aero_data', n: 4, p: 1 }, { id: 'flight_ctrl', n: 1, p: 0.5 }],
    desc: { tr: 'Kanyon rüzgârının efendisi. Yalnızca havada yakalanabilir.', en: 'Lord of the canyon wind. It can only be caught in the air.' },
    intro: { tr: 'Rüzgâr birden duruyor. Gölge büyüyor.', en: 'The wind stops all at once. The shadow grows.' }
  });

  /* ---- Roster dolgusu: bazı biyomlarda tek tür düşman vardı ---- */
  en('tide_crab', {
    name: { tr: 'Gelgit Yengeci', en: 'Tide Crab' },
    biome: ['shore'], lvl: 2, hp: 32, atk: 8, def: 6, spd: 4, xp: 11, ec: 8,
    weak: 'joint', sprite: { s: 'crab', c: '#c98d5e', c2: '#5e3a20' },
    moves: [{ id: 'pinch', w: 3, dmg: 1.0 }, { id: 'shell', w: 2, dmg: 0, kind: 'defend' }],
    drop: [{ id: 'scrap', n: 2, p: 0.6 }, { id: 'bio_fiber', n: 2, p: 0.6 }],
    desc: { tr: 'Kabuğuna enkaz parçası yapıştırmış, gelgit hattında yürüyen kabuklu.',
            en: 'A crustacean walking the tide line with wreckage cemented to its shell.' }
  });

  en('salt_wader', {
    name: { tr: 'Tuz Yürüyeni', en: 'Salt Wader' },
    biome: ['shore', 'swamp'], lvl: 4, hp: 44, atk: 12, def: 4, spd: 8, xp: 19, ec: 14,
    weak: 'optics', sprite: { s: 'wader', c: '#d8d0b8', c2: '#6a6250' },
    moves: [{ id: 'stab', w: 3, dmg: 1.1 }, { id: 'wade', w: 1, dmg: 0.5, kind: 'evade' }],
    drop: [{ id: 'bio_fiber', n: 3, p: 0.7 }, { id: 'quartz', n: 1, p: 0.3 }],
    desc: { tr: 'Uzun bacaklarıyla tuzlu sığlıkta avlanır. Gagası bir mızrak.',
            en: 'It hunts the salt shallows on long legs. Its beak is a spear.' }
  });

  en('drift_husk', {
    name: { tr: 'Sürüklenen Kabuk', en: 'Drift Husk' },
    biome: ['shore', 'wreck', 'plains'], lvl: 6, hp: 58, atk: 15, def: 7, spd: 6, xp: 27, ec: 20,
    night: true, weak: 'core', sprite: { s: 'husk', c: '#8a9aa8', c2: '#3a4450' },
    moves: [{ id: 'lash', w: 3, dmg: 1.1 }, { id: 'drain', w: 2, dmg: 0.9, kind: 'drain' }],
    drop: [{ id: 'scrap', n: 3, p: 0.8 }, { id: 'power_cell', n: 1, p: 0.3 }],
    desc: { tr: 'Kıyıya vuran boş bir basınç giysisi. İçinde bir şey hâlâ hareket ediyor.',
            en: 'An empty pressure suit washed ashore. Something inside it still moves.' }
  });

  en('ice_mite', {
    name: { tr: 'Buz Akarı', en: 'Ice Mite' },
    biome: ['glacier'], lvl: 2, hp: 26, atk: 7, def: 3, spd: 10, xp: 10, ec: 7,
    weak: 'shell', resist: { cold: 0.8 }, sprite: { s: 'mite', c: '#bfe4f4', c2: '#4a7a94' },
    moves: [{ id: 'nip', w: 3, dmg: 0.9 }, { id: 'swarm', w: 2, dmg: 1.2 }],
    drop: [{ id: 'ice_shard', n: 2, p: 0.8 }],
    desc: { tr: 'Sürüler hâlinde buzun altında ilerler. Tek başına zararsız.',
            en: 'It moves under the ice in swarms. Alone it is harmless.' }
  });

  en('glacier_stalk', {
    name: { tr: 'Buzul Sapı', en: 'Glacier Stalk' },
    biome: ['glacier', 'mountain'], lvl: 6, hp: 66, atk: 16, def: 9, spd: 3, xp: 30, ec: 22,
    weak: 'vent', resist: { cold: 1 }, vuln: { heat: 1.4 },
    sprite: { s: 'stalk', c: '#a8cfe0', c2: '#3a5a70' },
    moves: [{ id: 'impale', w: 3, dmg: 1.2 }, { id: 'root', w: 2, dmg: 0, kind: 'defend' }, { id: 'shard', w: 2, dmg: 1.1 }],
    drop: [{ id: 'ice_shard', n: 4, p: 0.9 }, { id: 'titanium', n: 1, p: 0.4 }],
    desc: { tr: 'Buzdan çıkan sabit bir sap. Yaklaşana kadar taş sanırsın.',
            en: 'A fixed stalk rising from the ice. You take it for stone until you are close.' }
  });

  en('bog_lantern', {
    name: { tr: 'Batak Feneri', en: 'Bog Lantern' },
    biome: ['swamp', 'forest'], lvl: 5, hp: 40, atk: 14, def: 3, spd: 11, xp: 24, ec: 19,
    night: true, weak: 'optics', sprite: { s: 'lantern', c: '#c8e46a', c2: '#4a6a18' },
    moves: [{ id: 'lure', w: 2, dmg: 0.7, kind: 'stress' }, { id: 'burst', w: 3, dmg: 1.2, kind: 'acid' }],
    drop: [{ id: 'acid_sac', n: 1, p: 0.5 }, { id: 'spore_cap', n: 2, p: 0.6 }],
    desc: { tr: 'Bataklıkta yüzen soluk bir ışık. Peşinden gidenler dönmüyor.',
            en: 'A pale light drifting over the marsh. Those who follow it do not return.' }
  });

  en('scree_runner', {
    name: { tr: 'Moloz Koşucusu', en: 'Scree Runner' },
    biome: ['mountain', 'canyon', 'desert'], lvl: 4, hp: 38, atk: 13, def: 4, spd: 12, xp: 20, ec: 15,
    weak: 'joint', sprite: { s: 'runner', c: '#b0a08a', c2: '#4a4034' },
    moves: [{ id: 'charge', w: 3, dmg: 1.2 }, { id: 'kick', w: 2, dmg: 0.9, kind: 'blind' }],
    drop: [{ id: 'titanium', n: 1, p: 0.5 }, { id: 'copper', n: 2, p: 0.5 }],
    desc: { tr: 'Dik moloz yamacında koşarak avlanır. Durduğunda çoktan geç kalmışsındır.',
            en: 'It hunts at a run across loose scree. By the time it stops, you are already late.' }
  });

  /* --------------------- ANLATI HÂKİMLERİ --------------------- */
  en('boss_memory_alpha', {
    boss: true, story: true,
    name: { tr: 'Hafıza Bekçisi Alpha', en: 'Memory Keeper Alpha' },
    biome: ['plains'], lvl: 9, hp: 280, atk: 22, def: 11, spd: 7, xp: 170, ec: 140,
    weak: 'core', vuln: { shock: 1.4 },
    sprite: { s: 'alpha', c: '#7ec8e0', c2: '#1d4a5e' },
    moves: [
      { id: 'lullaby', w: 3, dmg: 0.9, kind: 'stress' },
      { id: 'static', w: 3, dmg: 1.1, kind: 'blind' },
      { id: 'recall', w: 2, dmg: 0, kind: 'defend' },
      { id: 'plea', w: 2, dmg: 1.3, kind: 'heavy' }
    ],
    drop: [{ id: 'memory_disk', n: 1, p: 1 }, { id: 'data_crystal', n: 3, p: 1 }, { id: 'quartz', n: 4, p: 1 }],
    desc: { tr: 'Bir gezegenin bütün hafızasını korumakla görevlendirilmiş, radyasyon yüzünden verilerini kaybettikçe acı çeken bir yapay zekâ.',
            en: 'An AI charged with keeping a planet’s entire memory, in pain as radiation erases its data piece by piece.' },
    intro: { tr: 'Ninni bozuluyor ve bir çığlığa dönüşüyor.', en: 'The lullaby breaks and turns into a scream.' }
  });

  en('boss_lost_leviathan', {
    boss: true, story: true,
    name: { tr: 'Kayıp Leviathan', en: 'The Lost Leviathan' },
    biome: ['swamp'], lvl: 8, hp: 240, atk: 20, def: 9, spd: 5, xp: 150, ec: 120,
    weak: 'joint', resist: { acid: 1 }, vuln: { cold: 1.4 },
    sprite: { s: 'levi2', c: '#7fae7a', c2: '#2a4a2a' },
    moves: [
      { id: 'thrash', w: 3, dmg: 1.0 },
      { id: 'writhe', w: 3, dmg: 0.6, kind: 'evade' },
      { id: 'acid_cry', w: 2, dmg: 1.1, kind: 'acid' },
      { id: 'collapse', w: 2, dmg: 0, kind: 'defend' }
    ],
    drop: [{ id: 'acid_sac', n: 5, p: 1 }, { id: 'bio_fiber', n: 6, p: 1 }, { id: 'data_crystal', n: 1, p: 0.6 }],
    desc: { tr: 'Vahayı korumakla görevli kadim bir muhafız. Çekirdek parçası sırtına saplandığından beri mutasyona uğramış ve acı içinde.',
            en: 'An ancient guardian of the oasis, mutated and in agony since a core shard lodged in its back.' },
    intro: { tr: 'Sana saldırmak istemiyor. Sadece acıyı durdurmak istiyor.',
             en: 'It does not want to attack you. It only wants the pain to stop.' }
  });

  en('boss_quantum_echo', {
    boss: true, story: true, mirror: true,
    name: { tr: 'Kuantum Yansıması', en: 'The Quantum Echo' },
    biome: ['wreck'], lvl: 16, hp: 460, atk: 30, def: 15, spd: 12, xp: 400, ec: 300,
    weak: 'core',
    sprite: { s: 'echo', c: '#a58bff', c2: '#2a1a5a' },
    moves: [{ id: 'mirror', w: 1, dmg: 1.0 }],
    drop: [],
    desc: { tr: 'Geminin kuantum yansımalarından doğmuş bir sen. Ne yaparsan onu yapar; hatalarını ezberler.',
            en: 'A you, born of the ship’s quantum reflections. It does whatever you do, and memorises your mistakes.' },
    intro: { tr: 'Bu bir savaş değil. Kendi hamlelerinle oynanan bir satranç.',
             en: 'This is not a battle. It is chess played against your own moves.' }
  });

  /* Hâkim ödülleri — hangi biyomun parçası düştüğünü işaretler */
  const BOSSES = Object.keys(E).filter(k => E[k].boss);
  const BIOME_BOSSES = Object.keys(E).filter(k => E[k].boss && E[k].biomeBoss);

  QW.Enemies = {
    db: E,
    get: id => E[id] || null,
    all: () => Object.keys(E),
    bosses: () => BOSSES.slice(),
    biomeBosses: () => BIOME_BOSSES.slice(),
    bossOf: biome => BOSSES.map(b => E[b]).find(b => b.biomeBoss === biome) || null,
    /* Bir biyom + gece/gündüz + seviye için uygun düşman havuzu */
    pool: function (biome, isNight, lvl) {
      return Object.keys(E).filter(k => {
        const e = E[k];
        if (e.boss) return false;
        if (e.biome.indexOf(biome) < 0) return false;
        if (e.night && !isNight) return false;
        return e.lvl <= lvl + 4;
      });
    },
    add: (id, o) => en(id, o)
  };

})(window.QW);
