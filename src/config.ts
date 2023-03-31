import { Vector2 } from './types';

export const FRAMERATE_HZ = 60;

export const CANVAS_SHARPNESS_FACTOR = 3;

export const GAME_DIMENSIONS: Vector2 = {
  x: 800,
  y: 400,
};

export const PLAYER_RADIUS = 14;
export const PLAYER_MASS = 1000;
export const PLAYER_DRAG = 0.07;
export const MOVE_FORCE = 0.5;

export const BALL_RADIUS = 10;
export const BALL_MASS = 1;
export const BALL_DRAG = 0.01;
export const BALL_BOUNCINESS = 0.6;

export const KICK_FORCE = 0.02;
export const KICK_COOLDOWN_MS = 200;
export const KICK_RADIUS = 25;

export enum Team {
  Red,
  Blue,
}
