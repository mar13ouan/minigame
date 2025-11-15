export type AttackAnimation = {
  effect:
    | 'slash'
    | 'burst'
    | 'beam'
    | 'ring'
    | 'wave'
    | 'thorn'
    | 'dash'
    | 'spark'
    | 'quake'
    | 'wind'
    | 'pulse'
    | 'meteor';
  color: string;
  secondary?: string;
  angle?: number;
  offset?: number;
  rise?: number;
  spread?: number;
  width?: number;
  duration?: number;
  intensity?: number;
  mirror?: boolean;
};

export type AttackDefinition = {
  id: string;
  name: string;
  damage: number;
  successRate: number;
  description: string;
  animation: AttackAnimation;
};

export type MonsterDefinition = {
  id: string;
  name: string;
  color: string;
  baseStats: Stats;
  evolutions: Evolution[];
  description: string;
  attacks: AttackDefinition[];
};

export type Evolution = {
  target: string;
  requirement: (stats: Stats) => boolean;
  description: string;
};

export type Stats = {
  level: number;
  power: number;
  defense: number;
  speed: number;
  morale: number;
};

export type MonsterInstance = {
  definition: MonsterDefinition;
  stats: Stats;
};

const makeStats = (level: number, power: number, defense: number, speed: number, morale: number): Stats => ({
  level,
  power,
  defense,
  speed,
  morale
});

export const monsterDefinitions: Record<string, MonsterDefinition> = {
  sproutle: {
    id: 'sproutle',
    name: 'Sproutle',
    color: '#4ade80',
    baseStats: makeStats(1, 6, 4, 5, 5),
    description: 'Une graine curieuse qui aime explorer.',
    attacks: [
      {
        id: 'leaf-whip',
        name: 'Fouet Feuillu',
        damage: 4,
        successRate: 0.95,
        description: 'Une rafale de feuilles rapides.',
        animation: {
          effect: 'slash',
          color: '#4ade80',
          secondary: '#bbf7d0',
          angle: -18,
          offset: 28,
          rise: -6,
          spread: 1.1,
          duration: 0.45
        }
      },
      {
        id: 'root-snare',
        name: 'Racines Piégeuses',
        damage: 6,
        successRate: 0.75,
        description: 'Entrave l ennemi avec des racines.',
        animation: {
          effect: 'thorn',
          color: '#16a34a',
          secondary: '#4ade80',
          offset: 18,
          rise: 12,
          spread: 1.25,
          duration: 0.55
        }
      },
      {
        id: 'solar-sprout',
        name: 'Germe Solaire',
        damage: 8,
        successRate: 0.55,
        description: 'Canalise la lumière en une explosion.',
        animation: {
          effect: 'burst',
          color: '#facc15',
          secondary: '#fde68a',
          duration: 0.6,
          spread: 1.35
        }
      }
    ],
    evolutions: [
      {
        target: 'bloomtail',
        requirement: stats => stats.power >= 12,
        description: 'Deviens Bloomtail quand la puissance domine.'
      },
      {
        target: 'glimmeroot',
        requirement: stats => stats.speed >= 12,
        description: 'Une évolution vive pour les explorateurs rapides.'
      },
      {
        target: 'verdant-warden',
        requirement: stats => stats.defense >= 14 && stats.morale >= 14,
        description: 'Le gardien verdoyant protège la forêt lorsque Sproutle atteint la sagesse.'
      }
    ]
  },
  flaruba: {
    id: 'flaruba',
    name: 'Flaruba',
    color: '#f97316',
    baseStats: makeStats(1, 7, 5, 4, 4),
    description: 'Un renard incandescent au coeur loyal.',
    attacks: [
      {
        id: 'ember-dash',
        name: 'Ruée de Braises',
        damage: 5,
        successRate: 0.9,
        description: 'Une charge enveloppée de braises.',
        animation: {
          effect: 'dash',
          color: '#fb923c',
          secondary: '#f97316',
          offset: 20,
          duration: 0.45,
          spread: 1.1
        }
      },
      {
        id: 'flame-ring',
        name: 'Anneau de Flammes',
        damage: 7,
        successRate: 0.7,
        description: 'Projette un cercle ardent autour de l ennemi.',
        animation: {
          effect: 'ring',
          color: '#f97316',
          secondary: '#fb7185',
          width: 180,
          duration: 0.55,
          spread: 1.2,
          mirror: false
        }
      },
      {
        id: 'cinder-lance',
        name: 'Lance de Cendres',
        damage: 9,
        successRate: 0.5,
        description: 'Concentre la chaleur en un jet intense.',
        animation: {
          effect: 'beam',
          color: '#f97316',
          secondary: '#fde68a',
          width: 200,
          duration: 0.55,
          angle: -4
        }
      }
    ],
    evolutions: [
      {
        target: 'pyrolynx',
        requirement: stats => stats.morale >= 12,
        description: 'Pyrolynx émerge quand le courage est au sommet.'
      },
      {
        target: 'obsidrax',
        requirement: stats => stats.defense >= 12,
        description: 'La carapace se durcit pour former Obsidrax.'
      },
      {
        target: 'solaryn',
        requirement: stats => stats.power >= 14 && stats.speed >= 11,
        description: 'L entraînement acharné allume la flamme de Solaryn.'
      }
    ]
  },
  tidebble: {
    id: 'tidebble',
    name: 'Tidebble',
    color: '#60a5fa',
    baseStats: makeStats(1, 5, 6, 5, 4),
    description: 'Une bulle marine à la personnalité fluctuante.',
    attacks: [
      {
        id: 'bubble-pop',
        name: 'Pluie de Bulles',
        damage: 4,
        successRate: 0.95,
        description: 'Bombarde de bulles éclatantes.',
        animation: {
          effect: 'pulse',
          color: '#60a5fa',
          secondary: '#c4f1ff',
          duration: 0.5,
          spread: 1.2,
          mirror: false
        }
      },
      {
        id: 'tidal-wave',
        name: 'Vague Montante',
        damage: 6,
        successRate: 0.75,
        description: 'Un remous puissant qui submerge.',
        animation: {
          effect: 'wave',
          color: '#38bdf8',
          secondary: '#22d3ee',
          offset: 22,
          duration: 0.6,
          spread: 1.1
        }
      },
      {
        id: 'abyss-pulse',
        name: 'Pulse Abyssal',
        damage: 9,
        successRate: 0.5,
        description: 'Un choc d eau condensée.',
        animation: {
          effect: 'beam',
          color: '#1d4ed8',
          secondary: '#60a5fa',
          width: 210,
          duration: 0.6,
          angle: -6
        }
      }
    ],
    evolutions: [
      {
        target: 'mistgale',
        requirement: stats => stats.speed >= 11 && stats.morale >= 10,
        description: 'Mistgale se forme quand l esprit est léger.'
      },
      {
        target: 'abyssaur',
        requirement: stats => stats.power >= 11 && stats.defense >= 10,
        description: 'Quand la force augmente, Tidebble devient Abyssaur.'
      },
      {
        target: 'tide-archon',
        requirement: stats => stats.level >= 12 && stats.morale >= 12,
        description: 'Le souverain des marées se révèle aux compagnons équilibrés.'
      }
    ]
  },
  'verdant-warden': {
    id: 'verdant-warden',
    name: 'Gardien Verdoyant',
    color: '#166534',
    baseStats: makeStats(12, 17, 18, 14, 18),
    description: 'Un protecteur majestueux des bois sacrés.',
    attacks: [
      {
        id: 'warden-lance',
        name: 'Lance des Sylves',
        damage: 16,
        successRate: 0.8,
        description: 'Une pointe de racine infusée de magie.',
        animation: {
          effect: 'thorn',
          color: '#15803d',
          secondary: '#bbf7d0',
          offset: 26,
          duration: 0.55,
          spread: 1.25
        }
      },
      {
        id: 'emerald-barrier',
        name: 'Barrière Émeraude',
        damage: 12,
        successRate: 0.9,
        description: 'Un rempart qui repousse les ennemis.',
        animation: {
          effect: 'ring',
          color: '#4ade80',
          secondary: '#22c55e',
          width: 220,
          duration: 0.6,
          spread: 1.15,
          mirror: false
        }
      },
      {
        id: 'ancient-judgement',
        name: 'Jugement Ancien',
        damage: 20,
        successRate: 0.55,
        description: 'Invoque la colère des esprits sylvestres.',
        animation: {
          effect: 'meteor',
          color: '#facc15',
          secondary: '#16a34a',
          duration: 0.75,
          spread: 1.35,
          offset: 18
        }
      }
    ],
    evolutions: []
  },
  solaryn: {
    id: 'solaryn',
    name: 'Solaryn',
    color: '#f97316',
    baseStats: makeStats(12, 20, 14, 17, 18),
    description: 'Un phénix solaire étincelant de bravoure.',
    attacks: [
      {
        id: 'solar-dive',
        name: 'Plongeon Solaire',
        damage: 18,
        successRate: 0.75,
        description: 'Fond sur la cible enflammée.',
        animation: {
          effect: 'dash',
          color: '#fbbf24',
          secondary: '#f97316',
          offset: 30,
          duration: 0.5,
          spread: 1.3
        }
      },
      {
        id: 'radiant-storm',
        name: 'Tempête Radieuse',
        damage: 22,
        successRate: 0.55,
        description: 'Une pluie de lumière brûlante.',
        animation: {
          effect: 'meteor',
          color: '#fde047',
          secondary: '#fb7185',
          duration: 0.7,
          spread: 1.2,
          offset: 24
        }
      },
      {
        id: 'phoenix-cry',
        name: 'Cri du Phénix',
        damage: 14,
        successRate: 0.9,
        description: 'Une onde sonore qui galvanise.',
        animation: {
          effect: 'pulse',
          color: '#fb7185',
          secondary: '#f97316',
          duration: 0.6,
          spread: 1.3
        }
      }
    ],
    evolutions: []
  },
  'tide-archon': {
    id: 'tide-archon',
    name: 'Archonte des Marées',
    color: '#1d4ed8',
    baseStats: makeStats(12, 17, 17, 16, 18),
    description: 'Le souverain des océans commande les houles.',
    attacks: [
      {
        id: 'typhoon-blade',
        name: 'Lame Typhon',
        damage: 18,
        successRate: 0.8,
        description: 'Tranche avec un typhon concentré.',
        animation: {
          effect: 'slash',
          color: '#38bdf8',
          secondary: '#0ea5e9',
          angle: -10,
          offset: 40,
          duration: 0.5,
          spread: 1.2
        }
      },
      {
        id: 'abyssal-surge',
        name: 'Flux Abyssal',
        damage: 21,
        successRate: 0.6,
        description: 'Libère un torrent des profondeurs.',
        animation: {
          effect: 'wave',
          color: '#2563eb',
          secondary: '#22d3ee',
          offset: 28,
          duration: 0.65,
          spread: 1.3
        }
      },
      {
        id: 'leviathan-roar',
        name: 'Rugissement Léviathan',
        damage: 24,
        successRate: 0.45,
        description: 'Fait trembler la mer et l air.',
        animation: {
          effect: 'quake',
          color: '#0ea5e9',
          secondary: '#38bdf8',
          duration: 0.75,
          intensity: 1.5,
          spread: 1.2
        }
      }
    ],
    evolutions: []
  },
  bloomtail: {
    id: 'bloomtail',
    name: 'Bloomtail',
    color: '#22c55e',
    baseStats: makeStats(5, 13, 9, 12, 8),
    description: 'Un dragon feuille agile qui danse dans le vent.',
    attacks: [
      {
        id: 'verdant-surge',
        name: 'Déferlante Verte',
        damage: 8,
        successRate: 0.9,
        description: 'Une lame d énergie végétale.',
        animation: {
          effect: 'slash',
          color: '#22c55e',
          secondary: '#bef264',
          angle: -12,
          offset: 34,
          spread: 1.2,
          duration: 0.5
        }
      },
      {
        id: 'petal-tempest',
        name: 'Tempête de Pétales',
        damage: 11,
        successRate: 0.65,
        description: 'Un cyclone cinglant de pétales.',
        animation: {
          effect: 'wind',
          color: '#f472b6',
          secondary: '#22c55e',
          offset: 22,
          spread: 1.3,
          duration: 0.65
        }
      },
      {
        id: 'wyrm-root',
        name: 'Racine Dragonnée',
        damage: 14,
        successRate: 0.45,
        description: 'Frappe avec des racines acérées.',
        animation: {
          effect: 'thorn',
          color: '#166534',
          secondary: '#22c55e',
          offset: 20,
          rise: 16,
          spread: 1.35,
          duration: 0.6
        }
      }
    ],
    evolutions: []
  },
  glimmeroot: {
    id: 'glimmeroot',
    name: 'Glimmeroot',
    color: '#a3e635',
    baseStats: makeStats(5, 11, 8, 14, 7),
    description: 'Une créature sylvestre qui se fond dans la lumière.',
    attacks: [
      {
        id: 'dawn-blades',
        name: 'Lames de l Aube',
        damage: 7,
        successRate: 0.92,
        description: 'Des traits lumineux d une grande précision.',
        animation: {
          effect: 'slash',
          color: '#bef264',
          secondary: '#fef08a',
          angle: -10,
          offset: 32,
          duration: 0.45,
          spread: 1.15
        }
      },
      {
        id: 'glint-field',
        name: 'Champ Mirroir',
        damage: 10,
        successRate: 0.7,
        description: 'Réfracte la lumière pour surprendre.',
        animation: {
          effect: 'burst',
          color: '#fde68a',
          secondary: '#bef264',
          duration: 0.55,
          spread: 1.4,
          mirror: false
        }
      },
      {
        id: 'meteor-bloom',
        name: 'Floraison Météore',
        damage: 13,
        successRate: 0.5,
        description: 'Un faisceau de graines explosives.',
        animation: {
          effect: 'meteor',
          color: '#facc15',
          secondary: '#fb7185',
          duration: 0.7,
          offset: 16,
          spread: 1.2
        }
      }
    ],
    evolutions: []
  },
  pyrolynx: {
    id: 'pyrolynx',
    name: 'Pyrolynx',
    color: '#fb7185',
    baseStats: makeStats(5, 15, 10, 11, 13),
    description: 'Un félin flamboyant au regard perçant.',
    attacks: [
      {
        id: 'flare-pounce',
        name: 'Bond Flamboyant',
        damage: 9,
        successRate: 0.85,
        description: 'Bondit avec un voile de flammes.',
        animation: {
          effect: 'dash',
          color: '#fb7185',
          secondary: '#fbbf24',
          offset: 26,
          duration: 0.45,
          spread: 1.2
        }
      },
      {
        id: 'pyre-comet',
        name: 'Comète Pyrique',
        damage: 12,
        successRate: 0.65,
        description: 'Une comète incandescente.',
        animation: {
          effect: 'meteor',
          color: '#fb7185',
          secondary: '#f87171',
          duration: 0.65,
          offset: 24,
          spread: 1.3
        }
      },
      {
        id: 'sunspear',
        name: 'Lance Solaire',
        damage: 16,
        successRate: 0.45,
        description: 'Canalise un rayon solaire concentré.',
        animation: {
          effect: 'beam',
          color: '#fde68a',
          secondary: '#f87171',
          width: 220,
          duration: 0.6,
          angle: -2
        }
      }
    ],
    evolutions: []
  },
  obsidrax: {
    id: 'obsidrax',
    name: 'Obsidrax',
    color: '#64748b',
    baseStats: makeStats(5, 12, 15, 8, 9),
    description: 'Une bête de roche volcanique presque imprenable.',
    attacks: [
      {
        id: 'magma-crash',
        name: 'Choc Magmatique',
        damage: 10,
        successRate: 0.85,
        description: 'Assène un coup chargé de lave.',
        animation: {
          effect: 'burst',
          color: '#f97316',
          secondary: '#facc15',
          duration: 0.6,
          spread: 1.4
        }
      },
      {
        id: 'obsidian-wall',
        name: 'Mur Obsidien',
        damage: 12,
        successRate: 0.6,
        description: 'Projette des éclats tranchants.',
        animation: {
          effect: 'spark',
          color: '#94a3b8',
          secondary: '#f97316',
          duration: 0.6,
          spread: 1.25
        }
      },
      {
        id: 'seismic-roar',
        name: 'Rugissement Sismique',
        damage: 17,
        successRate: 0.45,
        description: 'Secoue le sol avec une onde.',
        animation: {
          effect: 'quake',
          color: '#64748b',
          secondary: '#f97316',
          duration: 0.7,
          intensity: 1.4,
          spread: 1.1
        }
      }
    ],
    evolutions: []
  },
  mistgale: {
    id: 'mistgale',
    name: 'Mistgale',
    color: '#5eead4',
    baseStats: makeStats(5, 10, 9, 15, 12),
    description: 'Une entité d eau légère comme l air.',
    attacks: [
      {
        id: 'mist-knives',
        name: 'Couteaux de Brume',
        damage: 8,
        successRate: 0.9,
        description: 'Des lames aqueuses furtives.',
        animation: {
          effect: 'slash',
          color: '#5eead4',
          secondary: '#99f6e4',
          angle: -16,
          offset: 36,
          duration: 0.45,
          spread: 1.15
        }
      },
      {
        id: 'cyclone-step',
        name: 'Pas Cyclonique',
        damage: 11,
        successRate: 0.65,
        description: 'Un tourbillon balayeur.',
        animation: {
          effect: 'wind',
          color: '#2dd4bf',
          secondary: '#bae6fd',
          offset: 24,
          spread: 1.4,
          duration: 0.6
        }
      },
      {
        id: 'tempest-halo',
        name: 'Halo Tempêtueux',
        damage: 15,
        successRate: 0.45,
        description: 'Un anneau de bourrasques tranchantes.',
        animation: {
          effect: 'ring',
          color: '#38bdf8',
          secondary: '#5eead4',
          width: 200,
          duration: 0.65,
          spread: 1.3,
          mirror: false
        }
      }
    ],
    evolutions: []
  },
  abyssaur: {
    id: 'abyssaur',
    name: 'Abyssaur',
    color: '#1d4ed8',
    baseStats: makeStats(5, 15, 12, 10, 8),
    description: 'Un monstre marin massif et paisible.',
    attacks: [
      {
        id: 'abyss-crash',
        name: 'Choc des Abysses',
        damage: 11,
        successRate: 0.85,
        description: 'Frappe avec la puissance de l océan.',
        animation: {
          effect: 'wave',
          color: '#1d4ed8',
          secondary: '#93c5fd',
          offset: 24,
          duration: 0.6,
          spread: 1.2
        }
      },
      {
        id: 'pressure-wave',
        name: 'Onde de Pression',
        damage: 14,
        successRate: 0.6,
        description: 'Compresse l eau en un impact violent.',
        animation: {
          effect: 'beam',
          color: '#2563eb',
          secondary: '#0ea5e9',
          width: 220,
          duration: 0.6,
          angle: -8
        }
      },
      {
        id: 'depth-quake',
        name: 'Tremblement Profond',
        damage: 18,
        successRate: 0.4,
        description: 'Fait trembler les profondeurs.',
        animation: {
          effect: 'quake',
          color: '#1e3a8a',
          secondary: '#38bdf8',
          duration: 0.75,
          intensity: 1.6,
          spread: 1.2
        }
      }
    ],
    evolutions: []
  },
  obsidianox: {
    id: 'obsidianox',
    name: 'Obsidianox',
    color: '#111827',
    baseStats: makeStats(14, 22, 21, 14, 16),
    description: 'Un colosse de roche noire, gardien des hautes terres.',
    attacks: [
      {
        id: 'obsidian-charge',
        name: 'Charge Obsidienne',
        damage: 24,
        successRate: 0.65,
        description: 'Percute l ennemi de toute sa masse.',
        animation: {
          effect: 'dash',
          color: '#111827',
          secondary: '#f97316',
          offset: 34,
          duration: 0.55,
          spread: 1.25
        }
      },
      {
        id: 'volcanic-spire',
        name: 'Spire Volcanique',
        damage: 28,
        successRate: 0.45,
        description: 'Projette des colonnes de lave solidifiée.',
        animation: {
          effect: 'meteor',
          color: '#f97316',
          secondary: '#fde047',
          duration: 0.75,
          spread: 1.2,
          offset: 18
        }
      },
      {
        id: 'earth-rend',
        name: 'Déchirure Tellurique',
        damage: 20,
        successRate: 0.85,
        description: 'Secoue la terre avec ses sabots.',
        animation: {
          effect: 'quake',
          color: '#1f2937',
          secondary: '#f97316',
          duration: 0.7,
          intensity: 1.4,
          spread: 1.15
        }
      }
    ],
    evolutions: []
  },
  'storm-wyvern': {
    id: 'storm-wyvern',
    name: 'Wyverne-tempête',
    color: '#60a5fa',
    baseStats: makeStats(15, 19, 17, 22, 20),
    description: 'Une wyverne dominatrice des vents et des éclairs.',
    attacks: [
      {
        id: 'tempest-talon',
        name: 'Serre de Tempête',
        damage: 20,
        successRate: 0.8,
        description: 'Frappe en créant des bourrasques.',
        animation: {
          effect: 'slash',
          color: '#38bdf8',
          secondary: '#e0f2fe',
          angle: -14,
          offset: 44,
          duration: 0.45,
          spread: 1.3
        }
      },
      {
        id: 'thunder-lash',
        name: 'Fouet Tonnerre',
        damage: 26,
        successRate: 0.6,
        description: 'Déchaîne un éclair vrillant.',
        animation: {
          effect: 'beam',
          color: '#1d4ed8',
          secondary: '#f8fafc',
          width: 240,
          duration: 0.6,
          angle: -6
        }
      },
      {
        id: 'squall-maelstrom',
        name: 'Maelström d Orage',
        damage: 30,
        successRate: 0.4,
        description: 'Invoque une tempête qui foudroie tout.',
        animation: {
          effect: 'meteor',
          color: '#60a5fa',
          secondary: '#2563eb',
          duration: 0.75,
          spread: 1.35,
          offset: 30
        }
      }
    ],
    evolutions: []
  },
  'coral-hydra': {
    id: 'coral-hydra',
    name: 'Hydre de Corail',
    color: '#0ea5e9',
    baseStats: makeStats(16, 21, 20, 18, 19),
    description: 'Une créature maritime à trois têtes maîtrisant les courants.',
    attacks: [
      {
        id: 'hydra-barrage',
        name: 'Barrage Hydre',
        damage: 23,
        successRate: 0.7,
        description: 'Projette des jets d eau concentrés.',
        animation: {
          effect: 'beam',
          color: '#0ea5e9',
          secondary: '#67e8f9',
          width: 230,
          duration: 0.6,
          angle: -8
        }
      },
      {
        id: 'reef-snare',
        name: 'Piège du Récif',
        damage: 18,
        successRate: 0.85,
        description: 'Enserre la cible avec des récifs vivants.',
        animation: {
          effect: 'thorn',
          color: '#0ea5e9',
          secondary: '#a855f7',
          offset: 24,
          duration: 0.6,
          spread: 1.2
        }
      },
      {
        id: 'tidal-collapse',
        name: 'Effondrement des Marées',
        damage: 32,
        successRate: 0.35,
        description: 'Frappe avec une masse d eau gigantesque.',
        animation: {
          effect: 'wave',
          color: '#22d3ee',
          secondary: '#99f6e4',
          offset: 36,
          duration: 0.8,
          spread: 1.4
        }
      }
    ],
    evolutions: []
  },
  'tempest-king': {
    id: 'tempest-king',
    name: 'Roi Tempétueux',
    color: '#312e81',
    baseStats: makeStats(18, 24, 22, 19, 21),
    description: 'Le monarque des tempêtes côtières brandit un trident mythique.',
    attacks: [
      {
        id: 'trident-flash',
        name: 'Éclair de Trident',
        damage: 26,
        successRate: 0.75,
        description: 'Un coup éclair fulgurant.',
        animation: {
          effect: 'beam',
          color: '#c084fc',
          secondary: '#0ea5e9',
          width: 240,
          duration: 0.6,
          angle: -4
        }
      },
      {
        id: 'royal-decree',
        name: 'Décret Royal',
        damage: 20,
        successRate: 0.9,
        description: 'Un ordre qui ébranle le moral ennemi.',
        animation: {
          effect: 'pulse',
          color: '#312e81',
          secondary: '#818cf8',
          duration: 0.6,
          spread: 1.25
        }
      },
      {
        id: 'storm-judgement',
        name: 'Jugement des Tempêtes',
        damage: 34,
        successRate: 0.4,
        description: 'Invoque un cataclysme de pluie et de tonnerre.',
        animation: {
          effect: 'meteor',
          color: '#2563eb',
          secondary: '#c7d2fe',
          duration: 0.8,
          spread: 1.45,
          offset: 28
        }
      }
    ],
    evolutions: []
  }
};

export const createMonsterInstance = (id: string): MonsterInstance => {
  const def = monsterDefinitions[id];
  if (!def) {
    throw new Error(`Monster ${id} inconnu`);
  }
  return {
    definition: def,
    stats: { ...def.baseStats }
  };
};

export const applyExperienceGain = (monster: MonsterInstance, xp: number): string[] => {
  const log: string[] = [];
  monster.stats.level += xp;
  monster.stats.power += Math.ceil(xp * 0.8);
  monster.stats.defense += Math.ceil(xp * 0.6);
  monster.stats.speed += Math.ceil(xp * 0.7);
  monster.stats.morale += Math.ceil(xp * 0.9);
  log.push(`${monster.definition.name} gagne ${xp} points d expérience !`);

  const availableEvo = monster.definition.evolutions.find(evo => evo.requirement(monster.stats));
  if (availableEvo) {
    const target = monsterDefinitions[availableEvo.target];
    monster.definition = target;
    monster.stats = { ...target.baseStats, level: monster.stats.level };
    log.push(`Évolution ! ${target.name} rejoint votre équipe.`);
  }

  return log;
};
