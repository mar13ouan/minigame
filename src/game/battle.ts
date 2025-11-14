import { applyExperienceGain, createMonsterInstance, type MonsterInstance } from './monsters';
import { appendLog, type GameState } from './state';

export type BattleLog = string[];

const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

type BattlePhase = 'intro' | 'player-turn' | 'enemy-turn' | 'victory' | 'defeat';

type BattleAction = 'attack' | 'encourage';

export const actionLabels: Record<BattleAction, string> = {
  attack: 'Attaquer',
  encourage: 'Encourager'
};

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

  public getEnemy() {
    return { monster: this.enemy, hp: this.enemyHp, maxHp: this.computeMaxHp(this.enemy) };
  }

  public getPlayer() {
    return { monster: this.player, hp: this.playerHp, maxHp: this.computeMaxHp(this.player) };
  }

  public handleInput(state: GameState, event: KeyboardEvent) {
    if (this.phase !== 'player-turn') return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      this.cursor = (this.cursor + 1) % 2;
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      this.cursor = (this.cursor + 1) % 2;
    } else if (event.key === 'Enter' || event.key === ' ') {
      const action: BattleAction = this.cursor === 0 ? 'attack' : 'encourage';
      this.executeAction(state, action);
    }
  }

  private executeAction(state: GameState, action: BattleAction) {
    switch (action) {
      case 'attack':
        this.performAttack(state);
        break;
      case 'encourage':
        this.performEncourage(state);
        break;
    }
  }

  private performAttack(state: GameState) {
    const damage = Math.max(1, this.player.stats.power + randomBetween(-2, 2) - Math.floor(this.enemy.stats.defense / 2));
    this.enemyHp = Math.max(0, this.enemyHp - damage);
    appendLog(state, `${this.player.definition.name} attaque pour ${damage} dégâts !`);
    this.log.push(`${this.player.definition.name} attaque !`);
    this.nextPhase(state);
  }

  private performEncourage(state: GameState) {
    const moraleGain = randomBetween(1, 3);
    this.player.stats.morale += moraleGain;
    appendLog(state, `${this.player.definition.name} se motive (+${moraleGain} moral).`);
    this.log.push(`${this.player.definition.name} retrouve confiance.`);
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
    const damage = Math.max(1, this.enemy.stats.power + randomBetween(-1, 2) - Math.floor(this.player.stats.defense / 2));
    this.playerHp = Math.max(0, this.playerHp - damage);
    appendLog(state, `${this.enemy.definition.name} attaque pour ${damage} dégâts !`);
    this.log.push(`${this.enemy.definition.name} riposte.`);
    if (this.playerHp <= 0) {
      this.phase = 'defeat';
      appendLog(state, 'Vous avez été vaincu...');
      this.log.push('Défaite...');
      return;
    }
    this.phase = 'player-turn';
  }
}
