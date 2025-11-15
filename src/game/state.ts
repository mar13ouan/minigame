import type { MonsterInstance } from './monsters';
import { LOG_HISTORY_LIMIT } from './world/constants';
import type { InventoryEntry } from './items';
import type { QuestProgress } from './quests';

export type PlayerNeeds = {
  hunger: number;
  maxHunger: number;
  hungerTimer: number;
};

export type PlayerState = {
  position: { x: number; y: number };
  monster?: MonsterInstance;
  inventory: InventoryEntry[];
  needs: PlayerNeeds;
};

export type GameState = {
  player: PlayerState;
  unlockedScenes: Set<string>;
  log: string[];
  scene: string;
  quests: QuestProgress[];
  defeatedBosses: Set<string>;
};

export const createInitialState = (): GameState => ({
  player: {
    position: { x: 160, y: 160 },
    inventory: [],
    needs: { hunger: 80, maxHunger: 100, hungerTimer: 0 }
  },
  unlockedScenes: new Set(['title']),
  log: ['Bienvenue dans le monde de Sylva !'],
  scene: 'title',
  quests: [],
  defeatedBosses: new Set()
});

export const appendLog = (state: GameState, message: string): void => {
  state.log.push(message);
  if (state.log.length > LOG_HISTORY_LIMIT) {
    state.log.splice(0, state.log.length - LOG_HISTORY_LIMIT);
  }
};

export const resetGameState = (state: GameState): void => {
  state.player.position = { x: 160, y: 160 };
  state.player.inventory = [];
  state.player.monster = undefined;
  state.player.needs = { hunger: 80, maxHunger: 100, hungerTimer: 0 };
  state.unlockedScenes = new Set(['title']);
  state.log.length = 0;
  state.log.push('Bienvenue dans le monde de Sylva !');
  state.scene = 'title';
  state.quests = [];
  state.defeatedBosses = new Set();
};
