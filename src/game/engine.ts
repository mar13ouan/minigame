import type { GameState } from './state';

export type SceneContext = {
  engine: Engine;
  state: GameState;
};

export interface Scene {
  id: string;
  enter(context: SceneContext): void;
  update(context: SceneContext, dt: number): void;
  render(context: SceneContext, ctx: CanvasRenderingContext2D): void;
  onKeyDown?(context: SceneContext, event: KeyboardEvent): void;
  onKeyUp?(context: SceneContext, event: KeyboardEvent): void;
}

export class Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scene?: Scene;
  private state: GameState;
  private lastTime = 0;
  private overlay: HTMLElement;
  private running = false;

  constructor(canvas: HTMLCanvasElement, overlay: HTMLElement, state: GameState) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Impossible d initialiser le contexte');
    this.canvas = canvas;
    this.ctx = ctx;
    this.overlay = overlay;
    this.state = state;
  }

  public setScene(scene: Scene) {
    this.scene = scene;
    scene.enter({ engine: this, state: this.state });
  }

  public start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  private loop = (time: number) => {
    if (!this.running) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;
    if (this.scene) {
      this.scene.update({ engine: this, state: this.state }, dt);
      this.scene.render({ engine: this, state: this.state }, this.ctx);
    }
    requestAnimationFrame(this.loop);
  };

  public getCanvasSize() {
    return { width: this.canvas.width, height: this.canvas.height };
  }

  public getOverlay() {
    return this.overlay;
  }

  public getState() {
    return this.state;
  }

  public switchScene(scene: Scene) {
    this.setScene(scene);
  }

  public attachInput() {
    window.addEventListener('keydown', ev => {
      if (this.scene?.onKeyDown) {
        this.scene.onKeyDown({ engine: this, state: this.state }, ev);
      }
    });
    window.addEventListener('keyup', ev => {
      if (this.scene?.onKeyUp) {
        this.scene.onKeyUp({ engine: this, state: this.state }, ev);
      }
    });
  }
}
