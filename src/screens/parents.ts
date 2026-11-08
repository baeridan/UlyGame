import { beginScreen, h } from '../core/dom';
import { save, persist, exportSave, importSave, today, current, type Profile } from '../core/store';
import { brickBtn, modelView, topBar } from '../ui';
import { SKILL_INFO, LEVEL_LABELS, type SkillId } from '../games/types';
import { showTitle } from './title';
import { applyVolumes, sfx } from '../core/audio';
import { toast } from '../core/fx';
import { BRICCO } from '../art/characters';
import { speak } from '../core/speech';
import { ZONES } from '../zones';

export function showParentGate(then: () => void = showParents) {
  const root = beginScreen('gate-screen');
  const a = 6 + Math.floor(Math.random() * 4);
  const b = 6 + Math.floor(Math.random() * 4);
  const input = h('input', { class: 'name-input', inputmode: 'numeric', type: 'text', maxlength: '3', placeholder: '?', autocomplete: 'off' }) as HTMLInputElement;
  const msg = h('p', { class: 'q-hint' });
  const check = () => {
    if (Number(input.value) === a * b) then();
    else {
      sfx('wrong');
      msg.textContent = 'Risposta non corretta.';
      input.value = '';
    }
  };
  input.addEventListener('keydown', (e) => e.key === 'Enter' && check());
  root.append(
    topBar('👪 Area genitori', showTitle),
    h('div', { class: 'col center gate' }, h('p', { class: 'big-text' }, 'Per entrare, risolvi:'), h('div', { class: 'big-number' }, `${a} × ${b}`), input, brickBtn('Entra', check, 'blue'), msg)
  );
  input.focus();
}

function pct(p: Profile, s: SkillId) {
  const st = p.skills[s];
  if (!st || !st.attempts) return null;
  return Math.round((st.correct / st.attempts) * 100);
}

/** Apertura dell'Isola Lontana (seconda parte dell'anno) scelta dal genitore. */
function act2Select(p: Profile) {
  const opts: [number, string][] = [
    [0, p.bossDone ? 'Aperta (Glitch è già stato battuto)' : 'Chiusa: si apre dopo aver battuto Glitch'],
    [1, 'Aperta: si parte dal Ponte del Cento'],
    [2, 'Aperta con tutte le zone (riporto, prestito, tabelline subito)'],
  ];
  const sel = h(
    'select',
    { id: `act2-${p.id}`, 'aria-label': `Isola Lontana di ${p.name}` },
    ...opts.map(([v, label]) => h('option', { value: String(v), selected: (p.act2Mode ?? 0) === v }, label))
  ) as HTMLSelectElement;
  sel.addEventListener('change', () => {
    p.act2Mode = Number(sel.value) as 0 | 1 | 2;
    persist();
    toast(p.act2Mode ? `${p.name}: Isola Lontana aperta` : `${p.name}: Isola Lontana di nuovo legata alla storia`);
  });
  return h('label', { class: 'setting col act2-setting' }, h('span', {}, "⛵ Isola Lontana (seconda parte dell'anno)"), sel);
}

/** Selettore del livello: il genitore può far partire il bambino da un livello più alto. */
function levelSelect(p: Profile, k: SkillId, lvl: number) {
  const labels = LEVEL_LABELS[k];
  const sel = h(
    'select',
    { class: 'stat-lvl', 'aria-label': `Livello di ${SKILL_INFO[k].name}` },
    ...[1, 2, 3, 4, 5].map((n) => h('option', { value: String(n), selected: n === lvl }, labels ? `${n} · ${labels[n - 1]}` : `Livello ${n}`))
  ) as HTMLSelectElement;
  sel.addEventListener('change', () => {
    const cur = p.skills[k] || { level: 1, streak: 0, wrongStreak: 0, attempts: 0, correct: 0 };
    p.skills[k] = { ...cur, level: Number(sel.value), streak: 0, wrongStreak: 0 };
    persist();
    toast(`${p.name}: ${SKILL_INFO[k].name} al livello ${sel.value}`);
  });
  return sel;
}

function fmtMin(sec: number) {
  return `${Math.round(sec / 60)} min`;
}

export function showParents() {
  const root = beginScreen('parents-screen');
  const s = save.settings;
  const stats = h('div', { class: 'parent-stats' });
  if (!save.profiles.length) stats.append(h('p', {}, 'Nessun giocatore ancora creato.'));
  save.profiles.forEach((p) => {
    const rows = (Object.keys(SKILL_INFO) as SkillId[]).map((k) => {
      const v = pct(p, k);
      const lvl = p.skills[k]?.level || 0;
      return h(
        'div',
        { class: 'stat-row' },
        h('span', { class: 'stat-name' }, `${SKILL_INFO[k].icon} ${SKILL_INFO[k].name}`),
        h('span', { class: 'stat-bar' }, h('i', { style: `width:${v ?? 0}%;background:${v === null ? '#ccc' : v >= 75 ? '#43a047' : v >= 50 ? '#fdd835' : '#fb8c00'}` })),
        h('span', { class: 'stat-val' }, v === null ? '—' : `${v}%`),
        levelSelect(p, k, lvl || 1)
      );
    });
    const tried = (Object.keys(SKILL_INFO) as SkillId[]).filter((k) => (p.skills[k]?.attempts || 0) >= 4);
    const sorted = tried.sort((x, y) => (pct(p, x) || 0) - (pct(p, y) || 0));
    const weak = sorted.slice(0, 2).filter((k) => (pct(p, k) || 0) < 70);
    const strong = sorted.slice(-2).reverse().filter((k) => (pct(p, k) || 0) >= 75);
    const week = [...p.history.slice(-6), p.play].filter((d) => d.seconds > 0);
    stats.append(
      h(
        'section',
        { class: 'parent-card' },
        h('h3', {}, `${p.name}`),
        h(
          'p',
          {},
          `Oggi: ${p.play.date === today() ? fmtMin(p.play.seconds) : '0 min'} • Zone liberate: ${p.zoneProgress.filter((x) => x >= 3).length}/${p.zoneProgress.length} • Glitch: ${p.bossDone ? 'battuto' : 'no'} • Capitan Scompiglio: ${p.boss2Done ? 'battuto' : 'no'} • Dinosauri: ${p.dinosBuilt.length} • Mattoncini totali: ${p.totalBricks}`
        ),
        week.length ? h('p', { class: 'muted' }, 'Ultimi giorni: ' + week.map((d) => `${d.date.slice(5)} ${fmtMin(d.seconds)}`).join(' · ')) : null,
        strong.length ? h('p', {}, '💪 Punti forti: ' + strong.map((k) => SKILL_INFO[k].name).join(', ')) : null,
        weak.length ? h('p', {}, '🎯 Da allenare: ' + weak.map((k) => SKILL_INFO[k].name).join(', ')) : null,
        act2Select(p),
        h('p', { class: 'muted' }, 'Puoi scegliere il livello di ogni abilità: il gioco parte da lì e lo abbassa solo se servono più esercizi facili.'),
        h('div', { class: 'stat-list' }, ...rows),
        h('p', { class: 'muted' }, 'Missioni per zona: ' + ZONES.map((z) => `${z.short} ${p.zoneProgress[z.id]}/3`).join(' · '))
      )
    );
  });

  const range = (label: string, val: number, on: (v: number) => void) => {
    const r = h('input', { type: 'range', min: '0', max: '1', step: '0.05', value: String(val) }) as HTMLInputElement;
    r.addEventListener('input', () => {
      on(Number(r.value));
      applyVolumes();
      persist();
    });
    return h('label', { class: 'setting' }, h('span', {}, label), r);
  };
  const toggle = (label: string, val: boolean, on: (v: boolean) => void) => {
    const c = h('input', { type: 'checkbox', checked: val }) as HTMLInputElement;
    c.addEventListener('change', () => {
      on(c.checked);
      persist();
    });
    return h('label', { class: 'setting' }, h('span', {}, label), c);
  };
  const limit = h('select', {}, ...[0, 15, 20, 30, 45, 60, 90].map((m) => h('option', { value: String(m), selected: s.timeLimit === m }, m ? `${m} minuti al giorno` : 'Nessun limite'))) as HTMLSelectElement;
  limit.addEventListener('change', () => {
    s.timeLimit = Number(limit.value);
    persist();
  });
  const server = h('input', { type: 'text', value: s.serverUrl, placeholder: 'es. wss://mio-server.onrender.com/ws (vuoto = automatico)' }) as HTMLInputElement;
  server.addEventListener('change', () => {
    s.serverUrl = server.value.trim();
    persist();
    toast('Indirizzo server salvato');
  });
  const file = h('input', { type: 'file', accept: 'application/json', style: 'display:none' }) as HTMLInputElement;
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    if (importSave(await f.text())) {
      toast('Salvataggio importato!');
      showParents();
    } else toast('File non valido');
  });
  const doExport = () => {
    const blob = new Blob([exportSave()], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `isola-di-uly-${today()}.json` });
    document.body.append(a);
    a.click();
    a.remove();
  };

  root.append(
    topBar('👪 Area genitori', showTitle),
    h(
      'div',
      { class: 'parents-layout' },
      h('div', { class: 'col' }, h('h2', {}, '📊 Progressi'), stats),
      h(
        'div',
        { class: 'col' },
        h('h2', {}, '⚙️ Impostazioni'),
        h(
          'section',
          { class: 'parent-card' },
          range('🎵 Musica', s.music, (v) => (s.music = v)),
          range('🔊 Effetti', s.sfx, (v) => (s.sfx = v)),
          toggle('🗣️ Voce che legge le domande', s.voice, (v) => (s.voice = v)),
          toggle('🎨 Modalità daltonici (simboli sui colori)', s.colorblind, (v) => (s.colorblind = v)),
          h('label', { class: 'setting' }, h('span', {}, '⏰ Tempo di gioco'), limit),
          h('label', { class: 'setting col' }, h('span', {}, '🌐 Server multiplayer online'), server)
        ),
        h('h2', {}, '💾 Salvataggi'),
        h(
          'section',
          { class: 'parent-card row gap wrap' },
          brickBtn('⬇️ Esporta backup', doExport, 'blue', 'small'),
          brickBtn('⬆️ Importa backup', () => file.click(), 'yellow', 'small'),
          file
        ),
        h(
          'section',
          { class: 'parent-card' },
          h('h3', {}, 'ℹ️ Per i genitori'),
          h(
            'p',
            {},
            'Il gioco accompagna tutta la seconda elementare. Prima isola: numeri fino a 100, addizioni e sottrazioni, prime tabelline, forme, misure, sequenze, coding e logica. Isola Lontana (dopo Glitch): linea del 100 con salti da 10 e passi da 1, addizioni in colonna con il riporto, sottrazioni in colonna con il prestito, tutte le tabelline fino al ×9. Ogni missione alza un po\' il livello minimo. La difficoltà si adatta da sola: sale dopo 3 risposte giuste di fila e scende dopo 2 errori di fila. Nessuna pubblicità, nessun acquisto, nessun dato personale online: in multiplayer si usano solo nomi di dinosauri e messaggi predefiniti, senza chat.'
          )
        )
      )
    )
  );
}

/** Schermata di pausa quando il tempo giornaliero è finito. */
export function showRest() {
  const root = beginScreen('rest-screen');
  const v = modelView(BRICCO, 200, 260);
  root.append(
    h(
      'div',
      { class: 'col center rest' },
      v.el,
      h('h1', {}, 'Ora di una pausa! 😴'),
      h('p', { class: 'big-text' }, `Bravo ${current()?.name || ''}! Per oggi hai giocato tanto. Anche i dinosauri devono riposare. Ci vediamo domani!`),
      brickBtn('👪 Sblocca (genitori)', () =>
        showParentGate(() => {
          save.settings.unlockedUntil = today();
          persist();
          toast('Tempo extra sbloccato per oggi');
          showTitle();
        }), 'blue', 'small')
    )
  );
  speak('Ora di una pausa! Anche i dinosauri devono riposare. Ci vediamo domani!');
}
