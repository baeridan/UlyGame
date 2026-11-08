import { h, later } from '../core/dom';
import { sfx } from '../core/audio';
import { speak } from '../core/speech';
import { confettiAt, shake } from '../core/fx';
import { header, praise, sayOnMount } from './frame';
import type { Gen, Result, SkillId } from './types';
import type { Rng } from '../core/rng';

/**
 * Addizioni e sottrazioni in colonna, passo dopo passo:
 * si parte dalle unità, si porta il riporto o si chiede il prestito alla decina.
 */

type Step =
  | { kind: 'digit'; col: number; value: number; explain: string; withoutHelp?: number }
  | { kind: 'carry'; col: number }
  | { kind: 'borrow'; col: number };

const COL_NAME = ['unità', 'decine', 'centinaia'];
const COL_TAG = ['u', 'da', 'h'];

const digitsOf = (n: number, nd: number) => Array.from({ length: nd }, (_, i) => Math.floor(n / 10 ** i) % 10);

function plan(a: number, b: number, op: '+' | '-') {
  const res = op === '+' ? a + b : a - b;
  const nd = Math.max(String(a).length, String(b).length, String(res).length);
  const da = digitsOf(a, nd);
  const db = digitsOf(b, nd);
  const steps: Step[] = [];
  if (op === '+') {
    let carry = 0;
    for (let i = 0; i < nd; i++) {
      const s = da[i] + db[i] + carry;
      const parts = `${da[i]} + ${db[i]}${carry ? ' + 1 di riporto' : ''}`;
      if (!(i === nd - 1 && s === 0)) steps.push({ kind: 'digit', col: i, value: s % 10, explain: `${parts} = ${s}`, withoutHelp: carry ? (s - 1) % 10 : undefined });
      carry = s >= 10 ? 1 : 0;
      if (carry && i < nd - 1) steps.push({ kind: 'carry', col: i + 1 });
    }
  } else {
    const t = da.slice();
    for (let i = 0; i < nd; i++) {
      if (t[i] < db[i]) {
        steps.push({ kind: 'borrow', col: i + 1 });
        t[i + 1] -= 1;
        t[i] += 10;
      }
      const v = t[i] - db[i];
      if (i === nd - 1 && v === 0 && nd > 1) continue; // lo zero davanti non si scrive
      steps.push({ kind: 'digit', col: i, value: v, explain: `${t[i]} − ${db[i]} = ${v}` });
    }
  }
  return { res, nd, da, db, steps };
}

/** Mattoncini dei numeri: barrette blu da 10 e cubetti rossi da 1. */
function blocks(n: number) {
  const w = h('div', { class: 'b10-wrap', 'aria-hidden': 'true' });
  for (let i = 0; i < Math.floor(n / 10); i++) w.append(h('span', { class: 'b10' }));
  for (let i = 0; i < n % 10; i++) w.append(h('span', { class: 'b1' }));
  return w;
}

function fly(text: string, from: Element, to: Element, cls = '') {
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const el = h('div', { class: `fly-token ${cls}`, style: `left:${a.left + a.width / 2}px;top:${a.top + a.height / 2}px` }, text);
  document.getElementById('fx')!.append(el);
  el.animate(
    [
      { transform: 'translate(-50%,-50%) scale(0.6)', opacity: 0.4 },
      { transform: `translate(calc(-50% + ${(b.left - a.left) / 2}px), calc(-50% + ${(b.top - a.top) / 2 - 50}px)) scale(1.3)`, opacity: 1 },
      { transform: `translate(calc(-50% + ${b.left + b.width / 2 - (a.left + a.width / 2)}px), calc(-50% + ${b.top + b.height / 2 - (a.top + a.height / 2)}px)) scale(1)`, opacity: 1 },
    ],
    { duration: 650, easing: 'ease-in-out' }
  ).onfinish = () => el.remove();
}

export function columnChallenge(skill: SkillId, a: number, b: number, op: '+' | '-', prompt: boolean, showBlocks: boolean) {
  const { res, nd, da, db, steps } = plan(a, b, op);
  const opWord = op === '+' ? 'più' : 'meno';
  const title = op === '+' ? `Carica le casse: ${a} + ${b}` : `Nella grotta: ${a} − ${b}`;
  const say = `Calcola in colonna ${a} ${opWord} ${b}. Si parte sempre dalle unità, a destra!`;
  return {
    skill,
    say,
    mount(host: HTMLElement, finish: (r: Result) => void, ctx?: { compact?: boolean }) {
      let si = 0;
      let mistakes = 0;
      let done = false;
      const top = da.slice();
      const help: HTMLElement[] = [];
      const topEl: HTMLElement[] = [];
      const resEl: HTMLElement[] = [];
      const grid = h('div', { class: `col-grid nd${nd}`, style: `--nd:${nd}` });
      const tip = h('div', { class: 'col-tip' });
      const hint = h('div', { class: 'q-hint' });
      const cell = (cls: string, txt = '') => h('div', { class: `col-cell ${cls}` }, txt);
      // intestazione h / da / u
      grid.append(cell('op-col'));
      for (let i = nd - 1; i >= 0; i--) grid.append(cell(`head c${i}`, COL_TAG[i]));
      // riga riporto / prestito
      grid.append(cell('op-col'));
      for (let i = nd - 1; i >= 0; i--) {
        const c = h('button', { class: `col-cell helper c${i}`, 'aria-label': op === '+' ? `riporto ${COL_NAME[i]}` : `prestito ${COL_NAME[i]}` }) as HTMLButtonElement;
        c.addEventListener('click', () => tapHelper(i));
        help[i] = c;
        grid.append(c);
      }
      // primo numero
      grid.append(cell('op-col'));
      for (let i = nd - 1; i >= 0; i--) {
        const show = a >= 10 ** i || i === 0;
        const c = h('button', { class: `col-cell digit top c${i}` }, show ? String(da[i]) : '') as HTMLButtonElement;
        c.addEventListener('click', () => tapTop(i));
        topEl[i] = c;
        grid.append(c);
      }
      // secondo numero
      grid.append(cell('op-col sign', op === '+' ? '+' : '−'));
      for (let i = nd - 1; i >= 0; i--) grid.append(cell(`digit c${i}`, b >= 10 ** i || i === 0 ? String(db[i]) : ''));
      grid.append(h('div', { class: 'col-line' }));
      grid.append(cell('op-col sign', '='));
      for (let i = nd - 1; i >= 0; i--) {
        const c = cell(`digit result c${i}`);
        resEl[i] = c;
        grid.append(c);
      }
      const keypad = h(
        'div',
        { class: 'keypad' },
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => h('button', { class: `key k${d}`, onclick: () => press(d) }, String(d)))
      );
      const visual = showBlocks && !ctx?.compact ? h('div', { class: 'col-blocks' }, h('div', { class: 'row gap' }, blocks(a)), h('div', { class: 'col-blocks-op' }, op === '+' ? '+' : '−'), h('div', { class: 'row gap' }, blocks(b))) : null;
      host.append(
        h(
          'div',
          { class: 'challenge column-ch' },
          header(title, say, ctx),
          h('div', { class: 'col-wrap' }, visual, grid, h('div', { class: 'col-side' }, tip, keypad)),
          hint
        )
      );
      sayOnMount(say, ctx);
      render();

      function cur(): Step | undefined {
        return steps[si];
      }

      function render() {
        grid.querySelectorAll('.active').forEach((e) => e.classList.remove('active'));
        const st = cur();
        if (!st) return;
        if (st.kind === 'digit') {
          resEl[st.col].classList.add('active');
          tip.textContent = prompt ? `${COL_NAME[st.col][0].toUpperCase()}${COL_NAME[st.col].slice(1)}: ${st.explain.replace(/ = \d+$/, ' = ?')}` : `Scrivi la cifra delle ${COL_NAME[st.col]}`;
        } else if (st.kind === 'carry') {
          if (prompt) {
            help[st.col].classList.add('active');
            tip.textContent = 'Hai fatto 10 o di più: porta 1 alle decine! Tocca il cerchietto giallo.';
          } else {
            resEl[st.col].classList.add('active');
            tip.textContent = `Scrivi la cifra delle ${COL_NAME[st.col]}`;
          }
        } else {
          const i = st.col - 1;
          if (prompt) {
            topEl[st.col].classList.add('active');
            tip.textContent = `${top[i]} − ${db[i]} non si può fare: chiedi in prestito una decina! Tocca il ${top[st.col]}.`;
          } else {
            resEl[i].classList.add('active');
            tip.textContent = `Scrivi la cifra delle ${COL_NAME[i]}`;
          }
        }
      }

      function applyCarry(col: number) {
        help[col].textContent = '1';
        help[col].classList.add('filled');
        fly('1', resEl[col - 1], help[col], 'carry');
        sfx('brick');
      }

      function applyBorrow(col: number) {
        const i = col - 1;
        top[col] -= 1;
        top[i] += 10;
        topEl[col].classList.add('crossed');
        help[col].textContent = String(top[col]);
        help[col].classList.add('filled', 'borrow');
        topEl[i].classList.add('borrowed');
        fly('10', topEl[col], topEl[i], 'borrow');
        sfx('brick');
      }

      function mistake(msg: string) {
        mistakes++;
        sfx('wrong');
        shake(grid);
        hint.textContent = msg;
        speak(msg);
        if (mistakes >= 4) reveal();
      }

      function reveal() {
        done = true;
        hint.textContent = 'Guarda, ti faccio vedere io tutti i passaggi!';
        speak(hint.textContent);
        const next = () => {
          const st = steps[si];
          if (!st) {
            later(2200, () => finish('fail'));
            return;
          }
          if (st.kind === 'digit') {
            resEl[st.col].textContent = String(st.value);
            resEl[st.col].classList.add('ok');
            sfx('pop');
          } else if (st.kind === 'carry') applyCarry(st.col);
          else applyBorrow(st.col);
          si++;
          render();
          later(900, next);
        };
        later(600, next);
      }

      function advance() {
        si++;
        render();
        if (si >= steps.length) {
          done = true;
          tip.textContent = `${a} ${op === '+' ? '+' : '−'} ${b} = ${res}`;
          sfx('correct');
          confettiAt(grid, 30);
          hint.textContent = praise();
          if (!ctx?.compact) speak(`${hint.textContent} ${a} ${opWord} ${b} fa ${res}`);
          later(1500, () => finish(mistakes === 0 ? 'first' : mistakes <= 2 ? 'second' : 'fail'));
        }
      }

      function tapHelper(col: number) {
        const st = cur();
        if (done || !st) return;
        if (st.kind === 'carry' && st.col === col) {
          applyCarry(col);
          hint.textContent = '';
          advance();
        } else if (op === '+' && !help[col].classList.contains('filled')) {
          hint.textContent = 'Qui il riporto non serve.';
        }
      }

      function tapTop(col: number) {
        const st = cur();
        if (done || !st) return;
        if (st.kind === 'borrow' && st.col === col) {
          applyBorrow(col);
          hint.textContent = 'La decina è diventata 10 unità!';
          advance();
        } else if (op === '-') hint.textContent = 'Il prestito si chiede solo quando le unità non bastano.';
      }

      function press(d: number) {
        const st = cur();
        if (done || !st) return;
        if (st.kind === 'digit') {
          if (d === st.value) {
            resEl[st.col].textContent = String(d);
            resEl[st.col].classList.add('ok');
            sfx('pop');
            hint.textContent = '';
            advance();
          } else if (st.withoutHelp !== undefined && d === st.withoutHelp) {
            mistake('Non dimenticare il riporto! Aggiungi 1 alle decine.');
          } else {
            mistake(mistakes === 0 ? `Riprova: quanto fa ${st.explain.replace(/ = \d+$/, '')}?` : `${st.explain}: scrivi ${st.value}!`);
          }
          return;
        }
        // c'è un riporto o un prestito in sospeso
        if (prompt) {
          hint.textContent = st.kind === 'carry' ? 'Prima porta il riporto: tocca il cerchietto giallo!' : `Prima chiedi il prestito: tocca il ${top[st.col]}!`;
          sfx('click');
          return;
        }
        const next = steps[si + 1];
        if (next && next.kind === 'digit' && d === next.value) {
          // l'ha fatto a mente: bravo!
          if (st.kind === 'carry') applyCarry(st.col);
          else applyBorrow(st.col);
          si++;
          press(d);
          return;
        }
        if (st.kind === 'carry') mistake('Hai fatto 10 o di più nelle unità: ricordati il riporto! Tocca il cerchietto sopra le decine.');
        else {
          const i = st.col - 1;
          mistake(`${top[i]} − ${db[i]} non si può fare: chiedi in prestito una decina! Tocca la cifra delle decine.`);
        }
      }
    },
  };
}

function two(rng: Rng, lo = 1, hi = 9) {
  return rng.int(lo, hi);
}

export const coladd: Gen = (level, rng) => {
  let a: number, b: number;
  if (level === 1) {
    const ua = rng.int(0, 8);
    a = 10 * two(rng, 1, 8) + ua;
    b = rng.int(1, 9 - ua);
  } else if (level === 2) {
    const ta = rng.int(1, 7);
    const ua = rng.int(0, 8);
    a = 10 * ta + ua;
    b = 10 * rng.int(1, 8 - ta) + rng.int(0, 9 - ua);
  } else if (level === 3) {
    const ua = rng.int(2, 9);
    a = 10 * rng.int(1, 8) + ua;
    b = rng.int(10 - ua, 9);
  } else {
    const carry = level === 4 || rng.chance(0.7);
    const ua = carry ? rng.int(2, 9) : rng.int(0, 8);
    const ub = carry ? rng.int(10 - ua, 9) : rng.int(0, 9 - ua);
    const ta = rng.int(1, 7);
    const tb = rng.int(1, 8 - ta);
    a = 10 * ta + ua;
    b = 10 * tb + ub;
    if (rng.chance(0.5)) [a, b] = [b, a];
  }
  return columnChallenge('coladd', a, b, '+', level <= 4, level <= 3);
};

export const colsub: Gen = (level, rng) => {
  let a: number, b: number;
  if (level === 1) {
    const ua = rng.int(1, 9);
    a = 10 * rng.int(1, 9) + ua;
    b = rng.int(1, ua);
  } else if (level === 2) {
    const ta = rng.int(2, 9);
    const ua = rng.int(1, 9);
    a = 10 * ta + ua;
    b = 10 * rng.int(1, ta - 1) + rng.int(0, ua);
  } else if (level === 3) {
    const ua = rng.int(0, 7);
    a = 10 * rng.int(1, 9) + ua;
    b = rng.int(ua + 1, 9);
  } else {
    const borrow = level === 4 || rng.chance(0.7);
    const ta = rng.int(2, 9);
    const ua = borrow ? rng.int(0, 7) : rng.int(1, 9);
    const ub = borrow ? rng.int(ua + 1, 9) : rng.int(0, ua);
    a = 10 * ta + ua;
    b = 10 * rng.int(1, ta - 1) + ub;
  }
  return columnChallenge('colsub', a, b, '-', level <= 4, level <= 3);
};
