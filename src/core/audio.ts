import { save } from './store';

let ctx: AudioContext | null = null;
let sfxGain: GainNode;
let musicGain: GainNode;

function ac(): AudioContext | null {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    sfxGain = ctx.createGain();
    musicGain = ctx.createGain();
    sfxGain.connect(ctx.destination);
    musicGain.connect(ctx.destination);
    applyVolumes();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function applyVolumes() {
  if (!ctx) return;
  sfxGain.gain.value = save.settings.sfx;
  musicGain.gain.value = save.settings.music * 0.35;
}

/** Va chiamato al primo tocco: sblocca l'audio su iOS. */
export function unlockAudio() {
  ac();
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'square', vol = 0.15, dest?: AudioNode, slide = 0) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(dest || sfxGain);
  o.start(start);
  o.stop(start + dur + 0.05);
}

function noise(start: number, dur: number, vol = 0.2, freq = 1200) {
  const c = ac();
  if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(sfxGain);
  src.start(start);
}

export type Sfx = 'click' | 'correct' | 'wrong' | 'brick' | 'mine' | 'win' | 'pop' | 'roar' | 'step' | 'craft' | 'whoosh' | 'glitch';

export function sfx(name: Sfx) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  switch (name) {
    case 'click':
      tone(660, t, 0.06, 'square', 0.08);
      break;
    case 'pop':
      tone(500, t, 0.08, 'sine', 0.2, undefined, 600);
      break;
    case 'correct':
      [523, 659, 784, 1046].forEach((f, i) => tone(f, t + i * 0.07, 0.15, 'square', 0.1));
      break;
    case 'wrong':
      tone(300, t, 0.18, 'triangle', 0.2, undefined, -120);
      tone(240, t + 0.15, 0.22, 'triangle', 0.18, undefined, -80);
      break;
    case 'brick':
      noise(t, 0.05, 0.4, 2500);
      tone(900, t, 0.04, 'square', 0.05);
      break;
    case 'mine':
      noise(t, 0.12, 0.5, 700);
      noise(t + 0.09, 0.1, 0.35, 1400);
      break;
    case 'craft':
      [392, 523, 659].forEach((f, i) => tone(f, t + i * 0.05, 0.1, 'triangle', 0.15));
      noise(t, 0.08, 0.2, 3000);
      break;
    case 'step':
      tone(220, t, 0.05, 'triangle', 0.15);
      break;
    case 'whoosh':
      noise(t, 0.3, 0.25, 600);
      break;
    case 'glitch':
      for (let i = 0; i < 6; i++) tone(200 + Math.random() * 900, t + i * 0.04, 0.04, 'sawtooth', 0.06);
      break;
    case 'roar': {
      tone(140, t, 0.6, 'sawtooth', 0.18, undefined, -70);
      tone(95, t, 0.6, 'square', 0.1, undefined, -40);
      noise(t, 0.5, 0.3, 400);
      break;
    }
    case 'win': {
      const notes = [523, 523, 659, 784, 659, 784, 1046];
      notes.forEach((f, i) => tone(f, t + i * 0.12, 0.2, 'square', 0.1));
      tone(1046, t + notes.length * 0.12, 0.6, 'triangle', 0.15);
      break;
    }
  }
}

// ---------------- Musica generativa rilassante (stile chiptune) ----------------
let musicTimer: number | null = null;
let nextTime = 0;
let step = 0;
const scale = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3];
const chords = [
  [0, 2, 4],
  [4, 6, 1],
  [5, 0, 2],
  [3, 5, 0],
];
let melody: number[] = [];

function newPhrase() {
  melody = [];
  let n = 4;
  for (let i = 0; i < 16; i++) {
    n = Math.max(0, Math.min(scale.length - 1, n + [-2, -1, 0, 1, 1, 2][Math.floor(Math.random() * 6)]));
    melody.push(Math.random() < 0.25 ? -1 : n);
  }
}

export function startMusic() {
  const c = ac();
  if (!c || musicTimer !== null) return;
  newPhrase();
  nextTime = c.currentTime + 0.1;
  step = 0;
  musicTimer = window.setInterval(() => {
    const cc = ac();
    if (!cc) return;
    while (nextTime < cc.currentTime + 0.3) {
      const beat = 0.28;
      const chord = chords[Math.floor(step / 8) % chords.length];
      if (step % 8 === 0) {
        chord.forEach((ci) => tone(scale[ci] / 2, nextTime, beat * 7.5, 'triangle', 0.05, musicGain));
      }
      if (step % 2 === 0) tone(scale[chord[0]] / 4, nextTime, beat * 1.6, 'sine', 0.12, musicGain);
      const m = melody[step % 16];
      if (m >= 0 && step % 2 === 0) tone(scale[m], nextTime, beat * 1.7, 'square', 0.035, musicGain);
      step++;
      if (step % 64 === 0) newPhrase();
      nextTime += beat;
    }
  }, 100);
}

export function stopMusic() {
  if (musicTimer !== null) clearInterval(musicTimer);
  musicTimer = null;
}
