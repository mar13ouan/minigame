import { FieldScene, type FieldSceneConfig } from './field-scene';
import { StarterScene } from './starter-scene';
import { StartMenuScene } from './start-menu-scene';
import { VillageScene, createVillageNpcs } from './village-scene';
import { TrainingScene, createTrainingStations, createTrainingMaster } from './training-scene';
import { fieldMap, villageMap, trainingMap, wildNorthMap, wildCoastMap } from '../world/maps';
import { tileToPixel } from '../world/coordinates';
import { drawFlower, drawStone } from '../rendering/decor';

const buildGladeDecor = () => (ctx: CanvasRenderingContext2D): void => {
  const flowers: Array<{ x: number; y: number; color: string }> = [
    { x: tileToPixel(6, 3).x, y: tileToPixel(6, 3).y, color: '#f472b6' },
    { x: tileToPixel(9, 5).x, y: tileToPixel(9, 5).y, color: '#facc15' },
    { x: tileToPixel(12, 8).x, y: tileToPixel(12, 8).y, color: '#34d399' },
    { x: tileToPixel(7, 7).x, y: tileToPixel(7, 7).y, color: '#a855f7' }
  ];
  flowers.forEach(({ x, y, color }) => drawFlower(ctx, { x, y }, color));
  [tileToPixel(10, 6), tileToPixel(11, 4), tileToPixel(4, 8)].forEach(point => drawStone(ctx, point));
};

const gladeConfig: FieldSceneConfig = {
  id: 'wild-glade',
  name: 'Plaines Virescentes',
  map: fieldMap,
  spawn: tileToPixel(2, 6),
  entryLog: 'Les Plaines Virescentes s étendent à perte de vue.',
  renderDecor: buildGladeDecor(),
  encounters: [
    { id: 'sproutle-wild', monsterId: 'sproutle', spawn: tileToPixel(13, 4) },
    { id: 'flaruba-wild', monsterId: 'flaruba', spawn: tileToPixel(15, 8) },
    { id: 'pyrolynx-boss', monsterId: 'pyrolynx', spawn: tileToPixel(16, 5), boss: true, dropItem: 'vital-herb' },
    { id: 'mistgale-boss', monsterId: 'mistgale', spawn: tileToPixel(18, 8), boss: true, dropItem: 'focus-crystal' }
  ]
};

const wildNorthConfig: FieldSceneConfig = {
  id: 'wild-north',
  name: 'Hautes Terres Obsidiennes',
  map: wildNorthMap,
  spawn: tileToPixel(2, 6),
  entryLog: 'Les falaises obsidiennes grondent sous le vent.',
  encounters: [
    { id: 'obsidrax-wild', monsterId: 'obsidrax', spawn: tileToPixel(13, 5), dropItem: 'fresh-meat' },
    { id: 'glimmeroot-wild', monsterId: 'glimmeroot', spawn: tileToPixel(11, 8) },
    { id: 'obsidianox-boss', monsterId: 'obsidianox', spawn: tileToPixel(16, 6), boss: true, dropItem: 'ancient-relic' },
    { id: 'storm-wyvern-boss', monsterId: 'storm-wyvern', spawn: tileToPixel(17, 4), boss: true, dropItem: 'focus-crystal' }
  ]
};

const wildCoastConfig: FieldSceneConfig = {
  id: 'wild-coast',
  name: 'Côtes Tempétueuses',
  map: wildCoastMap,
  spawn: tileToPixel(2, 6),
  entryLog: 'La houle se fracasse contre les récifs azurés.',
  encounters: [
    { id: 'tidebble-wild', monsterId: 'tidebble', spawn: tileToPixel(10, 6) },
    { id: 'mistgale-wild', monsterId: 'mistgale', spawn: tileToPixel(12, 7) },
    { id: 'coral-hydra-boss', monsterId: 'coral-hydra', spawn: tileToPixel(15, 5), boss: true, dropItem: 'vital-herb' },
    { id: 'tempest-king-boss', monsterId: 'tempest-king', spawn: tileToPixel(17, 7), boss: true, dropItem: 'focus-crystal' }
  ]
};

export const createScenes = () => {
  const village = new VillageScene(villageMap, tileToPixel(4, 7), createVillageNpcs());
  const training = new TrainingScene(trainingMap, tileToPixel(4, 6), createTrainingStations(), createTrainingMaster());
  const wildGlade = new FieldScene(gladeConfig);
  const wildNorth = new FieldScene(wildNorthConfig);
  const wildCoast = new FieldScene(wildCoastConfig);
  const starter = new StarterScene(village);
  const startMenu = new StartMenuScene(starter);

  village.setTransitions([
    { edge: 'right', target: wildGlade, spawn: tileToPixel(2, 6), logMessage: 'Vous prenez la route des plaines.' },
    { edge: 'top', target: training, spawn: tileToPixel(4, 9), logMessage: 'Vous grimpez vers le dojo.' }
  ]);

  training.setTransitions([
    { edge: 'left', target: village, spawn: tileToPixel(14, 6), logMessage: 'Retour au village.' }
  ]);

  wildGlade.setTransitions([
    { edge: 'left', target: village, spawn: tileToPixel(14, 6), logMessage: 'Vous regagnez le Village Émeraude.' },
    {
      edge: 'right',
      target: wildNorth,
      spawn: tileToPixel(2, 6),
      unlockId: 'wild-north',
      lockedMessage: 'Les hauteurs sont fermées tant que la relique n a pas été rendue.',
      logMessage: 'Vous atteignez les hautes terres.'
    }
  ]);

  wildNorth.setTransitions([
    { edge: 'left', target: wildGlade, spawn: tileToPixel(18, 6), logMessage: 'Vous redescendez vers les plaines.' },
    {
      edge: 'right',
      target: wildCoast,
      spawn: tileToPixel(2, 6),
      unlockId: 'wild-coast',
      lockedMessage: 'Le passage côtier reste fermé sans ordre des anciens.',
      logMessage: 'Vous sentez les embruns de la côte.'
    }
  ]);

  wildCoast.setTransitions([
    { edge: 'left', target: wildNorth, spawn: tileToPixel(18, 6), logMessage: 'Vous retournez vers les falaises.' }
  ]);

  return { startMenu, starter, village, training, wildGlade, wildNorth, wildCoast };
};
