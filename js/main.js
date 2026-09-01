/* =========================================================================
 * QW.Game — açılış, oyun durumu, kayıt/yükleme, ölüm ve final
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils;

  const G = QW.Game = {
    seed: 0,
    flags: {},
    codex: {},
    stats: { kills: 0, crafted: 0, bosses: 0 },
    atStationBench: false,
    started: false
  };

  /* ------------------------------------------------------------------
   * BAYRAKLAR VE ARŞİV
   * ---------------------------------------------------------------- */
  G.setFlag = function (k, v) {
    G.flags[k] = v;
    QW.bus.emit('flag', k, v);
  };
  G.flag = k => !!G.flags[k];

  G.codexUnlock = function (id) {
    if (!id || G.codex[id]) return;
    const c = QW.QuestDB.codex[id];
    if (!c) return;
    G.codex[id] = true;
    QW.HUD.toast(QW.t('codex_new', { name: QW.L(c.name) }), 'info');
  };

  /* ------------------------------------------------------------------
   * YENİ OYUN / YÜKLEME
   * ---------------------------------------------------------------- */
  G.newGame = function (cfg) {
    G.seed = (Math.random() * 0xffffffff) >>> 0;
    G.flags = {}; G.codex = {};
    G.stats = { kills: 0, crafted: 0, bosses: 0 };
    G.atStationBench = false; G._finaleRunning = false;

    QW.World.generate(G.seed);
    QW.Player.reset();
    QW.Inventory.reset();
    QW.Crafting.reset();
    QW.Vehicles.reset();
    QW.NPCState.reset();
    QW.Weather.reset();
    QW.Entities.reset();
    QW.Quests.reset();
    if (cfg) QW.Player.applyCreator(cfg);
    G.codexUnlock('c_wreck');
    G.started = true;

    QW.Scenes.go('overworld', { fresh: true });
    QW.Save.write(true);
  };

  G.loadGame = function () {
    const d = QW.Save.read();
    if (!d) return false;
    G.seed = d.seed;
    G.flags = d.flags || {};
    G.codex = d.codex || {};
    G.stats = d.stats || { kills: 0, crafted: 0, bosses: 0 };

    QW.World.load(d.world);
    QW.Player.load(d.player);
    QW.Inventory.load(d.inv);
    QW.Crafting.load(d.craft);
    QW.Vehicles.load(d.veh);
    QW.NPCState.load(d.npc);
    QW.Weather.load(d.weather);
    QW.Entities.reset();
    QW.Quests.load(d.quests);
    G.started = true;

    QW.Scenes.go('overworld', {});
    QW.HUD.setMinimap(!!G.flags.map_booted);
    return true;
  };

  G.toTitle = function () {
    QW.Save.write(true);
    G.started = false;
    QW.Audio.stopMusic();
    QW.Scenes.go('boot');
  };

  /* ------------------------------------------------------------------
   * ÖLÜM
   * ---------------------------------------------------------------- */
  G.playerDied = function () {
    QW.HUD.show(false);
    QW.Input.showTouch(false);
    const c = document.getElementById('cinema');
    const title = document.getElementById('cinema-title');
    const text = document.getElementById('cinema-text');
    const acts = document.getElementById('cinema-actions');
    c.classList.remove('hidden');
    c.style.background = '#05070d';
    title.textContent = QW.t('death_title');
    title.classList.add('glitch');
    text.textContent = QW.t('death_text');
    acts.innerHTML = '';
    const b = document.createElement('button');
    b.className = 'btn pri';
    b.textContent = QW.t('death_ok');
    QW.Utils.tap(b, () => {
      c.classList.add('hidden'); title.classList.remove('glitch'); c.style.background = '';
      QW.Player.respawn();
      QW.Entities.clearEnemies();
      QW.HUD.show(true);
      QW.Input.showTouch(QW.Save.settings.touch);
      QW.Audio.sfx('ok');
      QW.Save.write(true);
    });
    acts.appendChild(b);
  };

  /* ------------------------------------------------------------------
   * BÜYÜK TERS KÖŞE — gezegen aslında Dünya'nın çok uzak geleceğidir
   * ---------------------------------------------------------------- */
  G.revealTwist = function () {
    if (G.flags.twist_revealed) {
      QW.Dialog.say([QW.t('twist_3')], { name: QW.t('twist_t') });
      return;
    }
    G.setFlag('twist_revealed', true);
    G.codexUnlock('c_truth');
    QW.Audio.stopMusic();
    QW.Audio.sfx('glitch');
    QW.HUD.glitch(true);
    setTimeout(() => QW.HUD.glitch(false), 1200);
    QW.HUD.toast(QW.t('twist_toast'), 'info');
    QW.Dialog.say([QW.t('twist_1'), QW.t('twist_2'), QW.t('twist_3'), QW.t('twist_4')], {
      name: QW.t('twist_t'),
      onDone: () => {
        QW.Audio.playMusic('lament');
        QW.Quests.evaluateAll();
      }
    });
  };

  /* ------------------------------------------------------------------
   * FİNAL — önce kendi yansımanla yüzleşirsin, sonra seçim
   * ---------------------------------------------------------------- */
  G.startFinale = function () {
    if (G._finaleRunning) return;
    if (G.flags.echo_beaten) { G.finalChoice(); return; }
    G._finaleRunning = true;
    const def = QW.Enemies.get('boss_quantum_echo');
    QW.Quests.start('q_echo');
    QW.Audio.fadeMusicTo('echo');
    QW.Dialog.say([QW.t('echo_meet1'), QW.t('echo_meet2')], {
      name: QW.L(def.name),
      onDone: () => {
        G._finaleRunning = false;
        QW.Scenes.push('battle', {
          entity: { type: 'enemy', def, x: QW.Player.x, y: QW.Player.y,
                    hp: def.hp, hpMax: def.hp, boss: true, echo: true },
          boss: true
        });
      }
    });
  };

  /* Yansıma yenildikten sonra: iki yol */
  G.finalChoice = function () {
    QW.Audio.fadeMusicTo('finale');
    QW.Dialog.say([QW.t('echo_end'), QW.t('fin_text')], {
      name: QW.t('fin_title'),
      choices: [
        { label: QW.t('fin_erase'), fn: () => G.ending('erase') },
        { label: QW.t('fin_bury'), fn: () => G.ending('bury') }
      ]
    });
  };

  G.ending = function (choice) {
    choice = choice || 'erase';
    QW.HUD.show(false);
    QW.Input.showTouch(false);
    QW.Audio.playMusic('finale');
    if (choice === 'erase') QW.HUD.flash(900);
    const c = document.getElementById('cinema');
    const title = document.getElementById('cinema-title');
    const text = document.getElementById('cinema-text');
    const acts = document.getElementById('cinema-actions');
    c.classList.remove('hidden');
    c.style.background = '#05070d';
    const all = QW.Enemies.bosses();
    const bosses = all.filter(b => G.flags['boss_' + b]).length;
    if (choice === 'erase') {
      title.textContent = QW.t('fin_erase_t');
      text.textContent = QW.t('fin_erase_1') + '\n\n' + QW.t('fin_erase_2') + '\n\n' + QW.t('fin_erase_3');
    } else {
      title.textContent = QW.t('fin_bury_t');
      text.textContent = QW.t('fin_bury_1') + '\n\n' + QW.t('fin_bury_2') + '\n\n' + QW.t('fin_bury_3');
    }
    text.textContent += '\n\n' + QW.t('fin_epitaph', {
      d: QW.World.day, l: QW.Player.level, b: bosses + '/' + all.length,
      c: QW.t(choice === 'erase' ? 'fin_c_erase' : 'fin_c_bury')
    });
    acts.innerHTML = '';
    const b = document.createElement('button');
    b.className = 'btn pri';
    b.textContent = QW.t('end_again');
    QW.Utils.tap(b, () => {
      c.classList.add('hidden'); c.style.background = '';
      QW.Save.clear();
      G.toTitle();
    });
    acts.appendChild(b);
  };

  /* ------------------------------------------------------------------
   * SİSTEM TUŞLARI
   * ---------------------------------------------------------------- */
  function bindSystem() {
    QW.bus.on('sys', which => {
      if (!G.started) return;
      if (QW.Dialog.open) { QW.Dialog.close(); return; }
      if (QW.Scenes.is('battle')) return;
      if (QW.Panels.isOpen()) {
        if (which === 'menu') QW.Panels.close();
        else QW.Panels.show(which === 'craft' ? 'craft' : which === 'map' ? 'map' : 'inventory');
        return;
      }
      if (which === 'menu') QW.Panels.show('menu');
      else if (which === 'craft') QW.Panels.show('craft');
      else if (which === 'map') QW.Panels.show('map');
      else if (which === 'inv') QW.Panels.show('inventory');
    });

    QW.bus.on('game_end', () => G.startFinale());

    QW.bus.on('newday', () => {
      QW.NPCState.restock();
      QW.HUD.toast(QW.t('hud_day', { n: QW.World.day }), 'info');
      QW.Save.write(true);
    });

    QW.bus.on('enemy_killed', () => { G.stats.kills++; });
    QW.bus.on('boss_killed', () => { G.stats.bosses++; });
    QW.bus.on('craft', () => { G.stats.crafted++; });

    /* İstasyon tezgâhı yalnızca istasyonun yanındayken aktif */
    QW.bus.on('panel_close', () => {
      const t = QW.Player.tilePos();
      const poi = QW.World.poiNear(t.tx, t.ty, 5);
      G.atStationBench = !!(poi && poi.kind === 'station');
    });

    QW.bus.on('lang', () => {
      if (QW.Panels.isOpen()) QW.Panels.render();
      QW.HUD.update();
    });

    /* Ekran döndürüldüğünde chunk'lar yeniden ölçeklenmez; sadece HUD yenilenir */
    QW.bus.on('resize', () => { if (G.started) QW.HUD.update(); });
  }

  /* ------------------------------------------------------------------
   * AÇILIŞ
   * ---------------------------------------------------------------- */
  function boot() {
    QW.Save.loadSettings();
    QW.I18N.initLang();
    if (QW.Save.settings.lang) QW.I18N.setLang(QW.Save.settings.lang);

    QW.Pixel.Screen.attach(document.getElementById('screen'));
    QW.HUD.init();
    QW.Dialog.init();
    QW.Panels.init();
    QW.Input.init();
    QW.Quests.bind();
    bindSystem();

    QW.Audio.init();
    QW.Audio.setEnabled(QW.Save.settings.sound);
    QW.Audio.setMusic(QW.Save.settings.music);
    QW.HUD.setScanlines(QW.Save.settings.scanlines);

    /* Mobil tarayıcıda sesi ilk dokunuşta aç */
    const unlock = () => { QW.Audio.unlock(); if (QW.Save.settings.sound) QW.Audio.playMusic(QW.Audio._track || 'tension'); };
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('mousedown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    QW.Scenes.go('boot');
    QW.Scenes.start();

    /* Sayfa kapanırken kaydet */
    window.addEventListener('pagehide', () => { if (G.started) QW.Save.write(true); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && G.started) QW.Save.write(true);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window.QW);
