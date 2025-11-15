import { SpriteController, loadSpriteAssets, type SpriteAssetConfig } from './sprite-system';

const spriteConfigs: SpriteAssetConfig[] = [
  {
    id: 'player',
    url: 'https://raw.githubusercontent.com/0x72/ndjson-assets/master/packed/roguelikeChar_transparent.png',
    frameWidth: 16,
    frameHeight: 16,
    framesPerRow: 16,
    animations: {
      'idle-down': { frames: [0], frameDuration: 0.4 },
      'idle-up': { frames: [48], frameDuration: 0.4 },
      'idle-left': { frames: [16], frameDuration: 0.4 },
      'idle-right': { frames: [32], frameDuration: 0.4 },
      'walk-down': { frames: [0, 1, 2, 3], frameDuration: 0.12 },
      'walk-up': { frames: [48, 49, 50, 51], frameDuration: 0.12 },
      'walk-left': { frames: [16, 17, 18, 19], frameDuration: 0.12 },
      'walk-right': { frames: [32, 33, 34, 35], frameDuration: 0.12 }
    }
  },
  {
    id: 'sprout',
    url: 'https://raw.githubusercontent.com/0x72/ndjson-assets/master/packed/roguelikeMonsters_transparent.png',
    frameWidth: 16,
    frameHeight: 16,
    framesPerRow: 16,
    animations: {
      idle: { frames: [80, 81, 82, 81], frameDuration: 0.18 },
      walk: { frames: [80, 81, 82, 83], frameDuration: 0.14 },
      defeated: { frames: [84], frameDuration: 0.4 }
    }
  },
  {
    id: 'canine',
    url: 'https://raw.githubusercontent.com/0x72/ndjson-assets/master/packed/roguelikeMonsters_transparent.png',
    frameWidth: 16,
    frameHeight: 16,
    framesPerRow: 16,
    animations: {
      idle: { frames: [96, 97, 98, 97], frameDuration: 0.18 },
      walk: { frames: [96, 97, 98, 99], frameDuration: 0.14 },
      defeated: { frames: [100], frameDuration: 0.4 }
    }
  },
  {
    id: 'boss',
    url: 'https://raw.githubusercontent.com/0x72/ndjson-assets/master/packed/roguelikeMonsters_transparent.png',
    frameWidth: 16,
    frameHeight: 16,
    framesPerRow: 16,
    animations: {
      idle: { frames: [64, 65, 66, 65], frameDuration: 0.2 },
      walk: { frames: [64, 65, 66, 67], frameDuration: 0.15 },
      defeated: { frames: [68], frameDuration: 0.4 }
    }
  }
];

export const preloadSprites = async (): Promise<void> => {
  await loadSpriteAssets(spriteConfigs);
};

export const createPlayerSprite = (): SpriteController => new SpriteController('player', 'idle-down');

export const createCreatureSprite = (variant: 'plant' | 'fire' | 'water' | 'boss'): SpriteController => {
  switch (variant) {
    case 'fire':
      return new SpriteController('canine', 'idle');
    case 'water':
      return new SpriteController('sprout', 'idle');
    case 'boss':
      return new SpriteController('boss', 'idle');
    default:
      return new SpriteController('sprout', 'idle');
  }
};
