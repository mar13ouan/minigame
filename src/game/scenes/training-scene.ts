import type { Scene, SceneContext } from '../core/engine';
import { drawCompanionEmote, drawPlayerSprite, drawNpcSprite } from '../rendering/sprites';
import { appendLog } from '../state';
import { renderLog, wrapPanel, escapeHtml } from '../ui/templates';
import { moveWithCollisions } from '../world/movement';
import type { Point } from '../world/coordinates';
import { TILE_SIZE } from '../world/constants';
import type { TileMap } from '../world/tiles';
import { drawTileMap } from '../world/tiles';
import { resolveMovementVector } from './input';
import { addItem, getInventoryEntries, useItem } from '../items';
import { activateQuest, tryDeliverQuestItem } from '../quests';

export type TrainingTransition = {
  edge: 'left' | 'right' | 'top' | 'bottom';
  target: Scene;
  spawn: Point;
  unlockId?: string;
  logMessage?: string;
};

type TrainingStation = {
  id: string;
  position: Point;
  stat: 'power' | 'defense' | 'speed';
  description: string;
};

type TrainerNpc = {
  id: string;
  name: string;
  position: Point;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export class TrainingScene implements Scene {
  public readonly id = 'training';

  private readonly map: TileMap;
  private readonly stations: TrainingStation[];
  private readonly trainer: TrainerNpc;
  private transitions: TrainingTransition[] = [];
  private pressedKeys = new Set<string>();
  private spawn: Point;
  private visited = false;
  private inventoryOpen = false;
  private animationClock = 0;
  private direction: 'down' | 'up' | 'left' | 'right' = 'down';
  private completedStations = new Set<string>();
  private hungerTimer = 0;
  private starvationTimer = 0;

  constructor(map: TileMap, spawn: Point, stations: TrainingStation[], trainer: TrainerNpc) {
    this.map = map;
    this.spawn = { ...spawn };
    this.stations = stations;
    this.trainer = trainer;
  }

  public setTransitions(transitions: TrainingTransition[]): void {
    this.transitions = transitions;
  }

  public setSpawn(spawn: Point): void {
    this.spawn = { ...spawn };
  }

  public enter({ state }: SceneContext): void {
    state.scene = this.id;
    state.player.position = { ...this.spawn };
    if (!this.visited) {
      appendLog(state, 'Le Dojo des Hauteurs vous attend. Trois piliers pour forger votre monstre.');
      this.visited = true;
    }
  }

  public update(context: SceneContext, dt: number): void {
    this.animationClock += dt;
    this.applyHunger(context.state, dt);
    this.applyMovement(context, dt, 115);
    this.checkTransitions(context);
  }

  public render(context: SceneContext, ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawTileMap(ctx, this.map);
    this.drawStations(ctx);
    this.drawTrainer(ctx);
    this.drawPlayer(context, ctx);
    this.renderOverlay(context);
  }

  public onKeyDown(context: SceneContext, event: KeyboardEvent): void {
    if (this.inventoryOpen) {
      this.handleInventoryInput(context, event);
      return;
    }

    if (event.key === 'i' || event.key === 'I' || event.key === 'Tab') {
      this.inventoryOpen = !this.inventoryOpen;
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      this.tryInteract(context);
      return;
    }

    this.pressedKeys.add(event.key);
  }

  public onKeyUp(_: SceneContext, event: KeyboardEvent): void {
    this.pressedKeys.delete(event.key);
  }

  private handleInventoryInput(context: SceneContext, event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'i' || event.key === 'I' || event.key === 'Tab') {
      this.inventoryOpen = false;
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      return;
    }

    const index = Number(event.key) - 1;
    const entries = getInventoryEntries(context.state.player.inventory);
    const entry = entries[index];
    if (!entry) {
      return;
    }

    const result = useItem(context.state, entry.id);
    appendLog(context.state, result.message);
    this.inventoryOpen = false;
  }

  private applyMovement(context: SceneContext, dt: number, speed: number): void {
    const { vx, vy } = resolveMovementVector(this.pressedKeys);
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.direction = vx > 0 ? 'right' : 'left';
      } else {
        this.direction = vy > 0 ? 'down' : 'up';
      }
    }
    moveWithCollisions(this.map, context.state.player.position, vx, vy, speed, dt);
  }

  private checkTransitions(context: SceneContext): void {
    const { position } = context.state.player;
    const mapWidth = (this.map[0]?.length ?? 0) * TILE_SIZE;
    const mapHeight = this.map.length * TILE_SIZE;

    for (const transition of this.transitions) {
      let trigger = false;
      switch (transition.edge) {
        case 'left':
          trigger = position.x < TILE_SIZE * 0.6;
          break;
        case 'right':
          trigger = position.x > mapWidth - TILE_SIZE * 0.6;
          break;
        case 'top':
          trigger = position.y < TILE_SIZE * 0.6;
          break;
        case 'bottom':
          trigger = position.y > mapHeight - TILE_SIZE * 0.6;
          break;
      }

      if (!trigger) {
        continue;
      }

      if (transition.unlockId && !context.state.unlockedScenes.has(transition.unlockId)) {
        continue;
      }

      transition.logMessage && appendLog(context.state, transition.logMessage);
      const targetWithSpawn = transition.target as Scene & { setSpawn?: (point: Point) => void };
      targetWithSpawn.setSpawn?.({ ...transition.spawn });
      context.engine.switchScene(transition.target);
      return;
    }
  }

  private tryInteract(context: SceneContext): void {
    const { state } = context;
    const playerPos = state.player.position;
    const monster = state.player.monster;

    if (!monster) {
      appendLog(state, 'Aucun compagnon ne peut s entraîner pour le moment.');
      return;
    }

    const station = this.stations.find(candidate => Math.hypot(candidate.position.x - playerPos.x, candidate.position.y - playerPos.y) < 36);
    if (station) {
      this.performTraining(state, monster, station);
      return;
    }

    const trainerDist = Math.hypot(this.trainer.position.x - playerPos.x, this.trainer.position.y - playerPos.y);
    if (trainerDist < 40) {
      this.talkToTrainer(context);
      return;
    }

    appendLog(state, 'Rien à faire ici pour le moment.');
  }

  private performTraining(state: SceneContext['state'], monster: SceneContext['state']['player']['monster'], station: TrainingStation): void {
    if (!monster) {
      return;
    }

    monster.stats[station.stat] += 2;
    this.completedStations.add(station.id);
    state.player.hunger = clamp(state.player.hunger - 8, 0, 100);
    appendLog(state, `${monster.definition.name} s entraîne : ${station.description}`);

    if (this.completedStations.size >= this.stations.length) {
      if (!state.player.inventory['training-badge']) {
        addItem(state, 'training-badge', 1);
        appendLog(state, 'Vous obtenez un Badge d Entraînement ! Ramenez-le au maître.');
      }
    }
  }

  private talkToTrainer(context: SceneContext): void {
    const { state } = context;
    if (!state.player.monster) {
      appendLog(state, 'Revenez avec un compagnon à entraîner.');
      return;
    }

    activateQuest(state, 'training-gauntlet');
    if (tryDeliverQuestItem(state, 'training-gauntlet')) {
      appendLog(state, 'Excellent travail ! Continuez à vous dépasser.');
    } else {
      appendLog(state, 'Complétez les trois exercices puis rapportez-moi le badge.');
    }
  }

  private drawStations(ctx: CanvasRenderingContext2D): void {
    this.stations.forEach(station => {
      ctx.fillStyle = this.completedStations.has(station.id) ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.35)';
      ctx.beginPath();
      ctx.arc(station.position.x, station.position.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px monospace';
      ctx.fillText(station.stat.toUpperCase(), station.position.x - 18, station.position.y + 4);
    });
  }

  private drawTrainer(ctx: CanvasRenderingContext2D): void {
    const frame = Math.floor(this.animationClock * 6) % 4;
    drawNpcSprite(ctx, this.trainer.position.x, this.trainer.position.y, frame);
  }

  private drawPlayer({ state }: SceneContext, ctx: CanvasRenderingContext2D): void {
    const { x, y } = state.player.position;
    const frame = Math.floor(this.animationClock * 8) % 4;
    drawPlayerSprite(ctx, x, y, this.direction, frame);
    if (state.player.monster) {
      drawCompanionEmote(ctx, x - 28, y - 6);
    }
  }

  private renderOverlay(context: SceneContext): void {
    const { overlay, state } = context;
    const logMarkup = renderLog(state.log);

    if (this.inventoryOpen) {
      overlay.render('menu', this.buildInventoryMenu(state));
      return;
    }

    const hunger = Math.round(state.player.hunger);
    const progress = `${this.completedStations.size}/${this.stations.length}`;
    const info = `
      <strong>Dojo des Hauteurs</strong><br />
      Faim : ${hunger}/100 · Exos : ${progress}
    `;

    overlay.render('default', [wrapPanel('info-panel', info), wrapPanel('log', logMarkup)].join(''));
  }

  private buildInventoryMenu(state: SceneContext['state']): string {
    const entries = getInventoryEntries(state.player.inventory);
    const content = entries
      .map((entry, index) => `
        <div class="menu-item">
          <span class="menu-shortcut">${index + 1}</span>
          <span class="menu-name">${escapeHtml(entry.definition.name)}</span>
          <span class="menu-qty">×${entry.quantity}</span>
          <div class="menu-details">${escapeHtml(entry.definition.description)}</div>
        </div>
      `)
      .join('');
    return wrapPanel('inventory-panel', `<strong>Objets</strong><br /><small>Choisissez avec les chiffres.</small>${content || '<em>Vide</em>'}`);
  }

  private applyHunger(state: SceneContext['state'], dt: number): void {
    state.player.hunger = clamp(state.player.hunger - dt * 1, 0, 100);
    this.hungerTimer += dt;
    if (this.hungerTimer > 12 && state.player.hunger < 60) {
      appendLog(state, 'Votre compagnon semble affamé après tant d efforts.');
      this.hungerTimer = 0;
    }

    if (state.player.hunger <= 0 && state.player.monster) {
      this.starvationTimer += dt;
      if (this.starvationTimer > 6) {
        this.starvationTimer = 0;
        state.player.monster.stats.morale = Math.max(1, state.player.monster.stats.morale - 1);
        appendLog(state, `${state.player.monster.definition.name} est épuisé par la faim.`);
      }
    } else {
      this.starvationTimer = 0;
    }
  }
}

export const createTrainingStations = (): TrainingStation[] => [
  {
    id: 'weights',
    position: { x: TILE_SIZE * 6, y: TILE_SIZE * 5 },
    stat: 'power',
    description: 'Soulève des pierres lourdes et gagne en puissance.'
  },
  {
    id: 'sparring',
    position: { x: TILE_SIZE * 10, y: TILE_SIZE * 6.5 },
    stat: 'defense',
    description: 'Affûte sa garde face à un mannequin animé.'
  },
  {
    id: 'track',
    position: { x: TILE_SIZE * 13, y: TILE_SIZE * 4 },
    stat: 'speed',
    description: 'Sprinte autour du dojo pour affiner sa vitesse.'
  }
];

export const createTrainingMaster = (): TrainerNpc => ({
  id: 'master',
  name: 'Maître Kael',
  position: { x: TILE_SIZE * 8.5, y: TILE_SIZE * 4.5 }
});
