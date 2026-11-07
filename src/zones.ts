import type { SkillId } from './games/types';
import type { DinoId } from './art/dinos';
import { B } from './art/blocks';

export interface Zone {
  id: number;
  name: string;
  short: string;
  emoji: string;
  skills: SkillId[];
  dino: DinoId;
  crystal: string;
  color: string;
  missions: string[];
  ground: B;
  sky: [string, string];
  /** livello minimo delle sfide in questa zona (la storia diventa più impegnativa) */
  minLevel?: Partial<Record<SkillId, number>>;
}

export const ZONES: Zone[] = [
  {
    id: 0,
    name: 'Prateria Fiorita',
    short: 'Prateria',
    emoji: '🌼',
    skills: ['count', 'addsub', 'compare'],
    dino: 'trice',
    crystal: 'Cristallo del Conteggio',
    color: '#5cbf3a',
    missions: ['Le uova nel prato', 'Il recinto dei numeri', 'Il T-Rex affamato'],
    ground: B.Flowers,
    sky: ['#8fd3ff', '#d6f3ff'],
  },
  {
    id: 1,
    name: 'Giungla Smeraldo',
    short: 'Giungla',
    emoji: '🌴',
    skills: ['sequence', 'oddone', 'word'],
    dino: 'stego',
    crystal: 'Cristallo delle Sequenze',
    color: '#2e8b3a',
    missions: ['Le liane colorate', "L'intruso nella giungla", 'I problemi delle scimmie'],
    ground: B.Leaves,
    sky: ['#7fd6a0', '#e0ffe9'],
  },
  {
    id: 2,
    name: 'Spiaggia dei Mattoncini',
    short: 'Spiaggia',
    emoji: '🏖️',
    skills: ['shapes', 'build', 'mult'],
    dino: 'ptero',
    crystal: 'Cristallo delle Forme',
    color: '#f3e08f',
    missions: ['Forme sulla sabbia', 'Castelli di mattoncini', 'File di conchiglie'],
    ground: B.Sand,
    sky: ['#5ec8ff', '#fff3c4'],
  },
  {
    id: 3,
    name: 'Miniera di Cristallo',
    short: 'Miniera',
    emoji: '⛏️',
    skills: ['mining', 'crafting', 'count'],
    dino: 'ankylo',
    crystal: 'Cristallo dei Minerali',
    color: '#9e9e9e',
    missions: ['Il primo piccone', 'Diamanti nascosti', 'Le torri di decine'],
    ground: B.Stone,
    sky: ['#3d3a5c', '#8c7fb8'],
    minLevel: { count: 3, mining: 3, crafting: 2 },
  },
  {
    id: 4,
    name: 'Vulcano Brontolone',
    short: 'Vulcano',
    emoji: '🌋',
    skills: ['balance', 'maze', 'mult'],
    dino: 'trex',
    crystal: "Cristallo dell'Equilibrio",
    color: '#ff7a1a',
    missions: ['La bilancia di lava', 'Il sentiero sicuro', 'Le rocce in fila'],
    ground: B.Obsidian,
    sky: ['#ff9a5c', '#ffe0b2'],
    minLevel: { balance: 3, mult: 3, maze: 3 },
  },
  {
    id: 5,
    name: 'Vette Ghiacciate',
    short: 'Ghiacciai',
    emoji: '🏔️',
    skills: ['sudoku', 'word', 'addsub'],
    dino: 'brachio',
    crystal: 'Cristallo della Logica',
    color: '#ffffff',
    missions: ['Il sudoku di ghiaccio', 'La valanga di problemi', 'La cima dei numeri'],
    ground: B.Snow,
    sky: ['#9fd8ff', '#ffffff'],
    minLevel: { addsub: 4, word: 4, sudoku: 3 },
  },
];

export const BOSS_SKILLS: SkillId[] = ['addsub', 'sequence', 'compare', 'balance', 'oddone', 'mult', 'word', 'shapes', 'count', 'addsub'];

export const BOSS_MIN: Partial<Record<SkillId, number>> = { addsub: 4, word: 4, compare: 4, count: 3, mult: 3, balance: 3 };
