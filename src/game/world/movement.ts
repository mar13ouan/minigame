import { clamp } from '../utils/math';
import { PLAYER_COLLISION_PADDING, PLAYER_SIZE, TILE_SIZE } from './constants';
import { TileMap, getTileAt, isTileSolid } from './tiles';
import type { Point } from './coordinates';

const sampleOffsets = [
  { dx: -1, dy: -1 },
  { dx: 1, dy: -1 },
  { dx: -1, dy: 1 },
  { dx: 1, dy: 1 }
];

const isWalkable = (map: TileMap, position: Point): boolean => {
  const halfSize = PLAYER_SIZE / 2 - PLAYER_COLLISION_PADDING;
  return sampleOffsets.every(({ dx, dy }) => {
    const sampleX = position.x + dx * halfSize;
    const sampleY = position.y + dy * halfSize;
    return !isTileSolid(getTileAt(map, sampleX, sampleY));
  });
};

export const moveWithCollisions = (
  map: TileMap,
  position: Point,
  vx: number,
  vy: number,
  speed: number,
  dt: number
): void => {
  if (vx === 0 && vy === 0) {
    return;
  }

  const normalizedLength = Math.hypot(vx, vy) || 1;
  const dirX = vx / normalizedLength;
  const dirY = vy / normalizedLength;

  const mapWidth = map[0]?.length ? map[0].length * TILE_SIZE : TILE_SIZE;
  const mapHeight = map.length * TILE_SIZE;
  const minX = PLAYER_SIZE / 2;
  const minY = PLAYER_SIZE / 2;
  const maxX = mapWidth - PLAYER_SIZE / 2;
  const maxY = mapHeight - PLAYER_SIZE / 2;

  const proposedX = clamp(position.x + dirX * speed * dt, minX, maxX);
  const proposedY = clamp(position.y + dirY * speed * dt, minY, maxY);

  const proposedPosition: Point = { x: proposedX, y: proposedY };
  if (isWalkable(map, proposedPosition)) {
    position.x = proposedX;
    position.y = proposedY;
    return;
  }

  const horizontalPosition: Point = { x: proposedX, y: position.y };
  if (isWalkable(map, horizontalPosition)) {
    position.x = proposedX;
  }

  const verticalPosition: Point = { x: position.x, y: proposedY };
  if (isWalkable(map, verticalPosition)) {
    position.y = proposedY;
  }
};
