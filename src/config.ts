import { Team } from './enums';
import { scale } from './vector2Utils';

// network
export const GAME_FRAMERATE_HZ = 60;
export const INPUT_SEND_RATE_HZ = 40; // rate at which client inputs are polled and sent to host
export const THRESHOLD_INPUT_CONSIDERED_LAGGING_MS = 100;
export const MAX_TOLERATED_INPUT_LATENCY_MS = 200;
export const POSITION_DECIMAL_PLACES = 2; // vector numbers are rounded to this many dps before being sent over the network

// pitch - si units
export const GAME_ENCLOSURE = { x: 40, y: 20 }; // size of rect defined by halfspace colliders
export const GOAL_HALF_WIDTH = 2.5;
export const GOAL_DEPTH = 2;
export const SIDE_DEPTH = 1.2;
export const POST_RADIUS = 0.3;
export const SPOT_RADIUS = 0.1;
export const PITCH_CIRCLE_RADIUS = 4;
export const PENALTY_BOX_PANEL_WIDTH = 7.3;
export const PENALTY_BOX_PANEL_LENGTH = 6.4;
export const PENALTY_ARC_ANGLE = 53;

// canvas
export const CANVAS_MAX_ON_SCREEN_WIDTH_PX = 1500;
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

export const TEAM_COLOURS: Record<Team, string> = {
  [Team.None]: 'grey',
  [Team.Red]: 'coral',
  [Team.Blue]: 'skyblue',
};

// ball
export const BALL_RADIUS = 0.35;
export const BALL_MASS = 1;
export const BALL_DRAG = 0.9;
export const BALL_BOUNCINESS = 0.8;
