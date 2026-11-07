import { beginScreen, h } from '../core/dom';
import { save, persist, newProfile, type Avatar, type Profile } from '../core/store';
import { avatarView, brickBtn, topBar, brickCounter, confirmBox } from '../ui';
import { CLOTHES, HAIRS, HATS, SKINS, avatarModel } from '../art/characters';
import { sfx } from '../core/audio';
import { showTitle } from './title';
import { showMap } from './map';
import { playStory } from './dialogue';
import { speak } from '../core/speech';

export function showProfiles() {
  const root = beginScreen('profiles-screen');
  root.append(topBar('Chi gioca? 🦖', showTitle));
  const list = h('div', { class: 'profile-list' });
  save.profiles.forEach((p) => {
    const card = h(
      'button',
      {
        class: 'profile-card',
        onclick: () => {
          sfx('pop');
          save.currentId = p.id;
          persist();
          speak(`Ciao ${p.name}!`);
          showMap(() => playStory('prologue', () => {}));
        },
      },
      avatarView(p.avatar, 110).el,
      h('div', { class: 'profile-name' }, p.name),
      brickCounter(p.bricks)
    );
    const edit = h('button', { class: 'btn small edit-profile', onclick: (e: Event) => (e.stopPropagation(), showAvatarEditor(p)) }, '✏️');
    list.append(h('div', { class: 'profile-wrap' }, card, edit));
  });
  if (save.profiles.length < 4)
    list.append(
      h('button', { class: 'profile-card new', onclick: () => (sfx('click'), showAvatarEditor(null)) }, h('div', { class: 'plus-big' }, '+'), h('div', { class: 'profile-name' }, 'Nuovo giocatore'))
    );
  root.append(list);
  if (!save.profiles.length) speak('Ciao! Crea il tuo giocatore toccando il più.');
}

export function showAvatarEditor(existing: Profile | null) {
  const root = beginScreen('avatar-screen');
  const a: Avatar = existing ? { ...existing.avatar } : { skin: 0, hair: 0, shirt: 1, pants: 0, hat: 1 };
  const nameIn = h('input', { class: 'name-input', maxlength: '12', value: existing?.name || (save.profiles.length ? '' : 'Uly'), placeholder: 'Il tuo nome', autocomplete: 'off' }) as HTMLInputElement;
  const view = avatarView(a, 220);
  const refresh = () => view.setModel(avatarModel(a));
  const row = (label: string, key: keyof Avatar, colors: string[] | null, names?: string[]) => {
    const opts = (colors || names || []).map((c, i) =>
      h(
        'button',
        {
          class: `opt ${a[key] === i ? 'sel' : ''} ${colors ? 'swatch' : 'text'}`,
          style: colors ? `--c:${c}` : '',
          onclick: (e: Event) => {
            a[key] = i;
            sfx('brick');
            (e.currentTarget as HTMLElement).parentElement!.querySelectorAll('.opt').forEach((o, k) => o.classList.toggle('sel', k === i));
            refresh();
            view.jump();
          },
        },
        colors ? '' : c
      )
    );
    return h('div', { class: 'opt-row' }, h('div', { class: 'opt-label' }, label), h('div', { class: 'opts' }, ...opts));
  };
  const saveBtn = brickBtn('✔ Fatto!', () => {
    const name = nameIn.value.trim().slice(0, 12) || 'Uly';
    if (existing) {
      existing.name = name;
      existing.avatar = a;
      persist();
      showProfiles();
    } else {
      const p = newProfile(name, a);
      save.profiles.push(p);
      save.currentId = p.id;
      persist();
      showMap(() => playStory('prologue', () => {}));
    }
  }, 'green', 'big');
  root.append(
    topBar(existing ? 'Modifica giocatore' : 'Crea il tuo costruttore', showProfiles),
    h(
      'div',
      { class: 'avatar-layout' },
      h('div', { class: 'avatar-preview' }, view.el, nameIn),
      h(
        'div',
        { class: 'avatar-opts' },
        row('Pelle', 'skin', SKINS),
        row('Capelli', 'hair', HAIRS),
        row('Maglietta', 'shirt', CLOTHES),
        row('Pantaloni', 'pants', CLOTHES),
        row('Cappello', 'hat', null, HATS),
        h('div', { class: 'row gap center' }, saveBtn,
          existing && save.profiles.length > 0
            ? brickBtn('🗑️', () =>
                confirmBox(`Vuoi cancellare ${existing.name}? Tutti i progressi andranno persi.`, () => {
                  save.profiles = save.profiles.filter((x) => x.id !== existing.id);
                  if (save.currentId === existing.id) save.currentId = null;
                  persist();
                  showProfiles();
                }), 'red')
            : null)
      )
    )
  );
}
