import { beginScreen, h } from '../core/dom';
import { me } from '../core/store';
import { DINOS } from '../art/dinos';
import { brickBtn, modal, modelView, topBar } from '../ui';
import { img, modelIcon } from '../art/icons';
import { showMap } from './map';
import { sfx } from '../core/audio';
import { speak } from '../core/speech';

export function showAlbum() {
  const p = me();
  const root = beginScreen('album-screen');
  const grid = h('div', { class: 'dino-grid album' });
  DINOS.forEach((d) => {
    const built = p.dinosBuilt.includes(d.id);
    grid.append(
      h(
        'button',
        {
          class: `dino-card ${built ? 'built' : 'locked'}`,
          onclick: () => {
            if (!built) {
              sfx('wrong');
              speak('Costruiscilo nel Laboratorio per vederlo qui!');
              return;
            }
            let fi = 0;
            const v = modelView(d.model, 340, 260);
            const fact = h('p', { class: 'fact' }, d.facts[0]);
            modal(
              h(
                'div',
                { class: 'col center album-modal' },
                h('h2', {}, d.name, h('small', {}, ` “${d.nick}”`)),
                v.el,
                fact,
                h(
                  'div',
                  { class: 'row gap center' },
                  brickBtn('🦖 Ruggisci!', () => (v.jump(), sfx('roar')), 'red'),
                  brickBtn('💡 Altra curiosità', () => {
                    fi = (fi + 1) % d.facts.length;
                    fact.textContent = d.facts[fi];
                    speak(d.facts[fi]);
                  }, 'yellow')
                )
              ),
              () => {}
            );
            speak(`${d.name}. ${d.facts[0]}`);
          },
        },
        img(modelIcon('lab-' + d.id, d.model, 160, 120), `dino-thumb ${built ? '' : 'silhouette'}`),
        h('div', { class: 'dino-name' }, built ? d.name : '???')
      )
    );
  });
  root.append(topBar(`📒 Album dei Dinosauri (${p.dinosBuilt.length}/${DINOS.length})`, showMap), grid);
}
