/* =========================================================================
 * QW.Items — eşya veritabanı
 * Yeni içerik eklemek için sadece bu listeye satır eklemek yeterlidir.
 *  cat : res(hammadde) comp(parça) dev(cihaz) gear(kuşam) use(sarf) media key
 *  icon: {s:şekil, c:ana renk, c2:ikincil} — sprites.js bunu piksel çizer
 * ========================================================================= */
(function (QW) {
  'use strict';

  const DB = {};
  function it(id, o) { o.id = id; DB[id] = o; return o; }

  /* ------------------------------ HAMMADDE ------------------------------ */
  it('scrap', { cat: 'res', value: 3, w: 0.4, icon: { s: 'chunk', c: '#8a94a8', c2: '#5b647a' },
    name: { tr: 'Hurda Metal', en: 'Scrap Metal' },
    desc: { tr: 'Enkazdan sökülen kıvrık plaka. Her şeyin başlangıcı.', en: 'Buckled plating torn from the wreck. The start of everything.' } });

  it('silicon', { cat: 'res', value: 6, w: 0.2, icon: { s: 'shard', c: '#9fb6c9', c2: '#4c6478' },
    name: { tr: 'Silikon', en: 'Silicon' },
    desc: { tr: 'Cam çölünün eritilmiş kumundan. Yarı iletken üretiminin temeli.', en: 'From the fused sand of the glass desert. The basis of every semiconductor.' } });

  it('copper', { cat: 'res', value: 5, w: 0.3, icon: { s: 'coil', c: '#d98b45', c2: '#8a5122' },
    name: { tr: 'Bakır', en: 'Copper' },
    desc: { tr: 'Damarlı kaya içinden çıkarılır. İletken ve dövülebilir.', en: 'Pulled from veined rock. Conductive and malleable.' } });

  it('titanium', { cat: 'res', value: 12, w: 0.6, icon: { s: 'chunk', c: '#c8d2e0', c2: '#7a8494' },
    name: { tr: 'Titanyum Cevheri', en: 'Titanium Ore' },
    desc: { tr: 'Kaya sırtlarında bulunur. Hafif ve inatçı.', en: 'Found along the rock ridges. Light and stubborn.' } });

  it('quartz', { cat: 'res', value: 9, w: 0.3, icon: { s: 'gem', c: '#b9e6ff', c2: '#5f9dc4' },
    name: { tr: 'Kuvars', en: 'Quartz' },
    desc: { tr: 'Optik parçalar ve osilatörler için berrak kristal.', en: 'Clear crystal for optics and oscillators.' } });

  it('ice_shard', { cat: 'res', value: 4, w: 0.3, icon: { s: 'shard', c: '#d8f4ff', c2: '#79bede' },
    name: { tr: 'Buz Parçası', en: 'Ice Shard' },
    desc: { tr: 'Buzuldan kırılmış. Soğutucu olarak kullanılır.', en: 'Broken from the glacier. Used as coolant.' } });

  it('spore_cap', { cat: 'res', value: 7, w: 0.2, icon: { s: 'cap', c: '#c07de0', c2: '#6a3690' },
    name: { tr: 'Spor Şapkası', en: 'Spore Cap' },
    desc: { tr: 'Mantar ormanının ışıldayan meyvesi. Kimyada kullanılır.', en: 'Glowing fruit of the mycelium forest. Used in chemistry.' } });

  it('acid_sac', { cat: 'res', value: 10, w: 0.3, icon: { s: 'blob', c: '#9be24a', c2: '#4c8a1c' },
    name: { tr: 'Asit Kesesi', en: 'Acid Sac' },
    desc: { tr: 'Bataklık yaratıklarından çıkarılır. Aşındırıcı ve değerli.', en: 'Cut from marsh creatures. Corrosive and valuable.' } });

  it('bio_fiber', { cat: 'res', value: 4, w: 0.1, icon: { s: 'fiber', c: '#8fd98f', c2: '#43813f' },
    name: { tr: 'Biyo Lif', en: 'Bio Fibre' },
    desc: { tr: 'Dokunabilir bitkisel lif. Kumaş ve dolgu malzemesi.', en: 'Weavable plant fibre. Fabric and padding stock.' } });

  it('rubber_sap', { cat: 'res', value: 6, w: 0.3, icon: { s: 'blob', c: '#4a4a52', c2: '#26262c' },
    name: { tr: 'Kauçuk Özsu', en: 'Rubber Sap' },
    desc: { tr: 'Mantar gövdelerinden akan koyu reçine. Lastik yapımında şart.', en: 'Dark resin from mushroom trunks. Essential for tyres.' } });

  it('data_crystal', { cat: 'res', value: 30, w: 0.2, icon: { s: 'gem', c: '#a58bff', c2: '#5a35b8' },
    name: { tr: 'Veri Kristali', en: 'Data Crystal' },
    desc: { tr: 'Çökmüş kütüphanelerin belleği. Arşivci Tome bunlar için her şeyi verir.', en: 'Memory of collapsed libraries. Tome the archivist trades anything for these.' } });

  it('cassette_mech', { cat: 'res', value: 22, w: 0.5, icon: { s: 'box', c: '#6f7f9a', c2: '#37425a' },
    name: { tr: 'Manyetik Kaset Mekanizması', en: 'Magnetic Cassette Deck' },
    desc: { tr: 'Sanyo tarzı eski bir kaset motoru. Eko bunlara bayılıyor.', en: 'An old Sanyo-style cassette transport. Eko adores these.' } });

  it('cd_lens', { cat: 'res', value: 26, w: 0.2, icon: { s: 'lens', c: '#e0e8f5', c2: '#7d8aa5' },
    name: { tr: 'Antika CD Okuyucu Lensi', en: 'Antique CD Reader Lens' },
    desc: { tr: 'Hâlâ odaklanabilen minik bir lazer optiği. Eko\'nun takas listesinin başında.', en: 'A tiny laser optic that still focuses. Top of Eko\'s want list.' } });

  it('aero_data', { cat: 'res', value: 18, w: 0.05, icon: { s: 'card', c: '#7aa2ff', c2: '#2b47a0' },
    name: { tr: 'Aerodinamik Uçuş Verisi', en: 'Aerodynamic Flight Data' },
    desc: { tr: 'Uçurum rüzgârlarından kaydedilmiş türbülans profili. Valkyrie bunu ister.', en: 'Turbulence profile recorded off the cliff winds. Valkyrie wants this.' } });

  it('power_cell', { cat: 'res', value: 14, w: 0.4, icon: { s: 'cell', c: '#ffd166', c2: '#a9761b' },
    name: { tr: 'Enerji Hücresi', en: 'Power Cell' },
    desc: { tr: 'Yarı dolu istasyon hücresi. Dron ve rover için yakıt.', en: 'A half-charged station cell. Fuel for drones and rovers.' } });

  /* ------------------------------- PARÇA -------------------------------- */
  it('ti_wire', { cat: 'comp', value: 26, w: 0.3, icon: { s: 'coil', c: '#cfd8e6', c2: '#7d8798' },
    name: { tr: 'İşlenmiş Titanyum Kablo', en: 'Drawn Titanium Cable' },
    desc: { tr: 'İnce çekilmiş, kopmaz. Krank yalnızca bununla iş yapar.', en: 'Drawn thin, will not snap. The only currency Krank respects.' } });

  it('pcb', { cat: 'comp', value: 20, w: 0.1, icon: { s: 'pcb', c: '#2f7f5a', c2: '#d7b64a' },
    name: { tr: 'Baskı Devre Kartı', en: 'Printed Circuit Board' },
    desc: { tr: 'Bakır yollar dağlanmış cam elyaf plaka.', en: 'Fibreglass board with etched copper traces.' } });

  it('capacitor', { cat: 'comp', value: 16, w: 0.1, icon: { s: 'cap2', c: '#4a6fd0', c2: '#20305e' },
    name: { tr: 'Kondansatör Bankası', en: 'Capacitor Bank' },
    desc: { tr: 'Ani akım gerektiren her devrenin kalbi.', en: 'The heart of any circuit that needs a sudden surge.' } });

  it('lens_opt', { cat: 'comp', value: 24, w: 0.1, icon: { s: 'lens', c: '#cdeaff', c2: '#5c86a8' },
    name: { tr: 'Optik Lens', en: 'Optical Lens' },
    desc: { tr: 'Kuvarstan taşlanmış mercek. Sensör ve tarayıcılarda kullanılır.', en: 'Ground from quartz. Used in sensors and scanners.' } });

  it('servo', { cat: 'comp', value: 30, w: 0.5, icon: { s: 'box', c: '#5b6b8a', c2: '#2c3550' },
    name: { tr: 'Servo Motor', en: 'Servo Motor' },
    desc: { tr: 'Dişli kutulu küçük motor. Kanat ve süspansiyon kontrolü.', en: 'Small geared motor. Drives control surfaces and suspension.' } });

  it('prop_blade', { cat: 'comp', value: 22, w: 0.3, icon: { s: 'prop', c: '#c8d2e0', c2: '#69738a' },
    name: { tr: 'Çekişli Pervane Kanadı', en: 'Puller Propeller Blade' },
    desc: { tr: 'Önden çekiş (puller) konfigürasyonu için hatveli kanat: gövdeyi temiz havada tutar.',
            en: 'Pitched blade for a puller configuration: keeps the airframe in clean air.' } });

  it('chainring', { cat: 'comp', value: 28, w: 0.6, icon: { s: 'ring', c: '#b9c4d4', c2: '#6c7688' },
    name: { tr: 'Tekli Aynakol', en: 'Single Chainring' },
    desc: { tr: 'Ön aktarıcısız, dar-geniş dişli profili. Zincir tozlu arazide bile düşmez.',
            en: 'No front derailleur, narrow-wide tooth profile. The chain stays on in dusty terrain.' } });

  it('disc_brake', { cat: 'comp', value: 32, w: 0.7, icon: { s: 'disc', c: '#aab4c4', c2: '#4d5566' },
    name: { tr: 'Mekanik Disk Fren', en: 'Mechanical Disc Brake' },
    desc: { tr: 'Yüksek sürtünmeli balata, kabloyla çekilir. Hidrolik yok — sahada onarılabilir.',
            en: 'High-friction pads pulled by cable. No hydraulics — field repairable.' } });

  it('frame_alloy', { cat: 'comp', value: 40, w: 2.0, icon: { s: 'frame', c: '#d0d8e6', c2: '#727c90' },
    name: { tr: 'Alaşım Şasi', en: 'Alloy Frame' },
    desc: { tr: 'Titanyum boru kaynağı. Dağ bisikleti geometrisi, uzun süspansiyon yolu.',
            en: 'Welded titanium tubing. Mountain-bike geometry, long suspension travel.' } });

  it('battery', { cat: 'comp', value: 34, w: 0.8, icon: { s: 'cell', c: '#7dff9f', c2: '#1f8f52' },
    name: { tr: 'Batarya Paketi', en: 'Battery Pack' },
    desc: { tr: 'Dengelenmiş hücre dizisi. Kapasite: araç ve dron menzili.', en: 'Balanced cell array. Its capacity is your vehicle and drone range.' } });

  it('antenna', { cat: 'comp', value: 18, w: 0.2, icon: { s: 'ant', c: '#9fb6c9', c2: '#4c6478' },
    name: { tr: 'Anten Dizisi', en: 'Antenna Array' },
    desc: { tr: 'Bakır tellerden örülmüş yönlü anten.', en: 'Directional antenna woven from copper wire.' } });

  it('tire_knobby', { cat: 'comp', value: 24, w: 1.0, icon: { s: 'tire', c: '#33333a', c2: '#15151a' },
    name: { tr: 'Tırtıklı Lastik', en: 'Knobby Tyre' },
    desc: { tr: 'Düşük basınç, geniş kesit. Gevşek zeminde tutunur.', en: 'Low pressure, wide casing. Grips loose ground.' } });

  /* ------------------------------- CİHAZ -------------------------------- */
  it('esp32', { cat: 'dev', value: 55, w: 0.15, icon: { s: 'mcu', c: '#3a4f7a', c2: '#d7b64a' },
    name: { tr: 'ESP32 Mikrodenetleyici', en: 'ESP32 Microcontroller' },
    desc: { tr: 'Çift çekirdek, dahili telsiz. Diğer tüm cihazların beyni.', en: 'Dual core with an on-board radio. The brain of every other device.' } });

  it('air_sensor', { cat: 'dev', value: 75, w: 0.3, icon: { s: 'sensor', c: '#4ad0e0', c2: '#1a6a76' },
    name: { tr: 'Hava Kalitesi Sensörü', en: 'Air-Quality Sensor' },
    desc: { tr: 'Partikül ve iyonizasyon okur. Fırtınayı gelmeden dakikalar önce haber verir.',
            en: 'Reads particulates and ionisation. Warns of storms minutes before they hit.' },
    passive: 'forecast' });

  it('radar', { cat: 'dev', value: 90, w: 0.5, icon: { s: 'radar', c: '#7de0b0', c2: '#1f7d5a' },
    name: { tr: 'Ultrasonik Radar', en: 'Ultrasonic Radar' },
    desc: { tr: 'Yankı haritalama. Kaynakları ve düşman zayıf noktalarını gösterir.',
            en: 'Echo mapping. Reveals resources and enemy weak points.' },
    passive: 'scan' });

  it('multimeter', { cat: 'dev', value: 45, w: 0.3, icon: { s: 'meter', c: '#ffd166', c2: '#5a4410' },
    name: { tr: 'Multimetre', en: 'Multimeter' },
    desc: { tr: 'Gerilim ve direnç ölçer. Bozulan cihazların arızasını bununla bulursun.',
            en: 'Measures voltage and resistance. Your only way to diagnose failed devices.' },
    passive: 'repair' });

  it('comms_module', { cat: 'dev', value: 110, w: 0.4, icon: { s: 'comms', c: '#7aa2ff', c2: '#26386e' },
    name: { tr: 'İletişim Modülü', en: 'Comms Module' },
    desc: { tr: 'Zırha takılır. Eko\'nun ellerinden çıkma; uzak kampların sinyalini yakalar.',
            en: 'Bolts onto the armour. Built by Eko; it picks up distant camp signals.' },
    passive: 'comms' });

  it('flight_ctrl', { cat: 'dev', value: 120, w: 0.3, icon: { s: 'mcu', c: '#2f6f5a', c2: '#9fe0c0' },
    name: { tr: 'Uçuş Kontrolcüsü', en: 'Flight Controller' },
    desc: { tr: 'Valkyrie\'nin şeması. Jiroskop birleştirme + batarya optimizasyonu.',
            en: "Valkyrie's schematic. Gyro fusion plus battery optimisation." } });

  it('shield_mod', { cat: 'dev', value: 130, w: 0.9, icon: { s: 'shield', c: '#8fd0ff', c2: '#25567f' },
    name: { tr: 'Kalkan Modülü', en: 'Shield Module' },
    desc: { tr: 'Manyetik bariyer. Aşırı yüklenirse patlar — savaşta taktik seçenek açar.',
            en: 'Magnetic barrier. Overload it and it detonates — a tactical option in combat.' },
    passive: 'shield' });

  it('beacon', { cat: 'dev', value: 60, w: 0.6, icon: { s: 'ant', c: '#ffd166', c2: '#7a5410' },
    name: { tr: 'Kamp Feneri', en: 'Camp Beacon' },
    desc: { tr: 'Kurulduğu yeri haritada işaretler ve kamp ateşi yakmanı sağlar.',
            en: 'Marks its position on the map and lets you light a campfire.' } });

  /* ------------------------------ KUŞAM --------------------------------- */
  it('suit_basic', { cat: 'gear', slot: 'suit', value: 40, w: 4, def: 3, icon: { s: 'suit', c: '#c9d4e4', c2: '#5c6880' },
    name: { tr: 'Hasarlı Uzay Zırhı', en: 'Damaged Space Armour' },
    desc: { tr: 'Düşüşten sağ çıkan tek katman. Yamalı ama hâlâ basınç tutuyor.', en: 'The only layer that survived the fall. Patched, but it still holds pressure.' } });

  it('suit_reinforced', { cat: 'gear', slot: 'suit', value: 180, w: 6, def: 8, o2: 20,
    icon: { s: 'suit', c: '#9fb6c9', c2: '#3d4a5e' },
    name: { tr: 'Takviyeli Zırh', en: 'Reinforced Armour' },
    desc: { tr: 'Titanyum plakalı. Asit ve şarapnele karşı belirgin koruma.', en: 'Titanium plated. Real protection against acid and shrapnel.' },
    resist: { acid: 0.4 } });

  it('suit_thermal', { cat: 'gear', slot: 'suit', value: 220, w: 6, def: 6, heat: 1,
    icon: { s: 'suit', c: '#ffb08a', c2: '#7a3f2a' },
    name: { tr: 'Termal Zırh', en: 'Thermal Armour' },
    desc: { tr: 'Aerojel astarlı. Tipide ısı kaybını neredeyse sıfırlar.', en: 'Aerogel lined. Almost eliminates heat loss in a blizzard.' },
    resist: { cold: 0.7 } });

  it('suit_rad', { cat: 'gear', slot: 'suit', value: 240, w: 7, def: 7,
    icon: { s: 'suit', c: '#d8e06a', c2: '#5e6a1c' },
    name: { tr: 'Kurşun Örgü Zırh', en: 'Lead-Weave Armour' },
    desc: { tr: 'Radyasyon fırtınalarında dışarıda kalabilmen için.', en: 'Lets you stay outside through a radiation storm.' },
    resist: { rad: 0.75 } });

  /* Zırh altı kıyafetler — dayanıklılık (stamina) statını belirler */
  it('shirt_boxy', { cat: 'gear', slot: 'shirt', value: 20, w: 0.4, sta: 8,
    icon: { s: 'shirt', c: '#e0e4ea', c2: '#9aa2b0' },
    name: { tr: 'Geniş Kesim Tişört', en: 'Boxy-Fit T-Shirt' },
    desc: { tr: 'Omuzda sıkmayan bol kesim. Zırhın altında hareket serbestliği verir: +8 dayanıklılık.',
            en: 'A loose cut that never binds the shoulder. Free movement under armour: +8 stamina.' } });

  it('shirt_drifit', { cat: 'gear', slot: 'shirt', value: 55, w: 0.3, sta: 14, regen: 0.6,
    icon: { s: 'shirt', c: '#4ad0e0', c2: '#1a6a76' },
    name: { tr: 'Dri-Fit Teknik Tişört', en: 'Dri-Fit Technical Tee' },
    desc: { tr: 'Teri kılcal kanallarla dışarı taşıyan örgü kumaş: ter ve nem zırhın içinde birikmez. +14 dayanıklılık, hızlı yenilenme.',
            en: 'Knit fabric that wicks sweat out through capillary channels: no moisture trapped inside the armour. +14 stamina, faster regen.' } });

  it('shirt_thermal', { cat: 'gear', slot: 'shirt', value: 70, w: 0.6, sta: 10, heat: 1,
    icon: { s: 'shirt', c: '#ff9d6a', c2: '#8a4520' },
    name: { tr: 'Termal İçlik', en: 'Thermal Base Layer' },
    desc: { tr: 'Merinos benzeri biyo lif örgü. Soğukta ısıyı tutar.', en: 'Merino-like bio-fibre knit. Holds warmth in the cold.' },
    resist: { cold: 0.3 } });

  it('boots_cushion', { cat: 'gear', slot: 'boots', value: 60, w: 1.2, sta: 10, spd: 0.08,
    icon: { s: 'boot', c: '#a06a3a', c2: '#4e3018' },
    name: { tr: 'Yastıklamalı Keşif Botu', en: 'Cushioned Exploration Boots' },
    desc: { tr: 'Kalın ara taban zorlu zeminde darbeyi emer; uzun yürüyüşte diz yorulmaz. +10 dayanıklılık, +hız.',
            en: 'A thick midsole soaks up impact on rough ground; knees survive the long marches. +10 stamina, +speed.' } });

  it('boots_grip', { cat: 'gear', slot: 'boots', value: 90, w: 1.4, sta: 6, spd: 0.04,
    icon: { s: 'boot', c: '#5a6a4a', c2: '#28321f' },
    name: { tr: 'Kramponlu Bot', en: 'Crampon Boots' },
    desc: { tr: 'Buzulda ve ıslak kayada kaymaz.', en: 'No slipping on glacier ice or wet rock.' },
    resist: { cold: 0.2 } });

  /* Silahlar */
  it('cutter', { cat: 'gear', slot: 'weapon', value: 30, w: 1.5, atk: 6,
    icon: { s: 'cutter', c: '#ff8f4d', c2: '#7a3a10' },
    name: { tr: 'Plazma Kesici', en: 'Plasma Cutter' },
    desc: { tr: 'Kurtarma aleti, silah değil. Ama eldeki tek şey.', en: 'A salvage tool, not a weapon. But it is what you have.' } });

  it('rail_pistol', { cat: 'gear', slot: 'weapon', value: 160, w: 2, atk: 14,
    icon: { s: 'gun', c: '#9fb6c9', c2: '#3d4a5e' },
    name: { tr: 'Ray Tabancası', en: 'Rail Pistol' },
    desc: { tr: 'Kondansatör bankası mermiyi mıknatısla fırlatır. Gürültülü ve etkili.', en: 'A capacitor bank slings the slug magnetically. Loud and effective.' } });

  it('arc_lance', { cat: 'gear', slot: 'weapon', value: 280, w: 3, atk: 22,
    icon: { s: 'lance', c: '#8fd0ff', c2: '#25567f' },
    name: { tr: 'Ark Mızrağı', en: 'Arc Lance' },
    desc: { tr: 'Kapalı devre yay boşalması. Zırhı yok sayar.', en: 'Closed-loop arc discharge. It ignores armour.' } });

  /* ------------------------------- SARF --------------------------------- */
  it('medkit', { cat: 'use', value: 35, w: 0.4, use: { hp: 45 }, icon: { s: 'kit', c: '#ff6a7d', c2: '#7a1f2c' },
    name: { tr: 'İlk Yardım Kiti', en: 'Medkit' },
    desc: { tr: 'Can +45.', en: 'Health +45.' } });

  it('o2_canister', { cat: 'use', value: 25, w: 0.6, use: { o2: 60 }, icon: { s: 'tank', c: '#9adcff', c2: '#2f7fd1' },
    name: { tr: 'Oksijen Tüpü', en: 'Oxygen Canister' },
    desc: { tr: 'Oksijen +60.', en: 'Oxygen +60.' } });

  it('stim', { cat: 'use', value: 20, w: 0.2, use: { sta: 50 }, icon: { s: 'vial', c: '#ffd166', c2: '#7a5410' },
    name: { tr: 'Stimülan', en: 'Stimulant' },
    desc: { tr: 'Dayanıklılık +50, biraz stres.', en: 'Stamina +50, a little stress.' } });

  it('antirad', { cat: 'use', value: 40, w: 0.2, use: { rad: 1, hp: 10 }, icon: { s: 'vial', c: '#d8e06a', c2: '#5e6a1c' },
    name: { tr: 'Anti-Radyasyon', en: 'Anti-Rad' },
    desc: { tr: 'Radyasyon birikimini temizler.', en: 'Clears accumulated radiation.' } });

  it('coolant', { cat: 'use', value: 30, w: 0.3, use: { heat: 1 }, icon: { s: 'vial', c: '#8fd0ff', c2: '#25567f' },
    name: { tr: 'Soğutucu Ampul', en: 'Coolant Ampoule' },
    desc: { tr: 'Aşırı ısınan modülleri sıfırlar; tipide vücut ısını korur.', en: 'Resets overheated modules; holds body heat in a blizzard.' } });

  it('repair_kit', { cat: 'use', value: 45, w: 0.7, use: { repair: 40 }, icon: { s: 'kit', c: '#7de0b0', c2: '#1f7d5a' },
    name: { tr: 'Onarım Kiti', en: 'Repair Kit' },
    desc: { tr: 'Araç veya zırh dayanıklılığını +40 onarır.', en: 'Restores +40 durability to a vehicle or armour.' } });

  it('ration', { cat: 'use', value: 12, w: 0.3, use: { hp: 12, sta: 20, stress: -4 }, icon: { s: 'box', c: '#c9a06a', c2: '#6a4a20' },
    name: { tr: 'Sıkıştırılmış Erzak', en: 'Compressed Ration' },
    desc: { tr: 'Tadı yok ama moral veriyor.', en: 'Tastes of nothing, but it helps.' } });

  it('spore_tea', { cat: 'use', value: 26, w: 0.2, use: { stress: -18, sta: 15 }, icon: { s: 'vial', c: '#c07de0', c2: '#6a3690' },
    name: { tr: 'Spor Çayı', en: 'Spore Tea' },
    desc: { tr: 'Stres -18. Mantar ormanının tek nazik hediyesi.', en: 'Stress -18. The one kind gift of the mycelium forest.' } });

  /* ------------------------------- MEDYA -------------------------------- */
  it('manga_garden', { cat: 'media', value: 70, w: 0.2, stress: 22, icon: { s: 'book', c: '#ff8fb0', c2: '#7a2f4a' },
    name: { tr: 'Yıldız Bahçesi — Renklendirilmiş Manga Cilt 1', en: 'Star Garden — Colourised Manga Vol. 1' },
    desc: { tr: 'Tome\'un elinden çıkma, kare kare renklendirilmiş fantastik seri. Kamp ateşinde okunur: stres -22.',
            en: 'Colourised panel by panel by Tome. Read it at a campfire: stress -22.' } });

  it('manga_leviathan', { cat: 'media', value: 85, w: 0.2, stress: 26, icon: { s: 'book', c: '#8fd0ff', c2: '#25567f' },
    name: { tr: 'Kum Leviathan\'ı — Manga Cilt 3', en: 'Sand Leviathan — Manga Vol. 3' },
    desc: { tr: 'Çölde yaşayan bir devle dostluk kuran çocuğun hikâyesi. Stres -26.', en: 'A child befriends a giant in the desert. Stress -26.' } });

  it('comic_archive', { cat: 'media', value: 120, w: 0.3, stress: 34, icon: { s: 'book', c: '#c79bff', c2: '#4a2a8a' },
    name: { tr: 'Dijital Çizgi Roman Arşivi', en: 'Digital Comic Archive' },
    desc: { tr: 'Yüzlerce cilt, tek kristalde. Kamp ateşinde en güçlü rahatlama: stres -34.',
            en: 'Hundreds of volumes on one crystal. The strongest campfire relief: stress -34.' } });

  /* ------------------------------- GÖREV -------------------------------- */
  it('core_fragment', { cat: 'key', value: 0, w: 0.5, stackMax: 5, icon: { s: 'frag', c: '#4df2c8', c2: '#0e6a55' },
    name: { tr: 'Kuantum Çekirdeği Parçası', en: 'Quantum Core Fragment' },
    desc: { tr: 'Hâlâ atıyor. Beşi bir arada yırtığı kapatabilir.', en: 'It still pulses. Five together can close the tear.' } });

  it('ship_log', { cat: 'key', value: 0, w: 0.1, icon: { s: 'card', c: '#ffd166', c2: '#7a5410' },
    name: { tr: 'Gemi Kaydı', en: 'Ship Log' },
    desc: { tr: 'Argos\'un son saniyeleri.', en: 'The final seconds of the Argos.' } });

  /* --------------------------------------------------------------------- */
  const It = QW.Items = {
    db: DB,
    get: id => DB[id] || null,
    name: id => QW.L((DB[id] || {}).name) || id,
    desc: id => QW.L((DB[id] || {}).desc) || '',
    value: id => (DB[id] || {}).value || 0,
    all: () => Object.keys(DB),
    byCat: c => Object.keys(DB).filter(k => DB[k].cat === c),
    /* İçerik güncellemeleri bu fonksiyonla yeni eşya enjekte edebilir */
    add: (id, o) => it(id, o)
  };

})(window.QW);
