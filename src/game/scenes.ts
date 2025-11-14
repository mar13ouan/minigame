import { BattleSystem, actionLabels } from './battle';
import type { Scene, SceneContext } from './engine';
import { createMonsterInstance, monsterDefinitions, type MonsterInstance } from './monsters';
import { appendLog } from './state';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const drawPixelBackground = (ctx: CanvasRenderingContext2D, colorA: string, colorB: string) => {
  const { width, height } = ctx.canvas;
  const tileSize = 24;
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      ctx.fillStyle = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0 ? colorA : colorB;
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }
};

const PLAYER_SIZE = 28;

type StarterOption = {
  id: string;
  position: { x: number; y: number };
};

class FieldScene implements Scene {
  public readonly id = 'field';
  private pressed = new Set<string>();
  private spawn: { x: number; y: number } = { x: 140, y: 260 };
  private battle?: BattleSystem;
  private wildCreatures = [
    { id: 'sproutle', position: { x: 520, y: 260 }, oscillation: Math.random() * Math.PI * 2 },
    { id: 'flaruba', position: { x: 680, y: 340 }, oscillation: Math.random() * Math.PI * 2 }
  ];
  private returnScene?: StarterScene;
  private visited = false;

  enter({ state }: SceneContext): void {
    state.scene = this.id;
    state.player.position = { ...this.spawn };
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
    this.applyMovement(state, dt, 120, { minX: 80, minY: 120, maxX: 880, maxY: 460 }, context);
    this.animateWilds(dt);
    this.checkCollisions(context);
  }

  render(context: SceneContext, ctx: CanvasRenderingContext2D): void {
    drawPixelBackground(ctx, '#163121', '#1b3d28');
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
    ctx.fillStyle = '#14532d';
    ctx.fillRect(80, 120, 800, 340);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(80, 220, 60, 120);
  }

  private drawPlayer({ state }: SceneContext, ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#facc15';
    const { x, y } = state.player.position;
    ctx.fillRect(x - PLAYER_SIZE / 2, y - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
    if (state.player.monster) {
      ctx.fillStyle = state.player.monster.definition.color;
      ctx.fillRect(x + 20, y - 10, 20, 20);
    }
  }

  private drawWilds(ctx: CanvasRenderingContext2D) {
    this.wildCreatures.forEach(wild => {
      ctx.fillStyle = monsterDefinitions[wild.id].color;
      ctx.fillRect(wild.position.x - 16, wild.position.y - 16, 32, 32);
    });
  }

  private renderOverlay({ engine, state }: SceneContext) {
    const overlay = engine.getOverlay();
    const monster = state.player.monster;
    if (!monster) {
      overlay.innerHTML = `
        <div class="panel">Vous devez choisir un compagnon dans le village.</div>
        <div class="panel log">${state.log.map(line => `<div>${line}</div>`).join('')}</div>
      `;
      return;
    }

    if (this.battle) {
      const enemy = this.battle.getEnemy();
      const player = this.battle.getPlayer();
      overlay.innerHTML = `
        <div class="panel">
          <strong>Combat</strong><br />
          ${player.monster.definition.name} HP ${player.hp}/${player.maxHp}<br />
          ${enemy.monster.definition.name} HP ${enemy.hp}/${enemy.maxHp}<br />
          <div>Choix : ${actionLabels.attack} | ${actionLabels.encourage} (Entrée)</div>
        </div>
        <div class="panel log">
          ${state.log.map(line => `<div>${line}</div>`).join('')}
        </div>
      `;
    } else {
      overlay.innerHTML = `
        <div class="panel">
          <strong>Plaines Virescentes</strong><br />
          Affrontez des créatures sauvages pour renforcer ${monster.definition.name}.<br />
          Revenez au village en longeant la falaise à gauche.
        </div>
        <div class="panel log">
          ${state.log.map(line => `<div>${line}</div>`).join('')}
        </div>
      `;
    }
  }

  private applyMovement(
    state: SceneContext['state'],
    dt: number,
    speed: number,
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    context: SceneContext
  ) {
    let vx = 0;
    let vy = 0;
    if (this.pressed.has('ArrowUp') || this.pressed.has('z')) vy -= 1;
    if (this.pressed.has('ArrowDown') || this.pressed.has('s')) vy += 1;
    if (this.pressed.has('ArrowLeft') || this.pressed.has('q')) vx -= 1;
    if (this.pressed.has('ArrowRight') || this.pressed.has('d')) vx += 1;
    const length = Math.hypot(vx, vy) || 1;
    vx /= length;
    vy /= length;
    state.player.position.x = clamp(state.player.position.x + vx * speed * dt, bounds.minX, bounds.maxX);
    state.player.position.y = clamp(state.player.position.y + vy * speed * dt, bounds.minY, bounds.maxY);

    if (state.player.position.x < 120 && this.returnScene) {
      appendLog(state, 'Vous retournez au Village Emeraude.');
      context.engine.switchScene(this.returnScene);
    }
  }

  private animateWilds(dt: number) {
    this.wildCreatures.forEach(wild => {
      wild.oscillation += dt;
      wild.position.x += Math.sin(wild.oscillation) * 10 * dt;
      wild.position.y += Math.cos(wild.oscillation * 0.5) * 8 * dt;
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
    appendLog(context.state, 'Le combat commence ! Utilisez Entrée pour attaquer.');
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
    { id: 'sproutle', position: { x: 260, y: 220 } },
    { id: 'flaruba', position: { x: 320, y: 220 } },
    { id: 'tidebble', position: { x: 380, y: 220 } }
  ];
  private fieldScene: FieldScene;
  private welcomed = false;

  constructor(fieldScene: FieldScene) {
    this.fieldScene = fieldScene;
  }

  enter({ state }: SceneContext): void {
    state.scene = this.id;
    state.player.position = { x: 220, y: 260 };
    if (!this.welcomed) {
      appendLog(state, 'Choisissez votre compagnon parmi les trois pierres mystiques.');
      this.welcomed = true;
    }
  }

  update(context: SceneContext, dt: number): void {
    const { state } = context;
    const speed = 110;
    if (!state.player.monster) {
      this.applyMovement(state, dt, speed, { minX: 200, minY: 200, maxX: 420, maxY: 320 });
    } else {
      this.applyMovement(state, dt, speed, { minX: 120, minY: 180, maxX: 780, maxY: 460 });
      if (state.player.position.x > 760) {
        appendLog(state, 'Vous traversez le pont vers les Plaines Virescentes.');
        this.fieldScene.setSpawn({ x: 140, y: state.player.position.y });
        context.engine.switchScene(this.fieldScene);
      }
    }
  }

  render(context: SceneContext, ctx: CanvasRenderingContext2D): void {
    drawPixelBackground(ctx, '#1d2a3a', '#23354b');
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
    ctx.fillRect(120, 180, 640, 240);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 6;
    ctx.strokeRect(120, 180, 640, 240);

    ctx.fillStyle = '#334155';
    ctx.fillRect(760, 240, 60, 120);
  }

  private drawPlayer({ state }: SceneContext, ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#facc15';
    const { x, y } = state.player.position;
    ctx.fillRect(x - PLAYER_SIZE / 2, y - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
  }

  private drawStarters({ state }: SceneContext, ctx: CanvasRenderingContext2D) {
    this.options.forEach(option => {
      const def = monsterDefinitions[option.id];
      ctx.fillStyle = def.color;
      ctx.fillRect(option.position.x - 16, option.position.y - 16, 32, 32);
      ctx.fillStyle = '#0f172a';
      ctx.font = '12px monospace';
      ctx.fillText(def.name, option.position.x - 26, option.position.y + 32);
      if (state.player.monster?.definition.id === option.id) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.strokeRect(option.position.x - 18, option.position.y - 18, 36, 36);
      }
    });
  }

  private renderOverlay({ engine, state }: SceneContext) {
    const overlay = engine.getOverlay();
    const monster = state.player.monster;
    overlay.innerHTML = `
      <div class="panel">
        <strong>Village Émeraude</strong><br />
        ${monster ? 'Traversez le pont à droite pour explorer le monde.' : 'Approchez-vous d une pierre et appuyez sur Entrée pour choisir.'}
      </div>
      <div class="panel log">
        ${state.log.map(line => `<div>${line}</div>`).join('')}
      </div>
    `;
  }

  private applyMovement(state: SceneContext['state'], dt: number, speed: number, bounds: { minX: number; minY: number; maxX: number; maxY: number }) {
    let vx = 0;
    let vy = 0;
    if (this.pressed.has('ArrowUp') || this.pressed.has('z')) vy -= 1;
    if (this.pressed.has('ArrowDown') || this.pressed.has('s')) vy += 1;
    if (this.pressed.has('ArrowLeft') || this.pressed.has('q')) vx -= 1;
    if (this.pressed.has('ArrowRight') || this.pressed.has('d')) vx += 1;
    const length = Math.hypot(vx, vy) || 1;
    vx /= length;
    vy /= length;
    state.player.position.x = clamp(state.player.position.x + vx * speed * dt, bounds.minX, bounds.maxX);
    state.player.position.y = clamp(state.player.position.y + vy * speed * dt, bounds.minY, bounds.maxY);
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
