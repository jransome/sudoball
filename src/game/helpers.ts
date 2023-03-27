import Matter from 'matter-js';
import { Vector2, PeerId } from '../types';

export const scaleVector2 = ({ x, y }: Vector2, scalar: number): Vector2 => ({ x: x * scalar, y: y * scalar });

export const serialiseVertices = (body: Matter.Body): Vector2[] => body.vertices.map(({ x, y }) => ({ x, y }));
export const serialisePlayers = ([id, body]: [PeerId, Matter.Body]) => ({
  id,
  position: body.position,
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
];

export const createBoxes = (gameDimensions: Vector2, number = 40, size = 20) => [...Array(number)].map(() =>
  Matter.Bodies.rectangle(
    Math.random() * gameDimensions.x,
    Math.random() * gameDimensions.y,
    Math.random() * size + size,
    Math.random() * size + size,
  ),
);
