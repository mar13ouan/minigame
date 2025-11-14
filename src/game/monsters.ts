export type MonsterDefinition = {
  id: string;
  name: string;
  color: string;
  baseStats: Stats;
  evolutions: Evolution[];
  description: string;
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
      }
    ]
  },
  flaruba: {
    id: 'flaruba',
    name: 'Flaruba',
    color: '#f97316',
    baseStats: makeStats(1, 7, 5, 4, 4),
    description: 'Un renard incandescent au coeur loyal.',
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
      }
    ]
  },
  tidebble: {
    id: 'tidebble',
    name: 'Tidebble',
    color: '#60a5fa',
    baseStats: makeStats(1, 5, 6, 5, 4),
    description: 'Une bulle marine à la personnalité fluctuante.',
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
      }
    ]
  },
  bloomtail: {
    id: 'bloomtail',
    name: 'Bloomtail',
    color: '#22c55e',
    baseStats: makeStats(5, 13, 9, 12, 8),
    description: 'Un dragon feuille agile qui danse dans le vent.',
    evolutions: []
  },
  glimmeroot: {
    id: 'glimmeroot',
    name: 'Glimmeroot',
    color: '#a3e635',
    baseStats: makeStats(5, 11, 8, 14, 7),
    description: 'Une créature sylvestre qui se fond dans la lumière.',
    evolutions: []
  },
  pyrolynx: {
    id: 'pyrolynx',
    name: 'Pyrolynx',
    color: '#fb7185',
    baseStats: makeStats(5, 15, 10, 11, 13),
    description: 'Un félin flamboyant au regard perçant.',
    evolutions: []
  },
  obsidrax: {
    id: 'obsidrax',
    name: 'Obsidrax',
    color: '#64748b',
    baseStats: makeStats(5, 12, 15, 8, 9),
    description: 'Une bête de roche volcanique presque imprenable.',
    evolutions: []
  },
  mistgale: {
    id: 'mistgale',
    name: 'Mistgale',
    color: '#5eead4',
    baseStats: makeStats(5, 10, 9, 15, 12),
    description: 'Une entité d eau légère comme l air.',
    evolutions: []
  },
  abyssaur: {
    id: 'abyssaur',
    name: 'Abyssaur',
    color: '#1d4ed8',
    baseStats: makeStats(5, 15, 12, 10, 8),
    description: 'Un monstre marin massif et paisible.',
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
