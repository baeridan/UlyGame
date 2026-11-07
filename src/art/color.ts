export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number) {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** amt > 0 schiarisce, < 0 scurisce (-1..1) */
export function shade(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex);
  if (amt >= 0) return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}

export function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function gray(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  const l = r * 0.3 + g * 0.59 + b * 0.11;
  return rgbToHex(l, l, l);
}

/** Colori dei mattoncini usati nei giochi (con nome e simbolo per daltonici). */
export const BRICK = [
  { id: 'rosso', hex: '#e53935', sym: '●' },
  { id: 'blu', hex: '#1e88e5', sym: '■' },
  { id: 'giallo', hex: '#fdd835', sym: '▲' },
  { id: 'verde', hex: '#43a047', sym: '★' },
  { id: 'arancione', hex: '#fb8c00', sym: '◆' },
  { id: 'viola', hex: '#8e24aa', sym: '♥' },
] as const;
