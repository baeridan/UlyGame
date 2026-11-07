import { h, animLoop } from './core/dom';
import { sfx } from './core/audio';
import { stopSpeech } from './core/speech';
import { drawModel, fitCell, hiCanvas, modelSize, segments, type Model } from './art/bricks';
import { avatarModel } from './art/characters';
import type { Avatar } from './core/store';

export interface ModelView {
  el: HTMLCanvasElement;
  total: number;
  setCount(n: number, animate?: boolean): void;
  jump(): void;
  setModel(m: Model): void;
}

/** Canvas animato con un modello a mattoncini (dinosauro, robot, avatar...). */
export function modelView(m: Model, w: number, hgt: number, o: { count?: number; idle?: boolean; flip?: boolean; jitter?: boolean; cls?: string } = {}): ModelView {
  const { c, ctx } = hiCanvas(w, hgt, `model-view ${o.cls || ''}`);
  let model = m;
  let segs = segments(model);
  let cell = fitCell(model, w * 0.94, hgt * 0.9);
  let shown = o.count === undefined ? segs.length : o.count;
  const dropStart = new Map<number, number>();
  let jumpT = -10;
  let now = 0;
  animLoop((t) => {
    now = t;
    ctx.clearRect(0, 0, w, hgt);
    const sz = modelSize(model);
    const ox = (w - sz.w * cell) / 2;
    const baseY = hgt - sz.h * cell - 4;
    const jt = t - jumpT;
    const jump = jt < 0.5 ? Math.sin((jt / 0.5) * Math.PI) * cell * 2.2 : 0;
    const bob = o.idle !== false && shown >= segs.length ? Math.abs(Math.sin(t * 2.2)) * cell * 0.25 : 0;
    // ombra
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    ctx.beginPath();
    ctx.ellipse(w / 2, hgt - 4, (sz.w * cell) / 2.3, cell * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    const glitchShift = o.jitter && Math.sin(t * 13) > 0.85 ? (Math.random() - 0.5) * cell * 0.8 : 0;
    drawModel(ctx, model, {
      cell,
      ox,
      oy: baseY - jump - bob,
      count: shown,
      segs,
      flip: o.flip,
      rowShift: o.jitter ? (r) => (r % 3 === Math.floor(t * 7) % 3 ? glitchShift : 0) : undefined,
      dropFor: (i) => {
        const s0 = dropStart.get(i);
        if (s0 === undefined) return 0;
        const p = Math.min(1, (t - s0) / 0.35);
        if (p >= 1) dropStart.delete(i);
        return (1 - p) * (1 - p) * hgt * 0.8;
      },
    });
  });
  return {
    el: c,
    get total() {
      return segs.length;
    },
    setCount(n: number, animate = true) {
      n = Math.max(0, Math.min(segs.length, n));
      if (animate) for (let i = shown; i < n; i++) dropStart.set(i, now + (i - shown) * 0.06);
      shown = n;
    },
    jump() {
      jumpT = now;
    },
    setModel(nm: Model) {
      model = nm;
      segs = segments(model);
      cell = fitCell(model, w * 0.94, hgt * 0.9);
      shown = segs.length;
    },
  };
}

export function avatarView(a: Avatar, size = 80, idle = true) {
  return modelView(avatarModel(a), size * 0.75, size, { idle });
}

export function backBtn(onclick: () => void, label = '⬅') {
  return h(
    'button',
    {
      class: 'btn round back',
      'aria-label': 'Indietro',
      onclick: () => {
        sfx('click');
        stopSpeech();
        onclick();
      },
    },
    label
  );
}

export function topBar(title: string | Node, onBack: (() => void) | null, ...right: (Node | null)[]) {
  return h('header', { class: 'topbar' }, onBack ? backBtn(onBack) : h('span', { class: 'spacer-btn' }), h('div', { class: 'topbar-title' }, title), h('div', { class: 'topbar-right' }, ...right));
}

export function brickCounter(n: number) {
  return h('div', { class: 'pill bricks', title: 'Mattoncini' }, h('span', { class: 'mini-brick' }), h('b', { class: 'brick-count' }, String(n)));
}

/** Pulsante a forma di mattoncino */
export function brickBtn(label: string | Node, onclick: () => void, color = 'red', extra = '') {
  return h(
    'button',
    {
      class: `btn brick ${color} ${extra}`,
      onclick: () => {
        sfx('click');
        onclick();
      },
    },
    label
  ) as HTMLButtonElement;
}

export function modal(content: HTMLElement, onClose?: () => void) {
  const back = h('div', { class: 'modal-back' });
  const box = h('div', { class: 'modal' }, content);
  const close = () => {
    back.remove();
    onClose?.();
  };
  if (onClose !== undefined)
    box.prepend(
      h('button', { class: 'btn round close', 'aria-label': 'Chiudi', onclick: () => (sfx('click'), stopSpeech(), close()) }, '✕')
    );
  back.append(box);
  document.getElementById('app')!.append(back);
  return { close, box };
}

export function stars(n: number, max = 3) {
  return h('span', { class: 'stars' }, ...Array.from({ length: max }, (_, i) => h('span', { class: i < n ? 'star on' : 'star' }, '★')));
}

export function confirmBox(text: string, yes: () => void, yesLabel = 'Sì', noLabel = 'No') {
  const m = modal(
    h(
      'div',
      { class: 'col center' },
      h('p', { class: 'big-text' }, text),
      h(
        'div',
        { class: 'row gap center' },
        brickBtn(yesLabel, () => {
          m.close();
          yes();
        }, 'green'),
        brickBtn(noLabel, () => m.close(), 'red')
      )
    )
  );
}
