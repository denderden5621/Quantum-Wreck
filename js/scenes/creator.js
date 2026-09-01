/* =========================================================================
 * Sahne: CREATOR — mürettebat kaydı / karakter özelleştirme
 * Zırhın altına giyilen kıyafet seçimleri doğrudan dayanıklılık (stamina),
 * yenilenme hızı ve direnç statlarını belirler.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const P = QW.Pixel;

  const SKIN  = ['#f4d3b0', '#e0ac7e', '#c98d5e', '#a06a44', '#7a4b2c', '#5a361f'];
  const HAIR  = ['#20242e', '#3a2a1e', '#6a4a10', '#a06a3a', '#e8e8f0', '#5a3a7a', '#2f6f5a'];
  const CLOTH = ['#e0e4ea', '#4ad0e0', '#ff8fb0', '#ffd166', '#7aa2ff', '#8fd98f', '#c79bff', '#33333a'];
  const BOOTC = ['#a06a3a', '#4e3018', '#5a6a4a', '#33333a', '#7a8494'];
  const VISOR = ['#4df2c8', '#8fd0ff', '#ffd166', '#ff8fb0', '#c79bff'];

  const SHIRTS = ['shirt_boxy', 'shirt_drifit', 'shirt_thermal'];
  const BOOTS  = ['boots_cushion', 'boots_grip'];

  const cfg = {
    name: 'GÖKTAY-7',
    skin: SKIN[1], hair: HAIR[1],
    shirtItem: SHIRTS[0], shirtColor: CLOTH[0],
    bootItem: BOOTS[0], bootColor: BOOTC[0],
    visor: VISOR[0]
  };

  let el = {}, prevCv = null, frame = 0, ft = 0;

  function tap(node, fn) { QW.Utils.tap(node, () => { QW.Audio.sfx('ui'); fn(); }); }
  function elm(tag, cls, txt) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt !== undefined) n.textContent = txt;
    return n;
  }

  function swatches(colors, cur, fn) {
    const w = elm('div', 'swatches');
    colors.forEach(c => {
      const b = elm('button', 'sw' + (c === cur ? ' on' : ''));
      b.style.background = c;
      tap(b, () => fn(c));
      w.appendChild(b);
    });
    return w;
  }

  function look() {
    return {
      skin: cfg.skin, hair: cfg.hair, shirt: cfg.shirtColor,
      boots: cfg.bootColor, suit: '#c9d4e4', visor: cfg.visor
    };
  }

  /* Seçilen kıyafetlerin toplam etkisi */
  function previewStats() {
    const s = { sta: 0, regen: 0, spd: 0, resist: {} };
    [cfg.shirtItem, cfg.bootItem].forEach(id => {
      const it = QW.Items.get(id);
      if (!it) return;
      s.sta += it.sta || 0;
      s.regen += it.regen || 0;
      s.spd += it.spd || 0;
      if (it.resist) Object.keys(it.resist).forEach(k => { s.resist[k] = (s.resist[k] || 0) + it.resist[k]; });
    });
    return s;
  }

  function render() {
    const body = el.body;
    body.innerHTML = ''; el.foot.innerHTML = '';
    el.title.textContent = QW.t('creator_title');
    el.tabs.style.display = 'none';

    /* Önizleme */
    const wrap = elm('div');
    wrap.style.textAlign = 'center';
    wrap.style.margin = '4px 0 10px';
    prevCv = elm('canvas');
    prevCv.width = 12; prevCv.height = 16;
    prevCv.style.width = '96px'; prevCv.style.height = '128px';
    prevCv.style.imageRendering = 'pixelated';
    prevCv.style.background = '#0b1020';
    prevCv.style.border = '2px solid #26365c';
    wrap.appendChild(prevCv);
    body.appendChild(wrap);

    /* İsim */
    const nameRow = elm('div', 'row');
    nameRow.appendChild(elm('div', 'tx')).appendChild(elm('b', null, QW.t('cc_name')));
    const inp = elm('input');
    inp.type = 'text'; inp.value = cfg.name; inp.maxLength = 12;
    inp.style.cssText = 'flex:1;min-width:0;background:#121a30;border:2px solid #26365c;color:#dff6ff;font-family:inherit;font-size:1em;padding:8px;min-height:44px;';
    inp.addEventListener('input', () => { cfg.name = inp.value.toUpperCase().slice(0, 12) || 'GÖKTAY-7'; });
    nameRow.appendChild(inp);
    body.appendChild(nameRow);

    /* Renkler */
    body.appendChild(elm('div', 'sec', QW.t('cc_body')));
    body.appendChild(swatches(SKIN, cfg.skin, c => { cfg.skin = c; render(); }));
    body.appendChild(elm('div', 'sec', QW.t('cc_hair')));
    body.appendChild(swatches(HAIR, cfg.hair, c => { cfg.hair = c; render(); }));

    /* Tişört seçimi */
    body.appendChild(elm('div', 'sec', QW.t('cc_shirt')));
    SHIRTS.forEach(id => {
      const it = QW.Items.get(id);
      body.appendChild(QW.Panels.row({
        item: id,
        title: QW.Items.name(id),
        sub: QW.Items.desc(id),
        on: cfg.shirtItem === id,
        fn: () => { cfg.shirtItem = id; QW.Audio.sfx('ui'); render(); }
      }));
    });
    body.appendChild(elm('div', 'sec', QW.t('cc_fabric')));
    body.appendChild(swatches(CLOTH, cfg.shirtColor, c => { cfg.shirtColor = c; render(); }));

    /* Bot seçimi */
    body.appendChild(elm('div', 'sec', QW.t('cc_boots')));
    BOOTS.forEach(id => {
      body.appendChild(QW.Panels.row({
        item: id,
        title: QW.Items.name(id),
        sub: QW.Items.desc(id),
        on: cfg.bootItem === id,
        fn: () => { cfg.bootItem = id; QW.Audio.sfx('ui'); render(); }
      }));
    });
    body.appendChild(swatches(BOOTC, cfg.bootColor, c => { cfg.bootColor = c; render(); }));

    body.appendChild(elm('div', 'sec', QW.t('cc_visor')));
    body.appendChild(swatches(VISOR, cfg.visor, c => { cfg.visor = c; render(); }));

    /* Stat önizleme */
    const st = previewStats();
    body.appendChild(elm('div', 'sec', QW.t('cc_stats')));
    const line = (k, v) => {
      const d = elm('div', 'statline');
      d.appendChild(elm('em', null, k)); d.appendChild(elm('span', null, v));
      body.appendChild(d);
    };
    line(QW.t('st_stamina'), '+' + st.sta);
    line(QW.t('st_regen'), '+' + st.regen.toFixed(1));
    line(QW.t('st_spd'), '+' + st.spd.toFixed(2));
    Object.keys(st.resist).forEach(k => line(k.toUpperCase(), '+' + Math.round(st.resist[k] * 100) + '%'));

    el.foot.appendChild(QW.Panels.btn(QW.t('cc_randomize'), () => {
      cfg.skin = QW.Utils.pick(SKIN); cfg.hair = QW.Utils.pick(HAIR);
      cfg.shirtItem = QW.Utils.pick(SHIRTS); cfg.shirtColor = QW.Utils.pick(CLOTH);
      cfg.bootItem = QW.Utils.pick(BOOTS); cfg.bootColor = QW.Utils.pick(BOOTC);
      cfg.visor = QW.Utils.pick(VISOR);
      render();
    }));
    el.foot.appendChild(QW.Panels.btn(QW.t('cc_start'), () => {
      QW.Audio.sfx('ok');
      finish();
    }, 'pri'));
  }

  function finish() {
    el.root.classList.add('hidden');
    el.tabs.style.display = '';
    el.close.style.display = '';
    QW.Game.newGame(cfg);
  }

  const Creator = {
    enter() {
      QW.HUD.show(false);
      QW.Input.showTouch(false);
      QW.Audio.playMusic('camp');
      el.root = document.getElementById('panel');
      el.title = document.getElementById('panel-title');
      el.tabs = document.getElementById('panel-tabs');
      el.body = document.getElementById('panel-body');
      el.foot = document.getElementById('panel-foot');
      el.close = document.getElementById('panel-close');
      el.close.style.display = 'none';
      el.root.classList.remove('hidden');
      render();
    },
    exit() {
      el.root.classList.add('hidden');
      el.close.style.display = '';
      el.tabs.style.display = '';
    },
    update(dt) {
      ft += dt;
      if (ft > 0.28) { ft = 0; frame = frame === 1 ? 2 : 1; }
      if (prevCv) {
        const ctx = P.ctx(prevCv);
        ctx.clearRect(0, 0, 12, 16);
        QW.Sprites.player(ctx, 0, 0, look(), 'down', frame);
      }
    },
    draw(ctx) {
      const S = P.Screen;
      ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, S.w, S.h);
    }
  };

  QW.Scenes.register('creator', Creator);

})(window.QW);
