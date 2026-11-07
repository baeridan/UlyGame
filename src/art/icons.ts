import { drawCube, B } from './blocks';
import { drawModel, fitCell, modelSize, type Model } from './bricks';
import { shade } from './color';

const cache = new Map<string, string>();

function render(key: string, w: number, hgt: number, fn: (ctx: CanvasRenderingContext2D) => void) {
  const k = `${key}@${w}x${hgt}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w * 2;
  c.height = hgt * 2;
  const ctx = c.getContext('2d')!;
  ctx.scale(2, 2);
  fn(ctx);
  const url = c.toDataURL();
  cache.set(k, url);
  return url;
}

export function blockIcon(t: B, size = 64) {
  return render(`block${t}`, size, size, (ctx) => {
    const s = size * 0.46;
    drawCube(ctx, size / 2, size * 0.04, s, t, { seed: 3 });
  });
}

export function eggIcon(color = '#fff3e0', size = 56) {
  return render(`egg${color}`, size, size, (ctx) => {
    const cx = size / 2;
    const cy = size * 0.55;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(cx, size * 0.92, size * 0.28, size * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(cx - size * 0.1, cy - size * 0.18, 2, cx, cy, size * 0.45);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 0.3, size * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = shade(color, -0.35);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = shade(color, -0.25);
    for (const [dx, dy, r] of [
      [-0.1, -0.05, 0.05],
      [0.1, 0.1, 0.06],
      [0.05, -0.2, 0.04],
      [-0.12, 0.18, 0.04],
    ]) {
      ctx.beginPath();
      ctx.arc(cx + dx * size, cy + dy * size, r * size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Mattoncino 2x1 visto di lato */
export function brickIcon(color: string, size = 56, studs = 2) {
  return render(`brick${color}${studs}`, size, size, (ctx) => {
    const w = size * 0.86;
    const hh = size * 0.42;
    const x = (size - w) / 2;
    const y = size * 0.4;
    const sw = (w / studs) * 0.5;
    for (let i = 0; i < studs; i++) {
      const sx = x + (w / studs) * i + (w / studs - sw) / 2;
      ctx.fillStyle = shade(color, -0.1);
      ctx.fillRect(sx, y - size * 0.12, sw, size * 0.14);
      ctx.fillStyle = shade(color, 0.3);
      ctx.fillRect(sx + sw * 0.15, y - size * 0.1, sw * 0.22, size * 0.08);
    }
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, hh);
    ctx.fillStyle = shade(color, 0.2);
    ctx.fillRect(x, y, w, hh * 0.18);
    ctx.fillStyle = shade(color, -0.22);
    ctx.fillRect(x, y + hh * 0.82, w, hh * 0.18);
    ctx.strokeStyle = shade(color, -0.45);
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, hh);
  });
}

export function modelIcon(key: string, m: Model, w = 96, hgt = 72, flip = false) {
  return render(`model${key}${flip}`, w, hgt, (ctx) => {
    const cell = fitCell(m, w * 0.92, hgt * 0.9);
    const sz = modelSize(m);
    drawModel(ctx, m, { cell, ox: (w - sz.w * cell) / 2, oy: hgt - sz.h * cell - 2, flip });
  });
}

export function img(src: string, cls = 'icon', alt = '') {
  const i = new Image();
  i.src = src;
  i.className = cls;
  i.alt = alt;
  i.draggable = false;
  return i;
}
