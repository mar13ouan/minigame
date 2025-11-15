import {
  applyExperienceGain,
  createMonsterInstance,
  type AttackDefinition,
  type MonsterInstance
} from '../monsters';
import { appendLog, type GameState } from '../state';

export type BattlePhase =
  | 'intro'
  | 'player-turn'
  | 'enemy-turn'
  | 'victory'
  | 'defeat'
  | 'escape';

export type BattleOutcome = 'victory' | 'defeat' | 'escape';

export type BattleMenuOption =
  | { kind: 'attack'; attack: AttackDefinition }
  | { kind: 'run'; label: string; hint: string; details: string };

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
  private completionHandler?: (outcome: BattleOutcome) => void;
  private playerAttackToken = 0;
  private enemyAttackToken = 0;
  private playerHitToken = 0;
  private enemyHitToken = 0;
  private lastPlayerAttack?: AttackDefinition;
  private lastEnemyAttack?: AttackDefinition;
  private resolved = false;

  constructor(player: MonsterInstance, enemyId: string) {
    this.player = player;
    this.enemy = createMonsterInstance(enemyId);
    this.playerHp = this.computeMaxHp(player);
    this.enemyHp = this.computeMaxHp(this.enemy);
    this.log.push(`Un ${this.enemy.definition.name} sauvage apparaît !`);
  }

  public onComplete(handler: (outcome: BattleOutcome) => void): void {
    this.completionHandler = handler;
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

    const options = this.getMenuOptions();
    if (options.length === 0) {
      return;
    }

    this.cursor = Math.min(this.cursor, options.length - 1);

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      this.cursor = (this.cursor - 1 + options.length) % options.length;
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      this.cursor = (this.cursor + 1) % options.length;
    } else if (event.key === 'Enter' || event.key === ' ') {
      const selectedOption = options[this.cursor];
      if (!selectedOption) {
        return;
      }

      if (selectedOption.kind === 'attack') {
        this.performPlayerAttack(state, selectedOption.attack);
      } else {
        this.attemptEscape(state);
      }
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

  public getMenuOptions(): BattleMenuOption[] {
    return [
      ...this.player.definition.attacks.map(attack => ({ kind: 'attack', attack } as BattleMenuOption)),
      {
        kind: 'run',
        label: 'Fuite',
        hint: 'Se retirer',
        details: 'Quitter le combat et battre en retraite.'
      }
    ];
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

  private attemptEscape(state: GameState): void {
    this.finishBattle(state, 'escape');
  }

  private advanceFromPlayerTurn(state: GameState): void {
    if (this.enemyHp <= 0) {
      this.finishBattle(state, 'victory');
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
      this.finishBattle(state, 'defeat');
      return;
    }

    this.phase = 'player-turn';
  }

  private finishBattle(state: GameState, outcome: BattleOutcome): void {
    if (this.resolved) {
      return;
    }

    this.resolved = true;

    if (outcome === 'victory') {
      this.phase = 'victory';
      this.log.push('Victoire !');
      appendLog(state, `Victoire ! ${this.player.definition.name} remporte le combat.`);
      applyExperienceGain(this.player, 2).forEach(message => appendLog(state, message));
    } else if (outcome === 'defeat') {
      this.phase = 'defeat';
      this.playerHp = 0;
      this.log.push('Défaite...');
      appendLog(state, 'Vous avez été vaincu...');
    } else {
      this.phase = 'escape';
      this.log.push('Fuite !');
      appendLog(state, 'Vous prenez la fuite !');
    }

    this.completionHandler?.(outcome);
  }
}
