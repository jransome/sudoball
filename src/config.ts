export const FRAMERATE_HZ = 60;

export const CANVAS_SHARPNESS_FACTOR = 3;

export const GAME_BOUNDARY_DIMENSIONS = { x: 800, y: 400 }; // defines the size of the game and aspect ratio of the canvas. The pitch will be contained within this.
export const PITCH_MARGIN = { x: 40, y: 30 }; // gap between pitch boundaries (where the ball is constrained) and the game boundaries (where players are constrained)
export const GOAL_WIDTH = 100; // must be less than game dimensions y - (2 * pitch buffer.y)
export const POST_RADIUS = 6;

export const PLAYER_RADIUS = 10;
export const PLAYER_MASS = 1000;
export const PLAYER_DRAG = 0.07;
export const MOVE_FORCE = 0.4;

export const KICK_FORCE = 0.15;
export const KICK_COOLDOWN_MS = 200;
export const KICK_RADIUS = 16;

export const BALL_RADIUS = 7;
export const BALL_MASS = 10;
export const BALL_DRAG = 0.01;
export const BALL_BOUNCINESS = 0.7;

export enum Team {
  Red,
  Blue,
}
