/* =========================================================================
 * Sahne: BATTLE — sıra tabanlı savaş ekranı
 * Mobil için büyük butonlar; taktikler craft edilen donanıma bağlıdır.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const P = QW.Pixel, U = QW.Utils;

  let el = {}, menu = 'root', anim = 0, entity = null;
  let bgStars = [], resolved = false, endTimer = 0, storyOutcome = null;

  /* Savaş girişi: JRPG usulü geçiş animasyonu + fanfar.
     intro fazı boyunca oynanış kilitli, düşman sahneye "iner". */
  const INTRO_LEN = 1.5;
  let introT = 0, introDone = true, introShards = [];

  /* ------------------------------------------------------------------
   * JUICE — "polish that artificially enhances interaction without
   * changing the underlying simulation" (Swink). Hiçbiri hasar hesabına
   * dokunmaz; yalnızca vuruşun hissedilmesini sağlar.
   * ---------------------------------------------------------------- */
  const FX = {
    stop: 0,        // hit-stop: darbe anında birkaç kare donma
    shake: 0,       // ekran sarsıntısı (şiddet)
    shakeT: 0,
    flashE: 0,      // düşman beyaz flaş
    flashP: 0,      // oyuncu kırmızı flaş
    knock: 0,       // düşman geri savrulması
    parts: [],      // çarpma partikülleri
    scars: []       // kalıcılık: zeminde kalan izler
  };

  function resetFX() {
    FX.stop = 0; FX.shake = 0; FX.shakeT = 0;
    FX.flashE = 0; FX.flashP = 0; FX.knock = 0;
    FX.parts.length = 0; FX.scars.length = 0;
  }

  /* Darbe anı: donma + sarsıntı + partikül + geri savrulma birlikte gelir */
  function impact(x, y, power, col) {
    FX.stop = Math.min(0.13, 0.05 + power * 0.05);
    FX.shake = 2 + power * 4;
    FX.shakeT = 0.28;
    FX.knock = 4 + power * 5;
    const n = 8 + Math.floor(power * 14);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 30 + Math.random() * 110 * (0.5 + power);
      FX.parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        life: 0.35 + Math.random() * 0.45, max: 0.8,
        s: Math.random() < 0.3 ? 2 : 1,
        c: col || (Math.random() < 0.5 ? '#ffd166' : '#ffffff')
      });
    }
  }

  function stepFX(dt) {
    if (FX.stop > 0) { FX.stop -= dt; return true; }   // donma sırasında dünya durur
    FX.shakeT = Math.max(0, FX.shakeT - dt);
    if (FX.shakeT <= 0) FX.shake = 0;
    FX.flashE = Math.max(0, FX.flashE - dt * 4);
    FX.flashP = Math.max(0, FX.flashP - dt * 4);
    FX.knock *= Math.pow(0.02, dt);                     // yumuşak geri dönüş
    for (let i = FX.parts.length - 1; i >= 0; i--) {
      const p = FX.parts[i];
      p.life -= dt;
      if (p.life <= 0) { FX.parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 260 * dt;                                  // yerçekimi
      p.vx *= Math.pow(0.25, dt);
    }
    return false;
  }

  function shakeOffset() {
    if (FX.shake <= 0) return { x: 0, y: 0 };
    const k = FX.shakeT / 0.28;
    const m = FX.shake * k;
    return { x: Math.round((Math.random() - 0.5) * m * 2), y: Math.round((Math.random() - 0.5) * m) };
  }

  const tap = QW.Utils.tap;

  function cbtn(label, sub, fn, dis, cls) {
    const b = document.createElement('button');
    b.className = 'cbtn ' + (dis ? 'dis ' : '') + (cls || '');
    b.appendChild(document.createTextNode(label));
    if (sub) { const s = document.createElement('small'); s.textContent = sub; b.appendChild(s); }
    tap(b, () => {
      if (dis) { QW.Audio.sfx('deny'); if (sub) QW.HUD.toast(sub, 'bad'); return; }
      QW.Audio.sfx('ui'); fn();
    });
    return b;
  }

  const Battle = {
    enter(data) {
      entity = data.entity;
      resolved = false; endTimer = 0; menu = 'root'; anim = 0; storyOutcome = null;
      resetFX();
      QW.HUD.show(false);
      QW.Input.showTouch(false);
      el.ui = document.getElementById('combat-ui');
      el.ui.classList.remove('hidden');
      el.top = document.querySelector('#combat-top .cbar.enemy');
      el.eName = el.top.querySelector('.cname');
      el.eFill = el.top.querySelector('i');
      el.log = document.getElementById('combat-log');
      el.actions = document.getElementById('combat-actions');
      el.selfHp = document.querySelector('#combat-self .hp i');
      el.selfEp = document.querySelector('#combat-self .ep i');

      bgStars = [];
      for (let i = 0; i < 40; i++) bgStars.push({ x: Math.random(), y: Math.random(), s: Math.random() });

      /* --- giriş animasyonu: bantlar kayar, fanfar çalar, oynanış kilitli --- */
      introT = 0; introDone = false;
      introShards = [];
      for (let i = 0; i < 14; i++) {
        introShards.push({
          y: (i / 14), h: 1 / 14,
          dir: i % 2 ? 1 : -1,
          off: 1, sp: 0.9 + Math.random() * 0.8
        });
      }
      el.actions.innerHTML = '';
      el.log.innerHTML = '';
      QW.Audio.stinger(data.boss ? 'boss' : 'battle');
      QW.HUD.shake();

      QW.Combat.begin(entity, { silent: true });   // satırlar bus üzerinden düşer
      Battle.refresh();
    },

    exit() {
      el.ui.classList.add('hidden');
      QW.Combat.end();
      QW.Audio.fadeMusicTo(QW.World.isNight() ? 'night' : 'overworld');
    },

    /* ---------------------------------------------------------------- */
    buildActions() {
      const s = QW.Combat.s;
      el.actions.innerHTML = '';
      if (!s || s.phase === 'over') return;
      if (s.phase !== 'player') return;

      if (menu === 'root') {
        const wep = QW.Items.get(QW.Player.equip.weapon);
        el.actions.appendChild(cbtn(QW.t('cb_attack'), wep ? QW.Items.name(wep.id) : '', () => {
          QW.Combat.playerAttack(); Battle.afterAction();
        }));
        el.actions.appendChild(cbtn(QW.t('cb_tactic'), QW.t('st_energy') + ' ' + s.p.energy, () => {
          menu = 'tactic'; Battle.buildActions();
        }));
        el.actions.appendChild(cbtn(QW.t('cb_item'), '', () => { menu = 'item'; Battle.buildActions(); }));
        el.actions.appendChild(cbtn(QW.t('cb_flee'), s.boss ? QW.t('cb_boss') : '', () => {
          QW.Combat.playerFlee(); Battle.afterAction();
        }, false, 'back'));
        return;
      }

      if (menu === 'tactic') {
        QW.Combat.tactics().forEach(t => {
          const st = QW.Combat.tacticState(t);
          const syn = QW.Synergies.forTactic(t.id);
          const tag = syn.length ? '  ◆ ' + syn.map(x => QW.L(x.name)).join(', ') : '';
          el.actions.appendChild(cbtn(
            QW.L(t.name) + tag,
            st.ok ? (QW.L(t.desc) + ' · ' + t.cost + ' EN') : st.why,
            () => { QW.Combat.playerTactic(t.id); Battle.afterAction(); },
            !st.ok,
            syn.length ? 'syn' : ''
          ));
        });
        el.actions.appendChild(cbtn(QW.t('back'), '', () => { menu = 'root'; Battle.buildActions(); }, false, 'back'));
        return;
      }

      if (menu === 'item') {
        const list = QW.Inventory.battleItems();
        if (!list.length) el.actions.appendChild(cbtn(QW.t('inv_empty'), '', () => {}, true));
        list.forEach(id => {
          el.actions.appendChild(cbtn(QW.Items.name(id), 'x' + QW.Inventory.count(id), () => {
            QW.Combat.playerItem(id); Battle.afterAction();
          }));
        });
        el.actions.appendChild(cbtn(QW.t('back'), '', () => { menu = 'root'; Battle.buildActions(); }, false, 'back'));
      }
    },

    afterAction() {
      menu = 'root';
      Battle.refresh();
      const s = QW.Combat.s;
      if (!s) return;
      if (s.phase === 'over') { Battle.finish(); return; }
      el.actions.innerHTML = '';
      /* Düşman hamlesi kısa bir gecikmeyle oynanır */
      setTimeout(() => {
        if (!QW.Combat.s) return;
        QW.Combat.enemyTurn();
        Battle.refresh();
        if (QW.Combat.s.phase === 'over') Battle.finish();
        else Battle.buildActions();
      }, 620);
    },

    finish() {
      if (resolved) return;
      resolved = true;
      const s = QW.Combat.s;
      const res = QW.Combat.resolve();
      el.actions.innerHTML = '';

      if (res.outcome === 'win') {
        pushLog(QW.t('cb_win', { xp: res.xp, ec: res.ec }));
        if (res.loot.length) pushLog(QW.t('cb_loot', { list: res.loot.join(', ') }));
        if (res.fragment) { pushLog(QW.t('cb_frag')); QW.Audio.sfx('fragment'); QW.HUD.flash(400); }
        else QW.Audio.sfx('levelup');
        if (s.boss && entity.poi) {
          const poi = QW.World.getPoi(entity.poi);
          if (poi) poi.cleared = true;
        }
        /* Anlatı hâkimlerinin kendi sessiz sonları var */
        storyOutcome = s.e.meta.id;
      } else if (res.outcome === 'lose') {
        pushLog(QW.t('cb_lose'));
        QW.Audio.sfx('death');
      } else {
        pushLog(QW.t('cb_fled'));
      }
      endTimer = 1.1;
    },

    close() {
      const s = QW.Combat.s;
      const outcome = s ? s.over : 'fled';
      const story = outcome === 'win' ? storyOutcome : null;
      if (outcome !== 'lose') {
        /* Yenilen ya da kaçılan düşman haritadan silinir */
        QW.Entities.list = QW.Entities.list.filter(e => e !== entity);
        QW.Player.invuln = 1.4;
        QW.Scenes.pop({ outcome });
        if (story) Battle.epilogue(story);
      } else {
        const killer = s && s.e.meta ? s.e.meta.id : null;
        QW.Scenes.pop({ outcome });
        QW.Game.playerDied(killer);
      }
    },

    /* Anlatı hâkimleri için savaş sonrası sahne */
    epilogue(bossId) {
      if (bossId === 'boss_memory_alpha') {
        QW.Audio.stopMusic();
        QW.Audio.motif('grief');
        QW.Dialog.say([QW.t('alpha_end1'), QW.t('alpha_end2')], {
          name: QW.L(QW.Enemies.get(bossId).name),
          onDone: () => QW.OverworldScene.resolveAlpha({ id: 'archive' })
        });
      } else if (bossId === 'boss_lost_leviathan') {
        const poi = QW.World.getPoi('oasis');
        if (poi) {
          poi.healed = true;
          poi.name = { tr: 'İyileşen Vaha', en: 'The Healed Oasis' };
          QW.World.invalidateArea(poi.x, poi.y, 5);
        }
        QW.Audio.sfx('heal');
        QW.Game.codexUnlock('c_oasis');
        QW.Dialog.say([QW.t('levi_end1'), QW.t('levi_end2')], {
          name: QW.L(QW.World.getPoi('oasis') ? QW.World.getPoi('oasis').name : ''),
          onDone: () => QW.HUD.toast(QW.t('oasis_healed'), 'good')
        });
      } else if (bossId === 'boss_quantum_echo') {
        QW.Game.setFlag('echo_beaten', true);
        QW.Game.codexUnlock('c_echo');
        setTimeout(() => QW.Game.finalChoice(), 400);
      }
    },

    /* ---------------------------------------------------------------- */
    refresh() {
      const s = QW.Combat.s; if (!s) return;
      el.eName.textContent = s.e.name + '  LV' + s.e.meta.lvl +
        (s.e.exposed > 0 ? '  [' + QW.Combat.weakName(s.e.meta.weak) + ']'
          : s.e.known ? '  (' + QW.Combat.weakName(s.e.meta.weak) + ')' : '') +
        (s.e.shield > 0 ? '  ⛨' + s.e.shield : '');
      el.eFill.style.width = (s.e.hp / s.e.hpMax * 100).toFixed(1) + '%';
      el.selfHp.style.width = (QW.Player.hp / QW.Player.hpMax * 100).toFixed(1) + '%';
      el.selfEp.style.width = (s.p.energy / 40 * 100).toFixed(1) + '%';
      while (el.log.children.length > 6) el.log.removeChild(el.log.firstChild);
    },

    update(dt) {
      /* Giriş animasyonu bitene kadar savaş başlamaz */
      if (!introDone) {
        introT += dt;
        introShards.forEach(sh => {
          sh.off = Math.max(0, sh.off - dt * sh.sp * 1.5);
        });
        if (introT >= INTRO_LEN) {
          introDone = true;
          const s0 = QW.Combat.s;
          QW.Audio.playMusic(s0 && s0.boss ? 'boss' : (s0 && s0.mirror ? 'echo' : 'battle'));
          Battle.buildActions();
        }
        return;
      }
      /* Hit-stop sırasında zaman durur: darbenin ağırlığı buradan gelir */
      if (stepFX(dt)) return;
      anim += dt;
      const s = QW.Combat.s;
      if (s && s.fx) {
        if (!s.fx.seen) {
          s.fx.seen = true;
          const S = QW.Pixel.Screen;
          if (s.fx.kind === 'hit') {
            FX.flashE = 1;
            impact(S.w / 2, S.h * (S.portrait ? 0.32 : 0.28),
              s.fx.crit ? 1.0 : 0.45, s.fx.crit ? '#ffd166' : '#ffffff');
          } else if (s.fx.kind === 'phit') {
            FX.flashP = 1;
            FX.shake = 5; FX.shakeT = 0.28; FX.stop = 0.06;
            impact(S.w * 0.20, S.h * (S.portrait ? 0.60 : 0.64), 0.5, '#ff5d7a');
          }
        }
        s.fx.t -= dt;
        if (s.fx.t <= 0) s.fx = null;
      }
      if (endTimer > 0) {
        endTimer -= dt;
        if (endTimer <= 0) {
          endTimer = 0;
          el.actions.innerHTML = '';
          el.actions.appendChild(cbtn(QW.t('continue'), '', () => Battle.close(), false, 'back'));
        }
      }
      Battle.refresh();
    },

    /* ---------------------------------------------------------------- */
    draw(ctx) {
      const S = P.Screen, s = QW.Combat.s;
      const t = QW.Player.tilePos();
      const b = QW.World.biomeAt(t.tx, t.ty);

      /* Sarsıntı tüm sahneyi kaydırır; DOM arayüzü yerinde kalır */
      const sh = shakeOffset();
      ctx.save();
      ctx.translate(sh.x, sh.y);

      /* Biyoma göre savaş arka planı: gökyüzü + iki katmanlı ufuk + zemin */
      const night = QW.World.isNight();
      const sky = night ? '#080c18' : U.mixHex(b.base, '#1b2a4a', 0.7);
      const horizon = S.h * 0.52, ground = S.h * 0.66;
      const OV = 12;   // sarsıntı payı: kenarlarda boşluk görünmesin
      ctx.fillStyle = sky; ctx.fillRect(-OV, -OV, S.w + OV * 2, horizon + OV);
      /* Gökyüzü bantları */
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = U.mixHex(sky, night ? '#1a2440' : '#4a6a9a', 0.12 * (4 - i));
        ctx.fillRect(-OV, horizon - 6 - i * 5, S.w + OV * 2, 3);
      }
      bgStars.forEach(st => {
        if (!night) return;
        ctx.fillStyle = st.s > 0.7 ? '#dff6ff' : '#5d6f8a';
        ctx.fillRect((st.x * S.w) | 0, (st.y * horizon) | 0, 1, 1);
      });
      /* Uzak sırtlar */
      for (let i = 0; i < 14; i++) {
        const hx = (i * 41 + 7) % (S.w + 40) - 20;
        const hh = 8 + ((i * 23) % 20);
        ctx.fillStyle = U.shade(b.alt, -0.35);
        ctx.fillRect(hx, horizon - hh, 26, hh + 4);
      }
      ctx.fillStyle = U.shade(b.base, -0.18);
      ctx.fillRect(-OV, horizon, S.w + OV * 2, ground - horizon);
      ctx.fillStyle = b.base;
      ctx.fillRect(-OV, ground, S.w + OV * 2, S.h - ground + OV);
      /* Zemin dokusu */
      for (let y = ground; y < S.h; y += 2) {
        for (let x = ((y | 0) % 4); x < S.w; x += 7) {
          ctx.fillStyle = ((x + y) % 3) ? b.alt : b.det;
          ctx.fillRect(x, y, 2, 1);
        }
      }

      if (!s) { ctx.restore(); return; }

      /* Düşman */
      const scale = s.boss ? (S.portrait ? 4 : 5) : (S.portrait ? 3 : 4);
      const size = QW.Sprites.creatureSize(s.e.meta.sprite.s);
      const ew = size.w * scale, eh = size.h * scale;
      let ex = (S.w - ew) / 2, ey = S.h * (S.portrait ? 0.30 : 0.26) - eh / 2 + Math.sin(anim * 1.6) * 2;
      ex += FX.knock;                       // darbede geri savrulma
      ey -= FX.knock * 0.25;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(ex + 4, ey + eh - 2, ew - 8, 3);
      if (s.e.hp > 0) {
        QW.Sprites.creature(ctx, ex, ey, s.e.meta.sprite, scale, false);
        /* Vuruş flaşı: yalnızca siluet beyaza boyanır */
        if (FX.flashE > 0) QW.Sprites.creatureFlash(ctx, ex, ey, s.e.meta.sprite, scale, FX.flashE * 0.9);
      }
      if (s.e.shield > 0) {
        ctx.strokeStyle = 'rgba(143,208,255,0.65)';
        ctx.strokeRect(ex - 2.5, ey - 2.5, ew + 5, eh + 5);
      }

      /* Oyuncu — alt solda, sırtı dönük */
      const px = S.w * 0.16, py = S.h * (S.portrait ? 0.56 : 0.60);
      const pscale = 2;
      ctx.save();
      ctx.translate(px, py); ctx.scale(pscale, pscale);
      QW.Sprites.player(ctx, 0, 0, QW.Player.look, 'up', 0);
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(px + 4, py + 32, 16, 3);

      /* Oyuncu vuruş flaşı */
      if (FX.flashP > 0) {
        ctx.save();
        ctx.globalAlpha = FX.flashP * 0.5;
        ctx.fillStyle = '#ff5d7a';
        ctx.fillRect(px - 2, py - 2, 28, 36);
        ctx.restore();
      }

      /* Çarpma partikülleri */
      for (const pt of FX.parts) {
        const a = Math.min(1, pt.life / 0.35);
        ctx.globalAlpha = a;
        ctx.fillStyle = pt.c;
        ctx.fillRect(pt.x | 0, pt.y | 0, pt.s, pt.s);
      }
      ctx.globalAlpha = 1;

      /* Hasar sayıları */
      if (s.fx) {
        const a = U.clamp(s.fx.t / 0.35, 0, 1);
        if (s.fx.kind === 'hit') {
          /* Sayı önce büyür sonra yükselerek söner (squash-and-stretch hissi) */
          const pop = a > 0.75 ? 1 : 0;
          const sc = (s.fx.crit ? 2 : 1) + pop;
          P.text(ctx, String(s.fx.n), ex + ew / 2 - 6 - pop * 2, ey - 10 - (1 - a) * 10,
            s.fx.crit ? '#ffd166' : '#ffffff', sc, '#000000');
        } else if (s.fx.kind === 'phit') {
          P.text(ctx, String(s.fx.n), px + 6, py - 10 - (1 - a) * 8, '#ff5d7a', 1, '#000000');
          ctx.fillStyle = 'rgba(200,30,60,' + (a * 0.25).toFixed(2) + ')';
          ctx.fillRect(0, 0, S.w, S.h);
        }
      }

      /* Tur göstergesi */
      P.text(ctx, QW.t('cb_turn', { n: s.turn }), 4, 4, '#7d93a8', 1, '#000000');
      if (s.boss) P.text(ctx, QW.t('cb_boss'), S.w - P.textW(QW.t('cb_boss'), 1) - 4, 4, '#ff5d7a', 1, '#000000');

      /* --- giriş geçişi: bantlar kayarak açılır, isim levhası süzülür --- */
      if (!introDone) {
        const k = U.clamp(introT / INTRO_LEN, 0, 1);
        introShards.forEach(sh => {
          if (sh.off <= 0) return;
          const y = sh.y * S.h, h = Math.ceil(sh.h * S.h) + 1;
          const x = sh.dir * sh.off * (S.w + 20);
          ctx.fillStyle = '#05070d';
          ctx.fillRect(x, y, S.w + 20, h);
          ctx.fillStyle = sh.dir > 0 ? 'rgba(77,242,200,0.35)' : 'rgba(255,93,122,0.30)';
          ctx.fillRect(x + (sh.dir > 0 ? -3 : S.w + 17), y, 3, h);
        });
        /* Beyaz çakma */
        if (k < 0.16) {
          ctx.fillStyle = 'rgba(255,255,255,' + (0.85 * (1 - k / 0.16)).toFixed(2) + ')';
          ctx.fillRect(0, 0, S.w, S.h);
        }
        /* İsim levhası sağdan süzülür */
        if (k > 0.35 && s) {
          const t2 = U.clamp((k - 0.35) / 0.3, 0, 1);
          const name = s.e.name.toLocaleUpperCase(QW.I18N.lang);
          const bw = P.textW(name, 2) + 16;
          const bx = U.lerp(S.w, (S.w - bw) / 2, t2 < 1 ? t2 * t2 * (3 - 2 * t2) : 1);
          const by = S.h * 0.44;
          ctx.fillStyle = 'rgba(5,7,13,0.88)';
          ctx.fillRect(bx - 4, by - 5, bw + 8, 22);
          ctx.fillStyle = s.boss ? '#ff5d7a' : '#4df2c8';
          ctx.fillRect(bx - 4, by - 5, bw + 8, 2);
          ctx.fillRect(bx - 4, by + 15, bw + 8, 2);
          P.text(ctx, name, bx + 4, by + 1, '#dff6ff', 2, '#000000');
          if (s.boss && k > 0.6) {
            const bt = QW.t('cb_boss');
            P.text(ctx, bt, (S.w - P.textW(bt, 1)) / 2, by + 22, '#ff5d7a', 1, '#000000');
          }
        }
      }

      ctx.restore();
    }
  };

  function pushLog(txt) {
    const d = document.createElement('div');
    d.textContent = txt;
    el.log.appendChild(d);
    while (el.log.children.length > 6) el.log.removeChild(el.log.firstChild);
  }

  QW.bus.on('combat_log', txt => { if (el.log) pushLog(txt); });

  QW.Scenes.register('battle', Battle);

})(window.QW);
