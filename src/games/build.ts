import { h } from '../core/dom';
import { sfx } from '../core/audio';
import { header, sayOnMount, tracker, actionBtn, cbSym } from './frame';
import type { Gen } from './types';
import { BRICK } from '../art/color';
import { shuffle } from '../core/dom';

export const build: Gen = (level, rng) => {
  const n = level <= 2 ? 3 : 4;
  const k = level === 1 ? 2 : level <= 3 ? 3 : 4;
  const mirror = level === 5;
  const palette = shuffle([0, 1, 2, 3, 4, 5], rng).slice(0, k);
  const target = Array.from({ length: n * n }, () => rng.pick(palette));
  // garantisce che ci siano almeno 2 colori
  if (new Set(target).size < 2) target[0] = palette[(palette.indexOf(target[0]) + 1) % k];
  const expected = mirror ? target.map((_, i) => target[Math.floor(i / n) * n + (n - 1 - (i % n))]) : target;
  const say = mirror
    ? 'Costruisci il modello allo specchio! Quello che è a destra va a sinistra.'
    : 'Copia il modello! Scegli un colore e tocca le caselle.';
  return {
    skill: 'build',
    say,
    mount(host, finish, ctx) {
      const player: number[] = Array(n * n).fill(-1);
      let sel = palette[0];
      const cellEl = (c: number, extra = '') =>
        h('div', { class: `stud-cell ${extra}`, style: c >= 0 ? `--c:${BRICK[c].hex}` : '' }, c >= 0 ? cbSym(BRICK[c].sym) : null);
      const tgt = h('div', { class: `stud-grid target ${mirror ? 'mirror' : ''}`, style: `--n:${n}` }, ...target.map((c) => cellEl(c)));
      const mine = h('div', { class: 'stud-grid mine', style: `--n:${n}` });
      const draw = (bad: Set<number> = new Set()) => {
        mine.replaceChildren(
          ...player.map((c, i) => {
            const el = cellEl(c, `${c < 0 ? 'empty' : ''} ${bad.has(i) ? 'bad' : ''}`);
            el.addEventListener('click', () => {
              if (t.done) return;
              player[i] = player[i] === sel ? -1 : sel;
              sfx('brick');
              draw();
            });
            return el;
          })
        );
      };
      const pal = h('div', { class: 'palette' });
      const drawPal = () =>
        pal.replaceChildren(
          ...palette.map((c) =>
            h(
              'button',
              {
                class: `pal-btn ${c === sel ? 'sel' : ''}`,
                style: `--c:${BRICK[c].hex}`,
                'aria-label': BRICK[c].id,
                onclick: () => {
                  sel = c;
                  sfx('click');
                  drawPal();
                },
              },
              cbSym(BRICK[c].sym)
            )
          )
        );
      drawPal();
      const hint = h('div', { class: 'q-hint' });
      const t = tracker(hint, finish, ctx, () => {
        expected.forEach((c, i) => (player[i] = c));
        draw();
      });
      draw();
      const check = () => {
        if (t.done) return;
        const bad = new Set<number>();
        player.forEach((c, i) => c !== expected[i] && bad.add(i));
        if (!bad.size) t.success(mine);
        else {
          draw(bad);
          t.fail(`Ci sono ${bad.size} ${bad.size === 1 ? 'casella sbagliata' : 'caselle sbagliate'}: le ho segnate!`);
        }
      };
      host.append(
        h(
          'div',
          { class: 'challenge build-ch' },
          header(mirror ? 'Costruiscilo allo SPECCHIO! 🪞' : 'Copia il modello! 🧱', say, ctx),
          h(
            'div',
            { class: 'build-wrap' },
            h('div', { class: 'col' }, h('div', { class: 'label' }, 'Modello'), tgt),
            mirror ? h('div', { class: 'mirror-line' }) : h('div', { class: 'arrow-big' }, '➜'),
            h('div', { class: 'col' }, h('div', { class: 'label' }, 'Il tuo'), mine)
          ),
          pal,
          actionBtn('✔ Controlla', check),
          hint
        )
      );
      sayOnMount(say, ctx);
    },
  };
};
