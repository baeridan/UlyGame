import { beginScreen, h } from '../core/dom';
import { me } from '../core/store';
import { brickBtn, brickCounter, modelView, stars, topBar } from '../ui';
import { ZONES } from '../zones';
import { showMap } from './map';
import { playStory } from './dialogue';
import { runMission } from './mission';
import { dinoById } from '../art/dinos';
import { SKILL_INFO } from '../games/types';
import { speak } from '../core/speech';

export function showZone(zi: number) {
  const z = ZONES[zi];
  const p = me();
  playStory(`intro-${zi}`, () => {
    const root = beginScreen(`zone-screen zone-${zi}`);
    root.style.setProperty('--sky1', z.sky[0]);
    root.style.setProperty('--sky2', z.sky[1]);
    const d = dinoById(z.dino);
    const freed = p.zoneProgress[zi] >= 3;
    const dv = modelView(d.model, 260, 200, { count: 0 });
    // mostra il dino montato in proporzione alle missioni completate
    dv.setCount(freed ? dv.total : Math.floor((dv.total * p.zoneProgress[zi]) / 3), false);
    const missions = h('div', { class: 'mission-list' });
    z.missions.forEach((name, mi) => {
      const unlocked = mi <= p.zoneProgress[zi];
      const st = p.stars[zi * 3 + mi] || 0;
      missions.append(
        h(
          'button',
          {
            class: `mission-card ${unlocked ? '' : 'locked'} ${st ? 'done' : ''}`,
            disabled: !unlocked,
            onclick: () => runMission(zi, mi),
          },
          h('div', { class: 'mc-num' }, unlocked ? String(mi + 1) : '🔒'),
          h('div', { class: 'mc-body' }, h('div', { class: 'mc-name' }, name), stars(st)),
          h('div', { class: 'mc-play' }, unlocked ? '▶' : '')
        )
      );
    });
    root.append(
      topBar(`${z.emoji} ${z.name}`, showMap, brickCounter(p.bricks)),
      h(
        'div',
        { class: 'zone-layout' },
        h(
          'div',
          { class: 'zone-dino' },
          dv.el,
          h('div', { class: 'zone-dino-name' }, freed ? `${d.name} è libero! 🎉` : `Ricostruisci il ${d.name}`),
          h('div', { class: 'skill-tags' }, ...z.skills.map((s) => h('span', { class: 'tag' }, `${SKILL_INFO[s].icon} ${SKILL_INFO[s].name}`)))
        ),
        h('div', { class: 'col' }, missions, brickBtn('📜 Rivedi la storia', () => playStory(`intro-${zi}`, () => {}, true), 'yellow', 'small'))
      )
    );
    const next = p.zoneProgress[zi];
    speak(next < 3 ? `Missione ${next + 1}: ${z.missions[next]}` : `${z.name} è libera! Puoi rigiocare le missioni per guadagnare mattoncini.`);
  });
}
