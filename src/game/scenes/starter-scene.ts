import type { Scene, SceneContext } from '../core/engine';
import { drawPlayerSprite, drawMonsterSprite } from '../rendering/sprites';
import { drawPedestal, drawSignpost } from '../rendering/decor';
import { monsterDefinitions, createMonsterInstance } from '../monsters';
import { appendLog } from '../state';
import { renderLog, wrapPanel } from '../ui/templates';
import { moveWithCollisions } from '../world/movement';
import { tileToPixel, type Point } from '../world/coordinates';
import { TILE_SIZE } from '../world/constants';
import { starterMap } from '../world/maps';
import { drawTileMap } from '../world/tiles';
import { resolveMovementVector } from './input';
import { addItem } from '../items';

const enum OverlayMode {
  Default = 'default'
}

type StarterOption = {
  id: string;
  position: Point;
};

export class StarterScene implements Scene {
  public readonly id = 'starter';

  private readonly map = starterMap;
  private readonly pressedKeys = new Set<string>();
  private readonly options: StarterOption[] = [
    { id: 'sproutle', position: tileToPixel(9, 6) },
    { id: 'flaruba', position: tileToPixel(10, 6) },
    { id: 'tidebble', position: tileToPixel(11, 6) }
  ];
  private welcomed = false;
  private animationClock = 0;
  private direction: 'down' | 'up' | 'left' | 'right' = 'down';

  constructor(private readonly villageScene: Scene) {}

  public enter({ state }: SceneContext): void {
    state.scene = this.id;
    state.player.position = tileToPixel(5, 8);
    if (!this.welcomed) {
      appendLog(state, 'Choisissez votre compagnon parmi les trois pierres mystiques.');
      this.welcomed = true;
    }
  }

  public update(context: SceneContext, dt: number): void {
    this.animationClock += dt;
    const speed = 110;
    this.applyMovement(context.state.player.position, dt, speed);

    if (context.state.player.monster && context.state.player.position.x > TILE_SIZE * 18) {
      appendLog(context.state, 'Vous traversez le pont vers le Village Émeraude.');
      context.state.unlockedScenes.add('village');
      context.engine.switchScene(this.villageScene);
    }
  }

  public render(context: SceneContext, ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawTileMap(ctx, this.map);
    this.drawArchitecture(ctx);
    this.drawPlayer(context, ctx);
    this.drawStarterOptions(context, ctx);
    this.renderOverlay(context);
  }

  public onKeyDown(context: SceneContext, event: KeyboardEvent): void {
    this.pressedKeys.add(event.key);
    if (event.key === ' ' || event.key === 'Enter') {
      this.trySelectStarter(context);
    }
  }

  public onKeyUp(_: SceneContext, event: KeyboardEvent): void {
    this.pressedKeys.delete(event.key);
  }

  private applyMovement(position: Point, dt: number, speed: number): void {
    const { vx, vy } = resolveMovementVector(this.pressedKeys);
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.direction = vx > 0 ? 'right' : 'left';
      } else {
        this.direction = vy > 0 ? 'down' : 'up';
      }
    }
    moveWithCollisions(this.map, position, vx, vy, speed, dt);
  }

  private drawArchitecture(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(TILE_SIZE * 2, TILE_SIZE * 3, TILE_SIZE * 5, TILE_SIZE * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(TILE_SIZE * 2 + 6, TILE_SIZE * 3 + 6, TILE_SIZE * 5 - 12, TILE_SIZE * 2 - 12);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(TILE_SIZE * 14, TILE_SIZE * 6, TILE_SIZE * 4, TILE_SIZE * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(TILE_SIZE * 14 + 6, TILE_SIZE * 6 + 6, TILE_SIZE * 4 - 12, TILE_SIZE * 2 - 12);

    drawSignpost(ctx, tileToPixel(6, 9));
  }

  private drawPlayer({ state }: SceneContext, ctx: CanvasRenderingContext2D): void {
    const { x, y } = state.player.position;
    const frame = Math.floor(this.animationClock * 8) % 4;
    drawPlayerSprite(ctx, x, y, this.direction, frame);
  }

  private drawStarterOptions({ state }: SceneContext, ctx: CanvasRenderingContext2D): void {
    this.options.forEach(option => {
      const definition = monsterDefinitions[option.id];
      drawPedestal(ctx, { x: option.position.x, y: option.position.y + 10 });
      drawMonsterSprite(ctx, option.position.x, option.position.y, definition.color, 'default', this.animationClock);
      ctx.fillStyle = '#0f172a';
      ctx.font = '12px monospace';
      ctx.fillText(definition.name, option.position.x - 26, option.position.y + 38);
      if (state.player.monster?.definition.id === option.id) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.strokeRect(option.position.x - 20, option.position.y - 20, 40, 40);
      }
    });
  }

  private renderOverlay({ overlay, state }: SceneContext): void {
    const logMarkup = renderLog(state.log);
    const hasCompanion = Boolean(state.player.monster);
    const info = hasCompanion
      ? '<strong>Village Émeraude</strong><br />Traversez le pont à droite pour explorer le monde.'
      : "<strong>Village Émeraude</strong><br />Approchez-vous d’une pierre et appuyez sur Entrée pour choisir.";

    overlay.render(OverlayMode.Default, [wrapPanel('info-panel', info), wrapPanel('log', logMarkup)].join(''));
  }

  private trySelectStarter({ state }: SceneContext): void {
    if (state.player.monster) {
      return;
    }

    const { x, y } = state.player.position;
    const candidate = this.options.find(option => Math.hypot(option.position.x - x, option.position.y - y) < 40);
    if (!candidate) {
      return;
    }

    const monster = createMonsterInstance(candidate.id);
    state.player.monster = monster;
    addItem(state, 'fresh-meat', 2);
    addItem(state, 'vital-herb', 1);
    appendLog(state, `Vous choisissez ${monster.definition.name} ! ${monster.definition.description}`);
    appendLog(state, 'Vous recevez de la viande et une herbe pour prendre soin de votre compagnon.');
  }
}
