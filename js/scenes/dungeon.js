/* =========================================================================
 * Sahne: DUNGEON — oda oda ilerleyen klasik zindan
 *
 * Kamera odaya kilitlidir: kapıdan geçince görüntü yan odaya kayar. Bu,
 * el konsolu Zelda'larının okunabilirliğini verir — her oda tek ekranda
 * kavranan, kendi başına tasarlanmış bir problemdir.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const P = QW.Pixel, U = QW.Utils, D = QW.Dungeon;
  const TS = 16;                                  // tile boyu
  const RW = D.RW, RH = D.RH;
  const ROOM_W = RW * TS, ROOM_H = RH * TS;

  let dj = null, room = null, origin = { x: 0, y: 0 };
  let px = 0, py = 0, dir = 'down', frame = 0, walkT = 0;
  let slide = null;                                // oda geçişi animasyonu
  let msgT = 0, msg = '';
  let enemies = [], invuln = 0;
  let onExit = null;

  /* ---------------------------------------------------------------- */
  function roomById(id) { return dj.rooms.find(r => r.id === id); }

  function enterRoom(r, fromDir) {
    room = r;
    dj.state.cur = r.id;
    dj.state.visited[r.id] = 1;
    /* Çözülmemiş kasa bulmacası odadan çıkınca sıfırlanır: oyuncu kasayı
       kurtarılamaz bir yere itip kendini kilitleyemez. */
    if (r.tiles0 && !dj.state.solved[r.id]) {
      r.tiles = r.tiles0.map(row => row.slice());
      r.plateOn = false;
    }
    /* Kapıdan girerken karşı kenara yerleş */
    /* Tile kenarına değil, tile MERKEZİNE yerleş: kenarda dururken çarpışma
       kutusu komşu sıraya taşıyor ve yan kapılar kapalı gibi davranıyordu. */
    const mx = (RW >> 1) * TS, my = (RH >> 1) * TS - 2;
    if (fromDir === 'n') { px = mx; py = TS * 1.2; dir = 'down'; }
    else if (fromDir === 's') { px = mx; py = ROOM_H - TS * 1.6; dir = 'up'; }
    else if (fromDir === 'w') { px = TS * 1.2; py = my; dir = 'right'; }
    else if (fromDir === 'e') { px = ROOM_W - TS * 1.6; py = my; dir = 'left'; }
    else { px = mx; py = ROOM_H - TS * 1.8; dir = 'up'; }

    spawnEnemies();
    QW.Audio.fadeMusicTo(r.kind === 'boss' ? 'boss' : 'night');
  }

  function spawnEnemies() {
    enemies = [];
    if (dj.state.cleared[room.id]) return;
    const n = room.combat || 0;
    for (let i = 0; i < n; i++) {
      const pool = QW.Enemies.pool(dj.biome, false, QW.Player.level);
      if (!pool.length) break;
      const def = QW.Enemies.get(U.pick(pool));
      enemies.push({
        def, x: (2 + Math.random() * (RW - 4)) * TS, y: (2 + Math.random() * (RH - 4)) * TS,
        t: Math.random() * 2, vx: 0, vy: 0, flip: false
      });
    }
  }

  function tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= RW || ty >= RH) return 1;
    return room.tiles[ty][tx];
  }

  /* Kapı boşluğu mu? (duvar sırasındaki açıklık) */
  function doorSide(tx, ty) {
    const mx = RW >> 1, my = RH >> 1;
    if (ty === 0 && (tx === mx || tx === mx - 1)) return 'n';
    if (ty === RH - 1 && (tx === mx || tx === mx - 1)) return 's';
    if (tx === 0 && (ty === my || ty === my - 1)) return 'w';
    if (tx === RW - 1 && (ty === my || ty === my - 1)) return 'e';
    return null;
  }

  function solid(x, y) {
    const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
    const t = tileAt(tx, ty);
    if (t === 1) return true;
    if (t === 2) return !dj.state.hasDevice || dj.deviceDef.barrier !== 'gap';
    if (t === 4) return true;                       // kasa: itilir, geçilmez
    return false;
  }

  /* Çarpışma kutusu dikeyde -2..+4, yatayda ±3 piksel */
  function freeX(nx) { return !solid(nx, py + 4) && !solid(nx, py - 2); }
  function freeY(ny) { return !solid(px, ny + 4) && !solid(px, ny - 2); }

  /* KÖŞE KESME — el konsolu aksiyon oyunlarının sessiz nezaketi.
     Duvara sürtüyorsan ama birkaç piksel kayınca yol açılıyorsa, oyun seni
     oraya kaydırır. Bu olmadan kapı ağızları ve sütun araları "takılıyor"
     hissi verir; oyuncu hatayı kendinde arar. */
  function slipY(nx, step) {
    const k = Math.min(6, step + 1.5);
    for (const d of [k, -k]) {
      if (!solid(nx, py + d + 4) && !solid(nx, py + d - 2)) { py += d * 0.6; return; }
    }
  }
  function slipX(ny, step) {
    const k = Math.min(6, step + 1.5);
    for (const d of [k, -k]) {
      if (!solid(px + d, ny + 4) && !solid(px + d, ny - 2)) { px += d * 0.6; return; }
    }
  }

  /* KAPI HUNİSİ — kapıya doğru yürürken açıklığın ortasına doğru çekilirsin.
     Boşluk iki tile ama çarpışma kutusu yüzünden geçilebilir bant daha dar;
     hizalamayı oyuncuya bırakmak yerine oyun üstlenir. */
  function funnelToDoor(ax, ay, step) {
    const my = RH >> 1, mx = RW >> 1;
    const pull = Math.min(step * 0.9, 2.2);
    if (ax < 0 && px < TS * 2.2 && (room.doors.w || false)) alignY(my, pull);
    else if (ax > 0 && px > ROOM_W - TS * 2.2 && (room.doors.e || false)) alignY(my, pull);
    else if (ay < 0 && py < TS * 2.2 && (room.doors.n || false)) alignX(mx, pull);
    else if (ay > 0 && py > ROOM_H - TS * 2.2 && (room.doors.s || room.exit)) alignX(mx, pull);
  }
  function alignY(my, pull) {
    const target = my * TS - 2;                       // iki tile'lık boşluğun ortası
    if (Math.abs(py - target) < 0.6) { py = target; return; }
    if (Math.abs(py - target) > TS * 1.4) return;     // çok uzaksa çekme
    py += Math.sign(target - py) * pull;
  }
  function alignX(mx, pull) {
    const target = mx * TS;
    if (Math.abs(px - target) < 0.6) { px = target; return; }
    if (Math.abs(px - target) > TS * 1.4) return;
    px += Math.sign(target - px) * pull;
  }

  /* ---------------------------------------------------------------- */
  const Dg = {
    enter(data) {
      dj = data.dungeon;
      onExit = data.onExit || null;
      slide = null; msgT = 0; enemies = []; invuln = 0;
      QW.HUD.show(false);
      QW.Input.showTouch(QW.Save.settings.touch);
      enterRoom(roomById(dj.state.cur) || dj.start, null);
      say(QW.L(dj.def.name));
    },

    resume() {
      QW.Input.showTouch(QW.Save.settings.touch);
      QW.Audio.fadeMusicTo(room.kind === 'boss' ? 'boss' : 'night');
      /* Savaştan dönünce odadaki düşman ölmüş sayılır */
      if (enemies.length) enemies.shift();
      if (!enemies.length) dj.state.cleared[room.id] = 1;
      QW.Input.reset();
    },

    exit() { QW.Input.showTouch(false); },

    /* ---------------------------------------------------------------- */
    update(dt) {
      if (QW.Dialog.open || QW.Panels.isOpen()) { QW.Input.reset(); return; }
      msgT = Math.max(0, msgT - dt);
      invuln = Math.max(0, invuln - dt);

      if (slide) {
        slide.t += dt * 3.2;
        if (slide.t >= 1) { slide = null; }
        return;
      }

      const sp = 62 * (1 + (QW.Player.stats().spd - 1) * 0.4);
      const ax = QW.Input.axis.x, ay = QW.Input.axis.y;
      if (ax || ay) {
        const step = sp * dt;
        funnelToDoor(ax, ay, step);          // kapı ağzına kendiliğinden hizalan
        const nx = px + ax * step, ny = py + ay * step;
        if (freeX(nx)) px = nx;
        else if (ax) slipY(nx, step);        // köşe kesme: dikeyde azıcık kay, geç
        if (freeY(ny)) py = ny;
        else if (ay) slipX(ny, step);
        walkT += dt * 6;
        frame = 1 + (Math.floor(walkT) % 2);
        dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? 'left' : 'right') : (ay < 0 ? 'up' : 'down');
      } else { frame = 0; }

      /* Kapıdan çıkış */
      const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
      const side = doorSide(tx, ty);
      if (side && room.doors[side]) tryDoor(side);
      /* Giriş odasının güneyi zindandan çıkıştır — oyuncu içeride kilitli kalmaz */
      else if (side === 's' && room.kind === 'entrance') leave();

      /* Düşmanlar */
      enemies.forEach(e => {
        e.t += dt;
        if (e.t > 1.4) {
          e.t = 0;
          const a = Math.atan2(py - e.y, px - e.x) + (Math.random() - 0.5);
          const s2 = 16 + e.def.spd;
          e.vx = Math.cos(a) * s2; e.vy = Math.sin(a) * s2;
        }
        const nx = e.x + e.vx * dt, ny = e.y + e.vy * dt;
        if (!solid(nx, e.y)) e.x = nx; else e.vx = -e.vx;
        if (!solid(e.x, ny)) e.y = ny; else e.vy = -e.vy;
        if (invuln <= 0 && U.dist(e.x, e.y, px, py) < 11) {
          invuln = 1.2;
          QW.Scenes.push('battle', { entity: { type: 'enemy', def: e.def, x: 0, y: 0, hp: e.def.hp, hpMax: e.def.hp } });
        }
      });

      if (QW.Input.consume('a')) interact();
      if (QW.Input.consume('b')) useDevice();
    },

    /* ---------------------------------------------------------------- */
    draw(ctx) {
      const S = P.Screen;
      /* Oda ekranı doldurmuyor; çevresi siyah kalmasın diye zindan kayası
         ve bir çerçeve çizilir — boşluk kasıtlı bir kadraja dönüşür. */
      const c = dj.def.tile;
      ctx.fillStyle = U.shade(c.wall, -0.72);
      ctx.fillRect(0, 0, S.w, S.h);
      for (let y = 0; y < S.h; y += 8) {
        for (let x = ((y / 8) % 2) * 8; x < S.w; x += 16) {
          ctx.fillStyle = U.shade(c.wall, -0.66);
          ctx.fillRect(x, y, 8, 7);
        }
      }

      const ox = Math.round((S.w - ROOM_W) / 2);
      const oy = Math.round((S.h - ROOM_H) / 2 - (S.portrait ? 30 : 0));
      origin = { x: ox, y: oy };

      if (slide) {
        const k = ease(slide.t);
        const dx = slide.dx * (1 - k) * (ROOM_W + 8);
        const dy = slide.dy * (1 - k) * (ROOM_H + 8);
        drawRoom(ctx, slide.from, ox + dx - slide.dx * 0, oy + dy, false);
        drawRoom(ctx, room, ox + dx + slide.dx * (ROOM_W + 8), oy + dy + slide.dy * (ROOM_H + 8), true);
      } else {
        drawRoom(ctx, room, ox, oy, true);
        drawActors(ctx, ox, oy);
      }

      /* Oda çerçevesi */
      P.bevel(ctx, ox - 3, oy - 3, ROOM_W + 6, ROOM_H + 6, U.shade(c.wall, -0.15), 2);
      P.bevel(ctx, ox - 5, oy - 5, ROOM_W + 10, ROOM_H + 10, U.shade(c.wall, -0.5), 2);

      drawHud(ctx);
    }
  };

  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }

  /* ---------------------------------------------------------------- */
  function drawRoom(ctx, r, ox, oy, live) {
    const c = dj.def.tile;
    ctx.fillStyle = c.floor;
    ctx.fillRect(ox, oy, ROOM_W, ROOM_H);
    for (let y = 0; y < RH; y++) {
      for (let x = 0; x < RW; x++) {
        const t = r.tiles[y][x];
        const X = ox + x * TS, Y = oy + y * TS;
        if (t === 1) {
          ctx.fillStyle = c.wall; ctx.fillRect(X, Y, TS, TS);
          ctx.fillStyle = U.shade(c.wall, -0.3); ctx.fillRect(X, Y + TS - 3, TS, 3);
          ctx.fillStyle = U.shade(c.wall, 0.2); ctx.fillRect(X, Y, TS, 2);
        } else if (t === 2) {
          ctx.fillStyle = '#06080e'; ctx.fillRect(X, Y, TS, TS);
          ctx.fillStyle = '#131824'; ctx.fillRect(X, Y, TS, 3);
        } else if (t === 4) {
          ctx.fillStyle = '#7a5a34'; ctx.fillRect(X + 1, Y + 1, TS - 2, TS - 2);
          ctx.fillStyle = '#a07a48'; ctx.fillRect(X + 2, Y + 2, TS - 4, 3);
          ctx.fillStyle = '#4a3520'; ctx.fillRect(X + 1, Y + TS - 4, TS - 2, 3);
        } else if (t === 5) {
          ctx.fillStyle = '#2c3550'; ctx.fillRect(X + 3, Y + 3, TS - 6, TS - 6);
          ctx.fillStyle = r.plateOn ? '#4df2c8' : '#5b6b8a';
          ctx.fillRect(X + 5, Y + 5, TS - 10, TS - 10);
        } else if (t === 6) {
          ctx.fillStyle = U.shade(c.deco, -0.2); ctx.fillRect(X + 2, Y + 4, TS - 4, TS - 6);
          ctx.fillStyle = c.deco; ctx.fillRect(X + 3, Y + 2, TS - 6, 4);
        } else {
          /* zemin dokusu */
          if (((x + y * 3) % 7) === 0) { ctx.fillStyle = U.shade(c.floor, 0.08); ctx.fillRect(X + 4, Y + 5, 3, 2); }
        }
      }
    }

    /* Kapılar */
    Object.keys(r.doors || {}).forEach(side => {
      const d = r.doors[side];
      drawDoor(ctx, ox, oy, side, d, r);
    });

    /* Çıkış — giriş odasının güneyindeki gün ışığı */
    if (r.exit) drawExit(ctx, ox, oy);

    /* Oda içeriği */
    if (live) drawContents(ctx, ox, oy, r);
  }

  function doorRect(side) {
    const mx = RW >> 1, my = RH >> 1;
    if (side === 'n') return { x: (mx - 1) * TS, y: 0, w: TS * 2, h: TS };
    if (side === 's') return { x: (mx - 1) * TS, y: (RH - 1) * TS, w: TS * 2, h: TS };
    if (side === 'w') return { x: 0, y: (my - 1) * TS, w: TS, h: TS * 2 };
    return { x: (RW - 1) * TS, y: (my - 1) * TS, w: TS, h: TS * 2 };
  }

  function drawDoor(ctx, ox, oy, side, d, r) {
    const q = doorRect(side);
    const X = ox + q.x, Y = oy + q.y;
    const open = !d.lock || dj.state.opened[edgeId(d.edge)];
    if (open) {
      ctx.fillStyle = '#06080e'; ctx.fillRect(X, Y, q.w, q.h);
      ctx.fillStyle = U.shade(dj.def.tile.wall, -0.45);
      ctx.fillRect(X, Y, q.w, 2);
      return;
    }
    /* Kilitli / engelli kapı */
    const col = d.lock === 'key' ? '#ffd166' : d.lock === 'boss' ? '#ff5d7a' : '#8fd0ff';
    ctx.fillStyle = '#2a2f3e'; ctx.fillRect(X, Y, q.w, q.h);
    ctx.fillStyle = col; ctx.fillRect(X + 2, Y + 2, q.w - 4, q.h - 4);
    ctx.fillStyle = '#0b0f18';
    if (d.lock === 'key' || d.lock === 'boss') {
      ctx.fillRect(X + q.w / 2 - 2, Y + q.h / 2 - 3, 4, 6);
    } else {
      for (let i = 0; i < 3; i++) ctx.fillRect(X + 3, Y + 3 + i * 4, q.w - 6, 2);
    }
  }

  /* Zindan ağzı: kapılardan ayırt edilsin diye dışarının aydınlığıyla çizilir */
  function drawExit(ctx, ox, oy) {
    const q = doorRect('s');
    const X = ox + q.x, Y = oy + q.y;
    ctx.fillStyle = '#0b1018'; ctx.fillRect(X, Y, q.w, q.h);
    /* dışarıya doğru açılan ışık huzmesi */
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = 'rgba(210,230,255,' + (0.10 + i * 0.07) + ')';
      ctx.fillRect(X + 2 + i, Y + q.h - 4 - i * 3, q.w - 4 - i * 2, 3);
    }
    /* aşağıyı gösteren ok */
    ctx.fillStyle = '#dff0ff';
    ctx.fillRect(X + q.w / 2 - 1, Y + 3, 2, 6);
    ctx.fillRect(X + q.w / 2 - 3, Y + 8, 6, 2);
    ctx.fillRect(X + q.w / 2 - 2, Y + 10, 4, 2);
  }

  function edgeId(e) { return e.a.id + '>' + e.b.id; }

  function drawContents(ctx, ox, oy, r) {
    const cx = ox + (RW >> 1) * TS, cy = oy + (RH >> 1) * TS;
    (r.contains || []).forEach((c, i) => {
      if (dj.state.opened['item:' + r.id + ':' + i]) return;
      const X = cx + (i - ((r.contains.length - 1) / 2)) * 22, Y = cy;
      if (c.type === 'device') {
        ctx.fillStyle = '#2c3550'; ctx.fillRect(X - 7, Y - 2, 14, 10);
        ctx.fillStyle = '#4df2c8'; ctx.fillRect(X - 4, Y - 8, 8, 8);
        ctx.fillStyle = '#dff6ff'; ctx.fillRect(X - 2, Y - 6, 4, 4);
      } else if (c.type === 'smallkey' || c.type === 'bosskey') {
        const col = c.type === 'bosskey' ? '#ff5d7a' : '#ffd166';
        ctx.fillStyle = col; ctx.fillRect(X - 4, Y - 4, 5, 5);
        ctx.fillRect(X, Y - 1, 6, 2); ctx.fillRect(X + 4, Y + 1, 2, 2);
      } else if (c.type === 'map') {
        ctx.fillStyle = '#e0d6b8'; ctx.fillRect(X - 6, Y - 5, 12, 10);
        ctx.fillStyle = '#8a7a50'; ctx.fillRect(X - 4, Y - 3, 8, 2); ctx.fillRect(X - 4, Y + 1, 5, 2);
      } else if (c.type === 'compass') {
        P.circle(ctx, X, Y, 6, '#8fd0ff'); P.circle(ctx, X, Y, 4, '#20304a');
        ctx.fillStyle = '#ff5d7a'; ctx.fillRect(X - 1, Y - 3, 2, 4);
      } else {
        ctx.fillStyle = '#6a5a3a'; ctx.fillRect(X - 7, Y - 5, 14, 11);
        ctx.fillStyle = '#8a7a4a'; ctx.fillRect(X - 7, Y - 5, 14, 3);
        ctx.fillStyle = '#ffd166'; ctx.fillRect(X - 2, Y - 1, 4, 3);
      }
    });
  }

  function drawActors(ctx, ox, oy) {
    enemies.forEach(e => {
      const sz = QW.Sprites.creatureSize(e.def.sprite.s);
      QW.Sprites.creature(ctx, ox + e.x - (sz.w >> 1), oy + e.y - sz.h + 4, e.def.sprite, 1, e.vx < 0);
    });
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(ox + px - 3, oy + py + 5, 6, 2);
    if (invuln > 0 && Math.floor(invuln * 12) % 2) { /* yanıp sön */ }
    else QW.Sprites.player(ctx, ox + px - 6, oy + py - 11, QW.Player.look, dir, frame);
  }

  /* ---------------------------------------------------------------- */
  function drawHud(ctx) {
    const S = P.Screen;
    const st = dj.state;
    /* Üst şerit: zindan adı + anahtar/boss anahtarı + cihaz */
    P.text(ctx, QW.L(dj.def.name), 4, 4, '#dff6ff', 1, '#000');
    let x = 4, y = S.h - 12;
    if (st.keys > 0) { P.text(ctx, 'K' + st.keys, x, y, '#ffd166', 1, '#000'); x += 22; }
    if (st.bossKey) { P.text(ctx, 'BK', x, y, '#ff5d7a', 1, '#000'); x += 22; }
    if (st.hasDevice) P.text(ctx, QW.L(dj.deviceDef.name), x, y, '#4df2c8', 1, '#000');

    /* Harita: yalnızca harita eşyası bulunduysa */
    if (st.map) drawMiniMap(ctx);

    if (msgT > 0) {
      const w = P.textW(msg, 1) + 8;
      const bx = Math.max(2, (S.w - w) / 2 | 0);
      const by = origin.y - 18;
      ctx.fillStyle = 'rgba(5,7,13,0.85)'; ctx.fillRect(bx, by, w, 14);
      P.bevel(ctx, bx, by, w, 14, '#26365c');
      P.text(ctx, msg, bx + 4, by + 4, '#dff6ff', 1, '#000');
    }
  }

  function drawMiniMap(ctx) {
    const S = P.Screen;
    const cell = 7, gap = 1;
    const w = dj.GW * (cell + gap), h = dj.GH * (cell + gap);
    const ox = S.w - w - 4, oy = 4;
    ctx.fillStyle = 'rgba(5,7,13,0.75)'; ctx.fillRect(ox - 2, oy - 2, w + 4, h + 4);
    dj.rooms.forEach(r => {
      const X = ox + r.gx * (cell + gap), Y = oy + r.gy * (cell + gap);
      const vis = dj.state.visited[r.id];
      if (!vis && !dj.state.compass) return;
      ctx.fillStyle = r === room ? '#4df2c8' : vis ? '#3a4668' : '#1a2030';
      ctx.fillRect(X, Y, cell, cell);
      /* Pusula: içerikleri gösterir */
      if (dj.state.compass && r.contains && r.contains.length) {
        const has = t => r.contains.some((c, i) => c.type === t && !dj.state.opened['item:' + r.id + ':' + i]);
        if (r.kind === 'boss') { ctx.fillStyle = '#ff5d7a'; ctx.fillRect(X + 2, Y + 2, 3, 3); }
        else if (has('device')) { ctx.fillStyle = '#4df2c8'; ctx.fillRect(X + 2, Y + 2, 3, 3); }
        else if (has('bosskey')) { ctx.fillStyle = '#ff5d7a'; ctx.fillRect(X + 2, Y + 2, 3, 3); }
        else if (has('smallkey')) { ctx.fillStyle = '#ffd166'; ctx.fillRect(X + 2, Y + 2, 3, 3); }
      }
      if (r.kind === 'boss' && (vis || dj.state.compass)) {
        ctx.fillStyle = '#ff5d7a'; P.frame(ctx, X, Y, cell, cell, '#ff5d7a');
      }
    });
  }

  function say(t) { msg = t; msgT = 2.6; }

  function leave() {
    QW.Audio.sfx('back');
    if (onExit) onExit();
    QW.Scenes.pop();
  }

  /* ---------------------------------------------------------------- */
  function tryDoor(side) {
    const d = room.doors[side];
    const st = dj.state;
    const id = edgeId(d.edge);
    if (d.lock && !st.opened[id]) {
      if (d.lock === 'key') {
        if (st.keys > 0) { st.keys--; st.opened[id] = 1; QW.Audio.sfx('ok'); say(QW.t('dg_unlock')); }
        else { QW.Audio.sfx('deny'); say(QW.t('dg_locked')); bounce(side); return; }
      } else if (d.lock === 'boss') {
        if (st.bossKey) { st.opened[id] = 1; QW.Audio.sfx('fragment'); say(QW.t('dg_bossdoor')); }
        else { QW.Audio.sfx('deny'); say(QW.t('dg_needboss')); bounce(side); return; }
      } else {
        if (st.hasDevice) { st.opened[id] = 1; QW.Audio.sfx('craft'); say(QW.L(dj.deviceDef.hint)); }
        else { QW.Audio.sfx('deny'); say(QW.t('dg_needdev', { name: QW.L(dj.deviceDef.name) })); bounce(side); return; }
      }
    }
    const next = roomById(d.to);
    if (!next) return;
    const dv = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }[side];
    slide = { from: room, dx: dv[0], dy: dv[1], t: 0 };
    enterRoom(next, D.opposite(side));
    if (next.kind === 'boss' && !dj.state.beaten) startBoss();
  }

  function bounce(side) {
    if (side === 'n') py += 6; else if (side === 's') py -= 6;
    else if (side === 'w') px += 6; else px -= 6;
  }

  function startBoss() {
    const def = QW.Enemies.get(dj.def.boss);
    QW.Dialog.say([QW.L(def.intro || def.desc)], {
      name: QW.L(def.name),
      onDone: () => {
        QW.Scenes.push('battle', {
          entity: { type: 'enemy', def, x: 0, y: 0, hp: def.hp, hpMax: def.hp, boss: true, dungeon: dj.id },
          boss: true
        });
      }
    });
  }

  /* A: oda içeriğini al */
  function interact() {
    const cx = (RW >> 1) * TS, cy = (RH >> 1) * TS;
    let took = false;
    (room.contains || []).forEach((c, i) => {
      const tag = 'item:' + room.id + ':' + i;
      if (dj.state.opened[tag]) return;
      const X = cx + (i - ((room.contains.length - 1) / 2)) * 22;
      if (U.dist(px, py, X, cy) > 16) return;
      dj.state.opened[tag] = 1;
      took = true;
      const st = dj.state;
      if (c.type === 'smallkey') { st.keys++; QW.Audio.sfx('pickup'); say(QW.t('dg_key')); }
      else if (c.type === 'bosskey') { st.bossKey = true; QW.Audio.sfx('fragment'); say(QW.t('dg_bosskey')); }
      else if (c.type === 'map') { st.map = true; QW.Audio.sfx('ok'); say(QW.t('dg_map')); }
      else if (c.type === 'compass') { st.compass = true; QW.Audio.sfx('ok'); say(QW.t('dg_compass')); }
      else if (c.type === 'device') {
        st.hasDevice = true;
        QW.Audio.sfx('craft');
        QW.Audio.motif('home');
        QW.Inventory.add(dj.deviceDef.id, 1, true);
        QW.Dialog.say([QW.L(dj.deviceDef.desc)], { name: QW.L(dj.deviceDef.name) });
      } else {
        const loot = U.pick(['power_cell', 'medkit', 'scrap', 'titanium', 'quartz', 'ti_wire']);
        QW.Inventory.add(loot, U.irange(1, 3));
        QW.Audio.sfx('pickup');
      }
    });
    if (!took) {
      /* Kasa itme */
      pushCrate();
    }
  }

  /* Kasayı bakış yönüne doğru it; plakaya oturursa oda çözülür */
  function pushCrate() {
    const dv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    const tx = Math.floor(px / TS) + dv[0], ty = Math.floor(py / TS) + dv[1];
    if (tileAt(tx, ty) !== 4) return;
    const nx = tx + dv[0], ny = ty + dv[1];
    const dest = tileAt(nx, ny);
    if (dest !== 0 && dest !== 5) { QW.Audio.sfx('deny'); return; }
    /* Kapı boşluğuna itilemez — tıkanan kapı oyuncuyu içeride bırakırdı */
    if (doorSide(nx, ny)) { QW.Audio.sfx('deny'); say(QW.t('dg_blocked')); return; }
    room.tiles[ty][tx] = 0;
    if (dest === 5) {
      room.tiles[ny][nx] = 4;
      room.plateOn = true;
      dj.state.cleared[room.id] = 1;
      dj.state.solved[room.id] = 1;
      QW.Audio.sfx('craft');
      say(QW.t('dg_plate'));
      /* Plaka çözülünce odadaki tüm kapılar açılır */
      Object.keys(room.doors).forEach(sd => {
        const d = room.doors[sd];
        if (d.lock && d.lock !== 'boss' && d.lock !== 'key') dj.state.opened[edgeId(d.edge)] = 1;
      });
    } else {
      room.tiles[ny][nx] = 4;
      QW.Audio.sfx('step');
    }
  }

  /* B: cihazı kullan — çukur geçme, buz eritme vb. */
  function useDevice() {
    if (!dj.state.hasDevice) { say(QW.t('dg_nodev')); QW.Audio.sfx('deny'); return; }
    QW.Audio.sfx('scan');
    say(QW.L(dj.deviceDef.hint));
    /* Bakış yönündeki engeli aç */
    const dv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    for (let i = 1; i <= 3; i++) {
      const tx = Math.floor(px / TS) + dv[0] * i, ty = Math.floor(py / TS) + dv[1] * i;
      if (tileAt(tx, ty) === 2) { room.tiles[ty][tx] = 0; QW.Audio.sfx('craft'); return; }
    }
  }

  Dg.leave = function () {
    if (onExit) onExit();
    QW.Scenes.pop();
  };

  /* Tanılama kancası: oda içi durumu dışarıya açar (otomatik oynanış
     testleri ve hata ayıklama kaplaması bunu okur). */
  Dg.probe = function () {
    if (!dj || !room) return null;
    return {
      px, py, dir, tile: { x: Math.floor(px / TS), y: Math.floor(py / TS) },
      room: room.id, kind: room.kind, exit: !!room.exit,
      doors: Object.keys(room.doors || {}).map(sd => ({
        side: sd, to: room.doors[sd].to, lock: room.doors[sd].lock,
        open: !room.doors[sd].lock || !!dj.state.opened[edgeId(room.doors[sd].edge)]
      })),
      items: (room.contains || []).map((c, i) => ({ type: c.type, taken: !!dj.state.opened['item:' + room.id + ':' + i] })),
      enemies: enemies.length, sliding: !!slide, tiles: room.tiles.map(r => r.join(''))
    };
  };

  QW.Scenes.register('dungeon', Dg);
  QW.DungeonScene = Dg;

})(window.QW);
