import type { Model } from './bricks';
import { shade } from './color';

export type DinoId = 'trice' | 'stego' | 'ptero' | 'ankylo' | 'trex' | 'brachio' | 'raptor' | 'spino' | 'parasaur';

export interface DinoDef {
  id: DinoId;
  name: string;
  nick: string;
  cost: number;
  /** zona da completare per poterlo costruire; -1 = dopo il castello */
  unlockZone: number;
  facts: string[];
  model: Model;
}

function m(rows: string[], A: string, B: string, C: string): Model {
  return { rows, colors: { A, B, C, D: shade(A, -0.3) } };
}

export const DINOS: DinoDef[] = [
  {
    id: 'trice',
    name: 'Triceratopo',
    nick: 'Trici',
    cost: 30,
    unlockZone: 0,
    facts: [
      'Il Triceratopo aveva tre corna sulla testa: per questo si chiama così!',
      'Il Triceratopo mangiava solo piante, era erbivoro.',
      'Il collare osseo del Triceratopo poteva essere largo come un tavolo!',
    ],
    model: m(
      [
        '...............W..',
        '...........CC.WW..',
        '..........CCAAW...',
        '....AAAAA.CAAAeAW.',
        '..AAAAAAAAACAAAAAW',
        '.AAAAAAAAAAAAAAAA.',
        'AAAAAAAAAAAAAAA...',
        'A..BBBBBBBBBBB....',
        '...DD.DD..DD.DD...',
        '...DD.DD..DD.DD...',
      ],
      '#fb8c00',
      '#ffcc80',
      '#e53935'
    ),
  },
  {
    id: 'stego',
    name: 'Stegosauro',
    nick: 'Stego',
    cost: 40,
    unlockZone: 1,
    facts: [
      'Lo Stegosauro aveva grandi placche sulla schiena.',
      'Il cervello dello Stegosauro era piccolo come una noce!',
      'Lo Stegosauro si difendeva con gli aculei sulla coda.',
    ],
    model: m(
      [
        '......C...C.......',
        '.....CCC.CCC.C....',
        '....CCCCCCCCCCC...',
        '...AAAAAAAAAAAAA..',
        'W.AAAAAAAAAAAAAAA.',
        'WAAAAAAAAAAAAAAAAA',
        'W..BBBBBBBBBBB.AeA',
        '...DD.DD...DD.DD..',
        '...DD.DD...DD.DD..',
      ],
      '#1e88e5',
      '#90caf9',
      '#fdd835'
    ),
  },
  {
    id: 'ptero',
    name: 'Pterodattilo',
    nick: 'Ptero',
    cost: 50,
    unlockZone: 2,
    facts: [
      'Lo Pterodattilo volava, ma non era proprio un dinosauro: era un rettile volante!',
      'Le ali dello Pterodattilo erano fatte di pelle, come quelle dei pipistrelli.',
      'Lo Pterodattilo mangiava pesci che pescava in volo.',
    ],
    model: m(
      [
        '.........CAA......',
        '..........AeAWWW..',
        'AA.......AAA......',
        '.AAA....AAA....AA.',
        '..AAAAAAAAAAAAAA..',
        '...AAAAABBAAAAA...',
        '.....AAABBAAA.....',
        '........DD........',
      ],
      '#8e24aa',
      '#ce93d8',
      '#ff7043'
    ),
  },
  {
    id: 'ankylo',
    name: 'Anchilosauro',
    nick: 'Anki',
    cost: 60,
    unlockZone: 3,
    facts: [
      "L'Anchilosauro era corazzato come un carro armato!",
      "L'Anchilosauro aveva una grossa mazza ossea in fondo alla coda.",
      "L'Anchilosauro era lungo come un'automobile.",
    ],
    model: m(
      [
        '....C.C.C.C.C.....',
        '...CCCCCCCCCCC....',
        '..AAAAAAAAAAAAA...',
        'WWAAAAAAAAAAAAAAeA',
        'WWAAAAAAAAAAAAAAAA',
        '....BBBBBBBBBB....',
        '....DD.DD..DD.DD..',
      ],
      '#795548',
      '#bcaaa4',
      '#fdd835'
    ),
  },
  {
    id: 'trex',
    name: 'Tirannosauro',
    nick: 'Rex',
    cost: 75,
    unlockZone: 4,
    facts: [
      'Il Tirannosauro Rex aveva denti lunghi come banane!',
      'Il T-Rex aveva braccia cortissime, ma molto forti.',
      'Il T-Rex era alto come una casa a due piani.',
    ],
    model: m(
      [
        '..........AAAAA.',
        '.........AAAAeAA',
        '.........AAAAAAA',
        '.........AAAWWW.',
        '.........AAAAAA.',
        'A.......AAAAA...',
        'AA.....AAAAAC...',
        '.AAAAAAAAAAA.C..',
        '..AAAAAAAABB....',
        '...AAAAAABBB....',
        '....AAAAAAB.....',
        '.....DD..DD.....',
        '.....DD..DD.....',
        '....WDD.WDD.....',
      ],
      '#43a047',
      '#aed581',
      '#2e7d32'
    ),
  },
  {
    id: 'brachio',
    name: 'Brachiosauro',
    nick: 'Brachi',
    cost: 90,
    unlockZone: 5,
    facts: [
      'Il Brachiosauro aveva un collo lunghissimo per mangiare le foglie in cima agli alberi.',
      'Il Brachiosauro pesava come dieci elefanti!',
      'Le zampe davanti del Brachiosauro erano più lunghe di quelle dietro.',
    ],
    model: m(
      [
        '...........AAAA.',
        '...........AeAAA',
        '...........AAA..',
        '...........AA...',
        '..........AAA...',
        '..........AA....',
        '.........AAA....',
        '.........AA.....',
        '....AAAAAAAA....',
        '..AAAAAAAAAAA...',
        '.AAAAAAAAAAAAA..',
        'AA.AABBBBBBAAA..',
        '...DD.DD..DD.DD.',
        '...DD.DD..DD.DD.',
        '...DD.DD..DD.DD.',
      ],
      '#00acc1',
      '#80deea',
      '#00838f'
    ),
  },
  {
    id: 'raptor',
    name: 'Velociraptor',
    nick: 'Veloce',
    cost: 100,
    unlockZone: 6,
    facts: [
      'Il Velociraptor era grande più o meno come un tacchino.',
      'Il Velociraptor aveva le piume, come gli uccelli!',
      'Il Velociraptor aveva un artiglio a forma di falce su ogni zampa.',
    ],
    model: m(
      [
        '...........AAAA.',
        '..........AAeAAA',
        '..........AAAWW.',
        'A........AAAA...',
        '.AA....AAAAC....',
        '..AAAAAAAAA.C...',
        '....AAAAABB.....',
        '.....AAAAB......',
        '......D..D......',
        '......D..D......',
        '.....WD.WD......',
      ],
      '#e53935',
      '#ffab91',
      '#fdd835'
    ),
  },
  {
    id: 'spino',
    name: 'Spinosauro',
    nick: 'Spino',
    cost: 120,
    unlockZone: 6,
    facts: [
      'Lo Spinosauro aveva una grande vela sulla schiena.',
      'Lo Spinosauro sapeva nuotare e mangiava pesci giganti.',
      'Lo Spinosauro era ancora più lungo del T-Rex!',
    ],
    model: m(
      [
        '.....C..C.........',
        '....CCCCCC........',
        '...CCCCCCCC.......',
        '...CCCCCCCCC...AAA',
        'A.AAAAAAAAAAAAAAeA',
        '.AAAAAAAAAAAAAAAWW',
        '...AAAAAABBB......',
        '....DD....DD......',
        '....DD....DD......',
        '...WDD...WDD......',
      ],
      '#3949ab',
      '#9fa8da',
      '#ff7043'
    ),
  },
  {
    id: 'parasaur',
    name: 'Parasaurolofo',
    nick: 'Paro',
    cost: 140,
    unlockZone: 6,
    facts: [
      'Il Parasaurolofo aveva una cresta a forma di tubo sulla testa.',
      'Con la cresta il Parasaurolofo faceva suoni come una tromba!',
      'Il Parasaurolofo aveva un becco come quello di un\'anatra.',
    ],
    model: m(
      [
        '........CCCC....',
        '...........CAA..',
        '...........AeAA.',
        '...........AAAAW',
        '..........AAA...',
        'A........AAA....',
        '.AA...AAAAAA....',
        '..AAAAAAAAAA....',
        '...AAAABBBB.....',
        '....DD...DD.....',
        '....DD...DD.....',
      ],
      '#7cb342',
      '#dce775',
      '#fb8c00'
    ),
  },
];

export const dinoById = (id: string) => DINOS.find((d) => d.id === id)!;
