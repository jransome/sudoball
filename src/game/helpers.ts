import Matter, { IChamferableBodyDefinition } from 'matter-js';
import { BALL_BOUNCINESS, BALL_DRAG, BALL_MASS, BALL_RADIUS, PLAYER_DRAG, PLAYER_MASS, PLAYER_RADIUS } from '../config';
import { Vector2, PeerId } from '../types';
import { PlayerGameObject } from './GameEngine';
import { collisionFilters } from './collisionFilters';

export const { normalise, mult: scale, sub: subtract, magnitudeSquared: sqrMagnitude } = Matter.Vector;

export const round = (vector: Vector2): Vector2 => ({ x: +vector.x.toFixed(3), y: +vector.y.toFixed(3) });
export const serialiseVertices = (body: Matter.Body): Vector2[] => body.vertices.map(({ x, y }) => ({ x, y }));
export const serialisePlayers = ([id, player]: [PeerId, PlayerGameObject]) => ({
  id,
  position: round(player.body.position),
  isKicking: player.isKicking,
});

export const createGameBoundary = (dimensions: Vector2, boundaryThickness = 40) => {
  const boundaryProperties: IChamferableBodyDefinition = {
    isStatic: true,
    restitution: 0,
    collisionFilter: collisionFilters.gameBoundary,
  };
  return [
    Matter.Bodies.rectangle( // top
      dimensions.x / 2, -boundaryThickness / 2,
      dimensions.x, boundaryThickness,
      boundaryProperties,
    ),
    Matter.Bodies.rectangle( // bottom
      dimensions.x / 2, dimensions.y + boundaryThickness / 2,
      dimensions.x, boundaryThickness,
      boundaryProperties,
    ),
    Matter.Bodies.rectangle( // left
      -boundaryThickness / 2, dimensions.y / 2,
      boundaryThickness, dimensions.y,
      boundaryProperties,
    ),
    Matter.Bodies.rectangle( // right
      dimensions.x + boundaryThickness / 2, dimensions.x / 2,
      boundaryThickness, dimensions.x,
      boundaryProperties,
    ),
  ];
};

export const createBallBody = (position: Vector2) => Matter.Bodies.circle(position.x, position.y, BALL_RADIUS, {
  restitution: BALL_BOUNCINESS,
  mass: BALL_MASS,
  frictionAir: BALL_DRAG,
  friction: 0,
  inertia: Infinity,
  collisionFilter: collisionFilters.ball,
});

export const createPlayerBody = (position: Vector2) => Matter.Bodies.circle(position.x, position.y, PLAYER_RADIUS, {
  restitution: 0,
  mass: PLAYER_MASS,
  frictionAir: PLAYER_DRAG,
  collisionFilter: collisionFilters.player,
});
