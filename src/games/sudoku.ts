import { h, shuffle } from '../core/dom';
import { sfx } from '../core/audio';
import { header, sayOnMount, tracker, actionBtn } from './frame';
import type { Gen } from './types';
import { img, modelIcon } from '../art/icons';
import { dinoById, type DinoId } from '../art/dinos';

const SYMS: DinoId[] = ['trice', 'stego', 'trex', 'ptero'];

export const sudoku: Gen = (level, rng) => {
  const base = [
    [0, 1, 2, 3],
    [2, 3, 0, 1],
    [1, 0, 3, 2],
    [3, 2, 1, 0],
  ];
  const perm = shuffle([0, 1, 2, 3], rng);
  let g = base.map((r) => r.map((v) => perm[v]));
  if (rng.chance(0.5)) [g[0], g[1]] = [g[1], g[0]];
  if (rng.chance(0.5)) [g[2], g[3]] = [g[3], g[2]];
  if (rng.chance(0.5)) g = g.map((r) => [r[1], r[0], r[2], r[3]]);
  if (rng.chance(0.5)) g = g[0].map((_, c) => g.map((r) => r[c]));
  const sol = g.flat();
  const nEmpty = [0, 3, 4, 6, 7, 8][level];
  const empty = new Set(shuffle([...Array(16).keys()], rng).slice(0, nEmpty));
  const say = 'Dino-sudoku! In ogni riga, in ogni colonna e in ogni quadrato da 4 deve esserci un dinosauro di ogni tipo. Tocca le caselle vuote per cambiare dinosauro.';
  return {
    skill: 'sudoku',
    say,
    mount(host, finish, ctx) {
      const val = sol.map((v, i) => (empty.has(i) ? -1 : v));
      const icon = (v: number) => img(modelIcon('sd-' + SYMS[v], dinoById(SYMS[v]).model, 80, 60), 'sd-icon');
      const grid = h('div', { class: 'sudoku' });
      const draw = (bad: Set<number> = new Set()) => {
        grid.replaceChildren(
          ...val.map((v, i) => {
            const fixed = !empty.has(i);
            const el = h('button', { class: `sd-cell ${fixed ? 'fixed' : 'free'} ${bad.has(i) ? 'bad' : ''} r${Math.floor(i / 4)} c${i % 4}` }, v >= 0 ? icon(v) : '');
            if (!fixed)
              el.addEventListener('click', () => {
                if (t.done) return;
                val[i] = val[i] >= 3 ? -1 : val[i] + 1;
                sfx('pop');
                draw();
              });
            return el;
          })
        );
      };
      const hint = h('div', { class: 'q-hint' });
      const t = tracker(hint, finish, ctx, () => {
        sol.forEach((v, i) => (val[i] = v));
        draw();
      });
      draw();
      const legend = h('div', { class: 'sd-legend' }, ...SYMS.map((_, i) => icon(i)));
      const check = () => {
        if (t.done) return;
        if (val.some((v) => v < 0)) {
          hint.textContent = 'Riempi prima tutte le caselle vuote!';
          return;
        }
        const bad = new Set<number>();
        val.forEach((v, i) => v !== sol[i] && bad.add(i));
        if (!bad.size) t.success(grid);
        else {
          draw(bad);
          t.fail('Qualche dinosauro è ripetuto in una riga o colonna. Guarda le caselle rosse!');
        }
      };
      host.append(
        h('div', { class: 'challenge sudoku-ch' }, header('Dino-sudoku 🧩', say, ctx), h('div', { class: 'sd-wrap' }, grid, h('div', { class: 'col' }, h('div', { class: 'label' }, 'Usa:'), legend, actionBtn('✔ Controlla', check))), hint)
      );
      sayOnMount(say, ctx);
    },
  };
};
