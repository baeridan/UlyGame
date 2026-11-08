import { B, drawCube, iso } from '../art/blocks';
import { makeRng } from '../core/rng';

export type Act = 1 | 2;

export interface Column {
  x: number;
  y: number;
  blocks: B[];
  zone: number; // indice locale della zona, = numero di zone per il centro, -1 = mare
}

export const N = 22;
const C = (N - 1) / 2;
/** rotazione dei settori: nessuna zona finisce dietro la torre centrale */
const OFF: Record<Act, number> = { 1: Math.PI / 12, 2: -Math.PI / 10 };
const COUNT: Record<Act, number> = { 1: 6, 2: 5 };

export const zoneCount = (act: Act) => COUNT[act];

export function zoneAt(x: number, y: number, act: Act): number {
  const n = COUNT[act];
  const dx = x - C;
  const dy = y - C;
  if (Math.hypot(dx, dy) < 2.6) return n;
  const a = (Math.atan2(dy, dx) + Math.PI * 2 + OFF[act]) % (Math.PI * 2);
  return Math.floor((a / (Math.PI * 2)) * n) % n;
}

const sectorAngle = (z: number, act: Act) => ((z + 0.5) / COUNT[act]) * Math.PI * 2 - OFF[act];

const cache = new Map<Act, Column[]>();

function biome1(z: number, edge: boolean, dc: number, rng: ReturnType<typeof makeRng>): B[] {
  switch (z) {
    case 0:
      return [B.Dirt, edge ? B.Sand : B.Flowers];
    case 1: {
      const b = [B.Dirt, edge ? B.Sand : B.Grass];
      if (!edge && rng.chance(0.22)) b.push(B.Wood, B.Wood, B.Leaves);
      return b;
    }
    case 2: {
      const b = [B.Sand];
      if (!edge && rng.chance(0.08)) b.push(B.BrickYellow);
      return b;
    }
    case 3: {
      if (edge) return [B.Sand];
      const hgt = Math.max(1, Math.round(3.2 - dc * 0.6));
      const b = [B.Stone];
      for (let i = 1; i < hgt; i++) b.push(rng.chance(0.18) ? rng.pick([B.Diamond, B.Gold, B.Coal, B.Emerald]) : B.Stone);
      return b;
    }
    case 4: {
      const hgt = Math.max(1, Math.round(5 - dc * 1.1));
      const b: B[] = [];
      for (let i = 0; i < hgt; i++) b.push(B.Obsidian);
      if (hgt >= 4 && dc < 0.9) b[b.length - 1] = B.Lava;
      else if (hgt <= 2 && rng.chance(0.15)) b[b.length - 1] = B.Lava;
      return b;
    }
    case 5: {
      const hgt = Math.max(1, Math.round(4.6 - dc * 0.9));
      const b: B[] = [];
      for (let i = 0; i < hgt; i++) b.push(B.Stone);
      b[b.length - 1] = B.Snow;
      if (!edge && hgt === 1 && rng.chance(0.2)) b.push(B.Ice);
      return b;
    }
  }
  return [B.Stone, B.Obsidian];
}

function biome2(z: number, edge: boolean, dc: number, rng: ReturnType<typeof makeRng>, x: number, y: number): B[] {
  switch (z) {
    case 0: {
      // il Ponte del Cento: una fila di mattoncini rossi e blu a gruppi di 5
      const a = sectorAngle(0, 2);
      const t = (x - C) * Math.cos(a) + (y - C) * Math.sin(a);
      const off = Math.abs(-(x - C) * Math.sin(a) + (y - C) * Math.cos(a));
      if (off < 0.7 && t > 2) return [B.Sand, Math.floor(t) % 2 ? B.Brick : B.BrickBlue];
      if (!edge && rng.chance(0.18)) return [B.Water];
      return [B.Dirt, edge ? B.Sand : B.Planks];
    }
    case 1: {
      if (edge) return [B.Water];
      const b = [B.Sand];
      if (rng.chance(0.22)) b.push(B.Planks);
      if (rng.chance(0.06)) b.push(B.Wood, B.Wood);
      return b;
    }
    case 2: {
      if (edge) return [B.Stone];
      const hgt = Math.max(1, Math.round(4 - dc * 0.7));
      const b = [B.Stone];
      for (let i = 1; i < hgt; i++) b.push(rng.chance(0.2) ? rng.pick([B.Crystal, B.Coal, B.Obsidian]) : B.Stone);
      return b;
    }
    case 3: {
      const b = [B.Dirt, edge ? B.Sand : B.Flowers];
      if (!edge && rng.chance(0.14)) b.push(B.Wood, B.Leaves);
      return b;
    }
    case 4: {
      if (edge) return [B.Stone];
      const b = [B.Stone];
      if (rng.chance(0.25)) b.push(rng.pick([B.BrickYellow, B.Iron, B.BrickBlue]), B.Iron);
      else if (rng.chance(0.2)) b.push(B.Iron);
      return b;
    }
  }
  return [B.Stone, B.Planks];
}

export function island(act: Act = 1): Column[] {
  const hit = cache.get(act);
  if (hit) return hit;
  const rng = makeRng(act === 1 ? 20261107 : 20270301);
  const cols: Column[] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = x - C;
      const dy = y - C;
      const d = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      const radius = act === 1 ? 9.2 + Math.sin(ang * 3) * 0.8 + Math.cos(ang * 5) * 0.5 : 9 + Math.sin(ang * 2 + 1) * 0.9 + Math.cos(ang * 4) * 0.4;
      if (d > radius) {
        cols.push({ x, y, blocks: [B.Water], zone: -1 });
        continue;
      }
      const z = zoneAt(x, y, act);
      const edge = d > radius - 1.3;
      const sa = sectorAngle(z, act);
      const dc = Math.hypot(x - (C + Math.cos(sa) * 6), y - (C + Math.sin(sa) * 6));
      const blocks = z === COUNT[act] ? [B.Stone, act === 1 ? B.Obsidian : B.Planks] : act === 1 ? biome1(z, edge, dc, rng) : biome2(z, edge, dc, rng, x, y);
      cols.push({ x, y, blocks, zone: z });
    }
  cache.set(act, cols);
  return cols;
}

export const TOWER_CELL = { x: Math.round(C), y: Math.round(C) };

/** Posizione del segnaposto: zona locale z, oppure il centro se z = numero di zone. */
export function zoneAnchor(z: number, act: Act = 1): { x: number; y: number } {
  if (z >= COUNT[act]) return TOWER_CELL;
  const a = sectorAngle(z, act);
  return { x: Math.round(C + Math.cos(a) * 7), y: Math.round(C + Math.sin(a) * 7) };
}

export interface RenderInfo {
  s: number;
  ox: number;
  oy: number;
  heightAt(x: number, y: number): number;
}

/**
 * Disegna l'isola. done[z] = zona liberata (colori pieni), towerBuilt = torre (o faro) ricostruita.
 * Nella prima isola al centro c'è la Grande Torre, nella seconda il Faro del Cento.
 */
export function drawIsland(ctx: CanvasRenderingContext2D, W: number, H: number, done: boolean[], towerBuilt: boolean, act: Act = 1): RenderInfo {
  const cols = island(act);
  const n = COUNT[act];
  const s = Math.max(6, Math.floor(Math.min(W / (N * 2 - (W < 600 ? 8 : 4)), H / (N + 9))));
  const ox = W / 2;
  const oy = (H - (N * s + 6 * s)) / 2 + 6 * s;
  ctx.clearRect(0, 0, W, H);
  const towerH = 7;
  const sorted = cols.slice().sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x);
  const hmap = new Map<string, number>();
  for (const c of sorted) {
    const isTower = c.x === TOWER_CELL.x && c.y === TOWER_CELL.y;
    let blocks = c.blocks;
    if (isTower) {
      blocks = [B.Stone];
      for (let i = 0; i < towerH; i++) {
        if (act === 1) blocks.push(towerBuilt ? [B.Brick, B.BrickBlue, B.BrickYellow][i % 3] : i === towerH - 1 ? B.Crystal : B.Obsidian);
        else blocks.push(i === towerH - 1 ? (towerBuilt ? B.Ice : B.Coal) : towerBuilt ? (i % 2 ? B.BrickYellow : B.Brick) : B.Obsidian);
      }
    }
    const g = c.zone >= 0 && c.zone < n ? (done[c.zone] ? 0 : 0.5) : c.zone === n ? (towerBuilt ? 0 : 0.5) : 0;
    blocks.forEach((b, z) => {
      const [x, y] = iso(c.x, c.y, z + 1, s, ox, oy);
      drawCube(ctx, x, y + (b === B.Water ? s * 0.3 : 0), s, b, { seed: c.x * 31 + c.y * 7 + z, glitch: g });
    });
    hmap.set(`${c.x},${c.y}`, blocks.length);
  }
  return { s, ox, oy, heightAt: (x, y) => hmap.get(`${x},${y}`) || 1 };
}
