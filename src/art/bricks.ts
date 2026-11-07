import { shade } from './color';

export interface Model {
  rows: string[];
  colors: Record<string, string>;
}

export interface BrickSeg {
  x: number; // colonna
  y: number; // riga
  len: number;
  color: string;
  studs: boolean[]; // un bottoncino per cella se sopra è vuoto
}

const COMMON: Record<string, string> = {
  e: '#1b1b1b',
  W: '#fafafa',
  K: '#263238',
  R: '#c62828',
};

export function modelColor(m: Model, ch: string): string | null {
  if (ch === '.' || ch === ' ') return null;
  return m.colors[ch] || COMMON[ch] || '#999999';
}

export function modelSize(m: Model) {
  return { w: Math.max(...m.rows.map((r) => r.length)), h: m.rows.length };
}

/** Divide il modello in mattoncini (fino a 3 celle dello stesso colore), dal basso verso l'alto. */
export function segments(m: Model): BrickSeg[] {
  const out: BrickSeg[] = [];
  const at = (x: number, y: number) => (y < 0 ? '.' : m.rows[y]?.[x] ?? '.');
  for (let y = m.rows.length - 1; y >= 0; y--) {
    const row = m.rows[y];
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      const col = modelColor(m, ch);
      if (!col) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) run++;
      // spezza il blocco in mattoncini da 2 o 3 alternando l'inizio per riga (effetto muro)
      let pos = 0;
      let first = y % 2 === 0 ? 2 : 3;
      while (pos < run) {
        let len = Math.min(first, run - pos);
        if (run - pos - len === 1 && len > 1) len--; // evita mattoncini da 1 alla fine
        first = 2 + ((pos + y) % 2);
        const studs: boolean[] = [];
        for (let i = 0; i < len; i++) studs.push(modelColor(m, at(x + pos + i, y - 1)) === null);
        out.push({ x: x + pos, y, len, color: col, studs });
        pos += len;
      }
      x += run;
    }
  }
  return out;
}

export function drawBrick(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, s: number, color: string, studs: boolean[]) {
  const g = Math.max(0.6, s * 0.04);
  // bottoncini
  const sw = s * 0.56;
  const sh = s * 0.2;
  studs.forEach((st, i) => {
    if (!st) return;
    const sx = x + i * s + (s - sw) / 2;
    const sy = y - sh + g;
    ctx.fillStyle = shade(color, -0.12);
    ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = shade(color, 0.28);
    ctx.fillRect(sx + sw * 0.12, sy + sh * 0.15, sw * 0.22, sh * 0.6);
  });
  // corpo
  ctx.fillStyle = color;
  ctx.fillRect(x + g, y + g, w - 2 * g, s - 2 * g);
  ctx.fillStyle = shade(color, 0.22);
  ctx.fillRect(x + g, y + g, w - 2 * g, s * 0.16);
  ctx.fillStyle = shade(color, -0.22);
  ctx.fillRect(x + g, y + s - g - s * 0.14, w - 2 * g, s * 0.14);
  ctx.fillStyle = shade(color, 0.12);
  ctx.fillRect(x + g, y + g, s * 0.1, s - 2 * g);
  ctx.strokeStyle = shade(color, -0.45);
  ctx.lineWidth = g;
  ctx.strokeRect(x + g / 2, y + g / 2, w - g, s - g);
}

export interface DrawOpts {
  cell: number;
  ox?: number;
  oy?: number;
  /** quanti mattoncini mostrare (per l'animazione di costruzione) */
  count?: number;
  /** offset verticale (px) per mattoncino i, per farli "cadere" */
  dropFor?: (i: number) => number;
  flip?: boolean;
  /** spostamento per riga (per far muovere testa/coda) */
  rowShift?: (row: number) => number;
  segs?: BrickSeg[];
}

export function drawModel(ctx: CanvasRenderingContext2D, m: Model, o: DrawOpts) {
  const segs = o.segs || segments(m);
  const { w } = modelSize(m);
  const n = o.count === undefined ? segs.length : Math.min(o.count, segs.length);
  const s = o.cell;
  for (let i = 0; i < n; i++) {
    const b = segs[i];
    let x = b.x;
    let studs = b.studs;
    if (o.flip) {
      x = w - b.x - b.len;
      studs = studs.slice().reverse();
    }
    const px = (o.ox || 0) + x * s + (o.rowShift ? o.rowShift(b.y) : 0);
    const py = (o.oy || 0) + b.y * s - (o.dropFor ? o.dropFor(i) : 0);
    drawBrick(ctx, px, py, b.len * s, s, b.color, studs);
  }
}

/** Crea un canvas ad alta risoluzione della dimensione CSS indicata. */
export function hiCanvas(cssW: number, cssH: number, cls = '') {
  const c = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.round(cssW * dpr);
  c.height = Math.round(cssH * dpr);
  c.style.width = cssW + 'px';
  c.style.height = cssH + 'px';
  if (cls) c.className = cls;
  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return { c, ctx, dpr };
}

/** Calcola la cella per far stare il modello in w×h. */
export function fitCell(m: Model, w: number, h: number) {
  const sz = modelSize(m);
  return Math.floor(Math.min(w / sz.w, h / (sz.h + 0.3)));
}
