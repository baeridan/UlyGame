export type Speaker = 'narratore' | 'bricco' | 'glitch' | 'glitchBuono' | 'player' | `dino:${string}`;

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
};
