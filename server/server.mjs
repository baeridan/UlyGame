// Server multiplayer di "L'Isola di Uly".
// - Serve i file del gioco (cartella dist) e un WebSocket su /ws.
// - Stanze da 2 giocatori con codice di 4 simboli. Nessuna chat, nessun dato personale:
//   i nomi sono indici di una lista predefinita e i messaggi sono solo emoji predefinite.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT || 8787);

const NAMES = 10; // numero di nomi predefiniti (vedi src/screens/online.ts)
const EMOTES = 10;
const RACE_TARGET = 8;
const COOP_TURNS = 10;
const CODE_SYMBOLS = 8;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://x');
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    return res.end(`ok ${rooms.size} stanze`);
  }
  let file = path.normalize(path.join(DIST, decodeURIComponent(url.pathname)));
  if (!file.startsWith(DIST)) {
    res.writeHead(403);
    return res.end();
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end("Server multiplayer attivo. Esegui 'npm run build' per servire anche il gioco.");
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

/** @type {Map<string, Room>} */
const rooms = new Map();

/**
 * @typedef {{ code: string, mode: 'race'|'coop', players: any[], sockets: import('ws').WebSocket[],
 *   scores: number[], progress: number, turn: number, over: boolean, again: Set<number>, created: number }} Room
 */

function newCode() {
  for (let i = 0; i < 1000; i++) {
    let c = '';
    for (let k = 0; k < 4; k++) c += Math.floor(Math.random() * CODE_SYMBOLS);
    if (!rooms.has(c)) return c;
  }
  return null;
}

const int = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

function cleanPlayer(p) {
  if (!p || typeof p !== 'object') return null;
  const a = p.a || {};
  if (!int(p.n, 0, NAMES - 1)) return null;
  for (const k of ['skin', 'hair', 'shirt', 'pants', 'hat']) if (!int(a[k], 0, 9)) return null;
  return { n: p.n, a: { skin: a.skin, hair: a.hair, shirt: a.shirt, pants: a.pants, hat: a.hat } };
}

function send(ws, msg) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function broadcast(room, msg) {
  room.sockets.forEach((s) => send(s, msg));
}

function start(room) {
  room.scores = [0, 0];
  room.progress = 0;
  room.turn = 0;
  room.over = false;
  room.again.clear();
  room.sockets.forEach((s, i) =>
    send(s, { t: 'start', mode: room.mode, you: i, players: room.players, turn: 0, target: room.mode === 'race' ? RACE_TARGET : COOP_TURNS })
  );
}

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 2048 });

wss.on('connection', (ws) => {
  /** @type {Room|null} */
  let room = null;
  let idx = -1;
  let last = 0;
  let burst = 0;

  ws.on('message', (raw) => {
    // limite semplice di frequenza
    const now = Date.now();
    if (now - last < 1000) burst++;
    else burst = 0;
    last = now;
    if (burst > 20) return;
    let m;
    try {
      m = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (!m || typeof m.t !== 'string') return;

    if (m.t === 'create' && !room) {
      const p = cleanPlayer(m.p);
      if (!p || (m.mode !== 'race' && m.mode !== 'coop')) return send(ws, { t: 'error', msg: 'Dati non validi' });
      const code = newCode();
      if (!code) return send(ws, { t: 'error', msg: 'Troppe stanze aperte, riprova più tardi' });
      room = { code, mode: m.mode, players: [p], sockets: [ws], scores: [0, 0], progress: 0, turn: 0, over: false, again: new Set(), created: now };
      idx = 0;
      rooms.set(code, room);
      return send(ws, { t: 'created', code, mode: m.mode });
    }

    if (m.t === 'join' && !room) {
      const p = cleanPlayer(m.p);
      const r = typeof m.code === 'string' ? rooms.get(m.code) : undefined;
      if (!p) return send(ws, { t: 'error', msg: 'Dati non validi' });
      if (!r) return send(ws, { t: 'error', msg: 'Stanza non trovata. Controlla il codice!' });
      if (r.sockets.length >= 2) return send(ws, { t: 'error', msg: 'La stanza è già piena' });
      room = r;
      idx = 1;
      r.players.push(p);
      r.sockets.push(ws);
      return start(r);
    }

    if (!room || room.sockets.length < 2) return;

    switch (m.t) {
      case 'score':
        if (room.mode !== 'race' || room.over || !int(m.v, 0, RACE_TARGET)) return;
        if (m.v !== room.scores[idx] + 1) return; // solo un punto alla volta
        room.scores[idx] = m.v;
        broadcast(room, { t: 'score', who: idx, v: m.v });
        if (m.v >= RACE_TARGET) {
          room.over = true;
          broadcast(room, { t: 'end', winner: idx });
        }
        break;
      case 'turn':
        if (room.mode !== 'coop' || room.over || room.turn !== idx || typeof m.ok !== 'boolean') return;
        room.progress++;
        room.turn = 1 - room.turn;
        broadcast(room, { t: 'turn', progress: room.progress, turn: room.turn, ok: m.ok, by: idx });
        if (room.progress >= COOP_TURNS) {
          room.over = true;
          broadcast(room, { t: 'end', winner: -1 });
        }
        break;
      case 'emote':
        if (!int(m.id, 0, EMOTES - 1)) return;
        broadcast(room, { t: 'emote', who: idx, id: m.id });
        break;
      case 'again':
        if (!room.over) return;
        room.again.add(idx);
        broadcast(room, { t: 'again', who: idx });
        if (room.again.size === 2) start(room);
        break;
    }
  });

  ws.on('close', () => {
    if (!room) return;
    const other = room.sockets[1 - idx];
    send(other, { t: 'left' });
    rooms.delete(room.code);
    room.sockets.forEach((s) => s !== ws && s.close());
  });
});

// pulizia delle stanze vecchie (30 minuti)
setInterval(() => {
  const now = Date.now();
  for (const [code, r] of rooms)
    if (now - r.created > 30 * 60 * 1000 && r.sockets.length < 2) {
      r.sockets.forEach((s) => s.close());
      rooms.delete(code);
    }
}, 60 * 1000).unref();

server.listen(PORT, () => console.log(`🦖 Server dell'Isola di Uly su http://localhost:${PORT} (WebSocket su /ws)`));
