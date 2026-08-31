/* =========================================================================
 * QW.Inventory — taşıma, kuşanma, kullanma
 * Ağırlık sınırı vardır; aşıldığında hız düşer (yük cezası).
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils;

  const Inv = QW.Inventory = {
    slots: {},          // itemId -> adet
    capacity: 60        // kg
  };

  Inv.reset = function () {
    Inv.slots = {};
    /* Enkazdan kurtarılanlar */
    Inv.add('scrap', 5, true);
    Inv.add('silicon', 2, true);
    Inv.add('copper', 2, true);
    Inv.add('medkit', 2, true);
    Inv.add('o2_canister', 1, true);
    Inv.add('ration', 3, true);
    Inv.add('suit_basic', 1, true);
    Inv.add('cutter', 1, true);
  };

  Inv.count = id => Inv.slots[id] || 0;
  Inv.has = (id, n) => Inv.count(id) >= (n || 1);
  Inv.hasAll = function (need) {
    return Object.keys(need).every(k => Inv.count(k) >= need[k]);
  };
  Inv.list = function (cat) {
    return Object.keys(Inv.slots)
      .filter(id => Inv.slots[id] > 0 && QW.Items.get(id))
      .filter(id => !cat || cat === 'all' || QW.Items.get(id).cat === cat)
      .sort((a, b) => {
        const A = QW.Items.get(a), B = QW.Items.get(b);
        if (A.cat !== B.cat) return A.cat < B.cat ? -1 : 1;
        return QW.Items.name(a).localeCompare(QW.Items.name(b));
      });
  };

  Inv.weight = function () {
    let w = 0;
    Object.keys(Inv.slots).forEach(id => {
      const it = QW.Items.get(id);
      if (it) w += (it.w || 0.2) * Inv.slots[id];
    });
    return Math.round(w * 10) / 10;
  };
  /* Kapasitenin üstü yasak değil, cezalıdır: hız düşer. Sert sınır 1.5 katıdır. */
  Inv.overloaded = () => Inv.weight() > Inv.capacity;
  Inv.hardLimit = () => Inv.capacity * 1.5;

  /* Bir eşya alınabilir mi? Görev eşyaları asla reddedilmez. */
  Inv.canAccept = function (id, n) {
    const it = QW.Items.get(id);
    if (!it) return false;
    if (it.cat === 'key') return true;
    return Inv.weight() + (it.w || 0.2) * (n || 1) <= Inv.hardLimit();
  };

  Inv.add = function (id, n, silent) {
    if (!QW.Items.get(id)) return false;
    n = n || 1;
    if (!Inv.canAccept(id, n)) {
      /* Sessiz eklemede bile uyar — yoksa eşya sessizce buharlaşır */
      QW.HUD.toast(QW.t('inv_full') + ' (' + QW.Items.name(id) + ')', 'bad');
      QW.Audio.sfx('deny');
      return false;
    }
    Inv.slots[id] = (Inv.slots[id] || 0) + n;
    if (!silent) {
      QW.HUD.toast(QW.t('got_item', { n, name: QW.Items.name(id) }), 'good');
      QW.Audio.sfx('pickup');
    }
    QW.bus.emit('item_add', id, n);
    return true;
  };

  Inv.remove = function (id, n, silent) {
    n = n || 1;
    if (Inv.count(id) < n) return false;
    Inv.slots[id] -= n;
    if (Inv.slots[id] <= 0) {
      delete Inv.slots[id];
      /* Kuşanılı eşya tükendiyse çıkar */
      Object.keys(QW.Player.equip).forEach(s => {
        if (QW.Player.equip[s] === id) QW.Player.equip[s] = (s === 'suit' || s === 'weapon') ? QW.Player.equip[s] : null;
      });
    }
    if (!silent) QW.HUD.toast(QW.t('lost_item', { n, name: QW.Items.name(id) }), 'info');
    QW.bus.emit('item_remove', id, n);
    return true;
  };

  Inv.consumeAll = function (need) {
    if (!Inv.hasAll(need)) return false;
    Object.keys(need).forEach(k => Inv.remove(k, need[k], true));
    return true;
  };

  /* Ölümde hammaddenin bir kısmı kaybolur (görev ve kuşam eşyaları hariç) */
  Inv.loseRandom = function (frac) {
    const lost = [];
    Inv.list().forEach(id => {
      const it = QW.Items.get(id);
      if (it.cat === 'key' || it.cat === 'gear' || it.cat === 'dev') return;
      const n = Math.floor(Inv.slots[id] * frac);
      if (n > 0) { Inv.remove(id, n, true); lost.push(QW.Items.name(id) + ' x' + n); }
    });
    return lost;
  };

  /* ---------------------------------------------------------------
   * KUŞANMA
   * ------------------------------------------------------------- */
  Inv.equip = function (id) {
    const it = QW.Items.get(id);
    if (!it || !it.slot || !Inv.has(id)) return false;
    QW.Player.equip[it.slot] = id;
    QW.Player.sta = Math.min(QW.Player.sta, QW.Player.staMaxTotal());
    QW.Audio.sfx('ok');
    QW.bus.emit('equip', it.slot, id);
    return true;
  };
  Inv.unequip = function (slot) {
    if (slot === 'suit' || slot === 'weapon') return false; // çıplak kalma
    QW.Player.equip[slot] = null;
    QW.Audio.sfx('back');
    return true;
  };
  Inv.isEquipped = id => Object.keys(QW.Player.equip).some(s => QW.Player.equip[s] === id);

  /* ---------------------------------------------------------------
   * KULLANMA
   * ------------------------------------------------------------- */
  Inv.use = function (id) {
    const it = QW.Items.get(id);
    if (!it || !Inv.has(id)) return false;
    const P = QW.Player;

    if (it.cat === 'media') {
      QW.HUD.toast(QW.t('rest_read_ok', { name: QW.Items.name(id), n: it.stress }), 'good');
      P.addStress(-it.stress);
      QW.Audio.sfx('heal');
      return true;   // medya tükenmez
    }
    if (!it.use) return false;

    const u = it.use;
    if (u.deploy === 'beacon') {
      if (!QW.World.placeBeacon()) return false;
      Inv.remove(id, 1, true);
      QW.Audio.sfx('craft');
      return true;
    }
    if (u.codex) {
      QW.Game.codexUnlock(u.codex);
      QW.HUD.toast(QW.t('log_read'), 'good');
      QW.Audio.sfx('quest');
      return true;   // gemi kaydı tükenmez
    }
    if (u.hp) P.heal(u.hp);
    if (u.o2) P.addO2(u.o2);
    if (u.sta) P.addSta(u.sta);
    if (u.stress) P.addStress(u.stress);
    if (u.rad) P.rad = 0;
    if (u.heat) P.cold = Math.max(0, P.cold - 60);
    if (u.repair) QW.Vehicles.repairAny(u.repair);
    if (id === 'stim') P.addStress(6);

    Inv.remove(id, 1, true);
    QW.Audio.sfx('heal');
    QW.bus.emit('item_use', id);
    return true;
  };

  /* Savaşta kullanılabilecek sarf listesi */
  Inv.battleItems = function () {
    return Inv.list('use').filter(id => {
      const u = QW.Items.get(id).use || {};
      return u.hp || u.sta || u.o2 || u.rad;
    });
  };

  Inv.serialize = () => ({ slots: U.deepCopy(Inv.slots) });
  Inv.load = function (d) { Inv.slots = (d && d.slots) || {}; };

})(window.QW);
