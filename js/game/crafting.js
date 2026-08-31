/* =========================================================================
 * QW.Crafting — çalışma masası, şema kilitleri, cihaz pasifleri,
 *               multimetre ile arıza tespiti (mini-oyun)
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils;

  const C = QW.Crafting = {
    unlocked: {},      // kilitli şemalar için { recipeId: true }
    broken: [],        // [{ uid, item, recipe }] onarım bekleyen cihazlar
    fault: null        // aktif multimetre oturumu
  };

  C.reset = function () { C.unlocked = {}; C.broken = []; C.fault = null; };

  C.isUnlocked = function (rid) {
    const r = QW.Recipes.get(rid);
    if (!r) return false;
    return !r.lock || !!C.unlocked[rid];
  };
  C.unlock = function (rid) {
    const r = QW.Recipes.get(rid);
    if (!r || C.unlocked[rid]) return false;
    C.unlocked[rid] = true;
    QW.Audio.sfx('quest');
    QW.HUD.toast(QW.t('craft_done', { name: QW.L(r.name) }) + ' ★', 'good');
    return true;
  };

  /* Envanterdeki sağlam cihazların pasif yetenekleri */
  C.hasPassive = function (name) {
    return QW.Inventory.list('dev').some(id => {
      const it = QW.Items.get(id);
      return it && it.passive === name;
    });
  };
  C.hasDevice = id => QW.Inventory.has(id);

  C.canCraft = function (rid) {
    const r = QW.Recipes.get(rid);
    if (!r) return { ok: false, why: 'none' };
    if (!C.isUnlocked(rid)) return { ok: false, why: 'lock' };
    if (r.bench === 'station' && !QW.Game.atStationBench) return { ok: false, why: 'bench' };
    if (!QW.Inventory.hasAll(r.need)) return { ok: false, why: 'mat' };
    /* Sonucu taşıyamayacaksan malzemeyi harcama */
    if (!r.vehicle && !QW.Inventory.canAccept(r.out.id, r.out.n || 1)) return { ok: false, why: 'full' };
    return { ok: true };
  };

  C.craft = function (rid) {
    const r = QW.Recipes.get(rid);
    const chk = C.canCraft(rid);
    if (!chk.ok) {
      QW.Audio.sfx('deny');
      QW.HUD.toast(QW.t(chk.why === 'lock' ? 'craft_noskill'
        : chk.why === 'bench' ? 'craft_bench_hint'
        : chk.why === 'full' ? 'inv_full' : 'craft_missing'), 'bad');
      return false;
    }
    QW.Inventory.consumeAll(r.need);

    /* Üretim arızası — cihaz üretilir ama bozuk çıkar */
    if (r.fail && Math.random() < r.fail) {
      const uid = U.uid('brk');
      C.broken.push({ uid, item: r.out.id, recipe: rid });
      QW.Audio.sfx('deny');
      QW.HUD.toast(QW.t('device_broke', { name: QW.Items.name(r.out.id) }), 'bad');
      return 'broken';
    }

    if (r.vehicle) {
      QW.Vehicles.build(r.vehicle);
    } else {
      QW.Inventory.add(r.out.id, r.out.n || 1, true);
    }
    QW.Audio.sfx('craft');
    QW.HUD.toast(QW.t('craft_done', { name: QW.L(r.name) }), 'good');
    QW.bus.emit('craft', r.out.id, r.out.n || 1);
    return true;
  };

  /* Fırtınada cihazlar bozulabilir — onarım döngüsünü canlı tutar */
  C.stormStress = function () {
    const devs = QW.Inventory.list('dev');
    if (!devs.length) return;
    if (Math.random() > 0.22) return;
    const id = U.pick(devs);
    QW.Inventory.remove(id, 1, true);
    C.broken.push({ uid: U.uid('brk'), item: id, recipe: null });
    QW.Audio.sfx('deny');
    QW.HUD.toast(QW.t('device_broke', { name: QW.Items.name(id) }), 'bad');
  };

  /* =====================================================================
   * MULTİMETRE MİNİ-OYUNU
   * Devre seri bağlıdır: gerilim düğüm düğüm düşer. Arızalı düğümden
   * SONRAKİ tüm düğümler 0.00 V okur (açık devre). Üç prob hakkıyla
   * ikili aramayla arızayı bulmak gerekir.
   * =================================================================== */
  C.startDiagnosis = function (entry) {
    if (!C.hasPassive('repair')) {
      QW.HUD.toast(QW.t('cb_need_dev', { name: QW.Items.name('multimeter') }), 'bad');
      return null;
    }
    const n = 6;
    const f = U.irange(1, n - 1);
    const nodes = [];
    let v = 12.0;
    for (let i = 0; i < n; i++) {
      const drop = 1.4 + Math.random() * 0.8;
      const alive = i < f;
      nodes.push({
        i,
        v: alive ? Math.max(0.4, v) : 0,
        ohm: alive ? Math.round(80 + Math.random() * 160) : null,  // null = OL (açık devre)
        probed: false, flagged: false
      });
      v -= drop;
    }
    C.fault = { entry, nodes, faultIndex: f, probes: 3, done: false, result: null };
    return C.fault;
  };

  C.probe = function (i) {
    const F = C.fault;
    if (!F || F.done) return;
    const nd = F.nodes[i];
    if (nd.probed) return;
    if (F.probes <= 0) { QW.Audio.sfx('deny'); return; }
    nd.probed = true; F.probes--;
    QW.Audio.sfx('beep');
  };

  C.accuse = function (i) {
    const F = C.fault;
    if (!F || F.done) return null;
    F.done = true;
    if (i === F.faultIndex) {
      F.result = 'win';
      QW.Audio.sfx('craft');
      /* Onarılan cihaz envantere döner */
      QW.Inventory.add(F.entry.item, 1, true);
      C.broken = C.broken.filter(b => b.uid !== F.entry.uid);
      QW.HUD.toast(QW.t('mm_win'), 'good');
    } else {
      F.result = 'lose';
      QW.Audio.sfx('explode');
      C.broken = C.broken.filter(b => b.uid !== F.entry.uid);
      /* Parçaların bir kısmı geri gelir */
      const r = F.entry.recipe && QW.Recipes.get(F.entry.recipe);
      if (r) {
        Object.keys(r.need).forEach(k => {
          const back = Math.floor(r.need[k] / 2);
          if (back > 0) QW.Inventory.add(k, back, true);
        });
      }
      QW.HUD.toast(QW.t('mm_lose'), 'bad');
    }
    return F.result;
  };

  C.endDiagnosis = function () { C.fault = null; };

  C.serialize = () => ({ unlocked: U.deepCopy(C.unlocked), broken: U.deepCopy(C.broken) });
  C.load = function (d) {
    C.reset();
    if (!d) return;
    C.unlocked = d.unlocked || {};
    C.broken = d.broken || [];
  };

})(window.QW);
