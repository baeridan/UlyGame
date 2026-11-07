import { h, shuffle } from '../core/dom';
import { mc, cbSym, type Choice } from './frame';
import type { Gen } from './types';
import { BRICK } from '../art/color';
import { blockIcon, brickIcon, img, modelIcon } from '../art/icons';
import { B } from '../art/blocks';
import { DINOS } from '../art/dinos';

type Item = { key: string; node: () => Node; say: string; plain?: string };

function brickItem(i: number): Item {
  const c = BRICK[i];
  return {
    key: 'b' + i,
    node: () => h('span', { class: 'brick-chip' }, img(brickIcon(c.hex), 'icon'), cbSym(c.sym)),
    say: c.id,
  };
}

function numItem(n: number): Item {
  return { key: 'n' + n, node: () => h('span', { class: 'num-tile small' }, String(n)), say: String(n), plain: String(n) };
}

export const sequence: Gen = (level, rng) => {
  let items: Item[];
  let ans: Item;
  let pool: Item[];
  let hint = 'Guarda come si ripete la fila!';
  if (level <= 2) {
    const k = level === 1 ? 2 : 3;
    const colors = shuffle([0, 1, 2, 3, 4, 5], rng).slice(0, k);
    const patterns = level === 1 ? [[0, 1]] : [[0, 1, 2], [0, 0, 1], [0, 1, 1], [0, 1, 0, 2]];
    const pat = rng.pick(patterns);
    const len = pat.length * 2 + rng.int(1, pat.length);
    const seq = Array.from({ length: len }, (_, i) => colors[pat[i % pat.length] % colors.length]);
    items = seq.slice(0, -1).map(brickItem);
    ans = brickItem(seq[seq.length - 1]);
    const others = shuffle([0, 1, 2, 3, 4, 5].filter((c) => c !== seq[seq.length - 1]), rng);
    const pickOthers = [...new Set([...colors.filter((c) => c !== seq[seq.length - 1]), ...others])].slice(0, 2);
    pool = [ans, ...pickOthers.map(brickItem)];
  } else {
    let start: number, step: number, mulMode = false;
    if (level === 3) {
      step = rng.pick([1, 2]);
      start = rng.int(1, 10);
    } else if (level === 4) {
      step = rng.pick([5, 10, -1, -2, 3]);
      start = step < 0 ? rng.int(12, 20) : rng.int(0, 10) * (step === 3 ? 1 : 1);
      if (step === 5 || step === 10) start = rng.int(0, 4) * step;
    } else {
      mulMode = rng.chance(0.3);
      step = rng.pick([3, 4, -5, -10, 11]);
      start = step < 0 ? rng.int(5, 9) * 10 : rng.int(1, 12);
    }
    const seq: number[] = [];
    let v = mulMode ? rng.int(1, 3) : start;
    for (let i = 0; i < 5; i++) {
      seq.push(v);
      v = mulMode ? v * 2 : v + step;
    }
    items = seq.slice(0, 4).map(numItem);
    ans = numItem(seq[4]);
    const d = mulMode ? seq[4] / 2 : Math.abs(step);
    const wrongs = new Set<number>();
    for (const c of [seq[4] + 1, seq[4] - 1, seq[3] + (mulMode ? seq[3] : step) + d, seq[4] + 10, seq[4] - 2])
      if (c >= 0 && c !== seq[4]) wrongs.add(c);
    let extra = 3;
    while (wrongs.size < 3) {
      if (seq[4] + extra !== seq[4]) wrongs.add(seq[4] + extra);
      extra++;
    }
    pool = [ans, ...[...wrongs].slice(0, 3).map(numItem)];
    hint = mulMode ? 'Ogni numero è il doppio di quello prima!' : `Quanto aumenta o diminuisce ogni volta?`;
  }
  const choices: Choice[] = shuffle(pool, rng).map((p) => (p.plain ? { label: p.plain, value: p.key } : { label: p.node(), value: p.key, cls: 'tall' }));
  return mc({
    skill: 'sequence',
    text: 'Cosa viene dopo nella sequenza?',
    visual: () => h('div', { class: 'seq-row' }, ...items.map((i) => i.node()), h('span', { class: 'num-tile ask small' }, '?')),
    choices,
    answer: ans.key,
    hint,
    explain: `Dopo viene ${ans.say}.`,
  });
};

const BLOCK_SET = [B.Grass, B.Stone, B.Wood, B.Sand, B.Diamond, B.Gold, B.Snow, B.Brick];

export const oddone: Gen = (level, rng) => {
  type O = { key: string; node: () => Node };
  let same: O[];
  let odd: O;
  let explain: string;
  if (level === 1) {
    const [a, b] = shuffle(BLOCK_SET, rng);
    same = [0, 1, 2].map((i) => ({ key: 's' + i, node: () => img(blockIcon(a), 'icon lg') }));
    odd = { key: 'odd', node: () => img(blockIcon(b), 'icon lg') };
    explain = 'Quel blocco è diverso dagli altri.';
  } else if (level === 2) {
    const blocks = shuffle(BLOCK_SET, rng).slice(0, 3);
    const d = rng.pick(DINOS);
    same = blocks.map((b, i) => ({ key: 's' + i, node: () => img(blockIcon(b), 'icon lg') }));
    odd = { key: 'odd', node: () => img(modelIcon(d.id, d.model, 90, 70), 'icon lg') };
    explain = 'Gli altri sono blocchi, lui è un dinosauro!';
  } else if (level === 3) {
    const ds = shuffle(DINOS, rng).slice(0, 3);
    const b = rng.pick(BLOCK_SET);
    same = ds.map((d, i) => ({ key: 's' + i, node: () => img(modelIcon(d.id, d.model, 90, 70), 'icon lg') }));
    odd = { key: 'odd', node: () => img(blockIcon(b), 'icon lg') };
    if (rng.chance(0.5)) {
      // colori: tre mattoncini uguali per colore, uno di colore diverso
      const [c1, c2] = shuffle([0, 1, 2, 3, 4, 5], rng);
      same = [0, 1, 2].map((i) => ({ key: 's' + i, node: () => h('span', { class: 'brick-chip' }, img(brickIcon(BRICK[c1].hex, 56, i + 1), 'icon lg'), cbSym(BRICK[c1].sym)) }));
      odd = { key: 'odd', node: () => h('span', { class: 'brick-chip' }, img(brickIcon(BRICK[c2].hex, 56, 2), 'icon lg'), cbSym(BRICK[c2].sym)) };
      explain = 'Ha un colore diverso dagli altri!';
    } else explain = 'Gli altri sono dinosauri, quello è un blocco!';
  } else if (level === 4) {
    const even = rng.chance(0.5);
    const pickN = (wantEven: boolean) => {
      let n = rng.int(1, 30);
      while ((n % 2 === 0) !== wantEven) n = rng.int(1, 30);
      return n;
    };
    const nums = new Set<number>();
    while (nums.size < 3) nums.add(pickN(even));
    const o = pickN(!even);
    same = [...nums].map((n, i) => ({ key: 's' + i, node: () => h('span', { class: 'num-tile' }, String(n)) }));
    odd = { key: 'odd', node: () => h('span', { class: 'num-tile' }, String(o)) };
    explain = even ? `Gli altri sono numeri pari, ${o} è dispari.` : `Gli altri sono numeri dispari, ${o} è pari.`;
  } else {
    const k = rng.pick([5, 10]);
    const nums = new Set<number>();
    while (nums.size < 3) nums.add(k * rng.int(1, 9));
    let o = rng.int(11, 89);
    while (o % k === 0) o++;
    same = [...nums].map((n, i) => ({ key: 's' + i, node: () => h('span', { class: 'num-tile' }, String(n)) }));
    odd = { key: 'odd', node: () => h('span', { class: 'num-tile' }, String(o)) };
    explain = `Gli altri si trovano contando di ${k} in ${k}, ${o} no!`;
  }
  const all = shuffle([...same, odd], rng);
  return mc({
    skill: 'oddone',
    text: "Trova l'intruso: chi non c'entra?",
    choices: all.map((o) => ({ label: o.node(), value: o.key, cls: 'tall' })),
    answer: 'odd',
    hint: 'Cerca cosa hanno in comune tre di loro.',
    explain,
  });
};
