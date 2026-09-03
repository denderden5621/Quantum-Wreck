/* =========================================================================
 * QW.Entities — gezinen düşmanlar, kamp NPC'leri, yer ganimetleri
 * Düşmanlar oyuncunun çevresinde biyoma ve saate göre dinamik doğar.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils, Wd = QW.World;

  const En = QW.Entities = { list: [], spawnT: 0, maxE: 7 };

  En.reset = function () { En.list = []; En.spawnT = 1.5; };

  En.clearEnemies = function () { En.list = En.list.filter(e => e.type !== 'enemy'); };

  /* ---------------------------------------------------------------
   * DOĞMA
   * ------------------------------------------------------------- */
  function spawnEnemy() {
    const S = QW.Pixel.Screen;
    const P = QW.Player;
    const night = Wd.isNight();
    /* Ekran dışında ama yakın bir nokta seç */
    for (let tries = 0; tries < 14; tries++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.max(S.w, S.h) * 0.6 + Math.random() * 70;
      const x = P.x + Math.cos(ang) * dist;
      const y = P.y + Math.sin(ang) * dist;
      const tx = Math.floor(x / Wd.TILE), ty = Math.floor(y / Wd.TILE);
      if (!Wd.canWalk(tx, ty, {})) continue;
      const biome = Wd.biomeKeyAt(tx, ty);
      if (biome === 'wreck') continue;
      /* Kampların yakınında düşman doğmaz */
      const poi = Wd.poiNear(tx, ty, 8);
      if (poi && (poi.kind === 'camp' || poi.kind === 'station')) continue;
      const pool = QW.Enemies.pool(biome, night, P.level);
      if (!pool.length) continue;
      const def = QW.Enemies.get(U.pick(pool));
      En.list.push(makeEnemy(def, x, y));
      return;
    }
  }

  function makeEnemy(def, x, y) {
    const lvlScale = 1 + Math.max(0, QW.Player.level - def.lvl) * 0.06;
    return {
      type: 'enemy', def, x, y,
      hp: Math.round(def.hp * lvlScale), hpMax: Math.round(def.hp * lvlScale),
      dir: 'down', frame: 0, t: Math.random() * 3,
      vx: 0, vy: 0, state: 'wander', cool: 0, flip: false,
      path: null, pathI: 0, repathT: Math.random() * 0.6, stuckT: 0,
      lastD: Infinity, noProgressT: 0
    };
  }

  /* Bölge hâkimi ini — oyuncu girince özel savaş */
  En.spawnBossAt = function (poi) {
    const def = QW.Enemies.get(poi.boss);
    if (!def) return null;
    const e = makeEnemy(def, poi.x * Wd.TILE + 8, poi.y * Wd.TILE + 8);
    e.boss = true; e.poi = poi.id;
    return e;
  };

  /* ---------------------------------------------------------------
   * GÜNCELLEME
   * ------------------------------------------------------------- */
  En.update = function (dt, onEncounter) {
    const P = QW.Player;
    const S = QW.Pixel.Screen;

    /* Doğma sayacı */
    En.spawnT -= dt;
    const cnt = En.list.filter(e => e.type === 'enemy').length;
    if (En.spawnT <= 0) {
      En.spawnT = 2.5 + Math.random() * 3;
      const limit = Wd.isNight() ? En.maxE : En.maxE - 2;
      if (cnt < limit) spawnEnemy();
    }

    const keep = [];
    for (const e of En.list) {
      const d = U.dist(e.x, e.y, P.x, P.y);

      /* Çok uzaklaşanı sil */
      if (e.type === 'enemy' && d > Math.max(S.w, S.h) * 1.6) continue;

      if (e.type === 'enemy') {
        e.t += dt;
        e.cool = Math.max(0, e.cool - dt);
        e.repathT -= dt;
        const aggro = 62 + (Wd.isNight() ? 30 : 0);
        if (d < aggro) {
          e.state = 'chase';
          chase(e, dt);
        } else {
          e.path = null;
          if (e.t > 2.2) {
            e.t = 0;
            const ang = Math.random() * Math.PI * 2;
            const sp = 8 + Math.random() * 8;
            e.vx = Math.cos(ang) * sp; e.vy = Math.sin(ang) * sp;
          }
          e.state = 'wander';
          moveEntity(e, dt);
        }
        e.frame = 0;
        e.flip = e.vx < 0;

        /* Temas → savaş */
        if (d < 11 && QW.Player.invuln <= 0) {
          onEncounter(e);
          continue;
        }
      }
      keep.push(e);
    }
    En.list = keep;
  };

  /* Kovalama: önce ucuz yol (doğrudan yürüme), engele takılınca A*.
     Takılma hem yol takibinde hem düz yürümede ölçülür — eskiden düz
     yürürken engele çarpan yaratık bunu hiç fark etmiyordu. */
  function chase(e, dt) {
    const P = QW.Player;
    const sp = 16 + e.def.spd * 1.8;
    const etx = Math.floor(e.x / Wd.TILE), ety = Math.floor(e.y / Wd.TILE);
    const ptx = Math.floor(P.x / Wd.TILE), pty = Math.floor(P.y / Wd.TILE);

    /* Aktif bir yol varsa onu takip et */
    if (e.path && e.pathI < e.path.length) {
      const w = e.path[e.pathI];
      const wx = w.x * Wd.TILE + Wd.TILE / 2, wy = w.y * Wd.TILE + Wd.TILE / 2;
      if (Math.hypot(wx - e.x, wy - e.y) < 6) {
        e.pathI++;
      } else {
        const ang = Math.atan2(wy - e.y, wx - e.x);
        e.vx = Math.cos(ang) * sp; e.vy = Math.sin(ang) * sp;
      }
      if (!moveEntity(e, dt)) {
        e.stuckT += dt;
        if (e.stuckT > 0.4) { e.path = null; e.repathT = 0; e.stuckT = 0; }
      } else e.stuckT = 0;

      /* Oyuncu yeterince yer değiştirdiyse yolu tazele */
      if (e.pathGoal && Math.abs(e.pathGoal.x - ptx) + Math.abs(e.pathGoal.y - pty) > 4) e.path = null;
      return;
    }

    /* Yol yok — doğrudan yürümeyi dene */
    const ang = Math.atan2(P.y - e.y, P.x - e.x);
    e.vx = Math.cos(ang) * sp; e.vy = Math.sin(ang) * sp;
    const moved = moveEntity(e, dt);

    /* "Hareket etti" yetmez: duvara sürtünerek kayan yaratık da hareket eder.
       Asıl ölçüt hedefe yaklaşmak. */
    const dNow = U.dist(e.x, e.y, P.x, P.y);
    if (dNow < e.lastD - 0.5) { e.lastD = dNow; e.noProgressT = 0; }
    else e.noProgressT += dt;

    if (moved && e.noProgressT < 0.45) { e.stuckT = 0; return; }

    /* İlerleme yok ya da engele çarptı: yol bul */
    e.stuckT += dt;
    if ((e.stuckT > 0.2 || e.noProgressT >= 0.45) && e.repathT <= 0) {
      e.stuckT = 0; e.noProgressT = 0; e.lastD = Infinity;
      e.repathT = 0.6 + Math.random() * 0.3;
      e.path = QW.Path.find(etx, ety, ptx, pty, {}, { maxNodes: 500, maxRange: 34 });
      e.pathI = 0;
      e.pathGoal = { x: ptx, y: pty };
      /* Yol da yoksa duvar boyunca kay: hedefe en yakın ekseni koru */
      if (!e.path) {
        if (Math.abs(P.x - e.x) > Math.abs(P.y - e.y)) e.vy = (Math.random() < 0.5 ? -1 : 1) * sp;
        else e.vx = (Math.random() < 0.5 ? -1 : 1) * sp;
        moveEntity(e, dt);
      }
    }
  }

  function moveEntity(e, dt) {
    const nx = e.x + e.vx * dt, ny = e.y + e.vy * dt;
    /* Eksenleri ayrı dene: köşelere sürtünerek kayabilsin */
    let moved = false;
    if (Wd.canWalk(Math.floor(nx / Wd.TILE), Math.floor(e.y / Wd.TILE), {})) { e.x = nx; moved = true; }
    if (Wd.canWalk(Math.floor(e.x / Wd.TILE), Math.floor(ny / Wd.TILE), {})) { e.y = ny; moved = true; }
    if (!moved && e.state === 'wander') { e.vx = -e.vx; e.vy = -e.vy; }
    return moved;
  }

  /* ---------------------------------------------------------------
   * ÇİZİM
   * ------------------------------------------------------------- */
  En.draw = function (ctx, camX, camY) {
    const S = QW.Pixel.Screen;
    for (const e of En.list) {
      const sx = (e.x - camX) | 0, sy = (e.y - camY) | 0;
      if (sx < -30 || sy < -30 || sx > S.w + 30 || sy > S.h + 30) continue;
      const size = QW.Sprites.creatureSize(e.def.sprite.s);
      const ox = sx - (size.w >> 1), oy = sy - size.h + 4;
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.fillRect(ox + 1, sy + 2, size.w - 2, 2);
      const sz = QW.Sprites.creatureSize(e.def.sprite.s);
      QW.Sprites.shadow(ctx, ox + sz.w / 2, oy + sz.h, Math.max(7, sz.w - 2));
      QW.Sprites.creature(ctx, ox, oy, e.def.sprite, 1, e.flip);
      /* Saldırgan işareti */
      if (e.state === 'chase') {
        ctx.fillStyle = '#ff5d7a';
        ctx.fillRect(sx - 1, oy - 5, 2, 2);
        ctx.fillRect(sx - 1, oy - 8, 2, 1);
      }
    }
  };

  /* Yakındaki düşmanları listeler (radar için) */
  En.near = function (x, y, r) {
    return En.list.filter(e => e.type === 'enemy' && U.dist(e.x, e.y, x, y) < r);
  };

})(window.QW);
