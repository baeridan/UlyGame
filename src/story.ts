export type Speaker = 'narratore' | 'bricco' | 'glitch' | 'glitchBuono' | 'scompiglio' | 'player' | `dino:${string}`;

export interface Line {
  who: Speaker;
  text: string;
}

export const STORY: Record<string, Line[]> = {
  prologue: [
    { who: 'narratore', text: "C'era una volta un'isola tutta fatta di blocchi e mattoncini: l'Isola dei Blocchi!" },
    { who: 'narratore', text: 'Lì vivevano tanti dinosauri di mattoncini, felici e colorati.' },
    { who: 'bricco', text: 'Ciao {name}! Io sono Bricco, il robot costruttore. Meno male che sei arrivato!' },
    { who: 'bricco', text: 'Stanotte Glitch, un cubo dispettoso, ha fatto crollare la Grande Torre dei Numeri!' },
    { who: 'glitch', text: 'Ah ah ah! Ho smontato tutti i dinosauri e ho nascosto i sei Cristalli del Pensiero! Niente più ordine!' },
    { who: 'bricco', text: 'Senza numeri e logica i dinosauri non si possono rimontare... ma tu sei bravissimo a pensare!' },
    { who: 'bricco', text: 'Risolvi le sfide, raccogli i mattoncini e ricostruisci i dinosauri. Andiamo nella Prateria Fiorita!' },
  ],
  'intro-0': [
    { who: 'bricco', text: 'Guarda! I pezzi del Triceratopo sono sparsi in mezzo ai fiori.' },
    { who: 'bricco', text: 'Per rimontarlo dobbiamo contare bene e fare le addizioni. Ogni risposta giusta aggiunge mattoncini!' },
    { who: 'glitch', text: 'Non ci riuscirai mai! Ho mescolato tutti i numeri! Bzzzt!' },
    { who: 'player', text: 'Non ho paura! Contare è facile!' },
  ],
  'outro-0': [
    { who: 'dino:trice', text: 'Rooaar! Grazie {name}! Sono di nuovo tutto intero, con tutte e tre le mie corna!' },
    { who: 'bricco', text: 'Hai trovato il primo Cristallo del Pensiero: il Cristallo del Conteggio!' },
    { who: 'bricco', text: 'Ora puoi costruire Trici nel Laboratorio con i tuoi mattoncini. Poi andiamo nella Giungla!' },
  ],
  'intro-1': [
    { who: 'bricco', text: 'Nella Giungla Smeraldo Glitch ha messo in disordine tutte le liane colorate.' },
    { who: 'glitch', text: 'Rosso, blu, rosso... e poi? Ah ah! Nessuno capirà mai le mie sequenze!' },
    { who: 'bricco', text: 'Guarda bene come si ripetono i colori e i numeri: così troviamo lo Stegosauro!' },
  ],
  'outro-1': [
    { who: 'dino:stego', text: 'Le mie placche sono tornate al loro posto! Sei un genio delle sequenze!' },
    { who: 'bricco', text: 'Secondo cristallo trovato: il Cristallo delle Sequenze! Prossima tappa: la Spiaggia!' },
  ],
  'intro-2': [
    { who: 'bricco', text: 'Sulla Spiaggia dei Mattoncini le onde hanno smontato tutti i castelli di sabbia.' },
    { who: 'glitch', text: 'Quadrati, triangoli, cerchi... li ho mischiati tutti! Bzzt!' },
    { who: 'bricco', text: 'Riconosci le forme e copia i modelli: lo Pterodattilo potrà volare di nuovo!' },
  ],
  'outro-2': [
    { who: 'dino:ptero', text: 'Squiiik! Posso volare di nuovo! Ti vedo dall\'alto, {name}!' },
    { who: 'bricco', text: 'Terzo cristallo: il Cristallo delle Forme! Ora scendiamo nella Miniera.' },
  ],
  'intro-3': [
    { who: 'bricco', text: 'La Miniera di Cristallo è piena di diamanti, oro e smeraldi!' },
    { who: 'bricco', text: 'Usa il banco da lavoro per costruire gli attrezzi, poi scava i blocchi giusti con il piccone.' },
    { who: 'glitch', text: 'Ho nascosto l\'Anchilosauro sotto tonnellate di pietra! Non lo troverai mai!' },
  ],
  'outro-3': [
    { who: 'dino:ankylo', text: 'Bum bum! La mia coda a mazza è tornata! Grazie per avermi tirato fuori!' },
    { who: 'bricco', text: 'Quarto cristallo: il Cristallo dei Minerali! Ma sento il Vulcano che brontola...' },
  ],
  'intro-4': [
    { who: 'bricco', text: 'Il Vulcano Brontolone è arrabbiato: Glitch ha sbilanciato tutte le rocce!' },
    { who: 'glitch', text: 'Il T-Rex è bloccato dietro i fiumi di lava! Ah ah ah!' },
    { who: 'bricco', text: 'Rimetti in equilibrio la bilancia e programma la strada sicura per il dinosauro.' },
  ],
  'outro-4': [
    { who: 'dino:trex', text: 'ROOOAAAR! Il re dei dinosauri è tornato! E tu sei il re dei numeri, {name}!' },
    { who: 'bricco', text: 'Quinto cristallo: il Cristallo dell\'Equilibrio! Ne manca solo uno, sulle Vette Ghiacciate.' },
  ],
  'intro-5': [
    { who: 'bricco', text: 'Brrr, che freddo! Sulle Vette Ghiacciate Glitch ha congelato il Brachiosauro.' },
    { who: 'glitch', text: 'Per sciogliere il ghiaccio devi risolvere il mio sudoku dei dinosauri! Impossibile!' },
    { who: 'player', text: 'Niente è impossibile se ci ragiono con calma!' },
  ],
  'outro-5': [
    { who: 'dino:brachio', text: 'Che bello, riesco di nuovo a vedere tutta l\'isola dall\'alto del mio collo!' },
    { who: 'bricco', text: 'Abbiamo tutti e sei i Cristalli del Pensiero! Ora possiamo andare al Castello di Glitch!' },
  ],
  'intro-boss': [
    { who: 'glitch', text: 'Cosa?! Sei arrivato fino al mio castello?' },
    { who: 'glitch', text: 'Allora sfidami! Rispondi alle mie domande più difficili, se ne sei capace!' },
    { who: 'bricco', text: 'Ogni risposta giusta rimette un pezzo della Grande Torre dei Numeri. Forza {name}!' },
  ],
  'outro-boss': [
    { who: 'glitch', text: 'Oh no... la Grande Torre è di nuovo in piedi...' },
    { who: 'glitch', text: 'Sai... io facevo dispetti perché nessuno giocava mai con me.' },
    { who: 'player', text: 'Allora vieni a giocare con noi! Con i numeri ci si diverte di più insieme!' },
    { who: 'glitchBuono', text: 'Davvero?! Evviva! Da oggi sarò Glitch il Buono!' },
    { who: 'narratore', text: "E così l'Isola dei Blocchi tornò in ordine, piena di dinosauri e di amici." },
    { who: 'bricco', text: 'Ora puoi sfidare i tuoi amici nella Sfida, costruire nel Cantiere e collezionare tutti i dinosauri!' },
  ],
  // ======================= SECONDA PARTE: L'ISOLA LONTANA =======================
  'act2-intro': [
    { who: 'narratore', text: "Una mattina, dalla cima della Grande Torre, Bricco vide qualcosa all'orizzonte..." },
    { who: 'bricco', text: "Guarda {name}! Laggiù c'è un'altra isola: l'Isola Lontana!" },
    { who: 'scompiglio', text: "Arrr! Sono Capitan Scompiglio, il pirata più disordinato del mare! Ho preso le Uova d'Oro dei dinosauri!" },
    { who: 'glitchBuono', text: "Oh no! Senza le Uova d'Oro i cuccioli di dinosauro non possono nascere!" },
    { who: 'bricco', text: 'Per arrivare laggiù costruiremo il Ponte del Cento: cento mattoncini in fila, cinque rossi e cinque blu!' },
    { who: 'player', text: 'Andiamo! A scuola ho imparato tante cose nuove!' },
  ],
  'intro-6': [
    { who: 'bricco', text: 'Ecco il Ponte del Cento! Ogni dieci mattoncini c\'è una torretta: 10, 20, 30... fino a 100.' },
    { who: 'bricco', text: 'I mattoncini sono a gruppi di cinque, cinque rossi e cinque blu: così li conti in un attimo, senza contarli uno per uno!' },
    { who: 'scompiglio', text: 'Arrr! Ho tolto i numeri dal ponte! Non saprai mai dove sei!' },
    { who: 'glitchBuono', text: 'Il Velociraptor è un campione di salti. Aiutalo: salti da 10 e passi da 1!' },
  ],
  'outro-6': [
    { who: 'dino:raptor', text: 'Salto da dieci, passo da uno... che divertimento! Grazie {name}!' },
    { who: 'bricco', text: "Hai salvato il primo Uovo d'Oro! Ora andiamo al Porto del Riporto." },
  ],
  'intro-7': [
    { who: 'bricco', text: 'Al porto bisogna caricare le casse sulle navi. Le contiamo con le addizioni in colonna!' },
    { who: 'bricco', text: 'Si parte sempre dalle unità, a destra. Se le unità fanno 10 o di più, una decina sale sopra le decine: è il riporto!' },
    { who: 'scompiglio', text: 'Le mie casse sono troppo pesanti per te! Arrr!' },
    { who: 'player', text: 'Unità, decine e riporto: ce la posso fare!' },
  ],
  'outro-7': [
    { who: 'dino:mosa', text: 'Splash! Grazie per avermi liberato dalla rete dei pirati!' },
    { who: 'bricco', text: "Secondo Uovo d'Oro! Ora entriamo nella Grotta del Prestito." },
  ],
  'intro-8': [
    { who: 'bricco', text: 'Nella grotta facciamo le sottrazioni in colonna. Ma a volte le unità non bastano...' },
    { who: 'glitchBuono', text: 'Allora si chiede in prestito una decina! La decina diventa dieci unità, e il conto si può fare.' },
    { who: 'scompiglio', text: 'Nella mia grotta nessuno presta niente a nessuno! Arrr!' },
  ],
  'outro-8': [
    { who: 'dino:pachy', text: 'Toc toc! Con la mia testa dura ho rotto la gabbia. Grazie {name}!' },
    { who: 'bricco', text: "Terzo Uovo d'Oro! Sento profumo di fiori: è il Giardino delle Tabelline." },
  ],
  'intro-9': [
    { who: 'bricco', text: 'Nel giardino i fiori crescono in file ordinate: 2, 4, 6, 8... sono le tabelline!' },
    { who: 'bricco', text: 'Moltiplicare vuol dire fare salti tutti uguali: 3 salti da 4 arrivano a 12.' },
    { who: 'scompiglio', text: 'Ho calpestato tutte le aiuole! Le file non tornano più! Arrr!' },
  ],
  'outro-9': [
    { who: 'dino:parasaur', text: 'Tu-tuuu! Suono la mia cresta-tromba per festeggiare le tabelline!' },
    { who: 'bricco', text: "Quarto Uovo d'Oro! Manca solo l'Officina dei Numeri." },
  ],
  'intro-10': [
    { who: 'bricco', text: "Nell'Officina dei Numeri le macchine usano tutto quello che hai imparato." },
    { who: 'glitchBuono', text: 'Tabelline del 7, dell\'8 e del 9, riporti e prestiti... sei pronto, {name}?' },
    { who: 'player', text: 'Prontissimo!' },
  ],
  'outro-10': [
    { who: 'dino:spino', text: 'Le macchine ripartono! Grazie, costruttore!' },
    { who: 'bricco', text: "Abbiamo salvato cinque Uova d'Oro... ma l'ultimo è sulla nave di Capitan Scompiglio, vicino al Faro!" },
  ],
  'intro-boss2': [
    { who: 'scompiglio', text: "Arrr! Vuoi l'ultimo uovo? Allora batti il mio equipaggio di domande!" },
    { who: 'bricco', text: 'Ogni risposta giusta riaccende una luce del Faro del Cento. Forza {name}!' },
  ],
  'outro-boss2': [
    { who: 'scompiglio', text: 'Mi arrendo... Il Faro è di nuovo acceso.' },
    { who: 'scompiglio', text: 'Sai, prendevo le uova perché volevo un equipaggio di amici...' },
    { who: 'player', text: 'Gli amici non si rubano: si trovano giocando insieme!' },
    { who: 'scompiglio', text: 'Allora... posso giocare con voi?' },
    { who: 'glitchBuono', text: 'Certo! Più siamo, più ci divertiamo!' },
    { who: 'dino:diplo', text: "Craaack! Sono nato! Ciao a tutti, io sono Dippy!" },
    { who: 'narratore', text: "E così tutte le uova si schiusero, e l'Isola Lontana si riempì di cuccioli e di amici." },
    { who: 'bricco', text: '{name}, hai attraversato tutta la seconda elementare dell\'isola. Sei un Super Costruttore!' },
  ],
};
