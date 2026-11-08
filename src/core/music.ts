import { audioCtx, musicBus } from './audio';
import { save } from './store';
import { makeRng, type Rng } from './rng';

/**
 * Musica generativa: accordi veri, melodie costruite sugli accordi, timbri morbidi
 * (marimba, campanelli, archi, basso, fisarmonica, flauto) e un tema per ogni momento del gioco.
 */
export type ThemeName = 'adventure' | 'focus' | 'boss' | 'sea' | 'pirate';

interface Theme {
  steps: number; // passi per battuta
  stepDur: number; // secondi per passo
  root: number; // nota MIDI della tonica
  scale: number[];
  prog: number[]; // gradi della scala, uno per battuta
  sevenths: boolean;
  lead: 'bell' | 'mallet' | 'flute' | 'accordion';
  leadOct: number;
  density: number; // quanto è "piena" la melodia (0..1)
  arp: 'eighths' | 'sixteenths' | 'waltz' | 'none';
  bass: 'pop' | 'long' | 'drive' | 'oompah';
  drums: 'soft' | 'drive' | 'shaker' | 'shanty' | 'none';
  pad: number; // volume degli archi
  vol: number; // volume complessivo del tema
  swing: number;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

const THEMES: Record<ThemeName, Theme> = {
  // mappa e menu: avventura allegra
  adventure: { steps: 16, stepDur: 0.15, root: 60, scale: MAJOR, prog: [0, 4, 5, 3], sevenths: false, lead: 'mallet', leadOct: 1, density: 0.7, arp: 'eighths', bass: 'pop', drums: 'soft', pad: 0.05, vol: 1, swing: 0.08 },
  // missioni: calma e concentrazione
  focus: { steps: 16, stepDur: 0.18, root: 65, scale: MAJOR, prog: [0, 5, 1, 4], sevenths: true, lead: 'bell', leadOct: 1, density: 0.35, arp: 'eighths', bass: 'long', drums: 'none', pad: 0.045, vol: 0.7, swing: 0.05 },
  // sfida a Glitch: energica, in minore
  boss: { steps: 16, stepDur: 0.125, root: 57, scale: MINOR, prog: [0, 5, 2, 6], sevenths: false, lead: 'mallet', leadOct: 1, density: 0.75, arp: 'sixteenths', bass: 'drive', drums: 'drive', pad: 0.05, vol: 0.9, swing: 0 },
  // Isola Lontana: brezza di mare in 6/8
  sea: { steps: 6, stepDur: 0.22, root: 62, scale: MAJOR, prog: [0, 3, 0, 4], sevenths: true, lead: 'flute', leadOct: 1, density: 0.6, arp: 'waltz', bass: 'oompah', drums: 'shaker', pad: 0.045, vol: 0.9, swing: 0 },
  // nave di Capitan Scompiglio: canzone pirata
  pirate: { steps: 6, stepDur: 0.16, root: 62, scale: MINOR, prog: [0, 6, 5, 4], sevenths: false, lead: 'accordion', leadOct: 1, density: 0.8, arp: 'waltz', bass: 'oompah', drums: 'shanty', pad: 0.03, vol: 0.85, swing: 0 },
};

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

let noiseBuf: AudioBuffer | null = null;
function noiseBuffer(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

// ---------------- strumenti ----------------
type Out = { dry: GainNode; wet: GainNode };

function env(c: AudioContext, out: Out, t: number, vol: number, a: number, dur: number, rel: number, wet = 0.3) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
  g.gain.setValueAtTime(Math.max(0.0002, vol), t + Math.max(a, dur - rel));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(out.dry);
  const w = c.createGain();
  w.gain.value = wet;
  g.connect(w).connect(out.wet);
  return g;
}

function osc(c: AudioContext, type: OscillatorType, f: number, t: number, dur: number, dest: AudioNode, detune = 0) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = f;
  o.detune.value = detune;
  o.connect(dest);
  o.start(t);
  o.stop(t + dur + 0.05);
  return o;
}

function mallet(c: AudioContext, out: Out, m: number, t: number, vol: number, dur = 0.6) {
  const f = mtof(m);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(out.dry);
  const w = c.createGain();
  w.gain.value = 0.35;
  g.connect(w).connect(out.wet);
  osc(c, 'sine', f, t, dur, g);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0.25, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.2);
  g2.connect(g);
  osc(c, 'sine', f * 4, t, dur * 0.25, g2);
}

function bell(c: AudioContext, out: Out, m: number, t: number, vol: number, dur = 1.4) {
  const f = mtof(m);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(out.dry);
  const w = c.createGain();
  w.gain.value = 0.55;
  g.connect(w).connect(out.wet);
  osc(c, 'sine', f, t, dur, g);
  const g2 = c.createGain();
  g2.gain.value = 0.3;
  g2.connect(g);
  osc(c, 'sine', f * 2.76, t, dur * 0.4, g2);
}

function vibrato(c: AudioContext, o: OscillatorNode, t: number, dur: number, depth: number) {
  const l = c.createOscillator();
  l.frequency.value = 5.3;
  const lg = c.createGain();
  lg.gain.setValueAtTime(0, t);
  lg.gain.linearRampToValueAtTime(depth, t + Math.min(0.3, dur * 0.6));
  l.connect(lg).connect(o.frequency);
  l.start(t);
  l.stop(t + dur + 0.05);
}

function flute(c: AudioContext, out: Out, m: number, t: number, vol: number, dur: number) {
  const f = mtof(m);
  const g = env(c, out, t, vol, 0.06, dur, Math.min(0.15, dur * 0.4), 0.45);
  const o = osc(c, 'sine', f, t, dur, g);
  vibrato(c, o, t, dur, f * 0.006);
  const o2g = c.createGain();
  o2g.gain.value = 0.12;
  o2g.connect(g);
  osc(c, 'triangle', f * 2, t, dur, o2g);
}

function accordion(c: AudioContext, out: Out, m: number, t: number, vol: number, dur: number) {
  const f = mtof(m);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2000;
  lp.Q.value = 0.8;
  const g = env(c, out, t, vol, 0.03, dur, Math.min(0.1, dur * 0.3), 0.3);
  lp.connect(g);
  const a = osc(c, 'sawtooth', f, t, dur, lp, -9);
  osc(c, 'sawtooth', f, t, dur, lp, 9);
  osc(c, 'square', f / 2, t, dur, lp, 0);
  vibrato(c, a, t, dur, f * 0.004);
}

function pad(c: AudioContext, out: Out, notes: number[], t: number, dur: number, vol: number) {
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(700, t);
  lp.frequency.linearRampToValueAtTime(1300, t + dur * 0.5);
  lp.frequency.linearRampToValueAtTime(800, t + dur);
  const g = env(c, out, t, vol, Math.min(0.6, dur * 0.3), dur + 0.3, 0.5, 0.6);
  lp.connect(g);
  for (const m of notes) {
    osc(c, 'sawtooth', mtof(m), t, dur + 0.3, lp, -7);
    osc(c, 'sawtooth', mtof(m), t, dur + 0.3, lp, 7);
  }
}

function bass(c: AudioContext, out: Out, m: number, t: number, dur: number, vol: number) {
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 650;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(vol * 0.5, t + Math.min(0.25, dur));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  lp.connect(g).connect(out.dry);
  osc(c, 'triangle', mtof(m), t, dur, lp);
  osc(c, 'sine', mtof(m), t, dur, lp);
}

function noiseHit(c: AudioContext, out: Out, t: number, vol: number, dur: number, type: BiquadFilterType, freq: number, wet = 0.15) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out.dry);
  if (wet) {
    const w = c.createGain();
    w.gain.value = wet;
    g.connect(w).connect(out.wet);
  }
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

function kick(c: AudioContext, out: Out, t: number, vol: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  g.connect(out.dry);
  const o = c.createOscillator();
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
  o.connect(g);
  o.start(t);
  o.stop(t + 0.25);
}

// ---------------- composizione ----------------
interface Note {
  step: number;
  len: number;
  deg: number; // grado della scala (anche oltre l'ottava)
}

const RHYTHMS_16 = [
  [0, 4, 6, 8, 12],
  [0, 3, 6, 8, 10, 12],
  [0, 2, 4, 8, 11, 12],
  [0, 6, 8, 12, 14],
  [0, 4, 8, 10, 12, 14],
];
const RHYTHMS_6 = [
  [0, 2, 3, 5],
  [0, 3, 4, 5],
  [0, 1, 2, 3],
  [0, 3, 5],
];

function chordDegrees(root: number, sevenths: boolean) {
  const d = [root, root + 2, root + 4];
  if (sevenths) d.push(root + 6);
  return d;
}

function degToMidi(th: Theme, deg: number, oct = 0) {
  const o = Math.floor(deg / 7);
  const i = ((deg % 7) + 7) % 7;
  return th.root + 12 * (o + oct) + th.scale[i];
}

function makeMelody(th: Theme, rng: Rng): Note[][] {
  const bank = th.steps === 16 ? RHYTHMS_16 : RHYTHMS_6;
  const rA = rng.pick(bank);
  let rB = rng.pick(bank);
  if (rB === rA) rB = bank[(bank.indexOf(rA) + 1) % bank.length];
  const bars: Note[][] = [];
  let prev = 9; // grado di partenza (una terza sopra la tonica, ottava sopra)
  const nBars = th.prog.length * 2;
  for (let b = 0; b < nBars; b++) {
    const chord = th.prog[b % th.prog.length];
    const tones = chordDegrees(chord, false).flatMap((d) => [d, d + 7, d + 14]).filter((d) => d >= 5 && d <= 16);
    const cadence = b % 4 === 3;
    const rhythm = cadence ? [0, th.steps === 16 ? 8 : 3] : b % 4 === 2 ? rB : rA;
    const notes: Note[] = [];
    rhythm.forEach((step, i) => {
      if (!cadence && i > 0 && rng() > th.density + 0.2) return;
      const strong = step % (th.steps / 2) === 0;
      let deg: number;
      if (i === 0 || strong || cadence) {
        deg = tones.reduce((best, d) => (Math.abs(d - prev) < Math.abs(best - prev) ? d : best), tones[0]);
        if (cadence && i === rhythm.length - 1) deg = tones.find((d) => (d - chord) % 7 === 0 && d >= 7) ?? deg;
      } else {
        const dir = prev > 12 ? -1 : prev < 8 ? 1 : rng.chance(0.5) ? 1 : -1;
        deg = prev + dir * (rng.chance(0.75) ? 1 : 2);
      }
      const next = rhythm[i + 1] ?? th.steps;
      notes.push({ step, len: next - step, deg });
      prev = deg;
    });
    bars.push(notes);
  }
  return bars;
}

// ---------------- riproduzione ----------------
let started = false;
let current: ThemeName = 'adventure';
let wanted: ThemeName = 'adventure';
let timer: number | null = null;
let nextTime = 0;
let step = 0;
let bar = 0;
let melody: Note[][] = [];
let rng = makeRng();
let loops = 0;

function scheduleStep(c: AudioContext, out: Out, th: Theme, t: number) {
  const s = step;
  const chordRoot = th.prog[bar % th.prog.length];
  const chord = chordDegrees(chordRoot, th.sevenths);
  const v = th.vol;
  const barLen = th.steps * th.stepDur;
  const swing = s % 2 === 1 ? th.swing * th.stepDur : 0;
  const tt = t + swing;

  // archi: un accordo per battuta
  if (s === 0 && th.pad > 0) pad(c, out, chord.map((d) => degToMidi(th, d, 0)), t, barLen, th.pad * v);

  // basso
  const root = degToMidi(th, chordRoot, -1);
  const fifth = degToMidi(th, chordRoot + 4, -1);
  if (th.bass === 'pop') {
    if (s === 0) bass(c, out, root, t, 0.5, 0.32 * v);
    if (s === 6) bass(c, out, root, t, 0.25, 0.2 * v);
    if (s === 8) bass(c, out, fifth, t, 0.45, 0.26 * v);
    if (s === 14) bass(c, out, root + 12, t, 0.2, 0.16 * v);
  } else if (th.bass === 'long') {
    if (s === 0) bass(c, out, root, t, barLen * 0.9, 0.22 * v);
    if (s === 10) bass(c, out, fifth, t, barLen * 0.35, 0.12 * v);
  } else if (th.bass === 'drive') {
    if (s % 2 === 0) bass(c, out, s % 8 === 6 ? root + 12 : root, t, 0.18, 0.26 * v);
  } else if (th.bass === 'oompah') {
    if (s === 0) bass(c, out, root, t, th.stepDur * 2.5, 0.32 * v);
    if (s === 3) bass(c, out, fifth, t, th.stepDur * 2.5, 0.24 * v);
  }

  // arpeggio di marimba
  const arpNotes = chord.slice(0, 3).map((d) => degToMidi(th, d, 1));
  if (th.arp === 'eighths' && s % 2 === 0) {
    const seq = [0, 1, 2, 1, 0, 2, 1, 2];
    mallet(c, out, arpNotes[seq[(s / 2) % 8]], tt, 0.09 * v, 0.5);
  } else if (th.arp === 'sixteenths') {
    const seq = [0, 1, 2, 1];
    mallet(c, out, arpNotes[seq[s % 4]] + (s >= 8 ? 12 : 0), tt, 0.06 * v, 0.25);
  } else if (th.arp === 'waltz') {
    if (s === 1 || s === 2 || s === 4 || s === 5) arpNotes.forEach((m) => mallet(c, out, m, tt, 0.045 * v, 0.3));
  }

  // melodia
  const n = melody[bar % melody.length]?.find((x) => x.step === s);
  if (n) {
    const m = degToMidi(th, n.deg, th.leadOct - 1);
    const dur = n.len * th.stepDur * 0.95;
    if (th.lead === 'bell') bell(c, out, m + 12, tt, 0.07 * v, Math.max(0.8, dur));
    else if (th.lead === 'mallet') mallet(c, out, m, tt, 0.13 * v, Math.max(0.35, dur));
    else if (th.lead === 'flute') flute(c, out, m, tt, 0.09 * v, dur);
    else accordion(c, out, m, tt, 0.07 * v, dur);
  }

  // percussioni
  const last = bar % 4 === 3;
  if (th.drums === 'soft') {
    if (s === 0 || s === 8 || (last && s === 14)) kick(c, out, t, 0.35 * v);
    if (s === 4 || s === 12) noiseHit(c, out, t, 0.08 * v, 0.12, 'bandpass', 1900, 0.3);
    if (s % 2 === 0) noiseHit(c, out, tt, (s % 4 === 2 ? 0.05 : 0.025) * v, 0.04, 'highpass', 8000, 0);
  } else if (th.drums === 'drive') {
    if (s === 0 || s === 6 || s === 8 || s === 10) kick(c, out, t, 0.42 * v);
    if (s === 4 || s === 12) noiseHit(c, out, t, 0.16 * v, 0.14, 'bandpass', 1800, 0.25);
    if (s % 2 === 0) noiseHit(c, out, t, 0.05 * v, 0.03, 'highpass', 9000, 0);
    if (last && s >= 12) noiseHit(c, out, t, 0.1 * v, 0.1, 'bandpass', 900 + s * 40, 0.2);
  } else if (th.drums === 'shaker') {
    noiseHit(c, out, t, (s % 3 === 0 ? 0.05 : 0.025) * v, 0.07, 'bandpass', 6500, 0.1);
  } else if (th.drums === 'shanty') {
    if (s === 0) kick(c, out, t, 0.38 * v);
    if (s === 3) noiseHit(c, out, t, 0.12 * v, 0.1, 'bandpass', 1500, 0.3);
    noiseHit(c, out, t, (s % 3 === 0 ? 0.06 : 0.03) * v, 0.05, 'highpass', 7000, 0);
  }
}

function tick() {
  const c = audioCtx();
  const out = musicBus();
  if (!c || !out) return;
  while (nextTime < c.currentTime + 0.25) {
    const th = THEMES[current];
    if (save.settings.music > 0) scheduleStep(c, out, th, nextTime);
    nextTime += th.stepDur;
    step++;
    if (step >= th.steps) {
      step = 0;
      bar++;
      // cambio di tema a inizio battuta
      if (wanted !== current) {
        current = wanted;
        bar = 0;
        melody = makeMelody(THEMES[current], rng);
      } else if (bar % (THEMES[current].prog.length * 2) === 0) {
        loops++;
        // ogni due giri una melodia nuova, per non stancare
        if (loops % 2 === 0) melody = makeMelody(THEMES[current], rng);
      }
    }
  }
}

/** Avvia la musica (va chiamata dopo un tocco dell'utente). */
export function startMusic() {
  const c = audioCtx();
  if (!c || started) return;
  started = true;
  rng = makeRng();
  current = wanted;
  melody = makeMelody(THEMES[current], rng);
  nextTime = c.currentTime + 0.1;
  step = 0;
  bar = 0;
  timer = window.setInterval(tick, 60);
}

export function stopMusic() {
  if (timer !== null) clearInterval(timer);
  timer = null;
  started = false;
}

/** Sceglie il tema: cambia all'inizio della battuta successiva. */
export function playTheme(name: ThemeName) {
  wanted = name;
  if (!started) current = name;
}
