import {
  applyExperienceGain,
  createMonsterInstance,
  type AttackDefinition,
  type MonsterInstance
} from '../monsters';
import { appendLog, type GameState } from '../state';

export type BattlePhase = 'intro' | 'player-turn' | 'enemy-turn' | 'victory' | 'defeat';

const ENEMY_RESPONSE_DELAY_MS = 400;

const randomBetween = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

type CombatantSnapshot = {
  monster: MonsterInstance;
  hp: number;
  maxHp: number;
};

type BattleAnimations = {
  playerAttack: number;
  enemyAttack: number;
  playerHit: number;
  enemyHit: number;
  playerAnimation: AttackDefinition['animation'] | null;
  playerAnimationId: string;
  enemyAnimation: AttackDefinition['animation'] | null;
  enemyAnimationId: string;
};

export class BattleSystem {
  private readonly log: string[] = [];
  private readonly player: MonsterInstance;
  private readonly enemy: MonsterInstance;
  private playerHp: number;
  private enemyHp: number;
  private phase: BattlePhase = 'intro';
  private cursor = 0;
  private timer = 0;
  private victoryHandler?: () => void;
  private playerAttackToken = 0;
  private enemyAttackToken = 0;
  private playerHitToken = 0;
  private enemyHitToken = 0;
  private lastPlayerAttack?: AttackDefinition;
  private lastEnemyAttack?: AttackDefinition;

  constructor(player: MonsterInstance, enemyId: string) {
    this.player = player;
    this.enemy = createMonsterInstance(enemyId);
    this.playerHp = this.computeMaxHp(player);
    this.enemyHp = this.computeMaxHp(this.enemy);
    this.log.push(`Un ${this.enemy.definition.name} sauvage apparaît !`);
  }

  public onVictory(handler: () => void): void {
    this.victoryHandler = handler;
  }

  public update(state: GameState, dt: number): void {
    this.timer += dt;
    if (this.phase === 'intro' && this.timer > 1) {
      this.phase = 'player-turn';
      this.timer = 0;
      appendLog(state, 'À vous de jouer !');
    }
  }

  public handleInput(state: GameState, event: KeyboardEvent): void {
    if (this.phase !== 'player-turn') {
      return;
    }

    const attacks = this.getPlayerAttacks();
    if (attacks.length === 0) {
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      this.cursor = (this.cursor - 1 + attacks.length) % attacks.length;
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      this.cursor = (this.cursor + 1) % attacks.length;
    } else if (event.key === 'Enter' || event.key === ' ') {
      const selectedAttack = attacks[this.cursor];
      this.performPlayerAttack(state, selectedAttack);
    }
  }

  public getPhase(): BattlePhase {
    return this.phase;
  }

  public getCursor(): number {
    return this.cursor;
  }

  public getPlayerAttacks(): AttackDefinition[] {
    return this.player.definition.attacks;
  }

  public getLog(): string[] {
    return this.log;
  }

  public getPlayer(): CombatantSnapshot {
    const maxHp = this.computeMaxHp(this.player);
    return { monster: this.player, hp: this.playerHp, maxHp };
  }

  public getEnemy(): CombatantSnapshot {
    const maxHp = this.computeMaxHp(this.enemy);
    return { monster: this.enemy, hp: this.enemyHp, maxHp };
  }

  public getAnimations(): BattleAnimations {
    return {
      playerAttack: this.playerAttackToken,
      enemyAttack: this.enemyAttackToken,
      playerHit: this.playerHitToken,
      enemyHit: this.enemyHitToken,
      playerAnimation: this.lastPlayerAttack?.animation ?? null,
      playerAnimationId: this.lastPlayerAttack?.id ?? '',
      enemyAnimation: this.lastEnemyAttack?.animation ?? null,
      enemyAnimationId: this.lastEnemyAttack?.id ?? ''
    };
  }

  private computeMaxHp(monster: MonsterInstance): number {
    return 12 + monster.stats.defense * 2;
  }

  private performPlayerAttack(state: GameState, attack: AttackDefinition): void {
    this.lastPlayerAttack = attack;
    this.playerAttackToken++;
    const success = Math.random() <= attack.successRate;

    if (success) {
      this.enemyHp = Math.max(0, this.enemyHp - attack.damage);
      appendLog(
        state,
        `${this.player.definition.name} utilise ${attack.name} et inflige ${attack.damage} dégâts !`
      );
      this.log.push(`${this.player.definition.name} lance ${attack.name}!`);
      this.enemyHitToken++;
    } else {
      appendLog(state, `${this.player.definition.name} tente ${attack.name} mais échoue...`);
      this.log.push(`${this.player.definition.name} rate son attaque.`);
    }

    this.advanceFromPlayerTurn(state);
  }

  private advanceFromPlayerTurn(state: GameState): void {
    if (this.enemyHp <= 0) {
      this.phase = 'victory';
      this.log.push('Victoire !');
      appendLog(state, `Victoire ! ${this.player.definition.name} remporte le combat.`);
      applyExperienceGain(this.player, 2).forEach(message => appendLog(state, message));
      this.victoryHandler?.();
      return;
    }

    this.phase = 'enemy-turn';
    window.setTimeout(() => this.performEnemyAttack(state), ENEMY_RESPONSE_DELAY_MS);
  }

  private performEnemyAttack(state: GameState): void {
    if (this.phase !== 'enemy-turn') {
      return;
    }

    const attacks = this.enemy.definition.attacks;
    const attack = attacks[randomBetween(0, attacks.length - 1)];
    this.lastEnemyAttack = attack;
    this.enemyAttackToken++;
    const success = Math.random() <= attack.successRate;

    if (success) {
      this.playerHp = Math.max(0, this.playerHp - attack.damage);
      appendLog(
        state,
        `${this.enemy.definition.name} utilise ${attack.name} et inflige ${attack.damage} dégâts !`
      );
      this.log.push(`${this.enemy.definition.name} frappe avec ${attack.name}.`);
      this.playerHitToken++;
    } else {
      appendLog(state, `${this.enemy.definition.name} tente ${attack.name} mais échoue.`);
      this.log.push(`${this.enemy.definition.name} manque sa cible.`);
    }

    if (this.playerHp <= 0) {
      this.phase = 'defeat';
      appendLog(state, 'Vous avez été vaincu...');
      this.log.push('Défaite...');
      return;
    }

    this.phase = 'player-turn';
  }
}
