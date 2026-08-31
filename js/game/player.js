/* =========================================================================
 * QW.Player — karakter durumu, hareket, statlar, kuşam etkileri
 * Kıyafet seçimleri doğrudan dayanıklılık (stamina) ve yenilenmeyi belirler.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils, Wd = QW.World;

  const Pl = QW.Player = {
    name: 'ARGOS-7',
    x: 0, y: 0, dir: 'down', frame: 0, moving: false,
    level: 1, xp: 0, xpNext: 40,
    hp: 100, hpMax: 100,
    o2: 100, o2Max: 100,
    sta: 100, staMax: 100,
    stress: 0, stressMax: 100,
    credits: 60,
    rad: 0, cold: 0,
    look: { skin: '#e0ac7e', hair: '#3a2a1e', shirt: '#e0e4ea', boots: '#a06a3a', suit: '#c9d4e4', visor: '#4df2c8' },
    equip: { suit: 'suit_basic', shirt: null, boots: null, weapon: 'cutter' },
    _walkT: 0, _stepT: 0, _hazT: 0, _regenT: 0, invuln: 0
  };

  /* ---------------------------------------------------------------
   * TÜRETİLMİŞ STATLAR
   * ------------------------------------------------------------- */
  function equipList() {
    return ['suit', 'shirt', 'boots', 'weapon']
      .map(s => QW.Items.get(Pl.equip[s]))
      .filter(Boolean);
  }

  Pl.stats = function () {
    const s = {
      atk: 4 + Pl.level * 2, def: 1 + Math.floor(Pl.level * 0.6), spd: 1,
      staBonus: 0, regen: 1, heat: 0, o2Bonus: 0,
      resist: { acid: 0, cold: 0, rad: 0, heat: 0, shock: 0 }
    };
    equipList().forEach(it => {
      if (it.atk) s.atk += it.atk;
      if (it.def) s.def += it.def;
      if (it.sta) s.staBonus += it.sta;
      if (it.spd) s.spd += it.spd;
      if (it.regen) s.regen += it.regen;
      if (it.heat) s.heat += it.heat;
      if (it.o2) s.o2Bonus += it.o2;
      if (it.resist) Object.keys(it.resist).forEach(k => { s.resist[k] = Math.min(0.9, (s.resist[k] || 0) + it.resist[k]); });
    });
    /* Stres isabeti ve hızı düşürür */
    const st = Pl.stress / Pl.stressMax;
    s.accuracy = U.clamp(1 - st * 0.35, 0.6, 1);
    s.spd *= U.clamp(1 - st * 0.18, 0.75, 1);
    /* Dayanıklılık bittiğinde yavaşlarsın */
    if (Pl.sta <= 0) s.spd *= 0.55;
    /* Aşırı yük hızı düşürür (yasak değil, cezalı) */
    if (QW.Inventory.overloaded()) {
      const over = QW.Inventory.weight() / QW.Inventory.capacity;
      s.spd *= U.clamp(1 - (over - 1) * 0.6, 0.5, 1);
    }
    return s;
  };

  Pl.staMaxTotal = () => Pl.staMax + Pl.stats().staBonus;
  Pl.o2MaxTotal = () => Pl.o2Max + Pl.stats().o2Bonus;
  Pl.tilePos = () => ({ tx: Math.floor(Pl.x / Wd.TILE), ty: Math.floor(Pl.y / Wd.TILE) });

  /* ---------------------------------------------------------------
   * BAŞLANGIÇ
   * ------------------------------------------------------------- */
  Pl.reset = function (look, name) {
    Pl.look = Object.assign({}, Pl.look, look || {});
    if (name) Pl.name = name;
    Pl.level = 1; Pl.xp = 0; Pl.xpNext = 40;
    Pl.hpMax = 100; Pl.hp = 100;
    Pl.o2Max = 100; Pl.o2 = 100;
    Pl.staMax = 100; Pl.sta = 100;
    Pl.stress = 0; Pl.credits = 60;
    Pl.rad = 0; Pl.cold = 0;
    Pl.equip = { suit: 'suit_basic', shirt: null, boots: null, weapon: 'cutter' };
    Pl.x = Wd.spawn.x * Wd.TILE + 8;
    Pl.y = Wd.spawn.y * Wd.TILE + 8;
    Pl.dir = 'down'; Pl.frame = 0;
  };

  /* Kıyafet seçimi karakter renklerini ve kuşanılı eşyayı birlikte belirler */
  Pl.applyCreator = function (cfg) {
    Pl.look.skin = cfg.skin; Pl.look.hair = cfg.hair;
    Pl.look.shirt = cfg.shirtColor; Pl.look.boots = cfg.bootColor;
    Pl.look.visor = cfg.visor;
    Pl.name = cfg.name || Pl.name;
    QW.Inventory.add(cfg.shirtItem, 1, true);
    QW.Inventory.add(cfg.bootItem, 1, true);
    Pl.equip.shirt = cfg.shirtItem;
    Pl.equip.boots = cfg.bootItem;
    Pl.sta = Pl.staMaxTotal();
  };

  /* ---------------------------------------------------------------
   * HAREKET
   * ------------------------------------------------------------- */
  const BASE_SPEED = 52;   // piksel / saniye

  Pl.move = function (dt, ax, ay, caps) {
    const st = Pl.stats();
    const t = Pl.tilePos();
    const terr = Wd.terrainAt(t.tx, t.ty, caps);
    let speed = BASE_SPEED * st.spd * terr.spd * (caps.speed || 1);

    /* Koşu (B tuşu) dayanıklılık harcar */
    if (caps.run && Pl.sta > 0 && (ax || ay)) {
      speed *= 1.45;
      Pl.sta = Math.max(0, Pl.sta - dt * 14);
    }

    const dx = ax * speed * dt, dy = ay * speed * dt;
    Pl.moving = !!(ax || ay);

    if (dx) tryMove(dx, 0, caps);
    if (dy) tryMove(0, dy, caps);

    if (Pl.moving) {
      Pl._walkT += dt * (speed / 40);
      Pl.frame = 1 + (Math.floor(Pl._walkT * 3) % 2);
      Pl._stepT += dt;
      if (Pl._stepT > 0.34) { Pl._stepT = 0; QW.Audio.sfx('step'); }
      if (Math.abs(ax) > Math.abs(ay)) Pl.dir = ax < 0 ? 'left' : 'right';
      else Pl.dir = ay < 0 ? 'up' : 'down';
    } else { Pl.frame = 0; Pl._walkT = 0; }
  };

  function tryMove(dx, dy, caps) {
    const nx = Pl.x + dx, ny = Pl.y + dy;
    /* Ayak hizasında 6 piksellik çarpışma kutusu */
    const pts = [[nx - 4, ny + 2], [nx + 4, ny + 2], [nx - 4, ny + 7], [nx + 4, ny + 7]];
    for (const [px, py] of pts) {
      const tx = Math.floor(px / Wd.TILE), ty = Math.floor(py / Wd.TILE);
      if (!Wd.canWalk(tx, ty, caps)) {
        blockedFeedback(tx, ty, caps);
        return;
      }
    }
    Pl.x = nx; Pl.y = ny;
  }

  let lastBlockMsg = 0;
  function blockedFeedback(tx, ty, caps) {
    const now = performance.now();
    if (now - lastBlockMsg < 1600) return;
    lastBlockMsg = now;
    const b = Wd.biomeAt(tx, ty);
    if (b.t === Wd.T.WATER) QW.HUD.toast(QW.t('block_water'), 'info');
    else if (b.t === Wd.T.CHASM) QW.HUD.toast(QW.t('block_chasm') + ' — ' + QW.t('need_drone'), 'bad');
    else if (b.t === Wd.T.ROCK) QW.HUD.toast(QW.t('block_cliff'), 'info');
  }

  /* ---------------------------------------------------------------
   * ZAMANA BAĞLI DURUM
   * ------------------------------------------------------------- */
  Pl.tick = function (dt, caps) {
    const st = Pl.stats();
    const t = Pl.tilePos();
    const terr = Wd.terrainAt(t.tx, t.ty, caps);
    const wx = QW.Weather.current;

    if (Pl.invuln > 0) Pl.invuln -= dt;

    /* Oksijen: hareket ve fırtına tüketir, dinlenince yavaş dolar */
    const o2Rate = (Pl.moving ? 0.55 : 0.2) * (wx.o2Drain || 1);
    Pl.o2 = U.clamp(Pl.o2 - o2Rate * dt, 0, Pl.o2MaxTotal());
    if (Pl.o2 <= 0) Pl.damage(dt * 5, 'asphyx');

    /* Dayanıklılık — Dri-Fit gibi nefes alan kumaşlar yenilenmeyi hızlandırır */
    if (!caps.run) {
      Pl._regenT += dt;
      const rate = (Pl.moving ? 2.5 : 7) * st.regen;
      Pl.sta = U.clamp(Pl.sta + rate * dt, 0, Pl.staMaxTotal());
    }

    /* Stres: gece, düşük can, fırtına ve düşük oksijen artırır */
    let stressRate = 0.25;
    if (Wd.isNight()) stressRate += 0.5;
    if (Pl.hp < Pl.hpMax * 0.3) stressRate += 0.8;
    if (Pl.o2 < 25) stressRate += 0.8;
    if (wx.id !== 'clear') stressRate += 0.6;
    if (caps.inCamp) stressRate = -3;
    Pl.stress = U.clamp(Pl.stress + stressRate * dt, 0, Pl.stressMax);

    /* Zemin ve hava tehlikeleri */
    Pl._hazT += dt;
    if (Pl._hazT >= 1) {
      Pl._hazT = 0;
      if (terr.hazard === 'acid' && !caps.allTerrain) {
        const dmg = 4 * (1 - (st.resist.acid || 0));
        if (dmg > 0.5) { Pl.damage(dmg, 'acid'); QW.HUD.toast(QW.t('swamp_warn'), 'bad'); }
      }
      if (terr.hazard === 'cold') {
        const c = 1.6 * (1 - (st.resist.cold || 0)) * (1 - st.heat * 0.5);
        Pl.cold = U.clamp(Pl.cold + Math.max(0, c), 0, 100);
      } else Pl.cold = U.clamp(Pl.cold - 3, 0, 100);
      if (Pl.cold > 70) Pl.damage(2.5, 'cold');

      /* Hava olayının doğrudan etkisi */
      const wdmg = QW.Weather.damagePerSecond(st);
      if (wdmg > 0) Pl.damage(wdmg, QW.Weather.current.dmgType || 'rad');
      if (QW.Weather.current.id === 'rad') Pl.rad = U.clamp(Pl.rad + 1.2 * (1 - (st.resist.rad || 0)), 0, 100);
      else Pl.rad = U.clamp(Pl.rad - 0.4, 0, 100);
      if (Pl.rad > 75) Pl.damage(2, 'rad');
    }

    /* Keşif kaydı */
    Wd.discover(t.tx, t.ty, caps.scan ? 14 : 8);
  };

  /* ---------------------------------------------------------------
   * HASAR / İYİLEŞME / SEVİYE
   * ------------------------------------------------------------- */
  Pl.damage = function (n, type) {
    if (n <= 0) return 0;
    const st = Pl.stats();
    let d = n;
    if (type && st.resist[type]) d *= (1 - st.resist[type]);
    d = Math.max(0.2, d);
    Pl.hp -= d;
    if (Pl.hp <= 0) { Pl.hp = 0; QW.bus.emit('player_down'); }
    return d;
  };

  Pl.heal = function (n) { Pl.hp = U.clamp(Pl.hp + n, 0, Pl.hpMax); };
  Pl.addO2 = function (n) { Pl.o2 = U.clamp(Pl.o2 + n, 0, Pl.o2MaxTotal()); };
  Pl.addSta = function (n) { Pl.sta = U.clamp(Pl.sta + n, 0, Pl.staMaxTotal()); };
  Pl.addStress = function (n) { Pl.stress = U.clamp(Pl.stress + n, 0, Pl.stressMax); };
  Pl.addCredits = function (n) { Pl.credits = Math.max(0, Pl.credits + n); };

  Pl.addXP = function (n) {
    Pl.xp += n;
    while (Pl.xp >= Pl.xpNext) {
      Pl.xp -= Pl.xpNext;
      Pl.level++;
      Pl.xpNext = Math.floor(40 * Math.pow(1.35, Pl.level - 1));
      Pl.hpMax += 12; Pl.hp = Pl.hpMax;
      Pl.staMax += 6; Pl.o2Max += 4;
      QW.Audio.sfx('levelup');
      QW.HUD.toast(QW.t('cb_lvlup', { n: Pl.level }), 'good');
    }
  };

  /* Ölüm — enkazda uyanır, hammaddenin bir kısmını kaybeder */
  Pl.respawn = function () {
    Pl.hp = Pl.hpMax * 0.6;
    Pl.o2 = Pl.o2MaxTotal() * 0.7;
    Pl.sta = Pl.staMaxTotal() * 0.5;
    Pl.stress = Math.min(Pl.stressMax, Pl.stress + 25);
    Pl.rad = 0; Pl.cold = 0;
    Pl.x = Wd.spawn.x * Wd.TILE + 8;
    Pl.y = Wd.spawn.y * Wd.TILE + 8;
    QW.Inventory.loseRandom(0.25);
  };

  /* ---------------------------------------------------------------
   * ÇİZİM
   * ------------------------------------------------------------- */
  Pl.draw = function (ctx, sx, sy) {
    /* Gölge */
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect((sx + 3) | 0, (sy + 15) | 0, 6, 2);
    QW.Sprites.player(ctx, sx, sy, Pl.look, Pl.dir, Pl.frame);
    if (Pl.invuln > 0 && Math.floor(Pl.invuln * 10) % 2 === 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,80,110,0.5)';
      ctx.fillRect(sx | 0, sy | 0, 12, 16);
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  /* ---------------------------------------------------------------
   * KAYIT
   * ------------------------------------------------------------- */
  Pl.serialize = function () {
    return {
      name: Pl.name, x: Pl.x, y: Pl.y, dir: Pl.dir,
      level: Pl.level, xp: Pl.xp, xpNext: Pl.xpNext,
      hp: Pl.hp, hpMax: Pl.hpMax, o2: Pl.o2, o2Max: Pl.o2Max,
      sta: Pl.sta, staMax: Pl.staMax, stress: Pl.stress,
      credits: Pl.credits, rad: Pl.rad, cold: Pl.cold,
      look: Pl.look, equip: Pl.equip
    };
  };
  Pl.load = function (d) {
    Object.assign(Pl, {
      name: d.name, x: d.x, y: d.y, dir: d.dir || 'down',
      level: d.level, xp: d.xp, xpNext: d.xpNext,
      hp: d.hp, hpMax: d.hpMax, o2: d.o2, o2Max: d.o2Max,
      sta: d.sta, staMax: d.staMax, stress: d.stress,
      credits: d.credits, rad: d.rad || 0, cold: d.cold || 0
    });
    Pl.look = Object.assign({}, Pl.look, d.look || {});
    Pl.equip = Object.assign({ suit: 'suit_basic', shirt: null, boots: null, weapon: 'cutter' }, d.equip || {});
  };

})(window.QW);
