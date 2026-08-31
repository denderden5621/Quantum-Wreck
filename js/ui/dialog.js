/* =========================================================================
 * QW.Dialog — diyalog kutusu ve seçim menüsü (dokunmatik uyumlu)
 * ========================================================================= */
(function (QW) {
  'use strict';

  const D = QW.Dialog = { open: false, queue: [], onDone: null, choices: null };
  let el = {};

  D.init = function () {
    el.root = document.getElementById('dialog');
    el.name = document.getElementById('dialog-name');
    el.text = document.getElementById('dialog-text');
    el.next = document.getElementById('dialog-next');
    el.choices = document.getElementById('dialog-choices');
    el.portrait = document.querySelector('#dialog-portrait canvas');
    let lastTouch = 0;
    el.root.addEventListener('touchstart', e => {
      if (e.target.closest('.choice')) return;
      lastTouch = Date.now(); e.preventDefault(); D.advance();
    }, { passive: false });
    el.root.addEventListener('click', e => {
      if (e.target.closest('.choice')) return;
      if (Date.now() - lastTouch < 700) return;
      D.advance();
    });
  };

  /* lines: [string]  opts: { name, sprite, choices:[{label,fn,dis}], onDone } */
  D.say = function (lines, opts) {
    opts = opts || {};
    D.queue = Array.isArray(lines) ? lines.slice() : [lines];
    D.onDone = opts.onDone || null;
    D.choices = opts.choices || null;
    el.name.textContent = opts.name || '';
    if (opts.sprite) QW.Sprites.portrait(el.portrait, opts.sprite);
    else {
      const ctx = QW.Pixel.ctx(el.portrait);
      ctx.fillStyle = '#070c18'; ctx.fillRect(0, 0, 32, 32);
    }
    D.open = true;
    el.root.classList.remove('hidden');
    el.choices.innerHTML = '';
    D.advance(true);
  };

  D.advance = function (first) {
    if (!D.open) return;
    if (!first) QW.Audio.sfx('ui');
    if (D.queue.length) {
      el.text.textContent = D.queue.shift();
      /* Son satırda seçenekleri hemen göster — fazladan dokunuş gerekmesin */
      if (!D.queue.length && D.choices) showChoices();
      else el.next.style.display = '';
      return;
    }
    if (D.choices) { showChoices(); return; }
    D.close();
  };

  function showChoices() {
    const list = D.choices; D.choices = null;
    el.next.style.display = 'none';
    el.choices.innerHTML = '';
    list.forEach(c => {
      const b = document.createElement('button');
      b.className = 'choice' + (c.dis ? ' dis' : '');
      b.textContent = c.label;
      QW.Utils.tap(b, () => {
        if (c.dis) { QW.Audio.sfx('deny'); return; }
        QW.Audio.sfx('ok');
        D.close();
        if (c.fn) c.fn();
      });
      el.choices.appendChild(b);
    });
  }

  D.close = function () {
    D.open = false;
    el.root.classList.add('hidden');
    el.choices.innerHTML = '';
    el.next.style.display = '';
    const fn = D.onDone; D.onDone = null;
    if (fn) fn();
  };

  /* Basit onay kutusu */
  D.confirm = function (text, onYes, onNo) {
    D.say([text], {
      choices: [
        { label: QW.t('yes'), fn: onYes },
        { label: QW.t('no'), fn: onNo || null }
      ]
    });
  };

})(window.QW);
