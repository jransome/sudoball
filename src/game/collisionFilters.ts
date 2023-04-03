import { ICollisionFilter } from 'matter-js';

export const collisionFilters: Record<string, ICollisionFilter> = {
  gameBoundary: { category: 1, mask: 4 | 8 },
  pitchBoundary: { category: 2, mask: 4 },
  ball: { category: 4, mask: 1 | 2 | 4 | 8 },
  player: { category: 8, mask: 1 | 4 | 8 },
};
