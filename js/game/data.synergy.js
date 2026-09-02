/* =========================================================================
 * QW.Synergies — cihaz sinerjileri: "kombinasyon ekonomisi"
 *
 * Taktikler tek başına toplanır; sinerjiler onları BİRBİRİYLE ÇARPAR.
 * Amaç oyuncuya "sistemin açığını buldum" hissini vermek: doğru iki cihazı
 * aynı anda taşımak, tek tek toplamlarından belirgin biçimde güçlü olmalı.
 *
 * need : taşınması gereken cihaz/eşya kimlikleri
 * veh  : sahip olunması gereken araç
 * hook : nereye bağlandığı — 'tactic:<id>' | 'battle_start' | 'passive'
 * ========================================================================= */
(function (QW) {
  'use strict';

  const L = [];
  function syn(id, o) { o.id = id; L.push(o); return o; }

  syn('triangulate', {
    need: ['radar', 'comms_module'], hook: 'tactic:scan',
    name: { tr: 'Üçgenleme', en: 'Triangulation' },
    desc: { tr: 'Radar yankısı iletişim modülünün taşıyıcı dalgasıyla eşleşince zayıf nokta çarpanı 1.6 → 2.3 çıkar ve hedefin isabeti kalıcı düşer.',
            en: 'Radar echo phase-locked to the comms carrier raises the weak-point multiplier from 1.6 to 2.3 and permanently degrades the target’s accuracy.' },
    apply(s) { s.syn.weakMult = 2.3; s.e.accuracy = Math.max(0.35, s.e.accuracy - 0.2); }
  });

  syn('charge_bank', {
    need: ['shield_mod', 'capacitor'], hook: 'tactic:overload',
    name: { tr: 'Yük Biriktirme', en: 'Charge Banking' },
    desc: { tr: 'Kondansatör bankası kalkanı boşaltmadan önce şarj eder: aşırı yükleme her bekleyen tur için ×1.25 birikir.',
            en: 'The capacitor bank charges the shield before discharge: the overload gains ×1.25 for every turn you wait.' },
    apply(s) { s.syn.overloadStack = true; }
  });

  syn('paint_target', {
    need: ['radar'], veh: 'drone', hook: 'tactic:distract',
    name: { tr: 'Hedef İşaretleme', en: 'Target Painting' },
    desc: { tr: 'Dron alçak geçişte radar yankısını taşır: dikkat dağıtma aynı anda zayıf noktayı da açar.',
            en: 'The drone carries the radar echo on its pass: the distraction also exposes the weak point.' },
    apply(s) { s.syn.distractExposes = true; }
  });

  syn('early_warning', {
    need: ['air_sensor', 'comms_module'], hook: 'battle_start',
    name: { tr: 'Erken Uyarı', en: 'Early Warning' },
    desc: { tr: 'Sensör iyonizasyon sıçramasını savaştan önce yakalar; ilk turu sen alırsın, düşman sersemler.',
            en: 'The sensor catches the ionisation spike before contact; you take the first turn and the enemy is stunned.' },
    apply(s) { s.e.stun = Math.max(s.e.stun, 1); }
  });

  syn('short_circuit', {
    need: ['multimeter', 'esp32'], hook: 'tactic:jam',
    name: { tr: 'Devre Kısası', en: 'Short Circuit' },
    desc: { tr: 'Multimetre besleme hattını okurken ESP32 aynı frekansta gürültü basar: parazit düşmanın kalkanını da sıfırlar.',
            en: 'The multimeter reads the supply rail while the ESP32 floods the same band: jamming also strips the enemy shield.' },
    apply(s) { s.syn.jamStripsShield = true; }
  });

  syn('ram_entry', {
    veh: 'rover', need: ['shield_mod'], hook: 'battle_start',
    name: { tr: 'Çarpma Girişi', en: 'Ramming Entry' },
    desc: { tr: 'Rover’ın kütlesi kalkan bariyerine binince savaşa açılış darbesiyle girersin.',
            en: 'The rover’s mass behind the barrier means you open the fight with a free strike.' },
    apply(s) { s.syn.openingStrike = 1.8; }
  });

  syn('cold_acid', {
    need: ['coolant', 'acid_sac'], hook: 'passive',
    name: { tr: 'Kırılgan Aşınma', en: 'Brittle Corrosion' },
    desc: { tr: 'Önce soğutup sonra asitleyince zırh çatlar: asit bombası soğutulmuş hedefte iki kat aşındırır.',
            en: 'Chill it, then burn it: the acid bomb corrodes twice as deep on a chilled target.' },
    apply(s) { s.syn.brittle = true; }
  });

  const S = QW.Synergies = {
    list: L,
    get: id => L.find(x => x.id === id) || null,

    /* Şu anki kuşamla hangileri aktif? */
    active() {
      return L.filter(x => {
        if (x.need && !x.need.every(i => QW.Inventory.has(i))) return false;
        if (x.veh && !QW.Vehicles.get(x.veh)) return false;
        return true;
      });
    },

    /* Savaş başında bir kez uygulanır */
    applyAll(s) {
      s.syn = { weakMult: 1.6 };
      const on = S.active();
      on.forEach(x => { try { x.apply(s); } catch (e) { console.warn(e); } });
      return on;
    },

    forTactic(tacticId) {
      return S.active().filter(x => x.hook === 'tactic:' + tacticId);
    },

    /* Henüz tamamlanmamış ama bir adım kalmış kombinasyonlar — keşfi teşvik eder */
    nearMisses() {
      return L.map(x => {
        const missing = [];
        (x.need || []).forEach(i => { if (!QW.Inventory.has(i)) missing.push(QW.Items.name(i)); });
        if (x.veh && !QW.Vehicles.get(x.veh)) missing.push(QW.L(QW.Vehicles.def(x.veh).name));
        return { syn: x, missing };
      }).filter(e => e.missing.length === 1);
    },

    add: (id, o) => syn(id, o)
  };

})(window.QW);
