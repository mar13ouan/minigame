import type { MonsterInstance } from './monsters';
import type { InventoryState } from './items';
import type { QuestLogState } from './quests';
import { LOG_HISTORY_LIMIT } from './world/constants';

export type PlayerState = {
  position: { x: number; y: number };
  monster?: MonsterInstance;
  inventory: InventoryState;
  hunger: number;
  gold: number;
  activeQuest?: string;
  quests: QuestLogState;
};

export type GameState = {
  player: PlayerState;
  unlockedScenes: Set<string>;
  log: string[];
  scene: string;
  elapsed: number;
};

export const createInitialState = (): GameState => ({
  player: {
    position: { x: 160, y: 160 },
    inventory: {},
    hunger: 100,
    gold: 25,
    quests: {}
  },
  unlockedScenes: new Set(['starter']),
  log: ['Bienvenue dans le monde de Sylva !'],
  scene: 'starter',
  elapsed: 0
});

export const appendLog = (state: GameState, message: string): void => {
  state.log.push(message);
  if (state.log.length > LOG_HISTORY_LIMIT) {
    state.log.splice(0, state.log.length - LOG_HISTORY_LIMIT);
  }
};
