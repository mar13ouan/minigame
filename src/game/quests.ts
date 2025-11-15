import type { GameState } from './state';

export type QuestType = 'hunt' | 'delivery';

export type QuestDefinition = {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  targetId: string;
  reward: { itemId?: string; hungerRestore?: number; stats?: { power?: number; defense?: number; speed?: number; morale?: number } };
};

export type QuestProgress = {
  id: string;
  status: 'available' | 'active' | 'completed';
  requirementMet: boolean;
};

export const questDefinitions: Record<string, QuestDefinition> = {
  emberGuardian: {
    id: 'emberGuardian',
    title: 'Gardien des Braises',
    description: 'Vaincre le boss Brasemire dans la clairière embrasée.',
    type: 'hunt',
    targetId: 'brasemire',
    reward: { itemId: 'tonic', stats: { morale: 1 } }
  },
  riverOffering: {
    id: 'riverOffering',
    title: 'Offrande du Ruisseau',
    description: 'Rapporter un Pétale de Rosée à Elder Lysa.',
    type: 'delivery',
    targetId: 'dewPetal',
    reward: { hungerRestore: 50 }
  },
  twinFangs: {
    id: 'twinFangs',
    title: 'Les Crocs Jumelés',
    description: 'Vaincre les deux chefs de meute de la gorge azurée.',
    type: 'hunt',
    targetId: 'azureAlpha',
    reward: { itemId: 'meat', stats: { power: 1, defense: 1 } }
  }
};

export const getQuestProgress = (state: GameState, questId: string): QuestProgress => {
  const existing = state.quests.find(entry => entry.id === questId);
  if (existing) {
    return existing;
  }

  const progress: QuestProgress = { id: questId, status: 'available', requirementMet: false };
  state.quests.push(progress);
  return progress;
};

export const activateQuest = (state: GameState, questId: string): void => {
  const quest = getQuestProgress(state, questId);
  quest.status = 'active';
  quest.requirementMet = false;
};

export const markQuestRequirement = (state: GameState, questId: string): void => {
  const quest = getQuestProgress(state, questId);
  quest.requirementMet = true;
};

export const completeQuest = (state: GameState, questId: string): void => {
  const quest = getQuestProgress(state, questId);
  quest.status = 'completed';
  quest.requirementMet = true;
};
