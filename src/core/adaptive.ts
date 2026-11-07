import type { SkillId } from '../games/types';
import { me, persist, type SkillStat } from './store';

export function skillStat(skill: SkillId): SkillStat {
  const p = me();
  let s = p.skills[skill];
  if (!s) {
    s = { level: 1, streak: 0, wrongStreak: 0, attempts: 0, correct: 0 };
    p.skills[skill] = s;
  }
  return s;
}

export function levelOf(skill: SkillId, zoneMin = 1): number {
  return Math.max(zoneMin, skillStat(skill).level);
}

/** Aggiorna il livello: 3 giuste di fila = sale, 2 sbagliate di fila = scende. */
export function record(skill: SkillId, correct: boolean) {
  const s = skillStat(skill);
  s.attempts++;
  if (correct) {
    s.correct++;
    s.streak++;
    s.wrongStreak = 0;
    if (s.streak >= 3 && s.level < 5) {
      s.level++;
      s.streak = 0;
    }
  } else {
    s.wrongStreak++;
    s.streak = 0;
    if (s.wrongStreak >= 2 && s.level > 1) {
      s.level--;
      s.wrongStreak = 0;
    }
  }
  persist();
}
