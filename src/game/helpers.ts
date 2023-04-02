import Matter, { IChamferableBodyDefinition, ICollisionFilter } from 'matter-js';
import { BALL_BOUNCINESS, BALL_DRAG, BALL_MASS, BALL_RADIUS, PLAYER_DRAG, PLAYER_MASS, PLAYER_RADIUS, POST_RADIUS } from '../config';
import { Vector2, PeerId } from '../types';
import { PlayerGameObject } from './GameEngine';

export const { normalise, mult: scale, sub: subtract, magnitudeSquared: sqrMagnitude } = Matter.Vector;

export const serialiseVertices = (body: Matter.Body): Vector2[] => body.vertices.map(({ x, y }) => ({ x, y }));
export const serialisePlayers = ([id, player]: [PeerId, PlayerGameObject]) => ({
  id,
  position: player.body.position,
  isKicking: player.isKicking,
});

const collisionFilters: Record<string, ICollisionFilter> = {
  gameBoundary: { category: 1, mask: 4 | 8 },
  pitchBoundary: { category: 2, mask: 4 },
  ball: { category: 4, mask: 1 | 2 | 4 | 8 },
  player: { category: 8, mask: 1 | 4 | 8 },
};

export const createPitchBoundaries = (containerDimensions: Vector2, containerBuffer: Vector2, goalWidth: number) => {
  const containerCentrePoint = scale(containerDimensions, 0.5);
  const boundaryProperties: IChamferableBodyDefinition = {
    isStatic: true,
    restitution: 0,
    collisionFilter: collisionFilters.pitchBoundary,
  };

  const constructPitchEnd = (goalLineXPosition: number, bufferDepthX: number) => {
    const cornerPieceWidth = (containerDimensions.y - (containerBuffer.y * 2) - goalWidth) / 2;
    const rectangleXPosition = goalLineXPosition - (bufferDepthX / 2);
    return [
      Matter.Bodies.rectangle( // top corner
        rectangleXPosition, containerBuffer.y + cornerPieceWidth / 2,
        containerBuffer.x, cornerPieceWidth,
        boundaryProperties,
      ),
      Matter.Bodies.circle( // post
        goalLineXPosition, containerCentrePoint.y - (goalWidth / 2),
        POST_RADIUS,
        {
          isStatic: true,
          restitution: 0,
        },
      ),
      Matter.Bodies.rectangle( // goal
        rectangleXPosition, containerCentrePoint.y,
        containerBuffer.x, goalWidth,
        {
          isStatic: true,
          restitution: 0,
          isSensor: true,
        },
      ),
      Matter.Bodies.circle( // post
        goalLineXPosition, containerCentrePoint.y + (goalWidth / 2),
        POST_RADIUS,
        {
          isStatic: true,
          restitution: 0,
        },
      ),
      Matter.Bodies.rectangle( // bottom corner
        rectangleXPosition, containerDimensions.y - containerBuffer.y - (cornerPieceWidth / 2),
        containerBuffer.x, cornerPieceWidth,
        boundaryProperties,
      ),
    ];
  };

  return [
    Matter.Bodies.rectangle( // top
      containerCentrePoint.x, (containerBuffer.y / 2),
      containerDimensions.x, containerBuffer.y,
      boundaryProperties,
    ),
    Matter.Bodies.rectangle( // bottom
      containerCentrePoint.x, containerDimensions.y - (containerBuffer.y / 2),
      containerDimensions.x, containerBuffer.y,
      boundaryProperties,
    ),
    ...constructPitchEnd(containerBuffer.x, containerBuffer.x), // left
    ...constructPitchEnd(containerDimensions.x - containerBuffer.x, -containerBuffer.x), // right
  ];
};

export const createGameBoundary = (dimensions: Vector2, boundaryThickness = 20) => {
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
