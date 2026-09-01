/* =========================================================================
 * Sahne: BATTLE — sıra tabanlı savaş ekranı
 * Mobil için büyük butonlar; taktikler craft edilen donanıma bağlıdır.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const P = QW.Pixel, U = QW.Utils;

  let el = {}, menu = 'root', anim = 0, shakeT = 0, entity = null;
  let bgStars = [], resolved = false, endTimer = 0, storyOutcome = null;

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

      QW.Combat.begin(entity);
      el.log.innerHTML = '';
      QW.Combat.s.log.forEach(pushLog);
      Battle.buildActions();
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
          el.actions.appendChild(cbtn(
            QW.L(t.name),
            st.ok ? (QW.L(t.desc) + ' · ' + t.cost + ' EN') : st.why,
            () => { QW.Combat.playerTactic(t.id); Battle.afterAction(); },
            !st.ok
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
        QW.Scenes.pop({ outcome });
        QW.Game.playerDied();
      }
    },

    /* Anlatı hâkimleri için savaş sonrası sahne */
    epilogue(bossId) {
      if (bossId === 'boss_memory_alpha') {
        QW.Audio.stopMusic();
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
        (s.e.exposed > 0 ? '  [' + QW.Combat.weakName(s.e.meta.weak) + ']' : '') +
        (s.e.shield > 0 ? '  ⛨' + s.e.shield : '');
      el.eFill.style.width = (s.e.hp / s.e.hpMax * 100).toFixed(1) + '%';
      el.selfHp.style.width = (QW.Player.hp / QW.Player.hpMax * 100).toFixed(1) + '%';
      el.selfEp.style.width = (s.p.energy / 40 * 100).toFixed(1) + '%';
      while (el.log.children.length > 6) el.log.removeChild(el.log.firstChild);
    },

    update(dt) {
      anim += dt;
      const s = QW.Combat.s;
      if (s && s.fx) {
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

      /* Biyoma göre savaş arka planı: gökyüzü + iki katmanlı ufuk + zemin */
      const night = QW.World.isNight();
      const sky = night ? '#080c18' : U.mixHex(b.base, '#1b2a4a', 0.7);
      const horizon = S.h * 0.52, ground = S.h * 0.66;
      ctx.fillStyle = sky; ctx.fillRect(0, 0, S.w, horizon);
      /* Gökyüzü bantları */
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = U.mixHex(sky, night ? '#1a2440' : '#4a6a9a', 0.12 * (4 - i));
        ctx.fillRect(0, horizon - 6 - i * 5, S.w, 3);
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
      ctx.fillRect(0, horizon, S.w, ground - horizon);
      ctx.fillStyle = b.base;
      ctx.fillRect(0, ground, S.w, S.h - ground);
      /* Zemin dokusu */
      for (let y = ground; y < S.h; y += 2) {
        for (let x = ((y | 0) % 4); x < S.w; x += 7) {
          ctx.fillStyle = ((x + y) % 3) ? b.alt : b.det;
          ctx.fillRect(x, y, 2, 1);
        }
      }

      if (!s) return;

      /* Düşman */
      const scale = s.boss ? (S.portrait ? 4 : 5) : (S.portrait ? 3 : 4);
      const size = QW.Sprites.creatureSize(s.e.meta.sprite.s);
      const ew = size.w * scale, eh = size.h * scale;
      let ex = (S.w - ew) / 2, ey = S.h * (S.portrait ? 0.30 : 0.26) - eh / 2 + Math.sin(anim * 1.6) * 2;
      if (s.fx && s.fx.kind === 'hit') ex += Math.sin(s.fx.t * 60) * 4;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(ex + 4, ey + eh - 2, ew - 8, 3);
      if (s.e.hp > 0) QW.Sprites.creature(ctx, ex, ey, s.e.meta.sprite, scale, false);
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

      /* Hasar sayıları */
      if (s.fx) {
        const a = U.clamp(s.fx.t / 0.35, 0, 1);
        if (s.fx.kind === 'hit') {
          P.text(ctx, String(s.fx.n), ex + ew / 2 - 6, ey - 10 - (1 - a) * 8,
            s.fx.crit ? '#ffd166' : '#ffffff', s.fx.crit ? 2 : 1, '#000000');
        } else if (s.fx.kind === 'phit') {
          P.text(ctx, String(s.fx.n), px + 6, py - 10 - (1 - a) * 8, '#ff5d7a', 1, '#000000');
          ctx.fillStyle = 'rgba(200,30,60,' + (a * 0.25).toFixed(2) + ')';
          ctx.fillRect(0, 0, S.w, S.h);
        }
      }

      /* Tur göstergesi */
      P.text(ctx, QW.t('cb_turn', { n: s.turn }), 4, 4, '#7d93a8', 1, '#000000');
      if (s.boss) P.text(ctx, QW.t('cb_boss'), S.w - P.textW(QW.t('cb_boss'), 1) - 4, 4, '#ff5d7a', 1, '#000000');
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
