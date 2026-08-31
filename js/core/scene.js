/* =========================================================================
 * QW.Scenes — sahne yığını (stack) ve ana döngü
 * Sahne arayüzü: { enter(data), exit(), update(dt), draw(ctx), pause(), resume() }
 * Yığın sayesinde savaş sahnesi keşif sahnesinin üstüne binip geri dönebilir.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const M = QW.Scenes = {
    map: {}, stack: [], _last: 0, _raf: null, running: false, dtScale: 1
  };

  M.register = function (name, scene) { M.map[name] = scene; scene.name = name; };

  M.top = function () { return M.stack[M.stack.length - 1] || null; };

  /* Yığını temizleyip yeni sahneye geç */
  M.go = function (name, data) {
    while (M.stack.length) { const s = M.stack.pop(); if (s.exit) s.exit(); }
    M.push(name, data);
  };

  /* Üste bindir (savaş, menü vb.) */
  M.push = function (name, data) {
    const s = M.map[name];
    if (!s) { console.warn('sahne yok:', name); return; }
    const cur = M.top();
    if (cur && cur.pause) cur.pause();
    M.stack.push(s);
    if (s.enter) s.enter(data || {});
    QW.bus.emit('scene', name);
  };

  /* Üstteki sahneyi kapat */
  M.pop = function (result) {
    const s = M.stack.pop();
    if (s && s.exit) s.exit(result);
    const cur = M.top();
    if (cur && cur.resume) cur.resume(result);
    if (cur) QW.bus.emit('scene', cur.name);
  };

  M.is = function (name) { const t = M.top(); return !!t && t.name === name; };

  M.start = function () {
    if (M.running) return;
    M.running = true; M._last = performance.now();
    const loop = function (t) {
      M._raf = requestAnimationFrame(loop);
      let dt = (t - M._last) / 1000;
      M._last = t;
      if (dt > 0.1) dt = 0.1;               // sekme arka plandan dönerse sıçramayı engelle
      dt *= M.dtScale;
      const ctx = QW.Pixel.Screen.ctx;
      /* Yığındaki tüm sahneler çizilir, sadece üstteki güncellenir */
      const top = M.top();
      if (top && top.update) top.update(dt);
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        for (let i = 0; i < M.stack.length; i++) {
          const s = M.stack[i];
          if (s.draw) s.draw(ctx, i === M.stack.length - 1);
        }
      }
      QW.Input.endFrame();
    };
    M._raf = requestAnimationFrame(loop);
  };

  M.stop = function () {
    M.running = false;
    if (M._raf) cancelAnimationFrame(M._raf);
  };

})(window.QW);
