/* =========================================================================
 * Sahne: BOOT — açılış ekranı ve ana menü
 * ========================================================================= */
(function (QW) {
  'use strict';

  const P = QW.Pixel;
  let stars = [], t = 0;

  const Boot = {
    enter() {
      QW.HUD.show(false);
      QW.Input.showTouch(false);
      QW.Audio.playMusic('tension');
      t = 0;
      stars = [];
      for (let i = 0; i < 70; i++) {
        stars.push({ x: Math.random(), y: Math.random(), s: Math.random() * 2 + 0.4, v: 0.02 + Math.random() * 0.08 });
      }
      Boot.menu();
    },

    menu() {
      const c = document.getElementById('cinema');
      const title = document.getElementById('cinema-title');
      const text = document.getElementById('cinema-text');
      const acts = document.getElementById('cinema-actions');
      c.classList.remove('hidden');
      c.style.background = 'transparent';
      title.textContent = QW.t('game_title');
      title.classList.add('glitch');
      text.textContent = QW.t('game_sub');
      acts.innerHTML = '';

      const mk = (label, fn, cls) => {
        const b = document.createElement('button');
        b.className = 'btn ' + (cls || '');
        b.textContent = label;
        QW.Utils.tap(b, () => { QW.Audio.unlock(); QW.Audio.sfx('ok'); fn(); });
        acts.appendChild(b);
        return b;
      };

      mk(QW.t('new_game'), () => { hide(); QW.Scenes.go('intro'); }, 'pri');
      if (QW.Save.has()) {
        mk(QW.t('load_game'), () => {
          hide();
          if (!QW.Game.loadGame()) { QW.HUD.toast(QW.t('no_save'), 'bad'); Boot.menu(); }
        });
      }
      mk(QW.I18N.lang === 'tr' ? 'Language: English' : 'Dil: Türkçe', () => {
        QW.I18N.setLang(QW.I18N.lang === 'tr' ? 'en' : 'tr');
        QW.Save.settings.lang = QW.I18N.lang; QW.Save.saveSettings();
        Boot.menu();
      });
      mk(QW.Save.settings.sound ? QW.t('audio_on') : QW.t('audio_off'), () => {
        QW.Save.settings.sound = !QW.Save.settings.sound;
        QW.Audio.setEnabled(QW.Save.settings.sound);
        QW.Save.saveSettings();
        if (QW.Save.settings.sound) QW.Audio.playMusic('tension');
        Boot.menu();
      });
      if (QW.Save.has()) {
        mk(QW.t('delete_save'), () => {
          QW.Dialog.confirm(QW.t('delete_save_q'), () => {
            QW.Save.clear(); QW.HUD.toast(QW.t('save_deleted'), 'info'); Boot.menu();
          });
        }, 'dan');
      }

      function hide() { c.classList.add('hidden'); title.classList.remove('glitch'); }
    },

    exit() {
      document.getElementById('cinema').classList.add('hidden');
      document.getElementById('cinema-title').classList.remove('glitch');
      document.getElementById('cinema').style.background = '';
    },

    update(dt) {
      t += dt;
      stars.forEach(s => { s.y += s.v * dt * 0.2; if (s.y > 1) { s.y = 0; s.x = Math.random(); } });
    },

    draw(ctx) {
      const S = P.Screen;
      ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, S.w, S.h);
      /* Yıldız alanı */
      stars.forEach(s => {
        ctx.fillStyle = s.s > 1.6 ? '#dff6ff' : '#5d6f8a';
        ctx.fillRect((s.x * S.w) | 0, (s.y * S.h) | 0, s.s > 1.6 ? 2 : 1, 1);
      });
      /* Anomali — dönen kuantum yırtığı */
      /* Anomaliyi başlık metninin altına yerleştir */
      const cx = S.w / 2, cy = S.h * (S.portrait ? 0.76 : 0.80);
      for (let i = 0; i < 5; i++) {
        const r = 12 + i * 7 + Math.sin(t * 1.4 + i) * 3;
        ctx.strokeStyle = i % 2 ? 'rgba(77,242,200,0.35)' : 'rgba(122,162,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.42, t * 0.4 + i, 0, Math.PI * 2);
        ctx.stroke();
      }
      P.circle(ctx, cx, cy, 4 + Math.sin(t * 3) * 1, '#4df2c8');
    }
  };

  QW.Scenes.register('boot', Boot);

})(window.QW);
