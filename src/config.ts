import { scale } from './vector2Utils';

// network
export const GAME_FRAMERATE_HZ = 60;
export const INPUT_SEND_RATE_HZ = 40; // rate at which client inputs are polled and sent to host
export const THRESHOLD_INPUT_CONSIDERED_LAGGING_MS = 100;
export const MAX_TOLERATED_INPUT_LATENCY_MS = 200;

// pitch - si units
export const GAME_ENCLOSURE = { x: 40, y: 20 }; // size of rect defined by halfspace colliders
export const GOAL_HALF_WIDTH = 2.5;
export const GOAL_DEPTH = 2;
export const SIDE_DEPTH = 1.2;
export const POST_RADIUS = 0.3;

// canvas
export const CANVAS_SHARPNESS_FACTOR = 3;
export const PIXELS_PER_METER = 30;
export const CANVAS_NATIVE_RESOLUTION = scale(GAME_ENCLOSURE, PIXELS_PER_METER);

// players
export const PLAYER_RADIUS = 0.5;
export const PLAYER_MASS = 10;
export const PLAYER_DRAG = 4;
export const MOVE_FORCE = 5;
export const KICK_FORCE = 32;
export const KICK_RADIUS = 0.75;

// ball
export const BALL_RADIUS = 0.35;
export const BALL_MASS = 1;
export const BALL_DRAG = 0.9;
export const BALL_BOUNCINESS = 0.8;
