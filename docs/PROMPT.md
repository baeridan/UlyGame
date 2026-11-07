# Prompt di progetto approvato

**Gioco:** "L'Isola di Uly" – videogioco educativo per tablet multipiattaforma, per bambini di 7 anni.

**Richieste:**
- matematica e logica imparate giocando (programma di seconda elementare);
- dinosauri, stile "mattoncini" e stile "mondo a blocchi", in versione originale (senza marchi registrati);
- grafica accattivante;
- multiplayer locale e online;
- una storia;
- tutte le fasi: gioco completo, profili e area genitori, multiplayer, app per gli store.

**Risposte del genitore:**
1. "Uly" è il nome del bambino: compare nel titolo e nella storia.
2. Lingua italiana con sintesi vocale.
3. Tutte le fasi, con una storia.
4. Nessun dinosauro o argomento particolare da privilegiare.

**Scelte tecniche:**
- Web app installabile (PWA) in TypeScript + Vite, grafica disegnata con Canvas, CSS e SVG. È più leggera di Phaser, ha pulsanti grandi per il touch e funziona offline.
- Server Node.js + WebSocket per le stanze online (codice di 4 emoji, niente chat libera, nessun dato personale).
- Capacitor per Android e iOS.
