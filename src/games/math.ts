import { h, shuffle } from '../core/dom';
import type { Rng } from '../core/rng';
import { mc, numChoices, type Choice } from './frame';
import type { Gen } from './types';
import { blockIcon, brickIcon, eggIcon, img, modelIcon } from '../art/icons';
import { B } from '../art/blocks';
import { BRICK, shade } from '../art/color';
import { drawBrick, hiCanvas } from '../art/bricks';
import { dinoById, DINOS } from '../art/dinos';

const ITEMS = [
  { name: 'uova', f: true, icon: () => eggIcon('#fff3e0') },
  { name: 'diamanti', f: false, icon: () => blockIcon(B.Diamond) },
  { name: 'mattoncini', f: false, icon: () => brickIcon('#e53935') },
  { name: 'blocchi d\'erba', f: false, icon: () => blockIcon(B.Grass) },
  { name: 'pepite d\'oro', f: true, icon: () => blockIcon(B.Gold) },
];

/** Griglia di icone, a gruppi di 5 per aiutare a contare. */
export function iconGroup(src: string, n: number, cls = '', faded = 0) {
  const wrap = h('div', { class: `icon-group ${cls}` });
  for (let i = 0; i < n; i++) {
    const im = img(src, 'icon');
    if (i >= n - faded) im.classList.add('faded');
    wrap.append(im);
    if ((i + 1) % 5 === 0 && i < n - 1) wrap.append(h('span', { class: 'gap' }));
  }
  return wrap;
}

/** Torri da 10 mattoncini (decine) e mattoncini sciolti (unità). */
export function towers(tens: number, units: number) {
  const s = 15;
  const colW = s * 2 + 8;
  const w = Math.max(1, tens) * colW + (units ? Math.ceil(units / 5) * (s * 2 + 6) + 16 : 0) + 8;
  const hgt = 10 * s + 12;
  const { c, ctx } = hiCanvas(w, hgt, 'towers');
  for (let t = 0; t < tens; t++)
    for (let i = 0; i < 10; i++) drawBrick(ctx, 4 + t * colW, hgt - (i + 1) * s - 2, s * 2, s, '#1e88e5', [i === 9, i === 9]);
  const ux = 4 + tens * colW + 12;
  for (let u = 0; u < units; u++) {
    const col = Math.floor(u / 5);
    const row = u % 5;
    drawBrick(ctx, ux + col * (s * 2 + 6), hgt - (row + 1) * s - 2, s * 2, s, '#fdd835', [row === 4 || u === units - 1, row === 4 || u === units - 1]);
  }
  return c;
}

export const count: Gen = (level, rng) => {
  if (level <= 2) {
    const n = level === 1 ? rng.int(2, 10) : rng.int(8, 20);
    const it = rng.pick(ITEMS);
    const q = `Quant${it.f ? 'e' : 'i'} ${it.name} ci sono?`;
    return mc({
      skill: 'count',
      text: q,
      visual: () => iconGroup(it.icon(), n),
      choices: numChoices(n, rng, level === 1 ? 3 : 4, 2, 1),
      answer: String(n),
      hint: 'Tocca e conta uno alla volta. I gruppi sono da 5!',
      explain: `Sono ${n}.`,
    });
  }
  const max = level === 3 ? 5 : 9;
  const t = rng.int(1, max);
  const u = rng.int(0, 9);
  const n = t * 10 + u;
  if (level === 5 && rng.chance(0.5)) {
    const opts = new Set<string>([`${t} decine e ${u} unità`]);
    opts.add(`${u} decine e ${t} unità`);
    while (opts.size < 4) opts.add(`${rng.int(1, 9)} decine e ${rng.int(0, 9)} unità`);
    const choices: Choice[] = shuffle([...opts], rng).map((o) => ({ label: o, value: o }));
    return mc({
      skill: 'count',
      text: `Nel numero ${n} quante decine e unità ci sono?`,
      visual: () => h('div', { class: 'big-number' }, String(n)),
      choices,
      answer: `${t} decine e ${u} unità`,
      choiceClass: 'wide',
      hint: 'La prima cifra sono le decine, la seconda le unità.',
      explain: `${n} = ${t} decine e ${u} unità.`,
    });
  }
  return mc({
    skill: 'count',
    text: 'Ogni torre blu ha 10 mattoncini. Quanti mattoncini ci sono in tutto?',
    visual: () => towers(t, u),
    choices: numChoices(n, rng, 4, 10, 1),
    answer: String(n),
    hint: 'Conta le torri di 10 in 10, poi aggiungi i gialli!',
    explain: `${t} torri da 10 fanno ${t * 10}, più ${u} fa ${n}.`,
  });
};

function exprVisual(a: number | string, op: string, b: number | string, res: number | string = '?') {
  const tile = (v: number | string, cls = '') => h('span', { class: `num-tile ${cls}` }, String(v));
  return h('div', { class: 'expr' }, tile(a), h('span', { class: 'op' }, op), tile(b), h('span', { class: 'op' }, '='), tile(res, res === '?' ? 'ask' : ''));
}

export const addsub: Gen = (level, rng) => {
  let a: number, b: number, plus: boolean;
  if (level === 1) {
    plus = true;
    a = rng.int(1, 6);
    b = rng.int(1, 10 - a);
  } else if (level === 2) {
    plus = rng.chance(0.5);
    a = rng.int(3, 10);
    b = plus ? rng.int(1, 10 - a || 1) : rng.int(1, a - 1);
    if (plus && a + b > 10) b = 10 - a;
    if (b < 1) {
      plus = false;
      b = rng.int(1, a - 1);
    }
  } else if (level === 3) {
    plus = rng.chance(0.5);
    a = rng.int(6, 15);
    b = plus ? rng.int(2, 20 - a) : rng.int(2, a - 1);
  } else if (level === 4) {
    // fino a 100 senza riporto
    plus = rng.chance(0.5);
    const kind = rng.int(0, 2);
    if (kind === 0) {
      // decine con decine: 30 + 40, 100 - 60
      if (plus) {
        a = 10 * rng.int(1, 9);
        b = 10 * rng.int(1, 10 - a / 10);
      } else {
        a = 10 * rng.int(2, 10);
        b = 10 * rng.int(1, a / 10 - 1);
      }
    } else if (kind === 1) {
      // due cifre e una cifra: 43 + 5, 47 - 3
      const t = rng.int(1, 9);
      const u = plus ? rng.int(0, 8) : rng.int(1, 9);
      a = 10 * t + u;
      b = plus ? rng.int(1, 9 - u) : rng.int(1, u);
    } else {
      // due cifre e decine/due cifre senza riporto: 34 + 25, 78 - 43
      const ta = rng.int(1, 8);
      const ua = rng.int(0, 8);
      a = 10 * ta + ua;
      if (plus) b = 10 * rng.int(1, 9 - ta) + rng.int(0, 9 - ua);
      else b = 10 * rng.int(0, ta - 1) + rng.int(0, ua);
      if (b === 0) b = plus ? 10 : 1;
      if (!plus && b > a) b = a - 1;
    }
  } else {
    // fino a 100 con riporto e prestito
    const kind = rng.int(0, 3);
    if (kind === 0) {
      plus = true;
      const ua = rng.int(2, 9);
      const ub = rng.int(10 - ua, 9);
      const ta = rng.int(1, 7);
      const tb = rng.int(0, 8 - ta);
      a = 10 * ta + ua;
      b = 10 * tb + ub;
    } else if (kind === 1) {
      plus = false;
      const ua = rng.int(0, 7);
      const ub = rng.int(ua + 1, 9);
      const ta = rng.int(2, 9);
      const tb = rng.int(0, ta - 1);
      a = 10 * ta + ua;
      b = 10 * tb + ub;
    } else if (kind === 2) {
      // complementi a 100: 45 + 55
      plus = true;
      a = rng.int(11, 89);
      b = 100 - a;
    } else {
      // partire da 100: 100 - 35
      plus = false;
      a = 100;
      b = rng.int(11, 89);
    }
  }
  const res = plus ? a + b : a - b;
  const missing = level >= 3 && rng.chance(0.3);
  const op = plus ? '+' : '-';
  const useIcons = level <= 2;
  const ic = rng.pick(ITEMS);
  if (missing) {
    return mc({
      skill: 'addsub',
      text: `Quale numero manca?`,
      say: `${a} ${plus ? 'più' : 'meno'} quale numero fa ${res}?`,
      visual: () => exprVisual(a, op, '?', res),
      choices: numChoices(b, rng, 4, level >= 4 ? 10 : 3, 0),
      answer: String(b),
      hint: plus ? `Parti da ${a} e conta fino a ${res}.` : `Da ${a} quanto devo togliere per arrivare a ${res}?`,
      explain: `${a} ${op} ${b} = ${res}`,
    });
  }
  return mc({
    skill: 'addsub',
    text: `${a} ${op} ${b} = ?`,
    say: `Quanto fa ${a} ${plus ? 'più' : 'meno'} ${b}?`,
    visual: () =>
      h(
        'div',
        { class: 'col' },
        exprVisual(a, op, b),
        useIcons
          ? plus
            ? h('div', { class: 'row gap' }, iconGroup(ic.icon(), a), h('b', { class: 'plus' }, '+'), iconGroup(ic.icon(), b))
            : iconGroup(ic.icon(), a, '', b)
          : null
      ),
    choices: numChoices(res, rng, 4, level >= 4 ? 10 : 3, 0),
    answer: String(res),
    hint: plus ? 'Tieni il numero più grande in testa e conta in avanti!' : 'Parti dal primo numero e conta all\'indietro!',
    explain: `${a} ${op} ${b} = ${res}`,
  });
};

export const mult: Gen = (level, rng) => {
  const tables = level === 1 ? [2] : level === 2 ? [2, 10] : level === 3 ? [5, 2] : level === 4 ? [2, 5, 10] : [3, 4, 5];
  const t = rng.pick(tables);
  const rows = level === 1 ? rng.int(1, 5) : rng.int(2, level >= 4 ? 9 : 6);
  const res = rows * t;
  const blk = rng.pick([B.Diamond, B.Gold, B.Emerald, B.Grass, B.Brick]);
  return mc({
    skill: 'mult',
    text: `${rows} file da ${t}. ${rows} × ${t} = ?`,
    say: `Ci sono ${rows} file da ${t} blocchi. Quanti blocchi in tutto? ${rows} per ${t}?`,
    visual: () => {
      const g = h('div', { class: 'array-grid', style: `--cols:${t}` });
      for (let i = 0; i < rows * t; i++) g.append(img(blockIcon(blk), rows * t > 30 ? 'icon sm' : 'icon'));
      return g;
    },
    choices: numChoices(res, rng, 4, t, 1),
    answer: String(res),
    hint: `Conta di ${t} in ${t}: ${Array.from({ length: Math.min(rows, 3) }, (_, i) => (i + 1) * t).join(', ')}...`,
    explain: `${rows} × ${t} = ${res}`,
  });
};

export const compare: Gen = (level, rng) => {
  const rex = () => img(modelIcon('trex-hungry', dinoById('trex').model, 120, 96), 'dino-mini');
  if (level <= 2) {
    const max = level === 1 ? 10 : 20;
    const a = rng.int(0, max);
    let b = rng.int(0, max);
    while (b === a) b = rng.int(0, max);
    const bigger = level === 1 || rng.chance(0.5);
    const ans = bigger ? Math.max(a, b) : Math.min(a, b);
    return mc({
      skill: 'compare',
      text: bigger ? 'Il T-Rex affamato vuole il numero più GRANDE!' : 'Il T-Rex è sazio: vuole il numero più PICCOLO!',
      visual: rex,
      choices: [a, b].map((v) => ({ label: String(v), value: String(v) })),
      answer: String(ans),
      hint: 'Immagina i numeri sulla linea: quale viene dopo?',
      explain: `${ans} è il più ${bigger ? 'grande' : 'piccolo'}.`,
    });
  }
  if (level === 4) {
    const set = new Set<number>();
    while (set.size < 3) set.add(rng.int(10, 99));
    const arr = [...set];
    const ans = Math.max(...arr);
    return mc({
      skill: 'compare',
      text: 'Quale numero è il più grande di tutti?',
      visual: rex,
      choices: arr.map((v) => ({ label: String(v), value: String(v) })),
      answer: String(ans),
      hint: 'Guarda prima le decine!',
      explain: `${ans} è il più grande.`,
    });
  }
  let a: number | string, b: number | string, va: number, vb: number;
  if (level === 3) {
    va = rng.int(5, 50);
    vb = rng.chance(0.2) ? va : rng.int(5, 50);
    a = va;
    b = vb;
  } else {
    const x = rng.int(1, 9);
    const y = rng.int(1, 9);
    va = x + y;
    vb = rng.chance(0.25) ? va : rng.int(Math.max(2, va - 3), va + 3);
    a = `${x} + ${y}`;
    b = vb;
  }
  const ans = va > vb ? '>' : va < vb ? '<' : '=';
  return mc({
    skill: 'compare',
    text: 'Che simbolo ci va: maggiore, minore o uguale?',
    say: `Che simbolo ci va tra ${a} e ${b}? Maggiore, minore o uguale?`,
    visual: () =>
      h(
        'div',
        { class: 'expr' },
        h('span', { class: 'num-tile' }, String(a)),
        h('span', { class: 'num-tile ask' }, '?'),
        h('span', { class: 'num-tile' }, String(b))
      ),
    choices: [
      { label: '>', value: '>' },
      { label: '=', value: '=' },
      { label: '<', value: '<' },
    ],
    answer: ans,
    hint: 'La bocca del coccodrillo mangia sempre il numero più grande!',
    explain: `${a} ${ans} ${b}`,
  });
};

export const word: Gen = (level, rng) => {
  const names = DINOS.map((d) => d.nick);
  const n1 = rng.pick(names);
  let n2 = rng.pick(names);
  while (n2 === n1) n2 = rng.pick(names);
  const it = rng.pick(ITEMS);
  const qn = (it.f ? 'Quante ' : 'Quanti ') + it.name;
  const max = level <= 1 ? 10 : level === 2 ? 15 : level === 3 ? 20 : 100;
  let text: string, ans: number, hint: string;
  const kind = level >= 4 ? rng.int(0, 3) : level >= 2 ? rng.int(0, 1) : 0;
  let visualN = 0;
  if (kind === 0) {
    const a = rng.int(1, max - 2);
    const b = rng.int(1, Math.min(level >= 4 ? 45 : 9, max - a));
    ans = a + b;
    visualN = a <= 10 && b <= 10 ? a : 0;
    text = `${n1} ha ${a} ${it.name}. Ne trova ${it.f ? 'altre' : 'altri'} ${b}. ${qn} ha adesso?`;
    hint = 'Ne trova altri: quindi aumentano! È un\'addizione.';
  } else if (kind === 1) {
    const a = rng.int(4, max);
    const b = rng.int(1, a - 1);
    ans = a - b;
    text = `${n1} ha ${a} ${it.name}. Ne regala ${b} a ${n2}. ${qn} gli restano?`;
    hint = 'Ne regala: quindi diminuiscono! È una sottrazione.';
  } else if (kind === 2) {
    const a = rng.int(2, 5);
    const b = level >= 5 ? rng.int(3, 9) : rng.pick([2, 5, 10]);
    ans = a * b;
    text = `Ci sono ${a} nidi. In ogni nido ci sono ${b} uova. Quante uova in tutto?`;
    hint = `Conta di ${b} in ${b} per ogni nido!`;
  } else {
    const a = rng.int(12, level >= 5 ? 99 : 40);
    const b = rng.int(3, a - 4);
    ans = a - b;
    text = `${n1} ha ${a} ${it.name}, ${n2} ne ha ${b}. ${qn} ha ${n1} in più?`;
    hint = `Quanto manca da ${b} per arrivare a ${a}?`;
  }
  return mc({
    skill: 'word',
    text,
    visual: () =>
      h(
        'div',
        { class: 'row gap center' },
        img(modelIcon(`nick-${n1}`, DINOS.find((d) => d.nick === n1)!.model, 110, 84), 'dino-mini'),
        visualN ? iconGroup(it.icon(), visualN, 'small') : img(it.icon(), 'icon lg')
      ),
    choices: numChoices(ans, rng, 4, 3, 0),
    answer: String(ans),
    hint,
    explain: `La risposta è ${ans}.`,
  });
};

const SHAPES: Record<string, { sides: number; svg: string }> = {
  quadrato: { sides: 4, svg: '<rect x="15" y="15" width="70" height="70" rx="4"/>' },
  rettangolo: { sides: 4, svg: '<rect x="5" y="25" width="90" height="50" rx="4"/>' },
  triangolo: { sides: 3, svg: '<polygon points="50,10 92,88 8,88"/>' },
  cerchio: { sides: 0, svg: '<circle cx="50" cy="50" r="40"/>' },
  pentagono: { sides: 5, svg: '<polygon points="50,8 92,40 76,90 24,90 8,40"/>' },
  esagono: { sides: 6, svg: '<polygon points="28,10 72,10 94,50 72,90 28,90 6,50"/>' },
};

function shapeSvg(name: string, color: string) {
  const d = h('div', { class: 'shape-svg' });
  d.innerHTML = `<svg viewBox="0 0 100 100" width="150" height="150"><g fill="${color}" stroke="${shade(color, -0.4)}" stroke-width="4" stroke-linejoin="round">${SHAPES[name].svg}</g></svg>`;
  return d;
}

function boneRuler(len: number) {
  const s = 30;
  const { c, ctx } = hiCanvas(9 * s + 20, 90, 'ruler');
  // osso
  const y = 18;
  ctx.fillStyle = '#fff8e1';
  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 3;
  const x0 = 10;
  const x1 = 10 + len * s;
  ctx.beginPath();
  ctx.roundRect(x0 + 8, y + 4, x1 - x0 - 16, 14, 6);
  ctx.fill();
  ctx.stroke();
  for (const x of [x0 + 8, x1 - 8])
    for (const dy of [0, 22]) {
      ctx.beginPath();
      ctx.arc(x, y + dy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  // righello di mattoncini
  for (let i = 0; i < 9; i++) drawBrick(ctx, 10 + i * s, 58, s, s * 0.8, i % 2 ? '#fb8c00' : '#fdd835', [true]);
  return c;
}

export const shapes: Gen = (level, rng) => {
  const color = rng.pick(BRICK).hex;
  if (level === 1) {
    const name = rng.pick(['quadrato', 'rettangolo', 'triangolo', 'cerchio']);
    const opts = shuffle(['quadrato', 'rettangolo', 'triangolo', 'cerchio'], rng).slice(0, 3);
    if (!opts.includes(name)) opts[0] = name;
    return mc({
      skill: 'shapes',
      text: 'Che forma è?',
      visual: () => shapeSvg(name, color),
      choices: shuffle(opts, rng).map((o) => ({ label: o, value: o })),
      answer: name,
      choiceClass: 'wide',
      hint: 'Conta i lati e guarda se sono tutti uguali.',
      explain: `È un ${name}.`,
    });
  }
  if (level === 2 || (level === 5 && rng.chance(0.3))) {
    const name = rng.pick(['triangolo', 'quadrato', 'pentagono', 'esagono', 'rettangolo']);
    const n = SHAPES[name].sides;
    return mc({
      skill: 'shapes',
      text: `Quanti lati ha questa forma?`,
      visual: () => shapeSvg(name, color),
      choices: [3, 4, 5, 6].map((v) => ({ label: String(v), value: String(v) })),
      answer: String(n),
      hint: 'Tocca ogni lato con il dito e conta!',
      explain: `Il ${name} ha ${n} lati.`,
    });
  }
  if (level === 3) {
    const len = rng.int(2, 8);
    return mc({
      skill: 'shapes',
      text: "Quanti mattoncini è lungo l'osso?",
      visual: () => boneRuler(len),
      choices: numChoices(len, rng, 4, 2, 1),
      answer: String(len),
      hint: "Guarda dove inizia e dove finisce l'osso sopra i mattoncini.",
      explain: `L'osso è lungo ${len} mattoncini.`,
    });
  }
  const r = rng.int(2, level === 4 ? 4 : 5);
  const cc = rng.int(2, level === 4 ? 5 : 6);
  return mc({
    skill: 'shapes',
    text: 'Quanti quadretti ci sono in questo pavimento?',
    visual: () => {
      const g = h('div', { class: 'array-grid tight', style: `--cols:${cc}` });
      for (let i = 0; i < r * cc; i++) g.append(h('span', { class: 'tile', style: `--c:${color}` }));
      return g;
    },
    choices: numChoices(r * cc, rng, 4, cc, 1),
    answer: String(r * cc),
    hint: `Ci sono ${r} file. Quanti quadretti in ogni fila?`,
    explain: `${r} file da ${cc} = ${r * cc} quadretti.`,
  });
};

function balanceVisual(left: string, right: string) {
  const d = h('div', { class: 'balance tilt' });
  d.innerHTML = `
  <svg viewBox="0 0 300 170" width="300" height="170">
    <rect x="140" y="40" width="20" height="110" fill="#8d6e63" stroke="#4e342e" stroke-width="3"/>
    <rect x="95" y="148" width="110" height="18" rx="4" fill="#6d4c41" stroke="#4e342e" stroke-width="3"/>
    <g class="beam">
      <rect x="20" y="30" width="260" height="14" rx="6" fill="#fdd835" stroke="#f57f17" stroke-width="3"/>
      <g class="pan-l"><line x1="45" y1="44" x2="45" y2="78" stroke="#555" stroke-width="3"/><rect x="0" y="78" width="90" height="34" rx="8" fill="#e53935" stroke="#b71c1c" stroke-width="3"/>
      <text x="45" y="102" text-anchor="middle" font-size="22" font-weight="800" fill="#fff">${left}</text></g>
      <g class="pan-r"><line x1="255" y1="44" x2="255" y2="78" stroke="#555" stroke-width="3"/><rect x="210" y="78" width="90" height="34" rx="8" fill="#1e88e5" stroke="#0d47a1" stroke-width="3"/>
      <text x="255" y="102" text-anchor="middle" font-size="22" font-weight="800" fill="#fff">${right}</text></g>
    </g>
    <circle cx="150" cy="37" r="9" fill="#ff8f00" stroke="#e65100" stroke-width="3"/>
  </svg>`;
  return d;
}

export const balance: Gen = (level, rng: Rng) => {
  let left: string, right: string, ans: number;
  if (level === 1) {
    const a = rng.int(1, 5);
    const b = rng.int(1, 5);
    ans = a + b;
    left = `${a} + ${b}`;
    right = '?';
  } else if (level === 2) {
    const a = rng.int(5, 10);
    const b = rng.int(1, a - 1);
    ans = a - b;
    left = `${a}`;
    right = `${b} + ?`;
  } else if (level <= 4) {
    const max = level === 3 ? 10 : 25;
    const a = rng.int(2, max);
    const b = rng.int(2, max);
    const c = rng.int(1, a + b - 1);
    ans = a + b - c;
    left = `${a} + ${b}`;
    right = `${c} + ?`;
  } else {
    const a = rng.int(2, 5);
    const b = rng.pick([2, 5, 10]);
    const c = rng.int(1, a * b - 1);
    ans = a * b - c;
    left = `${a} × ${b}`;
    right = `${c} + ?`;
  }
  return mc({
    skill: 'balance',
    text: 'Quale numero mette in equilibrio la bilancia?',
    visual: () => balanceVisual(left, right),
    choices: numChoices(ans, rng, 4, 3, 0),
    answer: String(ans),
    hint: 'I due piatti devono pesare uguale: calcola prima il piatto rosso!',
    explain: `${left} = ${right.replace('?', String(ans))}`,
    onCorrect: (v) => v?.classList.remove('tilt'),
  });
};
