import type { Model } from './bricks';
import type { Avatar } from '../core/store';

export const BRICCO: Model = {
  rows: [
    '....R....',
    '....K....',
    '.YYYYYYY.',
    '.YEEYEEY.',
    '.YYYYYYY.',
    '.YKKKKKY.',
    '...GGG...',
    'BBBBBBBBB',
    'B.BRRRB.B',
    'Y.BBBBB.Y',
    '..BBBBB..',
    '..GG.GG..',
    '.KKK.KKK.',
  ],
  colors: { Y: '#fdd835', E: '#4dd0e1', K: '#263238', G: '#90a4ae', B: '#1e88e5', R: '#e53935' },
};

export const GLITCH: Model = {
  rows: [
    'PPQPPPQPP',
    'PQPPPPPQP',
    'PKKPPPKKP',
    'PWKPPPWKP',
    'PWWPPPWWP',
    'PPPPPPPPP',
    'PPKKKKKPP',
    'QPKPPPKPQ',
    'PPPQPPQPP',
  ],
  colors: { P: '#6a1b9a', Q: '#ea80fc', W: '#ffffff', K: '#1a0026' },
};

/** Glitch dopo essere diventato buono */
export const GLITCH_FRIEND: Model = {
  rows: [
    'PPQPPPQPP',
    'PQPPPPPQP',
    'PPPPPPPPP',
    'PWKPPPWKP',
    'PWWPPPWWP',
    'PPPPPPPPP',
    'PKPPPPPKP',
    'QPKKKKKPQ',
    'PPPQPPQPP',
  ],
  colors: { P: '#8e24aa', Q: '#ea80fc', W: '#ffffff', K: '#1a0026' },
};

/** Capitan Scompiglio, il pappagallo pirata di mattoncini */
export const SCOMPIGLIO: Model = {
  rows: [
    '...KKKKK...',
    '..KKKWKKK..',
    '.KKKKKKKKK.',
    '...RRRRR...',
    '..RReRRKKY.',
    '..RRRRRRYY.',
    '...RRRRR...',
    '..GGRRRGG..',
    '.GGGRRRGGG.',
    '.GGBBBBBGG.',
    '..GBBBBBG..',
    '...Y...Y...',
    '..YY..YY...',
  ],
  colors: { R: '#e53935', G: '#43a047', B: '#1e88e5', Y: '#fdd835', K: '#212121', W: '#ffffff' },
};

export const SKINS = ['#ffcc80', '#e0a96d', '#a1665e', '#6d4c41', '#ffe082'];
export const HAIRS = ['#3e2723', '#8d6e63', '#fdd835', '#e65100', '#212121', '#b0bec5'];
export const CLOTHES = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#fb8c00', '#8e24aa', '#00acc1', '#f06292'];
export const HATS = ['Nessuno', 'Casco da minatore', 'Cappello esploratore', 'Corona', 'Cappellino'];

export function avatarModel(a: Avatar): Model {
  const hats: [string, string][] = [
    ['........', '........'],
    ['..YYYY..', '.YYLLYY.'],
    ['..NNNN..', 'NNNNNNNN'],
    ['.G.GG.G.', '.GGRGGG.'],
    ['..CCCC..', '.CCCCCCC'],
  ];
  const [h0, h1] = hats[a.hat] || hats[0];
  return {
    rows: [
      h0,
      h1,
      '.HHHHHH.',
      '.HSSSSH.',
      '.SKSSKS.',
      '.SSSSSS.',
      '.SSMMSS.',
      '.TTTTTT.',
      'TTTTTTTT',
      'TTTTTTTT',
      'S.TTTT.S',
      '.PPPPPP.',
      '.PP..PP.',
      '.KK..KK.',
    ],
    colors: {
      S: SKINS[a.skin % SKINS.length],
      H: HAIRS[a.hair % HAIRS.length],
      T: CLOTHES[a.shirt % CLOTHES.length],
      P: a.pants === a.shirt ? '#37474f' : CLOTHES[a.pants % CLOTHES.length],
      K: '#263238',
      M: '#c62828',
      Y: '#fdd835',
      L: '#fff59d',
      N: '#c8a165',
      G: '#ffca28',
      R: '#e53935',
      C: '#e53935',
    },
  };
}
