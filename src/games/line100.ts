import { h, later } from '../core/dom';
import { sfx } from '../core/audio';
import { shake } from '../core/fx';
import { header, sayOnMount, tracker, mc, numChoices } from './frame';
import type { Gen } from './types';
import { img, modelIcon } from '../art/icons';
import { dinoById } from '../art/dinos';

/**
 * La "linea del 100": numeri in fila a gruppi di 5 (5 rossi e 5 blu),
 * con una torretta ogni 10. Il dinosauro salta sopra i mattoncini.
 */
export interface LineView {
  el: HTMLElement;
  placeDino(n: number): void;
  mark(n: number, cls: string): void;
  unmark(cls: string): void;
  walk(path: number[], stepMs: number, done?: () => void): void;
}

export function lineView(lo: number, hi: number, o: { showAll?: boolean; onTap?: (n: number, el: HTMLElement) => void; start?: number } = {}): LineView {
  const count = hi - lo + 1;
  const wrap = h('div', { class: `line100 ${count > 50 ? 'rows' : ''} ${o.onTap ? 'tappable' : ''}`, style: `--n:${count}` });
  const cells = new Map<number, HTMLElement>();
  for (let n = lo; n <= hi; n++) {
    const inDec = n === 0 ? 0 : ((n - 1) % 10) + 1;
    const show = o.showAll || n % 5 === 0 || n === lo;
    const c = h(
      'button',
      {
        class: `l100-cell ${n === 0 ? 'zero' : inDec <= 5 ? 'red' : 'blue'} ${n % 10 === 0 && n > 0 ? 'dec' : ''}`,
        'aria-label': String(n),
        tabindex: o.onTap ? '0' : '-1',
      },
      h('span', { class: `l100-num ${show ? '' : 'hide'} ${n % 10 === 0 ? 'big' : ''}` }, String(n))
    );
    if (o.onTap) c.addEventListener('click', () => o.onTap!(n, c));
    cells.set(n, c);
    wrap.append(c);
  }
  const dino = img(modelIcon('line-raptor', dinoById('raptor').model, 64, 48), 'l100-dino');
  const placeDino = (n: number) => {
    const c = cells.get(n);
    if (!c) return;
    c.append(dino);
    dino.animate([{ transform: 'translate(-50%, 0)' }, { transform: 'translate(-50%, -14px)' }, { transform: 'translate(-50%, 0)' }], { duration: 260 });
  };
  if (o.start !== undefined) placeDino(o.start);
  return {
    el: h('div', { class: 'line100-wrap' }, wrap),
    placeDino,
    mark(n, cls) {
      cells.get(n)?.classList.add(cls);
    },
    unmark(cls) {
      cells.forEach((c) => c.classList.remove(cls));
    },
    walk(path, stepMs, done) {
      let i = 0;
      const step = () => {
        if (i >= path.length) return done?.();
        placeDino(path[i]);
        cells.get(path[i])?.classList.add('trail');
        sfx('step');
        i++;
        later(stepMs, step);
      };
      step();
    },
  };
}

/** Finestra della linea allineata alle decine che contiene a e b. */
export function lineWindow(a: number, b: number, min = 20) {
  const mn = Math.min(a, b);
  const mx = Math.max(a, b);
  let lo = Math.max(1, Math.floor((Math.max(1, mn) - 1) / 10) * 10 + 1);
  let hi = Math.min(100, Math.max(10, Math.ceil(mx / 10) * 10));
  while (hi - lo + 1 < min) {
    if (hi + 10 <= 100) hi += 10;
    else if (lo - 10 >= 1) lo -= 10;
    else break;
  }
  return { lo, hi };
}

/** Percorso: prima salti da 10, poi passi da 1 (avanti o indietro). */
function pathFor(a: number, b: number, tensFirst: boolean) {
  const path: number[] = [];
  const dir = b >= a ? 1 : -1;
  let cur = a;
  if (tensFirst)
    while (Math.abs(b - cur) >= 10) {
      cur += 10 * dir;
      path.push(cur);
    }
  while (cur !== b) {
    cur += dir;
    path.push(cur);
  }
  return path;
}

export const line100: Gen = (level, rng) => {
  if (level === 5) {
    if (rng.chance(0.5)) {
      const a = rng.int(55, 95);
      const ans = 100 - a;
      return mc({
        skill: 'line100',
        text: `Il dino è sul ${a}. Quanti passi mancano per arrivare a 100?`,
        visual: () => {
          const v = lineView(51, 100, { start: a });
          v.mark(100, 'goal');
          return v.el;
        },
        choices: numChoices(ans, rng, 4, 10, 1),
        answer: String(ans),
        hint: `Prima arriva alla torretta del ${Math.ceil(a / 10) * 10}, poi salta di 10 in 10 fino a 100.`,
        explain: `${a} + ${ans} = 100`,
      });
    }
    const a = rng.int(5, 60);
    const b = a + rng.int(11, 38);
    const { lo, hi } = lineWindow(a, b);
    const ans = b - a;
    return mc({
      skill: 'line100',
      text: `Quanti passi ci sono dal ${a} al ${b}?`,
      visual: () => {
        const v = lineView(lo, hi, { start: a });
        v.mark(b, 'goal');
        return v.el;
      },
      choices: numChoices(ans, rng, 4, 10, 1),
      answer: String(ans),
      hint: 'Conta i salti da 10 e poi i passi da 1.',
      explain: `${b} − ${a} = ${ans}`,
    });
  }

  let a: number, target: number, text: string, say: string, hint: string, tensFirst = false;
  let lo: number, hi: number;
  if (level === 1) {
    const d = rng.int(0, 7) * 10;
    lo = d + 1;
    hi = d + 30;
    target = rng.int(lo + 1, hi - 1);
    while (target % 5 === 0) target = rng.int(lo + 1, hi - 1);
    a = lo;
    text = `Porta il dino sul numero ${target}!`;
    say = `Tocca il numero ${target} sulla linea. Usa le torrette del 5 e del 10 per orientarti.`;
    hint = `Cerca la torretta più vicina e conta i mattoncini rossi e blu.`;
  } else if (level === 2) {
    a = rng.int(3, 90);
    const steps = rng.int(2, 9);
    const fwd = a + steps <= 100 && (a - steps < 1 || rng.chance(0.6));
    target = fwd ? a + steps : a - steps;
    ({ lo, hi } = lineWindow(a, target));
    text = `Il dino è sul ${a}. Fa ${steps} passi ${fwd ? 'avanti' : 'indietro'}. Dove arriva?`;
    say = `Il dino è sul ${a} e fa ${steps} passi ${fwd ? 'in avanti' : 'all indietro'}. Tocca dove arriva!`;
    hint = `Conta i passi uno alla volta: ${fwd ? a + 1 : a - 1}, ${fwd ? a + 2 : a - 2}...`;
  } else if (level === 3) {
    const k = rng.int(1, 4);
    const fwd = rng.chance(0.6);
    a = fwd ? rng.int(1, 100 - 10 * k) : rng.int(10 * k + 1, 100);
    target = fwd ? a + 10 * k : a - 10 * k;
    tensFirst = true;
    ({ lo, hi } = lineWindow(a, target));
    text = `Il dino è sul ${a}. Fa ${k} ${k === 1 ? 'salto' : 'salti'} da 10 ${fwd ? 'avanti' : 'indietro'}. Dove arriva?`;
    say = text;
    hint = 'Un salto da 10 ti porta sullo stesso posto della decina dopo: cambiano solo le decine!';
  } else {
    const fwd = rng.chance(0.6);
    const b = rng.int(11, 39);
    a = fwd ? rng.int(1, 100 - b) : rng.int(b + 1, 100);
    target = fwd ? a + b : a - b;
    tensFirst = true;
    ({ lo, hi } = lineWindow(a, target));
    text = `${a} ${fwd ? '+' : '−'} ${b}: dove arriva il dino?`;
    say = `${a} ${fwd ? 'più' : 'meno'} ${b}. Prima i salti da dieci, poi i passi da uno. Tocca dove arriva il dino!`;
    hint = `Prima ${Math.floor(b / 10)} salti da 10, poi ${b % 10} passi da 1.`;
  }

  return {
    skill: 'line100',
    say,
    mount(host, finish, ctx) {
      const hintEl = h('div', { class: 'q-hint' });
      let busy = false;
      const t = tracker(hintEl, finish, ctx, () => {
        busy = true;
        if (level === 1) v.placeDino(target);
        else v.walk(pathFor(a, target, tensFirst), 260);
        v.mark(target, 'goal');
      });
      const v = lineView(lo, hi, {
        start: level === 1 ? undefined : a,
        showAll: level <= 2,
        onTap: (n, el) => {
          if (busy || t.done) return;
          if (n === target) {
            busy = true;
            el.classList.add('right');
            if (level === 1) {
              v.placeDino(n);
              t.success(el);
            } else v.walk(pathFor(a, target, tensFirst), level >= 3 ? 320 : 220, () => t.success(el));
          } else {
            shake(el);
            el.classList.add('wrong');
            later(700, () => el.classList.remove('wrong'));
            t.fail(hint);
          }
        },
      });
      host.append(h('div', { class: 'challenge line-ch' }, header(text, say, ctx), v.el, h('div', { class: 'l100-legend' }, '🟥 5 rossi · 🟦 5 blu · torretta ogni 10'), hintEl));
      sayOnMount(say, ctx);
    },
  };
};
