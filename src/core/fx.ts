import { h } from './dom';

const BRICK_COLORS = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#fb8c00', '#8e24aa', '#00acc1'];

function layer() {
  return document.getElementById('fx')!;
}

/** Pioggia di mattoncini colorati. */
export function confetti(x = window.innerWidth / 2, y = window.innerHeight / 2, count = 26) {
  for (let i = 0; i < count; i++) {
    const c = BRICK_COLORS[i % BRICK_COLORS.length];
    const b = h('div', { class: 'confetti-brick', style: `left:${x}px;top:${y}px;--c:${c}` });
    const ang = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 220;
    b.animate(
      [
        { transform: 'translate(-50%,-50%) rotate(0deg) scale(1)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist - 60}px)) rotate(${Math.random() * 720 - 360}deg) scale(0.9)`,
          opacity: 1,
          offset: 0.6,
        },
        {
          transform: `translate(calc(-50% + ${Math.cos(ang) * dist * 1.2}px), calc(-50% + ${Math.sin(ang) * dist + 220}px)) rotate(${Math.random() * 720}deg) scale(0.6)`,
          opacity: 0,
        },
      ],
      { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }
    ).onfinish = () => b.remove();
    layer().append(b);
  }
}

export function confettiAt(el: Element, count?: number) {
  const r = el.getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + r.height / 2, count);
}

export function floatText(text: string, el: Element) {
  const r = el.getBoundingClientRect();
  const t = h('div', { class: 'float-text', style: `left:${r.left + r.width / 2}px;top:${r.top}px` }, text);
  layer().append(t);
  t.animate(
    [
      { transform: 'translate(-50%,0) scale(.6)', opacity: 0 },
      { transform: 'translate(-50%,-30px) scale(1.15)', opacity: 1, offset: 0.25 },
      { transform: 'translate(-50%,-90px) scale(1)', opacity: 0 },
    ],
    { duration: 1300, easing: 'ease-out' }
  ).onfinish = () => t.remove();
}

export function shake(el: Element) {
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px) rotate(-2deg)' },
      { transform: 'translateX(10px) rotate(2deg)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 420 }
  );
}

export function bounce(el: Element) {
  el.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(0.95)' }, { transform: 'scale(1)' }],
    { duration: 450, easing: 'ease-out' }
  );
}

export function toast(text: string) {
  const t = h('div', { class: 'toast' }, text);
  layer().append(t);
  t.animate(
    [
      { transform: 'translate(-50%, 40px)', opacity: 0 },
      { transform: 'translate(-50%, 0)', opacity: 1, offset: 0.12 },
      { transform: 'translate(-50%, 0)', opacity: 1, offset: 0.85 },
      { transform: 'translate(-50%, 40px)', opacity: 0 },
    ],
    { duration: 2600 }
  ).onfinish = () => t.remove();
}
