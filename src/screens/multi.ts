import { beginScreen, h, later } from '../core/dom';
import { save, persist, current, type Avatar } from '../core/store';
import { brickBtn, modelView, topBar, avatarView, type ModelView } from '../ui';
import { showTitle } from './title';
import { showMap } from './map';
import { showOnline } from './online';
import { GENERATORS } from '../games';
import { MC_SKILLS, type SkillId } from '../games/types';
import { makeRng } from '../core/rng';
import { sfx } from '../core/audio';
import { speak } from '../core/speech';
import { confetti } from '../core/fx';
import { avatarModel } from '../art/characters';
import { DINOS } from '../art/dinos';

export interface LocalPlayer {
  name: string;
  avatar: Avatar;
  level: number;
  profileId?: string;
}

export const LEVELS = [
  { label: '🌱 Facile', level: 1 },
  { label: '🌿 Medio', level: 3 },
  { label: '🌳 Difficile', level: 4 },
];

function back() {
  if (current()) showMap();
  else showTitle();
}

export function showMultiMenu() {
  const root = beginScreen('multi-screen');
  root.append(
    topBar('🤝 Sfida con gli amici', back),
    h(
      'div',
      { class: 'multi-layout' },
      h(
        'section',
        { class: 'multi-card local' },
        h('h2', {}, '📱 Sullo stesso tablet'),
        h('p', {}, 'Mettete il tablet sul tavolo, uno di fronte all\'altro!'),
        brickBtn('⚡ Sfida faccia a faccia', () => showLocalSetup('versus'), 'red', 'big'),
        brickBtn('🦕 Costruiamo insieme', () => showLocalSetup('coop'), 'green', 'big')
      ),
      h(
        'section',
        { class: 'multi-card online' },
        h('h2', {}, '🌐 Online con un amico'),
        h('p', {}, 'Ognuno sul suo tablet. Si entra con un codice segreto di dinosauri. Niente chat, solo emoji!'),
        ...(import.meta.env.VITE_SINGLE
          ? [h('p', { class: 'muted' }, 'Il gioco online funziona nella versione installata con il server. In questa versione di prova puoi giocare sullo stesso dispositivo.')]
          : [brickBtn('🏠 Crea una stanza', () => showOnline('create'), 'blue', 'big'), brickBtn('🔑 Entra con il codice', () => showOnline('join'), 'yellow', 'big')])
      )
    )
  );
  speak('Vuoi giocare sullo stesso tablet o online con un amico?');
}

const GUEST_AVATARS: Avatar[] = [
  { skin: 1, hair: 2, shirt: 2, pants: 1, hat: 4 },
  { skin: 2, hair: 0, shirt: 5, pants: 3, hat: 2 },
];

function showLocalSetup(mode: 'versus' | 'coop') {
  const root = beginScreen('setup-screen');
  const cur = current();
  const players: LocalPlayer[] = [0, 1].map((i) => {
    const prof = i === 0 ? cur || save.profiles[0] : save.profiles.find((p) => p.id !== (cur || save.profiles[0])?.id);
    return prof
      ? { name: prof.name, avatar: prof.avatar, level: 1, profileId: prof.id }
      : { name: `Amico ${i + 1}`, avatar: GUEST_AVATARS[i], level: 1 };
  });
  const col = (i: number) => {
    const p = players[i];
    const box = h('section', { class: `setup-card p${i + 1}` });
    const draw = () => {
      const whoBtns = [
        ...save.profiles.map((pr) =>
          h('button', { class: `who-btn ${p.profileId === pr.id ? 'sel' : ''}`, onclick: () => ((p.profileId = pr.id), (p.name = pr.name), (p.avatar = pr.avatar), sfx('click'), draw()) }, pr.name)
        ),
        h('button', { class: `who-btn ${!p.profileId ? 'sel' : ''}`, onclick: () => ((p.profileId = undefined), (p.name = `Amico ${i + 1}`), (p.avatar = GUEST_AVATARS[i]), sfx('click'), draw()) }, '🙂 Ospite'),
      ];
      box.replaceChildren(
        h('h3', {}, `Giocatore ${i + 1}`),
        avatarView(p.avatar, 110).el,
        h('div', { class: 'who-row' }, ...whoBtns),
        h('div', { class: 'label' }, 'Difficoltà'),
        h('div', { class: 'who-row' }, ...LEVELS.map((l) => h('button', { class: `who-btn lvl ${p.level === l.level ? 'sel' : ''}`, onclick: () => ((p.level = l.level), sfx('click'), draw()) }, l.label)))
      );
    };
    draw();
    return box;
  };
  root.append(
    topBar(mode === 'versus' ? '⚡ Sfida faccia a faccia' : '🦕 Costruiamo insieme', showMultiMenu),
    h('p', { class: 'screen-intro' }, mode === 'versus' ? 'Vince chi risponde giusto per primo a 8 domande! Ognuno sceglie la sua difficoltà.' : 'A turno rispondete alle domande per costruire insieme un dinosauro!'),
    h('div', { class: 'setup-layout' }, col(0), col(1)),
    h('div', { class: 'row center' }, brickBtn('▶ Iniziamo!', () => (mode === 'versus' ? runVersus(players) : runCoop(players)), 'green', 'huge'))
  );
}

function giveBricks(p: LocalPlayer, n: number) {
  const prof = save.profiles.find((x) => x.id === p.profileId);
  if (prof) {
    prof.bricks += n;
    prof.totalBricks += n;
    persist();
  }
}

/** Domanda a risposta multipla per le sfide */
export function raceSkill(rng: () => number): SkillId {
  return MC_SKILLS[Math.floor(rng() * MC_SKILLS.length)];
}

const TARGET = 8;

export function runVersus(players: LocalPlayer[]) {
  const root = beginScreen('versus-screen');
  const scores = [0, 0];
  let over = false;
  const lanes = players.map((p, i) => {
    const runner = h('div', { class: 'runner' }, avatarView(p.avatar, 54, false).el);
    return { lane: h('div', { class: `lane l${i}` }, runner, h('span', { class: 'flag' }, '🏁')), runner };
  });
  const countdown = h('div', { class: 'countdown' });
  const track = h('div', { class: 'track' }, lanes[1].lane, countdown, lanes[0].lane);
  const halves = players.map((p, i) => {
    const host = h('div', { class: 'half-host' });
    const score = h('b', {}, '0');
    const half = h('div', { class: `half ${i === 1 ? 'top' : 'bottom'}` }, h('div', { class: 'half-head' }, h('span', {}, p.name), h('span', { class: 'half-score' }, '⭐ ', score, ` / ${TARGET}`)), host);
    return { half, host, score };
  });
  root.append(halves[1].half, track, halves[0].half);
  const rngs = [makeRng(), makeRng()];
  const ask = (i: number) => {
    if (over) return;
    const rng = rngs[i];
    const ch = GENERATORS[raceSkill(rng)](players[i].level, rng);
    halves[i].host.replaceChildren();
    const slot = h('div', { class: 'challenge-slot' });
    halves[i].host.append(slot);
    ch.mount(slot, () => {
      if (over) return;
      scores[i]++;
      halves[i].score.textContent = String(scores[i]);
      lanes[i].runner.style.setProperty('--p', String(scores[i] / TARGET));
      if (scores[i] >= TARGET) return win(i);
      ask(i);
    }, { race: true, compact: true });
  };
  const win = (w: number) => {
    over = true;
    sfx('win');
    confetti(window.innerWidth / 2, window.innerHeight / 2, 80);
    players.forEach((p, i) => giveBricks(p, i === w ? 10 : 5));
    halves.forEach((hv, i) =>
      hv.host.replaceChildren(
        h(
          'div',
          { class: 'col center end-card' },
          h('div', { class: 'end-emoji' }, i === w ? '🏆' : '💪'),
          h('h2', {}, i === w ? 'Hai vinto!' : 'Bravissimo, quasi!'),
          h('p', {}, `+${i === w ? 10 : 5} mattoncini`),
          h('div', { class: 'row gap center' }, brickBtn('🔁 Rivincita', () => runVersus(players), 'green'), brickBtn('🚪 Esci', showMultiMenu, 'red'))
        )
      )
    );
    speak(`Ha vinto ${players[w].name}! Bravi tutti e due!`);
  };
  // conto alla rovescia
  let n = 3;
  const tick = () => {
    if (n > 0) {
      countdown.textContent = String(n);
      sfx('click');
      n--;
      later(800, tick);
    } else {
      countdown.textContent = 'VIA!';
      sfx('correct');
      later(700, () => (countdown.textContent = ''));
      ask(0);
      ask(1);
    }
  };
  later(300, tick);
  speak('Pronti? Tre, due, uno...');
}

const COOP_TURNS = 10;

export function runCoop(players: LocalPlayer[]) {
  const root = beginScreen('coop-screen');
  const d = DINOS[Math.floor(Math.random() * DINOS.length)];
  const view: ModelView = modelView(d.model, 260, 200, { count: 0 });
  const rng = makeRng();
  let turn = 0;
  const banner = h('div', { class: 'turn-banner' });
  const host = h('div', { class: 'challenge-host' });
  const progress = h('div', { class: 'mission-progress' }, ...Array.from({ length: COOP_TURNS }, () => h('span', { class: 'mp-stud' })));
  root.append(
    topBar(`🦕 Costruiamo ${d.nick}!`, showMultiMenu, progress),
    h('div', { class: 'mission-layout' }, h('div', { class: 'mission-side' }, view.el, banner), host)
  );
  const allSkills = Object.keys(GENERATORS) as SkillId[];
  const next = () => {
    if (turn >= COOP_TURNS) return end();
    const p = players[turn % 2];
    const pv = modelView(avatarModel(p.avatar), 60, 80);
    banner.replaceChildren(pv.el, h('span', {}, `Tocca a `, h('b', {}, p.name), '!'));
    banner.className = `turn-banner p${(turn % 2) + 1}`;
    speak(`Tocca a ${p.name}!`);
    const ch = GENERATORS[rng.pick(allSkills)](p.level, rng);
    host.replaceChildren();
    const slot = h('div', { class: 'challenge-slot' });
    host.append(slot);
    later(1200, () =>
      ch.mount(slot, (r) => {
        progress.children[turn]?.classList.add(r === 'first' ? 'gold' : 'on');
        turn++;
        view.setCount(Math.round((view.total * turn) / COOP_TURNS));
        sfx('brick');
        later(600, next);
      })
    );
  };
  const end = () => {
    view.jump();
    sfx('roar');
    later(300, () => sfx('win'));
    confetti(window.innerWidth / 2, window.innerHeight / 3, 70);
    players.forEach((p) => giveBricks(p, 8));
    banner.replaceChildren(h('span', {}, `${d.name} è pronto! 🎉`));
    host.replaceChildren(
      h(
        'div',
        { class: 'col center end-card' },
        h('div', { class: 'end-emoji' }, '🤝'),
        h('h2', {}, 'Squadra fantastica!'),
        h('p', {}, '+8 mattoncini a testa'),
        h('div', { class: 'row gap center' }, brickBtn('🔁 Ancora', () => runCoop(players), 'green'), brickBtn('🚪 Esci', showMultiMenu, 'red'))
      )
    );
    speak(`Avete costruito ${d.name} insieme! Che squadra!`);
  };
  next();
}
