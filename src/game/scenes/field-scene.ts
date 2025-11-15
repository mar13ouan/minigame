import { BattleSystem, type BattleMenuOption, type BattleOutcome } from '../battle/system';
import type { Scene, SceneContext } from '../core/engine';
import { drawCompanionEmote, drawMonsterSprite, drawPlayerSprite } from '../rendering/sprites';
import { drawFlower, drawStone } from '../rendering/decor';
import { monsterDefinitions, type MonsterInstance, type AttackAnimation } from '../monsters';
import { appendLog } from '../state';
import { renderLog, wrapPanel, escapeHtml } from '../ui/templates';
import { moveWithCollisions } from '../world/movement';
import { tileToPixel, type Point } from '../world/coordinates';
import { TILE_SIZE } from '../world/constants';
import { fieldMap } from '../world/maps';
import { drawTileMap } from '../world/tiles';
import { resolveMovementVector } from './input';

const enum OverlayMode {
  Default = 'default',
  Battle = 'battle'
}

type WildCreature = {
  id: string;
  base: Point;
  position: Point;
  oscillation: number;
  status: 'idle' | 'defeated';
  cooldown: number;
};

type BattleStyleInput = {
  side: 'player' | 'enemy';
  baseColor: string;
  animation: AttackAnimation | null;
};

const buildAttackStyle = ({ side, baseColor, animation }: BattleStyleInput): string => {
  const direction = side === 'player' ? 1 : -1;
  const shouldMirror = animation?.mirror ?? true;
  const angle = animation?.angle ?? 0;
  const offset = animation?.offset ?? 0;
  const effectiveAngle = side === 'enemy' && shouldMirror ? -angle : angle;
  const effectiveOffset = side === 'enemy' && shouldMirror ? -offset : offset;

  const parts = [
    `--monster-color:${baseColor}`,
    `--attack-color:${animation?.color ?? baseColor}`,
    `--attack-secondary:${animation?.secondary ?? animation?.color ?? baseColor}`,
    `--attack-angle:${effectiveAngle}deg`,
    `--attack-offset:${effectiveOffset}px`,
    `--attack-rise:${animation?.rise ?? 0}px`,
    `--attack-spread:${animation?.spread ?? 1}`,
    `--attack-width:${animation?.width ?? 180}px`,
    `--attack-duration:${animation?.duration ?? 0.5}s`,
    `--attack-intensity:${animation?.intensity ?? 1}`,
    `--attack-direction:${direction}`
  ];

  return `${parts.join(';')};`;
};

export class FieldScene implements Scene {
  public readonly id = 'field';

  private readonly map = fieldMap;
  private readonly pressedKeys = new Set<string>();
  private spawn: Point = tileToPixel(2, 6);
  private battle?: BattleSystem;
  private activeEncounter?: WildCreature;
  private preBattlePosition?: Point;
  private returnScene?: Scene;
  private visited = false;

  private readonly wildCreatures: WildCreature[] = [
    {
      id: 'sproutle',
      base: tileToPixel(13, 4),
      position: { ...tileToPixel(13, 4) },
      oscillation: Math.random() * Math.PI * 2,
      status: 'idle',
      cooldown: 0
    },
    {
      id: 'flaruba',
      base: tileToPixel(15, 8),
      position: { ...tileToPixel(15, 8) },
      oscillation: Math.random() * Math.PI * 2,
      status: 'idle',
      cooldown: 0
    }
  ];

  public enter({ state }: SceneContext): void {
    state.scene = this.id;
    state.player.position = { ...this.spawn };
    if (!this.visited) {
      appendLog(state, 'Les Plaines Virescentes s’étendent à perte de vue.');
      this.visited = true;
    }
  }

  public update(context: SceneContext, dt: number): void {
    if (this.battle) {
      this.battle.update(context.state, dt);
      return;
    }

    this.applyMovement(context, dt, 120);
    this.animateWildCreatures(dt);
    this.checkEncounters(context);
  }

  public render(context: SceneContext, ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawTileMap(ctx, this.map);
    this.drawDecor(ctx);
    this.drawWildCreatures(ctx);
    this.drawPlayer(context, ctx);
    this.renderOverlay(context);
  }

  public onKeyDown(context: SceneContext, event: KeyboardEvent): void {
    if (this.battle) {
      this.battle.handleInput(context.state, event);
      return;
    }

    this.pressedKeys.add(event.key);
  }

  public onKeyUp(_: SceneContext, event: KeyboardEvent): void {
    this.pressedKeys.delete(event.key);
  }

  public setSpawn(position: Point): void {
    this.spawn = { ...position };
  }

  public setReturnScene(scene: Scene): void {
    this.returnScene = scene;
  }

  private applyMovement(context: SceneContext, dt: number, speed: number): void {
    const { vx, vy } = resolveMovementVector(this.pressedKeys);
    moveWithCollisions(this.map, context.state.player.position, vx, vy, speed, dt);

    if (context.state.player.position.x < TILE_SIZE * 0.9 && this.returnScene) {
      appendLog(context.state, 'Vous retournez au Village Émeraude.');
      context.engine.switchScene(this.returnScene);
    }
  }

  private animateWildCreatures(dt: number): void {
    this.wildCreatures.forEach(wild => {
      wild.cooldown = Math.max(0, wild.cooldown - dt);
      if (wild.status === 'defeated') {
        return;
      }
      wild.oscillation += dt;
      wild.position.x = wild.base.x + Math.sin(wild.oscillation) * 6;
      wild.position.y = wild.base.y + Math.cos(wild.oscillation * 0.5) * 4;
    });
  }

  private checkEncounters(context: SceneContext): void {
    const { state } = context;
    const { monster } = state.player;
    if (!monster) {
      return;
    }

    const { x, y } = state.player.position;
    const encounter = this.wildCreatures.find(
      wild =>
        wild.status === 'idle' &&
        wild.cooldown <= 0 &&
        Math.hypot(wild.position.x - x, wild.position.y - y) < 36
    );

    if (encounter) {
      this.startBattle(context, encounter);
    }
  }

  private startBattle(context: SceneContext, encounter: WildCreature): void {
    const playerMonster = context.state.player.monster as MonsterInstance;
    this.battle = new BattleSystem(playerMonster, encounter.id);
    this.activeEncounter = encounter;
    this.preBattlePosition = { ...context.state.player.position };
    this.battle.onComplete(outcome => this.handleBattleOutcome(context, outcome));
    appendLog(
      context.state,
      'Le combat commence ! Utilisez ↑/↓ pour choisir une attaque puis Entrée.'
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
      appendLog(state, 'La créature sauvage s’effondre dans une mare écarlate.');
    } else if (outcome === 'defeat') {
      encounter.cooldown = 5;
      appendLog(state, 'Vous êtes repoussé et retournez au campement pour reprendre des forces.');
      state.player.position = { ...this.spawn };
    } else {
      encounter.cooldown = 3;
      this.retreatFromEncounter(state);
    }

    this.preBattlePosition = undefined;
  }

  private retreatFromEncounter(state: SceneContext['state']): void {
    if (!this.preBattlePosition) {
      return;
    }

    const fallbackX = Math.max(TILE_SIZE, this.preBattlePosition.x - TILE_SIZE);
    state.player.position = { x: fallbackX, y: this.preBattlePosition.y };
  }

  private drawDecor(ctx: CanvasRenderingContext2D): void {
    const flowers: Array<{ position: Point; color: string }> = [
      { position: tileToPixel(6, 3), color: '#f472b6' },
      { position: tileToPixel(9, 5), color: '#facc15' },
      { position: tileToPixel(12, 8), color: '#34d399' },
      { position: tileToPixel(7, 7), color: '#a855f7' }
    ];
    flowers.forEach(({ position, color }) => drawFlower(ctx, position, color));

    const stones = [tileToPixel(10, 6), tileToPixel(11, 4), tileToPixel(4, 8)];
    stones.forEach(position => drawStone(ctx, position));
  }

  private drawWildCreatures(ctx: CanvasRenderingContext2D): void {
    this.wildCreatures.forEach(wild => {
      const definition = monsterDefinitions[wild.id];
      const variant = wild.status === 'defeated' ? 'defeated' : 'default';
      drawMonsterSprite(ctx, wild.position.x, wild.position.y, definition.color, variant);
    });
  }

  private drawPlayer({ state }: SceneContext, ctx: CanvasRenderingContext2D): void {
    const { x, y } = state.player.position;
    if (state.player.monster) {
      drawMonsterSprite(ctx, x - 26, y + 10, state.player.monster.definition.color);
    }
    drawPlayerSprite(ctx, x, y);
    if (state.player.monster) {
      drawCompanionEmote(ctx, x - 30, y - 6);
    }
  }

  private renderOverlay(context: SceneContext): void {
    const { overlay, state } = context;
    const playerMonster = state.player.monster;
    const logMarkup = renderLog(state.log);

    if (!playerMonster) {
      const info =
        '<strong>Choisissez un compagnon</strong><br />Approchez-vous d’une pierre brillante pour engager le combat.';
      overlay.render(
        OverlayMode.Default,
        [wrapPanel('info-panel', info), wrapPanel('log', logMarkup)].join('')
      );
      return;
    }

    if (this.battle) {
      overlay.render(OverlayMode.Battle, this.buildBattleOverlay(state.log));
      return;
    }

    const info = `
      <strong>Plaines Virescentes</strong><br />
      ${escapeHtml(playerMonster.definition.name)} est prêt pour le combat. Cherchez une créature scintillante pour engager une bataille.
    `;
    overlay.render(
      OverlayMode.Default,
      [wrapPanel('info-panel', info), wrapPanel('log', logMarkup)].join('')
    );
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

    const playerStyle = buildAttackStyle({
      side: 'player',
      baseColor: player.monster.definition.color,
      animation: animations.playerAnimation
    });
    const enemyStyle = buildAttackStyle({
      side: 'enemy',
      baseColor: enemy.monster.definition.color,
      animation: animations.enemyAnimation
    });

    const attackMenu = options
      .map((option: BattleMenuOption, index) => {
        const classes = ['menu-item', index === cursor ? 'active' : ''].filter(Boolean).join(' ');
        const chance =
          option.kind === 'attack'
            ? `${Math.round(option.attack.successRate * 100)}% réussite`
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
          <div
            class="monster-slot enemy"
            data-attack-token="${animations.enemyAttack}"
            data-hit-token="${animations.enemyHit}"
            data-attack-effect="${animations.enemyAnimation ? animations.enemyAnimation.effect : ''}"
            data-attack-id="${escapeHtml(animations.enemyAnimationId)}"
            style="${enemyStyle}"
          >
            <div class="status-card">
              <div class="status-header">
                <span class="name">${escapeHtml(enemy.monster.definition.name)}</span>
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
            data-attack-id="${escapeHtml(animations.playerAnimationId)}"
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
}
