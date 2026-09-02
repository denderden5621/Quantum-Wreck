/* =========================================================================
 * QW.Sprites — tüm görseller kod içinde üretilir (harici dosya yok)
 *  - Karakter: parametrik dikdörtgenlerle (kıyafet renkleri anında değişir)
 *  - Yaratıklar: karakter matrisleriyle tanımlı gerçek 8-bit spritelar
 *  - Eşya ikonları / kaynak düğümleri / POI'ler: küçük piksel çizimler
 * ========================================================================= */
(function (QW) {
  'use strict';

  const P = QW.Pixel, U = QW.Utils;
  const S = QW.Sprites = {};

  /* =====================================================================
   * MATRİS SPRITE YARDIMCISI
   * a=ana renk  b=ikincil  d=koyu  l=açık  e=göz  w=beyaz  .=şeffaf
   * =================================================================== */
  function paint(ctx, rows, x, y, s, pal) {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.') continue;
        const col = pal[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x + c * s, y + r * s, s, s);
      }
    }
  }
  function makePal(c, c2) {
    return { a: c, b: c2, d: U.shade(c2, -0.45), l: U.shade(c, 0.35), e: '#ff5d7a', w: '#ffffff', k: '#0b0f18' };
  }
  S.paint = paint;

  /* =====================================================================
   * OYUNCU / NPC KARAKTERİ (12 x 16)
   * look: { skin, hair, shirt, boots, suit, visor }
   * =================================================================== */
  const DEF_LOOK = { skin: '#e0ac7e', hair: '#3a2a1e', shirt: '#e0e4ea', boots: '#a06a3a', suit: '#c9d4e4', visor: '#4df2c8' };

  function drawBody(ctx, look, dir, frame, ox, oy) {
    const L = Object.assign({}, DEF_LOOK, look || {});
    const dark = U.shade(L.suit, -0.42);
    const bootD = U.shade(L.boots, -0.35);
    const skinD = U.shade(L.skin, -0.3);
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, w, h); };

    const bob = (frame === 1) ? 1 : 0;   // yürüyüş salınımı
    const legA = frame === 1 ? 1 : 0, legB = frame === 2 ? 1 : 0;

    /* Bacaklar + botlar */
    R(3, 12 - legA, 2, 3, dark);
    R(7, 12 - legB, 2, 3, dark);
    R(3, 14 - legA, 2, 2, L.boots);
    R(7, 14 - legB, 2, 2, L.boots);
    R(3, 15 - legA, 2, 1, bootD);
    R(7, 15 - legB, 2, 1, bootD);

    /* Gövde zırhı */
    R(2, 7 + bob, 8, 6, L.suit);
    R(2, 7 + bob, 8, 1, U.shade(L.suit, 0.25));
    R(2, 12 + bob, 8, 1, dark);
    /* Zırh altındaki tişört — yakada ve bel hizasında görünür */
    R(4, 7 + bob, 4, 1, L.shirt);
    R(3, 10 + bob, 6, 1, L.shirt);
    /* Kollar */
    R(1, 8 + bob, 1, 4, dark);
    R(10, 8 + bob, 1, 4, dark);
    R(1, 8 + bob, 1, 2, L.suit);
    R(10, 8 + bob, 1, 2, L.suit);

    /* Kask */
    R(3, 1 + bob, 6, 6, L.skin);
    R(3, 1 + bob, 6, 1, U.shade(L.skin, 0.2));
    R(2, 2 + bob, 1, 4, skinD);
    R(9, 2 + bob, 1, 4, skinD);

    if (dir === 'up') {
      /* Arkadan: saç ve kask sırtı */
      R(3, 1 + bob, 6, 4, L.hair);
      R(3, 5 + bob, 6, 2, U.shade(L.hair, -0.2));
    } else if (dir === 'left' || dir === 'right') {
      R(3, 1 + bob, 6, 2, L.hair);
      const vx = dir === 'right' ? 6 : 3;
      R(vx, 3 + bob, 3, 2, L.visor);
      R(vx, 3 + bob, 3, 1, U.shade(L.visor, 0.4));
    } else {
      R(3, 1 + bob, 6, 2, L.hair);
      R(3, 3 + bob, 6, 2, L.visor);
      R(3, 3 + bob, 6, 1, U.shade(L.visor, 0.4));
      R(4, 6 + bob, 4, 1, skinD);
    }
    /* Omuz plakaları */
    R(2, 7 + bob, 2, 2, U.shade(L.suit, 0.15));
    R(8, 7 + bob, 2, 2, U.shade(L.suit, 0.15));
  }

  S.lookKey = look => ['sk', look.skin, look.hair, look.shirt, look.boots, look.suit, look.visor].join('_');

  /* Önbellekli oyuncu karesi */
  S.player = function (ctx, x, y, look, dir, frame) {
    const key = 'pl_' + S.lookKey(look) + '_' + dir + '_' + frame;
    const cv = P.cached(key, 12, 16, c => drawBody(c, look, dir, frame, 0, 0));
    if (dir === 'left') {
      ctx.save();
      ctx.translate((x | 0) + 12, y | 0); ctx.scale(-1, 1);
      ctx.drawImage(cv, 0, 0); ctx.restore();
    } else ctx.drawImage(cv, x | 0, y | 0);
  };

  /* NPC — karakter gövdesi + karaktere özgü renk şeması ve aksesuar */
  const NPC_LOOK = {
    npc_eko:   { skin: '#c98d5e', hair: '#20242e', shirt: '#7aa2ff', boots: '#2b3f7a', suit: '#3f4a66', visor: '#7aa2ff' },
    npc_valk:  { skin: '#f0c9a0', hair: '#e8e8f0', shirt: '#8fd0ff', boots: '#2a4a70', suit: '#5d7d9e', visor: '#cdeaff' },
    npc_krank: { skin: '#a06a44', hair: '#6a4a10', shirt: '#ffd166', boots: '#3a2a12', suit: '#7a6a44', visor: '#ffd166' },
    npc_tome:  { skin: '#dcae8a', hair: '#5a3a7a', shirt: '#c79bff', boots: '#3a2070', suit: '#5a4a7a', visor: '#c79bff' },
    npc_vela:  { skin: '#8a5a3a', hair: '#101820', shirt: '#4df2c8', boots: '#0e6a55', suit: '#38564e', visor: '#4df2c8' },
    npc_odd:   { skin: '#e0c090', hair: '#8a6a20', shirt: '#ffd166', boots: '#4a3a10', suit: '#6a5a3a', visor: '#ffd166' }
  };
  S.npcLook = k => NPC_LOOK[k] || DEF_LOOK;

  S.npc = function (ctx, x, y, spr, dir, frame) {
    const look = S.npcLook(spr.s);
    const key = 'npc_' + spr.s + '_' + (dir || 'down') + '_' + (frame || 0);
    const cv = P.cached(key, 12, 16, c => drawBody(c, look, dir || 'down', frame || 0, 0, 0));
    ctx.drawImage(cv, x | 0, y | 0);
  };

  /* =====================================================================
   * YARATIK SPRITELARI (matris)
   * =================================================================== */
  const CREATURE = {
    crawler: [
      '..........',
      '..dd..dd..',
      '.dbbddbbd.',
      'daaaaaaaad',
      'daeaaaaead',
      'dbaaaaaabd',
      '.dbbbbbbd.',
      'd.d.dd.d.d',
      '.d.d..d.d.'
    ],
    hopper: [
      '....dd....',
      '...daad...',
      '..deaaed..',
      '..daaaad..',
      '.dbaaaabd.',
      'd.baaaab.d',
      '.d.dbbd.d.',
      'd..d..d..d',
      '.d......d.'
    ],
    /* Radyasyon Çakalı: alçak, uzun ve sivri — üçgen kafa, hız hissi */
    jackal: [
      '.........d',
      '.dd....ddd',
      'daaddddaad',
      'daaaaaaeed',
      '.daaaaaadd',
      '..dbbbbd..',
      '..d.d.d...',
      '.d..d..d..',
      '............'
    ],
    /* Spor Yürüyücüsü: geniş şapka + ince gövde (mantar silueti) */
    walker: [
      '.dddddddd.',
      'dbaaaaaabd',
      'daaeaaeaad',
      '.dbaaaabd.',
      '..dd..dd..',
      '....aa....',
      '....aa....',
      '...daad...',
      '..dd..dd..'
    ],
    lurker: [
      '.d......d.',
      'dad....dad',
      'daad..daad',
      '.daaddaad.',
      '.daeaaead.',
      '.dbaaaabd.',
      '..dbaabd..',
      '..d.dd.d..',
      '...d..d...'
    ],
    /* Asit Sülüğü: dikey, boğumlu boru — yatay gövdelerden ayrışır */
    leech: [
      '...deed...',
      '...daad...',
      '..dbaabd..',
      '...daad...',
      '..dbaabd..',
      '...daad...',
      '..dbaabd..',
      '...daad...',
      '...dbbd...'
    ],
    shrike: [
      'd........d',
      'dad....dad',
      'daad..daad',
      '.daadaadd.',
      '..daeeaad.',
      '..dbaaabd.',
      '...dbbd...',
      '...d..d...',
      '..d....d..'
    ],
    drone: [
      'dd......dd',
      '.dllddlld.',
      '..dbaabd..',
      '.dbaeeabd.',
      '.dbaaaabd.',
      '..dbaabd..',
      '...dbbd...',
      '..d.dd.d..',
      '.d......d.'
    ],
    /* Batak Avcısı: uzun, kambur, öne uzanan ön kollar — sürüngenden
       tamamen farklı bir siluet (dar üst, geniş taban, asimetrik) */
    stalker: [
      '...dd.....',
      '..deed....',
      '..daad....',
      '.ddaadd...',
      'daaaaaad..',
      'daaaaaaad.',
      '.dbaaaabd.',
      '.d.daad.d.',
      'd...dd...d'
    ],
    /* Kırık Golem: kare omuzlar, ağır ve simetrik — "sağlam/güçlü" */
    golem: [
      'dd......dd',
      'dbdddddddb',
      'dbaaeeaabd',
      'dbaaaaaabd',
      'dbaaaaaabd',
      'ddbaaaabdd',
      '..daaaad..',
      '..dd..dd..',
      '.dd....dd.'
    ],
    moth: [
      'd..dddd..d',
      'dl.daad.ld',
      'dlldaadlld',
      '.dlbaabld.',
      '..dbeebd..',
      '..dbaabd..',
      '.dl.dd.ld.',
      'd.l....l.d',
      '.d......d.'
    ],
    wraith: [
      '...dddd...',
      '..daaaad..',
      '.daeaaead.',
      '.daaaaaad.',
      'd.baaaab.d',
      '.d.baab.d.',
      '..d.bb.d..',
      '...d..d...',
      '....dd....'
    ],
    /* Buz Solucanı: dikey boğumlu gövde — yatay bosslardan ayrışır */
    worm: [
      '......dddd......',
      '....ddbaabdd....',
      '...dbaaaaaabd...',
      '..dbaaeaaeaabd..',
      '..daaaaaaaaaad..',
      '...dbaaaaaabd...',
      '.....dbaabd.....',
      '......daad......',
      '.....dbaabd.....',
      '....dd....dd....'
    ],
    /* Asit Golemi: kare omuzlu ağır blok — durağan ve devasa */
    agolem: [
      'dd............dd',
      'dbd..dddddd..dbd',
      'dbd.dbaaaabd.dbd',
      'dbdddaaeeaadddbd',
      'dbaaaaaaaaaaaabd',
      'dbaaaaaaaaaaaabd',
      '.dbaaaaaaaaaabd.',
      '..dbaaaaaaaabd..',
      '..dd..dddd..dd..',
      '.dd....dd....dd.'
    ],
    /* Kum Leviathanı: aşağı daralan kama — açılmış bir ağız */
    levi: [
      'd..............d',
      'dd............dd',
      '.dd..dddddd..dd.',
      '..ddbaaaaaabdd..',
      '...daaeaaeaad...',
      '...daaaaaaaad...',
      '....dbaaaabd....',
      '.....dbaabd.....',
      '......dddd......',
      '.......dd.......'
    ],
    /* Spor Devi: geniş şapka üstte, kalın gövde altta — mantar silueti */
    titan: [
      '..dddddddddddd..',
      '.dbaaaaaaaaaabd.',
      'dbaaaeaaaaeaaabd',
      'dbaaaaaaaaaaaabd',
      '.ddbaaaaaaaabdd.',
      '...dd.daad.dd...',
      '......daad......',
      '.....dbaabd.....',
      '....dbaaaabd....',
      '...dd......dd...'
    ],
    /* Alpha: tavandan sarkan, aşağı daralan kubbe — tek büyük optik lens */
    alpha: [
      'dddddddddddddddd',
      '.dbaaaaaaaaaabd.',
      '.dbaaaaaaaaaabd.',
      '..dbaaddddaabd..',
      '..dbaadwwdaabd..',
      '...dbaddddabd...',
      '....dbaaaabd....',
      '.....dbaabd.....',
      '......dbbd......',
      '.......dd.......'
    ],
    /* Kayıp Leviathan: acıyla yana kıvrılmış asimetrik kavis */
    levi2: [
      '.....dddd.......',
      '...ddbaabdd.....',
      '..dbaaaaaabd....',
      '.dbaaeaaeaabd...',
      '.daaaaaaaaaad...',
      '..dbaaaaaabd....',
      '...dbaaaabd.....',
      '....dbaabdd.....',
      '.....d..dbbd....',
      '..........dd....'
    ],
    /* Kuantum Yansıması — oyuncunun silueti, kararsız kenarlarla */
    echo: [
      '....dddddd....',
      '...dbaaaabd...',
      '...daaaaaad...',
      '...dweeewd....',
      '...daaaaaad...',
      '..ddaaaaaadd..',
      '.dbaaaaaaaabd.',
      '.daa.daad.aad.',
      '..d..daad..d..',
      '.....d..d.....'
    ],
    harrier: [
      'd..............d',
      'dl.dddddddd..ld',
      'dl.dbaaabd..lld.',
      '.dl.dbaeabd.ld..',
      '..d.dbaaabd.d...',
      '....dbaaabd.....',
      '.....dbbbd......',
      '.....d...d......',
      '....d.....d.....',
      '...d.......d....'
    ]
  };

  /* Bazı matris satırlarının uzunluğunu güvence altına al */
  Object.keys(CREATURE).forEach(k => {
    const rows = CREATURE[k];
    const w = Math.max.apply(null, rows.map(r => r.length));
    CREATURE[k] = rows.map(r => (r + '..........................').slice(0, w));
  });

  S.creatureSize = function (shape) {
    const rows = CREATURE[shape] || CREATURE.crawler;
    return { w: rows[0].length, h: rows.length };
  };

  S.creature = function (ctx, x, y, spr, scale, flip) {
    const shape = spr.s || 'crawler';
    const rows = CREATURE[shape] || CREATURE.crawler;
    scale = scale || 1;
    const key = 'cr_' + shape + '_' + spr.c + '_' + spr.c2 + '_' + scale;
    const cv = P.cached(key, rows[0].length * scale, rows.length * scale,
      c => paint(c, rows, 0, 0, scale, makePal(spr.c, spr.c2)));
    if (flip) {
      ctx.save(); ctx.translate((x | 0) + cv.width, y | 0); ctx.scale(-1, 1);
      ctx.drawImage(cv, 0, 0); ctx.restore();
    } else ctx.drawImage(cv, x | 0, y | 0);
    return cv;
  };

  /* Vuruş flaşı: yaratığın yalnızca silueti beyaza boyanır.
     (source-atop tüm tuvali yakaladığı için maskeli kopya önbelleklenir.) */
  S.creatureFlash = function (ctx, x, y, spr, scale, alpha) {
    const shape = spr.s || 'crawler';
    const rows = CREATURE[shape] || CREATURE.crawler;
    scale = scale || 1;
    const key = 'crf_' + shape + '_' + scale;
    const cv = P.cached(key, rows[0].length * scale, rows.length * scale, c => {
      paint(c, rows, 0, 0, scale, { a: '#fff', b: '#fff', d: '#fff', l: '#fff', e: '#fff', w: '#fff', k: '#fff' });
    });
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.drawImage(cv, x | 0, y | 0);
    ctx.restore();
  };

  /* =====================================================================
   * ARAÇLAR
   * =================================================================== */
  const VEH = {
    rover: [
      '................',
      '.....ddddd......',
      '...ddbaaabdd....',
      '..dbaaaaaaabd...',
      '..daaaaaaaaad...',
      '.ddbaaaaaaabdd..',
      'dkkd.dbbbd.dkkd.',
      'dkkd..d.d..dkkd.',
      '.dd........dd...'
    ],
    drone: [
      'dllld......dllld',
      '.dkd........dkd.',
      '..d..dddd....d..',
      '.....dbabd......',
      '.....daaad......',
      '.....dbabd......',
      '..d..dddd....d..',
      '.dkd........dkd.',
      'dllld......dllld'
    ]
  };
  S.vehicle = function (ctx, x, y, type, scale, flip) {
    const rows = VEH[type] || VEH.rover;
    scale = scale || 1;
    const c = type === 'drone' ? '#7aa2ff' : '#d9b45a';
    const c2 = type === 'drone' ? '#26386e' : '#6a4a12';
    const key = 'veh_' + type + '_' + scale;
    const cv = P.cached(key, rows[0].length * scale, rows.length * scale,
      cx => paint(cx, rows, 0, 0, scale, makePal(c, c2)));
    if (flip) {
      ctx.save(); ctx.translate((x | 0) + cv.width, y | 0); ctx.scale(-1, 1);
      ctx.drawImage(cv, 0, 0); ctx.restore();
    } else ctx.drawImage(cv, x | 0, y | 0);
  };

  /* =====================================================================
   * EŞYA İKONLARI (16x16 sanal ızgara)
   * =================================================================== */
  function icon(ctx, ic, s) {
    const c = ic.c, c2 = ic.c2 || U.shade(ic.c, -0.4);
    const d = U.shade(c2, -0.4), l = U.shade(c, 0.35);
    const R = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x * s, y * s, w * s, h * s); };
    switch (ic.s) {
      case 'chunk': R(3, 5, 10, 7, c); R(4, 4, 7, 2, l); R(3, 11, 10, 2, c2); R(5, 6, 3, 2, l); break;
      case 'shard': R(7, 2, 3, 12, c); R(5, 5, 3, 8, c2); R(10, 6, 2, 6, l); break;
      case 'coil':  for (let i = 0; i < 4; i++) { R(3, 4 + i * 2, 10, 1, c); R(3, 5 + i * 2, 10, 1, c2); } R(2, 3, 2, 10, d); R(12, 3, 2, 10, d); break;
      case 'gem':   R(6, 2, 4, 2, l); R(4, 4, 8, 6, c); R(6, 10, 4, 3, c2); R(5, 5, 2, 3, l); break;
      case 'cap':   R(3, 5, 10, 4, c); R(5, 3, 6, 2, l); R(6, 9, 4, 5, c2); break;
      case 'blob':  R(4, 5, 8, 7, c); R(5, 4, 6, 1, l); R(4, 12, 8, 1, c2); R(6, 6, 2, 2, l); break;
      case 'fiber': R(3, 3, 2, 11, c); R(7, 2, 2, 12, c2); R(11, 4, 2, 10, c); break;
      case 'card':  R(2, 4, 12, 8, c2); R(3, 5, 10, 6, c); R(4, 6, 6, 1, l); R(4, 8, 8, 1, l); break;
      case 'cell':  R(4, 3, 8, 11, c); R(6, 1, 4, 2, c2); R(5, 5, 2, 7, l); R(4, 13, 8, 1, d); break;
      case 'pcb':   R(2, 3, 12, 10, c); R(4, 5, 3, 3, c2); R(9, 5, 3, 3, c2); R(3, 10, 10, 1, c2); R(5, 8, 1, 2, c2); break;
      case 'cap2':  R(5, 3, 6, 9, c); R(5, 3, 6, 2, l); R(7, 12, 1, 3, d); R(9, 12, 1, 3, d); break;
      case 'lens':  P.circle(ctx, 8 * s, 8 * s, 5 * s, c2); P.circle(ctx, 8 * s, 8 * s, 4 * s, c); P.circle(ctx, 7 * s, 7 * s, 1 * s, '#ffffff'); break;
      case 'box':   R(3, 4, 10, 9, c); R(3, 4, 10, 2, l); R(3, 11, 10, 2, c2); R(6, 7, 4, 3, c2); break;
      case 'prop':  R(7, 2, 2, 12, c2); R(2, 6, 6, 2, c); R(8, 8, 6, 2, c); R(7, 7, 2, 2, l); break;
      case 'ring':  P.circle(ctx, 8 * s, 8 * s, 6 * s, c); P.circle(ctx, 8 * s, 8 * s, 3 * s, '#0b1020'); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; R(8 + Math.cos(a) * 6.5 - 0.5, 8 + Math.sin(a) * 6.5 - 0.5, 1, 1, c2); } break;
      case 'disc':  P.circle(ctx, 8 * s, 8 * s, 6 * s, c2); P.circle(ctx, 8 * s, 8 * s, 5 * s, c); P.circle(ctx, 8 * s, 8 * s, 2 * s, '#0b1020'); R(11, 5, 3, 6, c2); break;
      case 'frame': R(2, 10, 12, 2, c); R(3, 5, 2, 6, c); R(11, 4, 2, 8, c); R(4, 5, 8, 2, c2); R(5, 7, 6, 2, c); break;
      case 'ant':   R(7, 4, 2, 10, c2); R(3, 3, 10, 1, c); R(4, 5, 8, 1, c); R(5, 7, 6, 1, c); R(5, 13, 6, 1, c2); break;
      case 'tire':  P.circle(ctx, 8 * s, 8 * s, 6 * s, c); P.circle(ctx, 8 * s, 8 * s, 3 * s, c2); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; R(8 + Math.cos(a) * 6 - 0.5, 8 + Math.sin(a) * 6 - 0.5, 1.5, 1.5, U.shade(c, 0.3)); } break;
      case 'mcu':   R(2, 4, 12, 8, c); R(4, 6, 8, 4, c2); for (let i = 0; i < 5; i++) { R(3 + i * 2, 2, 1, 2, '#c8c8c8'); R(3 + i * 2, 12, 1, 2, '#c8c8c8'); } break;
      case 'sensor': R(3, 5, 10, 8, c2); R(4, 6, 8, 3, c); P.circle(ctx, 8 * s, 10 * s, 2 * s, l); R(5, 3, 6, 2, c); break;
      case 'radar': R(6, 8, 4, 6, c2); P.circle(ctx, 8 * s, 6 * s, 5 * s, c); P.circle(ctx, 8 * s, 6 * s, 3 * s, c2); R(7, 1, 2, 3, l); break;
      case 'meter': R(2, 3, 12, 10, c2); R(4, 5, 8, 4, c); R(5, 10, 2, 2, l); R(9, 10, 2, 2, l); R(1, 12, 2, 3, '#c02744'); R(13, 12, 2, 3, '#111111'); break;
      case 'comms': R(4, 6, 8, 8, c2); R(5, 7, 6, 3, c); R(7, 1, 2, 5, c); R(4, 2, 2, 2, l); R(10, 2, 2, 2, l); break;
      case 'shield': R(3, 3, 10, 5, c); R(4, 8, 8, 3, c); R(6, 11, 4, 3, c2); R(5, 4, 3, 2, l); break;
      case 'suit':  R(4, 2, 8, 4, c); R(3, 6, 10, 6, c); R(2, 7, 1, 4, c2); R(13, 7, 1, 4, c2); R(4, 12, 3, 3, c2); R(9, 12, 3, 3, c2); R(5, 3, 6, 2, l); break;
      case 'shirt': R(3, 4, 10, 3, c); R(1, 5, 3, 3, c2); R(12, 5, 3, 3, c2); R(4, 7, 8, 7, c); R(6, 4, 4, 2, U.shade(c, -0.25)); break;
      case 'boot':  R(3, 3, 5, 8, c); R(3, 11, 11, 3, c2); R(8, 8, 5, 3, c); R(3, 13, 11, 1, d); break;
      case 'cutter': R(3, 9, 6, 4, c2); R(9, 6, 4, 3, c); R(7, 7, 3, 3, l); R(4, 12, 3, 2, d); break;
      case 'gun':   R(2, 6, 11, 4, c); R(3, 10, 4, 5, c2); R(12, 7, 3, 2, l); R(5, 5, 4, 1, c2); break;
      case 'lance': R(2, 12, 9, 2, c2); R(9, 6, 3, 7, c); R(10, 1, 2, 6, l); R(3, 10, 3, 3, c); break;
      case 'kit':   R(2, 5, 12, 9, c2); R(3, 6, 10, 7, c); R(7, 7, 2, 5, '#ffffff'); R(5, 9, 6, 2, '#ffffff'); R(6, 3, 4, 2, c2); break;
      case 'tank':  R(5, 2, 6, 12, c); R(6, 1, 4, 2, c2); R(6, 4, 2, 7, l); R(5, 13, 6, 2, c2); break;
      case 'vial':  R(6, 2, 4, 2, c2); R(5, 4, 6, 9, c); R(6, 6, 2, 5, l); R(5, 12, 6, 2, c2); break;
      case 'book':  R(2, 3, 11, 11, c2); R(3, 4, 9, 9, c); R(3, 4, 2, 9, U.shade(c, -0.3)); R(6, 6, 5, 1, l); R(6, 8, 5, 1, l); R(6, 10, 3, 1, l); break;
      case 'frag':  R(7, 1, 3, 5, l); R(5, 5, 7, 6, c); R(6, 11, 5, 4, c2); R(6, 6, 2, 3, '#ffffff'); break;
      case 'camera':
        R(2, 5, 12, 8, c); R(2, 5, 12, 1, l); R(4, 3, 4, 2, c2); R(11, 6, 2, 2, l);
        P.circle(ctx, 8 * s, 9 * s, 3 * s, c2); P.circle(ctx, 8 * s, 9 * s, 2 * s, '#cdeaff');
        R(7, 8, 1, 1, '#ffffff'); R(2, 12, 12, 1, d); break;
      case 'disk':
        P.circle(ctx, 8 * s, 8 * s, 6 * s, c2); P.circle(ctx, 8 * s, 8 * s, 5 * s, c);
        P.circle(ctx, 8 * s, 8 * s, 2 * s, '#0b1020'); R(9, 3, 4, 4, l); break;
      default:      R(4, 4, 8, 8, c); R(5, 5, 6, 6, c2);
    }
  }
  S.icon = icon;

  /* DOM satırları için ikon canvas'ı */
  S.iconCanvas = function (itemId, size) {
    const item = QW.Items.get(itemId);
    const ic = (item && item.icon) || { s: 'box', c: '#7d93a8' };
    size = size || 32;
    const s = Math.max(1, Math.floor(size / 16));
    return P.cached('ic_' + itemId + '_' + s, 16 * s, 16 * s, ctx => icon(ctx, ic, s));
  };
  S.iconDataURL = function (itemId, size) { return S.iconCanvas(itemId, size).toDataURL(); };

  /* =====================================================================
   * DÜNYA ÜSTÜ ÖĞELER
   * =================================================================== */
  const NODE_STYLE = {
    scrap:        { s: 'rock', c: '#8a94a8' },
    silicon:      { s: 'crystal', c: '#9fb6c9' },
    copper:       { s: 'rock', c: '#d98b45' },
    titanium:     { s: 'rock', c: '#c8d2e0' },
    quartz:       { s: 'crystal', c: '#b9e6ff' },
    ice_shard:    { s: 'crystal', c: '#d8f4ff' },
    spore_cap:    { s: 'mush', c: '#c07de0' },
    acid_sac:     { s: 'pool', c: '#9be24a' },
    bio_fiber:    { s: 'plant', c: '#8fd98f' },
    rubber_sap:   { s: 'plant', c: '#4a4a52' },
    aero_data:    { s: 'wind', c: '#8fb6ff' },
    power_cell:   { s: 'crate', c: '#ffd166' },
    data_crystal: { s: 'crystal', c: '#a58bff' }
  };

  S.drawNode = function (ctx, x, y, itemId) {
    const st = NODE_STYLE[itemId] || { s: 'rock', c: '#8a94a8' };
    const c = st.c, d = U.shade(c, -0.45), l = U.shade(c, 0.3);
    const R = (dx, dy, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x + dx, y + dy, w, h); };
    switch (st.s) {
      case 'rock':
        R(4, 8, 8, 5, d); R(4, 7, 8, 4, c); R(5, 7, 3, 2, l); break;
      case 'crystal':
        R(6, 4, 3, 9, d); R(6, 4, 2, 8, c); R(6, 4, 1, 4, l);
        R(9, 7, 2, 6, c); R(4, 8, 2, 5, c); break;
      case 'mush':
        R(7, 9, 2, 4, d); R(4, 6, 8, 3, c); R(5, 5, 6, 2, l); break;
      case 'pool':
        R(3, 9, 10, 4, d); R(4, 9, 8, 3, c); R(6, 10, 3, 1, l); break;
      case 'plant':
        R(7, 6, 1, 7, d); R(5, 7, 2, 2, c); R(9, 8, 2, 2, c); R(7, 5, 2, 2, l); break;
      case 'wind':
        R(3, 6, 7, 1, c); R(5, 8, 8, 1, c); R(4, 10, 6, 1, l); break;
      case 'crate':
        R(4, 6, 8, 7, d); R(5, 7, 6, 5, c); R(5, 9, 6, 1, l); break;
    }
  };

  /* Yol üstü işaretleri — küçük, tek tile'lık sahneler */
  S.drawLandmark = function (ctx, x, y, id) {
    const R = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + dx, y + dy, w, h); };
    switch (id) {
      case 'marker':
        R(7, 3, 2, 11, '#8a94a8'); R(4, 3, 8, 4, '#ffd166'); R(4, 3, 8, 1, '#fff0c0');
        R(5, 13, 6, 2, '#3a404e'); break;
      case 'bones':
        R(3, 10, 10, 2, '#d8d0b8'); R(4, 8, 2, 3, '#d8d0b8'); R(9, 7, 2, 4, '#d8d0b8');
        R(6, 6, 4, 3, '#e6e0cc'); R(6, 12, 4, 1, '#a89f88'); break;
      case 'camp':
        R(3, 8, 10, 6, '#2a2418'); R(3, 8, 10, 1, '#4a4028');
        R(5, 4, 6, 4, '#3a3020'); R(6, 12, 4, 2, '#1c1810');
        R(11, 5, 2, 8, '#5b6b8a'); break;
      case 'cache':
        R(4, 7, 9, 7, '#2c3550'); R(4, 7, 9, 1, '#4a5a80');
        R(6, 9, 5, 3, '#4df2c8'); R(3, 5, 3, 3, '#8a94a8'); break;
      case 'mast':
        R(2, 11, 13, 2, '#5b6b8a'); R(4, 8, 2, 4, '#6b7b9a'); R(9, 6, 2, 6, '#6b7b9a');
        R(7, 4, 6, 2, '#8a9ab8'); R(2, 13, 13, 1, '#3a4458'); break;
      case 'crate':
        R(3, 7, 10, 7, '#6a5a3a'); R(3, 7, 10, 2, '#8a7a4a');
        R(3, 10, 10, 1, '#4a3f28'); R(6, 9, 4, 3, '#ffd166'); break;
    }
  };

  S.drawPoi = function (ctx, x, y, poi) {
    const R = (dx, dy, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x + dx, y + dy, w, h); };
    switch (poi.kind) {
      case 'wreck': {
        /* Gemi gövdesi, kırık kanat, çekirdek yuvası */
        R(-40, -18, 80, 30, '#4a5060'); R(-40, -18, 80, 4, '#7a8494');
        R(-44, -8, 90, 6, '#3a404e');
        R(-30, 12, 60, 8, '#5c6270'); R(-30, 18, 60, 3, '#2e3340');
        R(-52, -2, 14, 22, '#3a404e'); R(38, -6, 16, 18, '#3a404e');
        R(-8, -14, 16, 16, '#20283a'); R(-6, -12, 12, 12, '#0e2a26');
        R(-4, -10, 8, 8, '#4df2c8');
        for (let i = -3; i <= 3; i++) R(i * 12, 22 + (i & 1) * 4, 6, 4, '#4a5060');
        break;
      }
      case 'station': {
        R(-34, -26, 68, 44, '#2c3550'); R(-34, -26, 68, 5, '#4df2c8');
        R(-30, -20, 20, 14, '#121a30'); R(10, -20, 20, 14, '#121a30');
        R(-10, -4, 20, 22, '#121a30'); R(-6, 2, 12, 16, '#4df2c8');
        R(-40, 16, 80, 6, '#1a2036');
        R(28, -44, 5, 20, '#5b6b8a'); R(24, -48, 13, 5, '#7aa2ff');
        break;
      }
      case 'camp': {
        const col = (QW.NPCs.get(poi.npc) || {}).color || '#ffd166';
        R(-16, -10, 32, 20, '#2a2418'); R(-16, -10, 32, 3, col);
        R(-12, -6, 8, 8, '#12100a'); R(4, -6, 8, 8, '#12100a');
        R(-3, 10, 6, 6, '#3a2a12');
        R(-2, -22, 4, 12, '#5b6b8a'); R(-6, -26, 12, 4, col);
        break;
      }
      case 'lair': {
        R(-24, -14, 48, 28, '#181c26'); R(-24, -14, 48, 4, '#ff5d7a');
        R(-16, -6, 32, 18, '#0a0c12');
        for (let i = 0; i < 5; i++) { R(-14 + i * 7, -6, 3, 6, '#3a2028'); R(-14 + i * 7, 6, 3, 6, '#3a2028'); }
        break;
      }
      case 'ruin': {
        R(-20, -6, 40, 14, '#4a4a52'); R(-20, -8, 40, 3, '#6a6a74');
        R(-18, -20, 5, 14, '#5a5a64'); R(-4, -24, 5, 18, '#5a5a64'); R(12, -18, 5, 12, '#5a5a64');
        R(-8, 0, 6, 6, '#a58bff');
        break;
      }
      case 'city': {
        /* Büyük yerleşim: sur, kule sırası, kapı ve dış mahalleler */
        R(-92, 22, 184, 6, '#1a2030');
        for (let i = -6; i <= 6; i++) R(i * 14 - 3, 16, 7, 8, '#232a3a');       // dış barakalar
        R(-78, -14, 156, 38, '#2c3550');                                        // sur
        R(-78, -14, 156, 4, '#4a5a80');
        R(-78, 20, 156, 4, '#161c2c');
        /* Kule sırası — yükseklikleri değişken, siluet kırılsın */
        const hts = [26, 40, 18, 52, 30, 44, 22, 36];
        hts.forEach((h, i) => {
          const x = -70 + i * 18;
          R(x, -14 - h, 13, h, i % 2 ? '#323d5e' : '#3a4668');
          R(x, -14 - h, 13, 3, '#586a9a');
          for (let w = 0; w < 3; w++) {
            const lit = (Math.floor(Date.now() / 900) + i + w) % 3 === 0;
            R(x + 3, -12 - h + 8 + w * 9, 7, 4, lit ? '#ffd166' : '#151b2a');
          }
        });
        /* Kapı */
        R(-10, 2, 20, 22, '#101624');
        R(-7, 6, 14, 18, '#ffd166');
        R(-7, 6, 14, 3, '#8a6a20');
        /* Anten direği */
        R(64, -56, 4, 44, '#5b6b8a');
        R(58, -60, 16, 4, '#7aa2ff');
        break;
      }
      case 'pass': {
        /* Geçit: iki kaya duvarı arasında dar koridor ve işaret direği */
        R(-46, -30, 30, 60, '#4a4f5e'); R(-46, -30, 30, 4, '#6a7180');
        R(16, -30, 30, 60, '#4a4f5e');  R(16, -30, 30, 4, '#6a7180');
        R(-16, -30, 32, 60, '#6b6250');
        for (let i = -2; i <= 2; i++) R(-13 + i * 6, -26 + ((i + 2) % 3) * 18, 4, 5, '#7d7566');
        /* İşaret direği */
        R(-2, -14, 3, 22, '#8a94a8');
        R(-12, -16, 12, 5, '#4df2c8');
        R(1, -8, 11, 5, '#ffd166');
        break;
      }
      case 'archive': {
        /* Yarı gömülü kubbe: kararmış camlar, kaideye vuran zayıf mavi ışık */
        for (let i = 0; i < 5; i++) {
          const w = 60 - i * 10, h = 6;
          R(-w / 2, -6 - i * 6, w, h, i % 2 ? '#232a3a' : '#2c3550');
        }
        R(-34, 4, 68, 12, '#1a2030'); R(-34, 4, 68, 2, '#3a4560');
        R(-10, -2, 20, 10, '#0a0e18');
        const pulse = (Math.floor(Date.now() / 420) % 2) ? '#4a9fd0' : '#2a5f80';
        R(-7, 1, 14, 5, pulse);
        R(-40, 14, 80, 4, '#141a26');
        for (let i = -2; i <= 2; i++) R(i * 15 - 2, 18, 5, 3, '#232a3a');
        break;
      }
      case 'oasis': {
        const healed = !!poi.healed;
        /* Krater kenarı */
        for (let i = 0; i < 3; i++) {
          R(-40 + i * 3, -20 + i * 2, 80 - i * 6, 3, i ? '#5a4a34' : '#6b5940');
          R(-40 + i * 3, 16 - i * 2, 80 - i * 6, 3, i ? '#5a4a34' : '#6b5940');
        }
        R(-34, -16, 68, 32, healed ? '#2f6f9e' : '#6a8a2a');
        R(-30, -13, 60, 26, healed ? '#4a9fd0' : '#8fbf3a');
        R(-24, -9, 48, 8, healed ? '#7fc8ea' : '#a8d456');
        /* Suya uzanırken taşlaşmış hayvan siluetleri */
        [[-30, -22], [26, -20], [-36, 12], [32, 10]].forEach(([sx, sy], i) => {
          R(sx, sy, 3, 8, '#4a4a52');
          R(sx + (i % 2 ? -3 : 3), sy - 3, 5, 4, '#4a4a52');
          R(sx + 1, sy + 8, 2, 3, '#3a3a42');
        });
        if (healed) { R(-6, -4, 3, 3, '#cdeaff'); R(8, 2, 2, 2, '#cdeaff'); }
        break;
      }
      case 'pod': {
        R(-10, -6, 20, 14, '#5a6070'); R(-10, -6, 20, 3, '#8a94a8');
        R(-6, -2, 12, 7, '#1a2030'); R(-4, 0, 8, 4, '#7aa2ff');
        R(-14, 6, 28, 3, '#3a404e');
        break;
      }
    }
  };

  /* Portre (diyalog kutusu) */
  S.portrait = function (cv, spr) {
    const ctx = P.ctx(cv);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#070c18'; ctx.fillRect(0, 0, cv.width, cv.height);
    const look = S.npcLook(spr.s);
    const tmp = P.canvas(12, 16);
    drawBody(P.ctx(tmp), look, 'down', 0, 0, 0);
    /* Başı büyütüp ortala */
    ctx.imageSmoothingEnabled = false;
    /* Kask/yüz bölgesini kırp ve büyüt */
    ctx.drawImage(tmp, 2, 0, 8, 8, -2, -2, 40, 40);
  };

})(window.QW);
