import type { SkillId } from '../games/types';

export interface Avatar {
  skin: number;
  hair: number;
  shirt: number;
  pants: number;
  hat: number;
}

export interface SkillStat {
  level: number; // 1..5
  streak: number;
  wrongStreak: number;
  attempts: number;
  correct: number;
}

export interface Profile {
  id: string;
  name: string;
  avatar: Avatar;
  bricks: number;
  totalBricks: number;
  /** missioni completate per zona (0..3) */
  zoneProgress: number[];
  /** stelle migliori per missione: zona*3+missione */
  stars: number[];
  storySeen: string[];
  dinosBuilt: string[];
  bossDone: boolean;
  skills: Partial<Record<SkillId, SkillStat>>;
  /** cantiere: colonne 8x8, ognuna lista di tipi di blocco */
  sandbox: number[][];
  ores: number;
  play: { date: string; seconds: number };
  history: { date: string; seconds: number }[];
  created: number;
}

export interface Settings {
  music: number;
  sfx: number;
  voice: boolean;
  colorblind: boolean;
  timeLimit: number; // minuti al giorno, 0 = nessun limite
  serverUrl: string;
  unlockedUntil: string; // data in cui il genitore ha sbloccato il tempo extra
}

export interface Save {
  version: 1;
  profiles: Profile[];
  currentId: string | null;
  settings: Settings;
}

const KEY = 'ulygame-save-v1';

const defaultSettings = (): Settings => ({
  music: 0.4,
  sfx: 0.8,
  voice: true,
  colorblind: false,
  timeLimit: 0,
  serverUrl: '',
  unlockedUntil: '',
});

export const today = () => new Date().toISOString().slice(0, 10);

export function newProfile(name: string, avatar: Avatar): Profile {
  return {
    id: Math.random().toString(36).slice(2, 10),
    name,
    avatar,
    bricks: 0,
    totalBricks: 0,
    zoneProgress: [0, 0, 0, 0, 0, 0],
    stars: Array(18).fill(0),
    storySeen: [],
    dinosBuilt: [],
    bossDone: false,
    skills: {},
    sandbox: Array.from({ length: 64 }, () => []),
    ores: 0,
    play: { date: today(), seconds: 0 },
    history: [],
    created: Date.now(),
  };
}

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    /* storage non disponibile */
  }
  return { version: 1, profiles: [], currentId: null, settings: defaultSettings() };
}

function normalize(s: Partial<Save>): Save {
  const out: Save = {
    version: 1,
    profiles: Array.isArray(s.profiles) ? s.profiles : [],
    currentId: s.currentId ?? null,
    settings: { ...defaultSettings(), ...(s.settings || {}) },
  };
  out.profiles = out.profiles.slice(0, 4).map((p) => {
    const base = newProfile(String(p.name || 'Uly'), p.avatar || { skin: 0, hair: 0, shirt: 0, pants: 0, hat: 0 });
    return { ...base, ...p, id: p.id || base.id };
  });
  return out;
}

export const save: Save = load();

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* ignora */
  }
}

export function current(): Profile | null {
  return save.profiles.find((p) => p.id === save.currentId) || null;
}

export function me(): Profile {
  const p = current();
  if (!p) throw new Error('Nessun profilo selezionato');
  return p;
}

export function exportSave(): string {
  return JSON.stringify(save, null, 2);
}

export function importSave(json: string): boolean {
  try {
    const data = normalize(JSON.parse(json));
    save.profiles = data.profiles;
    save.currentId = data.currentId;
    save.settings = data.settings;
    persist();
    return true;
  } catch {
    return false;
  }
}

/** Aggiunge secondi di gioco al profilo corrente. */
export function addPlayTime(sec: number) {
  const p = current();
  if (!p) return;
  const d = today();
  if (p.play.date !== d) {
    if (p.play.seconds > 0) p.history = [...p.history, p.play].slice(-30);
    p.play = { date: d, seconds: 0 };
  }
  p.play.seconds += sec;
  persist();
}

export function timeExceeded(): boolean {
  const p = current();
  const lim = save.settings.timeLimit;
  if (!p || !lim) return false;
  if (save.settings.unlockedUntil === today()) return false;
  return p.play.date === today() && p.play.seconds >= lim * 60;
}
