import { h, later, shuffle } from '../core/dom';
import { sfx } from '../core/audio';
import { speak } from '../core/speech';
import { confettiAt, floatText, shake } from '../core/fx';
import { header, praise, sayOnMount } from './frame';
import type { Gen } from './types';
import { blockIcon, img } from '../art/icons';
import { B } from '../art/blocks';
import { current, persist } from '../core/store';

interface Cell {
  label: string;
  value: string; // valore per la voce
  good: boolean;
}

export const mining: Gen = (level, rng) => {
  const total = level === 1 ? 9 : 12;
  const nGood = level === 4 ? 4 : 3;
  let title: string;
  let say: string;
  const cells: Cell[] = [];
  const dots = (n: number) => '●'.repeat(n);
  if (level === 1) {
    const T = rng.int(2, 6);
    title = `Scava i blocchi con ${T} puntini ⛏️`;
    say = `Scava i blocchi che hanno ${T} puntini!`;
    for (let i = 0; i < nGood; i++) cells.push({ label: dots(T), value: `${T} puntini`, good: true });
    while (cells.length < total) {
      const v = Math.max(1, T + rng.pick([-2, -1, 1, 2]));
      cells.push({ label: dots(v), value: `${v} puntini`, good: v === T });
    }
  } else if (level === 4) {
    const even = rng.chance(0.5);
    title = `Scava i numeri ${even ? 'PARI' : 'DISPARI'} ⛏️`;
    say = `Scava i blocchi con i numeri ${even ? 'pari' : 'dispari'}!`;
    const used = new Set<number>();
    while (cells.length < total) {
      const goodNeeded = cells.filter((c) => c.good).length < nGood;
      let v = rng.int(1, 40);
      while (used.has(v) || ((v % 2 === 0) === even) !== goodNeeded) v = rng.int(1, 40);
      used.add(v);
      cells.push({ label: String(v), value: String(v), good: (v % 2 === 0) === even });
    }
  } else {
    const T = level === 2 ? rng.int(6, 10) : level === 3 ? rng.int(11, 20) : rng.pick([10, 20, 30, 40, 50, 60]);
    title = `Scava i blocchi che fanno ${T} ⛏️`;
    say = `Scava solo i blocchi che fanno ${T}!`;
    const expr = (v: number, allowMinus: boolean): string => {
      if (level === 5) {
        if (v % 10 === 0 && rng.chance(0.4) && v <= 50) {
          const a = rng.pick([2, 5, 10].filter((d) => v % d === 0 && v / d <= 10));
          if (a) return `${v / a} × ${a}`;
        }
        if (v % 10 === 0 && v >= 20) {
          const a = rng.int(1, v / 10 - 1) * 10;
          const k = 10 * rng.int(1, 3);
          return rng.chance(0.5) || !allowMinus ? `${a} + ${v - a}` : `${v + k} - ${k}`;
        }
        const a = rng.int(1, v - 1);
        return `${a} + ${v - a}`;
      }
      if (allowMinus && rng.chance(0.4)) {
        const b = rng.int(1, 9);
        return `${v + b} - ${b}`;
      }
      const a = rng.int(Math.max(0, v - 9), v);
      return `${a} + ${v - a}`;
    };
    const used = new Set<string>();
    for (let i = 0; i < nGood; i++) {
      let e = expr(T, level >= 3);
      for (let k = 0; k < 20 && used.has(e); k++) e = expr(T, level >= 3);
      used.add(e);
      cells.push({ label: e, value: e, good: true });
    }
    while (cells.length < total) {
      const off = level === 5 ? rng.pick([-10, 10, -1, 1, 5]) : rng.pick([-2, -1, 1, 2, 3]);
      const v = Math.max(1, T + off);
      if (v === T) continue;
      let e = expr(v, level >= 3);
      if (used.has(e)) continue;
      used.add(e);
      cells.push({ label: e, value: e, good: false });
    }
  }
  const order = shuffle(cells, rng);
  const ores = [B.Diamond, B.Gold, B.Emerald];
  return {
    skill: 'mining',
    say,
    mount(host, finish, ctx) {
      let mistakes = 0;
      let left = nGood;
      let done = false;
      const hint = h('div', { class: 'q-hint' });
      const grid = h('div', { class: `mine-grid n${total}` });
      order.forEach((c) => {
        const b = h('button', { class: 'mine-block' }, img(blockIcon(B.Stone, 96), 'mine-img'), h('span', { class: 'mine-label' }, c.label)) as HTMLButtonElement;
        b.addEventListener('click', () => {
          if (done || b.classList.contains('mined')) return;
          if (c.good) {
            b.classList.add('mined');
            sfx('mine');
            const ore = rng.pick(ores);
            b.replaceChildren(img(blockIcon(ore, 96), 'mine-img pop-in'), h('span', { class: 'mine-label done' }, c.label));
            floatText('+1 💎', b);
            const p = current();
            if (p) {
              p.ores++;
              persist();
            }
            left--;
            if (left === 0) {
              done = true;
              sfx('correct');
              confettiAt(grid, 30);
              hint.textContent = praise() + ' Miniera svuotata!';
              if (!ctx?.compact) speak(hint.textContent);
              later(1400, () => finish(mistakes === 0 ? 'first' : mistakes <= 2 ? 'second' : 'fail'));
            }
          } else {
            mistakes++;
            sfx('wrong');
            shake(b);
            b.classList.add('hard');
            hint.textContent = `Questo è troppo duro! ${level === 1 || level === 4 ? '' : 'Prova a fare il conto: ' + c.label}`;
            speak(level === 1 ? `Questo ha ${c.value}.` : 'Questo blocco non va bene. Controlla il conto!');
            later(700, () => b.classList.remove('hard'));
          }
        });
        grid.append(b);
      });
      host.append(h('div', { class: 'challenge mining-ch' }, header(title, say, ctx), grid, hint));
      sayOnMount(say, ctx);
    },
  };
};
