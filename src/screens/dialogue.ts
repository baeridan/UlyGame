import { h, later, onCleanup } from '../core/dom';
import { speak, stopSpeech } from '../core/speech';
import { sfx } from '../core/audio';
import { STORY, type Line, type Speaker } from '../story';
import { BRICCO, GLITCH, GLITCH_FRIEND, avatarModel } from '../art/characters';
import { dinoById } from '../art/dinos';
import { current, persist } from '../core/store';
import { modelView } from '../ui';
import type { Model } from '../art/bricks';

function who(s: Speaker): { name: string; model: Model | null; pitch: number; rate: number; cls: string } {
  const p = current();
  if (s === 'bricco') return { name: 'Bricco', model: BRICCO, pitch: 1.5, rate: 1, cls: 'bricco' };
  if (s === 'glitch') return { name: 'Glitch', model: GLITCH, pitch: 0.6, rate: 1.05, cls: 'glitch' };
  if (s === 'glitchBuono') return { name: 'Glitch il Buono', model: GLITCH_FRIEND, pitch: 1.2, rate: 1, cls: 'glitch-good' };
  if (s === 'player') return { name: p?.name || 'Uly', model: p ? avatarModel(p.avatar) : null, pitch: 1.3, rate: 1, cls: 'player' };
  if (s === 'narratore') return { name: 'Narratore', model: null, pitch: 1, rate: 0.92, cls: 'narrator' };
  const d = dinoById(s.slice(5));
  return { name: d.nick, model: d.model, pitch: 0.75, rate: 0.95, cls: 'dino' };
}

/** Mostra un dialogo della storia. Chiama onDone alla fine. */
export function playStory(key: string, onDone: () => void, force = false) {
  const p = current();
  if (!force && p && p.storySeen.includes(key)) return onDone();
  const lines: Line[] = STORY[key] || [];
  if (!lines.length) return onDone();
  if (p && !p.storySeen.includes(key)) {
    p.storySeen.push(key);
    persist();
  }
  let i = 0;
  const portrait = h('div', { class: 'dlg-portrait' });
  const name = h('div', { class: 'dlg-name' });
  const text = h('div', { class: 'dlg-text' });
  const next = h('button', { class: 'btn brick green dlg-next', 'aria-label': 'Avanti' }, '▶');
  const skip = h('button', { class: 'btn small dlg-skip' }, 'Salta ⏭');
  const box = h('div', { class: 'dlg-box' }, portrait, h('div', { class: 'dlg-bubble' }, name, text), next);
  const overlay = h('div', { class: 'dlg-overlay' }, skip, box);
  let typing = 0;
  let full = '';
  const finish = () => {
    stopSpeech();
    clearInterval(typing);
    overlay.remove();
    onDone();
  };
  const show = () => {
    const l = lines[i];
    const w = who(l.who);
    const t = l.text.replace(/\{name\}/g, p?.name || 'Uly');
    full = t;
    box.className = `dlg-box ${w.cls}`;
    name.textContent = w.name;
    portrait.replaceChildren(w.model ? modelView(w.model, 150, 150, { jitter: l.who === 'glitch' }).el : h('div', { class: 'narrator-icon' }, '📜'));
    if (l.who === 'glitch') sfx('glitch');
    text.textContent = '';
    let k = 0;
    clearInterval(typing);
    typing = window.setInterval(() => {
      k += 2;
      text.textContent = t.slice(0, k);
      if (k >= t.length) clearInterval(typing);
    }, 30);
    speak(t, { pitch: w.pitch, rate: w.rate });
  };
  const advance = () => {
    sfx('click');
    if (text.textContent!.length < full.length - 4) {
      clearInterval(typing);
      text.textContent = full;
      return;
    }
    i++;
    if (i >= lines.length) finish();
    else show();
  };
  box.addEventListener('click', advance);
  skip.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx('click');
    finish();
  });
  onCleanup(() => {
    clearInterval(typing);
    overlay.remove();
  });
  document.getElementById('app')!.append(overlay);
  later(50, show);
}
