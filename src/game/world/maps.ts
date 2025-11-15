import { createTileMap, type TileMap } from './tiles';

export const starterMap: TileMap = createTileMap([
  'm m m m m m m m m m m m m m m m m m m m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g h h h h h h h h h h h h h h h h g m',
  'm g h h h h h h h h h h h h h h h h g m',
  'm g h h h h h h h g g g g g h h h h g m',
  'm g g g g g g g g g p p p p p p p p g m',
  'm g g g t t g g g g p b b b b b b p p m',
  'm g g g g g g g g g p p p p p p p p g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm m m m m m m m m m m m m m m m m m m m'
]);

export const villageMap: TileMap = createTileMap([
  'm m m m m m m m m m m m m m m m m m m m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g h h h h h h h h h h h h h h h h g m',
  'm g h v v h h h h h h h h h h h h h g m',
  'm g h v v h h h h h h h h h h h h h g m',
  'm g h v v h g g g g g g g g g g g h g m',
  'm g h h h h g p p p p p p p p g g h g m',
  'm g g g g g g p n n g g n n p g g h g m',
  'm g g g g g g p n n g g n n p g g h g m',
  'm g g g g g g p p p g g p p p g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm m m m m m m m m m m m m m m m m m m m'
]);

export const trainingMap: TileMap = createTileMap([
  'm m m m m m m m m m m m m m m m m m m m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g t t g g g g g g g g g g g g g g m',
  'm g g t t g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm m m m m m m m m m m m m m m m m m m m'
]);

export const wildClearingMap: TileMap = createTileMap([
  'm m m m m m m m m m m m m m m m m m m m',
  'm p g g g g g g g g g g g g g g g g g m',
  'm p g g g g g t t g g g g t t g g g g m',
  'm p g g w w g g t t g g t t g g g g g m',
  'm p g g w w g g g g g g g g g g g g g m',
  'm p g g p p p p p p g g g g g g g g g m',
  'm p g g p g g g g p g g g g g g g g g m',
  'm p g g p g g t t p g g t t g g g g g m',
  'm p g g p g g t t p g g t t g g w w g m',
  'm p g g g g g g g p g g g g g g w w g m',
  'm p g g g g g g g g g g g g g g g g g m',
  'm m m m m m m m m m m m m m m m m m m m'
]);

export const wildGorgeMap: TileMap = createTileMap([
  'm m m m m m m m m m m m m m m m m m m m',
  'm s s s s s s s s s s s s s s s s s s m',
  'm s r r r r s s s s s s s s s s s s s m',
  'm s r r r r s s s s s s s s s s s s s m',
  'm s s s s s s s s s s s s s s s s s s m',
  'm s s s s s s s s s s s s s s s s s s m',
  'm s s s s s s s s s s s s s s s s s s m',
  'm s s s s s s s s s s s s s s s s s s m',
  'm s s s s s s s s s s s s s s s s s s m',
  'm s s s s s s s s s s s s s s s s s s m',
  'm s s s s s s s s s s s s s s s s s s m',
  'm m m m m m m m m m m m m m m m m m m m'
]);
