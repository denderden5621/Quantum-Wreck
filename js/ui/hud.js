/* =========================================================================
 * QW.HUD — durum çubukları, saat, hava, mini harita, bildirimler
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils;
  const H = QW.HUD = { el: {}, minimapOn: false, _t: 0 };

  H.init = function () {
    H.el.root = document.getElementById('hud');
    H.el.bars = {};
    document.querySelectorAll('#hud-left .bar').forEach(b => {
      H.el.bars[b.dataset.bar] = { root: b, fill: b.querySelector('i'), txt: b.querySelector('b') };
    });
    H.el.clock = document.getElementById('hud-clock');
    H.el.weather = document.getElementById('hud-weather');
    H.el.credits = document.getElementById('hud-credits');
    H.el.biome = document.getElementById('hud-biome');
    H.el.quest = document.querySelector('#hud-quest span');
    H.el.questBox = document.getElementById('hud-quest');
    H.el.minimap = document.getElementById('minimap');
    H.el.toasts = document.getElementById('toasts');
    H.el.flash = document.getElementById('flash');
    H.el.glitch = document.getElementById('glitch-overlay');
    H.el.stage = document.getElementById('stage');
  };

  H.show = function (v) { H.el.root.classList.toggle('hidden', !v); };

  H.setMinimap = function (v) {
    H.minimapOn = v;
    H.el.minimap.classList.toggle('hidden', !v);
  };

  function bar(key, val, max, critAt) {
    const b = H.el.bars[key]; if (!b) return;
    const p = U.clamp(val / max, 0, 1);
    b.fill.style.width = (p * 100).toFixed(1) + '%';
    b.txt.textContent = Math.round(val);
    b.root.classList.toggle('crit', p <= (critAt === undefined ? 0.25 : critAt));
  }

  H.update = function () {
    const P = QW.Player, Wd = QW.World;
    bar('hp', P.hp, P.hpMax);
    bar('o2', P.o2, P.o2MaxTotal());
    bar('sta', P.sta, P.staMaxTotal());
    bar('str', P.stress, P.stressMax, -1);
    H.el.bars.str.root.classList.toggle('crit', P.stress > 70);

    H.el.clock.textContent = Wd.clockString() + '  ' + QW.t('hud_day', { n: Wd.day });
    const w = QW.Weather.current;
    H.el.weather.textContent = QW.t(w.name);
    H.el.weather.style.color = w.id === 'clear' ? '#7d93a8' : '#ff5d7a';
    H.el.credits.textContent = Math.floor(P.credits) + ' EC';
    const t = P.tilePos();
    /* Büyük haritada nerede olduğunu bilmek önemli: bölge adı + biyom */
    const region = QW.Regions.nameAt(t.tx, t.ty);
    H.el.biome.textContent = region
      ? region + ' · ' + Wd.biomeNameAt(t.tx, t.ty)
      : Wd.biomeNameAt(t.tx, t.ty);

    const q = QW.Quests.tracked();
    if (q) {
      H.el.questBox.classList.remove('hidden');
      H.el.quest.textContent = q.need > 1 ? q.text + ' ' + q.have + '/' + q.need : q.text;
    } else H.el.questBox.classList.add('hidden');

    if (H.minimapOn) QW.World.drawMinimap(H.el.minimap, t.tx, t.ty, 96, false);
  };

  /* ---------------------------- BİLDİRİM ---------------------------- */
  H.toast = function (msg, kind) {
    if (!H.el.toasts) { console.log('[toast]', msg); return; }
    const d = document.createElement('div');
    d.className = 'toast ' + (kind || '');
    d.textContent = msg;
    H.el.toasts.appendChild(d);
    /* Aynı anda en fazla 4 bildirim */
    while (H.el.toasts.children.length > 3) H.el.toasts.removeChild(H.el.toasts.firstChild);
    setTimeout(() => { d.style.opacity = '0'; d.style.transition = 'opacity .3s'; }, 1800);
    setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 2150);
  };

  /* ---------------------------- EFEKTLER ---------------------------- */
  H.flash = function (ms) {
    H.el.flash.classList.add('on');
    setTimeout(() => H.el.flash.classList.remove('on'), ms || 120);
  };
  H.glitch = function (on) { H.el.glitch.classList.toggle('on', !!on); };
  /* Animasyonu yeniden tetiklemek zorunlu reflow gerektirir; bataklıkta
     saniyede bir hasar alındığı için çağrı hızı sınırlanır. */
  let lastShake = 0;
  H.shake = function () {
    if (!QW.Save.settings.shake) return;
    const now = performance.now();
    if (now - lastShake < 350) return;
    lastShake = now;
    H.el.stage.classList.remove('shake');
    void H.el.stage.offsetWidth;
    H.el.stage.classList.add('shake');
    setTimeout(() => H.el.stage.classList.remove('shake'), 320);
  };
  H.setScanlines = function (v) {
    document.getElementById('scanlines').style.display = v ? '' : 'none';
  };

})(window.QW);
