/* =========================================================================
 * Sahne: OVERWORLD — keşif, etkileşim, öğretici, kamp ve savaş tetikleyicisi
 * ========================================================================= */
(function (QW) {
  'use strict';

  const P = QW.Pixel, U = QW.Utils, Wd = QW.World;

  let cam = { x: 0, y: 0 };
  let interactTarget = null;
  let hintT = 0, encounterLock = 0, dead = false;

  /* Öğretici nesneleri — enkazın yanında iki etkileşim noktası */
  function tutorials() {
    const sp = Wd.spawn;
    return [
      { id: 'leak', tx: sp.x + 3, ty: sp.y + 2, flag: 'leak_sealed',
        label: () => QW.t('tut_leak'), done: () => QW.t('tut_leak_done') },
      { id: 'console', tx: sp.x - 3, ty: sp.y + 2, flag: 'map_booted',
        label: () => QW.t('tut_boot'), done: () => QW.t('tut_boot_done') }
    ];
  }

  const OW = {
    /* ---------------------------------------------------------------- */
    enter(data) {
      QW.HUD.show(true);
      QW.Input.showTouch(QW.Save.settings.touch);
      QW.HUD.setMinimap(!!QW.Game.flags.map_booted);
      dead = false; encounterLock = 0;
      OW.music();
      snapCam(true);
      if (data && data.fresh) {
        QW.Dialog.say([QW.t('tut_move') + '\n' + QW.t('tut_a')], { name: QW.Player.name });
      }
    },

    resume() {
      QW.HUD.show(true);
      QW.Input.showTouch(QW.Save.settings.touch);
      OW.music();
      QW.Input.reset();
    },

    pause() { },
    exit() { },

    music() {
      const t = QW.Player.tilePos();
      const poi = Wd.poiNear(t.tx, t.ty, 4);
      if (poi && (poi.kind === 'camp' || poi.kind === 'station')) QW.Audio.fadeMusicTo('camp');
      else QW.Audio.fadeMusicTo(Wd.isNight() ? 'night' : 'overworld');
    },

    /* ---------------------------------------------------------------- */
    update(dt) {
      if (QW.Dialog.open || QW.Panels.isOpen()) { QW.Input.reset(); QW.HUD.update(); return; }
      if (dead) return;

      const P0 = QW.Player;
      const caps = QW.Vehicles.caps();
      caps.run = QW.Input.btn.b;

      /* Kamp yakınında stres düşer */
      const tp = P0.tilePos();
      const nearPoi = Wd.poiNear(tp.tx, tp.ty, 4);
      caps.inCamp = !!(nearPoi && (nearPoi.kind === 'camp' || nearPoi.kind === 'station'));
      caps.scan = QW.Crafting.hasPassive('scan');

      /* İletişim modülü takılıysa uzak kamplar haritada belirir */
      if (!QW.Game.flags.comms_reveal && QW.Crafting.hasPassive('comms')) {
        QW.Game.setFlag('comms_reveal', true);
        const n = Wd.revealCamps();
        if (n) QW.HUD.toast(QW.t('comms_reveal'), 'info');
      }

      P0.move(dt, QW.Input.axis.x, QW.Input.axis.y, caps);
      P0.tick(dt, caps);
      QW.Vehicles.tick(dt, P0.moving);
      Wd.tickTime(dt);
      QW.Weather.tick(dt, Wd.biomeKeyAt(tp.tx, tp.ty));
      QW.Save.tick(dt);

      encounterLock = Math.max(0, encounterLock - dt);
      QW.Entities.update(dt, e => {
        if (encounterLock > 0 || P0.invuln > 0) return;
        encounterLock = 1.2;
        QW.Scenes.push('battle', { entity: e });
      });

      snapCam(false);
      findInteract();

      if (QW.Input.consume('a')) doInteract();

      hintT += dt;
      if (hintT > 4) { hintT = 0; OW.music(); }
      QW.HUD.update();
    },

    /* ---------------------------------------------------------------- */
    draw(ctx) {
      const S = P.Screen;
      Wd.draw(ctx, cam.x, cam.y, S.w, S.h);
      drawTutorials(ctx);

      /* Y sıralı çizim — derinlik hissi */
      const drawables = [];
      QW.Entities.list.forEach(e => drawables.push({ y: e.y, fn: () => {} }));
      QW.Entities.draw(ctx, cam.x, cam.y);
      drawNpcs(ctx);

      const px = (QW.Player.x - cam.x - 6) | 0, py = (QW.Player.y - cam.y - 12) | 0;
      QW.Vehicles.draw(ctx, px, py, QW.Player.dir);
      QW.Player.draw(ctx, px, py);

      drawInteractHint(ctx);

      /* Gece/gündüz ve hava katmanları */
      const L = Wd.lightOverlay();
      if (L.a > 0) {
        ctx.fillStyle = L.col;
        ctx.globalAlpha = L.a;
        ctx.fillRect(0, 0, S.w, S.h);
        ctx.globalAlpha = 1;
      }
      QW.Weather.draw(ctx);

      /* Düşük oksijen / kritik can vinyeti */
      if (QW.Player.o2 < 25 || QW.Player.hp < QW.Player.hpMax * 0.25) {
        const pulse = 0.15 + Math.sin(performance.now() / 260) * 0.08;
        ctx.fillStyle = 'rgba(200,30,60,' + pulse.toFixed(2) + ')';
        ctx.fillRect(0, 0, S.w, 3);
        ctx.fillRect(0, S.h - 3, S.w, 3);
        ctx.fillRect(0, 0, 3, S.h);
        ctx.fillRect(S.w - 3, 0, 3, S.h);
      }
    }
  };

  /* ------------------------------------------------------------------
   * KAMERA
   * ---------------------------------------------------------------- */
  function snapCam(instant) {
    const S = P.Screen;
    const tx = QW.Player.x - S.w / 2, ty = QW.Player.y - S.h / 2;
    if (instant) { cam.x = tx; cam.y = ty; }
    else { cam.x += (tx - cam.x) * 0.18; cam.y += (ty - cam.y) * 0.18; }
    cam.x = U.clamp(cam.x, 0, Wd.W * Wd.TILE - S.w);
    cam.y = U.clamp(cam.y, 0, Wd.H * Wd.TILE - S.h);
    cam.x = Math.round(cam.x); cam.y = Math.round(cam.y);
  }

  /* ------------------------------------------------------------------
   * ÖĞRETİCİ NESNELERİ
   * ---------------------------------------------------------------- */
  function drawTutorials(ctx) {
    tutorials().forEach(t => {
      if (QW.Game.flags[t.flag]) return;
      const x = t.tx * Wd.TILE - cam.x, y = t.ty * Wd.TILE - cam.y;
      if (x < -20 || y < -20 || x > P.Screen.w + 20 || y > P.Screen.h + 20) return;
      if (t.id === 'leak') {
        ctx.fillStyle = '#3a404e'; ctx.fillRect(x + 2, y + 4, 12, 10);
        ctx.fillStyle = '#8a94a8'; ctx.fillRect(x + 2, y + 4, 12, 2);
        /* Kaçan oksijen */
        const ph = (performance.now() / 90) % 8;
        ctx.fillStyle = '#9adcff';
        for (let i = 0; i < 4; i++) ctx.fillRect(x + 7 + i, y + 2 - ((ph + i * 2) % 8), 1, 1);
      } else {
        ctx.fillStyle = '#2c3550'; ctx.fillRect(x + 2, y + 2, 12, 12);
        ctx.fillStyle = '#121a30'; ctx.fillRect(x + 4, y + 4, 8, 6);
        const on = Math.floor(performance.now() / 300) % 2;
        ctx.fillStyle = on ? '#4df2c8' : '#1c6a58';
        ctx.fillRect(x + 5, y + 5, 6, 4);
      }
    });
  }

  /* Kamplarda ve istasyonda NPC'ler görünür */
  function drawNpcs(ctx) {
    Wd.pois.forEach(p => {
      const ids = p.npc ? [p.npc] : (p.npcs || []);
      ids.forEach((id, i) => {
        const def = QW.NPCs.get(id); if (!def) return;
        const x = (p.x * Wd.TILE + (i - (ids.length - 1) / 2) * 20) - cam.x - 6;
        const y = p.y * Wd.TILE - cam.y - 10;
        if (x < -20 || y < -20 || x > P.Screen.w + 20 || y > P.Screen.h + 20) return;
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.fillRect(x + 3, y + 15, 6, 2);
        const f = Math.floor(performance.now() / 600 + i) % 2;
        QW.Sprites.npc(ctx, x, y, def.sprite, 'down', f);
        /* Konuşma işareti */
        if (!QW.NPCState.of(id).met) {
          ctx.fillStyle = '#ffd166';
          const bob = Math.sin(performance.now() / 260 + i) * 1.5;
          ctx.fillRect(x + 5, y - 6 + bob, 2, 4);
          ctx.fillRect(x + 5, y - 1 + bob, 2, 1);
        }
      });
    });
  }

  /* ------------------------------------------------------------------
   * ETKİLEŞİM
   * ---------------------------------------------------------------- */
  function findInteract() {
    const t = QW.Player.tilePos();
    interactTarget = null;
    let best = 99;

    /* Öğretici */
    tutorials().forEach(tt => {
      if (QW.Game.flags[tt.flag]) return;
      const d = U.dist(t.tx, t.ty, tt.tx, tt.ty);
      if (d <= 1.6 && d < best) { best = d; interactTarget = { kind: 'tut', tut: tt, label: tt.label() }; }
    });

    /* Kaynak düğümleri (oyuncunun bulunduğu ve komşu tile'lar) */
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const n = Wd.nodeAt(t.tx + dx, t.ty + dy);
      if (!n) continue;
      const d = Math.abs(dx) + Math.abs(dy);
      if (d < best) { best = d; interactTarget = { kind: 'node', node: n, label: QW.t('act_gather') + ': ' + QW.Items.name(n.item) }; }
    }

    /* POI */
    const poi = Wd.poiNear(t.tx, t.ty, 1.5);
    if (poi) {
      let label = QW.t('act_search');
      if (poi.kind === 'camp' || poi.kind === 'station') label = QW.t('act_talk');
      else if (poi.kind === 'lair') label = QW.t('act_enter');
      else if (poi.kind === 'wreck') label = QW.t('act_rest');
      if (best > 0.5 || poi.kind === 'camp' || poi.kind === 'station' || poi.kind === 'lair') {
        interactTarget = { kind: 'poi', poi, label: label + ' - ' + QW.L(poi.name) };
      }
    }
  }

  function drawInteractHint(ctx) {
    if (!interactTarget) return;
    const S = P.Screen;
    const txt = interactTarget.label.toUpperCase();
    const w = P.textW(txt, 1) + 8;
    const x = Math.max(2, Math.min(S.w - w - 2, (S.w - w) / 2 | 0));
    const y = S.h - (S.portrait ? 104 : 34);
    ctx.fillStyle = 'rgba(5,7,13,0.80)';
    ctx.fillRect(x, y - 4, w, 15);
    P.frame(ctx, x, y - 4, w, 15, '#26365c');
    P.text(ctx, txt, x + 4, y + 1, '#dff6ff', 1, '#000000');
    /* A tuşu göstergesi */
    ctx.fillStyle = '#4df2c8';
    ctx.fillRect(x - 9, y - 1, 7, 8);
    P.text(ctx, 'A', x - 8, y, '#04120e', 1);
  }

  function doInteract() {
    if (!interactTarget) return;
    const it = interactTarget;

    if (it.kind === 'tut') {
      QW.Audio.sfx('craft');
      QW.Game.setFlag(it.tut.flag, true);
      QW.HUD.toast(it.tut.done(), 'good');
      if (it.tut.flag === 'map_booted') QW.HUD.setMinimap(true);
      if (it.tut.flag === 'leak_sealed') QW.Player.addO2(60);
      return;
    }

    if (it.kind === 'node') {
      const n = it.node;
      QW.Inventory.add(n.item, n.n);
      Wd.harvest(n.tx, n.ty);
      Wd.invalidate(n.tx, n.ty);
      QW.Audio.sfx('pickup');
      return;
    }

    if (it.kind === 'poi') doPoi(it.poi);
  }

  function doPoi(poi) {
    switch (poi.kind) {
      case 'camp':
        if (poi.beacon || !poi.npc) { QW.Panels.show('rest'); break; }
        talkTo(poi.npc, poi);
        break;

      case 'station': {
        const ids = poi.npcs || [];
        QW.Game.atStationBench = true;
        QW.Dialog.say([QW.L(QW.NPCs.get(ids[0]).greet[0])], {
          name: QW.L(poi.name),
          sprite: QW.NPCs.get(ids[0]).sprite,
          choices: ids.map(id => ({
            label: QW.L(QW.NPCs.get(id).name), fn: () => talkTo(id, poi)
          })).concat([
            { label: QW.t('p_craft'), fn: () => QW.Panels.show('craft') },
            { label: QW.t('p_rest'), fn: () => QW.Panels.show('rest') },
            { label: QW.t('back') }
          ])
        });
        break;
      }

      case 'lair': {
        const def = QW.Enemies.get(poi.boss);
        if (QW.Game.flags['boss_' + poi.boss]) {
          QW.Dialog.say([QW.L({ tr: 'İn boş. Yenilenin izleri hâlâ duruyor.', en: 'The lair is empty. The marks of the fallen remain.' })],
            { name: QW.L(poi.name) });
          return;
        }
        QW.Dialog.say([QW.L(def.desc), QW.t('cb_boss') + ': ' + QW.L(def.name)], {
          name: QW.L(poi.name), sprite: null,
          choices: [
            { label: QW.t('act_enter'), fn: () => {
                const e = QW.Entities.spawnBossAt(poi);
                if (e) QW.Scenes.push('battle', { entity: e, boss: true });
              } },
            { label: QW.t('back') }
          ]
        });
        break;
      }

      case 'ruin': case 'pod': {
        if (poi.looted && Wd.day - poi.lootDay < 3) {
          QW.HUD.toast(QW.t('depleted'), 'info');
          return;
        }
        const n = 1 + U.irange(1, 2);
        const got = [];
        for (let i = 0; i < n; i++) {
          const id = U.pick(poi.loot);
          const cnt = id === 'data_crystal' || id === 'cassette_mech' || id === 'cd_lens' ? 1 : U.irange(1, 3);
          QW.Inventory.add(id, cnt, true);
          got.push(QW.Items.name(id) + ' x' + cnt);
        }
        poi.looted = true; poi.lootDay = Wd.day;
        QW.Audio.sfx('pickup');
        QW.Game.codexUnlock(poi.kind === 'ruin' ? 'c_tome' : 'c_wreck');
        QW.Dialog.say([QW.t('found') + '\n' + got.join('\n')], { name: QW.L(poi.name) });
        break;
      }

      case 'wreck': {
        const frags = QW.Inventory.count('core_fragment');
        const choices = [
          { label: QW.t('p_rest'), fn: () => QW.Panels.show('rest') },
          { label: QW.t('p_craft'), fn: () => QW.Panels.show('craft') }
        ];
        if (frags >= 5) {
          choices.unshift({ label: QW.t('core_insert'), fn: () => {
            QW.Game.setFlag('core_restored', true);
            QW.bus.emit('game_end');
          } });
        }
        choices.push({ label: QW.t('back') });
        QW.Game.codexUnlock('c_wreck');
        QW.Dialog.say([
          QW.L({ tr: 'Argos\'un gövdesi hâlâ sıcak. Çekirdek yuvası boş bakıyor.',
                 en: 'The hull of the Argos is still warm. The core cradle stares back, empty.' }),
          frags >= 5 ? QW.t('core_ready') : QW.t('core_need', { n: 5 - frags })
        ], { name: QW.L(poi.name), choices });
        break;
      }
    }
  }

  function talkTo(npcId, poi) {
    const def = QW.NPCs.get(npcId);
    const st = QW.NPCState.of(npcId);
    if (!st.met) {
      st.met = true;
      QW.bus.emit('npc_met', npcId);
      QW.Game.codexUnlock('c_' + npcId.replace('station_', ''));
    }
    st.talks++;
    QW.Audio.fadeMusicTo(def.music || 'camp');
    const line = def.greet[Math.min(st.talks - 1, def.greet.length - 1)];
    QW.Dialog.say([QW.L(line)], {
      name: QW.L(def.name) + ' — ' + QW.L(def.title),
      sprite: def.sprite,
      choices: [
        { label: QW.t('act_trade'), fn: () => { QW.Panels.tab = 'barter'; QW.Panels.show('trade', { npc: npcId }); } },
        { label: QW.t('act_rest'), fn: () => QW.Panels.show('rest') },
        { label: QW.t('back') }
      ]
    });
  }

  QW.Scenes.register('overworld', OW);
  QW.OverworldScene = OW;

})(window.QW);
