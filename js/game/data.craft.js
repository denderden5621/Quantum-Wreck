/* =========================================================================
 * QW.Recipes — çalışma masası şemaları
 *  cat  : elec | gear | veh | med
 *  need : { itemId: adet }
 *  out  : { id, n }
 *  lock : true ise şema NPC takasından / keşiften açılmalı
 *  bench: 'station' ise sadece Merkez İstasyon tezgâhında üretilebilir
 *  fail : üretim sırasında arıza ihtimali (multimetre mini-oyununu tetikler)
 * ========================================================================= */
(function (QW) {
  'use strict';

  const R = [];
  function rec(id, o) { o.id = id; R.push(o); return o; }

  /* ------------------------- ELEKTRONİK ------------------------- */
  rec('r_pcb', { cat: 'elec', need: { silicon: 2, copper: 2 }, out: { id: 'pcb', n: 1 }, time: 1.2,
    name: { tr: 'Baskı Devre Kartı', en: 'Printed Circuit Board' },
    note: { tr: 'Bakır yolları silikon plakaya dağlarsın.', en: 'Etch copper traces onto a silicon board.' } });

  rec('r_cap', { cat: 'elec', need: { copper: 2, scrap: 1 }, out: { id: 'capacitor', n: 1 }, time: 1.0,
    name: { tr: 'Kondansatör Bankası', en: 'Capacitor Bank' } });

  rec('r_lens', { cat: 'elec', need: { quartz: 2 }, out: { id: 'lens_opt', n: 1 }, time: 1.2,
    name: { tr: 'Optik Lens', en: 'Optical Lens' } });

  rec('r_antenna', { cat: 'elec', need: { copper: 3, scrap: 1 }, out: { id: 'antenna', n: 1 }, time: 1.0,
    name: { tr: 'Anten Dizisi', en: 'Antenna Array' } });

  rec('r_wire', { cat: 'elec', need: { titanium: 3, copper: 1 }, out: { id: 'ti_wire', n: 2 }, time: 1.6,
    name: { tr: 'Titanyum Kablo Çekimi', en: 'Draw Titanium Cable' },
    note: { tr: 'Krank yalnızca bu kabloyla takas yapar.', en: 'Krank only barters for this cable.' } });

  rec('r_battery', { cat: 'elec', need: { power_cell: 2, copper: 2, scrap: 2 }, out: { id: 'battery', n: 1 }, time: 2.0, fail: 0.15,
    name: { tr: 'Batarya Paketi', en: 'Battery Pack' },
    note: { tr: 'Hücreleri dengele; dengesiz paket ısınır.', en: 'Balance the cells; an unbalanced pack overheats.' } });

  rec('r_esp32', { cat: 'elec', need: { pcb: 1, silicon: 3, copper: 1, quartz: 1 }, out: { id: 'esp32', n: 1 }, time: 2.4, fail: 0.18,
    name: { tr: 'ESP32 Mikrodenetleyici', en: 'ESP32 Microcontroller' },
    note: { tr: 'Kuvars osilatör 40 MHz\'e ayarlanır, telsiz katmanı kalibre edilir.',
            en: 'The quartz oscillator is trimmed to 40 MHz and the radio stage is calibrated.' } });

  rec('r_air_sensor', { cat: 'elec', need: { esp32: 1, pcb: 1, lens_opt: 1, copper: 2 }, out: { id: 'air_sensor', n: 1 }, time: 2.6, fail: 0.2,
    name: { tr: 'Hava Kalitesi Sensörü', en: 'Air-Quality Sensor' },
    note: { tr: 'Lazer saçılım odası + iyonizasyon sayacı. Fırtına tahmini açılır.',
            en: 'Laser scattering chamber plus ionisation counter. Unlocks storm forecasting.' } });

  rec('r_radar', { cat: 'elec', need: { esp32: 1, pcb: 1, capacitor: 1, antenna: 1, titanium: 2 }, out: { id: 'radar', n: 1 }, time: 3.0, fail: 0.22,
    name: { tr: 'Ultrasonik Radar', en: 'Ultrasonic Radar' },
    note: { tr: 'Yankı gecikmesinden mesafe çıkarır. Savaşta zayıf nokta bulur.',
            en: 'Derives range from echo delay. Finds weak points in combat.' } });

  rec('r_multimeter', { cat: 'elec', need: { pcb: 1, copper: 2, scrap: 2, quartz: 1 }, out: { id: 'multimeter', n: 1 }, time: 1.8,
    name: { tr: 'Multimetre', en: 'Multimeter' },
    note: { tr: 'Bozulan cihazların arıza tespiti için şart.', en: 'Required to diagnose failed devices.' } });

  rec('r_beacon', { cat: 'elec', need: { antenna: 1, power_cell: 1, scrap: 3 }, out: { id: 'beacon', n: 1 }, time: 1.6,
    name: { tr: 'Kamp Feneri', en: 'Camp Beacon' } });

  rec('r_shield', { cat: 'elec', lock: true, need: { esp32: 1, capacitor: 2, ti_wire: 2, battery: 1 }, out: { id: 'shield_mod', n: 1 }, time: 3.4, fail: 0.25,
    name: { tr: 'Kalkan Modülü', en: 'Shield Module' },
    note: { tr: 'Şema: Merkez İstasyon. Aşırı yükleme taktiğini açar.', en: 'Schematic: Central Station. Unlocks the overload tactic.' } });

  rec('r_flight_ctrl', { cat: 'elec', lock: true, need: { esp32: 1, pcb: 1, capacitor: 1, aero_data: 2 }, out: { id: 'flight_ctrl', n: 1 }, time: 3.0, fail: 0.2,
    name: { tr: 'Uçuş Kontrolcüsü', en: 'Flight Controller' },
    note: { tr: 'Şema: Valkyrie. Jiroskop birleştirme ve batarya optimizasyonu.', en: 'Schematic: Valkyrie. Gyro fusion and battery optimisation.' } });

  rec('r_comms', { cat: 'elec', lock: true, need: { cassette_mech: 1, cd_lens: 1, antenna: 1, esp32: 1 }, out: { id: 'comms_module', n: 1 }, time: 3.0,
    name: { tr: 'İletişim Modülü', en: 'Comms Module' },
    note: { tr: 'Şema: Eko. Kaset kafası anten sürücüsüne, CD lensi alıcıya dönüşür.',
            en: 'Schematic: Eko. The tape head becomes the antenna driver, the CD lens the receiver.' } });

  /* --------------------------- KUŞAM --------------------------- */
  rec('r_liner_crew', { cat: 'gear', need: { bio_fiber: 4 }, out: { id: 'liner_crew', n: 1 }, time: 1.4,
    name: { tr: 'Mürettebat İçliği', en: 'Crew Undersuit' },
    note: { tr: 'Düz dikiş, omuzda sürtünme yok.', en: 'Flat seams, no chafing at the shoulder.' } });

  rec('r_liner_wick', { cat: 'gear', need: { bio_fiber: 6, silicon: 1 }, out: { id: 'liner_wick', n: 1 }, time: 1.8,
    name: { tr: 'Kılcal Kanallı İçlik', en: 'Capillary Wick Liner' },
    note: { tr: 'Lifleri kılcal kanallı örersin: ter zırhın içinde kalmaz.',
            en: 'Weave the fibres with capillary channels: sweat never stays inside the armour.' } });

  rec('r_liner_thermal', { cat: 'gear', need: { bio_fiber: 6, spore_cap: 2, copper: 2 }, out: { id: 'liner_thermal', n: 1 }, time: 1.8,
    name: { tr: 'Termal Regülasyon Katmanı', en: 'Thermal Regulation Layer' },
    note: { tr: 'İnce bakır hat örgünün içinden geçirilir.', en: 'A fine copper line is threaded through the weave.' } });

  rec('r_liner_lead', { cat: 'gear', need: { bio_fiber: 5, scrap: 4, titanium: 1 }, out: { id: 'liner_lead', n: 1 }, time: 2.2,
    name: { tr: 'Kurşun-İpek Astar', en: 'Lead-Silk Liner' },
    note: { tr: 'Hurdadan çıkarılan kurşun tozu biyo-ipeğe emdirilir.',
            en: 'Lead dust rendered from scrap is worked into the bio-silk.' } });

  rec('r_boots_regolith', { cat: 'gear', need: { bio_fiber: 3, rubber_sap: 3, scrap: 1 }, out: { id: 'boots_regolith', n: 1 }, time: 2.0,
    name: { tr: 'Regolit Botu', en: 'Regolith Boots' },
    note: { tr: 'Gözenekli kauçuk ara taban keskin regolitin darbesini emer.',
            en: 'A porous rubber midsole absorbs the shock of sharp regolith.' } });

  rec('r_boots_maggrip', { cat: 'gear', need: { rubber_sap: 2, titanium: 2, copper: 3 }, out: { id: 'boots_maggrip', n: 1 }, time: 2.0,
    name: { tr: 'Manyetik Tutunma Botu', en: 'Mag-Grip Boots' },
    note: { tr: 'Taban elektromıknatısları metal enkazda ve buzda tutunur.',
            en: 'Sole electromagnets bite into wreck plating and ice.' } });

  rec('r_boots_seal', { cat: 'gear', need: { rubber_sap: 4, bio_fiber: 3, acid_sac: 1 }, out: { id: 'boots_seal', n: 1 }, time: 2.2,
    name: { tr: 'Contalı Batak Botu', en: 'Sealed Marsh Boots' },
    note: { tr: 'Asit kesesinden çıkarılan polimer contayı diz hizasına kadar çeker.',
            en: 'Polymer rendered from an acid sac seals the boot to the knee.' } });

  rec('r_suit_reinforced', { cat: 'gear', need: { titanium: 6, ti_wire: 2, scrap: 4 }, out: { id: 'suit_reinforced', n: 1 }, time: 3.4,
    name: { tr: 'Takviyeli Zırh', en: 'Reinforced Armour' } });

  rec('r_suit_thermal', { cat: 'gear', lock: true, need: { titanium: 4, bio_fiber: 6, ice_shard: 4, spore_cap: 3 }, out: { id: 'suit_thermal', n: 1 }, time: 3.6,
    name: { tr: 'Termal Zırh', en: 'Thermal Armour' },
    note: { tr: 'Şema: Krank. Aerojel astar buzulda hayatta kalmanı sağlar.', en: 'Schematic: Krank. The aerogel liner keeps you alive on the glacier.' } });

  rec('r_suit_rad', { cat: 'gear', lock: true, need: { titanium: 5, ti_wire: 3, acid_sac: 2, scrap: 6 }, out: { id: 'suit_rad', n: 1 }, time: 3.8,
    name: { tr: 'Kurşun Örgü Zırh', en: 'Lead-Weave Armour' },
    note: { tr: 'Şema: Merkez İstasyon.', en: 'Schematic: Central Station.' } });

  rec('r_rail', { cat: 'gear', lock: true, need: { capacitor: 2, ti_wire: 2, titanium: 3, battery: 1 }, out: { id: 'rail_pistol', n: 1 }, time: 3.2, fail: 0.15,
    name: { tr: 'Ray Tabancası', en: 'Rail Pistol' },
    note: { tr: 'Şema: Merkez İstasyon.', en: 'Schematic: Central Station.' } });

  rec('r_lance', { cat: 'gear', lock: true, bench: 'station', need: { arc_core_sub: 0, capacitor: 3, ti_wire: 4, quartz: 3, battery: 1 }, out: { id: 'arc_lance', n: 1 }, time: 4.0, fail: 0.2,
    name: { tr: 'Ark Mızrağı', en: 'Arc Lance' },
    note: { tr: 'İstasyon tezgâhı gerekir.', en: 'Requires the Station bench.' } });

  /* ---------------------------- ARAÇ ---------------------------- */
  rec('r_chainring', { cat: 'veh', need: { titanium: 3, scrap: 2 }, out: { id: 'chainring', n: 1 }, time: 2.0,
    name: { tr: 'Tekli Aynakol', en: 'Single Chainring' },
    note: { tr: 'Dar-geniş diş profili zinciri arazi darbelerinde tutar; ön aktarıcı gerekmez.',
            en: 'A narrow-wide tooth profile holds the chain over terrain hits; no front derailleur needed.' } });

  rec('r_disc_brake', { cat: 'veh', need: { titanium: 2, ti_wire: 1, scrap: 3 }, out: { id: 'disc_brake', n: 1 }, time: 2.0,
    name: { tr: 'Mekanik Disk Fren', en: 'Mechanical Disc Brake' },
    note: { tr: 'Kabloyla çekilen, yüksek sürtünmeli balata. Hidrolik hattı patlamaz.',
            en: 'Cable-actuated, high-friction pads. No hydraulic line to burst.' } });

  rec('r_tire', { cat: 'veh', need: { rubber_sap: 4, bio_fiber: 2 }, out: { id: 'tire_knobby', n: 2 }, time: 1.8,
    name: { tr: 'Tırtıklı Lastik', en: 'Knobby Tyre' } });

  rec('r_frame', { cat: 'veh', need: { titanium: 6, ti_wire: 2, scrap: 4 }, out: { id: 'frame_alloy', n: 1 }, time: 3.0,
    name: { tr: 'Alaşım Şasi', en: 'Alloy Frame' },
    note: { tr: 'Dağ bisikleti geometrisi: uzun süspansiyon yolu, alçak ağırlık merkezi.',
            en: 'Mountain-bike geometry: long travel, low centre of gravity.' } });

  rec('r_servo', { cat: 'veh', need: { copper: 3, scrap: 2, titanium: 1 }, out: { id: 'servo', n: 1 }, time: 1.8,
    name: { tr: 'Servo Motor', en: 'Servo Motor' } });

  rec('r_prop', { cat: 'veh', need: { titanium: 1, bio_fiber: 2, scrap: 1 }, out: { id: 'prop_blade', n: 2 }, time: 1.6,
    name: { tr: 'Pervane Kanadı', en: 'Propeller Blade' },
    note: { tr: 'Kanat kökten uca burularak dövülür; hatve uç hızıyla birlikte azalır.',
            en: 'The blade is forged with twist from root to tip, pitch falling as tip speed rises.' } });

  rec('r_rover', { cat: 'veh', lock: true, need: { frame_alloy: 1, chainring: 1, disc_brake: 2, tire_knobby: 2, battery: 1, servo: 1 },
    out: { id: 'veh_rover', n: 1 }, vehicle: 'rover', time: 5.0, fail: 0.12,
    name: { tr: 'Arazi Rover\'ı', en: 'Terrain Rover' },
    note: { tr: 'Şema: Krank. Zehirli bataklığı ve gevşek kumu geçer.', en: 'Schematic: Krank. Crosses toxic marsh and loose sand.' } });

  rec('r_drone', { cat: 'veh', lock: true, need: { flight_ctrl: 1, prop_blade: 4, servo: 2, battery: 1, titanium: 2 },
    out: { id: 'veh_drone', n: 1 }, vehicle: 'drone', time: 5.0, fail: 0.15,
    name: { tr: 'Keşif İHA\'sı', en: 'Exploration UAV' },
    note: { tr: 'Şema: Valkyrie. Kanyonları aşar, bölgeyi tarar.', en: 'Schematic: Valkyrie. Crosses canyons and scans the area.' } });

  /* ---------------------------- KİMYA --------------------------- */
  rec('r_medkit', { cat: 'med', need: { bio_fiber: 2, spore_cap: 1 }, out: { id: 'medkit', n: 1 }, time: 1.0,
    name: { tr: 'İlk Yardım Kiti', en: 'Medkit' } });

  rec('r_o2', { cat: 'med', need: { scrap: 2, ice_shard: 2 }, out: { id: 'o2_canister', n: 1 }, time: 1.2,
    name: { tr: 'Oksijen Tüpü', en: 'Oxygen Canister' },
    note: { tr: 'Buzu elektrolizle ayrıştırırsın.', en: 'Electrolyse the ice apart.' } });

  rec('r_stim', { cat: 'med', need: { spore_cap: 2, quartz: 1 }, out: { id: 'stim', n: 1 }, time: 1.0,
    name: { tr: 'Stimülan', en: 'Stimulant' } });

  rec('r_antirad', { cat: 'med', need: { spore_cap: 2, ice_shard: 1, bio_fiber: 1 }, out: { id: 'antirad', n: 1 }, time: 1.2,
    name: { tr: 'Anti-Radyasyon', en: 'Anti-Rad' } });

  rec('r_coolant', { cat: 'med', need: { ice_shard: 3, acid_sac: 1 }, out: { id: 'coolant', n: 1 }, time: 1.2,
    name: { tr: 'Soğutucu Ampul', en: 'Coolant Ampoule' } });

  rec('r_repair', { cat: 'med', need: { scrap: 3, copper: 1, bio_fiber: 1 }, out: { id: 'repair_kit', n: 1 }, time: 1.4,
    name: { tr: 'Onarım Kiti', en: 'Repair Kit' } });

  rec('r_tea', { cat: 'med', need: { spore_cap: 3, ice_shard: 1 }, out: { id: 'spore_tea', n: 1 }, time: 1.0,
    name: { tr: 'Spor Çayı', en: 'Spore Tea' } });

  /* Ark Mızrağı tarifindeki yer tutucu maliyeti temizle */
  R.forEach(r => { if (r.need.arc_core_sub === 0) delete r.need.arc_core_sub; });

  QW.Recipes = {
    list: R,
    get: id => R.find(r => r.id === id) || null,
    byCat: c => R.filter(r => r.cat === c),
    add: (id, o) => rec(id, o)
  };

})(window.QW);
