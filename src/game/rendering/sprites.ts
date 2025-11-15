const PLAYER_SHEET_URL = 'https://raw.githubusercontent.com/0x72/ndjs-assets/master/spritesheets/characters.png';
const MONSTER_SHEET_URL = 'https://raw.githubusercontent.com/0x72/ndjs-assets/master/spritesheets/enemies.png';

const SPRITE_SIZE = 32;
const PLAYER_SCALE = 1.8;
const MONSTER_SCALE = 2.2;

const spriteCache = new Map<string, HTMLImageElement>();

const loadSpriteSheet = (url: string): HTMLImageElement => {
  let image = spriteCache.get(url);
  if (!image) {
    image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = url;
    spriteCache.set(url, image);
  }
  return image;
};

const drawShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void => {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
  ctx.fill();
};

const drawSpriteFrame = (
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  frame: number,
  row: number,
  x: number,
  y: number,
  scale: number,
  tint?: string
): void => {
  const sx = (frame % 4) * SPRITE_SIZE;
  const sy = row * SPRITE_SIZE;
  const width = SPRITE_SIZE * scale;
  const height = SPRITE_SIZE * scale;
  const dx = x - width / 2;
  const dy = y - height + SPRITE_SIZE * 0.6;

  if (!sheet.complete) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(dx, dy, width, height);
    return;
  }

  ctx.drawImage(sheet, sx, sy, SPRITE_SIZE, SPRITE_SIZE, dx, dy, width, height);

  if (tint) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = tint;
    ctx.fillRect(dx, dy, width, height);
    ctx.restore();
  }
};

const directionRow: Record<'down' | 'up' | 'left' | 'right', number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3
};

export const drawPlayerSprite = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: 'down' | 'up' | 'left' | 'right',
  frame: number
): void => {
  const sheet = loadSpriteSheet(PLAYER_SHEET_URL);
  drawShadow(ctx, x, y + 18, 20, 10);
  drawSpriteFrame(ctx, sheet, frame, directionRow[direction], x, y, PLAYER_SCALE);
};

export const drawNpcSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, frame: number): void => {
  const sheet = loadSpriteSheet(PLAYER_SHEET_URL);
  drawShadow(ctx, x, y + 18, 18, 9);
  drawSpriteFrame(ctx, sheet, frame, 4, x, y, PLAYER_SCALE * 0.95, 'rgba(148, 163, 184, 0.35)');
};

export const drawMonsterSprite = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tint?: string,
  variant: 'default' | 'defeated' | 'boss' = 'default',
  animationTime = 0
): void => {
  if (variant === 'defeated') {
    drawShadow(ctx, x, y + 20, 24, 10);
    ctx.fillStyle = 'rgba(220,38,38,0.75)';
    ctx.beginPath();
    ctx.ellipse(x, y + 18, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    const sheet = loadSpriteSheet(MONSTER_SHEET_URL);
    drawSpriteFrame(ctx, sheet, 1, 5, x, y + 6, MONSTER_SCALE * 1.05, tint);

    ctx.save();
    ctx.translate(x, y - 4);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-2, 2);
    ctx.moveTo(-2, -4);
    ctx.lineTo(-8, 2);
    ctx.moveTo(8, -4);
    ctx.lineTo(2, 2);
    ctx.moveTo(2, -4);
    ctx.lineTo(8, 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const sheet = loadSpriteSheet(MONSTER_SHEET_URL);
  const frame = Math.floor(animationTime * 6) % 4;
  drawShadow(ctx, x, y + 20, 24, 10);
  drawSpriteFrame(ctx, sheet, frame, variant === 'boss' ? 2 : 1, x, y + (variant === 'boss' ? -4 : 0), MONSTER_SCALE, tint);

  if (variant === 'boss') {
    ctx.save();
    const gradient = ctx.createRadialGradient(x, y - 32, 8, x, y - 32, 42);
    gradient.addColorStop(0, 'rgba(251, 191, 36, 0.65)');
    gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y - 32, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};

export const drawCompanionEmote = (ctx: CanvasRenderingContext2D, x: number, y: number): void => {
  ctx.fillStyle = 'rgba(248, 113, 113, 0.9)';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - 4, y - 6, x - 10, y + 1, x, y + 8);
  ctx.bezierCurveTo(x + 10, y + 1, x + 4, y - 6, x, y);
  ctx.fill();
};
