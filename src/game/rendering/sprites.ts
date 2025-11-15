export { preloadSprites, createPlayerSprite, createCreatureSprite } from './sprite-library';

export const drawCompanionEmote = (ctx: CanvasRenderingContext2D, x: number, y: number): void => {
  ctx.fillStyle = 'rgba(248, 113, 113, 0.9)';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - 4, y - 6, x - 10, y + 1, x, y + 8);
  ctx.bezierCurveTo(x + 10, y + 1, x + 4, y - 6, x, y);
  ctx.fill();
};
