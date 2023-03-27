import Matter from 'matter-js';
import { PLAYER_SIZE, MOVE_FORCE } from './config';
import { EventEmitter } from './Events';
import { PeerId, BroadcastedGameState, Vector2, PlayerInputs } from './types';

type GameEngineEvents = {
  update: (
    gameState: BroadcastedGameState,
    applyInputs: (inputs: PlayerInputs) => void,
  ) => void;
  gameEvent: (eventName: string) => void;
}

// type PlayerGameObject = {
//   name: string;
//   team: Team;
//   body: Matter.Body;
// }

const scaleVector2 = ({ x, y }: Vector2, scalar: number): Vector2 => ({ x: x * scalar, y: y * scalar });

export class GameEngine extends EventEmitter<GameEngineEvents> {
  private tickPeriod: number;
  private gameIntervalId!: number;
  private players: Map<PeerId, Matter.Body> = new Map();
  private gameDimensions: Vector2;
  private engine!: Matter.Engine;

  constructor(gameDimensions: Vector2, frameRateHz: number) {
    super();
    this.gameDimensions = gameDimensions;
    this.tickPeriod = 1000 / frameRateHz;
    this.engine = Matter.Engine.create();
    this.engine.gravity.scale = 0;
  }

  public start() {
    const boundaries = createBoundaries(this.gameDimensions);
    const boxes = createBoxes(this.gameDimensions);
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
      const gameState = {
        boundaries: boundaries.map(getVertices),
        boxes: boxes.map(getVertices),
        players: [...this.players].map(([id, body]) => ({
          id,
          position: body.position,
        })),
      };

      this.emit('update', gameState, applyInputs);
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
    if (!this.players.delete(id)) {
      console.error('tried to remove player from engine but they did not exist!', id);
      return;
    }
    Matter.Composite.remove(this.engine.world, body!);
  }
}

const createBoundaries = (gameDimensions: Vector2, wallThickness = 20) => [
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

const createBoxes = (gameDimensions: Vector2, number = 40, size = 20) => [...Array(number)].map(() =>
  Matter.Bodies.rectangle(
    Math.random() * gameDimensions.x,
    Math.random() * gameDimensions.y,
    Math.random() * size + size,
    Math.random() * size + size,
  ),
);

const getVertices = (body: Matter.Body): Vector2[] => body.vertices.map(({ x, y }) => ({ x, y })); // needed to get rid of all the extra crap and circular refs
