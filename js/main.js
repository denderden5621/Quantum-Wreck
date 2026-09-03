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
    /* Kask kaydı: her karşılaşma ve her yenilgi kalıcı bilgiye dönüşür.
       "Game Over" yerine "Next Lesson" — kaybedilen run bir şey öğretir. */
    log: { seen: {}, died: {}, deaths: 0 },
    /* Açılmış zindanların kalıcı durumu (anahtar, alınan eşya, açılan kapı) */
    dungeons: {},
    atStationBench: false,
    started: false
  };

  /* ------------------------------------------------------------------
   * ZİNDANLAR
   * ---------------------------------------------------------------- */
  G.enterDungeon = function (poi) {
    const def = QW.Dungeon.def(poi.biome);
    if (!def) return;
    let dj = G.dungeons[def.id];
    if (!dj) {
      dj = QW.Dungeon.generate(poi.biome, G.seed);
      const chk = QW.Dungeon.verify(dj);
      if (!chk.ok) {                      // olmamalı; olursa yeniden üret
        for (let i = 1; i <= 8 && !chk.ok; i++) {
          dj = QW.Dungeon.generate(poi.biome, (G.seed + i * 7919) >>> 0);
          Object.assign(chk, QW.Dungeon.verify(dj));
        }
      }
      /* Kayıttan gelen ilerleme varsa geri yükle */
      const saved = G._dungeonState && G._dungeonState[def.id];
      if (saved) {
        Object.assign(dj.state, saved);
        /* Alınmış eşyalar odalardan düşürülür */
        dj.rooms.forEach(r => { r.plateOn = false; });
      }
      G.dungeons[def.id] = dj;
    }
    G.dungeonPoi = poi.id;
    QW.Scenes.push('dungeon', { dungeon: dj });
  };

  G.leaveDungeon = function () {
    QW.Scenes.pop();
  };

  /* ------------------------------------------------------------------
   * ADAPTASYON — bilgi, kalıcı ve ölçülebilir bir güce dönüşür
   * ---------------------------------------------------------------- */
  G.noteEncounter = function (enemyId) {
    if (!enemyId) return;
    G.log.seen[enemyId] = (G.log.seen[enemyId] || 0) + 1;
  };

  G.recordDeath = function (enemyId) {
    G.log.deaths++;
    if (!enemyId) return null;
    G.log.died[enemyId] = (G.log.died[enemyId] || 0) + 1;
    const def = QW.Enemies.get(enemyId);
    if (!def) return null;
    QW.HUD.toast(QW.t('log_updated', { name: QW.L(def.name) }), 'info');
    return def;
  };

  /* Yenilgi %10, her üç karşılaşma %5 — tavan %25 */
  G.adaptation = function (enemyId) {
    if (!enemyId) return 0;
    const d = G.log.died[enemyId] || 0;
    const seen = G.log.seen[enemyId] || 0;
    return Math.min(0.25, d * 0.10 + Math.floor(seen / 3) * 0.05);
  };

  /* ------------------------------------------------------------------
   * ÖĞRENİLEN ELEMENT İLİŞKİLERİ
   * Klasik cep konsolu RPG'sinin çekirdek döngüsü: karşılaş -> öğren ->
   * bir dahakine doğru aletle gel. Oyuncunun aklında tutmasını beklemiyoruz;
   * bir kez gördüğü ilişki deftere kalıcı olarak yazılır ve arşivde görünür.
   * ---------------------------------------------------------------- */
  G.learnMatchup = function (enemyId, element, eff) {
    if (!enemyId || !element) return;
    if (!G.log.match) G.log.match = {};              // eski kayıt / kısmi durum
    const rec = G.log.match[enemyId] || (G.log.match[enemyId] = {});
    if (rec[element] !== undefined) return;                 // zaten biliniyor
    rec[element] = eff;
    const def = QW.Enemies.get(enemyId);
    if (!def) return;
    QW.HUD.toast(QW.t(eff > 1 ? 'match_learn_weak' : 'match_learn_res', {
      name: QW.L(def.name), e: QW.Combat.elementName(element)
    }), eff > 1 ? 'good' : 'info');
  };

  /* Bu düşman hakkında bilinen ilişkiler: { element: çarpan } */
  G.matchups = function (enemyId) { return (G.log.match && G.log.match[enemyId]) || {}; };

  /* İki kez karşılaştıktan sonra zayıf nokta radarsız görünür */
  G.knowsWeakPoint = function (enemyId) {
    if (!enemyId) return false;
    return (G.log.seen[enemyId] || 0) >= 2 || (G.log.died[enemyId] || 0) >= 1;
  };

  G.logEntries = function () {
    const ids = new Set(Object.keys(G.log.seen).concat(Object.keys(G.log.died)));
    return Array.from(ids).map(id => ({
      id, def: QW.Enemies.get(id),
      seen: G.log.seen[id] || 0, died: G.log.died[id] || 0,
      adapt: Math.round(G.adaptation(id) * 100),
      weak: G.knowsWeakPoint(id),
      match: G.matchups(id)
    })).filter(e => e.def).sort((a, b) => b.seen - a.seen);
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
    G.log = { seen: {}, died: {}, deaths: 0, match: {}, rec: QW.Record.blank() };
    G.dungeons = {};
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
    G.log = d.log || { seen: {}, died: {}, deaths: 0, match: {} };
    if (!G.log.match) G.log.match = {};                     // eski kayıtlarla uyum
    if (!G.log.rec) G.log.rec = QW.Record.blank();
    G.dungeons = {};   // zindanlar tohumdan yeniden üretilir, ilerleme aşağıda geri yüklenir
    G._dungeonState = d.dungeonState || {};

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
  G.playerDied = function (killerId) {
    QW.HUD.show(false);
    QW.Input.showTouch(false);
    const learned = G.recordDeath(killerId);
    const c = document.getElementById('cinema');
    const title = document.getElementById('cinema-title');
    const text = document.getElementById('cinema-text');
    const acts = document.getElementById('cinema-actions');
    c.classList.remove('hidden');
    c.style.background = '#05070d';
    title.textContent = QW.t('death_title');
    title.classList.add('glitch');

    /* Ölüm bir ceza ekranı değil, bir kayıt ekranıdır */
    let body = QW.t(QW.Save.settings.assist ? 'death_text_a' : 'death_text');
    if (learned) {
      const adapt = Math.round(G.adaptation(killerId) * 100);
      body += '\n\n' + QW.t('log_title') + '\n' + QW.t('log_adapt', { name: QW.L(learned.name), n: adapt });
      if (G.knowsWeakPoint(killerId)) {
        body += '\n' + QW.t('log_weak', { name: QW.L(learned.name), w: QW.Combat.weakName(learned.weak) });
      }
    }
    body += '\n\n' + QW.t('log_deaths', { n: G.log.deaths }) + ' — ' + QW.t('log_pride');
    text.textContent = body;
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
    QW.Audio.motif('broken');        // motif bozulmuş hâliyle: her şey yerine oturuyor
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
   * YANSIMA — tekrar eden ayna
   *
   * Önceki hâlde Yansıma yalnızca finalde bir kez çıkıyordu: bir patron,
   * bir savaş, bitti. Oysa bir aynanın işe yaraması için oyuncuyu YOLDA
   * yakalaması gerekir. Klasiklerde rakip altı kez gelir ve her seferinde
   * seni ölçer. Burada Yansıma parça sayısına göre üç kez belirir; ilk
   * ikisinde savaşmaz, yalnızca kaydını sana geri okur.
   *
   * Söyledikleri sabit değil: ne yaptıysan onu söyler.
   * ---------------------------------------------------------------- */
  G.echoStage = function () {
    const f = QW.Inventory.count('core_fragment');
    if (f >= 5) return 3;
    if (f >= 3) return 2;
    if (f >= 1) return 1;
    return 0;
  };

  G.checkEcho = function () {
    const st = G.echoStage();
    if (st < 1 || st > 2) return false;             // 3. aşama finalde
    if (G.flags['echo_seen_' + st]) return false;
    G.setFlag('echo_seen_' + st, true);
    const r = QW.Record.state();
    const band = QW.Record.band();
    QW.Audio.stopMusic();
    QW.Audio.motif('mirror');
    QW.HUD.glitch(true);
    setTimeout(() => QW.HUD.glitch(false), 900);
    /* Ayna ne gördüyse onu söyler */
    const body = [QW.t('echo_v' + st)];
    body.push(QW.t(band === 'mender' ? 'echo_mirror_mend'
                 : band === 'butcher' ? 'echo_mirror_kill'
                 : r.kills ? 'echo_mirror_mixed' : 'echo_mirror_none',
                 { k: r.kills, s: r.spares }));
    QW.Dialog.say(body, {
      name: QW.t('echo_name'),
      onDone: () => QW.Audio.fadeMusicTo(QW.World.isNight() ? 'night' : 'overworld')
    });
    return true;
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
    QW.Audio.motif('mirror');        // motif tersten: karşındaki sensin
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

  /* ------------------------------------------------------------------
   * SON SEÇİM — bir menü değil, bir tartışma
   *
   * Önceki hâlde final iki düğmeydi ve oyuncu ikisini de ilk kez orada
   * görüyordu. Artık seçim, aylardır birlikte çalıştığın iki insanın
   * anlaşamadığı bir sorudur: Eko silmeni ister, Tome gömmeni. Hangisini
   * seçersen seç birini kırarsın — ve o kırılma finalde yazılır.
   *
   * Konuştuğun kişiler seçeneğin yanında durur. Onlarla hiç konuşmadıysan
   * seçim yine önüne gelir, ama savunmasız gelir: bu da bir sonuçtur.
   * ---------------------------------------------------------------- */
  G.finalChoice = function () {
    QW.Audio.fadeMusicTo('finale');
    const metEko = QW.NPCState.of('eko').met;
    const metTome = QW.NPCState.of('tome').met;
    const body = [QW.t('echo_end'), QW.t('fin_text')];
    if (metEko || metTome) body.push(QW.t('fin_voices'));
    else body.push(QW.t('fin_alone'));

    QW.Dialog.say(body, {
      name: QW.t('fin_title'),
      choices: [
        { label: QW.t('fin_erase') + (metEko ? QW.t('fin_by', { name: QW.t('npc_eko_short') }) : ''),
          fn: () => G.ending('erase') },
        { label: QW.t('fin_bury') + (metTome ? QW.t('fin_by', { name: QW.t('npc_tome_short') }) : ''),
          fn: () => G.ending('bury') }
      ]
    });
  };

  G.ending = function (choice) {
    choice = choice || 'erase';
    QW.HUD.show(false);
    QW.Input.showTouch(false);
    QW.Audio.playMusic('finale');
    if (choice === 'erase') QW.HUD.flash(900);
    QW.Audio.motif(choice === 'erase' ? 'erased' : 'bloom');
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
    /* --- KAYIT FİNALE YAZILIR -------------------------------------
       Son metin herkes için aynı değildir. Nasıl oynadığın, kimi kırdığın
       ve elinin ne kadar temiz olduğu burada geri döner. Seçim ücretsiz
       değildir; kaydın da öyle. */
    const r = QW.Record.state();
    const band = QW.Record.band();
    text.textContent += '\n\n' + QW.t('fin_toll_' + band, { k: r.kills, s: r.spares });

    /* Kırdığın kişi: seçtiğinin karşısında duran, tanıdığın insan */
    const brokeId = choice === 'erase' ? 'tome' : 'eko';
    const keptId = choice === 'erase' ? 'eko' : 'tome';
    if (QW.NPCState.of(brokeId).met) {
      text.textContent += '\n\n' + QW.t('fin_broke_' + brokeId);
    }
    if (QW.NPCState.of(keptId).met) {
      text.textContent += '\n' + QW.t('fin_kept_' + keptId);
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
    QW.bus.on('boss_relieved', () => { G.stats.bosses++; });
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
