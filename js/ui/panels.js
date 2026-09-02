/* =========================================================================
 * QW.Panels — tam ekran arayüzler (envanter, tezgâh, harita, takas, ayarlar)
 * Tüm dokunmatik hedefler 44px üzeridir; liste alanı parmakla kaydırılır.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils;
  const Pn = QW.Panels = { open: null, ctx: {}, tab: null, sel: null };
  let el = {};

  Pn.init = function () {
    el.root = document.getElementById('panel');
    el.title = document.getElementById('panel-title');
    el.tabs = document.getElementById('panel-tabs');
    el.body = document.getElementById('panel-body');
    el.foot = document.getElementById('panel-foot');
    el.close = document.getElementById('panel-close');
    QW.Utils.tap(el.close, () => Pn.close());
  };

  /* ------------------------------ yardımcılar ------------------------------ */
  const tap = QW.Utils.tap;
  function elm(tag, cls, txt) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt !== undefined) n.textContent = txt;
    return n;
  }
  function iconNode(itemId) {
    const cv = QW.Sprites.iconCanvas(itemId, 32);
    const img = elm('img', 'ic');
    img.src = cv.toDataURL();
    return img;
  }
  function row(opts) {
    const r = elm('button', 'row' + (opts.dis ? ' dis' : '') + (opts.on ? ' on' : ''));
    if (opts.item) r.appendChild(iconNode(opts.item));
    else if (opts.iconEl) r.appendChild(opts.iconEl);
    const tx = elm('div', 'tx');
    tx.appendChild(elm('b', null, opts.title));
    if (opts.sub) tx.appendChild(elm('small', null, opts.sub));
    if (opts.sub2) tx.appendChild(elm('small', null, opts.sub2));
    r.appendChild(tx);
    if (opts.right) r.appendChild(elm('span', 'qt', opts.right));
    if (opts.fn) tap(r, opts.fn);
    return r;
  }
  function btn(label, fn, cls) {
    const b = elm('button', 'btn ' + (cls || ''), label);
    tap(b, fn);
    return b;
  }
  function sec(t) { return elm('div', 'sec', t); }
  function note(t, cls) { return elm('div', 'note ' + (cls || ''), t); }
  function statline(k, v) {
    const d = elm('div', 'statline');
    d.appendChild(elm('em', null, k));
    d.appendChild(elm('span', null, String(v)));
    return d;
  }
  Pn.row = row; Pn.btn = btn;

  function setTabs(list, cur, fn) {
    el.tabs.innerHTML = '';
    if (!list || !list.length) { el.tabs.style.display = 'none'; return; }
    el.tabs.style.display = '';
    list.forEach(t => {
      const b = elm('button', 'tab' + (t.id === cur ? ' on' : ''), t.label);
      tap(b, () => { QW.Audio.sfx('ui'); fn(t.id); });
      el.tabs.appendChild(b);
    });
  }

  /* ------------------------------ açma/kapama ------------------------------ */
  Pn.show = function (name, ctx) {
    Pn.open = name; Pn.ctx = ctx || {};
    Pn.sel = null;
    el.root.classList.remove('hidden');
    QW.Input.reset();
    QW.Input.showTouch(false);
    Pn.render();
  };
  Pn.close = function () {
    if (!Pn.open) return;
    QW.Audio.sfx('back');
    if (Pn.open === 'repair' && QW.Crafting.fault) QW.Crafting.endDiagnosis();
    Pn.open = null; Pn.ctx = {};
    el.root.classList.add('hidden');
    if (QW.Game.started && !QW.Scenes.is('battle')) QW.Input.showTouch(QW.Save.settings.touch);
    QW.bus.emit('panel_close');
  };
  Pn.isOpen = () => !!Pn.open;

  Pn.render = function () {
    if (!Pn.open) return;
    el.body.innerHTML = ''; el.foot.innerHTML = '';
    const fn = VIEWS[Pn.open];
    if (fn) fn();
  };

  /* =======================================================================
   * GÖRÜNÜMLER
   * ===================================================================== */
  const VIEWS = {};

  /* ------------------------------- ANA MENÜ ------------------------------ */
  VIEWS.menu = function () {
    el.title.textContent = QW.t('p_menu');
    setTabs(null);
    const items = [
      ['p_inventory', 'inventory'], ['p_craft', 'craft'], ['p_char', 'char'],
      ['p_quest', 'quest'], ['p_garage', 'garage'], ['p_repair', 'repair'],
      ['p_map', 'map'], ['p_syn', 'syn'], ['p_codex', 'codex'], ['p_log', 'log'], ['p_settings', 'settings']
    ];
    items.forEach(([k, v]) => {
      el.body.appendChild(row({ title: QW.t(k), fn: () => Pn.show(v) }));
    });
    el.foot.appendChild(btn(QW.t('set_save_now'), () => { QW.Save.write(); }, 'pri'));
    el.foot.appendChild(btn(QW.t('close'), () => Pn.close()));
  };

  /* ------------------------------- ENVANTER ------------------------------ */
  VIEWS.inventory = function () {
    el.title.textContent = QW.t('p_inventory') + '  ·  ' + QW.t('weight') + ' ' +
      QW.Inventory.weight() + '/' + QW.Inventory.capacity;
    const tabs = [['all', 'tab_all'], ['res', 'tab_res'], ['comp', 'tab_comp'], ['dev', 'tab_dev'],
                  ['gear', 'tab_gear'], ['use', 'tab_use'], ['media', 'tab_media'], ['key', 'tab_key']];
    const cur = Pn.tab && tabs.some(t => t[0] === Pn.tab) ? Pn.tab : 'all';
    setTabs(tabs.map(([id, k]) => ({ id, label: QW.t(k) })), cur, id => { Pn.tab = id; Pn.render(); });

    const list = QW.Inventory.list(cur);
    if (!list.length) { el.body.appendChild(note(QW.t('inv_empty'))); return; }
    list.forEach(id => {
      const it = QW.Items.get(id);
      const eq = QW.Inventory.isEquipped(id);
      el.body.appendChild(row({
        item: id,
        title: QW.Items.name(id) + (eq ? '  [' + QW.t('equipped') + ']' : ''),
        sub: QW.Items.desc(id),
        right: 'x' + QW.Inventory.count(id),
        on: eq,
        fn: () => itemActions(id)
      }));
    });
    if (QW.Inventory.overloaded()) el.foot.appendChild(note(QW.t('inv_full'), 'warn'));
  };

  function itemActions(id) {
    const it = QW.Items.get(id);
    const choices = [];
    if (it.slot) {
      if (QW.Inventory.isEquipped(id)) {
        if (it.slot !== 'suit' && it.slot !== 'weapon')
          choices.push({ label: QW.t('inv_unequip'), fn: () => { QW.Inventory.unequip(it.slot); Pn.render(); } });
      } else choices.push({ label: QW.t('inv_equip'), fn: () => { QW.Inventory.equip(id); Pn.render(); } });
    }
    if (it.use) choices.push({ label: QW.t('inv_use'), fn: () => { QW.Inventory.use(id); Pn.render(); } });
    if (it.cat === 'media') choices.push({ label: QW.t('inv_read'), fn: () => { QW.Inventory.use(id); Pn.render(); } });
    if (it.cat !== 'key' && it.cat !== 'gear')
      choices.push({ label: QW.t('inv_drop'), fn: () => { QW.Inventory.remove(id, 1); Pn.render(); } });
    choices.push({ label: QW.t('back') });
    QW.Dialog.say([QW.Items.name(id) + '\n' + QW.Items.desc(id)], { name: QW.t('p_inventory'), choices });
  }

  /* ------------------------------ ÇALIŞMA MASASI ------------------------- */
  VIEWS.craft = function () {
    el.title.textContent = QW.t('p_craft') + (QW.Game.atStationBench ? '  ★' : '');
    const tabs = [['elec', 'craft_tab_elec'], ['gear', 'craft_tab_gear'],
                  ['veh', 'craft_tab_veh'], ['med', 'craft_tab_med']];
    const cur = Pn.tab && tabs.some(t => t[0] === Pn.tab) ? Pn.tab : 'elec';
    setTabs(tabs.map(([id, k]) => ({ id, label: QW.t(k) })), cur, id => { Pn.tab = id; Pn.render(); });

    el.body.appendChild(note(QW.t('craft_bench_hint')));
    QW.Recipes.byCat(cur).forEach(r => {
      const st = QW.Crafting.canCraft(r.id);
      const needTxt = Object.keys(r.need).map(k =>
        QW.Items.name(k) + ' ' + QW.Inventory.count(k) + '/' + r.need[k]).join(' · ');
      const outId = r.vehicle ? null : r.out.id;
      el.body.appendChild(row({
        item: outId || 'frame_alloy',
        title: QW.L(r.name) + (r.lock && !QW.Crafting.isUnlocked(r.id) ? '  🔒' : ''),
        sub: QW.L(r.note) || '',
        sub2: QW.t('craft_need') + ': ' + needTxt,
        right: st.ok ? '✓' : '',
        dis: !st.ok,
        fn: () => {
          if (!QW.Crafting.isUnlocked(r.id)) {
            QW.Dialog.say([QW.t('craft_noskill') + '\n' + QW.t('craft_locked_hint')], { name: QW.L(r.name) });
            return;
          }
          const res = QW.Crafting.craft(r.id);
          if (res === 'broken') Pn.show('repair');
          else Pn.render();
        }
      }));
    });
  };

  /* --------------------------- ARIZA TESPİTİ (MULTİMETRE) ---------------- */
  VIEWS.repair = function () {
    el.title.textContent = QW.t('p_repair');
    setTabs(null);
    const F = QW.Crafting.fault;

    if (!F) {
      if (!QW.Crafting.broken.length) { el.body.appendChild(note(QW.t('repair_none'))); return; }
      el.body.appendChild(note(QW.t('mm_intro')));
      QW.Crafting.broken.forEach(b => {
        el.body.appendChild(row({
          item: b.item,
          title: QW.Items.name(b.item),
          sub: QW.t('device_broke', { name: QW.Items.name(b.item) }),
          fn: () => { if (QW.Crafting.startDiagnosis(b)) Pn.render(); }
        }));
      });
      return;
    }

    /* Aktif oturum */
    el.body.appendChild(note(QW.t('mm_intro')));
    el.body.appendChild(note(QW.t('mm_howto')));
    el.body.appendChild(note(QW.t('mm_probes', { n: F.probes }), F.probes ? 'good' : 'warn'));

    const board = elm('div', 'mm-board');
    F.nodes.forEach(nd => {
      const b = elm('button', 'mm-node' + (nd.probed ? ' probed' : '') +
        (F.done && nd.i === F.faultIndex ? ' bad' : '') +
        (F.done && nd.i !== F.faultIndex ? ' ok' : ''));
      const label = elm('b', null, QW.t('mm_node', { n: nd.i + 1 }));
      b.appendChild(label);
      if (nd.probed || F.done) {
        b.appendChild(elm('span', null, nd.v.toFixed(2) + ' ' + QW.t('mm_volt')));
        b.appendChild(elm('span', null, (nd.ohm === null ? 'OL' : nd.ohm) + ' ' + QW.t('mm_ohm')));
      } else {
        b.appendChild(elm('span', null, QW.t('mm_unmeasured')));
        b.appendChild(elm('span', null, F.probes > 0 ? QW.t('mm_measure') : QW.t('mm_accuse')));
      }
      tap(b, () => {
        if (F.done) return;
        if (!nd.probed && F.probes > 0) { QW.Crafting.probe(nd.i); Pn.render(); return; }
        /* Ölçülmüşse ya da prob bittiyse suçlama seçeneği */
        QW.Dialog.confirm(QW.t('mm_accuse') + ' — ' + QW.t('mm_node', { n: nd.i + 1 }) + '?',
          () => { QW.Crafting.accuse(nd.i); Pn.render(); });
      });
      board.appendChild(b);
    });
    el.body.appendChild(board);

    if (F.done) {
      el.body.appendChild(note(F.result === 'win' ? QW.t('mm_win') : QW.t('mm_lose'),
        F.result === 'win' ? 'good' : 'warn'));
      el.foot.appendChild(btn(QW.t('ok'), () => { QW.Crafting.endDiagnosis(); Pn.render(); }, 'pri'));
    } else {
      el.body.appendChild(note(QW.L({
        tr: 'İpucu: seri devrede gerilim düğüm düğüm düşer. Arızalı düğümden sonrası 0.00 V ve OL okur.',
        en: 'Hint: in a series circuit voltage drops node by node. Everything past the fault reads 0.00 V and OL.'
      })));
      el.foot.appendChild(btn(QW.t('cancel'), () => { QW.Crafting.endDiagnosis(); Pn.render(); }));
    }
  };

  /* -------------------------------- KARAKTER ----------------------------- */
  VIEWS.char = function () {
    const P = QW.Player, st = P.stats();
    el.title.textContent = QW.t('p_char') + ' · ' + P.name;
    setTabs(null);

    el.body.appendChild(sec(QW.t('cc_stats')));
    el.body.appendChild(statline(QW.t('st_hp'), Math.round(P.hp) + '/' + P.hpMax));
    el.body.appendChild(statline(QW.t('st_o2'), Math.round(P.o2) + '/' + P.o2MaxTotal()));
    el.body.appendChild(statline(QW.t('st_stamina'), Math.round(P.sta) + '/' + P.staMaxTotal()));
    el.body.appendChild(statline(QW.t('st_stress'), Math.round(P.stress) + '/' + P.stressMax));
    el.body.appendChild(statline(QW.t('st_atk'), st.atk));
    el.body.appendChild(statline(QW.t('st_def'), st.def));
    el.body.appendChild(statline(QW.t('st_spd'), st.spd.toFixed(2)));
    el.body.appendChild(statline(QW.t('st_regen'), st.regen.toFixed(2)));
    el.body.appendChild(statline(QW.t('st_heat'), st.heat));
    el.body.appendChild(statline('XP', P.xp + '/' + P.xpNext + '  (LV ' + P.level + ')'));
    el.body.appendChild(statline(QW.t('st_credits'), Math.floor(P.credits)));

    el.body.appendChild(sec(QW.t('tab_gear')));
    [['suit', 'st_def'], ['shirt', 'cc_shirt'], ['boots', 'cc_boots'], ['weapon', 'cb_attack']].forEach(([slot]) => {
      const id = P.equip[slot];
      el.body.appendChild(row({
        item: id || 'scrap',
        title: id ? QW.Items.name(id) : QW.t('none'),
        sub: id ? QW.Items.desc(id) : '',
        right: slot.toUpperCase(),
        fn: () => { Pn.tab = 'gear'; Pn.show('inventory'); }
      }));
    });

    const res = st.resist;
    el.body.appendChild(sec('RESIST'));
    Object.keys(res).forEach(k => {
      if (res[k] > 0) el.body.appendChild(statline(k.toUpperCase(), Math.round(res[k] * 100) + '%'));
    });
  };

  /* -------------------------------- GÖREVLER ----------------------------- */
  VIEWS.quest = function () {
    el.title.textContent = QW.t('p_quest');
    setTabs(null);
    const act = QW.Quests.list();
    el.body.appendChild(sec(QW.t('q_active')));
    if (!act.length) el.body.appendChild(note(QW.t('q_none')));
    act.forEach(q => {
      el.body.appendChild(row({
        iconEl: elm('div', 'ic'),
        title: QW.L(q.def.name),
        sub: QW.L(q.def.desc),
        sub2: (q.step ? QW.L(q.step.text) : '') + '  ' + QW.t('q_progress', { a: q.have, b: q.need })
          + rewardText(q.def)
      }));
    });
    const done = Object.keys(QW.Quests.done);
    if (done.length) {
      el.body.appendChild(sec(QW.t('q_done')));
      done.forEach(id => {
        const d = QW.QuestDB.get(id);
        if (d) el.body.appendChild(row({ iconEl: elm('div', 'ic'), title: '✓ ' + QW.L(d.name), dis: true }));
      });
    }
  };

  function rewardText(def) {
    const r = def.reward || {};
    const bits = [];
    if (r.ec) bits.push(r.ec + ' EC');
    if (r.items) Object.keys(r.items).forEach(k => bits.push(QW.Items.name(k) + ' x' + r.items[k]));
    if (r.unlock) { const rec = QW.Recipes.get(r.unlock); if (rec) bits.push('★ ' + QW.L(rec.name)); }
    return bits.length ? '   ' + QW.t('q_reward') + ': ' + bits.join(', ') : '';
  }

  /* --------------------------------- ARŞİV ------------------------------- */
  VIEWS.codex = function () {
    el.title.textContent = QW.t('p_codex');
    setTabs(null);
    const keys = Object.keys(QW.Game.codex).filter(k => QW.Game.codex[k]);
    if (!keys.length) { el.body.appendChild(note(QW.t('codex_none'))); return; }
    keys.forEach(k => {
      const c = QW.QuestDB.codex[k];
      if (!c) return;
      el.body.appendChild(row({
        iconEl: elm('div', 'ic'),
        title: QW.L(c.name),
        sub: QW.L(c.text)
      }));
    });
  };

  /* ------------------------------- SİNERJİLER ---------------------------- */
  VIEWS.syn = function () {
    el.title.textContent = QW.t('p_syn');
    setTabs(null);
    const active = QW.Synergies.active();
    const activeIds = new Set(active.map(a => a.id));

    if (!active.length) el.body.appendChild(note(QW.t('syn_none')));

    /* Bir adım kalanları öne çıkar — keşfi teşvik eden signposting */
    const near = QW.Synergies.nearMisses().filter(e => !activeIds.has(e.syn.id));
    if (near.length) {
      el.body.appendChild(sec(QW.t('syn_near')));
      near.forEach(e => {
        el.body.appendChild(row({
          iconEl: elm('div', 'ic'),
          title: QW.L(e.syn.name),
          sub: QW.L(e.syn.desc),
          sub2: QW.t('syn_close', { list: e.missing.join(', ') }),
          dis: true
        }));
      });
    }

    el.body.appendChild(sec(QW.t('p_syn')));
    QW.Synergies.list.forEach(x => {
      const on = activeIds.has(x.id);
      const needs = (x.need || []).map(i =>
        QW.Items.name(i) + ' ' + (QW.Inventory.has(i) ? '✓' : '✗'))
        .concat(x.veh ? [QW.L(QW.Vehicles.def(x.veh).name) + ' ' + (QW.Vehicles.get(x.veh) ? '✓' : '✗')] : []);
      el.body.appendChild(row({
        item: (x.need && x.need[0]) || 'esp32',
        title: QW.L(x.name),
        sub: QW.L(x.desc),
        sub2: needs.join('  ·  '),
        right: on ? QW.t('syn_on') : '',
        on, dis: !on
      }));
    });
  };

  /* ------------------------------- SAHA KAYDI ---------------------------- */
  VIEWS.log = function () {
    el.title.textContent = QW.t('p_log');
    setTabs(null);
    const G = QW.Game;
    el.body.appendChild(note(QW.t('log_deaths', { n: G.log.deaths }) + ' — ' + QW.t('log_pride')));
    const entries = G.logEntries();
    if (!entries.length) { el.body.appendChild(note(QW.t('log_none'))); return; }
    entries.forEach(e => {
      const bits = [QW.t('log_seen', { n: e.seen })];
      if (e.died) bits.push(QW.t('log_died', { n: e.died }));
      if (e.weak) bits.push(QW.Combat.weakName(e.def.weak));
      el.body.appendChild(row({
        iconEl: elm('div', 'ic'),
        title: QW.L(e.def.name) + '  LV' + e.def.lvl,
        sub: QW.L(e.def.desc),
        sub2: bits.join('  ·  '),
        right: e.adapt ? '+' + e.adapt + '%' : '',
        on: e.adapt > 0
      }));
    });
  };

  /* --------------------------------- HANGAR ------------------------------ */
  VIEWS.garage = function () {
    el.title.textContent = QW.t('p_garage');
    setTabs(null);
    const list = QW.Vehicles.list();
    if (!list.length) { el.body.appendChild(note(QW.t('veh_none'))); return; }
    list.forEach(id => {
      const d = QW.Vehicles.def(id), v = QW.Vehicles.get(id);
      const active = QW.Vehicles.active === id;
      el.body.appendChild(row({
        item: id === 'drone' ? 'prop_blade' : 'tire_knobby',
        title: QW.L(d.name) + (active ? '  ●' : ''),
        sub: QW.L(d.parts),
        sub2: QW.t('veh_battery') + ' ' + Math.round(v.battery) + '/' + v.batteryMax +
              '   ' + QW.t('veh_dura') + ' ' + Math.round(v.dura) + '/' + v.duraMax +
              (v.broken ? '  ⚠' : ''),
        right: active ? QW.t('veh_dismount') : QW.t('veh_mount'),
        on: active,
        fn: () => { QW.Vehicles.toggle(id); Pn.render(); }
      }));
    });
    if (QW.Vehicles.get('drone')) {
      el.foot.appendChild(btn(QW.t('drone_scan'), () => { QW.Vehicles.droneScan(); Pn.render(); }, 'pri'));
    }
    if (QW.Inventory.has('repair_kit')) {
      el.foot.appendChild(btn(QW.Items.name('repair_kit'), () => { QW.Inventory.use('repair_kit'); Pn.render(); }));
    }
  };

  /* --------------------------------- HARİTA ------------------------------ */
  VIEWS.map = function () {
    el.title.textContent = QW.t('p_map');
    setTabs(null);
    const size = Math.min(320, Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.78));
    const cv = elm('canvas'); cv.width = 160; cv.height = 160;
    cv.style.width = size + 'px'; cv.style.height = size + 'px';
    cv.style.imageRendering = 'pixelated';
    cv.style.display = 'block'; cv.style.margin = '0 auto';
    cv.style.border = '2px solid #26365c';
    const t = QW.Player.tilePos();
    QW.World.drawMinimap(cv, t.tx, t.ty, 300, false);
    el.body.appendChild(cv);

    /* Hava tahmini — yalnızca hava kalitesi sensörü varsa */
    el.body.appendChild(sec(QW.t('w_clear').toUpperCase()));
    if (QW.Crafting.hasPassive('forecast')) {
      const w = QW.Weather;
      if (w.current.id !== 'clear') {
        el.body.appendChild(note(QW.t('w_started', { w: QW.t(w.current.name) }), 'warn'));
      } else if (w.incoming) {
        el.body.appendChild(note(QW.t('w_incoming', {
          w: QW.t(w.incoming.type.name), n: Math.max(1, Math.round(w.timer / 6)) }), 'warn'));
      } else {
        el.body.appendChild(note(QW.t('w_clear'), 'good'));
      }
    } else {
      el.body.appendChild(note(QW.t('w_need_sensor')));
    }

    el.body.appendChild(sec(QW.t('p_map')));
    /* Keşfedilmiş her POI'ye tile cinsinden mesafe */
    QW.World.pois.forEach(p => {
      if (!QW.World.isDiscovered(p.x, p.y)) return;
      const d = Math.round(U.dist(t.tx, t.ty, p.x, p.y));
      el.body.appendChild(statline(QW.L(p.name), d + ' ◈'));
    });
    if (QW.Vehicles.get('drone')) {
      el.foot.appendChild(btn(QW.t('drone_scan'), () => { QW.Vehicles.droneScan(); Pn.render(); }, 'pri'));
    }
  };

  /* --------------------------------- TAKAS ------------------------------- */
  VIEWS.trade = function () {
    const npcId = Pn.ctx.npc;
    const npc = QW.NPCs.get(npcId);
    const st = QW.NPCState.of(npcId);
    el.title.textContent = QW.L(npc.name) + ' · ' + Math.floor(QW.Player.credits) + ' EC';

    const tabs = [{ id: 'barter', label: QW.t('trade_barter') },
                  { id: 'buy', label: QW.t('trade_buy') },
                  { id: 'sell', label: QW.t('trade_sell') }];
    if (npc.schematics) tabs.push({ id: 'schem', label: QW.t('craft_make') });
    const cur = Pn.tab && tabs.some(t => t.id === Pn.tab) ? Pn.tab : 'barter';
    setTabs(tabs, cur, id => { Pn.tab = id; Pn.render(); });

    if (cur === 'barter') {
      el.body.appendChild(note(QW.L(npc.lines.trade)));
      if (Array.isArray(npc.buys)) {
        el.body.appendChild(note(QW.t('trade_wants', {
          list: npc.buys.map(id => QW.Items.name(id)).join(', ') })));
      }
      (npc.barter || []).forEach((b, i) => {
        if (!b.give || (!b.get && !b.unlock)) return;
        const key = npcId + '_' + i;
        const done = b.once && st.doneBarters.indexOf(key) >= 0;
        const can = QW.Inventory.hasAll(b.give) && !done;
        const giveTxt = Object.keys(b.give).map(k =>
          QW.Items.name(k) + ' ' + QW.Inventory.count(k) + '/' + b.give[k]).join(' · ');
        el.body.appendChild(row({
          item: b.get ? b.get.id : 'card',
          title: QW.L(b.label) + (done ? '  ✓' : ''),
          sub: QW.t('trade_give') + ': ' + giveTxt,
          dis: !can,
          fn: () => doBarter(npcId, b, i)
        }));
      });
    }

    if (cur === 'buy') {
      (npc.shop || []).forEach(s => {
        const stock = st.stock[s.id] === undefined ? s.stock : st.stock[s.id];
        el.body.appendChild(row({
          item: s.id,
          title: QW.Items.name(s.id),
          sub: QW.Items.desc(s.id),
          right: QW.t('trade_price', { n: s.price }) + '  x' + stock,
          dis: stock <= 0 || QW.Player.credits < s.price,
          fn: () => {
            if (stock <= 0) { QW.HUD.toast(QW.t('trade_nostock'), 'bad'); return; }
            if (QW.Player.credits < s.price) { QW.HUD.toast(QW.t('trade_nocredit'), 'bad'); QW.Audio.sfx('deny'); return; }
            if (!QW.Inventory.canAccept(s.id, 1)) { QW.HUD.toast(QW.t('inv_full'), 'bad'); QW.Audio.sfx('deny'); return; }
            QW.Player.addCredits(-s.price);
            st.stock[s.id] = stock - 1;
            QW.Inventory.add(s.id, 1);
            QW.Audio.sfx('ok');
            Pn.render();
          }
        }));
      });
    }

    if (cur === 'sell') {
      const buys = npc.buys;
      const list = QW.Inventory.list().filter(id => {
        const it = QW.Items.get(id);
        if (it.cat === 'key') return false;
        if (QW.Inventory.isEquipped(id)) return false;
        return buys === '*' || (Array.isArray(buys) && buys.indexOf(id) >= 0);
      });
      if (!list.length) el.body.appendChild(note(QW.t('trade_cant')));
      list.forEach(id => {
        const it = QW.Items.get(id);
        const price = Math.max(1, Math.round(it.value * (buys === '*' ? 0.5 : 0.75)));
        el.body.appendChild(row({
          item: id,
          title: QW.Items.name(id),
          sub: QW.t('trade_price', { n: price }),
          right: 'x' + QW.Inventory.count(id),
          fn: () => {
            QW.Inventory.remove(id, 1, true);
            QW.Player.addCredits(price);
            QW.Audio.sfx('ok');
            QW.HUD.toast('+' + price + ' EC', 'good');
            Pn.render();
          }
        }));
      });
    }

    if (cur === 'schem') {
      (npc.schematics || []).forEach(s => {
        const r = QW.Recipes.get(s.unlock);
        const owned = QW.Crafting.isUnlocked(s.unlock);
        el.body.appendChild(row({
          item: r.vehicle ? 'frame_alloy' : r.out.id,
          title: QW.L(r.name) + (owned ? '  ✓' : ''),
          sub: QW.L(r.note) || '',
          right: owned ? '' : QW.t('trade_price', { n: s.price }),
          dis: owned || QW.Player.credits < s.price,
          fn: () => {
            if (owned) return;
            if (QW.Player.credits < s.price) { QW.HUD.toast(QW.t('trade_nocredit'), 'bad'); return; }
            QW.Player.addCredits(-s.price);
            QW.Crafting.unlock(s.unlock);
            Pn.render();
          }
        }));
      });
    }

    if (npc.bench) el.foot.appendChild(btn(QW.t('p_craft'), () => { Pn.show('craft'); }, 'pri'));
    el.foot.appendChild(btn(QW.t('close'), () => Pn.close()));
  };

  function doBarter(npcId, b, i) {
    const st = QW.NPCState.of(npcId);
    const key = npcId + '_' + i;
    if (b.once && st.doneBarters.indexOf(key) >= 0) return;
    if (!QW.Inventory.hasAll(b.give)) {
      QW.Audio.sfx('deny'); QW.HUD.toast(QW.t('trade_cant'), 'bad'); return;
    }
    if (b.get && !QW.Inventory.canAccept(b.get.id, b.get.n || 1)) {
      QW.Audio.sfx('deny'); QW.HUD.toast(QW.t('inv_full'), 'bad'); return;
    }
    QW.Inventory.consumeAll(b.give);
    if (b.special === 'dura') {
      if (!QW.Vehicles.upgradeDurability(40)) QW.HUD.toast(QW.t('veh_none'), 'bad');
      else QW.HUD.toast('+40 ' + QW.t('veh_dura'), 'good');
    } else if (b.unlock) {
      QW.Crafting.unlock(b.unlock);
    } else if (b.get) {
      QW.Inventory.add(b.get.id, b.get.n || 1);
    }
    st.doneBarters.push(key);
    QW.Audio.sfx('ok');
    QW.HUD.toast(QW.t('trade_done'), 'good');
    Pn.render();
  }

  /* -------------------------------- AYARLAR ------------------------------ */
  VIEWS.settings = function () {
    el.title.textContent = QW.t('p_settings');
    setTabs(null);
    const S = QW.Save.settings;

    const langRow = elm('div', 'row');
    langRow.appendChild(elm('div', 'tx')).appendChild(elm('b', null, QW.t('set_lang')));
    const sw = elm('div', 'swatches');
    ['tr', 'en'].forEach(l => {
      const b = elm('button', 'btn' + (QW.I18N.lang === l ? ' pri' : ''), l === 'tr' ? 'Türkçe' : 'English');
      tap(b, () => {
        QW.I18N.setLang(l); S.lang = l; QW.Save.saveSettings();
        QW.Audio.sfx('ok'); Pn.render();
      });
      sw.appendChild(b);
    });
    langRow.appendChild(sw);
    el.body.appendChild(langRow);

    const toggles = [
      ['sound', 'set_sound', v => QW.Audio.setEnabled(v)],
      ['music', 'set_music', v => QW.Audio.setMusic(v)],
      ['shake', 'set_shake', null],
      ['scanlines', 'set_scanline', v => QW.HUD.setScanlines(v)],
      ['autosave', 'set_autosave', null],
      ['touch', 'set_touch', v => QW.Input.showTouch(v)],
      ['assist', 'set_assist', v => QW.HUD.toast(QW.t(v ? 'assist_on' : 'assist_off'), 'info')]
    ];
    toggles.forEach(([k, label, fn]) => {
      el.body.appendChild(row({
        iconEl: elm('div', 'ic'),
        title: QW.t(label),
        right: S[k] ? QW.t('set_on') : QW.t('set_off'),
        on: !!S[k],
        fn: () => {
          S[k] = !S[k];
          if (fn) fn(S[k]);
          QW.Save.saveSettings();
          QW.Audio.sfx('ui');
          Pn.render();
        }
      }));
    });

    el.body.appendChild(note(QW.t('assist_desc')));
    el.body.appendChild(note(QW.t('keys_hint')));
    el.foot.appendChild(btn(QW.t('set_save_now'), () => QW.Save.write(), 'pri'));
    el.foot.appendChild(btn(QW.t('set_to_menu'), () => {
      QW.Dialog.confirm(QW.t('set_to_menu_q'), () => { Pn.close(); QW.Game.toTitle(); });
    }, 'dan'));
  };

  /* ------------------------------ KAMP ATEŞİ ----------------------------- */
  VIEWS.rest = function () {
    el.title.textContent = QW.t('p_rest');
    setTabs(null);
    el.body.appendChild(note(QW.t('rest_title')));
    el.body.appendChild(row({
      iconEl: elm('div', 'ic'),
      title: QW.t('rest_sleep'),
      sub: QW.t('rest_slept'),
      fn: () => {
        const P = QW.Player;
        P.hp = P.hpMax; P.sta = P.staMaxTotal(); P.o2 = P.o2MaxTotal();
        P.addStress(-25); P.cold = 0;
        QW.World.time = 0.30;
        QW.World.day++;
        QW.NPCState.restock();
        QW.Audio.sfx('heal');
        QW.HUD.toast(QW.t('rest_slept'), 'good');
        Pn.close();
      }
    }));

    const media = QW.Inventory.list('media');
    el.body.appendChild(sec(QW.t('rest_read')));
    if (!media.length) el.body.appendChild(note(QW.t('rest_nomedia')));
    media.forEach(id => {
      const it = QW.Items.get(id);
      el.body.appendChild(row({
        item: id,
        title: QW.Items.name(id),
        sub: QW.Items.desc(id),
        right: '-' + it.stress + ' ' + QW.t('st_stress'),
        fn: () => { QW.Inventory.use(id); Pn.render(); }
      }));
    });
    el.foot.appendChild(btn(QW.t('rest_leave'), () => Pn.close()));
  };

})(window.QW);
