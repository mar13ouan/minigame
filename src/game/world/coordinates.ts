import { TILE_SIZE } from './constants';

export type Point = { x: number; y: number };

export const tileToPixel = (col: number, row: number): Point => ({
  x: col * TILE_SIZE + TILE_SIZE / 2,
  y: row * TILE_SIZE + TILE_SIZE / 2
});
