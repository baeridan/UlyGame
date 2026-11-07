import '@fontsource/baloo-2/latin-500.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import './styles.css';
import { showTitle } from './screens/title';
import { showTestChallenge } from './screens/mission';
import type { SkillId } from './games/types';
import { unlockAudio } from './core/audio';
import { addPlayTime, current, save } from './core/store';

document.documentElement.classList.toggle('cb', save.settings.colorblind);

// sblocca l'audio al primo tocco (necessario su iPad)
window.addEventListener('pointerdown', () => unlockAudio(), { once: true });

// conteggio del tempo di gioco
setInterval(() => {
  if (document.visibilityState === 'visible' && current()) addPlayTime(10);
}, 10000);

// impedisce lo zoom con doppio tocco su iOS
let lastTouch = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    if (now - lastTouch < 300 && !(e.target as HTMLElement).closest('input,select')) e.preventDefault();
    lastTouch = now;
  },
  { passive: false }
);

if (!import.meta.env.VITE_SINGLE && 'serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

const test = new URLSearchParams(location.search).get('test');
if (test && current()) {
  const [skill, lvl] = test.split(':');
  showTestChallenge(skill as SkillId, Number(lvl) || 1);
} else showTitle();
