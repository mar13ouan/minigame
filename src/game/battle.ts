import {
  applyExperienceGain,
  createMonsterInstance,
  type AttackDefinition,
  type MonsterInstance
} from './monsters';
import { appendLog, type GameState } from './state';

export type BattleLog = string[];

const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

type BattlePhase = 'intro' | 'player-turn' | 'enemy-turn' | 'victory' | 'defeat';

export class BattleSystem {
  private player: MonsterInstance;
  private enemy: MonsterInstance;
  private playerHp: number;
  private enemyHp: number;
  private phase: BattlePhase = 'intro';
  private cursor: number = 0;
  private log: BattleLog = [];
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
    this.playerHp = this.computeMaxHp(this.player);
    this.enemyHp = this.computeMaxHp(this.enemy);
    this.log.push(`Un ${this.enemy.definition.name} sauvage apparaît !`);
  }

  public onVictory(handler: () => void) {
    this.victoryHandler = handler;
  }

  private computeMaxHp(monster: MonsterInstance) {
    return 12 + monster.stats.defense * 2;
  }

  public update(state: GameState, dt: number) {
    this.timer += dt;
    if (this.phase === 'intro' && this.timer > 1) {
      this.phase = 'player-turn';
      this.timer = 0;
      appendLog(state, 'À vous de jouer !');
    }
  }

  public getLog(): BattleLog {
    return this.log;
  }

  public getPhase() {
    return this.phase;
  }

  public getCursor() {
    return this.cursor;
  }

  public getPlayerAttacks(): AttackDefinition[] {
    return this.player.definition.attacks;
  }

  public getEnemy() {
    return { monster: this.enemy, hp: this.enemyHp, maxHp: this.computeMaxHp(this.enemy) };
  }

  public getPlayer() {
    return { monster: this.player, hp: this.playerHp, maxHp: this.computeMaxHp(this.player) };
  }

  public getAnimations() {
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

  public handleInput(state: GameState, event: KeyboardEvent) {
    if (this.phase !== 'player-turn') return;
    const attacks = this.getPlayerAttacks();
    if (attacks.length === 0) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      this.cursor = (this.cursor - 1 + attacks.length) % attacks.length;
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      this.cursor = (this.cursor + 1) % attacks.length;
    } else if (event.key === 'Enter' || event.key === ' ') {
      const selectedAttack = attacks[this.cursor];
      this.performPlayerAttack(state, selectedAttack);
    }
  }

  private performPlayerAttack(state: GameState, attack: AttackDefinition) {
    this.lastPlayerAttack = attack;
    this.playerAttackToken++;
    const success = Math.random() <= attack.successRate;
    if (success) {
      const damage = attack.damage;
      this.enemyHp = Math.max(0, this.enemyHp - damage);
      appendLog(state, `${this.player.definition.name} utilise ${attack.name} et inflige ${damage} dégâts !`);
      this.log.push(`${this.player.definition.name} lance ${attack.name}!`);
      this.enemyHitToken++;
    } else {
      appendLog(state, `${this.player.definition.name} tente ${attack.name} mais échoue...`);
      this.log.push(`${this.player.definition.name} rate son attaque.`);
    }
    this.nextPhase(state);
  }

  private nextPhase(state: GameState) {
    if (this.enemyHp <= 0) {
      this.phase = 'victory';
      this.log.push('Victoire !');
      appendLog(state, `Victoire ! ${this.player.definition.name} remporte le combat.`);
      applyExperienceGain(this.player, 2).forEach(msg => appendLog(state, msg));
      this.victoryHandler?.();
      return;
    }
    this.phase = 'enemy-turn';
    setTimeout(() => this.enemyAttack(state), 400);
  }

  private enemyAttack(state: GameState) {
    if (this.phase !== 'enemy-turn') return;
    const attack = this.enemy.definition.attacks[randomBetween(0, this.enemy.definition.attacks.length - 1)];
    this.lastEnemyAttack = attack;
    this.enemyAttackToken++;
    const success = Math.random() <= attack.successRate;
    if (success) {
      const damage = attack.damage;
      this.playerHp = Math.max(0, this.playerHp - damage);
      appendLog(state, `${this.enemy.definition.name} utilise ${attack.name} et inflige ${damage} dégâts !`);
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
