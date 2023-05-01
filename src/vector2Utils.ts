import { Vector2 } from './types';

export const scale = (vector: Vector2, scalar: number) => ({ x: vector.x * scalar, y: vector.y * scalar });

export const subtract = (v1: Vector2, v2: Vector2) => ({ x: v1.x - v2.x, y: v1.y - v2.y });

export const sqrMagnitude = (vector: Vector2) => (vector.x ** 2) + (vector.y ** 2);

export const normalise = (vector: Vector2) => {
  if (vector.x === 0 && vector.y === 0) return vector;
  const magnitude = Math.sqrt(sqrMagnitude(vector));
  return { x: vector.x / magnitude, y: vector.y / magnitude };
};
