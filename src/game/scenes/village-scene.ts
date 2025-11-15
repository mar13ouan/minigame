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
import { getInventoryEntries, useItem } from '../items';
import {
  activateQuest,
  getQuestSummaries,
  questDefinitions,
  tryDeliverQuestItem
} from '../quests';

export type VillageTransition = {
  edge: 'left' | 'right' | 'top' | 'bottom';
  target: Scene;
  spawn: Point;
  unlockId?: string;
  lockedMessage?: string;
  logMessage?: string;
};

type NpcDefinition = {
  id: string;
  name: string;
  position: Point;
  dialog: string[];
  interact?: (context: SceneContext) => void;
};

type DialogState = {
  lines: string[];
  index: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export class VillageScene implements Scene {
  public readonly id = 'village';

  private readonly map: TileMap;
  private readonly npcs: NpcDefinition[];
  private transitions: VillageTransition[] = [];
  private pressedKeys = new Set<string>();
  private spawn: Point;
  private visited = false;
  private menuOpen = false;
  private dialog?: DialogState;
  private animationClock = 0;
  private direction: 'down' | 'up' | 'left' | 'right' = 'down';
  private hungerWarning = false;
  private starvationTimer = 0;

  constructor(map: TileMap, spawn: Point, npcs: NpcDefinition[]) {
    this.map = map;
    this.spawn = { ...spawn };
    this.npcs = npcs;
  }

  public setTransitions(transitions: VillageTransition[]): void {
    this.transitions = transitions;
  }

  public setSpawn(spawn: Point): void {
    this.spawn = { ...spawn };
  }

  public enter({ state }: SceneContext): void {
    state.scene = this.id;
    state.player.position = { ...this.spawn };
    if (!this.visited) {
      appendLog(state, 'Bienvenue au Village Émeraude, sanctuaire des dompteurs.');
      this.visited = true;
    }
  }

  public update(context: SceneContext, dt: number): void {
    this.animationClock += dt;
    this.applyHunger(context.state, dt);
    if (this.dialog) {
      return;
    }

    this.applyMovement(context, dt, 110);
    this.checkTransitions(context);
  }

  public render(context: SceneContext, ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawTileMap(ctx, this.map);
    this.drawNpcs(ctx);
    this.drawPlayer(context, ctx);
    this.renderOverlay(context);
  }

  public onKeyDown(context: SceneContext, event: KeyboardEvent): void {
    if (this.dialog) {
      if (event.key === 'Enter' || event.key === ' ') {
        this.advanceDialog(context);
      }
      return;
    }

    if (this.menuOpen) {
      this.handleInventoryInput(context, event);
      return;
    }

    if (event.key === 'i' || event.key === 'I' || event.key === 'Tab') {
      this.menuOpen = !this.menuOpen;
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
      this.menuOpen = false;
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
    if (result.success && context.state.player.hunger > 75) {
      this.hungerWarning = false;
    }
    this.menuOpen = false;
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
        transition.lockedMessage && appendLog(context.state, transition.lockedMessage);
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
    const { position } = state.player;
    const npc = this.npcs.find(candidate => Math.hypot(candidate.position.x - position.x, candidate.position.y - position.y) < 42);
    if (!npc) {
      appendLog(state, 'Il n y a personne à proximité.');
      return;
    }

    npc.interact?.(context);
    this.dialog = { lines: npc.dialog, index: 0 };
    this.advanceDialog(context, false);
  }

  private advanceDialog(context: SceneContext, advance = true): void {
    if (!this.dialog) {
      return;
    }

    if (advance) {
      this.dialog.index++;
    }

    if (this.dialog.index >= this.dialog.lines.length) {
      this.dialog = undefined;
      return;
    }

    appendLog(context.state, this.dialog.lines[this.dialog.index]);
  }

  private drawNpcs(ctx: CanvasRenderingContext2D): void {
    const frame = Math.floor(this.animationClock * 6) % 4;
    this.npcs.forEach(npc => {
      drawNpcSprite(ctx, npc.position.x, npc.position.y, frame);
    });
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

    if (this.dialog) {
      const currentLine = this.dialog.lines[Math.min(this.dialog.index, this.dialog.lines.length - 1)] ?? '';
      overlay.render(
        'dialog',
        wrapPanel('dialog-panel', `<strong>Discussion</strong><div>${escapeHtml(currentLine)}</div><small>Entrée pour continuer...</small>`) +
          wrapPanel('log', logMarkup)
      );
      return;
    }

    if (this.menuOpen) {
      overlay.render('menu', this.buildInventoryMenu(state));
      return;
    }

    const hunger = Math.round(state.player.hunger);
    const info = `
      <strong>Village Émeraude</strong><br />
      Faim : ${hunger}/100 · Or : ${state.player.gold}
    `;

    const quests = getQuestSummaries(state)
      .map(quest => `<div class="quest-line ${quest.status}">${escapeHtml(quest.title)} · ${escapeHtml(quest.objective)}</div>`)
      .join('');

    overlay.render(
      'default',
      [wrapPanel('info-panel', info), wrapPanel('quest-panel', quests || '<em>Aucune quête</em>'), wrapPanel('log', logMarkup)].join('')
    );
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
    const empty = '<em>Aucun objet.</em>';
    return wrapPanel('inventory-panel', `<strong>Objets</strong><br /><small>Appuyez sur un chiffre pour utiliser.</small>${content || empty}`);
  }

  private applyHunger(state: SceneContext['state'], dt: number): void {
    state.player.hunger = clamp(state.player.hunger - dt * 0.8, 0, 100);
    if (!this.hungerWarning && state.player.hunger <= 40) {
      appendLog(state, 'Votre compagnon aimerait une collation.');
      this.hungerWarning = true;
    }

    if (state.player.hunger <= 0 && state.player.monster) {
      this.starvationTimer += dt;
      if (this.starvationTimer > 8) {
        this.starvationTimer = 0;
        state.player.monster.stats.morale = Math.max(1, state.player.monster.stats.morale - 1);
        appendLog(state, `${state.player.monster.definition.name} a faim et devient maussade.`);
      }
    } else {
      this.starvationTimer = 0;
    }
  }
}

export const createVillageNpcs = (): NpcDefinition[] => [
  {
    id: 'elder',
    name: 'Ancien',
    position: { x: TILE_SIZE * 6, y: TILE_SIZE * 4.2 },
    dialog: [
      'Bienvenue, dompteur. Notre village compte sur vous.',
      questDefinitions['village-relic'].description,
      'Ramenez-moi la relique et nous ouvrirons la route du nord.'
    ],
    interact: ({ state }) => {
      activateQuest(state, 'village-relic');
      tryDeliverQuestItem(state, 'village-relic');
    }
  },
  {
    id: 'merchant',
    name: 'Marchande',
    position: { x: TILE_SIZE * 10, y: TILE_SIZE * 6.4 },
    dialog: [
      'J échange des histoires contre des victoires.',
      'Revenez me voir quand vous aurez terrassé des boss, je chanterai vos exploits.'
    ]
  },
  {
    id: 'scout',
    name: 'Éclaireur',
    position: { x: TILE_SIZE * 13.5, y: TILE_SIZE * 4.5 },
    dialog: [
      'Les hauteurs au nord grouillent de menaces.',
      'Sans preuve de votre bravoure, je ne vous laisserai pas passer.'
    ],
    interact: ({ state }) => {
      if (state.unlockedScenes.has('wild-north')) {
        appendLog(state, 'Je vois que vous avez l accord du village. Bonne chasse !');
      }
    }
  }
];
