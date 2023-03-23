import Matter, {
  Bodies,
  Body,
  Composite,
  Engine,
} from 'matter-js';
import { EventEmitter } from './Events';
import { GameObjects, Vector2 } from './types';

type GameEngineEvents = {
  update: (gameObjects: GameObjects, sendInputs: (inputs: Vector2) => void) => void;
  gameEvent: (eventName: string) => void;
}

type DynamicBodies = {
  boxes: Matter.Body[];
  boundaries: Matter.Body[];
  player: Matter.Body;
  all: Matter.Body[];
}

const PLAYER_SIZE = 20;
const MOVE_FORCE = 0.001;

export class GameEngine extends EventEmitter<GameEngineEvents> {
  private tickPeriod: number;
  private gameIntervalId!: number;
  private bodies: DynamicBodies;

  constructor(canvasDimensions: Vector2, frameRateHz: number) {
    super();
    this.tickPeriod = 1000 / frameRateHz;
    this.bodies = testSetup(canvasDimensions);
  }

  public start() {
    const engine = Engine.create();
    engine.gravity.scale = 0;
    Composite.add(engine.world, this.bodies.all);

    this.gameIntervalId = window.setInterval(() => {
      const getInputs = (playerInput: Vector2) => {
        const playerForce = { x: playerInput.x * MOVE_FORCE, y: playerInput.y * MOVE_FORCE };
        Body.applyForce(this.bodies.player, this.bodies.player.position, playerForce);
      };

      // Body.applyForce(player, player.position, getPlayerForce());
      this.emit('update', {
        boundaries: this.bodies.boundaries.map(getVertices),
        boxes: this.bodies.boxes.map(getVertices),
        player: {
          position: this.bodies.player.position,
          radius: PLAYER_SIZE,
        },
      }, getInputs);

      Engine.update(engine, this.tickPeriod);
    }, this.tickPeriod);
  }

  public stop() {
    if (this.gameIntervalId)
      window.clearInterval(this.gameIntervalId);
  }
}

function testSetup(canvasDimensions: Vector2) {
  const nBoxes = 40;
  const boxSize = 20;
  const wallThickness = 20;

  const boxes = [...Array(nBoxes)].map(() =>
    Bodies.rectangle(
      Math.random() * canvasDimensions.x,
      Math.random() * canvasDimensions.y,
      Math.random() * boxSize + boxSize,
      Math.random() * boxSize + boxSize,
    ),
  );

  const boundaries = [
    Bodies.rectangle(
      canvasDimensions.x / 2, 0,
      canvasDimensions.x,
      wallThickness,
      { isStatic: true },
    ),
    Bodies.rectangle(
      0, canvasDimensions.y / 2,
      wallThickness,
      canvasDimensions.y,
      { isStatic: true },
    ),
    Bodies.rectangle(
      canvasDimensions.x,
      canvasDimensions.x / 2,
      wallThickness,
      canvasDimensions.x,
      { isStatic: true },
    ),
    Bodies.rectangle(
      canvasDimensions.x / 2,
      canvasDimensions.y,
      canvasDimensions.x,
      wallThickness,
      { isStatic: true },
    ),
  ];

  const player = Bodies.circle(
    Math.random() * canvasDimensions.x,
    Math.random() * canvasDimensions.y,
    PLAYER_SIZE,
  );

  return {
    player,
    boundaries,
    boxes,
    get all() {
      return [...this.boundaries, ... this.boxes, player];
    },
  };
}

const getVertices = (body: Matter.Body): Vector2[] => body.vertices.map(({ x, y }) => ({ x, y })); // needed to get rid of all the extra crap and circular refs




