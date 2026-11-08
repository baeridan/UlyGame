import { beginScreen, h, animLoop } from '../core/dom';
import { brickBtn, modelView } from '../ui';
import { showProfiles } from './profiles';
import { showMultiMenu } from './multi';
import { showParentGate } from './parents';
import { DINOS } from '../art/dinos';
import { playTheme, startMusic } from '../core/music';
import { current } from '../core/store';
import { showMap } from './map';

function logo() {
  const word = (w: string, cls: string) => h('div', { class: `logo-word ${cls}` }, ...[...w].map((ch, i) => (ch === ' ' ? h('span', { class: 'lb-space' }) : h('span', { class: `lb c${i % 6}` }, ch))));
  return h('div', { class: 'logo' }, word("L'ISOLA", 'small'), word('DI ' + (current()?.name?.toUpperCase().slice(0, 8) || 'ULY'), 'big'), h('div', { class: 'logo-sub' }, 'Dinosauri di mattoncini • Mondo a blocchi • Numeri e logica'));
}

export function showTitle() {
  const root = beginScreen('title-screen');
  playTheme('adventure');
  const parade = h('div', { class: 'parade' });
  const picks = [DINOS[4], DINOS[0], DINOS[1], DINOS[5], DINOS[2]];
  const views = picks.map((d) => {
    const v = modelView(d.model, 150, 120);
    const wrap = h('div', { class: 'parade-dino' }, v.el);
    parade.append(wrap);
    return { wrap, v };
  });
  animLoop((t) => {
    const W = parade.clientWidth + 200;
    views.forEach((x, i) => {
      const pos = ((t * 45 + i * (W / views.length)) % W) - 150;
      x.wrap.style.transform = `translateX(${pos}px)`;
    });
  });
  const play = brickBtn('▶  GIOCA', () => {
    startMusic();
    if (current()) showMap();
    else showProfiles();
  }, 'green', 'huge');
  root.append(
    h('div', { class: 'title-top' }, h('button', { class: 'btn small ghost', onclick: () => showParentGate() }, '👪 Genitori')),
    logo(),
    h(
      'div',
      { class: 'title-buttons' },
      play,
      brickBtn('🤝  SFIDA CON GLI AMICI', () => (startMusic(), showMultiMenu()), 'blue', 'big'),
      current() ? brickBtn('👤  Cambia giocatore', () => showProfiles(), 'yellow') : null
    ),
    parade
  );
}
