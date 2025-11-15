import { AdventureScene } from './adventure-scene';
import { StarterScene } from './starter-scene';
import { TitleScene } from './title-scene';
import { tileToPixel } from '../world/coordinates';
import { villageMap, trainingMap, wildClearingMap, wildGorgeMap } from '../world/maps';
import { resetGameState, appendLog } from '../state';

export const createScenes = () => {
  const village = new AdventureScene({
    id: 'village',
    name: 'Village Émeraude',
    map: villageMap,
    spawn: tileToPixel(6, 8),
    intro: 'Les habitants du village vous saluent chaleureusement.',
    biome: 'plant',
    creatures: [],
    npcs: [
      {
        id: 'elder-lysa',
        name: 'Elder Lysa',
        position: tileToPixel(8, 5),
        dialogue: [
          'Bienvenue, gardien. Notre village compte sur toi.',
          'Apporte-moi un Pétale de Rosée pour bénir la fontaine.'
        ],
        questId: 'riverOffering',
        role: 'turnin'
      },
      {
        id: 'guildmaster',
        name: 'Guildmaster Aros',
        position: tileToPixel(5, 7),
        dialogue: [
          'Des rumeurs parlent de créatures enragées dans la clairière embrasée.',
          'Défais Brasemire pour ramener la paix.'
        ],
        questId: 'emberGuardian',
        role: 'turnin'
      }
    ]
  });

  const training = new AdventureScene({
    id: 'training',
    name: 'Dojo Sylvestre',
    map: trainingMap,
    spawn: tileToPixel(10, 6),
    intro: 'L air est chargé de détermination au dojo.',
    biome: 'plant',
    creatures: [],
    training: [
      {
        id: 'strength-circle',
        position: tileToPixel(6, 5),
        stat: 'power',
        description: 'Pierre de puissance',
        hungerCost: 10,
        reward: 2
      },
      {
        id: 'defense-pillar',
        position: tileToPixel(10, 5),
        stat: 'defense',
        description: 'Pilier d endurance',
        hungerCost: 10,
        reward: 2
      },
      {
        id: 'speed-wind',
        position: tileToPixel(14, 5),
        stat: 'speed',
        description: 'Bannière des vents',
        hungerCost: 8,
        reward: 2
      }
    ],
    npcs: [
      {
        id: 'trainer',
        name: 'Maître Roka',
        position: tileToPixel(10, 3),
        dialogue: ['Canalise ton énergie, et ton partenaire progressera.']
      }
    ]
  });

  const wildClearing = new AdventureScene({
    id: 'wild-clearing',
    name: 'Clairière des Braises',
    map: wildClearingMap,
    spawn: tileToPixel(10, 10),
    intro: 'La chaleur vacille autour des flammes sauvages.',
    biome: 'fire',
    creatures: [
      {
        id: 'sproutle',
        spawn: tileToPixel(12, 7),
        variant: 'plant',
        roamRadius: 10,
        respawnTime: 45
      },
      {
        id: 'flaruba',
        spawn: tileToPixel(15, 6),
        variant: 'fire',
        roamRadius: 14,
        respawnTime: 45
      },
      {
        id: 'brasemire',
        spawn: tileToPixel(6, 4),
        variant: 'boss',
        boss: true,
        loot: ['emberCore'],
        questId: 'emberGuardian'
      },
      {
        id: 'embermaw',
        spawn: tileToPixel(17, 3),
        variant: 'boss',
        boss: true,
        loot: ['meat']
      }
    ]
  });

  const wildGorge = new AdventureScene({
    id: 'wild-gorge',
    name: 'Gorge Azurée',
    map: wildGorgeMap,
    spawn: tileToPixel(10, 10),
    intro: 'Des embruns salés accompagnent le grondement de la rivière.',
    biome: 'water',
    creatures: [
      {
        id: 'tidebble',
        spawn: tileToPixel(8, 6),
        variant: 'water',
        roamRadius: 12,
        respawnTime: 45
      },
      {
        id: 'mistgale',
        spawn: tileToPixel(12, 5),
        variant: 'water',
        roamRadius: 10,
        respawnTime: 45
      },
      {
        id: 'azureAlpha',
        spawn: tileToPixel(5, 5),
        variant: 'boss',
        boss: true,
        loot: ['dewPetal'],
        questId: 'twinFangs'
      },
      {
        id: 'azureOmega',
        spawn: tileToPixel(14, 4),
        variant: 'boss',
        boss: true,
        loot: ['fruit'],
        questId: 'twinFangs'
      }
    ]
  });

  village.link('east', training, tileToPixel(2, 6), 'Vous entrez dans le Dojo Sylvestre.');
  training.link('west', village, tileToPixel(18, 6), 'Vous retournez au Village Émeraude.');

  village.link('south', wildClearing, tileToPixel(10, 2), 'Vous atteignez la Clairière des Braises.');
  wildClearing.link('north', village, tileToPixel(10, 9), 'Vous remontez vers le village.');

  wildClearing.link('east', wildGorge, tileToPixel(2, 6), 'Vous suivez la rivière vers la gorge.');
  wildGorge.link('west', wildClearing, tileToPixel(18, 6), 'Vous retournez vers la clairière embrasée.');

  const starter = new StarterScene(village);

  const title = new TitleScene({
    onNewGame: context => {
      resetGameState(context.state);
      context.state.unlockedScenes.add('starter');
      appendLog(context.state, 'Une nouvelle aventure commence.');
      context.engine.switchScene(starter);
    },
    onContinue: context => {
      const lastSceneId = context.state.scene;
      if (lastSceneId === village.id) {
        context.engine.switchScene(village);
      } else if (lastSceneId === training.id) {
        context.engine.switchScene(training);
      } else if (lastSceneId === wildClearing.id) {
        context.engine.switchScene(wildClearing);
      } else if (lastSceneId === wildGorge.id) {
        context.engine.switchScene(wildGorge);
      } else if (lastSceneId === starter.id) {
        context.engine.switchScene(starter);
      } else {
        context.engine.switchScene(village);
      }
    }
  });

  return {
    title,
    starter,
    village,
    training,
    wildClearing,
    wildGorge
  };
};
