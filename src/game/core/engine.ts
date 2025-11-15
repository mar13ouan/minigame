import type { GameState } from '../state';
import { OverlayController } from '../ui/overlay-controller';

export type SceneContext = {
  engine: Engine;
  state: GameState;
  overlay: OverlayController;
};

export interface Scene {
  readonly id: string;
  enter(context: SceneContext): void;
  update(context: SceneContext, dt: number): void;
  render(context: SceneContext, ctx: CanvasRenderingContext2D): void;
  exit?(context: SceneContext): void;
  onKeyDown?(context: SceneContext, event: KeyboardEvent): void;
  onKeyUp?(context: SceneContext, event: KeyboardEvent): void;
}

export class Engine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly overlay: OverlayController;
  private readonly state: GameState;
  private scene?: Scene;
  private running = false;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement, overlay: OverlayController, state: GameState) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error("Impossible d'initialiser le contexte 2D");
    }

    this.canvas = canvas;
    this.ctx = ctx;
    this.overlay = overlay;
    this.state = state;
  }

  public attachInput(): void {
    window.addEventListener('keydown', event => {
      if (this.scene?.onKeyDown) {
        this.scene.onKeyDown(this.createContext(), event);
      }
    });

    window.addEventListener('keyup', event => {
      if (this.scene?.onKeyUp) {
        this.scene.onKeyUp(this.createContext(), event);
      }
    });
  }

  public setScene(scene: Scene): void {
    if (this.scene?.exit) {
      this.scene.exit(this.createContext());
    }

    this.scene = scene;
    this.overlay.reset();
    this.scene.enter(this.createContext());
  }

  public switchScene(scene: Scene): void {
    this.setScene(scene);
  }

  public start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  private loop = (time: number): void => {
    if (!this.running) {
      return;
    }

    const delta = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (this.scene) {
      const context = this.createContext();
      this.scene.update(context, delta);
      this.scene.render(context, this.ctx);
    }

    requestAnimationFrame(this.loop);
  };

  public getCanvasSize(): { width: number; height: number } {
    return { width: this.canvas.width, height: this.canvas.height };
  }

  public getOverlay(): OverlayController {
    return this.overlay;
  }

  public getState(): GameState {
    return this.state;
  }

  private createContext(): SceneContext {
    return { engine: this, state: this.state, overlay: this.overlay };
  }
}
