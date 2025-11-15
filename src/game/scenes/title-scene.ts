import type { Scene, SceneContext } from '../core/engine';
import { appendLog } from '../state';
import { wrapPanel, renderLog } from '../ui/templates';

export type TitleSceneCallbacks = {
  onNewGame: (context: SceneContext) => void;
  onContinue: (context: SceneContext) => void;
};

export class TitleScene implements Scene {
  public readonly id = 'title';
  private cursor = 0;
  private readonly options = [
    { id: 'new', label: 'Nouvelle Partie' },
    { id: 'continue', label: 'Continuer' }
  ];

  constructor(private readonly callbacks: TitleSceneCallbacks) {}

  public enter(context: SceneContext): void {
    context.state.scene = this.id;
    appendLog(context.state, 'Appuyez sur Entrée pour commencer votre aventure.');
    this.cursor = 0;
    this.renderOverlay(context);
  }

  public update(_: SceneContext, __: number): void {
    // Pas d animations spécifiques pour le moment
  }

  public render(_: SceneContext, ctx: CanvasRenderingContext2D): void {
    const { canvas } = ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#facc15';
    ctx.font = '28px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('DIGIWORLD : SYLVA', canvas.width / 2, canvas.height / 3);

    ctx.font = '14px "Press Start 2P"';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Un hommage à Digimon World', canvas.width / 2, canvas.height / 3 + 36);
  }

  public onKeyDown(context: SceneContext, event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      this.cursor = (this.cursor - 1 + this.options.length) % this.options.length;
      this.renderOverlay(context);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      this.cursor = (this.cursor + 1) % this.options.length;
      this.renderOverlay(context);
    } else if (event.key === 'Enter' || event.key === ' ') {
      const selected = this.options[this.cursor];
      if (selected.id === 'new') {
        this.callbacks.onNewGame(context);
      } else {
        if (context.state.unlockedScenes.size > 1) {
          this.callbacks.onContinue(context);
        } else {
          appendLog(context.state, 'Aucune sauvegarde à reprendre, commencez une nouvelle partie.');
          this.renderOverlay(context);
        }
      }
    }
  }

  private renderOverlay({ overlay, state }: SceneContext): void {
    const menuMarkup = this.options
      .map((option, index) => {
        const active = index === this.cursor;
        return `<div class="menu-option${active ? ' active' : ''}">${option.label}</div>`;
      })
      .join('');

    const logMarkup = wrapPanel('log', renderLog(state.log));
    overlay.render('menu', [wrapPanel('menu-panel', menuMarkup), logMarkup].join(''));
  }
}
