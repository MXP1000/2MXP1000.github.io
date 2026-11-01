/* Procedural sound effects using the Web Audio API (no external files needed). */

type Engine = { ctx: AudioContext; master: GainNode; noise: AudioBuffer };

const MASTER_VOLUME = 0.9;
let engine: Engine | null = null;
let unlocked = false;
let muted = false;
let ambientOn = false;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

function init(): Engine | null {
  if (!unlocked) return null;
  if (engine) {
    if (engine.ctx.state === "suspended") void engine.ctx.resume();
    return engine;
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER_VOLUME;

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 12;
  comp.ratio.value = 5;
  comp.attack.value = 0.003;
  comp.release.value = 0.25;
  master.connect(comp).connect(ctx.destination);

  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  engine = { ctx, master, noise };
  return engine;
}

function ready(): Engine | null {
  const e = init();
  if (!e || muted) return null;
  if (e.ctx.state === "suspended") void e.ctx.resume();
  return e;
}

function env(param: AudioParam, t: number, peak: number, attack: number, decay: number) {
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(peak, t + attack);
  param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function noiseAt(e: Engine, t: number, dur: number) {
  const src = e.ctx.createBufferSource();
  src.buffer = e.noise;
  src.loop = true;
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur);
  return src;
}

function boomAt(e: Engine, t: number, power: number) {
  const { ctx, master } = e;

  // Sub thump
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 1.3);
  const og = ctx.createGain();
  env(og.gain, t, 0.9 * power, 0.008, 1.5);
  osc.connect(og).connect(master);
  osc.start(t);
  osc.stop(t + 1.6);

  // Rumble (sweeping low-pass noise)
  const rumble = noiseAt(e, t, 2.2);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 3;
  lp.frequency.setValueAtTime(1600, t);
  lp.frequency.exponentialRampToValueAtTime(110, t + 1.5);
  const rg = ctx.createGain();
  env(rg.gain, t, 0.9 * power, 0.01, 1.9);
  rumble.connect(lp).connect(rg).connect(master);

  // Initial crack
  const crack = noiseAt(e, t, 0.1);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1400;
  const cg = ctx.createGain();
  env(cg.gain, t, 0.55 * power, 0.002, 0.1);
  crack.connect(hp).connect(cg).connect(master);
}

function crackleAt(e: Engine, t0: number, spread: number, count: number) {
  const { ctx, master } = e;
  for (let i = 0; i < count; i++) {
    const t = t0 + Math.random() * spread;
    const n = noiseAt(e, t, 0.05);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = rand(2000, 5000);
    const g = ctx.createGain();
    env(g.gain, t, rand(0.08, 0.2), 0.002, 0.03);
    n.connect(hp).connect(g).connect(master);
  }
}

function softBell() {
  const e = ready();
  if (!e) return;
  const { ctx, master } = e;
  const t = ctx.currentTime;
  const f = pick([523.25, 587.33, 659.25, 783.99, 880, 1046.5]);
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.value = f;
  const g = ctx.createGain();
  env(g.gain, t, 0.05, 0.01, 2.2);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 2.4);
}

function startAmbient() {
  if (ambientOn) return;
  const e = init();
  if (!e) return;
  ambientOn = true;
  const { ctx, master } = e;

  // Warm, slowly breathing pad
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  const pad = ctx.createGain();
  pad.gain.value = 0.05;
  lp.connect(pad).connect(master);

  [130.81, 164.81, 196.0, 261.63].forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = i % 2 ? "triangle" : "sine";
    o.frequency.value = f;
    o.detune.value = (i - 1.5) * 5;
    const g = ctx.createGain();
    g.gain.value = 0.22;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05 + i * 0.025;
    const lg = ctx.createGain();
    lg.gain.value = 0.12;
    lfo.connect(lg).connect(g.gain);
    o.connect(g).connect(lp);
    o.start();
    lfo.start();
  });

  // Occasional wind-chime twinkles
  window.setInterval(() => {
    if (!muted && Math.random() < 0.55) softBell();
  }, 3200);
}

/* ---------- Public API ---------- */

/** Call on any user gesture to enable audio. */
export function unlock() {
  unlocked = true;
  const e = init();
  if (e) startAmbient();
}

export function setMuted(m: boolean) {
  muted = m;
  if (engine) {
    engine.master.gain.setTargetAtTime(m ? 0 : MASTER_VOLUME, engine.ctx.currentTime, 0.05);
  }
}

export function isMuted() {
  return muted;
}

/** Rocket whistle while it climbs. */
export function launch() {
  const e = ready();
  if (!e) return;
  const { ctx, master } = e;
  const t = ctx.currentTime;

  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(380, t);
  o.frequency.exponentialRampToValueAtTime(1500, t + 0.75);
  const g = ctx.createGain();
  env(g.gain, t, 0.08, 0.05, 0.8);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.9);

  const hiss = noiseAt(e, t, 0.8);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 3;
  bp.frequency.setValueAtTime(700, t);
  bp.frequency.exponentialRampToValueAtTime(3200, t + 0.75);
  const ng = ctx.createGain();
  env(ng.gain, t, 0.25, 0.05, 0.75);
  hiss.connect(bp).connect(ng).connect(master);
}

/** Firework burst pop + crackle tail. */
export function burst() {
  const e = ready();
  if (!e) return;
  const t = e.ctx.currentTime;
  boomAt(e, t, 0.45);
  crackleAt(e, t + 0.25, 1.1, 8);
}

/** Big atom-bomb explosion. */
export function bomb() {
  const e = ready();
  if (!e) return;
  const t = e.ctx.currentTime;
  boomAt(e, t, 1.5);
  crackleAt(e, t + 0.15, 2.6, 45);
}

export function crackle(count = 12, spread = 1) {
  const e = ready();
  if (!e) return;
  crackleAt(e, e.ctx.currentTime, spread, count);
}

/** Tiny glitter tinkle (sparklers / diya lighting). */
export function sparkle() {
  const e = ready();
  if (!e) return;
  const { ctx, master } = e;
  const t = ctx.currentTime;
  const f = rand(1800, 3200);
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.12);
  const g = ctx.createGain();
  env(g.gain, t, 0.035, 0.003, 0.22);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.3);
}

export function chime(notes: number[], gap: number) {
  const e = ready();
  if (!e) return;
  const { ctx, master } = e;
  const t0 = ctx.currentTime;
  const partials: [number, number, number][] = [
    [1, 0.16, 1.8],
    [2.01, 0.06, 0.9],
    [3.0, 0.025, 0.5],
  ];
  notes.forEach((f, i) => {
    const t = t0 + i * gap;
    partials.forEach(([m, peak, dec]) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * m;
      const g = ctx.createGain();
      env(g.gain, t, peak, 0.005, dec);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + dec + 0.1);
    });
  });
}

export function diyaChime() {
  chime([659.25, 783.99, 987.77, 1318.5], 0.16);
}

export function bells() {
  chime([523.25, 659.25, 783.99, 1046.5], 0.12);
}
  
