import { save } from './store';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

/** Nell'app Android/iOS si usa la voce nativa del sistema (il WebView non ha la sintesi vocale). */
const native = Capacitor.isNativePlatform();

export interface VoiceOption {
  name: string;
  label: string;
}

// ---------------- voci disponibili ----------------
let webVoices: SpeechSynthesisVoice[] = [];
let nativeVoices: { name: string; lang: string; localService: boolean; index: number }[] = [];
let nativeLoaded: Promise<void> | null = null;

function loadWebVoices() {
  if (!('speechSynthesis' in window)) return;
  webVoices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('it'));
}
if (!native && 'speechSynthesis' in window) {
  loadWebVoices();
  speechSynthesis.onvoiceschanged = loadWebVoices;
}

function loadNativeVoices() {
  if (!nativeLoaded)
    nativeLoaded = TextToSpeech.getSupportedVoices()
      .then(({ voices }) => {
        nativeVoices = voices
          .map((v, index) => ({ name: v.name, lang: v.lang, localService: v.localService, index }))
          .filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('it'));
      })
      .catch(() => {});
  return nativeLoaded;
}
if (native) loadNativeVoices();

function pretty(name: string, local: boolean) {
  // es. "it-it-x-itd-local" → "Voce D (sul tablet)"
  const m = name.match(/x-it([a-z])-(local|network)/i);
  if (m) return `Voce ${m[1].toUpperCase()} ${m[2] === 'network' ? '(internet, più naturale)' : '(sul tablet)'}`;
  return local ? name : `${name} (internet)`;
}

/** Elenco delle voci italiane installate, per l'area genitori. */
export async function italianVoices(): Promise<VoiceOption[]> {
  if (native) {
    await loadNativeVoices();
    return nativeVoices.map((v) => ({ name: v.name, label: pretty(v.name, v.localService) }));
  }
  loadWebVoices();
  return webVoices.map((v) => ({ name: v.name, label: v.name }));
}

function webVoice(): SpeechSynthesisVoice | null {
  const chosen = webVoices.find((v) => v.name === save.settings.voiceName);
  if (chosen) return chosen;
  // automatica: le voci "naturali" o "Google" suonano meglio di quelle di sistema
  return webVoices.find((v) => /natural|neural|google|alice|federica|elsa|isabella/i.test(v.name)) || webVoices[0] || null;
}

// ---------------- pulizia del testo ----------------
/** Versi e onomatopee: si sentono come effetti sonori, la voce li salta. */
const SOUNDS = /\b(bz+t|squi+k|cra+ck|r+o+a+r+|tu-tu+|arr+|gr+r+)\b[!.,]*/gi;

export function clean(text: string) {
  return (
    text
      .replace(/×/g, ' per ')
      .replace(/÷/g, ' diviso ')
      .replace(/(\d)\s*[-−]\s*(\d)/g, '$1 meno $2')
      .replace(/−/g, ' meno ')
      .replace(/\+/g, ' più ')
      .replace(/=\s*\?/g, ' fa? ')
      .replace(/\?{2,}/g, '?')
      .replace(SOUNDS, ' ')
      // parole tutte maiuscole (GRANDE, SPECCHIO): si leggono come parole, non lettera per lettera
      .replace(/\b([A-ZÀ-Ý]{2,})\b/g, (w) => w.toLowerCase())
      // lettere ripetute (Evvivaaa) → una sola
      .replace(/([a-zà-ý])\1{2,}/gi, '$1')
      .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
      .replace(/[<>*_#⬜]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
}

// ---------------- parlare ----------------
export function speak(text: string, opts: { pitch?: number; rate?: number } = {}, force = false) {
  if (!save.settings.voice && !force) return;
  const t = clean(text);
  if (!t) return;
  const rate = (opts.rate ?? 0.95) * (save.settings.voiceRate || 1);
  const pitch = opts.pitch ?? 1;
  if (native) {
    const v = nativeVoices.find((x) => x.name === save.settings.voiceName);
    TextToSpeech.stop()
      .catch(() => {})
      .then(() => TextToSpeech.speak({ text: t, lang: 'it-IT', rate, pitch, volume: 1, category: 'ambient', ...(v ? { voice: v.index } : {}) }))
      .catch(() => {});
    return;
  }
  if (!('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'it-IT';
    const v = webVoice();
    if (v) u.voice = v;
    u.rate = rate;
    u.pitch = pitch;
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
