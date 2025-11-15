import { TILE_SIZE } from './constants';

export type TileDetailRenderer = (ctx: CanvasRenderingContext2D, x: number, y: number) => void;

export type TileDefinition = {
  base: string;
  detail?: TileDetailRenderer;
  solid?: boolean;
};

const normalizeRows = (rows: string[]): string[] => rows.map(row => row.replace(/\s+/g, ''));

const tileDefinitions: Record<string, TileDefinition> = {
  g: {
    base: '#3f6212',
    detail: (ctx, x, y) => {
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(x + 6, y + 4, 3, 3);
      ctx.fillRect(x + 18, y + 6, 2, 2);
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(x + 10, y + 18, 2, 2);
      ctx.fillRect(x + 14, y + 12, 2, 2);
    }
  },
  p: {
    base: '#8b5a2b',
    detail: (ctx, x, y) => {
      ctx.fillStyle = '#a16207';
      ctx.fillRect(x, y + TILE_SIZE - 6, TILE_SIZE, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x, y, TILE_SIZE, 4);
    }
  },
  h: {
    base: '#1f2937',
    detail: (ctx, x, y) => {
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + 10, y + 10, TILE_SIZE - 20, TILE_SIZE - 20);
    }
  },
  b: {
    base: '#b45309',
    detail: (ctx, x, y) => {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x, y + 4, TILE_SIZE, 6);
      ctx.fillRect(x, y + 20, TILE_SIZE, 4);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x + 2, y + 12, TILE_SIZE - 4, 6);
    }
  },
  w: {
    base: '#1d4ed8',
    detail: (ctx, x, y) => {
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(x, y + 6, TILE_SIZE, TILE_SIZE - 12);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x + 4, y + 6, TILE_SIZE - 8, 4);
      ctx.fillRect(x + 10, y + 16, TILE_SIZE - 12, 3);
    },
    solid: true
  },
  m: {
    base: '#1f2937',
    detail: (ctx, x, y) => {
      ctx.fillStyle = '#111827';
      ctx.fillRect(x, y + 12, TILE_SIZE, TILE_SIZE - 12);
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 18);
    },
    solid: true
  },
  t: {
    base: '#365314',
    detail: (ctx, x, y) => {
      ctx.fillStyle = '#166534';
      ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 12);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 20);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + 12, y + TILE_SIZE - 12, 8, 10);
    },
    solid: true
  }
};

export type TileMap = string[];

export const createTileMap = (rows: string[]): TileMap => normalizeRows(rows);

export const drawTile = (ctx: CanvasRenderingContext2D, tileId: string, col: number, row: number): void => {
  const definition = tileDefinitions[tileId] ?? tileDefinitions.g;
  const x = col * TILE_SIZE;
  const y = row * TILE_SIZE;
  ctx.fillStyle = definition.base;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  definition.detail?.(ctx, x, y);
};

export const drawTileMap = (ctx: CanvasRenderingContext2D, map: TileMap): void => {
  map.forEach((row, rowIndex) => {
    for (let col = 0; col < row.length; col++) {
      drawTile(ctx, row[col] ?? 'g', col, rowIndex);
    }
  });
};

export const getTileAt = (map: TileMap, x: number, y: number): string => {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  if (row < 0 || row >= map.length) return 'm';
  if (col < 0 || col >= map[row].length) return 'm';
  return map[row][col] ?? 'm';
};

export const isTileSolid = (tileId: string): boolean => Boolean(tileDefinitions[tileId]?.solid);
