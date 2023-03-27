import Matter from 'matter-js';
import { PLAYER_SIZE, MOVE_FORCE, GAME_DIMENSIONS, FRAMERATE_HZ } from '../config';
import { EventEmitter } from '../Events';
import { PeerId, BroadcastedGameState, Vector2 } from '../types';
import { createBoundaries, createBoxes, scaleVector2, serialiseVertices, serialisePlayers } from './helpers';

type GameEngineEvents = {
  update: (
    gameState: BroadcastedGameState,
    applyInputs: (inputs: Map<PeerId, Vector2>) => void,
  ) => void;
  gameEvent: (eventName: string) => void;
}

// type PlayerGameObject = {
//   name: string;
//   team: Team;
//   body: Matter.Body;
// }

const engineTickPeriod = 1000 / FRAMERATE_HZ;

class Engine extends EventEmitter<GameEngineEvents> {
  private gameIntervalId!: number;
  private players: Map<PeerId, Matter.Body> = new Map();
  private engine!: Matter.Engine;

  constructor() {
    super();
    this.engine = Matter.Engine.create();
    this.engine.gravity.scale = 0;
  }

  public start() {
    const boundaries = createBoundaries(GAME_DIMENSIONS);
    const boxes = createBoxes(GAME_DIMENSIONS);
    Matter.Composite.add(this.engine.world, [
      ...boundaries,
      ...boxes,
    ]);

    const applyInputs = (inputs: Map<PeerId, Vector2>) => Array
      .from(inputs)
      .forEach(([playerId, inputVector]) => {
        const playerBody = this.players.get(playerId);
        if (!playerBody) {
          console.error('received input for player that does not exist in game!', playerId);
          return;
        }
        Matter.Body.applyForce(playerBody, playerBody.position, scaleVector2(inputVector, MOVE_FORCE));
      });

    this.gameIntervalId = window.setInterval(() => {
      const gameState = {
        boundaries: boundaries.map(serialiseVertices),
        boxes: boxes.map(serialiseVertices),
        players: Array.from(this.players).map(serialisePlayers),
      };

      this.emit('update', gameState, applyInputs);
      Matter.Engine.update(this.engine, engineTickPeriod);
    }, engineTickPeriod);
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

export const GameEngine = new Engine();
