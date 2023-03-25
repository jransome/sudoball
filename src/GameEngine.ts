import Matter from 'matter-js';
import { PLAYER_SIZE, MOVE_FORCE } from './config';
import { EventEmitter } from './Events';
import { PeerId, GameObjects, Vector2, PlayerInputs } from './types';

type GameEngineEvents = {
  update: (
    gameObjects: GameObjects,
    applyInputs: (inputs: PlayerInputs) => void,
  ) => void;
  gameEvent: (eventName: string) => void;
}

const scaleVector2 = ({ x, y }: Vector2, scalar: number): Vector2 => ({ x: x * scalar, y: y * scalar });

export class GameEngine extends EventEmitter<GameEngineEvents> {
  private tickPeriod: number;
  private gameIntervalId!: number;
  private players: Map<PeerId, Matter.Body> = new Map();
  private canvasDimensions: Vector2;
  private engine!: Matter.Engine;

  constructor(canvasDimensions: Vector2, frameRateHz: number) {
    super();
    this.canvasDimensions = canvasDimensions;
    this.tickPeriod = 1000 / frameRateHz;
    this.engine = Matter.Engine.create();
    this.engine.gravity.scale = 0;
  }

  public start() {
    const boundaries = createBoundaries(this.canvasDimensions);
    const boxes = createBoxes(this.canvasDimensions);
    Matter.Composite.add(this.engine.world, [
      ...boundaries,
      ...boxes,
    ]);

    const applyInputs = (inputs: PlayerInputs) => Object.entries(inputs).forEach(([playerId, inputVector]) => {
      const playerBody = this.players.get(playerId);
      if (!playerBody) {
        console.error('received input for player that does not exist in game!', playerId);
        return;
      }
      Matter.Body.applyForce(playerBody, playerBody.position, scaleVector2(inputVector, MOVE_FORCE));
    });

    this.gameIntervalId = window.setInterval(() => {
      const gameObjects = {
        boundaries: boundaries.map(getVertices), // TODO: don't send over RTC
        boxes: boxes.map(getVertices),
        players: [...this.players.entries()].map(([id, body]) => ({
          id,
          position: body.position,
          radius: PLAYER_SIZE, // TODO: don't send over RTC
        })),
      };

      this.emit('update', gameObjects, applyInputs);
      Matter.Engine.update(this.engine, this.tickPeriod);
    }, this.tickPeriod);
  }

  public stop() {
    if (this.gameIntervalId)
      window.clearInterval(this.gameIntervalId);

    // TODO: teardown engine
  }

  public addPlayer(id: PeerId) {
    const body = Matter.Bodies.circle(100, 150, PLAYER_SIZE);
    this.players.set(id, body);
    Matter.Composite.add(this.engine.world, body);
  }

  public removePlayer(id: PeerId) {
    const body = this.players.get(id);
    if (!body) return;
    this.players.delete(id);
    Matter.Composite.remove(this.engine.world, body);
  }
}

const createBoundaries = (canvasDimensions: Vector2, wallThickness = 20) => [
  Matter.Bodies.rectangle(
    canvasDimensions.x / 2, 0,
    canvasDimensions.x,
    wallThickness,
    { isStatic: true },
  ),
  Matter.Bodies.rectangle(
    0, canvasDimensions.y / 2,
    wallThickness,
    canvasDimensions.y,
    { isStatic: true },
  ),
  Matter.Bodies.rectangle(
    canvasDimensions.x,
    canvasDimensions.x / 2,
    wallThickness,
    canvasDimensions.x,
    { isStatic: true },
  ),
  Matter.Bodies.rectangle(
    canvasDimensions.x / 2,
    canvasDimensions.y,
    canvasDimensions.x,
    wallThickness,
    { isStatic: true },
  ),
];

const createBoxes = (canvasDimensions: Vector2, number = 40, size = 20) => [...Array(number)].map(() =>
  Matter.Bodies.rectangle(
    Math.random() * canvasDimensions.x,
    Math.random() * canvasDimensions.y,
    Math.random() * size + size,
    Math.random() * size + size,
  ),
);

const getVertices = (body: Matter.Body): Vector2[] => body.vertices.map(({ x, y }) => ({ x, y })); // needed to get rid of all the extra crap and circular refs
