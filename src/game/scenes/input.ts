export type MovementVector = { vx: number; vy: number };

export const resolveMovementVector = (pressed: Set<string>): MovementVector => {
  let vx = 0;
  let vy = 0;

  if (pressed.has('ArrowUp') || pressed.has('z') || pressed.has('Z')) {
    vy -= 1;
  }
  if (pressed.has('ArrowDown') || pressed.has('s') || pressed.has('S')) {
    vy += 1;
  }
  if (pressed.has('ArrowLeft') || pressed.has('q') || pressed.has('Q')) {
    vx -= 1;
  }
  if (pressed.has('ArrowRight') || pressed.has('d') || pressed.has('D')) {
    vx += 1;
  }

  return { vx, vy };
};
