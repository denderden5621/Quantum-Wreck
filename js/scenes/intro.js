/* =========================================================================
 * Sahne: INTRO — glitch, düşüş, beyaz parlama ve uyanış
 * Web Audio ile üretilen, giderek tizleşen kare dalga gerilim müziği çalar.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const P = QW.Pixel, U = QW.Utils;

  let phase = 0, t = 0, ship = null, debris = [], done = false;

  const TEXTS = ['intro_1', 'intro_2', 'intro_3', 'intro_4', 'intro_5'];

  const Intro = {
    enter() {
      QW.HUD.show(false);
      QW.Input.showTouch(false);
      QW.Audio.unlock();
      QW.Audio.playMusic('tension');
      phase = 0; t = 0; done = false;
      ship = { x: 0.5, y: 0.28, rot: 0, vy: 0 };
      debris = [];
      for (let i = 0; i < 26; i++) {
        debris.push({ x: Math.random(), y: Math.random(), v: 0.2 + Math.random() * 0.9, s: 1 + Math.floor(Math.random() * 2) });
      }
      QW.HUD.glitch(true);
      Intro.showText();
    },

    showText() {
      const c = document.getElementById('cinema');
      const title = document.getElementById('cinema-title');
      const text = document.getElementById('cinema-text');
      const acts = document.getElementById('cinema-actions');
      c.classList.remove('hidden');
      c.style.background = 'rgba(5,7,13,0.72)';
      title.textContent = phase === 2 ? QW.t('intro_3').split('\n')[0] : QW.t('game_title');
      title.classList.add('glitch');
      text.textContent = QW.t(TEXTS[phase]);
      acts.innerHTML = '';
      const b = document.createElement('button');
      b.className = 'btn pri';
      b.textContent = phase >= TEXTS.length - 1 ? QW.t('wake_up') : QW.t('continue');
      QW.Utils.tap(b, () => { QW.Audio.unlock(); QW.Audio.sfx('glitch'); Intro.next(); });
      acts.appendChild(b);
    },

    next() {
      phase++;
      if (phase >= TEXTS.length) { Intro.crash(); return; }
      if (phase === 2) { QW.HUD.shake(); QW.Audio.sfx('alarm'); }
      Intro.showText();
    },

    /* Beyaz parlama + çınlama, ardından karakter oluşturucu */
    crash() {
      if (done) return;
      done = true;
      document.getElementById('cinema').classList.add('hidden');
      document.getElementById('cinema-title').classList.remove('glitch');
      QW.Audio.sfx('explode');
      QW.HUD.shake();
      setTimeout(() => {
        QW.HUD.flash(700);
        QW.Audio.sfx('ring');
        QW.HUD.glitch(false);
      }, 500);
      setTimeout(() => {
        QW.Audio.stopMusic();
        QW.Scenes.go('creator');
      }, 1700);
    },

    exit() {
      QW.HUD.glitch(false);
      const c = document.getElementById('cinema');
      c.classList.add('hidden'); c.style.background = '';
      document.getElementById('cinema-title').classList.remove('glitch');
    },

    update(dt) {
      t += dt;
      ship.rot += dt * (0.6 + phase * 0.5);
      ship.y += dt * 0.012 * phase;
      debris.forEach(d => { d.y += d.v * dt * 0.35; if (d.y > 1.1) { d.y = -0.05; d.x = Math.random(); } });
    },

    draw(ctx) {
      const S = P.Screen;
      /* Anomali içi — mor/yeşil girdap */
      ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, S.w, S.h);
      const cx = S.w / 2, cy = S.h * 0.5;
      for (let i = 0; i < 9; i++) {
        const r = 8 + i * 11 + Math.sin(t * 2 + i * 0.7) * 4;
        ctx.strokeStyle = i % 2 ? 'rgba(122,162,255,' + (0.30 - i * 0.02) + ')'
                                : 'rgba(199,155,255,' + (0.28 - i * 0.02) + ')';
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.5, t * 0.7 + i * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      /* Enkaz parçaları */
      debris.forEach(d => {
        ctx.fillStyle = '#7d8aa5';
        ctx.fillRect((d.x * S.w) | 0, (d.y * S.h) | 0, d.s, d.s);
      });
      /* Gemi */
      const sx = ship.x * S.w, sy = ship.y * S.h;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(ship.rot);
      ctx.fillStyle = '#c9d4e4'; ctx.fillRect(-14, -4, 28, 8);
      ctx.fillStyle = '#5c6880'; ctx.fillRect(-14, 0, 28, 4);
      ctx.fillStyle = '#4df2c8'; ctx.fillRect(6, -2, 4, 4);
      ctx.fillStyle = '#ff5d7a'; ctx.fillRect(-16, -2, 4, 4);
      ctx.fillStyle = '#8a94a8'; ctx.fillRect(-6, -8, 5, 4); ctx.fillRect(-6, 4, 5, 4);
      ctx.restore();
      /* Alev izi */
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(255,140,60,0.5)' : 'rgba(255,60,60,0.35)';
        ctx.fillRect(sx - 18 - i * 3, sy - 2 + Math.sin(t * 20 + i) * 2, 3, 3);
      }
      /* Tarama bozulması */
      if (Math.random() < 0.3) {
        const y = Math.floor(Math.random() * S.h);
        ctx.fillStyle = 'rgba(77,242,200,0.25)';
        ctx.fillRect(0, y, S.w, 1 + Math.floor(Math.random() * 3));
      }
    }
  };

  QW.Scenes.register('intro', Intro);

})(window.QW);
