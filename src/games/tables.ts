import { h, later, shuffle } from '../core/dom';
import { sfx } from '../core/audio';
import { speak } from '../core/speech';
import { confettiAt, shake } from '../core/fx';
import { header, mc, numChoices, praise, sayOnMount } from './frame';
import type { Gen } from './types';
import { lineView } from './line100';
import { blockIcon, img } from '../art/icons';
import { B } from '../art/blocks';

const SETS = [[2, 10], [5, 3], [4, 6], [7, 8, 9], [2, 3, 4, 5, 6, 7, 8, 9, 10]];
const FLOWERS = [B.Flowers, B.Diamond, B.Gold, B.Emerald, B.Brick, B.BrickBlue, B.BrickYellow];

/** Tabelline: salti sulla linea, schieramenti, tabellina da completare, fattore mancante. */
export const tables: Gen = (level, rng) => {
  const set = SETS[Math.min(5, Math.max(1, level)) - 1];
  const n = rng.pick(set);
  const k = rng.int(level === 1 ? 1 : 2, 10);
  const prod = n * k;
  const variants = level === 5 ? ['jumps', 'array', 'fill', 'missing'] : ['jumps', 'array', 'fill'];
  const v = rng.pick(variants);

  if (v === 'jumps') {
    const hi = Math.max(20, Math.ceil(prod / 10) * 10);
    return mc({
      skill: 'tables',
      text: `Il dino fa ${k} ${k === 1 ? 'salto' : 'salti'} da ${n}. Dove arriva? ${k} × ${n} = ?`,
      say: `Il dino parte da zero e fa ${k} salti da ${n}. Dove arriva? ${k} per ${n}?`,
      visual: () => {
        const lv = lineView(0, hi, { start: 0 });
        for (let i = 1; i < k; i++) lv.mark(n * i, 'hop');
        (lv.el as HTMLElement & { _lv?: typeof lv })._lv = lv;
        return lv.el;
      },
      choices: numChoices(prod, rng, 4, n, 1),
      answer: String(prod),
      hint: `Conta di ${n} in ${n}: ${Array.from({ length: Math.min(k, 4) }, (_, i) => (i + 1) * n).join(', ')}...`,
      explain: `${k} × ${n} = ${prod}`,
      onCorrect: (el) => {
        const lv = (el as HTMLElement & { _lv?: ReturnType<typeof lineView> })?._lv;
        lv?.walk(Array.from({ length: k }, (_, i) => (i + 1) * n), 160);
      },
    });
  }

  if (v === 'array') {
    const blk = rng.pick(FLOWERS);
    return mc({
      skill: 'tables',
      text: `${k} file da ${n}: ${k} × ${n} = ?`,
      say: `Nel giardino ci sono ${k} file da ${n}. Quanti sono in tutto? ${k} per ${n}?`,
      visual: () => {
        const g = h('div', { class: 'array-grid', style: `--cols:${n}` });
        for (let i = 0; i < prod; i++) g.append(img(blockIcon(blk), prod > 40 ? 'icon xs' : 'icon sm'));
        return g;
      },
      choices: numChoices(prod, rng, 4, n, 1),
      answer: String(prod),
      hint: `Conta una fila alla volta: ${n}, ${2 * n}, ${3 * n}...`,
      explain: `${k} × ${n} = ${prod}`,
    });
  }

  if (v === 'missing') {
    return mc({
      skill: 'tables',
      text: `Quale numero manca?  ? × ${n} = ${prod}`,
      say: `Quante volte ${n} fa ${prod}?`,
      visual: () =>
        h(
          'div',
          { class: 'expr' },
          h('span', { class: 'num-tile ask' }, '?'),
          h('span', { class: 'op' }, '×'),
          h('span', { class: 'num-tile' }, String(n)),
          h('span', { class: 'op' }, '='),
          h('span', { class: 'num-tile' }, String(prod))
        ),
      choices: numChoices(k, rng, 4, 2, 1),
      answer: String(k),
      hint: `Ripeti la tabellina del ${n} finché arrivi a ${prod}.`,
      explain: `${k} × ${n} = ${prod}`,
    });
  }

  // completa la tabellina
  const nMissing = [0, 3, 3, 4, 4, 5][level];
  const missing = new Set(shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10], rng).slice(0, nMissing));
  const say = `Completa la tabellina del ${n}! Tocca un mattoncino vuoto e scrivi il numero.`;
  return {
    skill: 'tables',
    say,
    mount(host, finish, ctx) {
      let sel = -1;
      let typed = '';
      let mistakes = 0;
      let done = false;
      const hint = h('div', { class: 'q-hint' });
      const slots: HTMLElement[] = [];
      const row = h('div', { class: 'tab-row' });
      for (let i = 1; i <= 10; i++) {
        const isMissing = missing.has(i);
        const s = h('button', { class: `tab-slot ${isMissing ? 'empty' : ''}`, onclick: () => pick(i) }, isMissing ? '?' : String(n * i));
        slots[i] = s;
        row.append(h('div', { class: 'tab-cell' }, s, h('small', {}, `×${i}`)));
      }
      const keypad = h('div', { class: 'keypad' }, ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => h('button', { class: `key k${d}`, onclick: () => press(d) }, String(d))));
      host.append(h('div', { class: 'challenge tables-ch' }, header(`Completa la tabellina del ${n} ✖️`, say, ctx), row, keypad, hint));
      sayOnMount(say, ctx);
      const firstMissing = () => [...missing].sort((x, y) => x - y)[0];
      pick(firstMissing());

      function pick(i: number) {
        if (done || !missing.has(i)) return;
        if (sel > 0 && missing.has(sel)) {
          slots[sel].classList.remove('sel');
          slots[sel].textContent = '?';
        }
        sel = i;
        typed = '';
        slots[i].classList.add('sel');
        sfx('click');
      }

      function press(d: number) {
        if (done || sel < 0) return;
        const ans = String(n * sel);
        typed += String(d);
        slots[sel].textContent = typed;
        sfx('pop');
        if (typed.length < ans.length) return;
        if (typed === ans) {
          missing.delete(sel);
          slots[sel].classList.remove('sel', 'empty');
          slots[sel].classList.add('ok');
          if (!missing.size) {
            done = true;
            sfx('correct');
            confettiAt(row, 30);
            hint.textContent = praise();
            if (!ctx?.compact) speak(`${hint.textContent} La tabellina del ${n} è completa!`);
            later(1500, () => finish(mistakes === 0 ? 'first' : mistakes <= 2 ? 'second' : 'fail'));
          } else pick(firstMissing());
        } else {
          mistakes++;
          sfx('wrong');
          shake(slots[sel]);
          const msg = mistakes === 1 ? `Guarda il numero prima e aggiungi ${n}!` : `${sel} × ${n} = ${ans}`;
          hint.textContent = msg;
          speak(msg);
          typed = '';
          slots[sel].textContent = '?';
          if (mistakes >= 4) {
            done = true;
            hint.textContent = 'Ecco la tabellina completa. La prossima volta andrà meglio!';
            missing.forEach((i) => {
              slots[i].textContent = String(n * i);
              slots[i].classList.add('ok');
            });
            later(3200, () => finish('fail'));
          }
        }
      }
    },
  };
};
