/* =========================================================================
 * QW.QuestDB — görev tanımları
 *  type: collect | kill | craft | visit | flag | boss
 * ========================================================================= */
(function (QW) {
  'use strict';

  const Q = {};
  function q(id, o) { o.id = id; Q[id] = o; return o; }

  /* ------------------------------ ANA HAT ------------------------------ */
  q('q_wake', {
    main: true, auto: true,
    name: { tr: 'Enkazdan Uyanış', en: 'Waking in the Wreck' },
    desc: { tr: 'Oksijen sızıntısını yamala ve kask bilgisayarının mini haritasını başlat.',
            en: 'Patch the oxygen leak and boot your helmet computer\'s mini-map.' },
    steps: [
      { type: 'flag', target: 'leak_sealed', text: { tr: 'Oksijen sızıntısını durdur', en: 'Seal the oxygen leak' } },
      { type: 'flag', target: 'map_booted', text: { tr: 'Mini haritayı boot et', en: 'Boot the mini-map' } }
    ],
    reward: { ec: 20, items: { scrap: 4, silicon: 2 }, next: 'q_first_tools' }
  });

  q('q_first_tools', {
    main: true,
    name: { tr: 'İlk Aletler', en: 'First Tools' },
    desc: { tr: 'Hiçbir şey elektroniksiz çalışmıyor. Bir ESP32 üret ve bir multimetre yap.',
            en: 'Nothing works without electronics. Build an ESP32 and a multimeter.' },
    steps: [
      { type: 'craft', target: 'esp32', n: 1, text: { tr: 'ESP32 üret', en: 'Build an ESP32' } },
      { type: 'craft', target: 'multimeter', n: 1, text: { tr: 'Multimetre üret', en: 'Build a multimeter' } }
    ],
    reward: { ec: 40, items: { copper: 4, quartz: 2 }, next: 'q_fragments' }
  });

  q('q_fragments', {
    main: true,
    name: { tr: 'Beş Parça', en: 'Five Fragments' },
    desc: { tr: 'Kuantum Çekirdeği beş parçaya ayrıldı. Her biri bir biyomun hâkiminde. Hepsini topla ve enkazdaki yuvaya dön.',
            en: 'The Quantum Core split into five fragments, each held by a biome warden. Collect them all and return to the cradle in the wreck.' },
    steps: [
      { type: 'collect', target: 'core_fragment', n: 5, text: { tr: 'Çekirdek parçası topla', en: 'Collect core fragments' } },
      { type: 'flag', target: 'core_restored', text: { tr: 'Parçaları yuvaya yerleştir', en: 'Insert the fragments into the cradle' } }
    ],
    reward: { ec: 0, end: true }
  });

  /* -------------------------- KARAKTER GÖREVLERİ ------------------------ */
  q('q_eko', {
    npc: 'eko',
    name: { tr: 'Bobin ve Lens', en: 'Coils and Lenses' },
    desc: { tr: 'Eko eski manyetik kaset mekanizmalarını ve antika CD okuyucu lenslerini onarıyor. Ona bir set getir.',
            en: 'Eko restores old magnetic cassette decks and antique CD reader lenses. Bring him a set.' },
    steps: [
      { type: 'collect', target: 'cassette_mech', n: 2, text: { tr: 'Kaset mekanizması bul', en: 'Find cassette decks' } },
      { type: 'collect', target: 'cd_lens', n: 1, text: { tr: 'CD okuyucu lensi bul', en: 'Find a CD reader lens' } }
    ],
    reward: { ec: 60, unlock: 'r_comms', codex: 'c_eko' }
  });

  q('q_valk', {
    npc: 'valkyrie',
    name: { tr: 'Temiz Hava', en: 'Clean Air' },
    desc: { tr: 'Valkyrie uçurum rüzgârlarından türbülans profilleri istiyor. Kanyonda aerodinamik veri topla.',
            en: 'Valkyrie wants turbulence profiles from the cliff winds. Gather aerodynamic data in the canyon.' },
    steps: [
      { type: 'collect', target: 'aero_data', n: 3, text: { tr: 'Aerodinamik uçuş verisi topla', en: 'Collect aerodynamic flight data' } }
    ],
    reward: { ec: 70, unlock: 'r_flight_ctrl', codex: 'c_valk' }
  });

  q('q_krank', {
    npc: 'krank',
    name: { tr: 'Kablo Fiyatı', en: 'The Price is Cable' },
    desc: { tr: 'Krank yalnızca işlenmiş titanyum kabloyla iş yapar. İki tane çek ve ona götür.',
            en: 'Krank deals only in drawn titanium cable. Draw two and take them to him.' },
    steps: [
      { type: 'collect', target: 'ti_wire', n: 2, text: { tr: 'Titanyum kablo çek', en: 'Draw titanium cable' } }
    ],
    reward: { ec: 80, unlock: 'r_rover', codex: 'c_krank' }
  });

  q('q_tome', {
    npc: 'tome',
    name: { tr: 'Okunacak Bir Şey', en: 'Something to Read' },
    desc: { tr: 'Tome veri kristali karşılığında renklendirilmiş manga ciltleri veriyor. Yıkık kütüphaneleri ve güveleri ara.',
            en: 'Tome trades colourised manga volumes for data crystals. Search ruined libraries and hunt the moths.' },
    steps: [
      { type: 'collect', target: 'data_crystal', n: 2, text: { tr: 'Veri kristali bul', en: 'Find data crystals' } }
    ],
    reward: { ec: 50, items: { manga_garden: 1 }, codex: 'c_tome' }
  });

  /* --------------------------- BÖLGE HÂKİMLERİ -------------------------- */
  q('q_boss_glacier', { boss: true, name: { tr: 'Buzun Altındaki', en: 'What Lies Under the Ice' },
    desc: { tr: 'Buzulda bir şey dönüyor. Buz Solucanı\'nı yen.', en: 'Something circles under the glacier. Defeat the Ice Worm.' },
    steps: [{ type: 'boss', target: 'boss_ice_worm', text: { tr: 'Buz Solucanı\'nı yen', en: 'Defeat the Ice Worm' } }],
    reward: { ec: 150, codex: 'c_boss_worm' } });

  q('q_boss_swamp', { boss: true, name: { tr: 'Ayağa Kalkan Bataklık', en: 'The Marsh Stands Up' },
    desc: { tr: 'Asit Golemi\'ni yen.', en: 'Defeat the Acid Golem.' },
    steps: [{ type: 'boss', target: 'boss_acid_golem', text: { tr: 'Asit Golemi\'ni yen', en: 'Defeat the Acid Golem' } }],
    reward: { ec: 180, codex: 'c_boss_golem' } });

  q('q_boss_desert', { boss: true, name: { tr: 'Camın Altındaki Akıntı', en: 'The Current Under Glass' },
    desc: { tr: 'Kum Leviathanı\'nı yen.', en: 'Defeat the Sand Leviathan.' },
    steps: [{ type: 'boss', target: 'boss_sand_leviathan', text: { tr: 'Kum Leviathanı\'nı yen', en: 'Defeat the Sand Leviathan' } }],
    reward: { ec: 165, codex: 'c_boss_levi' } });

  q('q_boss_forest', { boss: true, name: { tr: 'Merkez Düğüm', en: 'The Central Node' },
    desc: { tr: 'Spor Devi\'ni yen.', en: 'Defeat the Spore Titan.' },
    steps: [{ type: 'boss', target: 'boss_spore_titan', text: { tr: 'Spor Devi\'ni yen', en: 'Defeat the Spore Titan' } }],
    reward: { ec: 200, codex: 'c_boss_titan' } });

  q('q_boss_canyon', { boss: true, name: { tr: 'Rüzgârın Efendisi', en: 'Lord of the Wind' },
    desc: { tr: 'Fırtına Harrier\'ını yen.', en: 'Defeat the Storm Harrier.' },
    steps: [{ type: 'boss', target: 'boss_storm_harrier', text: { tr: 'Fırtına Harrier\'ını yen', en: 'Defeat the Storm Harrier' } }],
    reward: { ec: 220, codex: 'c_boss_harrier' } });

  /* ------------------------------ ARŞİV -------------------------------- */
  const CODEX = {
    c_wreck: { name: { tr: 'Argos Enkazı', en: 'The Argos Wreck' },
      text: { tr: 'Kargo gemisi Argos, kuantum anomalisine 840% rota sapmasıyla girdi. Çekirdek, yırtığın gerilimini dağıtmak için kendini beş parçaya böldü — bu bir arıza değil, bir savunma refleksiydi.',
              en: 'The cargo ship Argos entered the anomaly with an 840% course deviation. The core split itself into five fragments to shed the tear\'s tension — not a failure, but a defensive reflex.' } },
    c_eko: { name: { tr: 'Eko', en: 'Eko' },
      text: { tr: 'Sinyalci Eko, yeraltı tünellerinde antika ses donanımı onarıyor. Manyetik kaset kafalarını anten sürücüsüne, CD lenslerini alıcı optiğine çeviriyor. "Eski teknoloji basit olduğu için ölmez," diyor.',
              en: 'Eko the signalman repairs antique audio hardware in the tunnels. He turns magnetic tape heads into antenna drivers and CD lenses into receiver optics. "Old tech does not die, because it is simple," he says.' } },
    c_valk: { name: { tr: 'Valkyrie', en: 'Valkyrie' },
      text: { tr: 'Uçurum kenarında yaşıyor, kanyon şahinlerini izleyerek uçuş öğrenmiş. Pervanenin önde olması gerektiğinde ısrarcı: çekişli konfigürasyon gövdeyi temiz havada tutar.',
              en: 'She lives on the cliff edge and learned flight by watching canyon shrikes. She insists the propeller belongs up front: a puller keeps the airframe in clean air.' } },
    c_krank: { name: { tr: 'Krank', en: 'Krank' },
      text: { tr: 'Göçebe tamirci. Tek aynakol ve mekanik disk fren dışında hiçbir aktarma organını sahada güvenilir bulmuyor. Ödeme yalnızca işlenmiş titanyum kabloyla.',
              en: 'The nomad mechanic. He trusts no drivetrain in the field but a single chainring and mechanical disc brakes. Payment in drawn titanium cable only.' } },
    c_tome: { name: { tr: 'Tome', en: 'Tome' },
      text: { tr: 'Kütüphaneler çöktüğünde katalog onunla birlikte kaçtı. Kristallerdeki fantastik serileri tek tek renklendiriyor; okumanın stres düşürdüğüne dair kendi verisini tutuyor.',
              en: 'When the libraries fell, the catalogue escaped with her. She colourises the fantasy series on her crystals panel by panel, and keeps her own data on how reading lowers stress.' } },
    c_boss_worm: { name: { tr: 'Buz Solucanı', en: 'Ice Worm' },
      text: { tr: 'Buzulun altında ısı gradyanı avlar. Soğuğa tamamen bağışık; sıcaklık ise deri altındaki dolaşımını bozar.',
              en: 'It hunts thermal gradients beneath the glacier. Wholly immune to cold; heat disrupts its subdermal circulation.' } },
    c_boss_golem: { name: { tr: 'Asit Golemi', en: 'Acid Golem' },
      text: { tr: 'Bataklığın kolloid çamuru, kuantum alanında yüzey gerilimi kazanınca ayağa kalkar. Soğutulduğunda kırılganlaşır.',
              en: 'The marsh\'s colloidal mud rises when the quantum field gives it surface tension. Chilled, it turns brittle.' } },
    c_boss_levi: { name: { tr: 'Kum Leviathanı', en: 'Sand Leviathan' },
      text: { tr: 'Cam çölünün altındaki akıntıda yüzer. Yön bulmayı elektrostatik alanla yapar; elektrik şoku onu kör eder.',
              en: 'It swims the current beneath the glass desert, navigating by electrostatics. A shock blinds it.' } },
    c_boss_titan: { name: { tr: 'Spor Devi', en: 'Spore Titan' },
      text: { tr: 'Ormanın merkez düğümü. Kopan uzuvlar miselyumdan yeniden büyür; yalnızca ısı kök ağını durdurur.',
              en: 'The forest\'s central node. Severed limbs regrow from the mycelium; only heat stops the root net.' } },
    c_boss_harrier: { name: { tr: 'Fırtına Harrier\'ı', en: 'Storm Harrier' },
      text: { tr: 'Kanyon termallerini bir merdiven gibi kullanır. Kanat eklemleri elektriksel uyarıya duyarlıdır.',
              en: 'It climbs canyon thermals like a staircase. Its wing joints are sensitive to electrical stimulus.' } },
    c_weather: { name: { tr: 'Hava Olayları', en: 'Weather Systems' },
      text: { tr: 'Radyasyon fırtınası, asit yağmuru, tipi, kum fırtınası ve spor patlaması. Hava kalitesi sensörü partikül ve iyonizasyon okuyarak bunları dakikalar önce haber verir.',
              en: 'Radiation storms, acid rain, blizzards, sandstorms and spore blooms. An air-quality sensor reads particulates and ionisation to warn you minutes ahead.' } },
    c_vehicles: { name: { tr: 'Arazi Araçları', en: 'Terrain Vehicles' },
      text: { tr: 'Rover dağ bisikleti dinamikleriyle çalışır: tek aynakol zinciri darbede tutar, mekanik disk fren sahada onarılır, geniş tırtıklı lastik gevşek zeminde yüzer. İHA ise çekişli pervaneyle temiz havada uçar ve batarya optimizasyonu menzili belirler.',
              en: 'The rover runs on mountain-bike dynamics: a single chainring keeps the chain over hits, mechanical disc brakes are field repairable, wide knobby tyres float on loose ground. The UAV flies a puller propeller in clean air, and battery optimisation sets its range.' } }
  };

  QW.QuestDB = {
    db: Q,
    codex: CODEX,
    get: id => Q[id] || null,
    all: () => Object.keys(Q),
    add: (id, o) => q(id, o),
    addCodex: (id, o) => { CODEX[id] = o; }
  };

})(window.QW);
