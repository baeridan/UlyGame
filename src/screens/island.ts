import { B, drawCube, iso } from '../art/blocks';
import { makeRng } from '../core/rng';

export interface Column {
  x: number;
  y: number;
  blocks: B[];
  zone: number; // 0..5, 6 = castello, -1 = mare
}

export const N = 22;
const C = (N - 1) / 2;
/** rotazione dei settori: nessuna zona finisce dietro la torre centrale */
const OFF = Math.PI / 12;

export function zoneAt(x: number, y: number): number {
  const dx = x - C;
  const dy = y - C;
  const d = Math.hypot(dx, dy);
  if (d < 2.6) return 6;
  // settori in senso orario partendo dal basso a sinistra (vicino alla "spiaggia d'arrivo")
  const a = (Math.atan2(dy, dx) + Math.PI * 2 + OFF) % (Math.PI * 2);
  return Math.floor((a / (Math.PI * 2)) * 6) % 6;
}

let cache: Column[] | null = null;

export function island(): Column[] {
  if (cache) return cache;
  const rng = makeRng(20261107);
  const cols: Column[] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = x - C;
      const dy = y - C;
      const d = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      const radius = 9.2 + Math.sin(ang * 3) * 0.8 + Math.cos(ang * 5) * 0.5;
      if (d > radius) {
        cols.push({ x, y, blocks: [B.Water], zone: -1 });
        continue;
      }
      const z = zoneAt(x, y);
      const edge = d > radius - 1.3;
      let blocks: B[] = [B.Dirt];
      const sectorCenter = ((z + 0.5) / 6) * Math.PI * 2 - OFF;
      const scx = C + Math.cos(sectorCenter) * 6;
      const scy = C + Math.sin(sectorCenter) * 6;
      const dc = Math.hypot(x - scx, y - scy);
      switch (z) {
        case 0:
          blocks = [B.Dirt, edge ? B.Sand : B.Flowers];
          break;
        case 1:
          blocks = [B.Dirt, edge ? B.Sand : B.Grass];
          if (!edge && rng.chance(0.22)) blocks.push(B.Wood, B.Wood, B.Leaves);
          break;
        case 2:
          blocks = [B.Sand];
          if (!edge && rng.chance(0.08)) blocks.push(B.BrickYellow);
          break;
        case 3: {
          const hgt = Math.max(1, Math.round(3.2 - dc * 0.6));
          blocks = [B.Stone];
          for (let i = 1; i < hgt; i++) blocks.push(rng.chance(0.18) ? rng.pick([B.Diamond, B.Gold, B.Coal, B.Emerald]) : B.Stone);
          if (edge) blocks = [B.Sand];
          break;
        }
        case 4: {
          const hgt = Math.max(1, Math.round(5 - dc * 1.1));
          blocks = [];
          for (let i = 0; i < hgt; i++) blocks.push(B.Obsidian);
          if (hgt >= 4 && dc < 0.9) blocks[blocks.length - 1] = B.Lava;
          else if (hgt <= 2 && rng.chance(0.15)) blocks[blocks.length - 1] = B.Lava;
          break;
        }
        case 5: {
          const hgt = Math.max(1, Math.round(4.6 - dc * 0.9));
          blocks = [B.Stone];
          for (let i = 1; i < hgt; i++) blocks.push(B.Stone);
          blocks[blocks.length - 1] = B.Snow;
          if (!edge && hgt === 1 && rng.chance(0.2)) blocks.push(B.Ice);
          break;
        }
        case 6: {
          blocks = [B.Stone, B.Obsidian];
          break;
        }
      }
      cols.push({ x, y, blocks, zone: z });
    }
  cache = cols;
  return cols;
}

export const TOWER_CELL = { x: Math.round(C), y: Math.round(C) };

export function zoneAnchor(z: number): { x: number; y: number } {
  if (z === 6) return TOWER_CELL;
  const a = ((z + 0.5) / 6) * Math.PI * 2 - OFF;
  return { x: Math.round(C + Math.cos(a) * 7), y: Math.round(C + Math.sin(a) * 7) };
}

export interface RenderInfo {
  s: number;
  ox: number;
  oy: number;
  heightAt(x: number, y: number): number;
}

/** Disegna l'isola. done[z] = zona liberata (colori pieni), towerBuilt = torre ricostruita. */
export function drawIsland(ctx: CanvasRenderingContext2D, W: number, H: number, done: boolean[], towerBuilt: boolean): RenderInfo {
  const cols = island();
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
      for (let i = 0; i < towerH; i++) blocks.push(towerBuilt ? [B.Brick, B.BrickBlue, B.BrickYellow][i % 3] : i === towerH - 1 ? B.Crystal : B.Obsidian);
    }
    const g = c.zone >= 0 && c.zone < 6 ? (done[c.zone] ? 0 : 0.5) : c.zone === 6 ? (towerBuilt ? 0 : 0.5) : 0;
    blocks.forEach((b, z) => {
      const [x, y] = iso(c.x, c.y, z + 1, s, ox, oy);
      drawCube(ctx, x, y + (b === B.Water ? s * 0.3 : 0), s, b, { seed: c.x * 31 + c.y * 7 + z, glitch: g });
    });
    hmap.set(`${c.x},${c.y}`, blocks.length);
  }
  return { s, ox, oy, heightAt: (x, y) => hmap.get(`${x},${y}`) || 1 };
}
