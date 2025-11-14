import { BattleSystem } from './battle';
import type { Scene, SceneContext } from './engine';
import {
  createMonsterInstance,
  monsterDefinitions,
  type AttackAnimation,
  type MonsterInstance
} from './monsters';
import { appendLog } from './state';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const TILE_SIZE = 32;
const PLAYER_SIZE = 28;

type TileDefinition = {
  base: string;
  detail?: (ctx: CanvasRenderingContext2D, x: number, y: number) => void;
  solid?: boolean;
};

const mapFromStrings = (rows: string[]) => rows.map(row => row.replace(/\s+/g, ''));

const tileSet: Record<string, TileDefinition> = {
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

const drawTile = (ctx: CanvasRenderingContext2D, tileId: string, col: number, row: number) => {
  const tile = tileSet[tileId] ?? tileSet.g;
  const x = col * TILE_SIZE;
  const y = row * TILE_SIZE;
  ctx.fillStyle = tile.base;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  tile.detail?.(ctx, x, y);
};

const drawShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, radiusX: number, radiusY: number) => {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
};

const drawPlayerSprite = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
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

const drawMonsterSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
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

const drawCompanionEmote = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.fillStyle = 'rgba(248, 113, 113, 0.9)';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - 4, y - 6, x - 10, y + 1, x, y + 8);
  ctx.bezierCurveTo(x + 10, y + 1, x + 4, y - 6, x, y);
  ctx.fill();
};

const drawFlower = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
  drawShadow(ctx, x, y + 10, 6, 3);
  ctx.fillStyle = '#14532d';
  ctx.fillRect(x - 2, y, 4, 10);
  ctx.fillStyle = color;
  ctx.fillRect(x - 4, y - 4, 4, 4);
  ctx.fillRect(x, y - 4, 4, 4);
  ctx.fillRect(x - 4, y, 4, 4);
  ctx.fillRect(x, y, 4, 4);
};

const drawStone = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  drawShadow(ctx, x, y + 10, 8, 4);
  ctx.fillStyle = '#475569';
  ctx.fillRect(x - 8, y - 8, 16, 12);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x - 4, y - 4, 8, 4);
};

const drawPedestal = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  drawShadow(ctx, x, y + 6, 12, 4);
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(x - 14, y - 10, 28, 12);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x - 10, y - 6, 20, 4);
  ctx.fillStyle = '#cbd5f5';
  ctx.fillRect(x - 6, y - 16, 12, 6);
};

const drawSignpost = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  drawShadow(ctx, x, y + 12, 8, 4);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 2, y - 12, 4, 16);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x - 16, y - 18, 32, 10);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(x - 12, y - 16, 24, 6);
};

const drawTileMap = (ctx: CanvasRenderingContext2D, map: string[]) => {
  map.forEach((row, rowIndex) => {
    for (let col = 0; col < row.length; col++) {
      drawTile(ctx, row[col], col, rowIndex);
    }
  });
};

const getTileAt = (map: string[], x: number, y: number) => {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  if (row < 0 || row >= map.length || col < 0 || col >= map[row].length) return 'm';
  return map[row][col];
};

const isWalkable = (map: string[], x: number, y: number) => {
  const half = PLAYER_SIZE / 2 - 3;
  const samples = [
    { x: x - half, y: y - half },
    { x: x + half, y: y - half },
    { x: x - half, y: y + half },
    { x: x + half, y: y + half }
  ];
  return samples.every(sample => !(tileSet[getTileAt(map, sample.x, sample.y)]?.solid));
};

const moveWithCollisions = (
  map: string[],
  position: { x: number; y: number },
  vx: number,
  vy: number,
  speed: number,
  dt: number
) => {
  if (vx === 0 && vy === 0) return;
  const mapWidth = map[0].length * TILE_SIZE;
  const mapHeight = map.length * TILE_SIZE;
  const minX = PLAYER_SIZE / 2;
  const minY = PLAYER_SIZE / 2;
  const maxX = mapWidth - PLAYER_SIZE / 2;
  const maxY = mapHeight - PLAYER_SIZE / 2;

  const length = Math.hypot(vx, vy) || 1;
  const dirX = vx / length;
  const dirY = vy / length;

  const proposedX = clamp(position.x + dirX * speed * dt, minX, maxX);
  const proposedY = clamp(position.y + dirY * speed * dt, minY, maxY);

  if (isWalkable(map, proposedX, proposedY)) {
    position.x = proposedX;
    position.y = proposedY;
    return;
  }

  if (isWalkable(map, proposedX, position.y)) {
    position.x = proposedX;
  }
  if (isWalkable(map, position.x, proposedY)) {
    position.y = proposedY;
  }
};

const tileToPixel = (col: number, row: number) => ({
  x: col * TILE_SIZE + TILE_SIZE / 2,
  y: row * TILE_SIZE + TILE_SIZE / 2
});

const fieldMap = mapFromStrings([
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

const starterMap = mapFromStrings([
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

type StarterOption = {
  id: string;
  position: { x: number; y: number };
};

class FieldScene implements Scene {
  public readonly id = 'field';
  private pressed = new Set<string>();
  private spawn: { x: number; y: number } = tileToPixel(2, 6);
  private battle?: BattleSystem;
  private wildCreatures = [
    {
      id: 'sproutle',
      base: tileToPixel(13, 4),
      position: { ...tileToPixel(13, 4) },
      oscillation: Math.random() * Math.PI * 2
    },
    {
      id: 'flaruba',
      base: tileToPixel(15, 8),
      position: { ...tileToPixel(15, 8) },
      oscillation: Math.random() * Math.PI * 2
    }
  ];
  private returnScene?: StarterScene;
  private visited = false;
  private readonly map = fieldMap;
  private overlayMarkup?: string;

  enter({ state }: SceneContext): void {
    state.scene = this.id;
    state.player.position = { ...this.spawn };
    this.overlayMarkup = undefined;
    if (!this.visited) {
      appendLog(state, 'Les Plaines Virescentes s étendent à perte de vue.');
      this.visited = true;
    }
  }

  update(context: SceneContext, dt: number): void {
    const { state } = context;
    if (this.battle) {
      this.battle.update(state, dt);
      return;
    }
    this.applyMovement(state, dt, 120, context);
    this.animateWilds(dt);
    this.checkCollisions(context);
  }

  render(context: SceneContext, ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawTileMap(ctx, this.map);
    this.drawDecor(ctx);
    this.drawWilds(ctx);
    this.drawPlayer(context, ctx);
    this.renderOverlay(context);
  }

  onKeyDown(context: SceneContext, event: KeyboardEvent): void {
    if (this.battle) {
      this.battle.handleInput(context.state, event);
      return;
    }
    this.pressed.add(event.key);
  }

  onKeyUp(_: SceneContext, event: KeyboardEvent): void {
    this.pressed.delete(event.key);
  }

  private drawDecor(ctx: CanvasRenderingContext2D) {
    const flowers = [
      { position: tileToPixel(6, 3), color: '#f472b6' },
      { position: tileToPixel(9, 5), color: '#facc15' },
      { position: tileToPixel(12, 8), color: '#34d399' },
      { position: tileToPixel(7, 7), color: '#a855f7' }
    ];
    flowers.forEach(flower => drawFlower(ctx, flower.position.x, flower.position.y, flower.color));

    const stones = [tileToPixel(10, 6), tileToPixel(11, 4), tileToPixel(4, 8)];
    stones.forEach(stone => drawStone(ctx, stone.x, stone.y));
  }

  private drawPlayer({ state }: SceneContext, ctx: CanvasRenderingContext2D) {
    const { x, y } = state.player.position;
    if (state.player.monster) {
      drawMonsterSprite(ctx, x - 26, y + 10, state.player.monster.definition.color);
    }
    drawPlayerSprite(ctx, x, y);
    if (state.player.monster) {
      drawCompanionEmote(ctx, x - 30, y - 6);
    }
  }

  private drawWilds(ctx: CanvasRenderingContext2D) {
    this.wildCreatures.forEach(wild => {
      drawMonsterSprite(ctx, wild.position.x, wild.position.y, monsterDefinitions[wild.id].color);
    });
  }

  private renderOverlay({ engine, state }: SceneContext) {
    const overlay = engine.getOverlay();
    const monster = state.player.monster;
    const logHtml = state.log.map(line => `<div>${line}</div>`).join('');

    if (!monster) {
      const markup = `
        <div class="panel info-panel">Choisissez un compagnon dans le village pour commencer l aventure.</div>
        <div class="panel log">${logHtml}</div>
      `;
      this.updateOverlay(overlay, markup);
      return;
    }

    if (this.battle) {
      const enemy = this.battle.getEnemy();
      const player = this.battle.getPlayer();
      const attacks = this.battle.getPlayerAttacks();
      const cursor = this.battle.getCursor();
      const animations = this.battle.getAnimations();
      const buildAttackStyle = (
        side: 'player' | 'enemy',
        baseColor: string,
        animation: AttackAnimation | null
      ) => {
        const direction = side === 'player' ? 1 : -1;
        const angle = animation?.angle ?? 0;
        const offset = animation?.offset ?? 0;
        const shouldMirror = animation?.mirror ?? true;
        const effectiveAngle = side === 'enemy' && shouldMirror ? -angle : angle;
        const effectiveOffset = side === 'enemy' && shouldMirror ? -offset : offset;
        const parts = [
          `--monster-color:${baseColor}`,
          `--attack-color:${animation?.color ?? baseColor}`,
          `--attack-secondary:${animation?.secondary ?? animation?.color ?? baseColor}`,
          `--attack-angle:${effectiveAngle}deg`,
          `--attack-offset:${effectiveOffset}px`,
          `--attack-rise:${(animation?.rise ?? 0)}px`,
          `--attack-spread:${animation?.spread ?? 1}`,
          `--attack-width:${animation?.width ?? 180}px`,
          `--attack-duration:${animation?.duration ?? 0.5}s`,
          `--attack-intensity:${animation?.intensity ?? 1}`,
          `--attack-direction:${direction}`
        ];
        return parts.join(';') + ';';
      };
      const playerStyle = buildAttackStyle('player', player.monster.definition.color, animations.playerAnimation);
      const enemyStyle = buildAttackStyle('enemy', enemy.monster.definition.color, animations.enemyAnimation);
      const battleMarkup = `
        <div class="panel battle-panel">
          <div class="battle-stage">
            <div
              class="monster-slot enemy"
              data-attack-token="${animations.enemyAttack}"
              data-hit-token="${animations.enemyHit}"
              data-attack-effect="${animations.enemyAnimation ? animations.enemyAnimation.effect : ''}"
              data-attack-id="${animations.enemyAnimationId}"
              style="${enemyStyle}"
            >
              <div class="status-card">
                <div class="status-header">
                  <span class="name">${enemy.monster.definition.name}</span>
                  <span class="level">Nv. ${enemy.monster.stats.level}</span>
                </div>
                <div class="hp-bar"><span style="width:${(enemy.hp / enemy.maxHp) * 100}%"></span></div>
                <div class="hp-values">${enemy.hp}/${enemy.maxHp} PV</div>
              </div>
              <div class="sprite-wrapper">
                <div class="attack-effect"></div>
                <div class="platform"></div>
                <div class="sprite-chassis">
                  <div class="sprite"></div>
                </div>
              </div>
            </div>
            <div
              class="monster-slot player"
              data-attack-token="${animations.playerAttack}"
              data-hit-token="${animations.playerHit}"
              data-attack-effect="${animations.playerAnimation ? animations.playerAnimation.effect : ''}"
              data-attack-id="${animations.playerAnimationId}"
              style="${playerStyle}"
            >
              <div class="sprite-wrapper">
                <div class="attack-effect"></div>
                <div class="platform"></div>
                <div class="sprite-chassis">
                  <div class="sprite"></div>
                </div>
              </div>
              <div class="status-card">
                <div class="status-header">
                  <span class="name">${player.monster.definition.name}</span>
                  <span class="level">Nv. ${player.monster.stats.level}</span>
                </div>
                <div class="hp-bar"><span style="width:${(player.hp / player.maxHp) * 100}%"></span></div>
                <div class="hp-values">${player.hp}/${player.maxHp} PV</div>
              </div>
            </div>
          </div>
          <div class="battle-menu">
            ${attacks
              .map((attack, index) => `
                <div class="menu-item ${index === cursor ? 'active' : ''}">
                  <div class="menu-header">
                    <span class="menu-name">${attack.name}</span>
                    <span class="menu-chance">${Math.round(attack.successRate * 100)}% réussite</span>
                  </div>
                  <div class="menu-details">${attack.damage} dégâts · ${attack.description}</div>
                </div>
              `)
              .join('')}
          </div>
        </div>
        <div class="panel log">${logHtml}</div>
      `;
      this.updateOverlay(overlay, battleMarkup);
      return;
    }

    const markup = `
      <div class="panel info-panel">
        <strong>Plaines Virescentes</strong><br />
        ${monster.definition.name} est prêt pour le combat. Cherchez une créature scintillante pour engager une bataille.
      </div>
      <div class="panel log">${logHtml}</div>
    `;
    this.updateOverlay(overlay, markup);
  }

  private updateOverlay(overlay: HTMLElement, markup: string) {
    if (this.overlayMarkup === markup) return;
    overlay.innerHTML = markup;
    this.overlayMarkup = markup;
  }

  private applyMovement(state: SceneContext['state'], dt: number, speed: number, context: SceneContext) {
    let vx = 0;
    let vy = 0;
    if (this.pressed.has('ArrowUp') || this.pressed.has('z')) vy -= 1;
    if (this.pressed.has('ArrowDown') || this.pressed.has('s')) vy += 1;
    if (this.pressed.has('ArrowLeft') || this.pressed.has('q')) vx -= 1;
    if (this.pressed.has('ArrowRight') || this.pressed.has('d')) vx += 1;
    moveWithCollisions(this.map, state.player.position, vx, vy, speed, dt);

    if (state.player.position.x < TILE_SIZE * 0.9 && this.returnScene) {
      appendLog(state, 'Vous retournez au Village Emeraude.');
      context.engine.switchScene(this.returnScene);
    }
  }

  private animateWilds(dt: number) {
    this.wildCreatures.forEach(wild => {
      wild.oscillation += dt;
      wild.position.x = wild.base.x + Math.sin(wild.oscillation) * 6;
      wild.position.y = wild.base.y + Math.cos(wild.oscillation * 0.5) * 4;
    });
  }

  private checkCollisions(context: SceneContext) {
    const { state } = context;
    if (!state.player.monster) return;
    const { x, y } = state.player.position;
    const encounter = this.wildCreatures.find(wild => Math.hypot(wild.position.x - x, wild.position.y - y) < 36);
    if (encounter) {
      this.startBattle(context, encounter.id);
    }
  }

  private startBattle(context: SceneContext, enemyId: string) {
    const playerMonster = context.state.player.monster as MonsterInstance;
    this.battle = new BattleSystem(playerMonster, enemyId);
    this.battle.onVictory(() => {
      appendLog(context.state, 'La créature sauvage s enfuit !');
      this.battle = undefined;
    });
    appendLog(context.state, 'Le combat commence ! Utilisez ↑/↓ pour choisir une attaque puis Entrée.');
  }

  public setSpawn(position: { x: number; y: number }) {
    this.spawn = { ...position };
  }

  public setReturnScene(scene: StarterScene) {
    this.returnScene = scene;
  }
}

class StarterScene implements Scene {
  public readonly id = 'starter';
  private pressed = new Set<string>();
  private options: StarterOption[] = [
    { id: 'sproutle', position: tileToPixel(9, 6) },
    { id: 'flaruba', position: tileToPixel(10, 6) },
    { id: 'tidebble', position: tileToPixel(11, 6) }
  ];
  private fieldScene: FieldScene;
  private welcomed = false;
  private readonly map = starterMap;

  constructor(fieldScene: FieldScene) {
    this.fieldScene = fieldScene;
  }

  enter({ state }: SceneContext): void {
    state.scene = this.id;
    state.player.position = tileToPixel(5, 8);
    if (!this.welcomed) {
      appendLog(state, 'Choisissez votre compagnon parmi les trois pierres mystiques.');
      this.welcomed = true;
    }
  }

  update(context: SceneContext, dt: number): void {
    const { state } = context;
    const speed = 110;
    if (!state.player.monster) {
      this.applyMovement(state, dt, speed);
    } else {
      this.applyMovement(state, dt, speed);
      if (state.player.position.x > TILE_SIZE * 18) {
        appendLog(state, 'Vous traversez le pont vers les Plaines Virescentes.');
        this.fieldScene.setSpawn(tileToPixel(2, Math.floor(state.player.position.y / TILE_SIZE)));
        context.engine.switchScene(this.fieldScene);
      }
    }
  }

  render(context: SceneContext, ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawTileMap(ctx, this.map);
    this.drawArchitecture(ctx);
    this.drawPlayer(context, ctx);
    this.drawStarters(context, ctx);
    this.renderOverlay(context);
  }

  onKeyDown(context: SceneContext, event: KeyboardEvent): void {
    this.pressed.add(event.key);
    if (event.key === ' ' || event.key === 'Enter') {
      this.trySelectStarter(context);
    }
  }

  onKeyUp(_: SceneContext, event: KeyboardEvent): void {
    this.pressed.delete(event.key);
  }

  private drawArchitecture(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(TILE_SIZE * 2, TILE_SIZE * 3, TILE_SIZE * 5, TILE_SIZE * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(TILE_SIZE * 2 + 6, TILE_SIZE * 3 + 6, TILE_SIZE * 5 - 12, TILE_SIZE * 2 - 12);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(TILE_SIZE * 14, TILE_SIZE * 6, TILE_SIZE * 4, TILE_SIZE * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(TILE_SIZE * 14 + 6, TILE_SIZE * 6 + 6, TILE_SIZE * 4 - 12, TILE_SIZE * 2 - 12);

    drawSignpost(ctx, tileToPixel(6, 9).x, tileToPixel(6, 9).y);
  }

  private drawPlayer({ state }: SceneContext, ctx: CanvasRenderingContext2D) {
    const { x, y } = state.player.position;
    drawPlayerSprite(ctx, x, y);
  }

  private drawStarters({ state }: SceneContext, ctx: CanvasRenderingContext2D) {
    this.options.forEach(option => {
      const def = monsterDefinitions[option.id];
      drawPedestal(ctx, option.position.x, option.position.y + 10);
      drawMonsterSprite(ctx, option.position.x, option.position.y, def.color);
      ctx.fillStyle = '#0f172a';
      ctx.font = '12px monospace';
      ctx.fillText(def.name, option.position.x - 26, option.position.y + 38);
      if (state.player.monster?.definition.id === option.id) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.strokeRect(option.position.x - 20, option.position.y - 20, 40, 40);
      }
    });
  }

  private renderOverlay({ engine, state }: SceneContext) {
    const overlay = engine.getOverlay();
    const monster = state.player.monster;
    overlay.innerHTML = `
      <div class="panel info-panel">
        <strong>Village Émeraude</strong><br />
        ${monster ? 'Traversez le pont à droite pour explorer le monde.' : 'Approchez-vous d une pierre et appuyez sur Entrée pour choisir.'}
      </div>
      <div class="panel log">
        ${state.log.map(line => `<div>${line}</div>`).join('')}
      </div>
    `;
  }

  private applyMovement(state: SceneContext['state'], dt: number, speed: number) {
    let vx = 0;
    let vy = 0;
    if (this.pressed.has('ArrowUp') || this.pressed.has('z')) vy -= 1;
    if (this.pressed.has('ArrowDown') || this.pressed.has('s')) vy += 1;
    if (this.pressed.has('ArrowLeft') || this.pressed.has('q')) vx -= 1;
    if (this.pressed.has('ArrowRight') || this.pressed.has('d')) vx += 1;
    moveWithCollisions(this.map, state.player.position, vx, vy, speed, dt);
  }

  private trySelectStarter({ state }: SceneContext) {
    if (state.player.monster) return;
    const { x, y } = state.player.position;
    const candidate = this.options.find(option => Math.hypot(option.position.x - x, option.position.y - y) < 40);
    if (!candidate) return;
    const monster = createMonsterInstance(candidate.id);
    state.player.monster = monster;
    appendLog(state, `Vous choisissez ${monster.definition.name} ! ${monster.definition.description}`);
  }

}

export { StarterScene, FieldScene };

export const createScenes = (): { starter: StarterScene; field: FieldScene } => {
  const field = new FieldScene();
  const starter = new StarterScene(field);
  field.setReturnScene(starter);
  return { starter, field };
};
