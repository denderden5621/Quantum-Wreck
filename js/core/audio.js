/* =========================================================================
 * QW.Audio — Web Audio API ile üretilen 8-bit ses motoru
 * Örneklenmiş dosya kullanılmaz; tüm sesler kare/üçgen/gürültü dalgalarından
 * anlık olarak sentezlenir. Mobilde ilk dokunuşta context açılır.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const A = QW.Audio = {
    ctx: null, master: null, musicGain: null, sfxGain: null,
    enabled: true, musicOn: true,
    _seq: null, _track: null, _unlocked: false
  };

  A.init = function () {
    if (A.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { A.enabled = false; return; }
    A.ctx = new AC();
    A.master = A.ctx.createGain();  A.master.gain.value = 0.5;
    A.musicGain = A.ctx.createGain(); A.musicGain.gain.value = 0.32;
    A.sfxGain = A.ctx.createGain();  A.sfxGain.gain.value = 0.55;
    A.musicGain.connect(A.master); A.sfxGain.connect(A.master);
    A.master.connect(A.ctx.destination);
  };

  /* Mobil tarayıcılar sesi ilk kullanıcı hareketinde açar */
  A.unlock = function () {
    A.init();
    if (!A.ctx) return;
    if (A.ctx.state === 'suspended') A.ctx.resume();
    if (!A._unlocked) {
      const b = A.ctx.createBuffer(1, 1, 22050);
      const s = A.ctx.createBufferSource();
      s.buffer = b; s.connect(A.ctx.destination); s.start(0);
      A._unlocked = true;
    }
  };

  A.setEnabled = function (v) {
    A.enabled = !!v;
    if (A.master) A.master.gain.value = v ? 0.5 : 0;
    if (!v) A.stopMusic();
  };
  A.setMusic = function (v) {
    A.musicOn = !!v;
    if (!v) A.stopMusic(); else if (A._track) A.playMusic(A._track);
  };

  /* ------------------------------------------------------------------
   * Temel ton üreteci
   * ------------------------------------------------------------------ */
  /* Aynı efektin her seferinde birebir aynı çalması kulakta yorgunluk
     yaratır ("repetition fatigue"). Müzik dışındaki her ses ±%12 perde
     rastgeleliğiyle çalınır. */
  A.tone = function (opt) {
    if (!A.enabled || !A.ctx) return;
    const t0 = A.ctx.currentTime + (opt.delay || 0);
    const osc = A.ctx.createOscillator();
    const g = A.ctx.createGain();
    const detune = (opt.bus === 'music' || opt.vary === false)
      ? 1 : (1 + (Math.random() - 0.5) * 0.24);
    osc.type = opt.type || 'square';
    osc.frequency.setValueAtTime((opt.freq || 440) * detune, t0);
    if (opt.to) {
      if (opt.slide === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(1, opt.to * detune), t0 + (opt.dur || 0.2));
      else osc.frequency.linearRampToValueAtTime(opt.to * detune, t0 + (opt.dur || 0.2));
    }
    const vol = (opt.vol === undefined ? 0.3 : opt.vol);
    const dur = opt.dur || 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.02, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(opt.bus === 'music' ? A.musicGain : A.sfxGain);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  };

  /* Beyaz gürültü — patlama, adım, fırtına */
  A.noise = function (opt) {
    if (!A.enabled || !A.ctx) return;
    opt = opt || {};
    const dur = opt.dur || 0.2;
    const t0 = A.ctx.currentTime + (opt.delay || 0);
    const len = Math.max(1, Math.floor(A.ctx.sampleRate * dur));
    const buf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = A.ctx.createBufferSource(); src.buffer = buf;
    const flt = A.ctx.createBiquadFilter();
    const nv = 1 + (Math.random() - 0.5) * 0.24;
    flt.type = opt.filter || 'lowpass';
    flt.frequency.setValueAtTime((opt.freq || 1200) * nv, t0);
    if (opt.to) flt.frequency.linearRampToValueAtTime(opt.to * nv, t0 + dur);
    const g = A.ctx.createGain();
    g.gain.setValueAtTime(opt.vol === undefined ? 0.25 : opt.vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(flt); flt.connect(g); g.connect(A.sfxGain);
    src.start(t0); src.stop(t0 + dur + 0.02);
  };

  /* ------------------------------------------------------------------
   * SFX kütüphanesi
   * ------------------------------------------------------------------ */
  const SFX = {
    ui:        () => A.tone({ freq: 660, to: 880, dur: 0.06, vol: 0.18 }),
    back:      () => A.tone({ freq: 440, to: 300, dur: 0.08, vol: 0.18 }),
    ok:        () => { A.tone({ freq: 660, dur: 0.07, vol: 0.2 }); A.tone({ freq: 990, dur: 0.1, vol: 0.2, delay: 0.07 }); },
    deny:      () => A.tone({ freq: 180, to: 110, dur: 0.16, vol: 0.25, type: 'sawtooth' }),
    pickup:    () => { A.tone({ freq: 880, dur: 0.05, vol: 0.2 }); A.tone({ freq: 1320, dur: 0.08, vol: 0.18, delay: 0.05 }); },
    craft:     () => { [440, 550, 660, 880].forEach((f, i) => A.tone({ freq: f, dur: 0.08, vol: 0.2, delay: i * 0.06 })); },
    hit:       () => { A.noise({ dur: 0.14, freq: 2400, to: 300, vol: 0.3 }); A.tone({ freq: 220, to: 90, dur: 0.12, vol: 0.22, type: 'square' }); },
    crit:      () => { A.noise({ dur: 0.22, freq: 4000, to: 200, vol: 0.35 }); A.tone({ freq: 400, to: 80, dur: 0.2, vol: 0.28, type: 'sawtooth' }); },
    hurt:      () => A.tone({ freq: 320, to: 120, dur: 0.22, vol: 0.3, type: 'sawtooth' }),
    step:      () => A.noise({ dur: 0.05, freq: 700, vol: 0.07 }),
    beep:      () => A.tone({ freq: 1500, dur: 0.04, vol: 0.14, type: 'square' }),
    scan:      () => { for (let i = 0; i < 5; i++) A.tone({ freq: 800 + i * 220, dur: 0.05, vol: 0.13, delay: i * 0.05 }); },
    drone:     () => { A.tone({ freq: 90, to: 140, dur: 0.6, vol: 0.14, type: 'sawtooth' }); A.noise({ dur: 0.6, freq: 900, vol: 0.08 }); },
    engine:    () => { A.tone({ freq: 70, to: 120, dur: 0.5, vol: 0.16, type: 'square' }); },
    explode:   () => { A.noise({ dur: 0.7, freq: 1800, to: 60, vol: 0.4 }); A.tone({ freq: 120, to: 40, dur: 0.6, vol: 0.3, type: 'sawtooth' }); },
    ring:      () => { A.tone({ freq: 2200, dur: 1.6, vol: 0.12, type: 'sine' }); A.tone({ freq: 3300, dur: 1.2, vol: 0.06, type: 'sine' }); },
    glitch:    () => { for (let i = 0; i < 7; i++) A.tone({ freq: 120 + Math.random() * 2200, dur: 0.04, vol: 0.16, type: 'square', delay: i * 0.035 }); },
    alarm:     () => { for (let i = 0; i < 3; i++) { A.tone({ freq: 880, dur: 0.12, vol: 0.2, delay: i * 0.26 }); A.tone({ freq: 660, dur: 0.12, vol: 0.2, delay: i * 0.26 + 0.13 }); } },
    levelup:   () => { [523, 659, 784, 1046].forEach((f, i) => A.tone({ freq: f, dur: 0.16, vol: 0.24, delay: i * 0.1, type: 'square' })); },
    quest:     () => { [784, 988, 1174].forEach((f, i) => A.tone({ freq: f, dur: 0.13, vol: 0.2, delay: i * 0.09 })); },
    fragment:  () => { [660, 990, 1320, 1760].forEach((f, i) => A.tone({ freq: f, dur: 0.25, vol: 0.22, delay: i * 0.13, type: 'triangle' })); },
    thunder:   () => A.noise({ dur: 1.2, freq: 400, to: 60, vol: 0.3 }),
    rain:      () => A.noise({ dur: 0.9, freq: 5000, to: 3000, vol: 0.09, filter: 'highpass' }),
    wind:      () => A.noise({ dur: 1.4, freq: 500, to: 900, vol: 0.12 }),
    fire:      () => A.noise({ dur: 0.5, freq: 800, to: 300, vol: 0.08 }),
    heal:      () => { [440, 660, 880].forEach((f, i) => A.tone({ freq: f, dur: 0.18, vol: 0.18, type: 'sine', delay: i * 0.08 })); },
    death:     () => { [440, 330, 247, 165, 110].forEach((f, i) => A.tone({ freq: f, dur: 0.35, vol: 0.26, type: 'square', delay: i * 0.18 })); }
  };

  A.sfx = function (name) { const f = SFX[name]; if (f) { A.unlock(); f(); } };

  /* ------------------------------------------------------------------
   * Müzik — basit adım dizileyici (step sequencer)
   * ------------------------------------------------------------------ */
  const N = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };
  function hz(note) {
    if (note === '-' || !note) return 0;
    const m = /^([A-G]#?)(-?\d)$/.exec(note);
    if (!m) return 0;
    return 440 * Math.pow(2, (N[m[1]] + (parseInt(m[2], 10) + 1) * 12 - 69) / 12);
  }

  /* ====================================================================
   * ŞARKI MOTORU
   *
   * Eskiden 16 adımlık tek bir melodi sonsuza kadar dönüyordu. Artık her
   * parça BÖLÜMLERDEN oluşan gerçek bir şarkıdır: giriş, A, B, nakarat,
   * köprü, çıkış. Bölümler bir dizilime (arrangement) göre çalınır, her
   * bölümün kendi melodisi, karşı-ezgisi, arpejleri, bası ve davulu vardır.
   *
   * Desenler boşlukla ayrılmış nota dizeleridir:
   *   "C4 . E4 . G4 . . ."   ('.' = sus, '-' = önceki notayı uzat)
   * Davul deseni: k=kick  s=snare  h=hat  o=açık hat  .=sus
   * ================================================================== */

  function pat(str) { return str.trim().split(/\s+/); }

  /* --------------------------- ŞARKI KİTAPLIĞI --------------------------- */
  const SONGS = {};

  /* “Göktay” — açılış gerilimi: tek akorun üstünde yükselen ostinato */
  SONGS.tension = {
    bpm: 104, swing: 0,
    voices: { lead: 'square', harm: 'square', bass: 'triangle', arp: 'square' },
    vol: { lead: 0.15, harm: 0.07, bass: 0.13, arp: 0.06 },
    sections: {
      a: { steps: 16,
        lead: pat('C2 .  C2 .  D#2 .  C2 .  F2 .  C2 .  F#2 .  G2 .'),
        bass: pat('C1 .  .  .  C1 .  .  .  F1 .  .  .  F#1 .  .  .'),
        drums: pat('k . . . h . . . k . . h . . h .') },
      b: { steps: 16,
        lead: pat('G2 .  F#2 .  F2 .  D#2 .  C2 C2 D#2 .  G2 .  A#2 .'),
        harm: pat('D#3 . .  .  C3 .  .  .  G#2 . .  .  A#2 . .  .'),
        bass: pat('G1 .  .  .  F1 .  .  .  D#1 . .  .  A#0 . .  .'),
        arp:  pat('C3 D#3 G3 D#3 C3 D#3 G3 D#3 A#2 D3 F3 D3 A#2 D3 F3 D3'),
        drums: pat('k . h . s . h . k . h . s . h h') }
    },
    arrangement: ['a', 'a', 'b', 'a', 'b', 'b'],
    rise: true
  };

  /* “Kül Ovaları” — keşif teması: geniş, umutlu, gelişen */
  SONGS.overworld = {
    bpm: 92, swing: 0.06,
    voices: { lead: 'square', harm: 'square', bass: 'triangle', arp: 'square' },
    vol: { lead: 0.115, harm: 0.055, bass: 0.10, arp: 0.045 },
    sections: {
      intro: { steps: 16,
        arp:  pat('A3 E4 A4 E4 A3 E4 A4 E4 F3 C4 F4 C4 F3 C4 F4 C4'),
        bass: pat('A1 .  .  .  .  .  .  .  F1 .  .  .  .  .  .  .'),
        drums: pat('. . h . . . h . . . h . . . h .') },
      /* A: ana tema */
      a: { steps: 32,
        lead: pat('A3 .  C4 .  E4 .  D4 -  C4 .  A3 .  G3 .  .  . \
                   A3 .  C4 .  E4 .  G4 -  E4 .  D4 .  C4 .  .  .'),
        harm: pat('E3 .  A3 .  C4 .  B3 -  A3 .  E3 .  D3 .  .  . \
                   E3 .  A3 .  C4 .  E4 -  C4 .  B3 .  A3 .  .  .'),
        bass: pat('A1 .  .  A1 F1 .  .  .  C2 .  .  C2 G1 .  .  . \
                   A1 .  .  A1 F1 .  .  .  D2 .  .  .  E2 .  .  .'),
        arp:  pat('A3 C4 E4 C4 F3 A3 C4 A3 C4 E4 G4 E4 G3 B3 D4 B3 \
                   A3 C4 E4 C4 F3 A3 C4 A3 D4 F4 A4 F4 E4 G4 B4 G4'),
        drums: pat('k . h . s . h . k . h k s . h . \
                    k . h . s . h . k . h k s . h h') },
      /* B: yükselen köprü */
      b: { steps: 32,
        lead: pat('F4 .  E4 .  D4 .  C4 -  D4 .  E4 .  F4 -  .  . \
                   G4 .  F4 .  E4 .  D4 -  C4 .  B3 .  A3 -  -  .'),
        harm: pat('C4 .  B3 .  A3 .  G3 -  A3 .  B3 .  C4 -  .  . \
                   E4 .  D4 .  C4 .  B3 -  A3 .  G3 .  E3 -  -  .'),
        bass: pat('F1 .  .  .  C2 .  .  .  D2 .  .  .  A1 .  .  . \
                   G1 .  .  .  D2 .  .  .  E2 .  .  .  E2 .  E2 .'),
        drums: pat('k . h . s . h h k . h . s . h . \
                    k . h . s . h h k k h . s s h h') },
      /* Nakarat: en açık, en yüksek */
      c: { steps: 32,
        lead: pat('E4 .  A4 -  G4 .  E4 .  D4 .  C4 .  D4 -  .  . \
                   E4 .  A4 -  C5 .  B4 .  A4 -  -  .  .  .  .  .'),
        harm: pat('A3 .  E4 -  D4 .  A3 .  F3 .  A3 .  B3 -  .  . \
                   A3 .  E4 -  A4 .  G4 .  E4 -  -  .  .  .  .  .'),
        bass: pat('A1 .  A1 .  C2 .  .  .  F1 .  .  .  G1 .  .  . \
                   A1 .  A1 .  C2 .  .  .  D2 .  E2 .  A1 .  .  .'),
        arp:  pat('A3 E4 A4 E4 C4 G4 C5 G4 F3 C4 F4 C4 G3 D4 G4 D4 \
                   A3 E4 A4 E4 C4 G4 C5 G4 D4 A4 D5 A4 E4 B4 E5 B4'),
        drums: pat('k . h k s . h . k . h k s . h h \
                    k . h k s . h . k k h . s s h h') },
      outro: { steps: 16,
        lead: pat('A3 .  .  .  E3 .  .  .  A3 -  -  -  .  .  .  .'),
        bass: pat('A1 .  .  .  .  .  .  .  A1 .  .  .  .  .  .  .'),
        drums: pat('k . . . . . h . k . . . . . . .') }
    },
    arrangement: ['intro', 'a', 'a', 'b', 'c', 'a', 'b', 'c', 'c', 'outro']
  };

  /* “Uzun Gece” — gece teması: seyrek, tekinsiz, çözülmeyen */
  SONGS.night = {
    bpm: 68, swing: 0.1,
    voices: { lead: 'triangle', harm: 'sine', bass: 'triangle', arp: 'sine' },
    vol: { lead: 0.11, harm: 0.05, bass: 0.10, arp: 0.04 },
    sections: {
      a: { steps: 32,
        lead: pat('D3 .  .  .  F3 .  .  .  A3 -  .  .  G3 .  .  . \
                   F3 .  .  .  D3 .  .  .  C3 -  -  .  .  .  .  .'),
        bass: pat('D1 .  .  .  .  .  .  .  A#0 . .  .  .  .  .  . \
                   C1 .  .  .  .  .  .  .  D1 .  .  .  .  .  .  .'),
        drums: pat('. . . . h . . . . . . . h . . . \
                    . . . . h . . . . . . . h . . h') },
      b: { steps: 32,
        lead: pat('A3 .  .  C4 .  .  A#3 . .  .  G3 .  .  .  F3 . \
                   D3 .  .  F3 .  .  A3 -  .  .  .  .  .  .  .  .'),
        harm: pat('F3 .  .  A3 .  .  G3 .  .  .  D3 .  .  .  C3 . \
                   A#2 . .  D3 .  .  F3 -  .  .  .  .  .  .  .  .'),
        bass: pat('F1 .  .  .  .  .  .  .  G1 .  .  .  .  .  .  . \
                   A#0 . .  .  .  .  .  .  C1 .  .  .  .  .  .  .'),
        arp:  pat('D4 .  A3 .  F3 .  A3 .  D4 .  A3 .  F3 .  A3 . \
                   C4 .  G3 .  D#3 . G3 .  C4 .  G3 .  D#3 . G3 .'),
        drums: pat('. . . . h . . h . . . . h . . . \
                    . . . . h . . h . . . . h . h .') }
    },
    arrangement: ['a', 'b', 'a', 'b', 'b']
  };

  /* “Temas” — savaş teması: hızlı, sürüklenen, riff tabanlı */
  SONGS.battle = {
    bpm: 152, swing: 0,
    voices: { lead: 'square', harm: 'square', bass: 'triangle', arp: 'square' },
    vol: { lead: 0.13, harm: 0.06, bass: 0.12, arp: 0.05 },
    sections: {
      intro: { steps: 8,
        lead: pat('E4 .  E4 .  E4 E4 E4 .'),
        bass: pat('E1 E1 E1 E1 E1 E1 E1 E1'),
        drums: pat('k k s . k k s s') },
      a: { steps: 32,
        lead: pat('E3 E3 G3 E3 A3 .  G3 F#3 E3 E3 G3 B3 A3 .  E3 . \
                   E3 E3 G3 E3 C4 .  B3 A3  G3 .  E3 .  D3 .  .  .'),
        bass: pat('E1 E1 .  E1 E1 .  G1 .  A1 A1 .  A1 B1 .  B1 . \
                   E1 E1 .  E1 E1 .  G1 .  C2 .  B1 .  E1 .  E1 .'),
        drums: pat('k . h s h . k s k . h s h k k s \
                    k . h s h . k s k k h s h k s s') },
      b: { steps: 32,
        lead: pat('B3 .  A3 .  G3 .  E3 .  F#3 . G3 .  A3 -  .  . \
                   B3 .  C4 .  D4 .  E4 -  D4 .  B3 .  G3 .  E3 .'),
        harm: pat('G3 .  E3 .  D3 .  B2 .  D3 .  E3 .  F#3 - .  . \
                   G3 .  A3 .  B3 .  C4 -  B3 .  G3 .  E3 .  B2 .'),
        bass: pat('B1 .  .  B1 G1 .  .  G1 D2 .  .  D2 A1 .  .  A1 \
                   B1 .  .  B1 C2 .  .  C2 E2 .  .  E2 E1 .  E1 .'),
        arp:  pat('E4 B3 G3 B3 E4 B3 G3 B3 D4 A3 F#3 A3 D4 A3 F#3 A3 \
                   C4 G3 E3 G3 C4 G3 E3 G3 B3 F#3 D3 F#3 B3 F#3 D3 F#3'),
        drums: pat('k . h s h . k s k . h s h k k s \
                    k k h s h . k s k . h s s s s s') }
    },
    arrangement: ['intro', 'a', 'b', 'a', 'b', 'b']
  };

  /* “Bölge Hâkimi” — boss: ağır, geniş aralıklı, tehditkâr */
  SONGS.boss = {
    bpm: 128, swing: 0,
    voices: { lead: 'sawtooth', harm: 'square', bass: 'triangle', arp: 'square' },
    vol: { lead: 0.12, harm: 0.06, bass: 0.13, arp: 0.05 },
    sections: {
      intro: { steps: 16,
        bass: pat('C1 .  .  .  C1 .  .  .  C1 .  C1 .  C1 C1 C1 C1'),
        drums: pat('k . . . k . . . k . k . k k k k') },
      a: { steps: 32,
        lead: pat('C3 C3 D#3 F3 F#3 F3 D#3 C3 A#2 C3 D#3 F3 G3 .  F#3 . \
                   C3 C3 D#3 F3 G#3 G3 F3 D#3 C3 .  A#2 . C3 -  .  .'),
        bass: pat('C1 .  C1 .  F1 .  F1 .  A#0 . A#0 . G1 .  F#1 . \
                   C1 .  C1 .  F1 .  F1 .  G#0 . G#0 . C1 .  C1 .'),
        drums: pat('k . s . k . s . k k s . k . s s \
                    k . s . k . s . k k s . k s s s') },
      b: { steps: 32,
        lead: pat('G3 -  .  F#3 F3 .  D#3 . C3 -  .  .  .  .  .  . \
                   G#3 - .  G3  F#3 . F3 .  D#3 - -  .  .  .  .  .'),
        harm: pat('D#3 - . C3  A#2 . G#2 . D#2 - .  .  .  .  .  . \
                   C4 -  .  A#3 G#3 . G3 .  G2 -  -  .  .  .  .  .'),
        bass: pat('G1 .  G1 .  D#1 . D#1 . C1 .  C1 .  C1 C1 C1 C1 \
                   G#1 . G#1 . G1 .  G1 .  C1 .  C1 .  C1 C1 C1 C1'),
        arp:  pat('C4 D#4 G4 D#4 C4 D#4 G4 D#4 A#3 D4 F4 D4 A#3 D4 F4 D4 \
                   G#3 C4 D#4 C4 G#3 C4 D#4 C4 G3 C4 D#4 C4 G3 B3 D4 B3'),
        drums: pat('k k s . k . s s k k s . k s s s \
                    k k s k s k s s k k s k s s s s') }
    },
    arrangement: ['intro', 'a', 'b', 'a', 'b', 'b']
  };

  /* “Kamp Ateşi” — sıcak, sakin, sohbet tonunda */
  SONGS.camp = {
    bpm: 80, swing: 0.12,
    voices: { lead: 'triangle', harm: 'sine', bass: 'triangle', arp: 'sine' },
    vol: { lead: 0.11, harm: 0.05, bass: 0.09, arp: 0.04 },
    sections: {
      a: { steps: 32,
        lead: pat('G3 .  B3 .  D4 -  B3 .  C4 .  A3 .  G3 -  .  . \
                   G3 .  B3 .  E4 -  D4 .  B3 .  G3 .  A3 -  -  .'),
        harm: pat('D3 .  G3 .  B3 -  G3 .  A3 .  F3 .  D3 -  .  . \
                   D3 .  G3 .  C4 -  B3 .  G3 .  D3 .  F3 -  -  .'),
        bass: pat('G1 .  .  .  C2 .  .  .  D2 .  .  .  G1 .  .  . \
                   G1 .  .  .  C2 .  .  .  D2 .  .  .  G1 .  G1 .'),
        arp:  pat('G3 B3 D4 B3 C4 E4 G4 E4 D4 F#4 A4 F#4 G3 B3 D4 B3 \
                   G3 B3 D4 B3 C4 E4 G4 E4 A3 C4 E4 C4 D4 F#4 A4 F#4'),
        drums: pat('. . h . . . h . . . h . . . h . \
                    . . h . . . h . . . h . . . h h') },
      b: { steps: 16,
        lead: pat('E4 .  D4 .  C4 .  B3 -  A3 .  B3 .  C4 -  -  .'),
        bass: pat('C2 .  .  .  G1 .  .  .  A1 .  .  .  D2 .  .  .'),
        drums: pat('. . h . . . h . . . h . . . h .') }
    },
    arrangement: ['a', 'b', 'a', 'a', 'b']
  };

  /* “Ağıt” — motif ağıt hâlinde, çok yavaş */
  SONGS.lament = {
    bpm: 58, swing: 0,
    voices: { lead: 'triangle', harm: 'sine', bass: 'triangle', arp: 'sine' },
    vol: { lead: 0.11, harm: 0.05, bass: 0.09, arp: 0.035 },
    sections: {
      a: { steps: 32,
        /* “Eve Dönüş” motifi indirilmiş üçlüyle */
        lead: pat('C3 .  .  D#3 . .  G3 -  .  .  D#3 . .  .  .  . \
                   C3 .  .  D#3 . .  F3 -  .  .  D#3 . C3 -  -  .'),
        harm: pat('G2 .  .  .  .  .  D#3 - .  .  .  .  .  .  .  . \
                   G#2 . .  .  .  .  C3 -  .  .  .  .  G2 -  -  .'),
        bass: pat('C1 .  .  .  .  .  .  .  G#0 . .  .  .  .  .  . \
                   A#0 . .  .  .  .  .  .  C1 .  .  .  .  .  .  .') },
      b: { steps: 32,
        lead: pat('D#3 . .  .  F3 .  .  .  G3 -  .  .  A#3 - .  . \
                   G3 .  .  .  F3 .  .  .  D#3 - -  .  .  .  .  .'),
        arp:  pat('C4 .  G3 .  D#3 . G3 .  C4 .  G3 .  D#3 . G3 . \
                   A#3 . F3 .  D3 .  F3 .  A#3 . F3 .  D3 .  F3 .'),
        bass: pat('D#1 . .  .  .  .  .  .  A#0 . .  .  .  .  .  . \
                   G#0 . .  .  .  .  .  .  C1 .  .  .  .  .  .  .') }
    },
    arrangement: ['a', 'b', 'a', 'b']
  };

  /* “Yansıma” — motif tersten, kendi temanın çarpıtılmış hâli */
  SONGS.echo = {
    bpm: 116, swing: 0,
    voices: { lead: 'square', harm: 'square', bass: 'triangle', arp: 'square' },
    vol: { lead: 0.12, harm: 0.06, bass: 0.11, arp: 0.05 },
    sections: {
      a: { steps: 32,
        lead: pat('F4 .  G4 .  E4 .  C4 -  F4 .  G4 .  E4 .  C4 - \
                   F4 .  A4 .  G4 .  E4 -  C4 .  D4 .  C4 -  -  .'),
        harm: pat('C4 .  D4 .  C4 .  G3 -  C4 .  D4 .  C4 .  G3 - \
                   C4 .  F4 .  D4 .  C4 -  G3 .  A3 .  G3 -  -  .'),
        bass: pat('F1 .  F1 .  C2 .  C2 .  A1 .  A1 .  C2 .  C2 . \
                   F1 .  F1 .  D2 .  D2 .  G1 .  G1 .  C2 .  C2 .'),
        drums: pat('k . h . s . h . k . h . s . h k \
                    k . h . s . h . k k h . s . h h') },
      b: { steps: 16,
        lead: pat('C5 .  G4 .  E4 .  C4 .  G3 .  E3 .  C3 -  -  .'),
        bass: pat('C2 .  .  .  A1 .  .  .  F1 .  .  .  G1 .  .  .'),
        arp:  pat('C4 E4 G4 C5 G4 E4 C4 G3 F3 A3 C4 F4 C4 A3 F3 C3'),
        drums: pat('k . h k s . h . k . h k s s h h') }
    },
    arrangement: ['a', 'b', 'a', 'a', 'b']
  };

  /* “Yırtık Kapanıyor” — final: motif ilk kez engelsiz */
  SONGS.finale = {
    bpm: 88, swing: 0.05,
    voices: { lead: 'triangle', harm: 'square', bass: 'triangle', arp: 'sine' },
    vol: { lead: 0.14, harm: 0.06, bass: 0.11, arp: 0.05 },
    sections: {
      intro: { steps: 16,
        arp:  pat('C4 E4 G4 E4 C4 E4 G4 E4 A3 C4 F4 C4 A3 C4 F4 C4'),
        bass: pat('C2 .  .  .  .  .  .  .  A1 .  .  .  .  .  .  .') },
      a: { steps: 32,
        lead: pat('C4 .  E4 .  G4 -  F4 .  G4 .  E4 .  C4 -  .  . \
                   C4 .  E4 .  A4 -  G4 .  E4 .  D4 .  C4 -  -  .'),
        harm: pat('G3 .  C4 .  E4 -  C4 .  E4 .  C4 .  G3 -  .  . \
                   G3 .  C4 .  F4 -  E4 .  C4 .  A3 .  G3 -  -  .'),
        bass: pat('C2 .  .  .  A1 .  .  .  F1 .  .  .  G1 .  .  . \
                   C2 .  .  .  A1 .  .  .  D2 .  .  .  G1 .  G1 .'),
        arp:  pat('C4 E4 G4 C5 A3 C4 E4 A4 F3 A3 C4 F4 G3 B3 D4 G4 \
                   C4 E4 G4 C5 A3 C4 E4 A4 D4 F4 A4 D5 G3 B3 D4 G4'),
        drums: pat('. . h . s . h . . . h . s . h . \
                    . . h . s . h . . . h . s . h h') },
      c: { steps: 32,
        lead: pat('G4 .  C5 -  B4 .  G4 .  A4 -  G4 .  E4 -  .  . \
                   F4 .  A4 -  G4 .  E4 .  C4 -  -  .  .  .  .  .'),
        harm: pat('E4 .  G4 -  G4 .  E4 .  F4 -  E4 .  C4 -  .  . \
                   C4 .  F4 -  E4 .  C4 .  G3 -  -  .  .  .  .  .'),
        bass: pat('C2 .  C2 .  G1 .  .  .  F1 .  .  .  C2 .  .  . \
                   F1 .  F1 .  G1 .  .  .  C2 .  .  .  C2 .  .  .'),
        drums: pat('k . h . s . h . k . h . s . h h \
                    k . h . s . h . k . h . s s h h') }
    },
    arrangement: ['intro', 'a', 'c', 'a', 'c', 'c']
  };

  /* ------------------------------------------------------------------
   * LEITMOTIF — "Eve Dönüş" motifi
   * Dört notalık cümle her dönüm noktasında dönüşerek geri gelir.
   * ---------------------------------------------------------------- */
  const MOTIF = ['C4', 'E4', 'G4', 'F4'];

  const MOTIF_VARIANTS = {
    home:    { notes: MOTIF, step: 0.34, type: 'triangle', vol: 0.16, mult: 1 },
    grief:   { notes: ['C4', 'D#4', 'G4', 'D#4'], step: 0.52, type: 'triangle', vol: 0.15, mult: 1 },
    broken:  { notes: ['C4', 'E4', 'F#4', 'F4'], step: 0.30, type: 'square', vol: 0.15, mult: 1, detune: 0.06 },
    mirror:  { notes: MOTIF.slice().reverse(), step: 0.28, type: 'square', vol: 0.15, mult: 1 },
    erased:  { notes: MOTIF, step: 0.42, type: 'triangle', vol: 0.16, mult: 0.5, fade: true },
    bloom:   { notes: MOTIF.concat(['C5']), step: 0.40, type: 'triangle', vol: 0.16, mult: 2 }
  };

  A.motif = function (variant) {
    if (!A.enabled) return;
    A.unlock();
    const v = MOTIF_VARIANTS[variant] || MOTIF_VARIANTS.home;
    v.notes.forEach((n, i) => {
      const base = hz(n) * (v.mult || 1);
      const det = v.detune ? base * (1 + (Math.random() - 0.5) * v.detune * 2) : base;
      const vol = v.fade ? v.vol * (1 - i / (v.notes.length + 1)) : v.vol;
      A.tone({ freq: det, dur: v.step * 1.5, vol, type: v.type, delay: i * v.step, vary: false });
      A.tone({ freq: det / 2, dur: v.step * 1.8, vol: vol * 0.45, type: 'sine', delay: i * v.step, vary: false });
      if (v.detune && i % 2 === 0) {
        A.tone({ freq: det * 1.01, dur: v.step, vol: vol * 0.35, type: 'sawtooth', delay: i * v.step + 0.03, vary: false });
      }
    });
  };

  A.motifLength = variant => {
    const v = MOTIF_VARIANTS[variant] || MOTIF_VARIANTS.home;
    return v.notes.length * v.step * 1000;
  };

  /* ------------------------------------------------------------------
   * Uyarlanabilir gerilim — stres seviyesine göre tempo ve sertlik
   * ---------------------------------------------------------------- */
  A.tension = 0;
  A._tensionBand = 0;

  A.setTension = function (v) {
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    A.tension = v;
    const band = v < 0.34 ? 0 : v < 0.67 ? 1 : 2;
    if (band !== A._tensionBand) {
      A._tensionBand = band;
      if (A._seq) { const n = A._seq.name; A.stopMusic(); A.playMusic(n); }
    }
  };

  /* --------------------------- DAVUL SESLERİ --------------------------- */
  function drumHit(ch, when, vol) {
    if (!A.ctx) return;
    const t0 = A.ctx.currentTime + when;
    if (ch === 'k') {
      const o = A.ctx.createOscillator(), g = A.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(140, t0);
      o.frequency.exponentialRampToValueAtTime(42, t0 + 0.11);
      g.gain.setValueAtTime(vol * 1.5, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.connect(g); g.connect(A.musicGain);
      o.start(t0); o.stop(t0 + 0.18);
    } else if (ch === 's') {
      const len = Math.floor(A.ctx.sampleRate * 0.14);
      const buf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = A.ctx.createBufferSource(); src.buffer = buf;
      const f = A.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.8;
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(vol * 0.85, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      src.connect(f); f.connect(g); g.connect(A.musicGain);
      src.start(t0); src.stop(t0 + 0.16);
    } else if (ch === 'h' || ch === 'o') {
      const dur = ch === 'o' ? 0.12 : 0.035;
      const len = Math.floor(A.ctx.sampleRate * dur);
      const buf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = A.ctx.createBufferSource(); src.buffer = buf;
      const f = A.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(vol * 0.38, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(A.musicGain);
      src.start(t0); src.stop(t0 + dur + 0.02);
    }
  }

  /* ----------------------- ŞARKI DİZİLEYİCİSİ -------------------------
   * Dizilimdeki bölümler sırayla çalınır; şarkı 16 adımlık bir döngü
   * değil, iki-üç dakikalık yapılı bir parçadır.
   * ------------------------------------------------------------------ */
  const VOICE_DEFAULT = { lead: 'square', harm: 'square', bass: 'triangle', arp: 'square' };

  A.playMusic = function (name) {
    A._track = name;
    if (!A.enabled || !A.musicOn) return;
    A.init(); if (!A.ctx) return;
    if (A._seq && A._seq.name === name) return;
    A.stopMusic();
    const song = SONGS[name]; if (!song) return;

    const band = A._tensionBand;
    const bpm = song.bpm * (band === 0 ? 1 : band === 1 ? 1.07 : 1.15);
    const stepMs = 60000 / bpm / 4;        // 16'lık nota
    const stepS = stepMs / 1000;
    const voices = Object.assign({}, VOICE_DEFAULT, song.voices || {});
    const vols = song.vol || {};
    const gain = band === 2 ? 1.12 : 1;

    /* Dizilimi düz bir adım listesine aç */
    const timeline = [];
    song.arrangement.forEach(secName => {
      const sec = song.sections[secName];
      if (!sec) return;
      for (let i = 0; i < sec.steps; i++) timeline.push({ sec, i, name: secName });
    });
    if (!timeline.length) return;

    let pos = 0, cycles = 0;
    const seq = { name, timer: null, section: '' };

    function hold(arr, i) {
      let n = 1;
      while (i + n < arr.length && arr[i + n] === '-') n++;
      return n;
    }

    function playTrack(track, sec, i, delay) {
      const arr = sec[track];
      if (!arr) return;
      const note = arr[i % arr.length];
      if (!note || note === '.' || note === '-') return;
      const f = hz(note);
      if (!f) return;
      const len = hold(arr, i);
      const rise = song.rise ? Math.pow(2, Math.min(cycles, 3) / 4) : 1;
      const v = (vols[track] || 0.09) * gain;
      const dur = stepS * len * (track === 'bass' ? 1.6 : track === 'arp' ? 0.85 : 1.05);
      A.tone({ freq: f * rise, dur, vol: v, type: voices[track], delay, bus: 'music', vary: false });
      /* Melodiye ince bir oktav alt gövde — tek başına cılız kalmasın */
      if (track === 'lead') {
        A.tone({ freq: f * rise / 2, dur: dur * 0.9, vol: v * 0.30, type: 'triangle', delay, bus: 'music', vary: false });
      }
    }

    seq.timer = setInterval(function () {
      if (!A.enabled || !A.musicOn) return;
      const cell = timeline[pos];
      const sec = cell.sec, i = cell.i;
      seq.section = cell.name;

      /* Swing: tek numaralı 16'lıklar biraz geç düşer */
      const delay = (song.swing && (i % 2 === 1)) ? stepS * song.swing : 0;

      playTrack('lead', sec, i, delay);
      playTrack('harm', sec, i, delay);
      playTrack('bass', sec, i, 0);
      playTrack('arp', sec, i, delay);

      if (sec.drums) {
        const d = sec.drums[i % sec.drums.length];
        if (d && d !== '.') drumHit(d, delay, (vols.drums || 0.20) * gain);
      }

      pos++;
      if (pos >= timeline.length) { pos = 0; cycles++; }
    }, stepMs);

    A._seq = seq;
  };

  A.currentSection = () => (A._seq ? A._seq.section : '');
  A.songLength = function (name) {
    const song = SONGS[name]; if (!song) return 0;
    let steps = 0;
    song.arrangement.forEach(n => { const sec = song.sections[n]; if (sec) steps += sec.steps; });
    return steps * (60000 / song.bpm / 4);
  };

  /* --------------------------- STINGER'LAR ---------------------------
   * Kısa, kesin müzikal olaylar: savaş girişi, zafer, yenilgi.
   * ------------------------------------------------------------------ */
  const STINGERS = {
    battle: {
      notes: [['E4', 0], ['E4', 0.09], ['G4', 0.18], ['B4', 0.27], ['E5', 0.38]],
      bass:  [['E1', 0], ['E1', 0.18], ['E1', 0.36]],
      drums: [['k', 0], ['s', 0.09], ['k', 0.18], ['s', 0.27], ['k', 0.36], ['s', 0.42], ['s', 0.48]],
      type: 'square', vol: 0.17, dur: 0.16
    },
    boss: {
      notes: [['C3', 0], ['C3', 0.12], ['D#3', 0.24], ['C3', 0.36], ['G#2', 0.48], ['C3', 0.62]],
      bass:  [['C1', 0], ['C1', 0.24], ['G#0', 0.48], ['C1', 0.62]],
      drums: [['k', 0], ['k', 0.12], ['s', 0.24], ['k', 0.36], ['s', 0.48], ['k', 0.62], ['s', 0.70]],
      type: 'sawtooth', vol: 0.18, dur: 0.22
    },
    victory: {
      notes: [['C4', 0], ['E4', 0.10], ['G4', 0.20], ['C5', 0.30], ['G4', 0.44], ['C5', 0.54]],
      bass:  [['C2', 0], ['C2', 0.30], ['C2', 0.54]],
      drums: [['k', 0], ['s', 0.20], ['k', 0.30], ['s', 0.44], ['s', 0.54]],
      type: 'square', vol: 0.16, dur: 0.20
    },
    defeat: {
      notes: [['G3', 0], ['F3', 0.22], ['D#3', 0.44], ['C3', 0.66]],
      bass:  [['G1', 0], ['D#1', 0.44], ['C1', 0.66]],
      drums: [['k', 0], ['k', 0.44]],
      type: 'triangle', vol: 0.15, dur: 0.34
    }
  };

  A.stinger = function (name) {
    if (!A.enabled) return 0;
    A.unlock();
    const st = STINGERS[name];
    if (!st) return 0;
    A.stopMusic();
    st.notes.forEach(([n, t]) => {
      A.tone({ freq: hz(n), dur: st.dur, vol: st.vol, type: st.type, delay: t, bus: 'music', vary: false });
      A.tone({ freq: hz(n) / 2, dur: st.dur, vol: st.vol * 0.4, type: 'triangle', delay: t, bus: 'music', vary: false });
    });
    (st.bass || []).forEach(([n, t]) =>
      A.tone({ freq: hz(n), dur: st.dur * 1.6, vol: st.vol * 0.8, type: 'triangle', delay: t, bus: 'music', vary: false }));
    (st.drums || []).forEach(([ch, t]) => drumHit(ch, t, 0.24));
    const last = st.notes[st.notes.length - 1][1];
    return (last + st.dur) * 1000;
  };

  A.stopMusic = function () {
    if (A._seq) { clearInterval(A._seq.timer); A._seq = null; }
  };

  A.fadeMusicTo = function (name) {
    if (A._track === name) return;
    A.stopMusic(); A.playMusic(name);
  };

})(window.QW);
