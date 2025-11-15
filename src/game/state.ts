import type { MonsterInstance } from './monsters';
import { LOG_HISTORY_LIMIT } from './world/constants';

export type PlayerState = {
  position: { x: number; y: number };
  monster?: MonsterInstance;
  inventory: string[];
};

export type GameState = {
  player: PlayerState;
  unlockedScenes: Set<string>;
  log: string[];
  scene: string;
};

export const createInitialState = (): GameState => ({
  player: {
    position: { x: 160, y: 160 },
    inventory: []
  },
  unlockedScenes: new Set(['starter']),
  log: ['Bienvenue dans le monde de Sylva !'],
  scene: 'starter'
});

export const appendLog = (state: GameState, message: string): void => {
  state.log.push(message);
  if (state.log.length > LOG_HISTORY_LIMIT) {
    state.log.splice(0, state.log.length - LOG_HISTORY_LIMIT);
  }
};
