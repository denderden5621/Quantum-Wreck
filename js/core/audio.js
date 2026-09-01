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
  A.tone = function (opt) {
    if (!A.enabled || !A.ctx) return;
    const t0 = A.ctx.currentTime + (opt.delay || 0);
    const osc = A.ctx.createOscillator();
    const g = A.ctx.createGain();
    osc.type = opt.type || 'square';
    osc.frequency.setValueAtTime(opt.freq || 440, t0);
    if (opt.to) {
      if (opt.slide === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(1, opt.to), t0 + (opt.dur || 0.2));
      else osc.frequency.linearRampToValueAtTime(opt.to, t0 + (opt.dur || 0.2));
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
    flt.type = opt.filter || 'lowpass';
    flt.frequency.setValueAtTime(opt.freq || 1200, t0);
    if (opt.to) flt.frequency.linearRampToValueAtTime(opt.to, t0 + dur);
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

  const TRACKS = {
    /* Gerilim: giderek tizleşen kare dalga — açılış sekansı */
    tension: {
      bpm: 108, wave: 'square', vol: 0.16,
      lead: ['C2', '-', 'C2', '-', 'D#2', '-', 'C2', '-', 'F2', '-', 'C2', '-', 'F#2', '-', 'G2', '-'],
      bass: ['C1', '-', '-', '-', 'C1', '-', '-', '-', 'F1', '-', '-', '-', 'F#1', '-', '-', '-'],
      rise: true
    },
    /* Keşif: sakin, geniş */
    overworld: {
      bpm: 96, wave: 'square', vol: 0.10,
      lead: ['A3', '-', 'C4', '-', 'E4', '-', 'D4', '-', 'C4', '-', 'A3', '-', 'G3', '-', '-', '-'],
      bass: ['A1', '-', '-', '-', 'F1', '-', '-', '-', 'C2', '-', '-', '-', 'G1', '-', '-', '-']
    },
    /* Gece: düşük, tekinsiz */
    night: {
      bpm: 76, wave: 'triangle', vol: 0.10,
      lead: ['D3', '-', '-', 'F3', '-', '-', 'A3', '-', 'G3', '-', '-', 'F3', '-', '-', '-', '-'],
      bass: ['D1', '-', '-', '-', 'D1', '-', '-', '-', 'A#0', '-', '-', '-', 'C1', '-', '-', '-']
    },
    /* Savaş: hızlı ve tehditkâr */
    battle: {
      bpm: 148, wave: 'square', vol: 0.13,
      lead: ['E3', 'E3', 'G3', 'E3', 'A3', '-', 'G3', 'F#3', 'E3', 'E3', 'G3', 'B3', 'A3', '-', 'E3', '-'],
      bass: ['E1', 'E1', '-', 'E1', 'E1', '-', 'G1', '-', 'A1', 'A1', '-', 'A1', 'B1', '-', 'B1', '-']
    },
    /* Boss: ağır ve devasa */
    boss: {
      bpm: 132, wave: 'sawtooth', vol: 0.13,
      lead: ['C3', 'C3', 'D#3', 'F3', 'F#3', 'F3', 'D#3', 'C3', 'A#2', 'C3', 'D#3', 'F3', 'G3', '-', 'F#3', '-'],
      bass: ['C1', '-', 'C1', '-', 'F1', '-', 'F1', '-', 'A#0', '-', 'A#0', '-', 'G1', '-', 'F#1', '-']
    },
    /* Kamp / takas: sıcak */
    camp: {
      bpm: 84, wave: 'triangle', vol: 0.11,
      lead: ['G3', '-', 'B3', '-', 'D4', '-', 'B3', '-', 'C4', '-', 'A3', '-', 'G3', '-', '-', '-'],
      bass: ['G1', '-', '-', '-', 'C2', '-', '-', '-', 'D2', '-', '-', '-', 'G1', '-', '-', '-']
    },
    /* Ağıt — kuruyan vaha ve Alpha'nın kubbesi: yavaş, çözülmeyen akor */
    lament: {
      bpm: 62, wave: 'triangle', vol: 0.10,
      lead: ['D3', '-', '-', '-', 'F3', '-', '-', 'E3', '-', '-', 'A#2', '-', '-', '-', '-', '-'],
      bass: ['D1', '-', '-', '-', '-', '-', '-', '-', 'A#0', '-', '-', '-', '-', '-', '-', '-']
    },
    /* Kuantum yansıması — kendi temanın tersten çalınmış hâli */
    echo: {
      bpm: 118, wave: 'square', vol: 0.12,
      lead: ['-', 'G3', '-', 'A3', '-', 'C4', '-', 'E4', '-', 'D4', '-', 'C4', '-', 'A3', '-', '-'],
      bass: ['A1', '-', '-', 'A1', '-', 'F1', '-', '-', 'C2', '-', '-', 'C2', '-', 'G1', '-', '-']
    },
    /* Final */
    finale: {
      bpm: 92, wave: 'triangle', vol: 0.14,
      lead: ['C4', '-', 'E4', '-', 'G4', '-', 'C5', '-', 'B4', '-', 'G4', '-', 'E4', '-', 'C4', '-'],
      bass: ['C2', '-', '-', '-', 'A1', '-', '-', '-', 'F1', '-', '-', '-', 'G1', '-', '-', '-']
    }
  };

  /* ------------------------------------------------------------------
   * Uyarlanabilir gerilim — oyuncunun stres seviyesine göre müzik değişir
   * 0.0 sakin · 0.5 tedirgin (tempo artar) · 1.0 panik (disonan alt katman)
   * ---------------------------------------------------------------- */
  A.tension = 0;
  A._tensionBand = 0;

  A.setTension = function (v) {
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    A.tension = v;
    const band = v < 0.34 ? 0 : v < 0.67 ? 1 : 2;
    if (band !== A._tensionBand) {
      A._tensionBand = band;
      /* Tempo ve katman değiştiği için dizileyici yeniden kurulur */
      if (A._seq) { const n = A._seq.name; A.stopMusic(); A.playMusic(n); }
    }
  };

  A.playMusic = function (name) {
    A._track = name;
    if (!A.enabled || !A.musicOn) return;
    A.init(); if (!A.ctx) return;
    if (A._seq && A._seq.name === name) return;
    A.stopMusic();
    const tr = TRACKS[name]; if (!tr) return;

    /* Gerilim arttıkça tempo yükselir ve ses biraz sertleşir */
    const band = A._tensionBand;
    const bpm = tr.bpm * (band === 0 ? 1 : band === 1 ? 1.10 : 1.22);
    const vol = tr.vol * (band === 2 ? 1.15 : 1);
    const stepMs = 60000 / bpm / 2; // 8'lik nota
    let i = 0, cycles = 0;
    const seq = { name, timer: null };
    seq.timer = setInterval(function () {
      if (!A.enabled || !A.musicOn) return;
      const step = i % tr.lead.length;
      if (step === 0) cycles++;
      const risePow = tr.rise ? Math.pow(2, Math.min(cycles - 1, 4) / 4) : 1; // gerilim yükselişi
      const l = tr.lead[step], b = tr.bass[step];
      if (l && l !== '-') A.tone({ freq: hz(l) * risePow, dur: stepMs / 1000 * 0.9, vol, type: tr.wave, bus: 'music' });
      if (b && b !== '-') A.tone({ freq: hz(b), dur: stepMs / 1000 * 1.4, vol: vol * 0.8, type: 'triangle', bus: 'music' });
      /* Panik katmanı: tritona yakın, hafif detune bir gölge nota */
      if (band === 2 && l && l !== '-' && (step % 4 === 0)) {
        A.tone({ freq: hz(l) * 1.414, dur: stepMs / 1000 * 0.7, vol: vol * 0.28, type: 'sawtooth', bus: 'music' });
      }
      if (band >= 1 && b && b !== '-' && (step % 8 === 4)) {
        A.tone({ freq: hz(b) * 0.5, dur: stepMs / 1000 * 2, vol: vol * 0.35, type: 'sine', bus: 'music' });
      }
      i++;
    }, stepMs);
    A._seq = seq;
  };

  A.stopMusic = function () {
    if (A._seq) { clearInterval(A._seq.timer); A._seq = null; }
  };

  A.fadeMusicTo = function (name) {
    if (A._track === name) return;
    A.stopMusic(); A.playMusic(name);
  };

})(window.QW);
