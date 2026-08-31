/* =========================================================================
 * QW.Save — LocalStorage kayıt katmanı
 * Sürüm alanı sayesinde ileride şema değişirse göç (migration) yazılabilir.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const KEY = 'qw_save_v1';
  const SETKEY = 'qw_settings_v1';
  const VERSION = 1;

  const S = QW.Save = { autosave: true, _timer: 0 };

  S.settings = {
    lang: null, sound: true, music: true, shake: true, scanlines: true,
    autosave: true, touch: true
  };

  S.loadSettings = function () {
    try {
      const raw = localStorage.getItem(SETKEY);
      if (raw) Object.assign(S.settings, JSON.parse(raw));
    } catch (e) {}
    return S.settings;
  };
  S.saveSettings = function () {
    try { localStorage.setItem(SETKEY, JSON.stringify(S.settings)); } catch (e) {}
  };

  S.has = function () {
    try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
  };

  /* Oyunun tüm çalışan durumunu tek nesnede toplar */
  S.snapshot = function () {
    const G = QW.Game;
    return {
      v: VERSION,
      t: Date.now(),
      seed: G.seed,
      player: QW.Player.serialize(),
      world: QW.World.serialize(),
      weather: QW.Weather.serialize(),
      inv: QW.Inventory.serialize(),
      craft: QW.Crafting.serialize(),
      veh: QW.Vehicles.serialize(),
      quests: QW.Quests.serialize(),
      npc: QW.NPCState.serialize(),
      codex: G.codex,
      flags: G.flags,
      stats: G.stats
    };
  };

  S.write = function (silent) {
    try {
      localStorage.setItem(KEY, JSON.stringify(S.snapshot()));
      if (!silent) QW.HUD.toast(QW.t('saved'), 'good');
      return true;
    } catch (e) {
      console.warn('kayıt hatası', e);
      return false;
    }
  };

  S.read = function () {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d || d.v !== VERSION) return null;
      return d;
    } catch (e) { return null; }
  };

  S.clear = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
  };

  /* Keşif sahnesi tarafından her karede çağrılır */
  S.tick = function (dt) {
    if (!S.settings.autosave) return;
    S._timer += dt;
    if (S._timer >= 20) { S._timer = 0; S.write(true); }
  };

})(window.QW);
