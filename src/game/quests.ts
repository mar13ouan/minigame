import type { GameState } from './state';
import type { ItemId } from './items';
import { addItem, removeItem } from './items';
import { appendLog } from './state';

export type QuestId = 'village-relic' | 'twin-tyrants' | 'training-gauntlet';

export type QuestStatus = 'inactive' | 'active' | 'completed';

export type QuestDefinition = {
  id: QuestId;
  title: string;
  description: string;
  objective: string;
  type: 'defeat' | 'deliver';
  targetIds?: string[];
  requiredItem?: ItemId;
  reward: {
    gold?: number;
    unlockScene?: string;
    items?: Array<{ id: ItemId; quantity: number }>;
  };
};

export type QuestProgress = {
  id: QuestId;
  status: QuestStatus;
  completedTargets: Record<string, boolean>;
};

export type QuestLogState = Partial<Record<QuestId, QuestProgress>>;

export const questDefinitions: Record<QuestId, QuestDefinition> = {
  'village-relic': {
    id: 'village-relic',
    title: 'Patrimoine Perdu',
    description:
      "Le chef du village vous demande de retrouver une relique pour apaiser les esprits.",
    objective: 'Apporter la relique ancienne au chef du village.',
    type: 'deliver',
    requiredItem: 'ancient-relic',
    reward: {
      gold: 40,
      unlockScene: 'wild-north',
      items: [{ id: 'fresh-meat', quantity: 2 }]
    }
  },
  'twin-tyrants': {
    id: 'twin-tyrants',
    title: 'Les Tyrans Jumelles',
    description:
      'Chassez les deux boss qui terrorisent les hautes terres afin de rouvrir le passage.',
    objective: 'Vaincre Obsidianox et Wyverne-tempête dans les zones sauvages.',
    type: 'defeat',
    targetIds: ['obsidianox', 'storm-wyvern'],
    reward: {
      gold: 75,
      unlockScene: 'wild-coast',
      items: [{ id: 'focus-crystal', quantity: 1 }]
    }
  },
  'training-gauntlet': {
    id: 'training-gauntlet',
    title: "Gant d'Entraînement",
    description: "Éprouvez votre compagnon sur les trois piliers de l'arène.",
    objective: "Terminer les trois exercices d'entraînement.",
    type: 'deliver',
    requiredItem: 'training-badge',
    reward: {
      gold: 30,
      items: [{ id: 'vital-herb', quantity: 1 }]
    }
  }
};

const ensureQuest = (state: GameState, questId: QuestId): QuestProgress => {
  const existing = state.player.quests[questId];
  if (existing) {
    return existing;
  }
  const quest: QuestProgress = { id: questId, status: 'inactive', completedTargets: {} };
  state.player.quests[questId] = quest;
  return quest;
};

export const activateQuest = (state: GameState, questId: QuestId): boolean => {
  const quest = ensureQuest(state, questId);
  if (quest.status === 'completed') {
    return false;
  }
  quest.status = 'active';
  appendLog(state, `Quête acceptée : ${questDefinitions[questId].title}`);
  return true;
};

export const completeQuest = (state: GameState, questId: QuestId): void => {
  const quest = ensureQuest(state, questId);
  if (quest.status === 'completed') {
    return;
  }
  quest.status = 'completed';
  const reward = questDefinitions[questId].reward;
  if (reward.gold) {
    state.player.gold += reward.gold;
  }
  reward.items?.forEach(item => addItem(state, item.id, item.quantity));
  if (reward.unlockScene) {
    state.unlockedScenes.add(reward.unlockScene);
  }
  appendLog(state, `Quête terminée ! Vous recevez ${reward.gold ?? 0} pièces.`);
};

export const tryDeliverQuestItem = (state: GameState, questId: QuestId): boolean => {
  const quest = ensureQuest(state, questId);
  const def = questDefinitions[questId];
  if (quest.status !== 'active' || def.type !== 'deliver' || !def.requiredItem) {
    return false;
  }
  if (!removeItem(state, def.requiredItem, 1)) {
    return false;
  }
  completeQuest(state, questId);
  appendLog(state, def.objective.replace('Apporter', 'Vous livrez'));
  return true;
};

export const markEnemyDefeatedForQuests = (state: GameState, enemyId: string): void => {
  (Object.keys(state.player.quests) as QuestId[]).forEach(questId => {
    const quest = state.player.quests[questId];
    const def = questDefinitions[questId];
    if (!quest || quest.status !== 'active' || def.type !== 'defeat' || !def.targetIds) {
      return;
    }
    if (!def.targetIds.includes(enemyId)) {
      return;
    }
    quest.completedTargets[enemyId] = true;
    const allCompleted = def.targetIds.every(id => quest.completedTargets[id]);
    if (allCompleted) {
      completeQuest(state, questId);
    } else {
      appendLog(state, `Progrès de quête : ${enemyId} vaincu.`);
    }
  });
};

export const getQuestSummaries = (
  state: GameState
): Array<{ id: QuestId; title: string; status: QuestStatus; objective: string }> =>
  (Object.keys(questDefinitions) as QuestId[]).map(id => ({
    id,
    title: questDefinitions[id].title,
    objective: questDefinitions[id].objective,
    status: ensureQuest(state, id).status
  }));
