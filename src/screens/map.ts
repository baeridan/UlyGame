import { beginScreen, h, later, onCleanup } from '../core/dom';
import { me, timeExceeded } from '../core/store';
import { brickBtn, brickCounter, avatarView, modal } from '../ui';
import { drawIsland, zoneAnchor } from './island';
import { iso } from '../art/blocks';
import { hiCanvas } from '../art/bricks';
import { ZONES } from '../zones';
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
import { GLITCH } from '../art/characters';

export function zoneUnlocked(z: number) {
  const p = me();
  return z === 0 || p.zoneProgress[z - 1] >= 3;
}

export function crystals() {
  return me().zoneProgress.filter((x) => x >= 3).length;
}

/** Mostra la mappa. `after` viene chiamato quando è pronta (es. per un dialogo della storia). */
export function showMap(after?: () => void) {
  if (timeExceeded()) return showRest();
  const p = me();
  const root = beginScreen('map-screen');
  const wrap = h('div', { class: 'map-wrap' });
  const markers = h('div', { class: 'map-markers' });
  const done = ZONES.map((z) => p.zoneProgress[z.id] >= 3);
  const allDone = done.every(Boolean);

  const render = () => {
    const W = wrap.clientWidth || window.innerWidth;
    const H = wrap.clientHeight || window.innerHeight - 160;
    const { c, ctx } = hiCanvas(W, H, 'map-canvas');
    const info = drawIsland(ctx, W, H, done, p.bossDone);
    wrap.querySelector('canvas')?.remove();
    wrap.prepend(c);
    markers.replaceChildren();
    const place = (x: number, y: number, el: HTMLElement, z?: number) => {
      const [sx, sy] = iso(x, y, z ?? info.heightAt(x, y), info.s, info.ox, info.oy);
      el.style.left = `${sx}px`;
      el.style.top = `${sy + info.s / 2}px`;
      markers.append(el);
    };
    ZONES.forEach((z) => {
      const a = zoneAnchor(z.id);
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
              speak(`Prima libera la zona ${ZONES[z.id - 1].name}!`);
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
    const t = zoneAnchor(6);
    const castle = h(
      'button',
      {
        class: `zone-marker castle ${allDone ? 'current' : 'locked'} ${p.bossDone ? 'done' : ''}`,
        style: '--zc:#8e24aa',
        onclick: () => {
          if (!allDone) {
            sfx('glitch');
            speak('Il Castello di Glitch si apre solo con tutti e sei i cristalli!');
            return;
          }
          sfx('pop');
          showBoss();
        },
      },
      h('span', { class: 'zm-emoji' }, p.bossDone ? '🏰' : allDone ? '⚔️' : '🔒'),
      allDone ? h('span', { class: 'zm-name' }, p.bossDone ? 'Grande Torre' : 'Castello di Glitch') : null
    );
    place(t.x, t.y, castle, info.heightAt(t.x, t.y) + 1.6);
    if (!p.bossDone) {
      const gl = img(modelIcon('glitch-map', GLITCH, 60, 60), 'map-glitch');
      place(t.x - 2, t.y + 1, h('div', { class: 'map-dino-wrap glitchy' }, gl));
    }
  };

  const crystalBar = h(
    'div',
    { class: 'crystals', title: 'Cristalli del Pensiero' },
    ...ZONES.map((z) => h('span', { class: `crystal ${p.zoneProgress[z.id] >= 3 ? 'on' : ''}`, title: z.crystal }, '💎'))
  );
  const av = avatarView(p.avatar, 56);
  root.append(
    h(
      'header',
      { class: 'topbar map-top' },
      h('button', { class: 'btn round back', 'aria-label': 'Menu', onclick: () => (sfx('click'), showTitle()) }, '🏠'),
      h('div', { class: 'player-chip' }, av.el, h('b', {}, p.name)),
      crystalBar,
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
  const next = ZONES.find((z) => p.zoneProgress[z.id] < 3);
  if (!after)
    later(600, () => {
    if (next) speak(`Tocca ${next.name} per continuare l'avventura!`);
    else if (!p.bossDone) speak('Hai tutti i cristalli! Vai al Castello di Glitch!');
  });
}

export function showCrystalModal(zoneIdx: number, then: () => void) {
  const z = ZONES[zoneIdx];
  const m = modal(
    h(
      'div',
      { class: 'col center crystal-modal' },
      h('div', { class: 'crystal-big' }, '💎'),
      h('h2', {}, z.crystal),
      h('p', {}, `Hai liberato ${z.name}! Ora puoi costruire ${dinoById(z.dino).name} nel Laboratorio.`),
      brickBtn('Evviva!', () => {
        m.close();
        then();
      }, 'green', 'big')
    )
  );
  sfx('win');
  speak(`Hai trovato il ${z.crystal}!`);
}
