import { beginScreen, h, later, onCleanup } from '../core/dom';
import { me, persist } from '../core/store';
import { B, BLOCKS, drawCube, iso } from '../art/blocks';
import { hiCanvas, drawBrick } from '../art/bricks';
import { blockIcon, img } from '../art/icons';
import { confirmBox, topBar } from '../ui';
import { showMap } from './map';
import { sfx } from '../core/audio';
import { speak } from '../core/speech';

const G = 8;
const MAXH = 7;
const PALETTE: B[] = [B.Grass, B.Dirt, B.Stone, B.Sand, B.Wood, B.Planks, B.Leaves, B.Brick, B.BrickBlue, B.BrickYellow, B.Snow, B.Ice, B.Water, B.Lava, B.Diamond, B.Gold, B.Emerald, B.Crystal, B.Obsidian, B.Flowers];

export function showSandbox() {
  const p = me();
  if (!p.sandbox || p.sandbox.length !== G * G) p.sandbox = Array.from({ length: G * G }, () => []);
  const root = beginScreen('sandbox-screen');
  let sel: B = B.Brick;
  let erase = false;
  const wrap = h('div', { class: 'sandbox-wrap' });
  let info = { s: 20, ox: 0, oy: 0 };
  let canvas: HTMLCanvasElement | null = null;

  const render = () => {
    const W = wrap.clientWidth || 600;
    const H = wrap.clientHeight || 400;
    const s = Math.floor(Math.min(W / (G * 2 + 1), H / (G + MAXH + 2)));
    const ox = W / 2;
    const oy = (H - (G * s + MAXH * s)) / 2 + MAXH * s;
    info = { s, ox, oy };
    const { c, ctx } = hiCanvas(W, H, 'sandbox-canvas');
    // base verde con bottoncini (come una piastra di mattoncini)
    for (let y = 0; y < G; y++)
      for (let x = 0; x < G; x++) {
        const [px, py] = iso(x, y, 0, s, ox, oy);
        drawCube(ctx, px, py, s, B.Grass, { seed: x * 9 + y });
      }
    for (let d = 0; d < G * 2; d++)
      for (let x = 0; x < G; x++) {
        const y = d - x;
        if (y < 0 || y >= G) continue;
        p.sandbox[y * G + x].forEach((b, z) => {
          const [px, py] = iso(x, y, z + 1, s, ox, oy);
          drawCube(ctx, px, py, s, b, { seed: x * 13 + y * 5 + z });
        });
      }
    canvas?.remove();
    canvas = c;
    wrap.append(c);
  };

  const hit = (cx: number, cy: number): number => {
    const { s, ox, oy } = info;
    // dal davanti verso il fondo
    for (let d = G * 2 - 2; d >= 0; d--)
      for (let x = G - 1; x >= 0; x--) {
        const y = d - x;
        if (y < 0 || y >= G) continue;
        const hgt = p.sandbox[y * G + x].length;
        const [tx, ty] = iso(x, y, hgt, s, ox, oy);
        if (Math.abs(cx - tx) / s + Math.abs(cy - (ty + s / 2)) / (s / 2) <= 1) return y * G + x;
      }
    return -1;
  };

  wrap.addEventListener('pointerdown', (e) => {
    const r = wrap.getBoundingClientRect();
    const i = hit(e.clientX - r.left, e.clientY - r.top);
    if (i < 0) return;
    const col = p.sandbox[i];
    if (erase) {
      if (!col.length) return;
      col.pop();
      sfx('mine');
    } else {
      if (col.length >= MAXH) {
        sfx('wrong');
        return;
      }
      col.push(sel);
      sfx('brick');
    }
    persist();
    render();
  });

  const count = () => p.sandbox.reduce((a, c) => a + c.length, 0);
  const counter = h('div', { class: 'pill' }, '🧱 ', h('b', {}, String(count())));
  const updCounter = () => (counter.querySelector('b')!.textContent = String(count()));
  wrap.addEventListener('pointerup', updCounter);

  const pal = h('div', { class: 'block-palette' });
  const drawPal = () =>
    pal.replaceChildren(
      h('button', { class: `pal-block eraser ${erase ? 'sel' : ''}`, onclick: () => ((erase = !erase), sfx('click'), drawPal()) }, h('span', { class: 'eraser-icon' }, '⛏️'), h('small', {}, 'Scava')),
      ...PALETTE.map((b) =>
        h(
          'button',
          {
            class: `pal-block ${!erase && sel === b ? 'sel' : ''}`,
            'aria-label': BLOCKS[b].name,
            onclick: () => {
              sel = b;
              erase = false;
              sfx('click');
              drawPal();
            },
          },
          img(blockIcon(b), 'icon'),
          h('small', {}, BLOCKS[b].name.replace('Mattoncino ', ''))
        )
      )
    );
  drawPal();
  const clearBtn = h('button', { class: 'btn small', onclick: () => confirmBox('Vuoi buttare giù tutto?', () => (p.sandbox = Array.from({ length: G * G }, () => []), persist(), render(), updCounter())) }, '🧹 Pulisci');

  // piccola icona di mattoncino per il titolo
  const { c: ic, ctx: ictx } = hiCanvas(28, 22, 'title-brick');
  drawBrick(ictx, 2, 6, 24, 14, '#43a047', [true, true]);
  root.append(topBar(h('span', {}, ic, ' Il mio Cantiere'), showMap, counter, clearBtn), h('div', { class: 'sandbox-layout' }, wrap, pal));
  later(30, render);
  const onResize = () => render();
  window.addEventListener('resize', onResize);
  onCleanup(() => window.removeEventListener('resize', onResize));
  speak('Questo è il tuo cantiere! Scegli un blocco e tocca la piastra per costruire. Con il piccone puoi scavare.');
}
