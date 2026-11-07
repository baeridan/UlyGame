import { gray, mix, shade } from './color';

export enum B {
  Grass,
  Dirt,
  Stone,
  Sand,
  Water,
  Lava,
  Wood,
  Leaves,
  Snow,
  Ice,
  Diamond,
  Gold,
  Coal,
  Crystal,
  Brick,
  Obsidian,
  Planks,
  Emerald,
  Flowers,
  BrickBlue,
  BrickYellow,
  Iron,
}

interface BlockDef {
  name: string;
  top: string;
  side: string;
  ore?: string;
  kind?: 'grass' | 'brick' | 'log' | 'planks' | 'water' | 'lava' | 'glass' | 'flowers';
  glow?: boolean;
}

export const BLOCKS: Record<B, BlockDef> = {
  [B.Grass]: { name: 'Erba', top: '#5cbf3a', side: '#8b5a2b', kind: 'grass' },
  [B.Dirt]: { name: 'Terra', top: '#8b5a2b', side: '#7a4e25' },
  [B.Stone]: { name: 'Pietra', top: '#9e9e9e', side: '#8a8a8a' },
  [B.Sand]: { name: 'Sabbia', top: '#f3e08f', side: '#e6cf76' },
  [B.Water]: { name: 'Acqua', top: '#3fa9f5', side: '#2a86d1', kind: 'water' },
  [B.Lava]: { name: 'Lava', top: '#ff7a1a', side: '#e65100', kind: 'lava', ore: '#ffd54f', glow: true },
  [B.Wood]: { name: 'Legno', top: '#c49a5a', side: '#6d4c2f', kind: 'log' },
  [B.Leaves]: { name: 'Foglie', top: '#2e8b3a', side: '#277a32' },
  [B.Snow]: { name: 'Neve', top: '#ffffff', side: '#8b5a2b', kind: 'grass' },
  [B.Ice]: { name: 'Ghiaccio', top: '#b3e5fc', side: '#8fd3f4', kind: 'glass' },
  [B.Diamond]: { name: 'Diamante', top: '#9e9e9e', side: '#8a8a8a', ore: '#4dd0e1' },
  [B.Gold]: { name: 'Oro', top: '#9e9e9e', side: '#8a8a8a', ore: '#ffca28' },
  [B.Coal]: { name: 'Carbone', top: '#9e9e9e', side: '#8a8a8a', ore: '#263238' },
  [B.Crystal]: { name: 'Cristallo', top: '#ce93d8', side: '#ab47bc', kind: 'glass', glow: true },
  [B.Brick]: { name: 'Mattoncino rosso', top: '#e53935', side: '#c62828', kind: 'brick' },
  [B.Obsidian]: { name: 'Ossidiana', top: '#2d1b3d', side: '#21142e' },
  [B.Planks]: { name: 'Assi', top: '#d4a35f', side: '#bf8f4e', kind: 'planks' },
  [B.Emerald]: { name: 'Smeraldo', top: '#9e9e9e', side: '#8a8a8a', ore: '#00e676' },
  [B.Flowers]: { name: 'Prato fiorito', top: '#5cbf3a', side: '#8b5a2b', kind: 'flowers' },
  [B.BrickBlue]: { name: 'Mattoncino blu', top: '#1e88e5', side: '#1565c0', kind: 'brick' },
  [B.BrickYellow]: { name: 'Mattoncino giallo', top: '#fdd835', side: '#f9a825', kind: 'brick' },
  [B.Iron]: { name: 'Ferro', top: '#9e9e9e', side: '#8a8a8a', ore: '#f0c8a0' },
};

function hash(a: number, b: number, c: number) {
  let x = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  x = (x ^ (x >>> 13)) * 1274126177;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

export interface CubeOpts {
  glitch?: number; // 0..1 corruzione viola
  seed?: number;
  alpha?: number;
  top?: boolean; // disegna faccia superiore (default sì)
}

type P = [number, number];

function quad(ctx: CanvasRenderingContext2D, o: P, u: P, v: P, i: number, j: number, n: number, color: string) {
  const a: P = [o[0] + (u[0] * i) / n + (v[0] * j) / n, o[1] + (u[1] * i) / n + (v[1] * j) / n];
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(a[0] + u[0] / n, a[1] + u[1] / n);
  ctx.lineTo(a[0] + u[0] / n + v[0] / n, a[1] + u[1] / n + v[1] / n);
  ctx.lineTo(a[0] + v[0] / n, a[1] + v[1] / n);
  ctx.closePath();
  ctx.fill();
  // piccola sovrapposizione per evitare le fessure di antialiasing
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

function faceColor(def: BlockDef, face: 0 | 1 | 2, i: number, j: number, n: number, seed: number, t: B): string {
  const h = hash(i + seed * 7, j + face * 31, t * 13 + seed);
  const isTop = face === 0;
  let base = isTop ? def.top : def.side;
  let c = shade(base, (h - 0.5) * 0.18);
  switch (def.kind) {
    case 'grass':
      if (!isTop) {
        if (j === 0 || (j === 1 && h < 0.4)) c = shade(def.top, (h - 0.5) * 0.15);
      }
      break;
    case 'flowers':
      if (isTop && h > 0.86) c = ['#ff5252', '#ffeb3b', '#ffffff', '#e040fb'][Math.floor(h * 100) % 4];
      else if (!isTop && (j === 0 || (j === 1 && h < 0.4))) c = shade(def.top, (h - 0.5) * 0.15);
      break;
    case 'log':
      if (isTop) {
        const d = Math.max(Math.abs(i - (n - 1) / 2), Math.abs(j - (n - 1) / 2));
        c = d >= (n - 1) / 2 ? '#6d4c2f' : shade(def.top, d % 1 === 0.5 || Math.round(d) % 2 ? -0.12 : 0.05);
      } else c = shade(def.side, i % 2 ? -0.1 : 0.05 + (h - 0.5) * 0.1);
      break;
    case 'planks':
      c = shade(base, (j % 2 ? -0.08 : 0.04) + (h - 0.5) * 0.08);
      if (!isTop && (i + (j % 2) * 2) % 4 === 0) c = shade(base, -0.2);
      break;
    case 'brick':
      c = shade(base, (h - 0.5) * 0.06);
      break;
    case 'water':
      c = shade(base, Math.sin((i + j) * 1.3 + seed) * 0.08);
      break;
    case 'lava':
      c = h > 0.75 ? def.ore! : shade(base, (h - 0.5) * 0.25);
      break;
    case 'glass':
      c = shade(base, i === j ? 0.35 : (h - 0.5) * 0.1);
      break;
  }
  if (def.ore && def.kind !== 'lava' && h > 0.72 && (i + j) % 2 === 0) c = shade(def.ore, (h - 0.8) * 0.4);
  return c;
}

/**
 * Disegna un cubo isometrico. (x,y) = vertice superiore della faccia in alto, s = mezza larghezza.
 */
export function drawCube(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: B, o: CubeOpts = {}) {
  const def = BLOCKS[t];
  const n = s >= 14 ? 4 : 3;
  const seed = o.seed ?? 1;
  const g = o.glitch || 0;
  const tint = (c: string, lum: number) => {
    let r = shade(c, lum);
    if (g > 0) r = mix(mix(r, gray(r), g * 1.4 > 1 ? 1 : g * 1.4), '#8e44ad', g * 0.45);
    return r;
  };
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  const top: P = [x, y];
  const right: P = [x + s, y + s / 2];
  const left: P = [x - s, y + s / 2];
  const bottom: P = [x, y + s];
  const isWater = def.kind === 'water';
  const hgt = isWater ? s * 0.85 : s;
  // faccia sinistra
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) quad(ctx, left, [s, s / 2], [0, hgt], i, j, n, tint(faceColor(def, 1, i, j, n, seed, t), -0.18));
  // faccia destra
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) quad(ctx, bottom, [s, -s / 2], [0, hgt], i, j, n, tint(faceColor(def, 2, i, j, n, seed, t), -0.34));
  if (o.top !== false) {
    const off = isWater ? s * 0.15 : 0;
    const tp: P = [top[0], top[1] + off];
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) quad(ctx, tp, [s, s / 2], [-s, s / 2], i, j, n, tint(faceColor(def, 0, i, j, n, seed, t), 0));
  }
  // bottoncini sui mattoncini
  if (def.kind === 'brick') {
    for (const [u, v] of [
      [0.28, 0.28],
      [0.72, 0.28],
      [0.28, 0.72],
      [0.72, 0.72],
    ]) {
      const cx = top[0] + (u - v) * s;
      const cy = top[1] + (u + v) * (s / 2);
      ctx.fillStyle = tint(def.side, -0.1);
      ctx.beginPath();
      ctx.ellipse(cx, cy + s * 0.04, s * 0.17, s * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - s * 0.17, cy - s * 0.08, s * 0.34, s * 0.12);
      ctx.fillStyle = tint(def.top, 0.25);
      ctx.beginPath();
      ctx.ellipse(cx, cy - s * 0.08, s * 0.17, s * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // bordi scuri leggeri
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = Math.max(0.5, s * 0.04);
  ctx.beginPath();
  ctx.moveTo(left[0], left[1]);
  ctx.lineTo(top[0], top[1]);
  ctx.lineTo(right[0], right[1]);
  ctx.lineTo(right[0], right[1] + hgt);
  ctx.lineTo(bottom[0], bottom[1] + hgt);
  ctx.lineTo(left[0], left[1] + hgt);
  ctx.closePath();
  ctx.moveTo(left[0], left[1]);
  ctx.lineTo(bottom[0], bottom[1]);
  ctx.lineTo(right[0], right[1]);
  ctx.moveTo(bottom[0], bottom[1]);
  ctx.lineTo(bottom[0], bottom[1] + hgt);
  ctx.stroke();
  if (def.glow && !g) {
    ctx.fillStyle = def.kind === 'lava' ? 'rgba(255,170,0,0.12)' : 'rgba(234,128,252,0.15)';
    ctx.beginPath();
    ctx.arc(x, y + s, s * 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Proiezione isometrica di una cella della griglia. */
export function iso(gx: number, gy: number, gz: number, s: number, ox: number, oy: number): [number, number] {
  return [(gx - gy) * s + ox, (gx + gy) * (s / 2) - gz * s + oy];
}
