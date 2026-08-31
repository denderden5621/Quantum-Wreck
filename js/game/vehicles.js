/* =========================================================================
 * QW.Vehicles — arazi rover'ı ve keşif İHA'sı
 *  Rover : dağ bisikleti dinamikleri (tek aynakol, mekanik disk fren,
 *          tırtıklı lastik) — bataklık ve gevşek kumda hız/koruma
 *  İHA   : çekişli pervane, batarya optimizasyonu — kanyon geçişi + tarama
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils;

  const DEFS = {
    rover: {
      id: 'rover', name: { tr: 'Arazi Rover\'ı', en: 'Terrain Rover' },
      dura: 120, battery: 100, drain: 1.6, speed: 1.55,
      caps: { allTerrain: true },
      parts: { tr: 'Tekli aynakol · mekanik disk fren · tırtıklı lastik',
               en: 'Single chainring · mechanical disc brakes · knobby tyres' }
    },
    drone: {
      id: 'drone', name: { tr: 'Keşif İHA\'sı', en: 'Exploration UAV' },
      dura: 70, battery: 100, drain: 5.5, speed: 1.9,
      caps: { fly: true, scan: true },
      parts: { tr: 'Çekişli pervane · uçuş kontrolcüsü · optimize batarya',
               en: 'Puller propeller · flight controller · optimised battery' }
    }
  };

  const V = QW.Vehicles = {
    owned: {},        // id -> { dura, duraMax, battery, batteryMax, broken }
    active: null      // sürülen aracın id'si
  };

  V.reset = function () { V.owned = {}; V.active = null; };

  V.def = id => DEFS[id];
  V.list = () => Object.keys(V.owned);
  V.get = id => V.owned[id];

  V.build = function (id) {
    const d = DEFS[id];
    if (!d) return false;
    V.owned[id] = { dura: d.dura, duraMax: d.dura, battery: d.battery, batteryMax: d.battery, broken: false };
    QW.HUD.toast(QW.t('craft_done', { name: QW.L(d.name) }), 'good');
    QW.Audio.sfx('craft');
    QW.Game.codexUnlock('c_vehicles');
    QW.bus.emit('vehicle_built', id);
    return true;
  };

  V.mount = function (id) {
    const v = V.owned[id];
    if (!v) return false;
    if (v.broken) { QW.HUD.toast(QW.t('veh_broken', { name: QW.L(DEFS[id].name) }), 'bad'); return false; }
    if (v.battery <= 0) { QW.HUD.toast(QW.t('veh_no_bat'), 'bad'); return false; }
    V.active = id;
    QW.Audio.sfx(id === 'drone' ? 'drone' : 'engine');
    QW.HUD.toast(QW.t('veh_mounted', { name: QW.L(DEFS[id].name) }), 'good');
    return true;
  };

  V.dismount = function () {
    if (!V.active) return;
    /* Uçarken uçurumun üstünde inilemez */
    const t = QW.Player.tilePos();
    if (!QW.World.canWalk(t.tx, t.ty, {})) {
      QW.HUD.toast(QW.t('block_chasm'), 'bad');
      return;
    }
    V.active = null;
    QW.Audio.sfx('back');
  };

  V.toggle = function (id) {
    if (V.active === id) V.dismount();
    else V.mount(id);
  };

  /* Aktif aracın yetenekleri — dünya geçiş kuralları bunu okur */
  V.caps = function () {
    const c = { speed: 1 };
    if (!V.active) return c;
    const d = DEFS[V.active];
    Object.assign(c, d.caps);
    c.speed = d.speed;
    return c;
  };

  V.tick = function (dt, moving) {
    if (!V.active) {
      /* Park hâlindeyken güneş filmi yavaşça şarj eder */
      Object.keys(V.owned).forEach(k => {
        const v = V.owned[k];
        v.battery = Math.min(v.batteryMax, v.battery + dt * 0.4);
      });
      return;
    }
    const id = V.active, d = DEFS[id], v = V.owned[id];
    if (moving) v.battery -= d.drain * dt;
    else v.battery -= d.drain * 0.25 * dt;

    /* Zorlu zeminde aşınma */
    const t = QW.Player.tilePos();
    const b = QW.World.biomeAt(t.tx, t.ty);
    if (moving && (b.key === 'swamp' || b.key === 'mountain' || b.key === 'canyon')) {
      v.dura -= dt * 0.7;
    }

    if (v.battery <= 0) {
      v.battery = 0;
      QW.HUD.toast(QW.t('veh_no_bat'), 'bad');
      forceDismount();
    }
    if (v.dura <= 0) {
      v.dura = 0; v.broken = true;
      QW.HUD.toast(QW.t('veh_broken', { name: QW.L(d.name) }), 'bad');
      forceDismount();
    }
  };

  /* Uçurumun üstünde batarya biterse en yakın zemine düşürülürsün */
  function forceDismount() {
    const t = QW.Player.tilePos();
    if (!QW.World.canWalk(t.tx, t.ty, {})) {
      let found = null;
      for (let r = 1; r < 14 && !found; r++) {
        for (let a = 0; a < 16; a++) {
          const ang = a / 16 * Math.PI * 2;
          const tx = Math.round(t.tx + Math.cos(ang) * r), ty = Math.round(t.ty + Math.sin(ang) * r);
          if (QW.World.canWalk(tx, ty, {})) { found = { tx, ty }; break; }
        }
      }
      if (found) {
        QW.Player.x = found.tx * QW.World.TILE + 8;
        QW.Player.y = found.ty * QW.World.TILE + 8;
        QW.Player.damage(12, 'fall');
      }
    }
    V.active = null;
  }

  V.recharge = function (id, n) {
    const v = V.owned[id]; if (!v) return;
    v.battery = Math.min(v.batteryMax, v.battery + n);
  };
  V.repair = function (id, n) {
    const v = V.owned[id]; if (!v) return false;
    v.dura = Math.min(v.duraMax, v.dura + n);
    if (v.dura > 0) v.broken = false;
    return true;
  };
  V.repairAny = function (n) {
    const ids = V.list().filter(k => V.owned[k].dura < V.owned[k].duraMax);
    if (!ids.length) {
      QW.Player.heal(n * 0.5);
      return false;
    }
    ids.sort((a, b) => V.owned[a].dura - V.owned[b].dura);
    V.repair(ids[0], n);
    QW.HUD.toast(QW.L(DEFS[ids[0]].name) + ' +' + n, 'good');
    return true;
  };
  /* Krank'ın dayanıklılık modülü */
  V.upgradeDurability = function (n) {
    const ids = V.list();
    if (!ids.length) return false;
    ids.forEach(k => { V.owned[k].duraMax += n; V.owned[k].dura = V.owned[k].duraMax; });
    return true;
  };

  /* Dron taraması — çevredeki kaynakları ve POI'leri açığa çıkarır */
  V.droneScan = function () {
    if (!V.owned.drone) { QW.HUD.toast(QW.t('need_drone'), 'bad'); return false; }
    const v = V.owned.drone;
    if (v.battery < 15) { QW.HUD.toast(QW.t('veh_no_bat'), 'bad'); return false; }
    v.battery -= 15;
    const t = QW.Player.tilePos();
    QW.World.discover(t.tx, t.ty, 40);
    QW.Audio.sfx('scan');
    QW.HUD.toast(QW.t('drone_scan'), 'info');
    return true;
  };

  V.draw = function (ctx, sx, sy, dir) {
    if (!V.active) return;
    /* Araç oyuncunun ayağının altına, gölgesiyle birlikte çizilir */
    const oy = V.active === 'drone' ? 9 : 7;
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(sx - 2, sy + oy + 9, 16, 2);
    QW.Sprites.vehicle(ctx, sx - 2, sy + oy, V.active, 1, dir === 'left');
  };

  V.serialize = () => ({ owned: U.deepCopy(V.owned), active: V.active });
  V.load = function (d) {
    V.reset();
    if (!d) return;
    V.owned = d.owned || {};
    V.active = d.active || null;
  };

  V.DEFS = DEFS;

})(window.QW);
