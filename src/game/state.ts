import type { MonsterInstance } from './monsters';

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

export const appendLog = (state: GameState, message: string) => {
  state.log.push(message);
  if (state.log.length > 8) {
    state.log.splice(0, state.log.length - 8);
  }
};
