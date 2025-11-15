export type OverlayMode = 'default' | 'battle';

export class OverlayController {
  private lastMarkup = '';
  private lastMode: OverlayMode = 'default';

  constructor(private readonly element: HTMLElement) {}

  public render(mode: OverlayMode, markup: string): void {
    if (this.lastMarkup === markup && this.lastMode === mode) {
      return;
    }

    this.element.dataset.mode = mode;
    this.element.innerHTML = markup;

    this.lastMarkup = markup;
    this.lastMode = mode;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public reset(): void {
    this.lastMarkup = '';
    this.lastMode = 'default';
    this.element.dataset.mode = 'default';
    this.element.innerHTML = '';
  }
}
