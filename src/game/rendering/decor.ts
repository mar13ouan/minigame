import type { Point } from '../world/coordinates';

export const drawFlower = (ctx: CanvasRenderingContext2D, position: Point, color: string): void => {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
  ctx.beginPath();
  ctx.ellipse(position.x, position.y + 10, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#14532d';
  ctx.fillRect(position.x - 2, position.y, 4, 10);
  ctx.fillStyle = color;
  ctx.fillRect(position.x - 4, position.y - 4, 4, 4);
  ctx.fillRect(position.x, position.y - 4, 4, 4);
  ctx.fillRect(position.x - 4, position.y, 4, 4);
  ctx.fillRect(position.x, position.y, 4, 4);
};

export const drawStone = (ctx: CanvasRenderingContext2D, position: Point): void => {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.beginPath();
  ctx.ellipse(position.x, position.y + 10, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#475569';
  ctx.fillRect(position.x - 8, position.y - 8, 16, 12);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(position.x - 4, position.y - 4, 8, 4);
};

export const drawPedestal = (ctx: CanvasRenderingContext2D, position: Point): void => {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
  ctx.beginPath();
  ctx.ellipse(position.x, position.y + 6, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(position.x - 14, position.y - 10, 28, 12);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(position.x - 10, position.y - 6, 20, 4);
  ctx.fillStyle = '#cbd5f5';
  ctx.fillRect(position.x - 6, position.y - 16, 12, 6);
};

export const drawSignpost = (ctx: CanvasRenderingContext2D, position: Point): void => {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
  ctx.beginPath();
  ctx.ellipse(position.x, position.y + 12, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#78350f';
  ctx.fillRect(position.x - 2, position.y - 12, 4, 16);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(position.x - 16, position.y - 18, 32, 10);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(position.x - 12, position.y - 16, 24, 6);
};
