import type { Gen, SkillId } from './types';
import { count, addsub, mult, compare, word, shapes, balance } from './math';
import { sequence, oddone } from './logic';
import { maze } from './maze';
import { build } from './build';
import { sudoku } from './sudoku';
import { mining } from './mining';
import { crafting } from './crafting';

export const GENERATORS: Record<SkillId, Gen> = {
  count,
  addsub,
  mult,
  compare,
  word,
  shapes,
  balance,
  sequence,
  oddone,
  maze,
  build,
  sudoku,
  mining,
  crafting,
};
