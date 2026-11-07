import { h, later } from '../core/dom';
import { sfx } from '../core/audio';
import { shake } from '../core/fx';
import { header, sayOnMount, tracker, actionBtn } from './frame';
import type { Gen } from './types';
import { blockIcon, eggIcon, img, modelIcon } from '../art/icons';
import { B } from '../art/blocks';
import { dinoById } from '../art/dinos';

type Dir = 'U' | 'D' | 'L' | 'R';
const DV: Record<Dir, [number, number]> = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
const ARROW: Record<Dir, string> = { U: '⬆️', D: '⬇️', L: '⬅️', R: '➡️' };

function bfs(n: number, walls: Set<number>, s: number, g: number): Dir[] | null {
  const prev = new Map<number, [number, Dir]>();
  const q = [s];
  const seen = new Set([s]);
  while (q.length) {
    const c = q.shift()!;
    if (c === g) break;
    const x = c % n;
    const y = Math.floor(c / n);
    for (const d of ['R', 'D', 'L', 'U'] as Dir[]) {
      const nx = x + DV[d][0];
      const ny = y + DV[d][1];
      if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
      const k = ny * n + nx;
      if (walls.has(k) || seen.has(k)) continue;
      seen.add(k);
      prev.set(k, [c, d]);
      q.push(k);
    }
  }
  if (!seen.has(g)) return null;
  const path: Dir[] = [];
  let c = g;
  while (c !== s) {
    const [p, d] = prev.get(c)!;
    path.unshift(d);
    c = p;
  }
  return path;
}

export const maze: Gen = (level, rng) => {
  const n = level <= 2 ? 4 : 5;
  const nWalls = [0, 1, 2, 4, 6, 7][level];
  const minLen = [0, 2, 3, 4, 5, 6][level];
  let walls = new Set<number>();
  let start = 0;
  let goal = 0;
  let path: Dir[] | null = null;
  for (let tries = 0; tries < 500; tries++) {
    walls = new Set();
    start = rng.int(0, n * n - 1);
    goal = rng.int(0, n * n - 1);
    while (walls.size < nWalls) {
      const w = rng.int(0, n * n - 1);
      if (w !== start && w !== goal) walls.add(w);
    }
    path = bfs(n, walls, start, goal);
    if (path && path.length >= minLen && path.length <= 9) break;
  }
  const best = path!;
  const maxLen = Math.min(12, best.length + 4);
  const say = "Aiuta il dinosauro a raggiungere l'uovo! Metti le frecce in fila e premi Via. Attento alla lava!";
  return {
    skill: 'maze',
    say,
    mount(host, finish, ctx) {
      const prog: Dir[] = [];
      const grid = h('div', { class: 'maze', style: `--n:${n}` });
      for (let i = 0; i < n * n; i++) {
        const cell = h('div', { class: 'maze-cell' }, img(blockIcon(walls.has(i) ? B.Lava : (i + Math.floor(i / n)) % 2 ? B.Grass : B.Flowers), 'tile-img'));
        if (i === goal) cell.append(img(eggIcon('#b3e5fc'), 'maze-egg'));
        grid.append(cell);
      }
      const dino = img(modelIcon('raptor-maze', dinoById('raptor').model, 80, 60), 'maze-dino');
      grid.append(dino);
      let pos = start;
      const place = (p: number) => {
        dino.style.setProperty('--x', String(p % n));
        dino.style.setProperty('--y', String(Math.floor(p / n)));
      };
      place(start);
      const progBar = h('div', { class: 'program' });
      const renderProg = () => {
        progBar.replaceChildren(
          ...Array.from({ length: maxLen }, (_, i) => h('span', { class: `slot ${prog[i] ? 'full' : ''}` }, prog[i] ? ARROW[prog[i]] : ''))
        );
      };
      renderProg();
      let running = false;
      const add = (d: Dir) => {
        if (running || t.done || prog.length >= maxLen) return;
        prog.push(d);
        sfx('click');
        renderProg();
      };
      const hint = h('div', { class: 'q-hint' });
      const t = tracker(hint, finish, ctx, () => {
        prog.splice(0, prog.length, ...best);
        renderProg();
        run(true);
      });
      const run = (demo = false) => {
        if (running || (!demo && t.done)) return;
        if (!prog.length) {
          hint.textContent = 'Prima metti qualche freccia!';
          return;
        }
        running = true;
        pos = start;
        place(pos);
        let i = 0;
        const step = () => {
          if (i >= prog.length) {
            running = false;
            if (pos === goal) {
              if (!demo) t.success(grid);
            } else if (!demo) {
              t.fail("Non sei arrivato all'uovo. Conta bene i passi!");
              later(600, () => place((pos = start)));
            }
            return;
          }
          const d = prog[i];
          const progSlots = progBar.children;
          [...progSlots].forEach((s, k) => s.classList.toggle('active', k === i));
          const x = (pos % n) + DV[d][0];
          const y = Math.floor(pos / n) + DV[d][1];
          if (x < 0 || y < 0 || x >= n || y >= n || walls.has(y * n + x)) {
            running = false;
            shake(grid);
            if (!demo) {
              t.fail(x < 0 || y < 0 || x >= n || y >= n ? 'Ops! Sei uscito dalla mappa.' : 'Ops! Quella è lava, cambia strada!');
              later(600, () => place((pos = start)));
            }
            return;
          }
          pos = y * n + x;
          place(pos);
          sfx('step');
          i++;
          if (pos === goal) {
            running = false;
            [...progSlots].forEach((s) => s.classList.remove('active'));
            if (!demo) t.success(grid);
            return;
          }
          later(480, step);
        };
        later(200, step);
      };
      const pad = h(
        'div',
        { class: 'arrow-pad' },
        ...(['L', 'U', 'D', 'R'] as Dir[]).map((d) => h('button', { class: 'btn arrow', onclick: () => add(d), 'aria-label': d }, ARROW[d])),
        h('button', {
          class: 'btn undo',
          onclick: () => {
            if (running || t.done) return;
            prog.pop();
            renderProg();
          },
        }, '⌫'),
        actionBtn('▶ Via!', () => run())
      );
      host.append(h('div', { class: 'challenge maze-ch' }, header("Porta il dino all'uovo! 🥚", say, ctx), h('div', { class: 'maze-wrap' }, grid, h('div', { class: 'maze-side' }, progBar, pad)), hint));
      sayOnMount(say, ctx);
    },
  };
};
