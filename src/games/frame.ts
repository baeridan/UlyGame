import { h, later } from '../core/dom';
import { speak } from '../core/speech';
import { sfx } from '../core/audio';
import { confettiAt, shake, bounce } from '../core/fx';
import { save } from '../core/store';
import type { Challenge, MountCtx, Result, SkillId } from './types';

/** Intestazione comune: testo grande + pulsante per riascoltare. */
export function header(text: string, say: string, ctx?: MountCtx) {
  const t = h('div', { class: 'q-text' }, text);
  const btn = ctx?.compact
    ? null
    : h('button', { class: 'speak-btn', 'aria-label': 'Ascolta', onclick: () => speak(say) }, '🔊');
  return h('div', { class: 'q-head' }, t, btn);
}

export function sayOnMount(say: string, ctx?: MountCtx) {
  if (!ctx?.compact) later(250, () => speak(say));
}

export interface Choice {
  label: string | Node;
  value: string;
  cls?: string;
}

export interface McSpec {
  skill: SkillId;
  text: string;
  say?: string;
  visual?: () => HTMLElement;
  choices: Choice[];
  answer: string;
  hint?: string;
  explain?: string;
  /** callback quando risponde giusto (per animazioni del visual) */
  onCorrect?: (visual: HTMLElement | null) => void;
  choiceClass?: string;
}

const PRAISE = ['Bravissimo!', 'Esatto!', 'Super!', 'Grande!', 'Perfetto!', 'Fantastico!', 'Evviva!'];
export const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

export function mc(spec: McSpec): Challenge {
  const say = spec.say || spec.text;
  return {
    skill: spec.skill,
    say,
    mount(host, finish, ctx) {
      let tries = 0;
      let done = false;
      const vis = spec.visual ? spec.visual() : null;
      const hint = h('div', { class: 'q-hint' });
      const buttons: HTMLButtonElement[] = [];
      const grid = h('div', { class: `choices n${spec.choices.length} ${spec.choiceClass || ''}` });
      spec.choices.forEach((c, i) => {
        const b = h('button', { class: `choice c${i % 6} ${c.cls || ''}` }, c.label) as HTMLButtonElement;
        b.addEventListener('click', () => pick(c, b));
        buttons.push(b);
        grid.append(b);
      });
      host.append(h('div', { class: 'challenge mc' }, header(spec.text, say, ctx), vis ? h('div', { class: 'q-visual' }, vis) : null, grid, hint));
      sayOnMount(say, ctx);

      function pick(c: Choice, b: HTMLButtonElement) {
        if (done || b.disabled) return;
        if (c.value === spec.answer) {
          done = true;
          b.classList.add('ok');
          sfx('correct');
          confettiAt(b, ctx?.compact ? 10 : 22);
          bounce(b);
          hint.textContent = praise();
          if (!ctx?.compact) speak(hint.textContent);
          spec.onCorrect?.(vis);
          later(ctx?.race ? 450 : 1100, () => finish(tries === 0 ? 'first' : 'second'));
          return;
        }
        tries++;
        sfx('wrong');
        shake(b);
        b.classList.add('no');
        b.disabled = true;
        if (ctx?.race) {
          buttons.forEach((x) => x.classList.add('frozen'));
          later(800, () => buttons.forEach((x) => x.classList.remove('frozen')));
          return;
        }
        if (tries === 1) {
          hint.textContent = spec.hint || 'Quasi! Prova ancora 💪';
          speak(hint.textContent);
        } else {
          done = true;
          const right = buttons[spec.choices.findIndex((x) => x.value === spec.answer)];
          right.classList.add('ok', 'reveal');
          hint.textContent = spec.explain || `La risposta giusta è ${spec.answer}.`;
          speak(hint.textContent + ' La prossima andrà meglio!');
          later(3200, () => finish('fail'));
        }
      }
    },
  };
}

/** Pulsanti di risposta numerici vicini alla risposta giusta. */
export function numChoices(answer: number, rnd: () => number, n = 4, spread = 3, min = 0): Choice[] {
  const set = new Set<number>([answer]);
  const cands = [answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10, answer + spread, answer - spread];
  let guard = 0;
  while (set.size < n && guard++ < 200) {
    const c = guard < 30 ? cands[Math.floor(rnd() * cands.length)] : answer + Math.round((rnd() - 0.5) * 2 * (spread + 3));
    if (c >= min && Number.isInteger(c)) set.add(c);
  }
  return [...set].sort((a, b) => a - b).map((v) => ({ label: String(v), value: String(v) }));
}

/** Piccola etichetta con simbolo per modalità daltonici. */
export function cbSym(sym: string) {
  return save.settings.colorblind ? h('span', { class: 'cb-sym' }, sym) : null;
}

/** Pulsante d'azione grande dentro una sfida. */
export function actionBtn(label: string, onclick: () => void, cls = 'go') {
  return h('button', { class: `btn ${cls}`, onclick }, label) as HTMLButtonElement;
}

export type { Result };

/** Gestisce tentativi per le sfide interattive (labirinto, costruzioni, sudoku...). */
export function tracker(hintEl: HTMLElement, finish: (r: Result) => void, ctx: MountCtx | undefined, reveal: () => void) {
  let tries = 0;
  let done = false;
  return {
    get done() {
      return done;
    },
    get tries() {
      return tries;
    },
    success(anchor?: Element) {
      if (done) return;
      done = true;
      sfx('correct');
      if (anchor) confettiAt(anchor, 30);
      hintEl.textContent = praise();
      if (!ctx?.compact) speak(hintEl.textContent);
      later(1300, () => finish(tries === 0 ? 'first' : 'second'));
    },
    fail(msg: string) {
      if (done) return;
      tries++;
      sfx('wrong');
      if (tries === 1) {
        hintEl.textContent = msg;
        speak(msg);
      } else {
        done = true;
        hintEl.textContent = 'Guarda, ti faccio vedere io come si fa!';
        speak(hintEl.textContent);
        reveal();
        later(3800, () => finish('fail'));
      }
    },
  };
}
