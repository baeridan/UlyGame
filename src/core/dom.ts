type Child = Node | string | number | null | undefined | false;

/** Piccolo helper per creare elementi DOM. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'style') el.style.cssText = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const cleanups: (() => void)[] = [];

/** Registra una funzione da eseguire quando si cambia schermata. */
export function onCleanup(fn: () => void) {
  cleanups.push(fn);
}

export function runCleanups() {
  while (cleanups.length) {
    try {
      cleanups.pop()!();
    } catch (e) {
      console.error(e);
    }
  }
}

/**
 * Inizia una nuova schermata: ferma animazioni/timer della precedente e
 * restituisce il contenitore (già montato) in cui costruire la nuova.
 */
export function beginScreen(cls = ''): HTMLElement {
  runCleanups();
  const app = document.getElementById('app')!;
  const el = h('div', { class: `screen screen-enter ${cls}` });
  app.replaceChildren(el);
  window.scrollTo(0, 0);
  return el;
}

/** Loop di animazione che si ferma da solo al cambio schermata. */
export function animLoop(fn: (t: number, dt: number) => void | boolean) {
  let running = true;
  let last = performance.now();
  const tick = (t: number) => {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    if (fn(t / 1000, dt) === false) {
      running = false;
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const stop = () => (running = false);
  onCleanup(stop);
  return stop;
}

/** setTimeout cancellato al cambio schermata. */
export function later(ms: number, fn: () => void) {
  const id = window.setTimeout(fn, ms);
  onCleanup(() => clearTimeout(id));
  return id;
}

export function wait(ms: number) {
  return new Promise<void>((r) => later(ms, r));
}

export function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
