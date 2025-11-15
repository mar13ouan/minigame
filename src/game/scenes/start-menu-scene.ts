import type { Scene, SceneContext } from '../core/engine';
import { wrapPanel } from '../ui/templates';

const menuOptions = ['Nouvelle partie', 'Instructions'];

export class StartMenuScene implements Scene {
  public readonly id = 'start-menu';

  private cursor = 0;
  private showingInstructions = false;

  constructor(private readonly nextScene: Scene) {}

  public enter({ overlay, state }: SceneContext): void {
    state.scene = this.id;
    this.cursor = 0;
    this.showingInstructions = false;
    overlay.render('start', this.buildMenu());
  }

  public update(context: SceneContext, _dt: number): void {
    const { overlay } = context;
    overlay.render('start', this.showingInstructions ? this.buildInstructions() : this.buildMenu());
  }

  public render(): void {
    // Nothing to draw on canvas for the menu.
  }

  public onKeyDown(context: SceneContext, event: KeyboardEvent): void {
    if (this.showingInstructions && (event.key === 'Enter' || event.key === ' ')) {
      this.showingInstructions = false;
      context.overlay.render('start', this.buildMenu());
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      this.cursor = (this.cursor - 1 + menuOptions.length) % menuOptions.length;
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      this.cursor = (this.cursor + 1) % menuOptions.length;
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      this.selectOption(context, this.cursor);
    }
  }

  private selectOption(context: SceneContext, index: number): void {
    const option = menuOptions[index];
    if (option === 'Nouvelle partie') {
      context.engine.switchScene(this.nextScene);
    } else {
      this.showingInstructions = true;
      context.overlay.render('start', this.buildInstructions());
    }
  }

  private buildMenu(): string {
    const items = menuOptions
      .map((option, index) => {
        const active = index === this.cursor ? 'active' : '';
        return `<div class="menu-item ${active}">${option}</div>`;
      })
      .join('');
    return wrapPanel('start-menu', `
      <h1>Digimon World Hommage</h1>
      <p>Choisissez une option et appuyez sur Entrée.</p>
      <div class="menu-list">${items}</div>
    `);
  }

  private buildInstructions(): string {
    return wrapPanel(
      'start-menu',
      `
        <h1>Commandes</h1>
        <p>Flèches pour se déplacer, Entrée pour interagir, I pour ouvrir les objets.</p>
        <p>Appuyez sur Entrée pour revenir.</p>
      `
    );
  }
}
