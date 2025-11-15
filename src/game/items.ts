export type ItemKind = 'food' | 'quest' | 'boost';

export type ItemDefinition = {
  id: string;
  name: string;
  description: string;
  kind: ItemKind;
  hungerRestore?: number;
  statBoost?: { power?: number; defense?: number; speed?: number; morale?: number };
};

export type InventoryEntry = {
  id: string;
  quantity: number;
};

export const itemDefinitions: Record<string, ItemDefinition> = {
  meat: {
    id: 'meat',
    name: 'Viande Savoureuse',
    description: 'Un repas nourrissant qui rassasie votre partenaire.',
    kind: 'food',
    hungerRestore: 35
  },
  fruit: {
    id: 'fruit',
    name: 'Fruit Lumina',
    description: 'Un fruit énergisant aux propriétés revitalisantes.',
    kind: 'food',
    hungerRestore: 20
  },
  tonic: {
    id: 'tonic',
    name: 'Tonique Brillant',
    description: 'Augmente légèrement la vitesse d entraînement.',
    kind: 'boost',
    statBoost: { speed: 1 }
  },
  emberCore: {
    id: 'emberCore',
    name: 'Noyau Brasier',
    description: 'Un noyau ardent demandé par un habitant du village.',
    kind: 'quest'
  },
  dewPetal: {
    id: 'dewPetal',
    name: 'Pétale de Rosée',
    description: 'Un pétale translucide gorgé de magie matinale.',
    kind: 'quest'
  }
};

export const addItemToInventory = (inventory: InventoryEntry[], itemId: string, amount = 1): void => {
  const existing = inventory.find(entry => entry.id === itemId);
  if (existing) {
    existing.quantity += amount;
  } else {
    inventory.push({ id: itemId, quantity: amount });
  }
};

export const removeItemFromInventory = (
  inventory: InventoryEntry[],
  itemId: string,
  amount = 1
): boolean => {
  const entry = inventory.find(item => item.id === itemId);
  if (!entry || entry.quantity < amount) {
    return false;
  }

  entry.quantity -= amount;
  if (entry.quantity <= 0) {
    const index = inventory.indexOf(entry);
    inventory.splice(index, 1);
  }

  return true;
};
