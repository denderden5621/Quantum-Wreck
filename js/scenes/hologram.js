/* =========================================================================
 * Sahne: HOLOGRAM — Çöken Arşiv'in sessiz pandomimi
 *
 * Kesit sahnesi konuşmaz. Titrek mavi bir hologram, gökyüzüne bakarak
 * bekleyen bir halkı gösterir; döngü bozulup baştan başlar. Müzik susar —
 * sessizlik burada anlatının kendisidir.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const P = QW.Pixel, U = QW.Utils;

  let t = 0, stage = 0, onDone = null, figures = [], glitchT = 0, loops = 0;
  const LINES = ['arch_holo1', 'arch_holo2', 'arch_holo3', 'arch_holo4'];

  const Holo = {
    enter(data) {
      onDone = (data && data.onDone) || null;
      t = 0; stage = 0; glitchT = 0; loops = 0;
      QW.HUD.show(false);
      QW.Input.showTouch(false);
      QW.Audio.stopMusic();              // sessizlik kasıtlı
      QW.Audio.sfx('beep');
      figures = [];
      for (let i = 0; i < 7; i++) {
        figures.push({ x: 0.14 + i * 0.12 + (U.hash2(i, 3, 11) - 0.5) * 0.04,
                       h: 0.9 + U.hash2(i, 7, 5) * 0.25,
                       sway: U.hash2(i, 11, 9) * 6 });
      }
      Holo.showText();
    },

    showText() {
      const c = document.getElementById('cinema');
      const title = document.getElementById('cinema-title');
      const text = document.getElementById('cinema-text');
      const acts = document.getElementById('cinema-actions');
      c.classList.remove('hidden');
      c.style.background = 'rgba(5,7,13,0.55)';
      c.style.alignItems = 'flex-end';
      title.textContent = '';
      text.textContent = QW.t(LINES[stage]);
      acts.innerHTML = '';
      const b = document.createElement('button');
      b.className = 'btn pri';
      b.textContent = stage >= LINES.length - 1 ? QW.t('continue') : QW.t('continue');
      QW.Utils.tap(b, () => {
        QW.Audio.sfx('ui');
        stage++;
        if (stage >= LINES.length) Holo.finish();
        else Holo.showText();
      });
      acts.appendChild(b);
    },

    finish() {
      const c = document.getElementById('cinema');
      c.classList.add('hidden');
      c.style.background = ''; c.style.alignItems = '';
      const fn = onDone; onDone = null;
      QW.Scenes.pop();
      if (fn) fn();
    },

    exit() {
      const c = document.getElementById('cinema');
      c.classList.add('hidden');
      c.style.background = ''; c.style.alignItems = '';
    },

    update(dt) {
      t += dt;
      glitchT -= dt;
      /* Döngü belirli aralıklarla bozulup baştan başlar */
      if (t > 6 + loops * 6) { loops++; glitchT = 0.35; QW.Audio.sfx('glitch'); }
    },

    draw(ctx) {
      const S = P.Screen;
      ctx.fillStyle = '#04060c';
      ctx.fillRect(0, 0, S.w, S.h);

      const base = Math.round(S.h * (S.portrait ? 0.66 : 0.74));
      const skyY = Math.round(S.h * (S.portrait ? 0.30 : 0.20));
      const glitching = glitchT > 0;

      /* Kubbe kaburgaları — merkeze doğru daralan kararmış cam panelleri */
      const ribs = 7;
      for (let i = 0; i < ribs; i++) {
        const w = S.w - i * (S.w / (ribs + 3));
        const y = 3 + i * (skyY - 6) / ribs;
        ctx.fillStyle = i % 2 ? '#111a2b' : '#0c1220';
        ctx.fillRect((S.w - w) / 2, y, w, 4);
        ctx.fillStyle = 'rgba(70,130,180,0.09)';
        ctx.fillRect((S.w - w) / 2, y + 4, w, 1);
      }

      /* Baktıkları şey: kubbenin tepesindeki çatlaktan görünen soluk ışık */
      ctx.fillStyle = 'rgba(150,215,255,0.55)';
      ctx.fillRect(S.w / 2 - 1, skyY + Math.sin(t * 0.8), 2, 2);
      ctx.fillStyle = 'rgba(150,215,255,0.14)';
      ctx.fillRect(S.w / 2 - 5, skyY + 1, 10, 1);

      /* Projeksiyon konisi: kaideden yukarı açılan ışık */
      const coneTop = skyY + 10, coneH = base - coneTop;
      for (let i = 0; i < 10; i++) {
        const p0 = i / 10, p1 = (i + 1) / 10;
        const y0 = coneTop + coneH * p0;
        const wA = S.w * (0.06 + 0.34 * p0), wB = S.w * (0.06 + 0.34 * p1);
        ctx.fillStyle = 'rgba(60,150,215,' + (0.020 + p0 * 0.045).toFixed(3) + ')';
        ctx.fillRect(S.w / 2 - wB / 2, y0, wB, coneH / 10 + 1);
        if (i % 3 === 0) {
          ctx.fillStyle = 'rgba(90,180,240,0.05)';
          ctx.fillRect(S.w / 2 - wA / 2, y0, wA, 1);
        }
      }

      /* İç mekân: sıralar hâlinde çökmüş oturaklar */
      for (let r = 0; r < 3; r++) {
        const y = base + 8 + r * 7;
        if (y > S.h) break;
        ctx.fillStyle = r % 2 ? '#0c1220' : '#101828';
        for (let x = -1; x < 6; x++) {
          const w = 34 + ((x * 13 + r * 7) % 16);
          ctx.fillRect(x * 46 + (r % 2 ? 12 : 0), y, w, 3);
        }
      }
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, base + 4, S.w, S.h - base - 4);

      /* Hologram kaidesi */
      ctx.fillStyle = '#16283f';
      ctx.fillRect(S.w * 0.08, base, S.w * 0.84, 3);
      ctx.fillStyle = '#24507e';
      ctx.fillRect(S.w * 0.12, base + 3, S.w * 0.76, 2);

      /* Bekleyen figürler — hepsi yukarı bakıyor, hiçbiri hareket etmiyor */
      figures.forEach((f, i) => {
        const flick = (Math.sin(t * 3 + i) * 0.5 + 0.5);
        const alpha = 0.55 + flick * 0.35;
        const sway = Math.sin(t * 0.6 + f.sway) * 0.8;
        const x = Math.round(f.x * S.w + sway);
        const h = Math.round(30 * f.h);
        const y = base - h;
        ctx.fillStyle = 'rgba(120,205,255,' + alpha.toFixed(2) + ')';
        ctx.fillRect(x - 2, y + 8, 5, h - 12);      // gövde
        ctx.fillRect(x - 2, y + 2, 5, 5);           // baş
        ctx.fillRect(x - 1, y, 3, 2);               // yukarı eğik alın
        ctx.fillRect(x - 4, y + 10, 2, h - 20);     // kollar
        ctx.fillRect(x + 3, y + 10, 2, h - 20);
        ctx.fillRect(x - 2, base - 4, 2, 4);        // bacaklar
        ctx.fillRect(x + 1, base - 4, 2, 4);
        /* kaideye düşen soluk yansıma */
        ctx.fillStyle = 'rgba(120,205,255,' + (alpha * 0.18).toFixed(2) + ')';
        ctx.fillRect(x - 2, base + 1, 5, 2);
      });

      /* Tarama çizgileri ve bozulma */
      for (let y = 0; y < S.h; y += 3) {
        ctx.fillStyle = 'rgba(60,140,200,0.05)';
        ctx.fillRect(0, y, S.w, 1);
      }
      if (glitching) {
        for (let i = 0; i < 8; i++) {
          const gy = Math.floor(Math.random() * S.h);
          ctx.fillStyle = 'rgba(120,200,255,0.30)';
          ctx.fillRect(Math.random() * 12 - 6, gy, S.w, 1 + Math.floor(Math.random() * 3));
        }
      }
    }
  };

  QW.Scenes.register('hologram', Holo);

})(window.QW);
