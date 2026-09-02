/* =========================================================================
 * QW.Quests — görev motoru
 * Adımlar olay veriyoluna (bus) abone olarak kendiliğinden ilerler.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils;

  const Q = QW.Quests = { active: {}, done: {}, counters: {} };

  Q.reset = function () {
    Q.active = {}; Q.done = {}; Q.counters = {};
    Q.start('q_wake');
  };

  Q.start = function (id) {
    if (Q.active[id] || Q.done[id]) return false;
    const def = QW.QuestDB.get(id);
    if (!def) return false;
    Q.active[id] = { id, step: 0, prog: 0 };
    QW.Audio.sfx('quest');
    QW.HUD.toast(QW.t('q_new', { name: QW.L(def.name) }), 'good');
    Q.evaluate(id);
    return true;
  };

  Q.isActive = id => !!Q.active[id];
  Q.isDone = id => !!Q.done[id];

  Q.list = function () {
    return Object.keys(Q.active).map(id => {
      const def = QW.QuestDB.get(id), st = Q.active[id];
      const step = def.steps[st.step];
      return { def, st, step, need: step ? (step.n || 1) : 0, have: st.prog };
    });
  };

  /* Bir adımın mevcut ilerlemesini yeniden hesaplar */
  function stepProgress(step) {
    switch (step.type) {
      case 'collect': return QW.Inventory.count(step.target);
      case 'craft':   return Q.counters['craft_' + step.target] || 0;
      case 'kill':    return Q.counters['kill_' + step.target] || 0;
      case 'boss':    return QW.Game.flags['boss_' + step.target] ? 1 : 0;
      case 'visit':   return QW.Game.flags['visit_' + step.target] ? 1 : 0;
      case 'flag':    return QW.Game.flags[step.target] ? 1 : 0;
      default: return 0;
    }
  }

  Q.evaluate = function (id) {
    const st = Q.active[id]; if (!st) return;
    const def = QW.QuestDB.get(id);
    let guard = 0;
    while (st.step < def.steps.length && guard++ < 20) {
      const step = def.steps[st.step];
      const need = step.n || 1;
      st.prog = Math.min(need, stepProgress(step));
      if (st.prog >= need) { st.step++; st.prog = 0; }
      else break;
    }
    if (st.step >= def.steps.length) Q.complete(id);
  };

  Q.evaluateAll = function () { Object.keys(Q.active).forEach(Q.evaluate); };

  Q.complete = function (id) {
    const def = QW.QuestDB.get(id);
    if (!def || !Q.active[id]) return;
    delete Q.active[id];
    Q.done[id] = true;
    QW.Audio.sfx('quest');
    QW.HUD.toast(QW.t('q_complete', { name: QW.L(def.name) }), 'good');

    const r = def.reward || {};
    if (r.ec) QW.Player.addCredits(r.ec);
    if (r.items) Object.keys(r.items).forEach(k => QW.Inventory.add(k, r.items[k], true));
    if (r.unlock) QW.Crafting.unlock(r.unlock);
    if (r.codex) QW.Game.codexUnlock(r.codex);
    if (r.next) setTimeout(() => Q.start(r.next), 900);
    if (r.end) QW.bus.emit('game_end');
    QW.bus.emit('quest_done', id);
  };

  /* --------------------------------------------------------------------
   * OLAY BAĞLARI
   * ------------------------------------------------------------------ */
  Q.bind = function () {
    QW.bus.on('item_add', () => Q.evaluateAll());
    QW.bus.on('item_remove', () => Q.evaluateAll());
    QW.bus.on('flag', () => Q.evaluateAll());
    QW.bus.on('craft', (id, n) => {
      Q.counters['craft_' + id] = (Q.counters['craft_' + id] || 0) + (n || 1);
      Q.evaluateAll();
    });
    QW.bus.on('vehicle_built', id => {
      Q.counters['craft_veh_' + id] = 1; Q.evaluateAll();
    });
    QW.bus.on('enemy_killed', id => {
      Q.counters['kill_' + id] = (Q.counters['kill_' + id] || 0) + 1;
      Q.evaluateAll();
    });
    QW.bus.on('boss_killed', id => {
      QW.Game.setFlag('boss_' + id, true);
      const map = {
        boss_ice_worm: 'q_boss_glacier', boss_acid_golem: 'q_boss_swamp',
        boss_sand_leviathan: 'q_boss_desert', boss_spore_titan: 'q_boss_forest',
        boss_storm_harrier: 'q_boss_canyon'
      };
      if (map[id]) { Q.start(map[id]); Q.evaluate(map[id]); }
      Q.evaluateAll();
    });
    QW.bus.on('npc_met', npcId => {
      const def = QW.NPCs.get(npcId);
      if (def && def.quest) Q.start(def.quest);
      /* Saha görevleri: NPC tanıştıkça sırayla açılır */
      const field = QW.QuestDB.all().filter(id => QW.QuestDB.get(id).field);
      const next = field.find(id => !Q.active[id] && !Q.done[id]);
      if (next) Q.start(next);
    });
  };

  /* Takip edilen tek satırlık hedef (HUD) */
  Q.tracked = function () {
    const mains = Object.keys(Q.active).filter(id => QW.QuestDB.get(id).main);
    const id = mains[0] || Object.keys(Q.active)[0];
    if (!id) return null;
    const def = QW.QuestDB.get(id), st = Q.active[id];
    const step = def.steps[st.step];
    if (!step) return null;
    const need = step.n || 1;
    return {
      id, name: QW.L(def.name), text: QW.L(step.text),
      have: Math.min(need, stepProgress(step)), need
    };
  };

  Q.serialize = () => ({ active: U.deepCopy(Q.active), done: U.deepCopy(Q.done), counters: U.deepCopy(Q.counters) });
  Q.load = function (d) {
    Q.active = (d && d.active) || {};
    Q.done = (d && d.done) || {};
    Q.counters = (d && d.counters) || {};
  };

})(window.QW);
