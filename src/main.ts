import { Engine } from './game/core/engine';
import { createScenes } from './game/scenes';
import { createInitialState } from './game/state';
import { OverlayController } from './game/ui/overlay-controller';

const bootstrap = () => {
  const app = document.getElementById('app');
  if (!app) throw new Error('Point de montage manquant');

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 384;
  canvas.style.width = '100%';
  canvas.style.height = 'auto';

  const overlayElement = document.createElement('div');
  overlayElement.className = 'overlay';
  overlayElement.dataset.mode = 'default';

  app.appendChild(canvas);
  app.appendChild(overlayElement);

  const state = createInitialState();
  const overlay = new OverlayController(overlayElement);
  const engine = new Engine(canvas, overlay, state);
  const { starter, field } = createScenes();

  engine.attachInput();
  engine.setScene(starter);
  engine.start();

  field.setReturnScene(starter);
};

window.addEventListener('DOMContentLoaded', bootstrap);
