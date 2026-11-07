import { save } from './store';

export type ServerMsg =
  | { t: 'created'; code: string; mode: 'race' | 'coop' }
  | { t: 'start'; mode: 'race' | 'coop'; you: number; players: NetPlayer[]; turn: number; target: number }
  | { t: 'score'; who: number; v: number }
  | { t: 'turn'; progress: number; turn: number; ok: boolean; by: number }
  | { t: 'end'; winner: number }
  | { t: 'emote'; who: number; id: number }
  | { t: 'again'; who: number }
  | { t: 'left' }
  | { t: 'error'; msg: string };

export interface NetPlayer {
  n: number;
  a: { skin: number; hair: number; shirt: number; pants: number; hat: number };
}

export function serverUrl(): string {
  if (save.settings.serverUrl) return save.settings.serverUrl;
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  }
  return '';
}

export class Net {
  ws: WebSocket | null = null;
  onMsg: (m: ServerMsg) => void = () => {};
  onClose: () => void = () => {};
  private closedByMe = false;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = serverUrl();
      if (!url) return reject(new Error('Nessun server configurato'));
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (e) {
        return reject(e);
      }
      this.ws = ws;
      const timer = setTimeout(() => {
        ws.close();
        reject(new Error('timeout'));
      }, 6000);
      ws.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Connessione fallita'));
      };
      ws.onmessage = (e) => {
        try {
          this.onMsg(JSON.parse(String(e.data)));
        } catch {
          /* ignora */
        }
      };
      ws.onclose = () => {
        if (!this.closedByMe) this.onClose();
      };
    });
  }

  send(m: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m));
  }

  close() {
    this.closedByMe = true;
    this.ws?.close();
  }
}
