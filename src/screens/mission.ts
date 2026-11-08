import { beginScreen, h, later, shuffle } from '../core/dom';
import { me, persist } from '../core/store';
import { levelOf, record } from '../core/adaptive';
import { makeRng } from '../core/rng';
import { GENERATORS } from '../games';
import type { Result, SkillId } from '../games/types';
import { BOSS_MIN, BOSS_SKILLS, BOSS2_MIN, BOSS2_SKILLS, ZONES } from '../zones';
import { brickBtn, brickCounter, confirmBox, modal, modelView, stars, type ModelView } from '../ui';
import { dinoById } from '../art/dinos';
import { GLITCH, GLITCH_FRIEND, SCOMPIGLIO, avatarModel } from '../art/characters';
import { sfx } from '../core/audio';
import { speak, stopSpeech } from '../core/speech';
import { confetti, floatText } from '../core/fx';
import { showZone } from './zone';
import { showMap, showCrystalModal } from './map';
import { playStory } from './dialogue';

const BRICKS_FOR: Record<Result, number> = { first: 3, second: 2, fail: 1 };

interface RunOpts {
  title: string;
  skills: SkillId[];
  /** creato dopo l'apertura della schermata (così le animazioni non vengono fermate) */
  side: () => ModelView;
  sideExtra?: HTMLElement;
  sideLabel: string;
  boss?: boolean;
  minLevel?: Partial<Record<SkillId, number>>;
  onExit: () => void;
  onEnd: (firstTries: number, total: number, bricks: number) => void;
}

function runner(o: RunOpts) {
  const p = me();
  const root = beginScreen(`mission-screen ${o.boss ? 'boss' : ''}`);
  const rng = makeRng();
  const total = o.skills.length;
  const queue = o.skills.slice();
  let idx = 0;
  let first = 0;
  let earned = 0;
  let solved = 0;
  const progress = h('div', { class: 'mission-progress' }, ...o.skills.map(() => h('span', { class: 'mp-stud' })));
  const counter = brickCounter(p.bricks);
  const host = h('div', { class: 'challenge-host' });
  const side = o.side();
  const sideBox = h('div', { class: 'mission-side' }, side.el, h('div', { class: 'side-label' }, o.sideLabel), o.sideExtra || null);
  root.append(
    h(
      'header',
      { class: 'topbar' },
      h('button', { class: 'btn round back', 'aria-label': 'Esci', onclick: () => (sfx('click'), confirmBox('Vuoi uscire dalla missione?', () => (stopSpeech(), o.onExit()))) }, '✕'),
      h('div', { class: 'topbar-title' }, o.title),
      progress,
      counter
    ),
    h('div', { class: 'mission-layout' }, sideBox, host)
  );

  const next = () => {
    if (idx >= queue.length) return end();
    const skill = queue[idx];
    const ch = GENERATORS[skill](levelOf(skill, o.minLevel?.[skill] ?? 1), rng);
    host.replaceChildren();
    const inner = h('div', { class: 'challenge-slot' });
    host.append(inner);
    ch.mount(inner, (r) => {
      record(skill, r === 'first');
      if (r === 'first') first++;
      const gain = BRICKS_FOR[r];
      earned += gain;
      p.bricks += gain;
      p.totalBricks += gain;
      persist();
      counter.querySelector('.brick-count')!.textContent = String(p.bricks);
      floatText(`+${gain} 🧱`, counter);
      if (o.boss && r === 'fail' && queue.length < 16) {
        // contro Glitch una risposta sbagliata non conta: arriva un'altra domanda
        queue.push(rng.pick(o.skills));
        progress.append(h('span', { class: 'mp-stud' }));
        speak('Glitch ha parato il colpo! Ancora una domanda.');
      } else {
        solved++;
        side.setCount(Math.round((side.total * solved) / total));
        for (let k = 0; k < 3; k++) later(k * 90, () => sfx('brick'));
      }
      const studs = progress.children;
      studs[idx]?.classList.add(r === 'first' ? 'gold' : r === 'second' ? 'on' : 'miss');
      idx++;
      later(500, next);
    });
  };

  const end = () => {
    side.setCount(side.total);
    side.jump();
    sfx('roar');
    later(400, () => sfx('win'));
    confetti(window.innerWidth / 2, window.innerHeight / 3, 60);
    o.onEnd(first, idx, earned);
  };
  next();
}

export function starsFor(first: number, total: number) {
  const r = first / total;
  return r >= 0.83 ? 3 : r >= 0.5 ? 2 : 1;
}

export function runMission(zi: number, mi: number) {
  const z = ZONES[zi];
  const p = me();
  const rng = makeRng();
  // 6 sfide: due per ogni abilità della zona, la principale della missione prima
  const main = z.skills[mi];
  const others = z.skills.filter((s) => s !== main);
  // nella seconda isola l'abilità principale è metà della missione
  const skills: SkillId[] = z.primary
    ? shuffle([z.primary, z.primary, z.primary, ...shuffle(z.skills.filter((x) => x !== z.primary).flatMap((x) => [x, x]), rng).slice(0, 3)], rng)
    : [main, ...shuffle([main, ...others, ...others], rng).slice(0, 5)];
  // livelli minimi: quelli della zona più quelli della missione (crescono missione dopo missione)
  const minLevel: Partial<Record<SkillId, number>> = { ...(z.minLevel || {}) };
  for (const [k, v] of Object.entries(z.missionMin?.[mi] || {})) minLevel[k as SkillId] = Math.max(minLevel[k as SkillId] || 1, v!);
  const d = dinoById(z.dino);
  runner({
    title: `${z.emoji} ${z.missions[mi]}`,
    skills,
    side: () => modelView(d.model, 240, 190, { count: 0 }),
    minLevel,
    sideLabel: `Costruisci ${d.nick}!`,
    onExit: () => showZone(zi),
    onEnd: (first, total, bricks) => {
      const st = starsFor(first, total);
      const key = zi * 3 + mi;
      p.stars[key] = Math.max(p.stars[key] || 0, st);
      const wasDone = p.zoneProgress[zi] >= 3;
      p.zoneProgress[zi] = Math.max(p.zoneProgress[zi], mi + 1);
      const justFreed = !wasDone && p.zoneProgress[zi] >= 3;
      persist();
      const msg = st === 3 ? 'Perfetto! Sei un campione!' : st === 2 ? 'Molto bene! Continua così!' : 'Ce l\'hai fatta! Allenati ancora e diventerai fortissimo!';
      speak(`${msg} Hai guadagnato ${bricks} mattoncini.`);
      const m = modal(
        h(
          'div',
          { class: 'col center result-modal' },
          h('h2', {}, 'Missione completata!'),
          stars(st),
          h('p', { class: 'big-text' }, msg),
          h('div', { class: 'result-bricks' }, `+${bricks} `, h('span', { class: 'mini-brick' })),
          brickBtn('Continua ▶', () => {
            m.close();
            if (justFreed) showMap(() => playStory(`outro-${zi}`, () => showCrystalModal(zi, () => showMap(undefined, z.act))), z.act);
            else showZone(zi);
          }, 'green', 'big')
        )
      );
    },
  });
}

export function showBoss(act: 1 | 2 = 1) {
  const p = me();
  const cfg =
    act === 1
      ? { intro: 'intro-boss', outro: 'outro-boss', skills: BOSS_SKILLS, min: BOSS_MIN, model: GLITCH, friend: GLITCH_FRIEND, title: '🏰 Sfida a Glitch', label: 'Glitch', jitter: true, win: '🏆 Hai battuto Glitch!', winText: 'La Grande Torre dei Numeri è di nuovo in piedi!', say: 'Hai battuto Glitch! Che campione!' }
      : { intro: 'intro-boss2', outro: 'outro-boss2', skills: BOSS2_SKILLS, min: BOSS2_MIN, model: SCOMPIGLIO, friend: SCOMPIGLIO, title: '🏴\u200d☠️ La nave di Scompiglio', label: 'Capitan Scompiglio', jitter: false, win: "🏆 Hai salvato l'ultimo Uovo d'Oro!", winText: 'Il Faro del Cento è di nuovo acceso!', say: 'Hai battuto Capitan Scompiglio! Sei fortissimo!' };
  playStory(cfg.intro, () => {
    const skills = cfg.skills.slice();
    const hp = h('div', { class: `boss-hp ${act === 2 ? 'pirate' : ''}` });
    let gv: ModelView | null = null;
    runner({
      title: cfg.title,
      skills,
      sideExtra: hp,
      minLevel: cfg.min,
      side: () => {
        const v = modelView(cfg.model, 220, 220, { jitter: cfg.jitter });
        gv = v;
        return {
          el: v.el,
          total: skills.length,
          setCount(n: number) {
            // la barra di energia del cattivo scende a ogni risposta giusta
            hp.style.setProperty('--hp', String(Math.max(0, 1 - n / skills.length)));
            v.jump();
            sfx(act === 1 ? 'glitch' : 'whoosh');
          },
          jump: () => v.jump(),
          setModel: (m) => v.setModel(m),
        };
      },
      sideLabel: cfg.label,
      boss: true,
      onExit: () => showMap(undefined, act),
      onEnd: (_first, _total, bricks) => {
        gv?.setModel(cfg.friend);
        const firstTime = act === 1 ? !p.bossDone : !p.boss2Done;
        if (act === 1) p.bossDone = true;
        else p.boss2Done = true;
        p.bricks += 50;
        p.totalBricks += 50;
        persist();
        const m = modal(
          h(
            'div',
            { class: 'col center result-modal' },
            h('h2', {}, cfg.win),
            h('p', { class: 'big-text' }, cfg.winText),
            h('div', { class: 'result-bricks' }, `+${bricks + 50} `, h('span', { class: 'mini-brick' })),
            brickBtn('Continua ▶', () => {
              m.close();
              if (!firstTime) return showMap(undefined, act);
              if (act === 1) showMap(() => playStory(cfg.outro, () => {}), 1);
              else showMap(() => playStory(cfg.outro, () => showDiploma()), 2);
            }, 'green', 'big')
          )
        );
        speak(cfg.say);
      },
    });
  });
}

/** Diploma finale: la seconda elementare dell'isola è completata. */
export function showDiploma() {
  const p = me();
  const av = modelView(avatarModel(p.avatar), 120, 160);
  const m = modal(
    h(
      'div',
      { class: 'col center diploma' },
      h('div', { class: 'diploma-ribbon' }, '🏅'),
      h('h2', {}, 'Diploma di Super Costruttore'),
      av.el,
      h('p', { class: 'big-text' }, `${p.name} ha completato la seconda elementare dell'Isola dei Blocchi!`),
      h(
        'ul',
        { class: 'diploma-list' },
        h('li', {}, '🔢 Numeri fino a 100 e linea del 100'),
        h('li', {}, '🧮 Addizioni con il riporto e sottrazioni con il prestito'),
        h('li', {}, '✖️ Tutte le tabelline'),
        h('li', {}, '🧩 Logica, forme, problemi e coding')
      ),
      h('p', { class: 'muted' }, 'Puoi continuare a giocare tutte le missioni per allenarti e collezionare i dinosauri.'),
      brickBtn('Evviva! 🎉', () => m.close(), 'green', 'big')
    )
  );
  sfx('win');
  confetti(window.innerWidth / 2, window.innerHeight / 3, 90);
  speak(`Complimenti ${p.name}! Diploma di Super Costruttore!`);
}

/** Modalità di prova: ?test=skill:livello mostra una singola sfida (utile per verifiche). */
export function showTestChallenge(skill: SkillId, level: number) {
  const root = beginScreen('mission-screen');
  const host = h('div', { class: 'challenge-host' });
  const side = modelView(dinoById('trex').model, 240, 190, { count: 20 });
  root.append(h('header', { class: 'topbar' }, h('div', { class: 'topbar-title' }, `Test ${skill} L${level}`)), h('div', { class: 'mission-layout' }, h('div', { class: 'mission-side' }, side.el), host));
  const ch = GENERATORS[skill](level, makeRng(level * 100 + skill.length));
  const slot = h('div', { class: 'challenge-slot' });
  host.append(slot);
  ch.mount(slot, (r) => host.append(h('div', { class: 'test-result' }, r)));
}
