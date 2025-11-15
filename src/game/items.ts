import type { GameState } from './state';

export type ItemId =
  | 'fresh-meat'
  | 'vital-herb'
  | 'focus-crystal'
  | 'ancient-relic'
  | 'training-badge';

export type InventoryState = Partial<Record<ItemId, number>>;

export type ItemUseResult = {
  success: boolean;
  message: string;
};

export type ItemDefinition = {
  id: ItemId;
  name: string;
  description: string;
  icon: string;
  effect: (state: GameState) => ItemUseResult;
  consumable?: boolean;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const itemDefinitions: Record<ItemId, ItemDefinition> = {
  'fresh-meat': {
    id: 'fresh-meat',
    name: 'Viande Fraîche',
    description: 'Restaure la faim de votre compagnon.',
    icon: '🥩',
    consumable: true,
    effect: state => {
      state.player.hunger = clamp(state.player.hunger + 35, 0, 100);
      return { success: true, message: 'Votre compagnon savoure la viande et reprend des forces.' };
    }
  },
  'vital-herb': {
    id: 'vital-herb',
    name: 'Herbe Vitalité',
    description: 'Augmente légèrement la défense et la vitesse.',
    icon: '🌿',
    consumable: true,
    effect: state => {
      const monster = state.player.monster;
      if (!monster) {
        return { success: false, message: "Aucun compagnon pour utiliser l'herbe." };
      }
      monster.stats.defense += 1;
      monster.stats.speed += 1;
      return { success: true, message: `${monster.definition.name} se sent plus résistant et agile.` };
    }
  },
  'focus-crystal': {
    id: 'focus-crystal',
    name: 'Cristal de Focalisation',
    description: 'Renforce la puissance morale de votre monstre.',
    icon: '🔮',
    consumable: true,
    effect: state => {
      const monster = state.player.monster;
      if (!monster) {
        return { success: false, message: "Aucun compagnon pour canaliser le cristal." };
      }
      monster.stats.morale += 2;
      monster.stats.power += 1;
      return { success: true, message: `${monster.definition.name} est empli d'une énergie nouvelle.` };
    }
  },
  'ancient-relic': {
    id: 'ancient-relic',
    name: 'Relique Ancienne',
    description: 'Un artefact recherché par les habitants du village.',
    icon: '🏺',
    consumable: false,
    effect: () => ({
      success: false,
      message: 'Mieux vaut livrer cette relique à la bonne personne.'
    })
  },
  'training-badge': {
    id: 'training-badge',
    name: "Badge d'Entraînement",
    description: "Prouve votre réussite à l'arène d'entraînement.",
    icon: '🎖️',
    consumable: false,
    effect: () => ({ success: false, message: "Un badge n'a pas d'effet direct." })
  }
};

export const addItem = (state: GameState, id: ItemId, quantity = 1): void => {
  const current = state.player.inventory[id] ?? 0;
  state.player.inventory[id] = current + quantity;
};

export const removeItem = (state: GameState, id: ItemId, quantity = 1): boolean => {
  const current = state.player.inventory[id] ?? 0;
  if (current < quantity) {
    return false;
  }
  const remaining = current - quantity;
  if (remaining <= 0) {
    delete state.player.inventory[id];
  } else {
    state.player.inventory[id] = remaining;
  }
  return true;
};

export const useItem = (state: GameState, id: ItemId): ItemUseResult => {
  const definition = itemDefinitions[id];
  if (!definition) {
    return { success: false, message: "Objet inconnu." };
  }

  const owned = state.player.inventory[id] ?? 0;
  if (owned <= 0) {
    return { success: false, message: "Vous ne possédez pas cet objet." };
  }

  const result = definition.effect(state);
  if (result.success && definition.consumable) {
    removeItem(state, id, 1);
  }

  return result;
};

export const getInventoryEntries = (
  inventory: InventoryState
): Array<{ id: ItemId; quantity: number; definition: ItemDefinition }> =>
  (Object.keys(inventory) as ItemId[])
    .filter(id => (inventory[id] ?? 0) > 0)
    .map(id => ({ id, quantity: inventory[id] ?? 0, definition: itemDefinitions[id] }));
