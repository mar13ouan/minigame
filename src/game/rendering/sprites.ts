const drawShadow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number
): void => {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
};

export const drawPlayerSprite = (ctx: CanvasRenderingContext2D, x: number, y: number): void => {
  drawShadow(ctx, x, y + 10, 12, 6);
  const baseX = x - 12;
  const baseY = y - 18;
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(baseX + 8, baseY + 8, 8, 6);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(baseX + 6, baseY + 8, 4, 4);
  ctx.fillRect(baseX + 16, baseY + 8, 4, 4);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(baseX + 4, baseY + 14, 16, 12);
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(baseX + 4, baseY + 20, 16, 6);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(baseX + 6, baseY + 2, 12, 8);
  ctx.fillRect(baseX + 4, baseY + 26, 6, 8);
  ctx.fillRect(baseX + 14, baseY + 26, 6, 8);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(baseX + 12, baseY + 4, 4, 4);
};

export const drawMonsterSprite = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
): void => {
  drawShadow(ctx, x, y + 12, 12, 6);
  const baseX = x - 14;
  const baseY = y - 18;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(baseX + 4, baseY + 20, 20, 6);
  ctx.fillStyle = color;
  ctx.fillRect(baseX + 2, baseY + 2, 24, 22);
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(baseX + 6, baseY + 10, 6, 5);
  ctx.fillRect(baseX + 16, baseY + 10, 6, 5);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(baseX + 8, baseY + 12, 2, 2);
  ctx.fillRect(baseX + 18, baseY + 12, 2, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(baseX + 4, baseY + 4, 4, 4);
};

export const drawCompanionEmote = (ctx: CanvasRenderingContext2D, x: number, y: number): void => {
  ctx.fillStyle = 'rgba(248, 113, 113, 0.9)';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - 4, y - 6, x - 10, y + 1, x, y + 8);
  ctx.bezierCurveTo(x + 10, y + 1, x + 4, y - 6, x, y);
  ctx.fill();
};
