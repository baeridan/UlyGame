import { beginScreen, h, later } from '../core/dom';
import { current, persist, type Avatar } from '../core/store';
import { Net, serverUrl, type NetPlayer, type ServerMsg } from '../core/net';
import { brickBtn, modelView, topBar, avatarView, type ModelView } from '../ui';
import { showMultiMenu, raceSkill, LEVELS } from './multi';
import { GENERATORS } from '../games';
import type { SkillId } from '../games/types';
import { makeRng } from '../core/rng';
import { sfx } from '../core/audio';
import { speak } from '../core/speech';
import { confetti, toast, floatText } from '../core/fx';
import { playTheme } from '../core/music';
import { DINOS } from '../art/dinos';

export const NET_NAMES = ['Rex', 'Trici', 'Stego', 'Ptero', 'Anki', 'Brachi', 'Veloce', 'Spino', 'Paro', 'Bricco'];
export const CODE_EMOJI = ['🦖', '🦕', '🌋', '💎', '🌴', '⛏️', '🧱', '⭐'];
export const EMOTES = ['👍', '🦖', '🎉', '💪', '😄', '⭐', 'Bravo!', 'Forza!', 'Ci sono quasi!', 'Che bello!'];

const DEFAULT_AVATAR: Avatar = { skin: 0, hair: 0, shirt: 1, pants: 0, hat: 1 };

interface Setup {
  nameIdx: number;
  level: number;
  mode: 'race' | 'coop';
}

let lastSetup: Setup = { nameIdx: 0, level: 1, mode: 'race' };

function myAvatar(): Avatar {
  return current()?.avatar || DEFAULT_AVATAR;
}

export function showOnline(kind: 'create' | 'join') {
  const root = beginScreen('online-screen');
  const s = { ...lastSetup };
  const body = h('div', { class: 'online-setup' });
  const code: number[] = [];
  const msg = h('p', { class: 'q-hint' });
  const draw = () => {
    const nameRow = h('div', { class: 'who-row' }, ...NET_NAMES.map((n, i) => h('button', { class: `who-btn ${s.nameIdx === i ? 'sel' : ''}`, onclick: () => ((s.nameIdx = i), sfx('click'), draw()) }, n)));
    const lvlRow = h('div', { class: 'who-row' }, ...LEVELS.map((l) => h('button', { class: `who-btn ${s.level === l.level ? 'sel' : ''}`, onclick: () => ((s.level = l.level), sfx('click'), draw()) }, l.label)));
    const modeRow =
      kind === 'create'
        ? h(
            'div',
            { class: 'who-row' },
            h('button', { class: `who-btn ${s.mode === 'race' ? 'sel' : ''}`, onclick: () => ((s.mode = 'race'), sfx('click'), draw()) }, '⚡ Gara'),
            h('button', { class: `who-btn ${s.mode === 'coop' ? 'sel' : ''}`, onclick: () => ((s.mode = 'coop'), sfx('click'), draw()) }, '🦕 Insieme')
          )
        : null;
    const codeBox =
      kind === 'join'
        ? h(
            'div',
            { class: 'col center' },
            h('div', { class: 'label' }, 'Codice della stanza'),
            h('div', { class: 'code-slots' }, ...[0, 1, 2, 3].map((i) => h('span', { class: 'code-slot' }, code[i] !== undefined ? CODE_EMOJI[code[i]] : ''))),
            h(
              'div',
              { class: 'code-pad' },
              ...CODE_EMOJI.map((e, i) => h('button', { class: 'code-key', onclick: () => (code.length < 4 && code.push(i), sfx('pop'), draw()) }, e)),
              h('button', { class: 'code-key del', onclick: () => (code.pop(), sfx('click'), draw()) }, '⌫')
            )
          )
        : null;
    body.replaceChildren(
      ...[
      h('div', { class: 'online-me' }, avatarView(myAvatar(), 100).el, h('div', {}, h('div', { class: 'label' }, 'Il tuo nome da dinosauro'), nameRow)),
      h('div', { class: 'label' }, 'Difficoltà'),
      lvlRow,
      modeRow ? h('div', { class: 'label' }, 'Modalità') : null,
      modeRow,
      codeBox,
      brickBtn(kind === 'create' ? '🏠 Crea la stanza' : '🔑 Entra', go, 'green', 'big'),
      msg,
      ].filter((x) => !!x) as HTMLElement[]
    );
  };
  const go = async () => {
    if (kind === 'join' && code.length < 4) {
      msg.textContent = 'Inserisci i 4 simboli del codice!';
      return;
    }
    lastSetup = { ...s };
    msg.textContent = 'Mi collego... 📡';
    const net = new Net();
    try {
      await net.connect();
    } catch {
      msg.textContent = serverUrl()
        ? 'Non riesco a collegarmi al server. Controlla internet o chiedi a un genitore.'
        : 'Server non configurato: chiedi a un genitore di inserirlo nell\'area genitori.';
      sfx('wrong');
      return;
    }
    const me: NetPlayer = { n: s.nameIdx, a: myAvatar() };
    net.onClose = () => {
      toast('Connessione persa 😢');
      showMultiMenu();
    };
    net.onMsg = (m: ServerMsg) => {
      if (m.t === 'error') {
        msg.textContent = m.msg;
        sfx('wrong');
        net.close();
      } else if (m.t === 'created') waitingRoom(net, m.code, s);
      else if (m.t === 'start') startOnline(net, m, s.level);
    };
    if (kind === 'create') net.send({ t: 'create', mode: s.mode, p: me });
    else net.send({ t: 'join', code: code.join(''), p: me });
  };
  draw();
  root.append(topBar(kind === 'create' ? '🏠 Crea una stanza' : '🔑 Entra in una stanza', showMultiMenu), body);
}

function waitingRoom(net: Net, code: string, s: Setup) {
  const root = beginScreen('waiting-screen');
  const dots = h('div', { class: 'big-text' }, 'Aspetto il tuo amico');
  root.append(
    topBar('🏠 La tua stanza', () => (net.close(), showMultiMenu())),
    h(
      'div',
      { class: 'col center waiting' },
      h('p', { class: 'big-text' }, `Modalità: ${s.mode === 'race' ? '⚡ Gara' : '🦕 Insieme'}`),
      h('div', { class: 'label' }, 'Di\' al tuo amico questo codice:'),
      h('div', { class: 'code-slots big' }, ...[...code].map((c) => h('span', { class: 'code-slot' }, CODE_EMOJI[Number(c)]))),
      dots,
      modelView(DINOS[4].model, 200, 160).el
    )
  );
  let k = 0;
  const tick = () => {
    k = (k + 1) % 4;
    dots.textContent = 'Aspetto il tuo amico' + '.'.repeat(k);
    later(500, tick);
  };
  tick();
  speak('Di al tuo amico il codice segreto: ' + [...code].map((c) => ['tirannosauro', 'brachiosauro', 'vulcano', 'diamante', 'palma', 'piccone', 'mattoncino', 'stella'][Number(c)]).join(', '));
}

function emoteBar(net: Net) {
  return h('div', { class: 'emote-bar' }, ...EMOTES.map((e, i) => h('button', { class: 'emote-btn', onclick: () => (net.send({ t: 'emote', id: i }), sfx('pop')) }, e)));
}

function showEmote(anchor: Element, id: number) {
  sfx('pop');
  floatText(EMOTES[id] || '', anchor);
}

function startOnline(net: Net, start: Extract<ServerMsg, { t: 'start' }>, level: number) {
  const you = start.you;
  const other = 1 - you;
  const names = start.players.map((p) => NET_NAMES[p.n] || 'Amico');
  const root = beginScreen(`online-game ${start.mode}`);
  playTheme(start.mode === 'race' ? 'boss' : 'focus');
  const avatars = start.players.map((p) => avatarView(p.a, 60, false));
  const exit = () => (net.close(), showMultiMenu());
  const rng = makeRng();
  const host = h('div', { class: 'challenge-host' });
  let over = false;

  const reward = (n: number) => {
    const p = current();
    if (!p) return;
    p.bricks += n;
    p.totalBricks += n;
    persist();
  };

  const endCard = (title: string, emoji: string, gain: number) => {
    reward(gain);
    const status = h('p', { class: 'muted' });
    const again = brickBtn('🔁 Ancora', () => {
      net.send({ t: 'again' });
      status.textContent = `Aspetto ${names[other]}...`;
      again.disabled = true;
    }, 'green');
    host.replaceChildren(
      h('div', { class: 'col center end-card' }, h('div', { class: 'end-emoji' }, emoji), h('h2', {}, title), h('p', {}, `+${gain} mattoncini`), h('div', { class: 'row gap center' }, again, brickBtn('🚪 Esci', exit, 'red')), status)
    );
    return status;
  };

  let friendStatus: HTMLElement | null = null;
  const common = (m: ServerMsg) => {
    if (m.t === 'emote') showEmote(avatars[m.who].el, m.id);
    else if (m.t === 'left') {
      over = true;
      toast(`${names[other]} è uscito dalla stanza`);
      host.replaceChildren(h('div', { class: 'col center end-card' }, h('div', { class: 'end-emoji' }, '👋'), h('h2', {}, `${names[other]} è uscito`), brickBtn('🚪 Esci', exit, 'red')));
    } else if (m.t === 'again' && m.who === other && friendStatus) friendStatus.textContent = `${names[other]} vuole giocare ancora!`;
    else if (m.t === 'start') startOnline(net, m, level);
  };

  if (start.mode === 'race') {
    const runners = start.players.map((_, i) => h('div', { class: 'runner' }, avatars[i].el));
    const lanes = start.players.map((_, i) => h('div', { class: `lane l${i === you ? 0 : 1}` }, h('span', { class: 'lane-name' }, names[i] + (i === you ? ' (tu)' : '')), runners[i], h('span', { class: 'flag' }, '🏁')));
    const countdown = h('div', { class: 'countdown' });
    root.append(topBar('⚡ Gara online', exit), h('div', { class: 'track online' }, lanes[other], countdown, lanes[you]), host, emoteBar(net));
    let score = 0;
    const ask = () => {
      if (over) return;
      const ch = GENERATORS[raceSkill(rng)](level, rng);
      host.replaceChildren();
      const slot = h('div', { class: 'challenge-slot' });
      host.append(slot);
      ch.mount(slot, () => {
        if (over) return;
        score++;
        net.send({ t: 'score', v: score });
        runners[you].style.setProperty('--p', String(score / start.target));
        if (score < start.target) ask();
        else host.replaceChildren(h('div', { class: 'big-text center' }, '🏁 Arrivato!'));
      }, { race: true });
    };
    net.onMsg = (m) => {
      if (m.t === 'score') runners[m.who].style.setProperty('--p', String(m.v / start.target));
      else if (m.t === 'end') {
        over = true;
        const won = m.winner === you;
        sfx('win');
        if (won) confetti(window.innerWidth / 2, window.innerHeight / 2, 80);
        friendStatus = endCard(won ? 'Hai vinto! 🏆' : `Ha vinto ${names[other]}! Bravo lo stesso!`, won ? '🏆' : '💪', won ? 10 : 5);
        speak(won ? 'Hai vinto!' : `Ha vinto ${names[other]}. Bella gara!`);
      } else common(m);
    };
    let n = 3;
    const tick = () => {
      if (n > 0) {
        countdown.textContent = String(n--);
        sfx('click');
        later(800, tick);
      } else {
        countdown.textContent = 'VIA!';
        sfx('correct');
        later(700, () => (countdown.textContent = ''));
        ask();
      }
    };
    speak(`Gara contro ${names[other]}! Tre, due, uno...`);
    later(300, tick);
    return;
  }

  // ---------------- cooperativa a turni ----------------
  const d = DINOS[(start.players[0].n + start.players[1].n) % DINOS.length];
  const view: ModelView = modelView(d.model, 240, 190, { count: 0 });
  const banner = h('div', { class: 'turn-banner' });
  const progress = h('div', { class: 'mission-progress' }, ...Array.from({ length: start.target }, () => h('span', { class: 'mp-stud' })));
  root.append(
    topBar(`🦕 Costruiamo ${d.nick} insieme`, exit, progress),
    h('div', { class: 'mission-layout' }, h('div', { class: 'mission-side' }, view.el, h('div', { class: 'row gap center' }, avatars[you].el, avatars[other].el), banner), host),
    emoteBar(net)
  );
  const skills = Object.keys(GENERATORS) as SkillId[];
  const showTurn = (turn: number) => {
    if (over) return;
    if (turn === you) {
      banner.textContent = 'Tocca a te! 🙌';
      banner.className = 'turn-banner p1';
      speak('Tocca a te!');
      const ch = GENERATORS[rng.pick(skills)](level, rng);
      host.replaceChildren();
      const slot = h('div', { class: 'challenge-slot' });
      host.append(slot);
      ch.mount(slot, (r) => net.send({ t: 'turn', ok: r === 'first' }));
    } else {
      banner.textContent = `Tocca a ${names[other]}`;
      banner.className = 'turn-banner p2';
      host.replaceChildren(
        h('div', { class: 'col center end-card' }, h('div', { class: 'end-emoji think' }, '🤔'), h('h2', {}, `${names[other]} sta pensando...`), h('p', {}, 'Mandagli un incoraggiamento qui sotto!'))
      );
    }
  };
  net.onMsg = (m) => {
    if (m.t === 'turn') {
      progress.children[m.progress - 1]?.classList.add(m.ok ? 'gold' : 'on');
      view.setCount(Math.round((view.total * m.progress) / start.target));
      sfx('brick');
      if (m.progress < start.target) later(700, () => showTurn(m.turn));
    } else if (m.t === 'end') {
      over = true;
      view.jump();
      sfx('roar');
      later(300, () => sfx('win'));
      confetti(window.innerWidth / 2, window.innerHeight / 3, 70);
      banner.textContent = `${d.name} è pronto! 🎉`;
      friendStatus = endCard('Squadra fantastica!', '🤝', 8);
      speak(`Avete costruito ${d.name} insieme!`);
    } else common(m);
  };
  speak(`Costruiamo ${d.name} insieme a ${names[other]}!`);
  later(800, () => showTurn(start.turn));
}
