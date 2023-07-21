import {
  BALL_RADIUS,
  GAME_ENCLOSURE,
  GOAL_DEPTH,
  GOAL_HALF_WIDTH,
  PENALTY_BOX_PANEL_LENGTH,
  PENALTY_POST_HORIZONTAL_DISTANCE_FROM_GOAL,
  SIDE_DEPTH
} from '../config';
import {Vector2} from '../types';
import {scale} from '../vector2Utils';

export const pitchMidpoint = scale(GAME_ENCLOSURE, 0.5);

const upperGoalPostY = pitchMidpoint.y - GOAL_HALF_WIDTH;
const lowerGoalPostY = pitchMidpoint.y + GOAL_HALF_WIDTH;

export const upperPitchVertices: ReadonlyArray<readonly [number, number]> = [
  [0, upperGoalPostY], // top left goal back
  [GOAL_DEPTH, upperGoalPostY], // top left goal post
  [GOAL_DEPTH, SIDE_DEPTH], // top left
  [GAME_ENCLOSURE.x - GOAL_DEPTH, SIDE_DEPTH], // top right
  [GAME_ENCLOSURE.x - GOAL_DEPTH, upperGoalPostY], // top right goal post
  [GAME_ENCLOSURE.x, upperGoalPostY], // top right goal back
];

export const lowerPitchVertices: ReadonlyArray<readonly [number, number]> = [
  [0, lowerGoalPostY], // bottom left goal back
  [GOAL_DEPTH, lowerGoalPostY], // bottom left goal post
  [GOAL_DEPTH, GAME_ENCLOSURE.y - SIDE_DEPTH], // bottom left
  [GAME_ENCLOSURE.x - GOAL_DEPTH, GAME_ENCLOSURE.y - SIDE_DEPTH], // bottom right
  [GAME_ENCLOSURE.x - GOAL_DEPTH, lowerGoalPostY], // bottom right goal post
  [GAME_ENCLOSURE.x, lowerGoalPostY], // bottom right goal back
];

export const postPositions: ReadonlyArray<readonly [number, number]> = [
  [GOAL_DEPTH, upperGoalPostY], // top left
  [GOAL_DEPTH, lowerGoalPostY], // bottom left
  [GAME_ENCLOSURE.x - GOAL_DEPTH, upperGoalPostY], // top right
  [GAME_ENCLOSURE.x - GOAL_DEPTH, lowerGoalPostY], // bottom right
];

export const halfWayLineVertices: ReadonlyArray<readonly [number, number]> = [
  [pitchMidpoint.x, SIDE_DEPTH], // middle top
  [pitchMidpoint.x, GAME_ENCLOSURE.y - SIDE_DEPTH] // middle bottom
];

export const penaltySpotsVertices: ReadonlyArray<readonly  [number, number]> = [
  [GOAL_DEPTH + PENALTY_POST_HORIZONTAL_DISTANCE_FROM_GOAL, pitchMidpoint.y], // red penalty spot
  [GAME_ENCLOSURE.x - GOAL_DEPTH - PENALTY_POST_HORIZONTAL_DISTANCE_FROM_GOAL, pitchMidpoint.y] // blue penalty spot
];

export const redPenaltyBoxVertices: ReadonlyArray<readonly [number, number]> = [
    [GOAL_DEPTH, upperGoalPostY + PENALTY_BOX_PANEL_LENGTH], // top left
    [GOAL_DEPTH + PENALTY_BOX_PANEL_LENGTH, upperGoalPostY + PENALTY_BOX_PANEL_LENGTH], // top right
    [GOAL_DEPTH + PENALTY_BOX_PANEL_LENGTH, lowerGoalPostY - PENALTY_BOX_PANEL_LENGTH], // bottom right
    [GOAL_DEPTH, lowerGoalPostY - PENALTY_BOX_PANEL_LENGTH] // bottom left
];

export const bluePenaltyBoxVertices: ReadonlyArray<readonly [number, number]> = [
  [GAME_ENCLOSURE.x - GOAL_DEPTH, upperGoalPostY + PENALTY_BOX_PANEL_LENGTH], // top left
  [GAME_ENCLOSURE.x - GOAL_DEPTH - PENALTY_BOX_PANEL_LENGTH, upperGoalPostY + PENALTY_BOX_PANEL_LENGTH], // top right
  [GAME_ENCLOSURE.x - GOAL_DEPTH - PENALTY_BOX_PANEL_LENGTH, lowerGoalPostY - PENALTY_BOX_PANEL_LENGTH], // bottom right
  [GAME_ENCLOSURE.x - GOAL_DEPTH, lowerGoalPostY - PENALTY_BOX_PANEL_LENGTH] // bottom left
];

export const goalSensorSize = [(GOAL_DEPTH - BALL_RADIUS * 2) / 2, GOAL_HALF_WIDTH] as const;
export const goalSensorPositions: ReadonlyArray<readonly [number, number]> = [
  [(GOAL_DEPTH - BALL_RADIUS * 2) / 2, pitchMidpoint.y], // red
  [GAME_ENCLOSURE.x - (GOAL_DEPTH - BALL_RADIUS * 2) / 2, pitchMidpoint.y], // blue
];

export const boundsHalfSpaces: Vector2[][] = [
  [{ x: 0, y: 0 }, { x: 0, y: 1 }], // top (position and normal)
  [{ x: 0, y: GAME_ENCLOSURE.y }, { x: 0, y: -1 }], // bottom
  [{ x: 0, y: 0 }, { x: 1, y: 0 }], // left
  [{ x: GAME_ENCLOSURE.x, y: 0 }, { x: -1, y: 0 }], // right
];
