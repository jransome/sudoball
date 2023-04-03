import Matter, { IChamferableBodyDefinition } from 'matter-js';
import { GAME_BOUNDARY_DIMENSIONS, PITCH_MARGIN, GOAL_WIDTH, POST_RADIUS } from '../config';
import { Circle, Vector2 } from '../types';
import { collisionFilters } from './collisionFilters';
import { serialiseVertices, scale } from './helpers';

const serialiseCircle = (body: Matter.Body): Circle => ({ position: body.position, radius: body.circleRadius! });
const createPitchBoundaries = (containerDimensions: Vector2, containerBuffer: Vector2, goalWidth: number) => {
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

export const pitchBodies = createPitchBoundaries(GAME_BOUNDARY_DIMENSIONS, PITCH_MARGIN, GOAL_WIDTH);

export const renderablePitch = {
  polygons: pitchBodies.filter(b => !b.circleRadius).map(serialiseVertices),
  circles: pitchBodies.filter(b => b.circleRadius).map(serialiseCircle),
};
