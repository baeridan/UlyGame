import { save } from './store';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

/** Nell'app Android/iOS si usa la voce nativa del sistema (il WebView non ha la sintesi vocale). */
const native = Capacitor.isNativePlatform();

let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  voice =
    voices.find((v) => v.lang.toLowerCase().startsWith('it') && /google|alice|federica|elsa|paola/i.test(v.name)) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('it')) ||
    null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

/** Ripulisce il testo da emoji e simboli prima di leggerlo. */
function clean(text: string) {
  return text
    .replace(/×/g, ' per ')
    .replace(/÷/g, ' diviso ')
    .replace(/(\d)\s*-\s*(\d)/g, '$1 meno $2')
    .replace(/\+/g, ' più ')
    .replace(/=\s*\?/g, ' fa? ')
    .replace(/\?{2,}/g, '?')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/[<>*_#]/g, ' ');
}

export function speak(text: string, opts: { pitch?: number; rate?: number } = {}) {
  if (!save.settings.voice) return;
  if (native) {
    TextToSpeech.stop()
      .catch(() => {})
      .then(() => TextToSpeech.speak({ text: clean(text), lang: 'it-IT', rate: opts.rate ?? 0.95, pitch: opts.pitch ?? 1.1, volume: 1, category: 'ambient' }))
      .catch(() => {});
    return;
  }
  if (!('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean(text));
    u.lang = 'it-IT';
    if (voice) u.voice = voice;
    u.rate = opts.rate ?? 0.95;
    u.pitch = opts.pitch ?? 1.1;
    speechSynthesis.speak(u);
  } catch {
    /* ignora */
  }
}

export function stopSpeech() {
  if (native) {
    TextToSpeech.stop().catch(() => {});
    return;
  }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
