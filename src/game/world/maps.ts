import { createTileMap, type TileMap } from './tiles';

export const fieldMap: TileMap = createTileMap([
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
  'm g h h h h g g g g g g g h h h h g g m',
  'm g h h h h g g p p p g g h h h h g g m',
  'm g g g g g g g p b p g g g g g g g g m',
  'm g g g g g g g p p p g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm m m m m m m m m m m m m m m m m m m m'
]);

export const trainingMap: TileMap = createTileMap([
  'm m m m m m m m m m m m m m m m m m m m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g p p p g g g g g g p p p g g g m',
  'm g g g p b p g g g g g g p b p g g g m',
  'm g g g p p p g g g g g g p p p g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm m m m m m m m m m m m m m m m m m m m'
]);

export const wildNorthMap: TileMap = createTileMap([
  'm m m m m m m m m m m m m m m m m m m m',
  'm p p p p p g g g g g g g g g g g g g m',
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

export const wildCoastMap: TileMap = createTileMap([
  'm m m m m m m m m m m m m m m m m m m m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g w w w g g g g g g g g g g g g g m',
  'm g g w w w g g t t g g t t g g g g g m',
  'm g g g g g g g t t g g t t g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm g g g g g g g g g g g g g g g g g g m',
  'm m m m m m m m m m m m m m m m m m m m'
]);
