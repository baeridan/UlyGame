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
  /** livello minimo per missione (0, 1, 2): la difficoltà cresce missione dopo missione */
  missionMin?: Partial<Record<SkillId, number>>[];
  /** abilità principale: metà delle sfide della missione */
  primary?: SkillId;
  act: 1 | 2;
  /** ricompensa della zona (cristallo nella prima isola, uovo d'oro nella seconda) */
  reward: string;
}

export const ZONES: Zone[] = [
  {
    id: 0,
    name: 'Prateria Fiorita',
    short: 'Prateria',
    emoji: '🌼',
    skills: ['count', 'addsub', 'compare'],
    dino: 'trice',
    act: 1,
    reward: '💎',
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
    act: 1,
    reward: '💎',
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
    act: 1,
    reward: '💎',
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
    act: 1,
    reward: '💎',
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
    act: 1,
    reward: '💎',
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
    act: 1,
    reward: '💎',
    crystal: 'Cristallo della Logica',
    color: '#ffffff',
    missions: ['Il sudoku di ghiaccio', 'La valanga di problemi', 'La cima dei numeri'],
    ground: B.Snow,
    sky: ['#9fd8ff', '#ffffff'],
    minLevel: { addsub: 4, word: 4, sudoku: 3 },
  },
  // ---------------- Seconda isola: l'Isola Lontana ----------------
  {
    id: 6,
    act: 2,
    reward: '🥚',
    name: 'Ponte del Cento',
    short: 'Ponte',
    emoji: '🌉',
    skills: ['line100', 'count', 'compare'],
    primary: 'line100',
    dino: 'raptor',
    crystal: "Uovo d'Oro di Veloce",
    color: '#e53935',
    missions: ['Le torrette del ponte', 'Passi e salti', 'Il grande salto'],
    ground: B.Planks,
    sky: ['#7ec8ff', '#e3f6ff'],
    minLevel: { count: 3, compare: 3 },
    missionMin: [{ line100: 1 }, { line100: 2 }, { line100: 3 }],
  },
  {
    id: 7,
    act: 2,
    reward: '🥚',
    name: 'Porto del Riporto',
    short: 'Porto',
    emoji: '⚓',
    skills: ['coladd', 'line100', 'addsub'],
    primary: 'coladd',
    dino: 'mosa',
    crystal: "Uovo d'Oro di Mosa",
    color: '#1e88e5',
    missions: ['Casse leggere', 'Il primo riporto', 'Carichi pesanti'],
    ground: B.Sand,
    sky: ['#62b6ff', '#d5f0ff'],
    minLevel: { addsub: 4, line100: 3 },
    missionMin: [{ coladd: 1 }, { coladd: 3 }, { coladd: 4, line100: 4 }],
  },
  {
    id: 8,
    act: 2,
    reward: '🥚',
    name: 'Grotta del Prestito',
    short: 'Grotta',
    emoji: '🦇',
    skills: ['colsub', 'line100', 'word'],
    primary: 'colsub',
    dino: 'pachy',
    crystal: "Uovo d'Oro di Pachy",
    color: '#7e57c2',
    missions: ['Sottrazioni facili', 'Il primo prestito', 'La grotta profonda'],
    ground: B.Stone,
    sky: ['#2c2445', '#6f5fa8'],
    minLevel: { line100: 4, word: 4 },
    missionMin: [{ colsub: 1 }, { colsub: 3 }, { colsub: 4 }],
  },
  {
    id: 9,
    act: 2,
    reward: '🥚',
    name: 'Giardino delle Tabelline',
    short: 'Giardino',
    emoji: '🌻',
    skills: ['tables', 'mult', 'sequence'],
    primary: 'tables',
    dino: 'parasaur',
    crystal: "Uovo d'Oro di Paro",
    color: '#fdd835',
    missions: ['Salti da 2 e da 10', 'Le aiuole del 5 e del 3', 'Il giardino del 4 e del 6'],
    ground: B.Flowers,
    sky: ['#a5e8a0', '#fffde7'],
    minLevel: { mult: 3, sequence: 4 },
    missionMin: [{ tables: 1 }, { tables: 2 }, { tables: 3 }],
  },
  {
    id: 10,
    act: 2,
    reward: '🥚',
    name: 'Officina dei Numeri',
    short: 'Officina',
    emoji: '⚙️',
    skills: ['tables', 'coladd', 'colsub'],
    primary: 'tables',
    dino: 'spino',
    crystal: "Uovo d'Oro di Spino",
    color: '#78909c',
    missions: ['Le tabelline del 7, 8 e 9', 'Macchine e riporti', 'Il motore finale'],
    ground: B.Iron,
    sky: ['#90a4ae', '#eceff1'],
    minLevel: { coladd: 4, colsub: 4 },
    missionMin: [{ tables: 4 }, { tables: 4, coladd: 5 }, { tables: 5, colsub: 5 }],
  },
];

export const BOSS_SKILLS: SkillId[] = ['addsub', 'sequence', 'compare', 'balance', 'oddone', 'mult', 'word', 'shapes', 'count', 'addsub'];

export const BOSS_MIN: Partial<Record<SkillId, number>> = { addsub: 4, word: 4, compare: 4, count: 3, mult: 3, balance: 3 };

/** La sfida finale sulla nave di Capitan Scompiglio */
export const BOSS2_SKILLS: SkillId[] = ['coladd', 'tables', 'colsub', 'line100', 'tables', 'word', 'coladd', 'colsub'];
export const BOSS2_MIN: Partial<Record<SkillId, number>> = { coladd: 4, colsub: 4, tables: 4, line100: 4, word: 5 };

export const zonesOfAct = (act: 1 | 2) => ZONES.filter((z) => z.act === act);
