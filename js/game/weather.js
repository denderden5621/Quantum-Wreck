/* =========================================================================
 * QW.Weather — dinamik hava sistemi ve sensör tahmini
 * Hava kalitesi sensörü olmadan fırtına habersiz gelir.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils;

  const TYPES = {
    clear: { id: 'clear', name: 'w_clear', dmg: 0, o2Drain: 1, tint: null, particles: null },
    rad:   { id: 'rad', name: 'w_rad', dmg: 2.2, dmgType: 'rad', o2Drain: 1.3,
             tint: 'rgba(190,220,80,0.16)', particles: 'rad', sfx: 'alarm' },
    acid:  { id: 'acid', name: 'w_acid', dmg: 1.8, dmgType: 'acid', o2Drain: 1.15,
             tint: 'rgba(120,200,60,0.14)', particles: 'rain', sfx: 'rain' },
    bliz:  { id: 'bliz', name: 'w_bliz', dmg: 1.4, dmgType: 'cold', o2Drain: 1.25,
             tint: 'rgba(200,225,245,0.20)', particles: 'snow', sfx: 'wind' },
    sand:  { id: 'sand', name: 'w_sand', dmg: 1.0, dmgType: 'heat', o2Drain: 1.5,
             tint: 'rgba(215,180,110,0.22)', particles: 'sand', sfx: 'wind' },
    spore: { id: 'spore', name: 'w_spore', dmg: 1.2, dmgType: 'acid', o2Drain: 1.4,
             tint: 'rgba(180,110,220,0.16)', particles: 'spore', sfx: 'wind' }
  };

  /* Biyoma göre olası hava olayları */
  const BY_BIOME = {
    desert: ['sand', 'rad'], glacier: ['bliz', 'rad'], swamp: ['acid', 'spore'],
    forest: ['spore', 'acid'], canyon: ['sand', 'rad'], plains: ['rad', 'acid'],
    mountain: ['bliz', 'sand'], shore: ['acid', 'rad'], wreck: ['rad'], sea: ['acid'], chasm: ['sand']
  };

  const Wt = QW.Weather = {
    current: TYPES.clear,
    timer: 90,        // sonraki değişime kalan saniye
    duration: 0,
    incoming: null,   // { type, in }
    parts: []
  };

  Wt.reset = function () {
    Wt.current = TYPES.clear;
    Wt.timer = 120 + Math.random() * 90;
    Wt.duration = 0; Wt.incoming = null; Wt.parts = [];
  };

  Wt.tick = function (dt, biomeKey, sheltered) {
    Wt.timer -= dt;
    /* Fırtınada açıkta geçirilen süre */
    if (Wt.current.id !== 'clear' && !sheltered) Wt._outdoor = (Wt._outdoor || 0) + dt;

    /* Sensör: fırtına başlamadan önce uyarı */
    if (Wt.current.id === 'clear' && Wt.timer < 25 && !Wt.incoming) {
      const pool = BY_BIOME[biomeKey] || ['rad'];
      const t = TYPES[U.pick(pool)];
      Wt.incoming = { type: t, at: Wt.timer };
      if (QW.Crafting.hasPassive('forecast')) {
        QW.HUD.toast(QW.t('w_incoming', { w: QW.t(t.name), n: Math.max(1, Math.round(Wt.timer / 6)) }), 'info');
        QW.Audio.sfx('beep');
      }
    }

    if (Wt.timer <= 0) {
      if (Wt.current.id === 'clear') {
        const t = (Wt.incoming && Wt.incoming.type) || TYPES[U.pick(BY_BIOME[biomeKey] || ['rad'])];
        Wt.set(t.id);
        Wt.timer = 45 + Math.random() * 60;
      } else {
        /* Fırtınayı dışarıda, canını kaybetmeden atlattıysa görev tamam */
        if (Wt._outdoor > 25 && QW.Player.hp > 0) QW.Game.setFlag('storm_survived', true);
        Wt.set('clear');
        Wt.timer = 110 + Math.random() * 120;
        QW.HUD.toast(QW.t('w_ended'), 'good');
      }
      Wt.incoming = null;
    }

    Wt.stepParticles(dt);
  };

  Wt.set = function (id) {
    const t = TYPES[id] || TYPES.clear;
    Wt.current = t;
    Wt._outdoor = 0;
    Wt.parts = [];
    if (id !== 'clear') {
      QW.HUD.toast(QW.t('w_started', { w: QW.t(t.name) }), 'bad');
      if (t.sfx) QW.Audio.sfx(t.sfx);
      QW.Game.codexUnlock('c_weather');
      /* Şiddetli hava cihazları zorlar — arıza tespiti döngüsünü besler */
      QW.Crafting.stormStress();
      const n = 90;
      for (let i = 0; i < n; i++) Wt.parts.push(newPart());
    }
  };

  function newPart() {
    const S = QW.Pixel.Screen;
    return { x: Math.random() * S.w, y: Math.random() * S.h, v: 0.5 + Math.random() * 1.5, p: Math.random() };
  }

  Wt.stepParticles = function (dt) {
    if (!Wt.current.particles) return;
    const S = QW.Pixel.Screen;
    const kind = Wt.current.particles;
    for (const p of Wt.parts) {
      switch (kind) {
        case 'rain': p.y += 260 * p.v * dt; p.x += 40 * dt; break;
        case 'snow': p.y += 50 * p.v * dt; p.x += Math.sin((p.y + p.p * 40) * 0.05) * 24 * dt; break;
        case 'sand': p.x += 300 * p.v * dt; p.y += Math.sin(p.x * 0.03) * 12 * dt; break;
        case 'spore': p.y -= 24 * p.v * dt; p.x += Math.sin(p.y * 0.04 + p.p * 6) * 18 * dt; break;
        case 'rad': p.y += 90 * p.v * dt; p.x += Math.sin(p.y * 0.1) * 30 * dt; break;
      }
      if (p.y > S.h + 4) { p.y = -4; p.x = Math.random() * S.w; }
      if (p.y < -4) { p.y = S.h + 4; p.x = Math.random() * S.w; }
      if (p.x > S.w + 4) { p.x = -4; p.y = Math.random() * S.h; }
    }
  };

  Wt.draw = function (ctx) {
    const w = Wt.current;
    if (!w.tint) return;
    const S = QW.Pixel.Screen;
    ctx.fillStyle = w.tint;
    ctx.fillRect(0, 0, S.w, S.h);
    const kind = w.particles;
    const col = kind === 'snow' ? '#ffffff' : kind === 'sand' ? '#e6cf95'
              : kind === 'spore' ? '#d8a8ff' : kind === 'rad' ? '#d8e06a' : '#a8e07a';
    ctx.fillStyle = col;
    for (const p of Wt.parts) {
      const x = p.x | 0, y = p.y | 0;
      if (kind === 'rain') ctx.fillRect(x, y, 1, 3);
      else if (kind === 'sand') ctx.fillRect(x, y, 3, 1);
      else ctx.fillRect(x, y, 1, 1);
    }
  };

  /* Kuşam ve barınak hasarı azaltır */
  Wt.damagePerSecond = function (stats) {
    const w = Wt.current;
    if (!w.dmg) return 0;
    const r = (stats.resist && stats.resist[w.dmgType]) || 0;
    const d = w.dmg * (1 - r);
    return d < 0.4 ? 0 : d;
  };

  Wt.isSevere = () => Wt.current.id !== 'clear';

  Wt.serialize = () => ({ id: Wt.current.id, timer: Wt.timer });
  Wt.load = function (d) {
    Wt.reset();
    if (d) { Wt.set(d.id || 'clear'); Wt.timer = d.timer || 90; }
  };

  Wt.TYPES = TYPES;

})(window.QW);
