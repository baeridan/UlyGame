import type { Rng } from '../core/rng';

export type SkillId =
  | 'count'
  | 'addsub'
  | 'mult'
  | 'compare'
  | 'word'
  | 'shapes'
  | 'balance'
  | 'sequence'
  | 'oddone'
  | 'maze'
  | 'build'
  | 'sudoku'
  | 'mining'
  | 'crafting'
  | 'line100'
  | 'coladd'
  | 'colsub'
  | 'tables';

export type Result = 'first' | 'second' | 'fail';

export interface MountCtx {
  /** sfida a tempo: niente soluzione rivelata, si riprova finché è giusto */
  race?: boolean;
  /** schermo diviso: layout compatto e niente voce */
  compact?: boolean;
}

export interface Challenge {
  skill: SkillId;
  say: string;
  mount(host: HTMLElement, finish: (r: Result) => void, ctx?: MountCtx): void;
}

export type Gen = (level: number, rng: Rng) => Challenge;

export const SKILL_INFO: Record<SkillId, { name: string; area: 'Matematica' | 'Logica'; icon: string }> = {
  count: { name: 'Contare e decine', area: 'Matematica', icon: '🔢' },
  addsub: { name: 'Addizioni e sottrazioni', area: 'Matematica', icon: '➕' },
  mult: { name: 'Prime tabelline', area: 'Matematica', icon: '✖️' },
  compare: { name: 'Maggiore e minore', area: 'Matematica', icon: '⚖️' },
  word: { name: 'Problemi', area: 'Matematica', icon: '📖' },
  shapes: { name: 'Forme e misure', area: 'Matematica', icon: '🔷' },
  balance: { name: 'La bilancia', area: 'Logica', icon: '⚖️' },
  sequence: { name: 'Sequenze', area: 'Logica', icon: '🔁' },
  oddone: { name: "L'intruso", area: 'Logica', icon: '🔍' },
  maze: { name: 'Programmare il dino', area: 'Logica', icon: '🧭' },
  build: { name: 'Costruisci il modello', area: 'Logica', icon: '🧱' },
  sudoku: { name: 'Dino-sudoku', area: 'Logica', icon: '🧩' },
  mining: { name: 'La miniera', area: 'Matematica', icon: '⛏️' },
  crafting: { name: 'Banco da lavoro', area: 'Logica', icon: '🛠️' },
  line100: { name: 'Linea del 100', area: 'Matematica', icon: '📏' },
  coladd: { name: 'Addizioni in colonna', area: 'Matematica', icon: '🧮' },
  colsub: { name: 'Sottrazioni in colonna', area: 'Matematica', icon: '🧮' },
  tables: { name: 'Tabelline', area: 'Matematica', icon: '✖️' },
};

/** Abilità con risposta multipla: usate nelle sfide a tempo. */
export const MC_SKILLS: SkillId[] = ['count', 'addsub', 'mult', 'compare', 'word', 'shapes', 'balance', 'sequence', 'oddone'];

/** Cosa significa ogni livello (per l'area genitori). */
export const LEVEL_LABELS: Partial<Record<SkillId, string[]>> = {
  count: ['fino a 10', 'fino a 20', 'decine fino a 50', 'decine fino a 99', 'decine e unità'],
  addsub: ['+ entro 10', '+ e − entro 10', 'entro 20', 'fino a 100 senza riporto', 'fino a 100 con riporto'],
  mult: ['×2 piccole', '×2 e ×10', '×5 e ×2', '×2, ×5, ×10', '×3, ×4, ×5'],
  compare: ['entro 10', 'entro 20', 'simboli < > = entro 50', 'il più grande fino a 99', 'confronto con operazioni'],
  word: ['entro 10', 'entro 15', 'entro 20', 'fino a 100 e moltiplicazioni', 'fino a 100 e differenze'],
  mining: ['puntini', 'somme entro 10', 'entro 20', 'pari e dispari', 'decine fino a 100'],
  balance: ['entro 10', 'sottrazione entro 10', 'entro 20', 'entro 50', 'con le tabelline'],
  line100: ['trova il numero', 'passi avanti e indietro', 'salti da 10', 'salti da 10 e passi da 1', 'quanto manca?'],
  coladd: ['senza riporto (+ 1 cifra)', 'senza riporto', 'con riporto (+ 1 cifra)', 'con riporto', 'riporto da ricordare da solo'],
  colsub: ['senza prestito (− 1 cifra)', 'senza prestito', 'con prestito (− 1 cifra)', 'con prestito', 'prestito da ricordare da solo'],
  tables: ['×2 e ×10', '×5 e ×3', '×4 e ×6', '×7, ×8, ×9', 'tutte e fattore mancante'],
};
