import { beginScreen, h, later } from '../core/dom';
import { me, persist } from '../core/store';
import { DINOS, type DinoDef } from '../art/dinos';
import { brickBtn, brickCounter, modal, modelView, topBar } from '../ui';
import { img, modelIcon } from '../art/icons';
import { showMap } from './map';
import { sfx } from '../core/audio';
import { speak } from '../core/speech';
import { confetti, shake } from '../core/fx';
import { ZONES } from '../zones';

export function dinoUnlocked(d: DinoDef) {
  const p = me();
  if (d.unlockZone === -1) return p.bossDone;
  if (d.unlockZone === -2) return p.boss2Done;
  return p.zoneProgress[d.unlockZone] >= 3;
}

export function showLab() {
  const p = me();
  const root = beginScreen('lab-screen');
  const counter = brickCounter(p.bricks);
  const grid = h('div', { class: 'dino-grid' });
  DINOS.forEach((d) => {
    const built = p.dinosBuilt.includes(d.id);
    const unlocked = dinoUnlocked(d);
    const card = h(
      'button',
      {
        class: `dino-card ${built ? 'built' : unlocked ? 'ready' : 'locked'}`,
        onclick: () => {
          if (built) {
            sfx('roar');
            speak(`${d.nick} è già nella tua collezione!`);
            return;
          }
          if (!unlocked) {
            sfx('wrong');
            speak(d.unlockZone < 0 ? `Questo dinosauro si sblocca dopo aver battuto ${d.unlockZone === -1 ? 'Glitch' : 'Capitan Scompiglio'}!` : `Prima libera la zona ${ZONES[d.unlockZone].name}!`);
            return;
          }
          if (p.bricks < d.cost) {
            sfx('wrong');
            shake(card);
            speak(`Ti servono ${d.cost} mattoncini. Ne hai ${p.bricks}. Ne mancano ${d.cost - p.bricks}! Gioca le missioni per guadagnarne altri.`);
            return;
          }
          buildDino(d);
        },
      },
      img(modelIcon('lab-' + d.id, d.model, 160, 120), `dino-thumb ${unlocked || built ? '' : 'silhouette'}`),
      h('div', { class: 'dino-name' }, unlocked || built ? d.name : '???'),
      h(
        'div',
        { class: 'dino-cost' },
        built ? '✔ Costruito' : unlocked ? h('span', {}, `${d.cost} `, h('span', { class: 'mini-brick' })) : d.unlockZone < 0 ? (d.unlockZone === -1 ? '🔒 Dopo Glitch' : '🔒 Dopo il pirata') : `🔒 ${ZONES[d.unlockZone].short}`
      )
    );
    grid.append(card);
  });
  root.append(topBar('🔬 Laboratorio del Costruttore', showMap, counter), h('p', { class: 'screen-intro' }, 'Usa i mattoncini che hai guadagnato per costruire i dinosauri!'), grid);
  speak('Benvenuto nel Laboratorio! Scegli un dinosauro da costruire.');
}

function buildDino(d: DinoDef) {
  const p = me();
  p.bricks -= d.cost;
  p.dinosBuilt.push(d.id);
  persist();
  const v = modelView(d.model, 360, 280, { count: 0 });
  const label = h('div', { class: 'big-text' }, 'Costruzione in corso... 🔨');
  const cont = brickBtn('Evviva! ▶', () => (m.close(), showLab()), 'green', 'big');
  cont.style.visibility = 'hidden';
  const m = modal(h('div', { class: 'col center build-modal' }, v.el, label, cont));
  speak(`Costruiamo ${d.name}! Un mattoncino alla volta...`);
  let n = 0;
  const step = () => {
    n++;
    v.setCount(n);
    if (n % 2) sfx('brick');
    if (n < v.total) later(Math.max(40, 140 - n * 3), step);
    else
      later(500, () => {
        v.jump();
        sfx('roar');
        confetti(window.innerWidth / 2, window.innerHeight / 2, 70);
        label.textContent = `${d.name} è vivo! 🎉`;
        speak(`${d.name} è vivo! ${d.facts[0]}`);
        cont.style.visibility = 'visible';
      });
  };
  later(500, step);
}
