import Matter from 'matter-js';
import { MOVE_FORCE, GAME_BOUNDARY_DIMENSIONS, GAME_FRAMERATE_HZ, BALL_RADIUS, KICK_FORCE, Team, KICK_RADIUS } from '../config';
import { EventEmitter } from '../Events';
import { PeerId, RenderableGameState, Input, Vector2 } from '../types';
import { createGameBoundary, serialisePlayers, createBallBody, scale, subtract, normalise, sqrMagnitude, createPlayerBody, round } from './helpers';
import { pitchBodies } from './pitch';
import { getLocalInput } from '../input';

// Reduce velocity threshold required for engine to calculate ball bounces
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Matter.Resolver as any)._restingThresh = 0.04;

type GameEngineEvents = {
  update: (gameState: RenderableGameState) => void;
  gameEvent: (eventName: string) => void;
}

export type PlayerGameObject = {
  team: Team;
  // body: Matter.Body;
  // isKicking: boolean;
}

const MS_PER_FRAME = 1000 / GAME_FRAMERATE_HZ;
const squareOfKickAndBallRadiusSum = (KICK_RADIUS + BALL_RADIUS) ** 2;

class Engine extends EventEmitter<GameEngineEvents> {
  private isRunning = false;
  private players: Map<PeerId, PlayerGameObject> = new Map();
  private engine!: Matter.Engine;
  private stateInputHistory: Array<[Input, number, Matter.Body[]]> = [];
  // private localPlayerBody!: Matter.Body;
  // private ballBody!: Matter.Body;

  constructor() {
    super();
    this.engine = Matter.Engine.create();
    this.engine.gravity.scale = 0;
  }

  public start(localPlayerId: PeerId, team = Team.Blue) {
    const ballBody = createBallBody(scale(GAME_BOUNDARY_DIMENSIONS, 0.5));
    const localPlayerBody = createPlayerBody({
      x: GAME_BOUNDARY_DIMENSIONS.x * 0.25 + +(team === Team.Blue) * GAME_BOUNDARY_DIMENSIONS.x * 0.5,
      y: GAME_BOUNDARY_DIMENSIONS.y / 2,
    });
    this.players.set(localPlayerId, { team });

    Matter.Composite.add(this.engine.world, [
      localPlayerBody,
      ballBody,
      ...createGameBoundary(GAME_BOUNDARY_DIMENSIONS),
      ...pitchBodies,
    ]);



    // const applyInputs = (inputs: Map<PeerId, Input>) => Array
    //   .from(inputs)
    //   .forEach(([playerId, { x, y, isKicking }]) => {
    //     const player = this.players.get(playerId);
    //     if (!player) {
    //       console.error('received input for player that does not exist in game!', playerId);
    //       return;
    //     }
    //     player.isKicking = isKicking;
    //     Matter.Body.applyForce(player.body, player.body.position, scale({ x, y }, MOVE_FORCE));

    //     if (isKicking && Date.now() > player.lastKick + KICK_COOLDOWN_MS) {
    //       const distanceVector = subtract(ball.position, player.body.position);
    //       if (sqrMagnitude(distanceVector) > squareOfKickAndBallRadiusSum) return;
    //       const ballDirection = normalise(distanceVector);
    //       Matter.Body.applyForce(ball, ball.position, scale(ballDirection, KICK_FORCE));
    //       player.lastKick = Date.now();
    //     }
    //   });

    const applyLocalInput = ({ x, y, kick }: Input) => {
      Matter.Body.applyForce(localPlayerBody, localPlayerBody.position, scale({ x, y }, MOVE_FORCE));

      if (kick) {
        const distanceVector = subtract(ballBody.position, localPlayerBody.position);
        if (sqrMagnitude(distanceVector) > squareOfKickAndBallRadiusSum) return;
        const ballDirection = normalise(distanceVector);
        Matter.Body.applyForce(ballBody, ballBody.position, scale(ballDirection, KICK_FORCE));
      }
    };

    // const gameTick = (deltaTime: DOMHighResTimeStamp) => {
    //   const localInput = getLocalInput();
    //   this.stateInputHistory.push({
    //     localInput, 
    //     localPlayerBody,
    //     ballBody,
    //     deltaTime, 
    //     allBodies: Matter.Composite.allBodies(this.engine.world),
    //   });

    //   const renderableGameState = {
    //     ball: round(ballBody.position),
    //     players: Array.from(this.players).map(serialisePlayers), // need to include kick state
    //   };

    //   applyLocalInput(localInput);
    //   Matter.Engine.update(this.engine, deltaTime);
    //   this.emit('update', renderableGameState);
    // };

    // const onAnimationFrame = (timestamp: DOMHighResTimeStamp) => {
    //   if (!this.isRunning) return;
    //   const deltaTime = timestamp - lastFrameTimeMs;
    //   if (deltaTime > MS_PER_FRAME) {
    //     gameTick(deltaTime);
    //     lastFrameTimeMs = timestamp - (deltaTime % MS_PER_FRAME);
    //   }
    //   window.requestAnimationFrame(onAnimationFrame);
    // };

    // this.isRunning = true;
    // let lastFrameTimeMs: DOMHighResTimeStamp = performance.now();
    // onAnimationFrame(lastFrameTimeMs);
  }

  public stop() {
    this.isRunning = false;
    // TODO: teardown engine
  }

  public addPlayer(id: PeerId, team: Team) {
    return;
    const body = createPlayerBody({
      x: GAME_BOUNDARY_DIMENSIONS.x * 0.25 + +(team === Team.Blue) * GAME_BOUNDARY_DIMENSIONS.x * 0.5,
      y: GAME_BOUNDARY_DIMENSIONS.y / 2,
    });
    this.players.set(id, { body, team });
    Matter.Composite.add(this.engine.world, body);
  }

  public removePlayer(id: PeerId) {
    const playerBody = this.players.get(id)?.body;
    if (!this.players.delete(id)) {
      console.error('tried to remove player from engine but they did not exist!', id);
      return;
    }
    Matter.Composite.remove(this.engine.world, playerBody!);
  }

  private rollbackAndReapply(state: Matter.Body[], index: number) {
    Matter.Composite.clear(this.engine.world, false);
    Matter.Composite.add(this.engine.world, state);
    this.stateInputHistory = this.stateInputHistory.slice(index);

    this.stateInputHistory.forEach(([input, deltaTime]) => {

      Matter.Engine.update(this.engine, deltaTime);
    });
  }
}

export const GameEngine = new Engine();