import { BattleSystem, type BattleOutcome } from '../battle/system';
import type { Scene, SceneContext } from '../core/engine';
import { createCreatureSprite, createPlayerSprite, drawCompanionEmote } from '../rendering/sprites';
import { SpriteController } from '../rendering/sprite-system';
import { applyExperienceGain, type MonsterInstance, type Stats } from '../monsters';
import { addItemToInventory, itemDefinitions, removeItemFromInventory } from '../items';
import { appendLog, type GameState } from '../state';
import { renderHungerBar, renderLog, renderQuestList, wrapPanel, escapeHtml } from '../ui/templates';
import { moveWithCollisions } from '../world/movement';
import type { Point } from '../world/coordinates';
import { TILE_SIZE } from '../world/constants';
import { drawTileMap, getTileAt, type TileMap } from '../world/tiles';
import { resolveMovementVector } from './input';
import {
  activateQuest,
  completeQuest,
  getQuestProgress,
  markQuestRequirement,
  questDefinitions
} from '../quests';
import { feedWithItem, updatePlayerNeeds } from '../systems/needs';

const enum OverlayMode {
  Default = 'default',
  Battle = 'battle',
  Inventory = 'menu'
}

type Direction = 'up' | 'down' | 'left' | 'right';

type NeighborDirection = 'west' | 'east' | 'north' | 'south';

type AdventureNeighbor = {
  target: AdventureScene;
  spawn: Point;
  message: string;
};

type CreatureConfig = {
  id: string;
  spawn: Point;
  variant: 'plant' | 'fire' | 'water' | 'boss';
  roamRadius?: number;
  respawnTime?: number;
  boss?: boolean;
  loot?: string[];
  questId?: string;
};

type AdventureCreature = CreatureConfig & {
  position: Point;
  sprite: SpriteController;
  status: 'idle' | 'battle' | 'defeated';
  cooldown: number;
  oscillation: number;
};

type NPCConfig = {
  id: string;
  name: string;
  position: Point;
  dialogue: string[];
  questId?: string;
  role?: 'giver' | 'turnin';
};

type TrainingStation = {
  id: string;
  position: Point;
  stat: keyof Stats;
  description: string;
  hungerCost: number;
  reward: number;
};

type AdventureSceneConfig = {
  id: string;
  name: string;
  map: TileMap;
  spawn: Point;
  intro?: string;
  biome: 'plant' | 'fire' | 'water';
  creatures: CreatureConfig[];
  npcs?: NPCConfig[];
  training?: TrainingStation[];
};

type QuestEntryView = {
  title: string;
  status: string;
  description: string;
};

const isBossCreature = (creature: CreatureConfig): boolean => Boolean(creature.boss);

const createCreature = (config: CreatureConfig): AdventureCreature => ({
  ...config,
  position: { ...config.spawn },
  sprite: createCreatureSprite(config.variant === 'boss' ? 'boss' : config.variant),
  status: 'idle',
  cooldown: 0,
  oscillation: Math.random() * Math.PI * 2
});

const TRAINING_MESSAGES: Record<keyof Stats, string> = {
  level: 'niveau',
  power: 'puissance',
  defense: 'défense',
  speed: 'vitesse',
  morale: 'morale'
};

export class AdventureScene implements Scene {
  public readonly id: string;

  private readonly map: AdventureSceneConfig['map'];
  private readonly config: AdventureSceneConfig;
  private readonly pressedKeys = new Set<string>();
  private readonly playerSprite = createPlayerSprite();
  private readonly creatures: AdventureCreature[];
  private readonly npcs: NPCConfig[];
  private readonly training: TrainingStation[];
  private neighbors = new Map<NeighborDirection, AdventureNeighbor>();
  private battle?: BattleSystem;
  private activeCreature?: AdventureCreature;
  private preBattlePosition?: Point;
  private direction: Direction = 'down';
  private pendingSpawn?: Point;
  private inventoryOpen = false;
  private inventoryCursor = 0;

  constructor(config: AdventureSceneConfig) {
    this.config = config;
    this.id = config.id;
    this.map = config.map;
    this.creatures = config.creatures.map(createCreature);
    this.npcs = config.npcs ?? [];
    this.training = config.training ?? [];
  }

  public setSpawn(position: Point): void {
    this.pendingSpawn = { ...position };
  }

  public link(direction: NeighborDirection, target: AdventureScene, spawn: Point, message: string): void {
    this.neighbors.set(direction, { target, spawn, message });
  }

  public enter({ state }: SceneContext): void {
    state.scene = this.id;
    state.unlockedScenes.add(this.id);
    this.inventoryOpen = false;
    this.inventoryCursor = 0;
    if (this.pendingSpawn) {
      state.player.position = { ...this.pendingSpawn };
      this.pendingSpawn = undefined;
    } else {
      state.player.position = { ...this.config.spawn };
    }

    if (this.config.intro) {
      appendLog(state, this.config.intro);
    }

    this.renderOverlay({ state } as SceneContext);
  }

  public update(context: SceneContext, dt: number): void {
    if (this.battle) {
      this.battle.update(context.state, dt);
      this.renderBattleOverlay(context);
      return;
    }

    updatePlayerNeeds(context.state, dt);

    const movement = this.applyMovement(context.state.player.position, dt, 120);
    this.updatePlayerAnimation(movement, dt);
    this.animateCreatures(dt);
    this.checkEncounters(context);
    this.checkNeighbors(context);
    this.renderOverlay(context);
  }

  public render(context: SceneContext, ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawTileMap(ctx, this.map);
    this.drawCreatures(ctx);
    this.drawNPCs(ctx);
    this.drawTrainingStations(ctx);
    this.drawPlayer(context, ctx);
    this.renderOverlay(context);
  }

  public onKeyDown(context: SceneContext, event: KeyboardEvent): void {
    if (this.battle) {
      this.battle.handleInput(context.state, event);
      return;
    }

    if (this.inventoryOpen) {
      this.handleInventoryInput(context, event);
      return;
    }

    if (event.key === 'i' || event.key === 'I') {
      this.inventoryOpen = !this.inventoryOpen;
      this.inventoryCursor = 0;
      this.renderOverlay(context);
      return;
    }

    this.pressedKeys.add(event.key);

    if (event.key === 'Enter' || event.key === ' ') {
      if (this.tryInteractWithNPC(context)) {
        return;
      }
      if (this.tryUseTrainingStation(context)) {
        return;
      }
      this.tryStartBattle(context);
    }
  }

  public onKeyUp(_: SceneContext, event: KeyboardEvent): void {
    this.pressedKeys.delete(event.key);
  }

  private applyMovement(position: Point, dt: number, speed: number): { vx: number; vy: number } {
    const { vx, vy } = resolveMovementVector(this.pressedKeys);
    moveWithCollisions(this.map, position, vx, vy, speed, dt);
    return { vx, vy };
  }

  private updatePlayerAnimation(movement: { vx: number; vy: number }, dt: number): void {
    const moving = Math.abs(movement.vx) > 0 || Math.abs(movement.vy) > 0;
    if (moving) {
      if (Math.abs(movement.vx) > Math.abs(movement.vy)) {
        this.direction = movement.vx > 0 ? 'right' : 'left';
      } else {
        this.direction = movement.vy > 0 ? 'down' : 'up';
      }
      this.playerSprite.setAnimation(`walk-${this.direction}`);
    } else {
      this.playerSprite.setAnimation(`idle-${this.direction}`);
    }

    this.playerSprite.update(dt);
  }

  private animateCreatures(dt: number): void {
    this.creatures.forEach(creature => {
      creature.sprite.update(dt);
      if (creature.status === 'defeated') {
        creature.cooldown = Math.max(0, creature.cooldown - dt);
        if (creature.cooldown === 0 && creature.respawnTime) {
          creature.position = { ...creature.spawn };
          creature.status = 'idle';
        }
        return;
      }

      creature.oscillation += dt;
      const radius = creature.roamRadius ?? 12;
      creature.position.x = creature.spawn.x + Math.sin(creature.oscillation) * radius;
      creature.position.y = creature.spawn.y + Math.cos(creature.oscillation * 0.5) * (radius * 0.6);
    });
  }

  private checkEncounters(context: SceneContext): void {
    const { monster } = context.state.player;
    if (!monster) {
      return;
    }

    const { x, y } = context.state.player.position;
    const encounter = this.creatures.find(
      creature =>
        creature.status === 'idle' && Math.hypot(creature.position.x - x, creature.position.y - y) < 32
    );

    if (encounter) {
      this.startBattle(context, encounter);
    }
  }

  private tryStartBattle(context: SceneContext): void {
    if (this.battle) return;

    const { monster } = context.state.player;
    if (!monster) {
      appendLog(context.state, 'Vous devez choisir un compagnon avant de combattre.');
      return;
    }

    const { x, y } = context.state.player.position;
    const encounter = this.creatures.find(
      creature =>
        creature.status === 'idle' && Math.hypot(creature.position.x - x, creature.position.y - y) < 36
    );

    if (encounter) {
      this.startBattle(context, encounter);
    }
  }

  private startBattle(context: SceneContext, creature: AdventureCreature): void {
    const playerMonster = context.state.player.monster as MonsterInstance;
    this.battle = new BattleSystem(playerMonster, creature.id);
    this.activeCreature = creature;
    creature.status = 'battle';
    this.preBattlePosition = { ...context.state.player.position };
    this.battle.onComplete(outcome => this.handleBattleOutcome(context, outcome));
    appendLog(context.state, 'Le combat commence ! Utilisez ↑/↓ pour choisir une action.');
    this.renderBattleOverlay(context);
  }

  private handleBattleOutcome(context: SceneContext, outcome: BattleOutcome): void {
    const { state } = context;
    const creature = this.activeCreature;
    this.battle = undefined;
    this.activeCreature = undefined;

    if (!creature) {
      return;
    }

    if (outcome === 'victory') {
      creature.status = 'defeated';
      creature.cooldown = creature.respawnTime ?? 0;
      this.rewardVictory(state, creature);
    } else if (outcome === 'escape') {
      creature.status = 'idle';
      if (this.preBattlePosition) {
        state.player.position = { ...this.preBattlePosition };
      }
      appendLog(state, 'Vous prenez la fuite et retournez à un endroit sûr.');
    } else {
      creature.status = 'idle';
      appendLog(state, 'Votre partenaire est trop faible, retournez vous préparer.');
      state.player.position = { ...this.config.spawn };
    }

    this.preBattlePosition = undefined;
    this.renderOverlay(context);
  }

  private rewardVictory(state: GameState, creature: AdventureCreature): void {
    const { monster } = state.player;
    if (!monster) {
      return;
    }

    const logs = applyExperienceGain(monster, isBossCreature(creature) ? 4 : 2);
    logs.forEach(message => appendLog(state, message));

    creature.loot?.forEach(itemId => {
      addItemToInventory(state.player.inventory, itemId);
      const item = itemDefinitions[itemId];
      if (item) {
        appendLog(state, `${item.name} a été ajouté à votre inventaire.`);
      }
      if (itemId === 'dewPetal') {
        markQuestRequirement(state, 'riverOffering');
      }
    });

    if (creature.boss) {
      state.defeatedBosses.add(creature.id);
    }

    if (creature.questId) {
      if (creature.questId === 'twinFangs') {
        state.defeatedBosses.add(creature.id);
        if (state.defeatedBosses.has('azureAlpha') && state.defeatedBosses.has('azureOmega')) {
          markQuestRequirement(state, creature.questId);
        }
      } else {
        markQuestRequirement(state, creature.questId);
      }
    }
  }

  private drawCreatures(ctx: CanvasRenderingContext2D): void {
    this.creatures.forEach(creature => {
      if (creature.status === 'battle') {
        return;
      }

      if (creature.status === 'defeated') {
        ctx.fillStyle = 'rgba(190, 18, 60, 0.65)';
        ctx.beginPath();
        ctx.ellipse(creature.position.x, creature.position.y + 10, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        creature.sprite.setAnimation('defeated');
      } else {
        creature.sprite.setAnimation('idle');
      }

      creature.sprite.draw(ctx, creature.position.x, creature.position.y);

      if (creature.status === 'defeated') {
        ctx.save();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        const eyeOffset = 6;
        ctx.beginPath();
        ctx.moveTo(creature.position.x - eyeOffset - 3, creature.position.y - 10);
        ctx.lineTo(creature.position.x - eyeOffset + 3, creature.position.y - 4);
        ctx.moveTo(creature.position.x - eyeOffset + 3, creature.position.y - 10);
        ctx.lineTo(creature.position.x - eyeOffset - 3, creature.position.y - 4);
        ctx.moveTo(creature.position.x + eyeOffset - 3, creature.position.y - 10);
        ctx.lineTo(creature.position.x + eyeOffset + 3, creature.position.y - 4);
        ctx.moveTo(creature.position.x + eyeOffset + 3, creature.position.y - 10);
        ctx.lineTo(creature.position.x + eyeOffset - 3, creature.position.y - 4);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  private drawNPCs(ctx: CanvasRenderingContext2D): void {
    this.npcs.forEach(npc => {
      const position = npc.position;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(position.x - 12, position.y - 26, 24, 26);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(position.x - 10, position.y - 14, 20, 10);
      drawCompanionEmote(ctx, position.x, position.y - 34);
    });
  }

  private drawTrainingStations(ctx: CanvasRenderingContext2D): void {
    this.training.forEach(station => {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(station.position.x - 16, station.position.y - 8, 32, 16);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(station.position.x - 10, station.position.y - 14, 20, 6);
    });
  }

  private drawPlayer({ state }: SceneContext, ctx: CanvasRenderingContext2D): void {
    const { x, y } = state.player.position;
    this.playerSprite.draw(ctx, x, y, this.direction === 'left');
  }

  private checkNeighbors(context: SceneContext): void {
    const { position } = context.state.player;
    const threshold = TILE_SIZE * 0.9;

    if (position.x < threshold && this.neighbors.has('west')) {
      this.moveToNeighbor(context, 'west');
    }

    const mapWidth = this.map[0]?.length ?? 0;
    const mapHeight = this.map.length;
    const canvasWidth = mapWidth * TILE_SIZE;
    const canvasHeight = mapHeight * TILE_SIZE;

    if (position.x > canvasWidth - threshold && this.neighbors.has('east')) {
      this.moveToNeighbor(context, 'east');
    }
    if (position.y < threshold && this.neighbors.has('north')) {
      this.moveToNeighbor(context, 'north');
    }
    if (position.y > canvasHeight - threshold && this.neighbors.has('south')) {
      this.moveToNeighbor(context, 'south');
    }
  }

  private moveToNeighbor(context: SceneContext, direction: NeighborDirection): void {
    const neighbor = this.neighbors.get(direction);
    if (!neighbor) {
      return;
    }

    neighbor.target.setSpawn(neighbor.spawn);
    appendLog(context.state, neighbor.message);
    context.engine.switchScene(neighbor.target);
  }

  private renderOverlay({ overlay, state }: SceneContext): void {
    if (this.battle) {
      this.renderBattleOverlay({ overlay, state } as SceneContext);
      return;
    }

    if (this.inventoryOpen) {
      this.renderInventoryOverlay({ overlay, state } as SceneContext);
      return;
    }

    const hunger = renderHungerBar(state.player.needs.hunger, state.player.needs.maxHunger);
    const quests = this.buildQuestEntries(state);
    const questMarkup = quests.length
      ? `<div class="panel-title">Quêtes</div>${renderQuestList(quests)}`
      : '<div class="muted">Aucune quête en cours.</div>';

    const tile = getTileAt(this.map, state.player.position.x, state.player.position.y);
    const terrain =
      tile === 'p'
        ? 'Sentier'
        : tile === 'g'
        ? 'Prairie'
        : tile === 's'
        ? 'Pierre froide'
        : tile === 'r'
        ? 'Rivière'
        : 'Terrain';

    const info = `
      <strong>${escapeHtml(this.config.name)}</strong><br />
      Terrain : ${terrain}<br />
      Compagnon : ${state.player.monster ? state.player.monster.definition.name : 'Aucun'}
    `;

    const markup = [
      wrapPanel('info-panel', info + hunger),
      wrapPanel('quests-panel', questMarkup),
      wrapPanel('log', renderLog(state.log))
    ].join('');

    overlay.render(OverlayMode.Default, markup);
  }

  private renderInventoryOverlay({ overlay, state }: SceneContext): void {
    const markupEntries = state.player.inventory
      .map((entry, index) => {
        const item = itemDefinitions[entry.id];
        const active = index === this.inventoryCursor;
        return `
          <div class="inventory-row${active ? ' active' : ''}">
            <div>
              <strong>${escapeHtml(item?.name ?? entry.id)}</strong>
              <div class="muted">${escapeHtml(item?.description ?? 'Objet inconnu.')}</div>
            </div>
            <span>x${entry.quantity}</span>
          </div>
        `;
      })
      .join('');

    const markup = `
      <div class="panel-title">Inventaire</div>
      ${markupEntries || '<div class="muted">Inventaire vide.</div>'}
      <div class="hint">Entrée pour utiliser, I pour fermer</div>
    `;

    overlay.render(
      OverlayMode.Inventory,
      [wrapPanel('inventory-panel', markup), wrapPanel('log', renderLog(state.log))].join('')
    );
  }

  private renderBattleOverlay(context: SceneContext): void {
    const { overlay } = context;
    const menu = this.buildBattleMenu();
    const log = this.battle?.getLog() ?? [];
    const player = this.battle?.getPlayer();
    const enemy = this.battle?.getEnemy();

    const markup = `
      <div class="battle-panel">
        <div class="battle-stage">
          <div class="monster-slot player">
            <div class="status-card">
              <strong>${player?.monster.definition.name ?? '---'}</strong>
              <div>PV ${player?.hp ?? 0}/${player?.maxHp ?? 0}</div>
            </div>
          </div>
          <div class="monster-slot enemy">
            <div class="status-card">
              <strong>${enemy?.monster.definition.name ?? '---'}</strong>
              <div>PV ${enemy?.hp ?? 0}/${enemy?.maxHp ?? 0}</div>
            </div>
          </div>
        </div>
        <div class="battle-menu">${menu}</div>
      </div>
    `;

    overlay.render(
      OverlayMode.Battle,
      [markup, wrapPanel('log', renderLog(log))].join('')
    );
  }

  private buildBattleMenu(): string {
    if (!this.battle) {
      return '';
    }
    const options = this.battle.getMenuOptions();
    const cursor = this.battle.getCursor();
    return options
      .map((option, index) => {
        const isActive = index === cursor;
        if (option.kind === 'attack') {
          return `<div class="menu-option${isActive ? ' active' : ''}">${escapeHtml(option.attack.name)}</div>`;
        }
        return `<div class="menu-option${isActive ? ' active' : ''}">Fuite</div>`;
      })
      .join('');
  }

  private buildQuestEntries(state: GameState): QuestEntryView[] {
    return state.quests.map(progress => {
      const quest = questDefinitions[progress.id];
      if (!quest) {
        return {
          title: progress.id,
          status: progress.status,
          description: 'Quest inconnue.'
        };
      }

      const statusLabel =
        progress.status === 'completed'
          ? 'terminée'
          : progress.requirementMet
          ? 'objectif atteint'
          : progress.status === 'active'
          ? 'en cours'
          : 'disponible';

      return {
        title: quest.title,
        status: progress.status,
        description: `${quest.description} (${statusLabel})`
      };
    });
  }

  private handleInventoryInput(context: SceneContext, event: KeyboardEvent): void {
    const { state } = context;
    const inventory = state.player.inventory;
    if (!inventory.length) {
      if (event.key === 'Escape' || event.key === 'i' || event.key === 'I') {
        this.inventoryOpen = false;
        this.renderOverlay(context);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      this.inventoryCursor = (this.inventoryCursor - 1 + inventory.length) % inventory.length;
      this.renderOverlay(context);
    } else if (event.key === 'ArrowDown') {
      this.inventoryCursor = (this.inventoryCursor + 1) % inventory.length;
      this.renderOverlay(context);
    } else if (event.key === 'Enter' || event.key === ' ') {
      const entry = inventory[this.inventoryCursor];
      if (entry) {
        this.useInventoryItem(context, entry.id);
      }
    } else if (event.key === 'Escape' || event.key === 'i' || event.key === 'I') {
      this.inventoryOpen = false;
      this.renderOverlay(context);
    }
  }

  private useInventoryItem(context: SceneContext, itemId: string): void {
    const { state } = context;
    const item = itemDefinitions[itemId];
    if (!item) {
      appendLog(state, "Cet objet semble inutilisable.");
      return;
    }

    if (item.kind === 'food') {
      if (feedWithItem(state, itemId)) {
        this.renderOverlay(context);
      } else {
        appendLog(state, 'Vous ne possédez pas cet objet.');
      }
    } else if (item.kind === 'boost' && state.player.monster) {
      if (!removeItemFromInventory(state.player.inventory, itemId)) {
        appendLog(state, 'Vous ne possédez pas cet objet.');
        return;
      }
      const boosts = item.statBoost ?? {};
      Object.entries(boosts).forEach(([stat, value]) => {
        (state.player.monster as MonsterInstance).stats[stat as keyof Stats] += value ?? 0;
      });
      appendLog(state, `${item.name} renforce temporairement votre compagnon.`);
    } else {
      appendLog(state, "Cet objet ne peut pas être utilisé directement.");
    }

    this.renderOverlay(context);
  }

  private tryInteractWithNPC(context: SceneContext): boolean {
    const { state } = context;
    const { x, y } = state.player.position;
    const npc = this.npcs.find(candidate => Math.hypot(candidate.position.x - x, candidate.position.y - y) < 40);
    if (!npc) {
      return false;
    }

    npc.dialogue.forEach(line => appendLog(state, line));

    if (npc.questId) {
      const quest = questDefinitions[npc.questId];
      const progress = getQuestProgress(state, npc.questId);
      if (!quest) {
        return true;
      }

      if ((npc.role ?? 'giver') === 'giver' && progress.status === 'available') {
        activateQuest(state, npc.questId);
        appendLog(state, `Quête reçue : ${quest.title}`);
      } else if ((npc.role ?? 'giver') === 'turnin') {
        if (progress.status === 'available') {
          activateQuest(state, npc.questId);
          appendLog(state, `Quête reçue : ${quest.title}`);
        }
        if (quest.type === 'delivery' && progress.requirementMet) {
          this.resolveQuestReward(state, npc.questId);
        } else if (quest.type === 'delivery' && !progress.requirementMet) {
          const requiredItem = itemDefinitions[quest.targetId];
          if (removeItemFromInventory(state.player.inventory, quest.targetId)) {
            markQuestRequirement(state, npc.questId);
            appendLog(state, `${requiredItem?.name ?? quest.targetId} remis.`);
            this.resolveQuestReward(state, npc.questId);
          } else {
            appendLog(state, 'Il vous manque encore l objet demandé.');
          }
        } else if (progress.requirementMet && progress.status === 'active') {
          this.resolveQuestReward(state, npc.questId);
        } else {
          appendLog(state, 'Revenez lorsque vous aurez accompli la tâche.');
        }
      }
    }

    return true;
  }

  private resolveQuestReward(state: GameState, questId: string): void {
    const quest = questDefinitions[questId];
    if (!quest) {
      return;
    }

    completeQuest(state, questId);
    appendLog(state, `Quête terminée : ${quest.title}`);

    if (quest.reward.itemId) {
      addItemToInventory(state.player.inventory, quest.reward.itemId);
      const item = itemDefinitions[quest.reward.itemId];
      if (item) {
        appendLog(state, `${item.name} ajouté à votre inventaire.`);
      }
    }

    if (quest.reward.hungerRestore) {
      state.player.needs.hunger = Math.min(
        state.player.needs.maxHunger,
        state.player.needs.hunger + quest.reward.hungerRestore
      );
      appendLog(state, 'Votre compagnon est revigoré.');
    }

    if (quest.reward.stats && state.player.monster) {
      Object.entries(quest.reward.stats).forEach(([key, value]) => {
        if (value) {
          state.player.monster!.stats[key as keyof Stats] += value;
        }
      });
      appendLog(state, 'Vos statistiques augmentent grâce à la récompense.');
    }
  }

  private tryUseTrainingStation(context: SceneContext): boolean {
    const station = this.training.find(training => {
      const dx = training.position.x - context.state.player.position.x;
      const dy = training.position.y - context.state.player.position.y;
      return Math.hypot(dx, dy) < 40;
    });

    if (!station) {
      return false;
    }

    const { state } = context;
    const { monster } = state.player;
    if (!monster) {
      appendLog(state, 'Vous avez besoin d un compagnon pour vous entraîner.');
      return true;
    }

    if (state.player.needs.hunger < station.hungerCost) {
      appendLog(state, 'Votre partenaire a trop faim pour continuer.');
      return true;
    }

    state.player.needs.hunger = Math.max(0, state.player.needs.hunger - station.hungerCost);
    monster.stats[station.stat] += station.reward;
    appendLog(
      state,
      `Séance d entraînement réussie ! ${TRAINING_MESSAGES[station.stat]} augmente de ${station.reward}.`
    );

    return true;
  }

}
