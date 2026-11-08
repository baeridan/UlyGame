# 🦖 L'Isola di Uly – Dino Mattoncini

Un videogioco educativo per **tablet** (iPad, Android, Chromebook, PC) pensato per bambini di **7 anni**.
Si impara **matematica e logica** giocando, in un'isola fatta di **blocchi** abitata da **dinosauri costruiti con i mattoncini**.

> Tutta la grafica è originale e disegnata dal codice: mondo a blocchi, mattoncini con i bottoncini e dinosauri a mattoncini.
> Non usa nomi, loghi, personaggi o immagini di marchi registrati.

---

## 📖 La storia

Glitch, un cubo dispettoso, ha fatto crollare la **Grande Torre dei Numeri**: i dinosauri si sono smontati e i sei
**Cristalli del Pensiero** sono nascosti nell'isola. Con l'aiuto di **Bricco**, il robot costruttore, il bambino libera una
zona alla volta risolvendo sfide, ricostruisce i dinosauri mattoncino per mattoncino e alla fine affronta Glitch nel suo castello.
Nel finale Glitch confessa che faceva dispetti perché nessuno giocava con lui, e diventa amico: un invito a giocare **insieme**.

| Zona | Cosa si impara | Dinosauro liberato |
|---|---|---|
| 🌼 Prateria Fiorita | contare, decine, addizioni/sottrazioni, maggiore/minore | Triceratopo |
| 🌴 Giungla Smeraldo | sequenze, l'intruso, problemi | Stegosauro |
| 🏖️ Spiaggia dei Mattoncini | forme, misure, copia del modello, tabelline ×2 | Pterodattilo |
| ⛏️ Miniera di Cristallo | miniera dei numeri, banco da lavoro, torri da 10 | Anchilosauro |
| 🌋 Vulcano Brontolone | bilancia (pre-algebra), coding con le frecce, tabelline | Tirannosauro |
| 🏔️ Vette Ghiacciate | dino-sudoku 4×4, problemi, calcolo entro 100 | Brachiosauro |
| 🏰 Castello di Glitch | sfida finale della prima isola | — |

Dopo Glitch arriva Capitan Scompiglio, un pappagallo pirata che ha rubato le Uova d'Oro dei dinosauri:
si parte per l'**Isola Lontana**, pensata per la seconda metà dell'anno.

| Zona (Isola Lontana) | Cosa si impara | Dinosauro liberato |
|---|---|---|
| 🌉 Ponte del Cento | linea del 100 a gruppi di 5 rossi e 5 blu: trovare i numeri, passi da 1, salti da 10, quanto manca a 100 | Velociraptor |
| ⚓ Porto del Riporto | addizioni in colonna: prima senza riporto, poi con il riporto (27 + 8, 38 + 45) | Mosasauro |
| 🦇 Grotta del Prestito | sottrazioni in colonna: prima senza prestito, poi con il prestito (23 − 7, 23 − 17) | Pachicefalosauro |
| 🌻 Giardino delle Tabelline | tabelline del 2, 10, 5, 3, 4 e 6 con salti sulla linea, schieramenti e tabelline da completare | Parasaurolofo |
| ⚙️ Officina dei Numeri | tabelline del 7, 8 e 9, riporto e prestito da ricordare da soli | Spinosauro |
| 🏴‍☠️ Nave di Scompiglio | sfida finale di tutto l'anno, poi il **Diploma di Super Costruttore** | Diplodoco |

Nell'Isola Lontana ogni missione alza il livello minimo: per esempio al Porto la prima missione è senza riporto,
la seconda introduce il riporto con l'aiuto passo passo, la terza lo chiede su numeri a due cifre.

## 🎮 Cosa c'è nel gioco

- **18 tipi di sfide** (matematica e logica), ognuna con **5 livelli**. La difficoltà si adatta da sola: sale dopo 3 risposte giuste di fila e scende dopo 2 errori di fila.
- **Addizioni e sottrazioni fino a 100**: entro 10 e 20 nei primi livelli, poi fino a 100 senza riporto (30 + 40, 43 + 25) e con riporto e prestito (38 + 27, 64 − 29, 45 + 55, 100 − 35).
- Dalla Miniera in poi le zone alzano il livello minimo: sulle Vette Ghiacciate e contro Glitch addizioni e problemi arrivano sempre fino a 100.
- Nell'area genitori si può scegliere il **livello di partenza** di ogni abilità (per esempio "Addizioni: fino a 100 con riporto").
- **Nessuna punizione**: al primo errore arriva un aiuto, al secondo il gioco mostra la soluzione con calma.
- **Voce in italiano** che legge domande e storia (sintesi vocale del dispositivo), con un pulsante 🔊 per riascoltare.
- **Laboratorio del Costruttore**: con i mattoncini guadagnati si costruiscono i dinosauri, che si montano mattoncino per mattoncino.
- **Album dei dinosauri** con curiosità vere.
- **Il mio Cantiere**: costruzione libera a blocchi (erba, pietra, diamanti, lava, mattoncini...).
- **Omino personalizzabile** (pelle, capelli, vestiti, casco da minatore, corona...).
- **Fino a 4 profili**.
- **Area genitori** (protetta da una moltiplicazione): progressi per abilità, punti forti e da allenare, minuti di gioco, limite di tempo giornaliero, volume, voce, **modalità daltonici**, backup esportabile.
- Musica e suoni generati dal codice, quindi niente file audio da scaricare.
- Funziona **offline** e si installa sulla schermata Home (PWA).

## 🤝 Multigiocatore

**Sullo stesso tablet**
- ⚡ **Sfida faccia a faccia**: schermo diviso, i due bambini uno di fronte all'altro. Vince chi arriva per primo a 8 risposte giuste. Ognuno sceglie la propria difficoltà, così fratelli di età diverse possono giocare insieme.
- 🦕 **Costruiamo insieme**: a turno si risponde per costruire un dinosauro in squadra.

**Online** (ognuno sul suo tablet)
- Si crea una stanza e si condivide un **codice di 4 simboli** (per esempio 🦖🌋💎⭐).
- Si può fare una **gara** oppure una partita **a squadra**, a turni.
- **Sicurezza per bambini**: niente chat libera (solo emoji e frasi predefinite come "Bravo!" o "Forza!"), nomi scelti da una lista di dinosauri, nessun dato personale inviato.

---

## 🚀 Avvio rapido

Serve [Node.js](https://nodejs.org) 18 o più recente.

```bash
npm install
npm run dev          # gioco su http://localhost:5173 (anche dal tablet sulla stessa rete Wi-Fi)
npm run dev:server   # (in un altro terminale) server multiplayer su :8787
```

Per provarlo sul tablet apri `http://IP-DEL-COMPUTER:5173` dal browser del tablet.

### Versione definitiva (un solo server per gioco e multiplayer)

```bash
npm run build        # crea la cartella dist/
npm start            # serve il gioco e il multiplayer su http://localhost:8787
```

Si può pubblicare gratis su un servizio che esegue Node.js (Render, Railway, Fly.io...):
- comando di build: `npm install && npm run build`
- comando di avvio: `npm start` (la porta viene letta da `PORT`)

Con HTTPS il gioco diventa installabile: su iPad da Safari ▸ Condividi ▸ *Aggiungi alla schermata Home*, su Android dal menu di Chrome ▸ *Installa app*.

## 📱 App Android da installare (APK)

```bash
npm run apk   # serve l'Android SDK (ANDROID_HOME); crea android/app/build/outputs/apk/debug/app-debug.apk
```

L'APK è firmato con una chiave fissa salvata nel progetto (`android/app/debug.keystore`), così le versioni nuove si installano sopra
quelle vecchie senza perdere i progressi. Nell'app la voce usa la sintesi vocale di Android.
Per installarlo sul tablet: apri il file .apk e consenti l'installazione da "origini sconosciute" quando Android lo chiede.

## 📱 App per gli store (Capacitor)

I progetti nativi sono già nelle cartelle `android/` e `ios/`.

```bash
npm run cap:android   # compila, sincronizza e apre Android Studio
npm run cap:ios       # compila, sincronizza e apre Xcode (serve un Mac)
```

Nell'app nativa il multiplayer online ha bisogno dell'indirizzo del server: va inserito in **Area genitori ▸ Server multiplayer online**
(per esempio `wss://il-tuo-server.onrender.com/ws`). Il multiplayer sullo stesso tablet funziona sempre, anche senza internet.

Le icone dell'app web sono in `public/`. Per quelle native si può usare `npx @capacitor/assets generate`.

---

## 🧱 Struttura del codice

```
src/
  main.ts               avvio
  styles.css            stile (pulsanti a mattoncino, layout per tablet)
  story.ts / zones.ts   storia e zone dell'isola
  core/                 salvataggi, difficoltà adattiva, audio, voce, effetti, rete
  art/                  disegno di mattoncini, blocchi isometrici, dinosauri, personaggi, icone
  games/                i 14 tipi di sfida (math, logic, maze, build, sudoku, mining, crafting)
  screens/              schermate (titolo, mappa, missioni, laboratorio, cantiere, genitori, multiplayer)
server/server.mjs       server WebSocket per le stanze online + file statici
```

Per gli sviluppatori: `http://localhost:5173/?test=mining:3` mostra subito una singola sfida (abilità:livello) per provarla.
