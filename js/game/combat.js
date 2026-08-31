/* =========================================================================
 * QW.Combat — sıra tabanlı savaş motoru
 * Saldırı yalnızca silahla sınırlı değildir: üretilen donanımlar taktik
 * seçenekleri açar (dronla dikkat dağıtma, sensörle zayıf nokta, kalkan
 * aşırı yüklemesi, iletişim moduyla parazit...).
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils;

  const CB = QW.Combat = { s: null };

  const ENERGY_MAX = 40, ENERGY_REGEN = 9;

  /* --------------------------------------------------------------------
   * BAŞLATMA
   * ------------------------------------------------------------------ */
  CB.begin = function (entity) {
    const def = entity.def;
    const boss = !!def.boss;
    CB.s = {
      entity,
      e: {
        meta: def, name: QW.L(def.name),
        hp: entity.hp, hpMax: entity.hpMax,
        atk: def.atk, def: def.def,
        shield: 0, stun: 0, dot: 0, dotT: 0, defending: 0, evading: 0,
        accuracy: 1, weakFound: false, exposed: 0
      },
      p: {
        energy: ENERGY_MAX, shield: 0, focus: 0, distract: 0,
        poison: 0, stun: 0, blind: 0, guard: 0
      },
      turn: 1, boss, phase: 'player', log: [], over: null,
      fx: null, usedFlee: 0, cooldown: {}
    };
    QW.Audio.playMusic(boss ? 'boss' : 'battle');
    CB.log(QW.t('cb_start', { name: CB.s.e.name }));
    if (boss && def.intro) CB.log(QW.L(def.intro));
    return CB.s;
  };

  CB.log = function (txt) {
    if (!CB.s) return;
    CB.s.log.push(txt);
    if (CB.s.log.length > 24) CB.s.log.shift();
    QW.bus.emit('combat_log', txt);
  };

  /* --------------------------------------------------------------------
   * TAKTİK TANIMLARI — hepsi craft edilen donanıma bağlıdır
   * ------------------------------------------------------------------ */
  const TACTICS = [
    {
      id: 'scan', cost: 6, cd: 0, dev: 'radar',
      name: { tr: 'Sensörle zayıf nokta bul', en: 'Scan for weak point' },
      desc: { tr: 'Ultrasonik radar · sonraki vuruşlar zayıf noktayı hedefler',
              en: 'Ultrasonic radar · subsequent hits target the weak point' },
      run(s) {
        s.e.weakFound = true;
        s.e.exposed = 99;
        QW.Audio.sfx('scan');
        CB.log(QW.t('cb_weak') + ' [' + weakName(s.e.meta.weak) + ']');
      }
    },
    {
      id: 'distract', cost: 8, cd: 3, veh: 'drone', batt: 10,
      name: { tr: 'Dronla dikkat dağıt', en: 'Distract with the drone' },
      desc: { tr: 'İHA alçak geçiş yapar · düşman bir tur kaçırabilir',
              en: 'UAV makes a low pass · the enemy may lose a turn' },
      run(s) {
        QW.Vehicles.recharge('drone', -10);
        QW.Audio.sfx('drone');
        s.p.distract = 2;
        if (Math.random() < 0.65) {
          s.e.stun = Math.max(s.e.stun, 1);
          CB.log(QW.t('cb_stun', { name: s.e.name }));
        } else CB.log(QW.L({ tr: 'Dron gürültü yaptı ama hedef aldırmadı.', en: 'The drone made noise; the target ignored it.' }));
      }
    },
    {
      id: 'overload', cost: 14, cd: 4, dev: 'shield_mod',
      name: { tr: 'Kalkan modülünü aşırı yükle', en: 'Overload the shield module' },
      desc: { tr: 'Manyetik bariyeri patlat · yüksek şok hasarı, sana da yansır',
              en: 'Detonate the barrier · heavy shock damage, some rebounds on you' },
      run(s) {
        const dmg = CB.hit(s, 2.1, 'shock', true);
        const self = Math.round(dmg * 0.18);
        QW.Player.damage(self, 'shock');
        QW.Audio.sfx('explode');
        CB.log(QW.L({ tr: 'Bariyer patladı — geri tepme ' + self, en: 'The barrier detonates — recoil ' + self }));
      }
    },
    {
      id: 'jam', cost: 7, cd: 2, dev: 'comms_module',
      name: { tr: 'İletişim moduyla parazit', en: 'Jam with the comms module' },
      desc: { tr: 'Yakın alan paraziti · düşmanın isabeti düşer',
              en: 'Near-field jamming · lowers the enemy\'s accuracy' },
      run(s) {
        s.e.accuracy = Math.max(0.4, s.e.accuracy - 0.3);
        QW.Audio.sfx('glitch');
        CB.log(QW.L({ tr: 'Parazit yayını açıldı. Hedef şaşırıyor.', en: 'Jamming field up. The target falters.' }));
      }
    },
    {
      id: 'plasma', cost: 10, cd: 2, weapon: true,
      name: { tr: 'Plazmayı aşırı ısıt', en: 'Overheat the plasma' },
      desc: { tr: 'Kesiciyi kırmızıya sür · ısı hasarı', en: 'Drive the cutter red hot · heat damage' },
      run(s) { CB.hit(s, 1.6, 'heat', false); }
    },
    {
      id: 'cryo', cost: 9, cd: 2, item: 'coolant',
      name: { tr: 'Soğutucu ampulü fırlat', en: 'Throw a coolant ampoule' },
      desc: { tr: 'Soğuk hasarı · bazı hedefleri kırılganlaştırır', en: 'Cold damage · makes some targets brittle' },
      run(s) {
        QW.Inventory.remove('coolant', 1, true);
        CB.hit(s, 1.5, 'cold', false);
        s.e.def = Math.max(0, s.e.def - 3);
      }
    },
    {
      id: 'acidbomb', cost: 8, cd: 2, item: 'acid_sac',
      name: { tr: 'Asit kesesi fırlat', en: 'Throw an acid sac' },
      desc: { tr: 'Zırhı aşındırır · sürekli hasar', en: 'Corrodes armour · damage over time' },
      run(s) {
        QW.Inventory.remove('acid_sac', 1, true);
        CB.hit(s, 1.1, 'acid', false);
        s.e.dot = 5; s.e.dotT = 3;
        s.e.def = Math.max(0, s.e.def - 2);
      }
    },
    {
      id: 'guard', cost: 4, cd: 0,
      name: { tr: 'Siper al', en: 'Take cover' },
      desc: { tr: 'Gelen hasar yarıya iner, enerji toplarsın', en: 'Halves incoming damage, recovers energy' },
      run(s) {
        s.p.guard = 1;
        s.p.energy = Math.min(ENERGY_MAX, s.p.energy + 10);
        QW.Audio.sfx('ui');
        CB.log(QW.t('cb_def_up', { name: QW.Player.name }));
      }
    }
  ];

  function weakName(w) {
    const M = {
      core:   { tr: 'ÇEKİRDEK', en: 'CORE' },
      joint:  { tr: 'EKLEM', en: 'JOINT' },
      shell:  { tr: 'KABUK', en: 'SHELL' },
      optics: { tr: 'OPTİK', en: 'OPTICS' },
      vent:   { tr: 'HAVALANDIRMA', en: 'VENT' }
    };
    return QW.L(M[w] || M.core);
  }
  CB.weakName = weakName;

  /* Taktiğin kullanılabilirliği */
  CB.tacticState = function (t) {
    const s = CB.s;
    if (!s) return { ok: false };
    if (s.p.energy < t.cost) return { ok: false, why: QW.t('cb_noenergy') };
    if (s.cooldown[t.id] > 0) return { ok: false, why: QW.t('cb_cooldown', { n: s.cooldown[t.id] }) };
    if (t.dev && !QW.Inventory.has(t.dev)) return { ok: false, why: QW.t('cb_need_dev', { name: QW.Items.name(t.dev) }) };
    if (t.item && !QW.Inventory.has(t.item)) return { ok: false, why: QW.t('cb_need_dev', { name: QW.Items.name(t.item) }) };
    if (t.veh) {
      const v = QW.Vehicles.get(t.veh);
      if (!v) return { ok: false, why: QW.t('cb_need_dev', { name: QW.L(QW.Vehicles.def(t.veh).name) }) };
      if (v.battery < (t.batt || 0)) return { ok: false, why: QW.t('veh_no_bat') };
    }
    return { ok: true };
  };

  CB.tactics = () => TACTICS;

  /* --------------------------------------------------------------------
   * HASAR HESABI
   * ------------------------------------------------------------------ */
  CB.hit = function (s, mult, element, ignoreDef) {
    const st = QW.Player.stats();
    const base = st.atk * mult;

    /* İsabet — stres, körlük ve düşmanın kaçınması etkiler */
    let acc = st.accuracy * (s.p.blind > 0 ? 0.65 : 1);
    if (s.e.evading > 0) acc *= 0.55;
    if (Math.random() > acc) {
      QW.Audio.sfx('back');
      CB.log(QW.t('cb_miss', { a: QW.Player.name }));
      return 0;
    }

    let dmg = base * (0.85 + Math.random() * 0.3);
    if (!ignoreDef) dmg -= s.e.def * 0.55;
    if (s.e.defending > 0) dmg *= 0.5;

    /* Element ilişkileri — direnç ve zafiyet düşman tanımından gelir */
    const m = s.e.meta;
    if (element && m.resist && m.resist[element]) dmg *= (1 - m.resist[element]);
    if (element && m.vuln && m.vuln[element]) dmg *= m.vuln[element];

    /* Radarla açığa çıkarılan zayıf nokta */
    if (s.e.exposed > 0) { dmg *= 1.6; CB.log(QW.t('cb_weak')); }

    /* Kritik */
    let crit = '';
    if (Math.random() < 0.12) { dmg *= 1.7; crit = QW.t('cb_crit'); QW.Audio.sfx('crit'); }
    else QW.Audio.sfx('hit');

    dmg = Math.max(1, Math.round(dmg));

    /* Düşmanın kalkanı önce erir */
    if (s.e.shield > 0) {
      const abs = Math.min(s.e.shield, dmg);
      s.e.shield -= abs; dmg -= abs;
      if (dmg <= 0) {
        CB.log(QW.L({ tr: 'Kalkan darbeyi yuttu.', en: 'The shield absorbed the blow.' }));
        return 0;
      }
    }

    s.e.hp = Math.max(0, s.e.hp - dmg);
    s.fx = { kind: 'hit', t: 0.35, n: dmg, crit: !!crit };
    CB.log(crit + QW.t('cb_hit', { a: QW.Player.name, b: s.e.name, n: dmg }));
    return dmg;
  };

  /* --------------------------------------------------------------------
   * OYUNCU HAMLESİ
   * ------------------------------------------------------------------ */
  CB.playerAttack = function () {
    const s = CB.s; if (!s || s.phase !== 'player') return;
    const wep = QW.Items.get(QW.Player.equip.weapon);
    const element = wep && wep.id === 'arc_lance' ? 'shock' : wep && wep.id === 'rail_pistol' ? 'shock' : 'heat';
    CB.hit(s, 1.0, element, false);
    CB.endPlayerTurn();
  };

  CB.playerTactic = function (id) {
    const s = CB.s; if (!s || s.phase !== 'player') return;
    const t = TACTICS.find(x => x.id === id);
    if (!t) return;
    const st = CB.tacticState(t);
    if (!st.ok) { QW.Audio.sfx('deny'); QW.HUD.toast(st.why, 'bad'); return; }
    s.p.energy -= t.cost;
    if (t.cd) s.cooldown[t.id] = t.cd + 1;
    t.run(s);
    CB.endPlayerTurn();
  };

  CB.playerItem = function (itemId) {
    const s = CB.s; if (!s || s.phase !== 'player') return;
    if (!QW.Inventory.use(itemId)) { QW.Audio.sfx('deny'); return; }
    CB.log(QW.Items.name(itemId));
    CB.endPlayerTurn();
  };

  CB.playerFlee = function () {
    const s = CB.s; if (!s || s.phase !== 'player') return;
    if (s.boss) {
      QW.Audio.sfx('deny');
      CB.log(QW.L({ tr: 'Bölge hâkiminden kaçılmaz.', en: 'There is no fleeing a warden.' }));
      return;
    }
    const chance = 0.45 + QW.Player.stats().spd * 0.1 - s.e.meta.spd * 0.02;
    if (Math.random() < chance) {
      s.phase = 'over'; s.over = 'fled';
      CB.log(QW.t('cb_fled'));
      QW.Audio.sfx('back');
    } else {
      CB.log(QW.t('cb_nofled'));
      CB.endPlayerTurn();
    }
  };

  CB.endPlayerTurn = function () {
    const s = CB.s;
    if (s.e.hp <= 0) { s.phase = 'over'; s.over = 'win'; return; }
    s.phase = 'enemy';
  };

  /* --------------------------------------------------------------------
   * DÜŞMAN HAMLESİ
   * ------------------------------------------------------------------ */
  CB.enemyTurn = function () {
    const s = CB.s;
    if (!s || s.phase !== 'enemy') return;

    /* Süreli etkiler */
    if (s.e.dotT > 0) {
      s.e.dotT--; s.e.hp = Math.max(0, s.e.hp - s.e.dot);
      CB.log(QW.t('cb_burn', { name: s.e.name, n: s.e.dot }));
      if (s.e.hp <= 0) { s.phase = 'over'; s.over = 'win'; return; }
    }
    s.e.defending = Math.max(0, s.e.defending - 1);
    s.e.evading = Math.max(0, s.e.evading - 1);
    s.e.exposed = Math.max(0, s.e.exposed - 1);

    if (s.e.stun > 0) {
      s.e.stun--;
      CB.log(QW.t('cb_stun', { name: s.e.name }));
      CB.startPlayerTurn();
      return;
    }

    const moves = s.e.meta.moves || [{ id: 'hit', w: 1, dmg: 1 }];
    let total = 0; moves.forEach(m => { total += m.w; });
    let r = Math.random() * total, mv = moves[0];
    for (const m of moves) { r -= m.w; if (r <= 0) { mv = m; break; } }

    const pst = QW.Player.stats();
    switch (mv.kind) {
      case 'defend': s.e.defending = 2; CB.log(QW.t('cb_def_up', { name: s.e.name })); break;
      case 'evade':  s.e.evading = 2;  CB.log(QW.L({ tr: s.e.name + ' gözden kayboldu.', en: s.e.name + ' vanishes from sight.' })); break;
      case 'shield': s.e.shield += Math.round(s.e.hpMax * 0.12); CB.log(QW.t('cb_shielded', { name: s.e.name })); break;
      case 'buff':   s.e.atk = Math.round(s.e.atk * 1.2); CB.log(QW.L({ tr: s.e.name + ' güçleniyor!', en: s.e.name + ' grows stronger!' })); break;
      case 'heal':   s.e.hp = Math.min(s.e.hpMax, s.e.hp + Math.round(s.e.hpMax * 0.1)); CB.log(QW.L({ tr: s.e.name + ' yenileniyor.', en: s.e.name + ' regenerates.' })); break;
      default: {
        if (Math.random() > s.e.accuracy) { CB.log(QW.t('cb_miss', { a: s.e.name })); break; }
        let dmg = s.e.atk * (mv.dmg || 1) * (0.85 + Math.random() * 0.3);
        dmg -= pst.def * 0.5;
        if (s.p.guard) dmg *= 0.5;
        if (s.p.shield > 0) { const abs = Math.min(s.p.shield, dmg); s.p.shield -= abs; dmg -= abs; }
        dmg = Math.max(1, Math.round(dmg));
        const el = mv.kind === 'acid' ? 'acid' : mv.kind === 'freeze' ? 'cold' : null;
        QW.Player.damage(dmg, el);
        QW.Audio.sfx('hurt');
        s.fx = { kind: 'phit', t: 0.3, n: dmg };
        CB.log(QW.t('cb_hit', { a: s.e.name, b: QW.Player.name, n: dmg }));
        if (mv.kind === 'poison') { s.p.poison = 3; CB.log(QW.L({ tr: 'Zehirlendin.', en: 'You are poisoned.' })); }
        if (mv.kind === 'stun' && Math.random() < 0.4) { s.p.stun = 1; }
        if (mv.kind === 'freeze' && Math.random() < 0.35) { s.p.stun = 1; }
        if (mv.kind === 'blind') { s.p.blind = 2; }
        if (mv.kind === 'stress') { QW.Player.addStress(10); CB.log(QW.t('stress_high')); }
        if (mv.kind === 'drain') { s.e.hp = Math.min(s.e.hpMax, s.e.hp + Math.round(dmg * 0.4)); }
      }
    }

    if (QW.Player.hp <= 0) { s.phase = 'over'; s.over = 'lose'; return; }
    CB.startPlayerTurn();
  };

  CB.startPlayerTurn = function () {
    const s = CB.s;
    s.turn++;
    s.p.guard = 0;
    s.p.energy = Math.min(ENERGY_MAX, s.p.energy + ENERGY_REGEN);
    s.p.blind = Math.max(0, s.p.blind - 1);
    s.p.distract = Math.max(0, s.p.distract - 1);
    Object.keys(s.cooldown).forEach(k => { s.cooldown[k] = Math.max(0, s.cooldown[k] - 1); });

    if (s.p.poison > 0) {
      s.p.poison--;
      const d = Math.round(QW.Player.hpMax * 0.03);
      QW.Player.damage(d, 'acid');
      CB.log(QW.t('cb_burn', { name: QW.Player.name, n: d }));
      if (QW.Player.hp <= 0) { s.phase = 'over'; s.over = 'lose'; return; }
    }
    if (s.p.stun > 0) {
      s.p.stun--;
      CB.log(QW.t('cb_stun', { name: QW.Player.name }));
      s.phase = 'enemy';
      return;
    }
    s.phase = 'player';
  };

  /* --------------------------------------------------------------------
   * SONUÇ
   * ------------------------------------------------------------------ */
  CB.resolve = function () {
    const s = CB.s;
    if (!s) return null;
    const res = { outcome: s.over, xp: 0, ec: 0, loot: [], fragment: false };
    if (s.over === 'win') {
      const m = s.e.meta;
      res.xp = m.xp; res.ec = m.ec;
      QW.Player.addXP(m.xp);
      QW.Player.addCredits(m.ec);
      (m.drop || []).forEach(d => {
        if (Math.random() <= d.p) {
          const n = d.n;
          QW.Inventory.add(d.id, n, true);
          res.loot.push(QW.Items.name(d.id) + ' x' + n);
          if (d.id === 'core_fragment') res.fragment = true;
        }
      });
      QW.bus.emit('enemy_killed', m.id);
      if (s.boss) QW.bus.emit('boss_killed', m.id);
    }
    return res;
  };

  CB.end = function () { CB.s = null; };

})(window.QW);
