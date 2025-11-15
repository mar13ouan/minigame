import { FieldScene } from './field-scene';
import { StarterScene } from './starter-scene';

export const createScenes = (): { starter: StarterScene; field: FieldScene } => {
  const field = new FieldScene();
  const starter = new StarterScene(field);
  field.setReturnScene(starter);
  return { starter, field };
};
