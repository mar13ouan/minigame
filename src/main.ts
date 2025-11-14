import { Engine } from './game/engine';
import { createScenes } from './game/scenes';
import { createInitialState } from './game/state';

const bootstrap = () => {
  const app = document.getElementById('app');
  if (!app) throw new Error('Point de montage manquant');

  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  app.appendChild(canvas);
  app.appendChild(overlay);

  const state = createInitialState();
  const engine = new Engine(canvas, overlay, state);
  const { starter, field } = createScenes();

  engine.attachInput();
  engine.setScene(starter);
  engine.start();

  // Relier les scènes maintenant que l engine est prêt
  field.setReturnScene(starter);
};

window.addEventListener('DOMContentLoaded', bootstrap);
