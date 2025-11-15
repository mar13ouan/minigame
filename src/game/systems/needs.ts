import { appendLog, type GameState } from '../state';
import { itemDefinitions, removeItemFromInventory } from '../items';

const HUNGER_TICK_INTERVAL = 6;
const HUNGER_DECREASE = 4;
const CRITICAL_THRESHOLD = 20;

export const updatePlayerNeeds = (state: GameState, dt: number): void => {
  const { needs } = state.player;
  needs.hungerTimer += dt;

  if (needs.hungerTimer >= HUNGER_TICK_INTERVAL) {
    needs.hungerTimer = 0;
    needs.hunger = Math.max(0, needs.hunger - HUNGER_DECREASE);
    if (needs.hunger === 0) {
      appendLog(state, "Votre partenaire est affamé et n'a plus d'énergie !");
    } else if (needs.hunger <= CRITICAL_THRESHOLD) {
      appendLog(state, 'Votre partenaire réclame à manger.');
    }
  }
};

export const feedWithItem = (state: GameState, itemId: string): boolean => {
  const definition = itemDefinitions[itemId];
  if (!definition || !definition.hungerRestore) {
    return false;
  }

  if (!removeItemFromInventory(state.player.inventory, itemId)) {
    return false;
  }

  const { needs } = state.player;
  needs.hunger = Math.min(needs.maxHunger, needs.hunger + definition.hungerRestore);
  appendLog(state, `${definition.name} apaise la faim de votre partenaire.`);
  return true;
};
