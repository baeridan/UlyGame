import { save } from './store';

/**
 * Motore audio: effetti sonori e bus della musica, con un riverbero leggero
 * che rende i suoni più morbidi e "da cartone animato".
 */
let ctx: AudioContext | null = null;
let sfxGain: GainNode;
let musicGain: GainNode;
let reverb: ConvolverNode;
let reverbIn: GainNode;
let paused = false;
let master: DynamicsCompressorNode;

function impulse(c: AudioContext, seconds: number, decay: number) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

export function audioCtx(): AudioContext | null {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    const comp = ctx.createDynamicsCompressor();
    master = comp;
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    comp.connect(ctx.destination);
    sfxGain = ctx.createGain();
    musicGain = ctx.createGain();
    sfxGain.connect(comp);
    musicGain.connect(comp);
    reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx, 2.2, 2.6);
    reverbIn = ctx.createGain();
    reverbIn.gain.value = 0.32;
    reverbIn.connect(reverb);
    reverb.connect(comp);
    applyVolumes();
  }
  if (ctx.state === 'suspended' && !paused) ctx.resume();
  return ctx;
}

/** Uscita della musica (con mandata al riverbero). */
export function musicBus(): { dry: GainNode; wet: GainNode } | null {
  if (!audioCtx()) return null;
  return { dry: musicGain, wet: reverbIn };
}

export function applyVolumes() {
  if (!ctx) return;
  sfxGain.gain.value = save.settings.sfx;
  musicGain.gain.value = save.settings.music * 0.55;
}

/** Va chiamato al primo tocco: sblocca l'audio su iPad e Android. */
export function unlockAudio() {
  audioCtx();
}

/** L'app va in secondo piano (tasto Home): silenzio totale. */
export function pauseAudio() {
  paused = true;
  ctx?.suspend().catch(() => {});
}

export function resumeAudio() {
  paused = false;
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export const isPaused = () => paused;

/** Uscita finale (per registrare un'anteprima). */
export const masterOut = () => (audioCtx() ? master : null);

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, slide = 0, wet = 0.2) {
  const c = audioCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g);
  g.connect(sfxGain);
  if (wet) {
    const w = c.createGain();
    w.gain.value = wet;
    g.connect(w).connect(reverbIn);
  }
  o.start(start);
  o.stop(start + dur + 0.05);
}

/** Suono "marimba": fondamentale + armonica che si spegne in fretta. */
function mallet(freq: number, start: number, vol = 0.18, dur = 0.5) {
  tone(freq, start, dur, 'sine', vol);
  tone(freq * 4, start, dur * 0.25, 'sine', vol * 0.25, 0, 0.1);
}

/** Campanellino */
function bell(freq: number, start: number, vol = 0.1, dur = 1.1) {
  tone(freq, start, dur, 'sine', vol, 0, 0.4);
  tone(freq * 2.76, start, dur * 0.5, 'sine', vol * 0.35, 0, 0.4);
}

function noise(start: number, dur: number, vol = 0.2, freq = 1200, type: BiquadFilterType = 'bandpass') {
  const c = audioCtx();
  if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(sfxGain);
  src.start(start);
}

export type Sfx = 'click' | 'correct' | 'wrong' | 'brick' | 'mine' | 'win' | 'pop' | 'roar' | 'step' | 'craft' | 'whoosh' | 'glitch' | 'pirate';

export function sfx(name: Sfx) {
  if (paused) return;
  const c = audioCtx();
  if (!c) return;
  const t = c.currentTime;
  switch (name) {
    case 'click':
      tone(880, t, 0.05, 'triangle', 0.06, 0, 0);
      break;
    case 'pop':
      tone(520, t, 0.1, 'sine', 0.18, 500, 0.1);
      break;
    case 'correct':
      // piccolo arpeggio di marimba e campanello
      [523.3, 659.3, 784, 1046.5].forEach((f, i) => mallet(f, t + i * 0.075, 0.16, 0.45));
      bell(2093, t + 0.3, 0.05);
      break;
    case 'wrong':
      // un "boing" gentile, non una punizione
      tone(330, t, 0.25, 'sine', 0.16, -110);
      tone(247, t + 0.12, 0.3, 'triangle', 0.08, -60);
      break;
    case 'brick':
      noise(t, 0.04, 0.35, 3200);
      tone(1400, t, 0.05, 'sine', 0.06, -400, 0);
      break;
    case 'mine':
      noise(t, 0.12, 0.5, 700);
      noise(t + 0.08, 0.14, 0.35, 1600);
      break;
    case 'craft':
      [392, 523.3, 659.3].forEach((f, i) => mallet(f, t + i * 0.06, 0.14));
      noise(t, 0.06, 0.2, 3000);
      break;
    case 'step':
      mallet(392 + Math.random() * 60, t, 0.1, 0.18);
      break;
    case 'whoosh':
      noise(t, 0.35, 0.22, 900);
      break;
    case 'glitch':
      for (let i = 0; i < 5; i++) tone(300 + Math.random() * 700, t + i * 0.045, 0.05, 'triangle', 0.05, 0, 0);
      break;
    case 'pirate':
      // "yo-ho!": due note di fisarmonica
      tone(294, t, 0.22, 'sawtooth', 0.05, 0, 0.3);
      tone(392, t + 0.2, 0.35, 'sawtooth', 0.05, 0, 0.3);
      break;
    case 'roar': {
      tone(150, t, 0.7, 'sawtooth', 0.12, -80, 0.3);
      tone(100, t, 0.7, 'triangle', 0.12, -40, 0.3);
      noise(t, 0.6, 0.28, 380, 'lowpass');
      break;
    }
    case 'win': {
      const notes = [523.3, 659.3, 784, 1046.5, 784, 1046.5, 1318.5];
      notes.forEach((f, i) => mallet(f, t + i * 0.11, 0.15, 0.5));
      [523.3, 659.3, 784].forEach((f) => tone(f, t + 0.8, 1.2, 'triangle', 0.06, 0, 0.5));
      bell(2093, t + 0.8, 0.07, 1.6);
      break;
    }
  }
}
