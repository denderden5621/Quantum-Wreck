/* =========================================================================
 * QW.Input — sanal D-Pad (analog sürükleme destekli), A/B tuşları, klavye
 * Çok dokunuşlu (multi-touch): sol elle yön, sağ elle aksiyon aynı anda.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const I = QW.Input = {
    axis: { x: 0, y: 0 },            // -1..1 analog yön
    dir: { up: 0, down: 0, left: 0, right: 0 },
    btn: { a: false, b: false },
    pressed: {},                     // bu karede basıldı
    lastDir: 'down',
    enabled: true,
    touchEnabled: true
  };

  const el = {};
  let dpadTouchId = null, dpadRect = null;

  function setDirClasses() {
    if (!el.dp) return;
    el.dp.forEach(d => d.classList.toggle('act', !!I.dir[d.dataset.dir]));
  }

  function applyAxis(x, y) {
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    I.axis.x = x; I.axis.y = y;
    const dz = 0.32;
    I.dir.left = x < -dz ? 1 : 0;
    I.dir.right = x > dz ? 1 : 0;
    I.dir.up = y < -dz ? 1 : 0;
    I.dir.down = y > dz ? 1 : 0;
    if (Math.abs(x) > Math.abs(y)) {
      if (I.dir.left) I.lastDir = 'left'; else if (I.dir.right) I.lastDir = 'right';
    } else {
      if (I.dir.up) I.lastDir = 'up'; else if (I.dir.down) I.lastDir = 'down';
    }
    setDirClasses();
  }

  function clearAxis() { applyAxis(0, 0); }

  /* ---------------- D-Pad dokunuş ---------------- */
  function dpadPos(t) {
    const r = dpadRect || el.dpad.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const rad = r.width / 2;
    return { x: (t.clientX - cx) / (rad * 0.72), y: (t.clientY - cy) / (rad * 0.72) };
  }

  function onDpadStart(e) {
    if (!I.enabled) return;
    e.preventDefault();
    QW.Audio.unlock();
    dpadRect = el.dpad.getBoundingClientRect();
    const t = e.changedTouches ? e.changedTouches[0] : e;
    dpadTouchId = e.changedTouches ? t.identifier : 'mouse';
    const p = dpadPos(t); applyAxis(p.x, p.y);
  }
  function onDpadMove(e) {
    if (dpadTouchId === null) return;
    e.preventDefault();
    let t = null;
    if (e.changedTouches) {
      for (const ct of e.changedTouches) if (ct.identifier === dpadTouchId) t = ct;
    } else t = e;
    if (!t) return;
    const p = dpadPos(t); applyAxis(p.x, p.y);
  }
  function onDpadEnd(e) {
    if (dpadTouchId === null) return;
    if (e.changedTouches) {
      let match = false;
      for (const ct of e.changedTouches) if (ct.identifier === dpadTouchId) match = true;
      if (!match) return;
    }
    dpadTouchId = null; clearAxis();
  }

  /* ---------------- A / B tuşları ---------------- */
  function bindBtn(node, name) {
    const down = e => {
      if (!I.enabled) return;
      e.preventDefault(); e.stopPropagation();
      QW.Audio.unlock();
      if (!I.btn[name]) I.pressed[name] = true;
      I.btn[name] = true; node.classList.add('act');
      QW.bus.emit('btn', name);
    };
    const up = e => { e.preventDefault(); I.btn[name] = false; node.classList.remove('act'); };
    node.addEventListener('touchstart', down, { passive: false });
    node.addEventListener('touchend', up, { passive: false });
    node.addEventListener('touchcancel', up, { passive: false });
    node.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
  }

  /* ---------------- klavye ---------------- */
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right'
  };
  const KEYBTN = { KeyZ: 'a', Space: 'a', Enter: 'a', KeyX: 'b', KeyC: 'b', ShiftLeft: 'b', Escape: 'menu', KeyE: 'craft', KeyM: 'map', KeyI: 'inv' };
  const held = {};

  function keyAxis() {
    let x = 0, y = 0;
    if (held.left) x -= 1; if (held.right) x += 1;
    if (held.up) y -= 1; if (held.down) y += 1;
    applyAxis(x, y);
  }

  function onKeyDown(e) {
    if (!I.enabled) return;
    const d = KEYMAP[e.code];
    if (d) { e.preventDefault(); held[d] = 1; keyAxis(); return; }
    const b = KEYBTN[e.code];
    if (b) {
      e.preventDefault();
      QW.Audio.unlock();
      if (b === 'a' || b === 'b') {
        if (!I.btn[b]) I.pressed[b] = true;
        I.btn[b] = true; QW.bus.emit('btn', b);
      } else QW.bus.emit('sys', b);
    }
  }
  function onKeyUp(e) {
    const d = KEYMAP[e.code];
    if (d) { held[d] = 0; keyAxis(); return; }
    const b = KEYBTN[e.code];
    if (b === 'a' || b === 'b') I.btn[b] = false;
  }

  /* ---------------- kurulum ---------------- */
  I.init = function () {
    el.touch = document.getElementById('touch');
    el.dpad = document.getElementById('dpad');
    el.dp = Array.from(document.querySelectorAll('.dp'));
    el.a = document.getElementById('btn-a');
    el.b = document.getElementById('btn-b');

    el.dpad.addEventListener('touchstart', onDpadStart, { passive: false });
    el.dpad.addEventListener('touchmove', onDpadMove, { passive: false });
    window.addEventListener('touchend', onDpadEnd, { passive: false });
    window.addEventListener('touchcancel', onDpadEnd, { passive: false });
    el.dpad.addEventListener('mousedown', onDpadStart);
    window.addEventListener('mousemove', onDpadMove);
    window.addEventListener('mouseup', onDpadEnd);

    bindBtn(el.a, 'a');
    bindBtn(el.b, 'b');

    document.querySelectorAll('.sysbtn').forEach(b => {
      QW.Utils.tap(b, () => { QW.Audio.unlock(); QW.Audio.sfx('ui'); QW.bus.emit('sys', b.dataset.open); });
    });

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', () => { dpadRect = null; });
    window.addEventListener('blur', () => { clearAxis(); I.btn.a = I.btn.b = false; });

    /* Sayfa kaydırma / çift dokunuş zoom engelleme */
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('touchmove', e => {
      if (e.target.closest('#panel-body')) return; // panellerde kaydırmaya izin ver
      e.preventDefault();
    }, { passive: false });
  };

  /* Her karenin sonunda çağrılır — "bu karede basıldı" bayraklarını temizler */
  I.endFrame = function () { I.pressed = {}; };

  I.consume = function (name) {
    if (I.pressed[name]) { I.pressed[name] = false; return true; }
    return false;
  };

  I.showTouch = function (v) {
    I.touchEnabled = v;
    document.getElementById('touch').classList.toggle('hidden', !v);
  };

  I.reset = function () { clearAxis(); I.btn.a = I.btn.b = false; I.pressed = {}; };

})(window.QW);
