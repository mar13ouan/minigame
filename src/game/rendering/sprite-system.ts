export type SpriteAnimation = {
  frames: number[];
  frameDuration: number;
};

export type SpriteAssetConfig = {
  id: string;
  url: string;
  frameWidth: number;
  frameHeight: number;
  framesPerRow: number;
  animations: Record<string, SpriteAnimation>;
};

export type SpriteAsset = SpriteAssetConfig & {
  image: HTMLImageElement;
};

const SPRITE_SCALE = 2.5;

const assets = new Map<string, SpriteAsset>();

const loadImage = (config: SpriteAssetConfig): Promise<SpriteAsset> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve({ ...config, image });
    image.onerror = reject;
    image.src = config.url;
  });

export const loadSpriteAssets = async (configs: SpriteAssetConfig[]): Promise<void> => {
  const loaded = await Promise.all(configs.map(loadImage));
  loaded.forEach(asset => assets.set(asset.id, asset));
};

export class SpriteController {
  private animationName: string;
  private elapsed = 0;
  private frameIndex = 0;

  constructor(private readonly assetId: string, initialAnimation: string) {
    this.animationName = initialAnimation;
  }

  public setAnimation(name: string): void {
    if (name === this.animationName) {
      return;
    }
    this.animationName = name;
    this.elapsed = 0;
    this.frameIndex = 0;
  }

  public update(dt: number): void {
    const asset = assets.get(this.assetId);
    if (!asset) return;
    const animation = asset.animations[this.animationName];
    if (!animation || animation.frames.length <= 1) {
      return;
    }

    this.elapsed += dt;
    while (this.elapsed >= animation.frameDuration) {
      this.elapsed -= animation.frameDuration;
      this.frameIndex = (this.frameIndex + 1) % animation.frames.length;
    }
  }

  public draw(ctx: CanvasRenderingContext2D, x: number, y: number, flip = false): void {
    const asset = assets.get(this.assetId);
    if (!asset) {
      return;
    }
    const animation = asset.animations[this.animationName];
    const frame = animation?.frames[this.frameIndex] ?? 0;
    const col = frame % asset.framesPerRow;
    const row = Math.floor(frame / asset.framesPerRow);
    const { frameWidth, frameHeight } = asset;
    const destWidth = frameWidth * SPRITE_SCALE;
    const destHeight = frameHeight * SPRITE_SCALE;
    const destX = x - destWidth / 2;
    const destY = y - destHeight + frameHeight * 0.8;

    ctx.save();
    if (flip) {
      ctx.translate(x * 2, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(
      asset.image,
      col * frameWidth,
      row * frameHeight,
      frameWidth,
      frameHeight,
      destX,
      destY,
      destWidth,
      destHeight
    );
    ctx.restore();
  }
}

export const getSpriteAsset = (id: string): SpriteAsset | undefined => assets.get(id);
