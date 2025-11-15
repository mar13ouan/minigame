import { BattleSystem, type BattleOutcome, type BattleMenuOption } from '../battle/system';
import type { Scene, SceneContext } from '../core/engine';
import { drawCompanionEmote, drawMonsterSprite, drawPlayerSprite } from '../rendering/sprites';
import type { MonsterInstance } from '../monsters';
import { appendLog } from '../state';
import { renderLog, wrapPanel, escapeHtml } from '../ui/templates';
import { moveWithCollisions } from '../world/movement';
import type { Point } from '../world/coordinates';
import { TILE_SIZE } from '../world/constants';
import type { TileMap } from '../world/tiles';
import { drawTileMap } from '../world/tiles';
import { resolveMovementVector } from './input';
import { getInventoryEntries, useItem, type ItemId, addItem } from '../items';
import { getQuestSummaries, markEnemyDefeatedForQuests } from '../quests';

export type EncounterDefinition = {
  id: string;
  monsterId: string;
  spawn: Point;
  roamRadius?: number;
  boss?: boolean;
  dropItem?: ItemId;
  respawn?: number;
};

export type FieldTransition = {
  edge: 'left' | 'right' | 'top' | 'bottom';
  target: Scene;
  spawn: Point;
  unlockId?: string;
  lockedMessage?: string;
  logMessage?: string;
};

export type FieldSceneConfig = {
  id: string;
  name: string;
  map: TileMap;
  spawn: Point;
  entryLog: string;
  encounters: EncounterDefinition[];
  renderDecor?: (ctx: CanvasRenderingContext2D) => void;
};

type EncounterState = {
  def: EncounterDefinition;
  base: Point;
  position: Point;
  oscillation: number;
  status: 'idle' | 'defeated';
  cooldown: number;
};

type HungerState = {
  warningIssued: boolean;
  starvationTimer: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const enum MenuMode {
  None,
  Inventory
}

export class FieldScene implements Scene {
  public readonly id: string;

  private readonly name: string;
  private readonly map: TileMap;
  private readonly encounters: EncounterState[];
  private readonly renderDecor?: (ctx: CanvasRenderingContext2D) => void;

  private transitions: FieldTransition[] = [];
  private pressedKeys = new Set<string>();
  private spawn: Point;
  private battle?: BattleSystem;
  private activeEncounter?: EncounterState;
  private preBattlePosition?: Point;
  private visited = false;
  private menuMode: MenuMode = MenuMode.None;
  private animationClock = 0;
  private playerDirection: 'down' | 'up' | 'left' | 'right' = 'down';
  private hungerState: HungerState = { warningIssued: false, starvationTimer: 0 };
  private companionReminder = false;

  constructor(private readonly config: FieldSceneConfig) {
    this.id = config.id;
    this.name = config.name;
    this.map = config.map;
    this.spawn = { ...config.spawn };
    this.renderDecor = config.renderDecor;
    this.encounters = config.encounters.map(def => ({
      def,
      base: { ...def.spawn },
      position: { ...def.spawn },
      oscillation: Math.random() * Math.PI * 2,
      status: 'idle',
      cooldown: 0
    }));
  }

  public setTransitions(transitions: FieldTransition[]): void {
    this.transitions = transitions;
  }

  public setSpawn(position: Point): void {
    this.spawn = { ...position };
  }

  public enter({ state }: SceneContext): void {
    state.scene = this.id;
    state.player.position = { ...this.spawn };
    this.companionReminder = false;
    if (!this.visited) {
      appendLog(state, this.config.entryLog);
      this.visited = true;
    }
  }

  public update(context: SceneContext, dt: number): void {
    this.animationClock += dt;
    this.applyHunger(context.state, dt);

    if (this.battle) {
      this.battle.update(context.state, dt);
      return;
    }

    this.applyMovement(context, dt, 120);
    this.animateEncounters(dt);
    this.checkEncounters(context);
    this.checkTransitions(context);
  }

  public render(context: SceneContext, ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawTileMap(ctx, this.map);
    this.renderDecor?.(ctx);
    this.drawEncounters(ctx);
    this.drawPlayer(context, ctx);
    this.renderOverlay(context);
  }

  public onKeyDown(context: SceneContext, event: KeyboardEvent): void {
    if (this.battle) {
      this.battle.handleInput(context.state, event);
      return;
    }

    if (this.menuMode === MenuMode.Inventory) {
      this.handleInventoryInput(context, event);
      return;
    }

    if (event.key === 'i' || event.key === 'I' || event.key === 'Tab') {
      this.toggleInventoryMenu();
      return;
    }

    this.pressedKeys.add(event.key);
  }

  public onKeyUp(_: SceneContext, event: KeyboardEvent): void {
    this.pressedKeys.delete(event.key);
  }

  private toggleInventoryMenu(): void {
    this.menuMode = this.menuMode === MenuMode.Inventory ? MenuMode.None : MenuMode.Inventory;
  }

  private handleInventoryInput(context: SceneContext, event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'i' || event.key === 'I' || event.key === 'Tab') {
      this.menuMode = MenuMode.None;
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
    if (!result.success) {
      return;
    }

    if (context.state.player.hunger > 75) {
      this.hungerState.warningIssued = false;
    }

    this.menuMode = MenuMode.None;
  }

  private applyMovement(context: SceneContext, dt: number, speed: number): void {
    const { vx, vy } = resolveMovementVector(this.pressedKeys);
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.playerDirection = vx > 0 ? 'right' : 'left';
      } else {
        this.playerDirection = vy > 0 ? 'down' : 'up';
      }
    }
    moveWithCollisions(this.map, context.state.player.position, vx, vy, speed, dt);
  }

  private animateEncounters(dt: number): void {
    this.encounters.forEach(encounter => {
      encounter.cooldown = Math.max(0, encounter.cooldown - dt);
      if (encounter.status === 'defeated') {
        return;
      }
      encounter.oscillation += dt;
      const amplitude = encounter.def.roamRadius ?? 6;
      encounter.position.x = encounter.base.x + Math.sin(encounter.oscillation) * amplitude;
      encounter.position.y = encounter.base.y + Math.cos(encounter.oscillation * 0.5) * (amplitude * 0.6);
    });
  }

  private checkEncounters(context: SceneContext): void {
    const { monster } = context.state.player;
    if (!monster) {
      return;
    }

    const { x, y } = context.state.player.position;
    const encounter = this.encounters.find(candidate => {
      if (candidate.status !== 'idle') return false;
      if (candidate.cooldown > 0) return false;
      return Math.hypot(candidate.position.x - x, candidate.position.y - y) < 36;
    });

    if (encounter) {
      this.startBattle(context, encounter);
    }
  }

  private checkTransitions(context: SceneContext): void {
    const { position } = context.state.player;
    const mapWidth = (this.map[0]?.length ?? 0) * TILE_SIZE;
    const mapHeight = this.map.length * TILE_SIZE;

    for (const transition of this.transitions) {
      let shouldTrigger = false;
      switch (transition.edge) {
        case 'left':
          shouldTrigger = position.x < TILE_SIZE * 0.6;
          break;
        case 'right':
          shouldTrigger = position.x > mapWidth - TILE_SIZE * 0.6;
          break;
        case 'top':
          shouldTrigger = position.y < TILE_SIZE * 0.6;
          break;
        case 'bottom':
          shouldTrigger = position.y > mapHeight - TILE_SIZE * 0.6;
          break;
      }

      if (!shouldTrigger) {
        continue;
      }

      if (transition.unlockId && !context.state.unlockedScenes.has(transition.unlockId)) {
        if (transition.lockedMessage) {
          appendLog(context.state, transition.lockedMessage);
        }
        continue;
      }

      if (transition.logMessage) {
        appendLog(context.state, transition.logMessage);
      }

      const targetWithSpawn = transition.target as Scene & { setSpawn?: (point: Point) => void };
      targetWithSpawn.setSpawn?.({ ...transition.spawn });
      context.engine.switchScene(transition.target);
      return;
    }
  }

  private startBattle(context: SceneContext, encounter: EncounterState): void {
    const playerMonster = context.state.player.monster as MonsterInstance;
    this.battle = new BattleSystem(playerMonster, encounter.def.monsterId);
    this.activeEncounter = encounter;
    this.preBattlePosition = { ...context.state.player.position };
    this.battle.onComplete(outcome => this.handleBattleOutcome(context, outcome));
    appendLog(
      context.state,
      `Un ${encounter.def.monsterId} surgit ! Utilisez ↑/↓ pour choisir une action et Entrée pour confirmer.`
    );
  }

  private handleBattleOutcome(context: SceneContext, outcome: BattleOutcome): void {
    const { state } = context;
    const encounter = this.activeEncounter;
    this.battle = undefined;
    this.activeEncounter = undefined;

    if (!encounter) {
      this.preBattlePosition = undefined;
      return;
    }

    if (outcome === 'victory') {
      encounter.status = 'defeated';
      appendLog(state, `${encounter.def.monsterId} s effondre dans une mare écarlate.`);
      if (encounter.def.dropItem) {
        addItem(state, encounter.def.dropItem, 1);
        appendLog(state, `Vous récupérez ${encounter.def.dropItem.replace('-', ' ')}.`);
      }
      markEnemyDefeatedForQuests(state, encounter.def.monsterId);
    } else if (outcome === 'defeat') {
      encounter.cooldown = encounter.def.respawn ?? 8;
      appendLog(state, 'Vous êtes repoussé et regagnez le village pour reprendre des forces.');
      state.player.position = { ...this.spawn };
    } else {
      encounter.cooldown = 5;
      this.retreatFromEncounter(state);
    }

    this.preBattlePosition = undefined;
  }

  private retreatFromEncounter(state: SceneContext['state']): void {
    if (!this.preBattlePosition) {
      return;
    }

    state.player.position = { ...this.preBattlePosition };
  }

  private drawEncounters(ctx: CanvasRenderingContext2D): void {
    this.encounters.forEach(encounter => {
      const variant =
        encounter.status === 'defeated' ? 'defeated' : encounter.def.boss ? 'boss' : 'default';
      drawMonsterSprite(
        ctx,
        encounter.position.x,
        encounter.position.y,
        undefined,
        variant,
        this.animationClock
      );
    });
  }

  private drawPlayer({ state }: SceneContext, ctx: CanvasRenderingContext2D): void {
    const { x, y } = state.player.position;
    const frame = Math.floor(this.animationClock * 8) % 4;
    drawPlayerSprite(ctx, x, y, this.playerDirection, frame);
    if (state.player.monster) {
      drawCompanionEmote(ctx, x - 28, y - 6);
    }
  }

  private renderOverlay(context: SceneContext): void {
    const { overlay, state } = context;
    const playerMonster = state.player.monster;
    const logMarkup = renderLog(state.log);

    if (this.battle) {
      overlay.render('battle', this.buildBattleOverlay(state.log));
      return;
    }

    if (this.menuMode === MenuMode.Inventory) {
      overlay.render('menu', this.buildInventoryMenu(state));
      return;
    }

    const hunger = Math.round(state.player.hunger);
    const info = `
      <strong>${escapeHtml(this.name)}</strong><br />
      Faim : ${hunger}/100 · Or : ${state.player.gold} · Quêtes actives : ${
        getQuestSummaries(state).filter(q => q.status === 'active').length
      }
    `;

    const questSummary = getQuestSummaries(state)
      .map(
        quest =>
          `<div class="quest-line ${quest.status}"><span>${escapeHtml(quest.title)}</span><em>${escapeHtml(
            quest.objective
          )}</em></div>`
      )
      .join('');

    const questPanel = wrapPanel('quest-panel', questSummary || '<em>Aucune quête.</em>');
    const infoPanel = wrapPanel('info-panel', info);

    overlay.render('default', [infoPanel, questPanel, wrapPanel('log', logMarkup)].join(''));

    if (!playerMonster && !this.companionReminder) {
      appendLog(state, 'Recrutez un compagnon au sanctuaire du départ.');
      this.companionReminder = true;
    }
  }

  private buildInventoryMenu(state: SceneContext['state']): string {
    const entries = getInventoryEntries(state.player.inventory);
    const itemsMarkup = entries
      .map((entry, index) => {
        const shortcut = index + 1;
        return `
          <div class="menu-item">
            <span class="menu-shortcut">${shortcut}</span>
            <span class="menu-name">${escapeHtml(entry.definition.name)}</span>
            <span class="menu-qty">×${entry.quantity}</span>
            <div class="menu-details">${escapeHtml(entry.definition.description)}</div>
          </div>
        `;
      })
      .join('');

    const empty = '<em>Vous ne possédez aucun objet.</em>';
    const header = '<strong>Inventaire</strong><br /><small>Appuyez sur le chiffre associé pour utiliser un objet.</small>';

    return wrapPanel('inventory-panel', `${header}${itemsMarkup || empty}`);
  }

  private buildBattleOverlay(log: string[]): string {
    if (!this.battle) {
      return '';
    }

    const enemy = this.battle.getEnemy();
    const player = this.battle.getPlayer();
    const options = this.battle.getMenuOptions();
    const cursor = this.battle.getCursor();
    const animations = this.battle.getAnimations();

    const attackMenu = options
      .map((option: BattleMenuOption, index) => {
        const classes = ['menu-item', index === cursor ? 'active' : ''].filter(Boolean).join(' ');
        const chance =
          option.kind === 'attack'
            ? `${Math.round(option.attack.successRate * 100)}%`
            : option.hint;
        const details =
          option.kind === 'attack'
            ? `${option.attack.damage} dégâts · ${option.attack.description}`
            : option.details;
        const name = option.kind === 'attack' ? option.attack.name : option.label;
        return `
          <div class="${classes}">
            <div class="menu-header">
              <span class="menu-name">${escapeHtml(name)}</span>
              <span class="menu-chance">${escapeHtml(chance)}</span>
            </div>
            <div class="menu-details">${escapeHtml(details)}</div>
          </div>
        `;
      })
      .join('');

    const battlePanel = `
      <div class="panel battle-panel">
        <div class="battle-stage">
          <div class="monster-slot enemy" data-attack-token="${animations.enemyAttack}" data-hit-token="${animations.enemyHit}">
            <div class="status-card">
              <div class="status-header">
                <span class="name">${escapeHtml(enemy.monster.definition.name)}</span>
                <span class="level">Nv. ${enemy.monster.stats.level}</span>
              </div>
              <div class="hp-bar"><span style="width:${(enemy.hp / enemy.maxHp) * 100}%"></span></div>
              <div class="hp-values">${enemy.hp}/${enemy.maxHp} PV</div>
            </div>
            <div class="sprite-wrapper">
              <div class="platform"></div>
              <div class="sprite-chassis">
                <div class="sprite"></div>
              </div>
            </div>
          </div>
          <div class="monster-slot player" data-attack-token="${animations.playerAttack}" data-hit-token="${animations.playerHit}">
            <div class="sprite-wrapper">
              <div class="platform"></div>
              <div class="sprite-chassis">
                <div class="sprite"></div>
              </div>
            </div>
            <div class="status-card">
              <div class="status-header">
                <span class="name">${escapeHtml(player.monster.definition.name)}</span>
                <span class="level">Nv. ${player.monster.stats.level}</span>
              </div>
              <div class="hp-bar"><span style="width:${(player.hp / player.maxHp) * 100}%"></span></div>
              <div class="hp-values">${player.hp}/${player.maxHp} PV</div>
            </div>
          </div>
        </div>
        <div class="battle-menu">${attackMenu}</div>
      </div>
    `;

    return [battlePanel, wrapPanel('log', renderLog(log))].join('');
  }

  private applyHunger(state: SceneContext['state'], dt: number): void {
    state.elapsed += dt;
    state.player.hunger = clamp(state.player.hunger - dt * 1.2, 0, 100);

    if (!this.hungerState.warningIssued && state.player.hunger <= 35) {
      appendLog(state, 'Votre compagnon commence à avoir faim. Ouvrez le menu Items (I) pour le nourrir.');
      this.hungerState.warningIssued = true;
    }

    if (state.player.hunger <= 0 && state.player.monster) {
      this.hungerState.starvationTimer += dt;
      if (this.hungerState.starvationTimer > 6) {
        this.hungerState.starvationTimer = 0;
        state.player.monster.stats.morale = Math.max(1, state.player.monster.stats.morale - 1);
        appendLog(state, `${state.player.monster.definition.name} souffre de la faim et perd du moral !`);
      }
    } else {
      this.hungerState.starvationTimer = 0;
    }
  }
}
