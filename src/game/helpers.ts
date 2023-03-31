import Matter from 'matter-js';
import { BALL_BOUNCINESS, BALL_DRAG, BALL_MASS, BALL_RADIUS, PLAYER_DRAG, PLAYER_MASS, PLAYER_RADIUS } from '../config';
import { Vector2, PeerId } from '../types';
import { PlayerGameObject } from './GameEngine';

export const { normalise, mult: scale, sub: subtract, magnitudeSquared: sqrMagnitude } = Matter.Vector;

export const serialiseVertices = (body: Matter.Body): Vector2[] => body.vertices.map(({ x, y }) => ({ x, y }));
export const serialisePlayers = ([id, player]: [PeerId, PlayerGameObject]) => ({
  id,
  position: player.body.position,
  isKicking: player.isKicking,
});

export const createBoundaries = (gameDimensions: Vector2, wallThickness = 20) => [
  Matter.Bodies.rectangle(
    gameDimensions.x / 2, 0,
    gameDimensions.x,
    wallThickness,
    { isStatic: true },
  ),
  Matter.Bodies.rectangle(
    0, gameDimensions.y / 2,
    wallThickness,
    gameDimensions.y,
    { isStatic: true },
  ),
  Matter.Bodies.rectangle(
    gameDimensions.x,
    gameDimensions.x / 2,
    wallThickness,
    gameDimensions.x,
    { isStatic: true },
  ),
  Matter.Bodies.rectangle(
    gameDimensions.x / 2,
    gameDimensions.y,
    gameDimensions.x,
    wallThickness,
    { isStatic: true },
  ),
].map((b) => {
  b.restitution = 0.7;
  return b;
});

export const createBallBody = (position: Vector2) => {
  const body = Matter.Bodies.circle(position.x, position.y, BALL_RADIUS);
  body.restitution = BALL_BOUNCINESS;
  body.mass = BALL_MASS;
  body.frictionAir = BALL_DRAG;
  body.friction = 0;
  body.inertia = Infinity;
  return body;
};

export const createPlayerBody = (position: Vector2) => {
  const body = Matter.Bodies.circle(position.x, position.y, PLAYER_RADIUS);
  body.restitution = 0;
  body.mass = PLAYER_MASS;
  body.frictionAir = PLAYER_DRAG;
  return body;
};
