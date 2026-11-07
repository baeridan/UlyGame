/** Generatore pseudo-casuale con seme (mulberry32). */
export type Rng = {
  (): number;
  int(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  chance(p: number): boolean;
};

export function makeRng(seed: number = Math.floor(Math.random() * 2 ** 31)): Rng {
  let s = seed >>> 0;
  const r = (() => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }) as Rng;
  r.int = (min, max) => min + Math.floor(r() * (max - min + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  return r;
}
