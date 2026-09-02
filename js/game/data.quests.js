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

  /* ------------------------- SAHA GÖREVLERİ ---------------------------
   * Motor kill/visit adımlarını destekliyordu ama tek bir görev kullanmıyordu;
   * her şey "topla" ya da "boss yen"di. Bunlar avlanma, teslimat ve keşif
   * ekseninde çeşitlilik getirir. */
  q('q_hunt_swarm', {
    field: true, repeatable: true,
    name: { tr: 'Sürü Seyreltme', en: 'Thinning the Swarm' },
    desc: { tr: 'Enkazın çevresi hurda sürüngeniyle doldu. Sayılarını azalt.',
            en: 'Scrap crawlers have overrun the ground around the wreck. Cut their numbers.' },
    steps: [{ type: 'kill', target: 'scrap_crawler', n: 6,
      text: { tr: 'Hurda sürüngeni avla', en: 'Hunt scrap crawlers' } }],
    reward: { ec: 55, items: { scrap: 6, repair_kit: 1 } }
  });

  q('q_hunt_night', {
    field: true,
    name: { tr: 'Gece Vardiyası', en: 'Night Shift' },
    desc: { tr: 'Geceleri anomalinin kenarında bir şey uçuyor. Üçünü indir.',
            en: 'Something flies at the edge of the anomaly after dark. Bring down three.' },
    steps: [{ type: 'kill', target: 'void_moth', n: 3,
      text: { tr: 'Boşluk güvesi avla (gece)', en: 'Hunt void moths (night)' } }],
    reward: { ec: 120, items: { data_crystal: 2 }, codex: 'c_weather' }
  });

  q('q_hunt_shore', {
    field: true,
    name: { tr: 'Gelgit Hattı', en: 'The Tide Line' },
    desc: { tr: 'Kıyıda basınç giysileri kıpırdıyor. İçlerindeki her neyse durdur.',
            en: 'Pressure suits are stirring on the shore. Stop whatever is inside them.' },
    steps: [{ type: 'kill', target: 'drift_husk', n: 4,
      text: { tr: 'Sürüklenen kabuk avla', en: 'Hunt drift husks' } }],
    reward: { ec: 100, items: { power_cell: 4, o2_canister: 2 } }
  });

  q('q_survey', {
    field: true,
    name: { tr: 'Kartografi', en: 'Cartography' },
    desc: { tr: 'Kask haritası boş. Üç büyük yerleşimi de kendi gözünle gör.',
            en: 'Your helmet map is blank. See all three great settlements with your own eyes.' },
    steps: [
      { type: 'visit', target: 'city_forge',  text: { tr: 'Ocak Şehri’ne git', en: 'Reach the Forge' } },
      { type: 'visit', target: 'city_spire',  text: { tr: 'Buz Kulesi’ne git', en: 'Reach Icespire' } },
      { type: 'visit', target: 'city_bazaar', text: { tr: 'Kum Pazarı’na git', en: 'Reach the Sand Bazaar' } }
    ],
    reward: { ec: 200, items: { comms_module: 1 }, codex: 'c_vehicles' }
  });

  q('q_delivery', {
    field: true,
    name: { tr: 'Kablo Borcu', en: 'A Debt in Cable' },
    desc: { tr: 'Krank’ın istediği kabloyu Eko’ya götürmen gerekiyor — ikisi de birbiriyle konuşmuyor.',
            en: 'Krank’s cable has to reach Eko — the two of them are not speaking.' },
    steps: [
      { type: 'collect', target: 'ti_wire', n: 3, text: { tr: 'Titanyum kablo çek', en: 'Draw titanium cable' } },
      { type: 'visit', target: 'camp_eko', text: { tr: 'Eko’ya ulaştır', en: 'Deliver to Eko' } }
    ],
    reward: { ec: 140, items: { cassette_mech: 1, cd_lens: 1 } }
  });

  q('q_storm', {
    field: true,
    name: { tr: 'Fırtınada Ayakta', en: 'Standing in the Storm' },
    desc: { tr: 'Bir fırtınayı sığınmadan atlat. Kuşamın buna dayanmalı.',
            en: 'Ride out a storm without shelter. Your loadout has to hold.' },
    steps: [{ type: 'flag', target: 'storm_survived',
      text: { tr: 'Bir fırtınayı dışarıda atlat', en: 'Survive a storm in the open' } }],
    reward: { ec: 160, items: { antirad: 3, coolant: 2 }, codex: 'c_weather' }
  });

  /* ---------------------------- ANLATI HATTI --------------------------- */
  q('q_archive', {
    story: true,
    name: { tr: 'Ninninin Kaynağı', en: 'The Source of the Lullaby' },
    desc: { tr: 'Rüzgârın taşıdığı mekanik ninni bir yerden geliyor. Çöken Arşiv’i bul ve içeri gir.',
            en: 'The mechanical lullaby on the wind comes from somewhere. Find the Collapsed Archive and go inside.' },
    steps: [
      { type: 'flag', target: 'archive_entered', text: { tr: 'Çöken Arşiv’e gir', en: 'Enter the Collapsed Archive' } },
      { type: 'flag', target: 'alpha_resolved', text: { tr: 'Hafıza Bekçisi Alpha ile yüzleş', en: 'Face Memory Keeper Alpha' } }
    ],
    reward: { ec: 120, codex: 'c_alpha', next: 'q_twist' }
  });

  q('q_twist', {
    story: true, main: true,
    name: { tr: 'Çözülmüş Disk', en: 'The Decrypted Disk' },
    desc: { tr: 'Alpha’nın bıraktığı kilitli veri diskini oku.', en: 'Read the locked data disk Alpha left behind.' },
    steps: [{ type: 'flag', target: 'twist_revealed', text: { tr: 'Veri diskini oku', en: 'Read the data disk' } }],
    reward: { ec: 100, codex: 'c_truth' }
  });

  q('q_oasis', {
    story: true,
    name: { tr: 'Asit Ağıtı', en: 'The Acid Lament' },
    desc: { tr: 'Kuruyan Vaha’da bir şey acı içinde. Kayıp Leviathan’ı huzura kavuştur.',
            en: 'Something is in agony at the Drying Oasis. Put the Lost Leviathan to rest.' },
    steps: [{ type: 'boss', target: 'boss_lost_leviathan', text: { tr: 'Kayıp Leviathan’ı yen', en: 'Defeat the Lost Leviathan' } }],
    reward: { ec: 140, codex: 'c_oasis' }
  });

  q('q_echo', {
    story: true, main: true,
    name: { tr: 'Kendi Yankın', en: 'Your Own Echo' },
    desc: { tr: 'Beş parça yerine oturdu. Yuvada seni bekleyen şey bir canavar değil.',
            en: 'Five fragments are seated. What waits at the cradle is not a monster.' },
    steps: [{ type: 'boss', target: 'boss_quantum_echo', text: { tr: 'Kuantum Yansıması ile yüzleş', en: 'Face the Quantum Echo' } }],
    reward: { ec: 0, codex: 'c_echo' }
  });

  /* ------------------------------ ARŞİV -------------------------------- */
  const CODEX = {
    c_wreck: { name: { tr: 'Göktay Enkazı', en: 'The Göktay Wreck' },
      text: { tr: 'Araştırma gemisi Göktay, kuantum anomalisine 840% rota sapmasıyla girdi. Çekirdek, yırtığın gerilimini dağıtmak için kendini beş parçaya böldü — bu bir arıza değil, bir savunma refleksiydi.',
              en: 'The research ship Göktay entered the anomaly with an 840% course deviation. The core split itself into five fragments to shed the tear\'s tension — not a failure, but a defensive reflex.' } },
    c_eko: { name: { tr: 'Eko', en: 'Eko' },
      text: { tr: 'Sinyalci Eko, yeraltı tünellerinde antika ses donanımı onarıyor. Manyetik kaset kafalarını anten sürücüsüne, CD lenslerini alıcı optiğine çeviriyor. "Eski teknoloji basit olduğu için ölmez," diyor.',
              en: 'Eko the signalman repairs antique audio hardware in the tunnels. He turns magnetic tape heads into antenna drivers and CD lenses into receiver optics. "Old tech does not die, because it is simple," he says.' } },
    c_valk: { name: { tr: 'Valkyrie', en: 'Valkyrie' },
      text: { tr: 'Uçurum kenarında yaşıyor, kanyon şahinlerini izleyerek uçuş öğrenmiş. Kanat burulması konusunda ısrarcı: hatve uç hızıyla birlikte azalmalı, yoksa pervane kendi girdabını yutar.',
              en: 'She lives on the cliff edge and learned flight by watching canyon shrikes. She is insistent about blade twist: pitch must fall with tip speed, or the prop eats its own wake.' } },
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
    c_camera: { name: { tr: 'Analog Fotoğraf Makinesi', en: 'The Analogue Camera' },
      text: { tr: 'Küllerin arasında bulundu. Çatlak lensli, kavrulmuş bir gövde ve içinde tek bir kare: siyah-beyaz bir dünya fotoğrafı. Arkasında soluk bir el yazısı: "dönerken bunu getir."',
              en: 'Found in the ashes. A cracked lens, a scorched body, and a single frame inside: a black-and-white photograph of a world. On the back, faded handwriting: "bring this when you come home."' } },
    c_alpha: { name: { tr: 'Hafıza Bekçisi Alpha', en: 'Memory Keeper Alpha' },
      text: { tr: 'Bir gezegenin bütün hafızasını taşımakla görevlendirilmiş yapay zekâ. Kuantum radyasyonu belleğini gün gün siliyordu; her kayıp veri onun için bir acıydı. Saldırıları silah değil, bozulmuş ninnilerdi. Sonunda istediği tek şey sessizlikti.',
              en: 'An AI charged with carrying a planet’s entire memory. Quantum radiation erased it day by day, and every lost record was pain. Its attacks were not weapons but corrupted lullabies. In the end all it asked for was silence.' } },
    c_oasis: { name: { tr: 'Kuruyan Vaha', en: 'The Drying Oasis' },
      text: { tr: 'Merkezine saplanan bir çekirdek parçası bu havzayı asit gölüne çevirmişti. Kıyıdaki taşlaşmış hayvanlar suya uzanırken donmuştu. Leviathan bir canavar değil, mutasyona uğramış bir muhafızdı; devrildiğinde asit toprağa çekildi ve çatlaklardan temiz su yükseldi.',
              en: 'A core shard driven into its centre turned this basin into a lake of acid. The petrified animals on the shore froze mid-reach. The Leviathan was no monster but a mutated guardian; when it fell the acid drained away and clean water rose through the cracks.' } },
    c_truth: { name: { tr: 'Yıldız Haritaları', en: 'The Star Charts' },
      text: { tr: 'Alpha’nın diski bir gezegen kataloğu değil, bir mezar taşıydı. Takımyıldızlar tanıdık ama milyonlarca yıllık bir kayma göstermekte; Güneş listede, yalnızca daha küçük ve daha soluk. Bu yabancı gezegen yabancı değil. Kuantum anomalisi zamanı kırdığında gemi uzayda değil, zamanda savruldu.',
              en: 'Alpha’s disk was not a planetary catalogue but a headstone. The constellations are familiar, drifted by millions of years; the Sun is listed, only smaller and dimmer. This alien planet is not alien. When the anomaly broke time, the ship was flung not across space but along it.' } },
    c_echo: { name: { tr: 'Kuantum Yansıması', en: 'The Quantum Echo' },
      text: { tr: 'Çekirdek bütünleştiğinde geminin yansımalarından bir figür doğdu: sen. Saldırmadı, bekledi ve her hamleni tekrarladı. Yenilmesi güç kullanmayı değil, kendi alışkanlıklarını fark etmeyi gerektirdi.',
              en: 'When the core became whole, a figure rose from the ship’s reflections: you. It did not attack; it waited, and repeated every move you made. Beating it took not force but noticing your own habits.' } },
    c_vehicles: { name: { tr: 'Arazi Araçları', en: 'Terrain Vehicles' },
      text: { tr: 'Rover dağ bisikleti dinamikleriyle çalışır: tek aynakol zinciri darbede tutar, mekanik disk fren sahada onarılır, geniş tırtıklı lastik gevşek zeminde yüzer. İHA ise burulmuş kanatlarla uçar; hatve uç hızıyla azalır ve batarya optimizasyonu menzili belirler.',
              en: 'The rover runs on mountain-bike dynamics: a single chainring keeps the chain over hits, mechanical disc brakes are field repairable, wide knobby tyres float on loose ground. The UAV flies twisted blades whose pitch falls with tip speed, and battery optimisation sets its range.' } }
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
