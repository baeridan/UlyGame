import { h, later } from '../core/dom';
import { sfx } from '../core/audio';
import { header, sayOnMount, tracker, actionBtn } from './frame';
import type { Gen } from './types';
import { blockIcon, img } from '../art/icons';
import { B } from '../art/blocks';
import type { Rng } from '../core/rng';

const MATS = [
  { id: 'legno', b: B.Wood },
  { id: 'pietra', b: B.Stone },
  { id: 'diamante', b: B.Diamond },
  { id: 'carbone', b: B.Coal },
  { id: 'ferro', b: B.Iron },
  { id: 'oro', b: B.Gold },
] as const;
type Mat = (typeof MATS)[number]['id'];

const RECIPES: { name: string; emoji: string; need: Partial<Record<Mat, number>> }[] = [
  { name: 'un piccone di diamante', emoji: '⛏️', need: { diamante: 3, legno: 2 } },
  { name: 'due torce', emoji: '🔥', need: { carbone: 2, legno: 2 } },
  { name: 'una spada', emoji: '🗡️', need: { ferro: 2, legno: 1 } },
  { name: 'una casetta', emoji: '🏠', need: { legno: 4, pietra: 3 } },
  { name: 'un ponte', emoji: '🌉', need: { legno: 5, pietra: 2 } },
  { name: 'una corona', emoji: '👑', need: { oro: 4, diamante: 1 } },
  { name: 'una lanterna', emoji: '🏮', need: { ferro: 3, carbone: 1 } },
  { name: 'un carrello da miniera', emoji: '🛒', need: { ferro: 5, legno: 2 } },
  { name: 'una barca', emoji: '🛶', need: { legno: 6 } },
  { name: 'una fornace', emoji: '🧱', need: { pietra: 8 } },
];

function clue(n: number, level: number, rng: Rng, prev?: number): string {
  if (level <= 2) return String(n);
  if (level === 3) {
    const a = rng.int(0, n - 1) || 1;
    return n - a > 0 ? `${a} + ${n - a}` : String(n);
  }
  if (level === 4) {
    if (n % 2 === 0 && rng.chance(0.5)) return `il doppio di ${n / 2}`;
    const b = rng.int(1, 4);
    return `${n + b} - ${b}`;
  }
  if (prev !== undefined && prev !== n) return prev < n ? `${n - prev} in più del primo` : `${prev - n} in meno del primo`;
  if (n % 2 === 0) return `la metà di ${n * 2}`;
  return `${n + 2} - 2`;
}

export const crafting: Gen = (level, rng) => {
  const pool = level <= 2 ? RECIPES.filter((r) => Object.values(r.need).reduce((a, b) => a + b!, 0) <= 7) : RECIPES;
  const rec = rng.pick(pool);
  const entries = Object.entries(rec.need) as [Mat, number][];
  const clues = entries.map(([, n], i) => clue(n, level, rng, i > 0 ? entries[0][1] : undefined));
  const say = `Banco da lavoro! Per fare ${rec.name} servono: ${entries.map(([m], i) => `${clues[i]} ${m}`).join(' e ')}. Metti i materiali giusti sul banco e premi Crea.`;
  return {
    skill: 'crafting',
    say,
    mount(host, finish, ctx) {
      const slots: (Mat | null)[] = Array(9).fill(null);
      const table = h('div', { class: 'craft-table' });
      const draw = () =>
        table.replaceChildren(
          ...slots.map((m, i) =>
            h(
              'button',
              {
                class: `craft-slot ${m ? 'full' : ''}`,
                onclick: () => {
                  if (t.done || !slots[i]) return;
                  slots[i] = null;
                  sfx('pop');
                  draw();
                },
              },
              m ? img(blockIcon(MATS.find((x) => x.id === m)!.b), 'icon') : ''
            )
          )
        );
      const hint = h('div', { class: 'q-hint' });
      const result = h('div', { class: 'craft-result' }, '❔');
      const t = tracker(hint, finish, ctx, () => {
        slots.fill(null);
        let k = 0;
        for (const [m, n] of entries) for (let i = 0; i < n; i++) slots[k++] = m;
        draw();
        later(600, () => {
          result.textContent = rec.emoji;
          result.classList.add('made');
        });
      });
      draw();
      const inv = h(
        'div',
        { class: 'inventory' },
        ...MATS.map((m) =>
          h(
            'button',
            {
              class: 'inv-btn',
              'aria-label': m.id,
              onclick: () => {
                if (t.done) return;
                const i = slots.indexOf(null);
                if (i < 0) {
                  hint.textContent = 'Il banco è pieno! Tocca un materiale sul banco per toglierlo.';
                  return;
                }
                slots[i] = m.id;
                sfx('brick');
                draw();
              },
            },
            img(blockIcon(m.b), 'icon'),
            h('span', {}, m.id)
          )
        )
      );
      const card = h(
        'div',
        { class: 'recipe' },
        h('div', { class: 'recipe-title' }, rec.emoji, ' ', rec.name),
        ...entries.map(([m, n], i) =>
          h(
            'div',
            { class: 'recipe-row' },
            img(blockIcon(MATS.find((x) => x.id === m)!.b), 'icon sm'),
            level === 1 ? h('span', { class: 'recipe-dots' }, ...Array.from({ length: n }, () => img(blockIcon(MATS.find((x) => x.id === m)!.b), 'icon xs'))) : h('b', {}, clues[i]),
            h('span', {}, ` ${m}`)
          )
        )
      );
      const craft = () => {
        if (t.done) return;
        const counts: Record<string, number> = {};
        slots.forEach((m) => m && (counts[m] = (counts[m] || 0) + 1));
        const wrong = MATS.map((m) => m.id).find((m) => (counts[m] || 0) !== ((rec.need as Record<string, number>)[m] || 0));
        if (!wrong) {
          sfx('craft');
          result.textContent = rec.emoji;
          result.classList.add('made');
          t.success(result);
        } else {
          const need = (rec.need as Record<string, number>)[wrong] || 0;
          const have = counts[wrong] || 0;
          t.fail(need === 0 ? `Il ${wrong} non serve per questa ricetta!` : have < need ? `Manca ancora un po' di ${wrong}!` : `C'è troppo ${wrong}!`);
        }
      };
      host.append(
        h(
          'div',
          { class: 'challenge craft-ch' },
          header('Banco da lavoro 🛠️', say, ctx),
          h('div', { class: 'craft-wrap' }, card, table, h('div', { class: 'col center' }, h('div', { class: 'arrow-big' }, '➜'), result)),
          inv,
          actionBtn('🛠️ Crea!', craft),
          hint
        )
      );
      sayOnMount(say, ctx);
    },
  };
};
