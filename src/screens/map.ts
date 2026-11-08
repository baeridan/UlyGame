import { beginScreen, h, later, onCleanup } from '../core/dom';
import { act2Open, me, persist, timeExceeded } from '../core/store';
import { brickBtn, brickCounter, avatarView, modal } from '../ui';
import { drawIsland, zoneAnchor, type Act } from './island';
import { iso } from '../art/blocks';
import { hiCanvas } from '../art/bricks';
import { ZONES, zonesOfAct } from '../zones';
import { showZone } from './zone';
import { showLab } from './lab';
import { showAlbum } from './album';
import { showSandbox } from './sandbox';
import { showMultiMenu } from './multi';
import { showTitle } from './title';
import { showBoss } from './mission';
import { img, modelIcon } from '../art/icons';
import { dinoById } from '../art/dinos';
import { sfx } from '../core/audio';
import { speak } from '../core/speech';
import { showRest } from './parents';
import { GLITCH, SCOMPIGLIO } from '../art/characters';
import { playStory } from './dialogue';

export function zoneUnlocked(z: number) {
  const p = me();
  if (z === 0) return true;
  if (ZONES[z].act === 2) {
    if (!act2Open(p)) return false;
    if (p.act2Mode === 2 || ZONES[z - 1].act === 1) return true;
  }
  return p.zoneProgress[z - 1] >= 3;
}

const BOSS = {
  1: { name: 'Castello di Glitch', doneName: 'Grande Torre', emoji: '🏰', fight: '⚔️', color: '#8e24aa', villain: GLITCH, key: 'glitch-map', need: 'Il Castello di Glitch si apre solo con tutti e sei i cristalli!', go: 'Hai tutti i cristalli! Vai al Castello di Glitch!' },
  2: { name: 'Nave di Scompiglio', doneName: 'Faro del Cento', emoji: '🗼', fight: '🏴\u200d☠️', color: '#e53935', villain: SCOMPIGLIO, key: 'pirate-map', need: "La nave di Capitan Scompiglio si raggiunge con tutte e cinque le Uova d'Oro!", go: "Hai le cinque Uova d'Oro! Sali sulla nave di Capitan Scompiglio!" },
} as const;

/** Mostra la mappa. `after` viene chiamato quando è pronta (es. per un dialogo della storia). */
export function showMap(after?: () => void, actArg?: Act) {
  if (timeExceeded()) return showRest();
  const p = me();
  const act: Act = act2Open(p) ? (actArg ?? p.lastAct ?? 1) : 1;
  if (p.lastAct !== act) {
    p.lastAct = act;
    persist();
  }
  const zones = zonesOfAct(act);
  const bossDone = act === 1 ? p.bossDone : p.boss2Done;
  const boss = BOSS[act];
  const root = beginScreen(`map-screen act${act}`);
  const wrap = h('div', { class: 'map-wrap' });
  const markers = h('div', { class: 'map-markers' });
  const done = zones.map((z) => p.zoneProgress[z.id] >= 3);
  const allDone = done.every(Boolean);

  const render = () => {
    const W = wrap.clientWidth || window.innerWidth;
    const H = wrap.clientHeight || window.innerHeight - 160;
    const { c, ctx } = hiCanvas(W, H, 'map-canvas');
    const info = drawIsland(ctx, W, H, done, bossDone, act);
    wrap.querySelector('canvas')?.remove();
    wrap.prepend(c);
    markers.replaceChildren();
    const place = (x: number, y: number, el: HTMLElement, z?: number) => {
      const [sx, sy] = iso(x, y, z ?? info.heightAt(x, y), info.s, info.ox, info.oy);
      el.style.left = `${sx}px`;
      el.style.top = `${sy + info.s / 2}px`;
      markers.append(el);
    };
    zones.forEach((z, li) => {
      const a = zoneAnchor(li, act);
      const unlocked = zoneUnlocked(z.id);
      const prog = p.zoneProgress[z.id];
      const m = h(
        'button',
        {
          class: `zone-marker ${unlocked ? '' : 'locked'} ${prog >= 3 ? 'done' : ''} ${unlocked && prog < 3 ? 'current' : ''}`,
          style: `--zc:${z.color}`,
          onclick: () => {
            if (!unlocked) {
              sfx('wrong');
              speak(z.id === 6 ? 'Prima batti Glitch!' : `Prima libera la zona ${ZONES[z.id - 1].name}!`);
              return;
            }
            sfx('pop');
            showZone(z.id);
          },
        },
        h('span', { class: 'zm-emoji' }, unlocked ? z.emoji : '🔒'),
        h('span', { class: 'zm-name' }, z.short),
        h('span', { class: 'zm-prog' }, ...[0, 1, 2].map((i) => h('i', { class: i < prog ? 'on' : '' })))
      );
      place(a.x, a.y, m);
      if (p.dinosBuilt.includes(z.dino)) {
        const d = dinoById(z.dino);
        const di = img(modelIcon('map-' + d.id, d.model, 90, 70), 'map-dino');
        place(a.x + 1, a.y + 1, h('div', { class: 'map-dino-wrap' }, di));
      }
    });
    const t = zoneAnchor(zones.length, act);
    const castle = h(
      'button',
      {
        class: `zone-marker castle ${allDone ? 'current' : 'locked'} ${bossDone ? 'done' : ''}`,
        style: `--zc:${boss.color}`,
        onclick: () => {
          if (!allDone) {
            sfx('glitch');
            speak(boss.need);
            return;
          }
          sfx('pop');
          showBoss(act);
        },
      },
      h('span', { class: 'zm-emoji' }, bossDone ? boss.emoji : allDone ? boss.fight : '🔒'),
      allDone ? h('span', { class: 'zm-name' }, bossDone ? boss.doneName : boss.name) : null
    );
    place(t.x, t.y, castle, info.heightAt(t.x, t.y) + 1.6);
    if (!bossDone) {
      const gl = img(modelIcon(boss.key, boss.villain, 60, 60), 'map-glitch');
      place(t.x - 2, t.y + 1, h('div', { class: `map-dino-wrap ${act === 1 ? 'glitchy' : 'pirate'}` }, gl));
    }
  };

  const crystalBar = h(
    'div',
    { class: 'crystals', title: act === 1 ? 'Cristalli del Pensiero' : "Uova d'Oro" },
    ...zones.map((z) => h('span', { class: `crystal ${p.zoneProgress[z.id] >= 3 ? 'on' : ''}`, title: z.crystal }, z.reward))
  );
  const firstTrip = act2Open(p) && !p.storySeen.includes('act2-intro');
  const travel = act2Open(p)
    ? h(
        'button',
        {
          class: `btn travel ${firstTrip ? 'new' : ''}`,
          onclick: () => {
            sfx('whoosh');
            if (act === 1) showMap(() => playStory('act2-intro', () => {}), 2);
            else showMap(undefined, 1);
          },
        },
        act === 1 ? '⛵ Isola Lontana' : '🏝️ Prima isola'
      )
    : null;
  const av = avatarView(p.avatar, 56);
  root.append(
    h(
      'header',
      { class: 'topbar map-top' },
      h('button', { class: 'btn round back', 'aria-label': 'Menu', onclick: () => (sfx('click'), showTitle()) }, '🏠'),
      h('div', { class: 'player-chip' }, av.el, h('b', {}, p.name)),
      crystalBar,
      travel,
      brickCounter(p.bricks)
    ),
    h('div', { class: 'map-area' }, wrap),
    h(
      'nav',
      { class: 'bottom-nav' },
      brickBtn(h('span', {}, '🔬', h('small', {}, 'Laboratorio')), showLab, 'red', 'nav'),
      brickBtn(h('span', {}, '📒', h('small', {}, 'Album')), showAlbum, 'yellow', 'nav'),
      brickBtn(h('span', {}, '🏗️', h('small', {}, 'Cantiere')), showSandbox, 'green', 'nav'),
      brickBtn(h('span', {}, '🤝', h('small', {}, 'Sfida')), showMultiMenu, 'blue', 'nav')
    )
  );
  wrap.append(markers);
  later(30, () => {
    render();
    after?.();
  });
  let rt = 0;
  const onResize = () => {
    clearTimeout(rt);
    rt = window.setTimeout(render, 200);
  };
  window.addEventListener('resize', onResize);
  onCleanup(() => window.removeEventListener('resize', onResize));
  // suggerimento vocale sulla prossima zona
  const next = zones.find((z) => p.zoneProgress[z.id] < 3);
  if (!after)
    later(600, () => {
      if (next) speak(`Tocca ${next.name} per continuare l'avventura!`);
      else if (!bossDone) speak(boss.go);
      else if (act === 1 && firstTrip) speak("Una nuova avventura ti aspetta: tocca la barca per andare sull'Isola Lontana!");
    });
}

export function showCrystalModal(zoneIdx: number, then: () => void) {
  const z = ZONES[zoneIdx];
  const m = modal(
    h(
      'div',
      { class: 'col center crystal-modal' },
      h('div', { class: 'crystal-big' }, z.reward),
      h('h2', {}, z.crystal),
      h('p', {}, `Hai liberato ${z.name}! Ora puoi costruire ${dinoById(z.dino).name} nel Laboratorio.`),
      brickBtn('Evviva!', () => {
        m.close();
        then();
      }, 'green', 'big')
    )
  );
  sfx('win');
  speak(z.act === 1 ? `Hai trovato il ${z.crystal}!` : `Hai salvato l'${z.crystal}!`);
}
