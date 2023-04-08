import RAPIER from '@dimforge/rapier2d';
import { EventEmitter } from '../Events';
import { Team, GAME_BOUNDARY_DIMENSIONS, MOVE_FORCE, KICK_FORCE } from '../config';
import { BroadcastedGameState, PeerId, Input } from '../types';
import { createBallBody, scale, createPlayerBody, createGameBoundary, subtract, sqrMagnitude, normalise } from './helpers';
import { pitchBodies } from './pitch';
import { getLocalInput } from '../input';

type GameEngineEvents = {
  update: (gameState: BroadcastedGameState) => void;
  gameEvent: (eventName: string) => void;
}

export type PlayerGameObject = {
  team: Team;
  // body: Matter.Body;
  // isKicking: boolean;
}

class Engine extends EventEmitter<GameEngineEvents> {
  private isRunning = false;
  private players: Map<PeerId, PlayerGameObject> = new Map();
  private engine!: Matter.Engine;
  private stateInputHistory: Array<[Input, number, Matter.Body[]]> = [];
  // private localPlayerBody!: Matter.Body;
  // private ballBody!: Matter.Body;

  constructor() {
    super();
  }

  public start(localPlayerId: PeerId, team = Team.Blue) {

    let history = [];

    let world = new RAPIER.World({ x: 0, y: 0 });

    // outer bounds
    const halfBoundsDimensions = { x: 100, y: 50 };
    const bounds = [
      [{ x: 0, y: 0 }, { x: 0, y: 1 }], // top
      [{ x: 0, y: halfBoundsDimensions.y * 2 }, { x: 0, y: -1 }], // bottom
      [{ x: 0, y: 0 }, { x: 1, y: 0 }], // left
      [{ x: halfBoundsDimensions.x * 2, y: 0 }, { x: -1, y: 0 }], // right
    ];
    bounds.forEach(([position, normal]) => world.createCollider(
      RAPIER.ColliderDesc.halfspace(normal),
      world.createRigidBody(RAPIER.RigidBodyDesc.fixed()
        .setTranslation(position.x, position.y)),
    ));

    // pitch

    // ball
    const ballRb = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(halfBoundsDimensions.x, halfBoundsDimensions.y)
        .setLinearDamping(0.5),
    );
    const ballHandle = ballRb.handle;

    const ballCollider = world.createCollider(
      RAPIER.ColliderDesc.ball(0.1),
      ballRb,
    );

    setInterval(() => {
      const i = Math.floor(Math.random() * history.length);
      console.log('rolling back', {
        i,
        historyLength: history.length,
      });
      rollback(i);
    }, 5000);

    const rollback = (stateIndex) => {
      history = history.slice(stateIndex);
      world = RAPIER.World.restoreSnapshot(history[0].snapshot);
      const b = world.getRigidBody(ballHandle);
      history.slice(1).forEach(({ input }) => {
        b.addForce({ x: input.x, y: input.y }, true);
        world.step();
        b.resetForces(true);
      });
    };

    const gameLoop = () => {
      const { x, y } = getLocalInput();
      history.push({
        input: { x, y },
        snapshot: world.takeSnapshot(),
      });

      const b = world.getRigidBody(ballHandle);
      b.addForce({ x, y }, true);
      world.step();
      b.resetForces(true);
      const gameState = {
        players: [],
        ball: scale(b.translation(), 4),
      };

      this.emit('update', gameState);

      setTimeout(gameLoop, 16);
    };

    gameLoop();


    // const ballBody = createBallBody(scale(GAME_BOUNDARY_DIMENSIONS, 0.5));
    // const localPlayerBody = createPlayerBody({
    //   x: GAME_BOUNDARY_DIMENSIONS.x * 0.25 + +(team === Team.Blue) * GAME_BOUNDARY_DIMENSIONS.x * 0.5,
    //   y: GAME_BOUNDARY_DIMENSIONS.y / 2,
    // });
    // this.players.set(localPlayerId, { team });

    // Matter.Composite.add(this.engine.world, [
    //   localPlayerBody,
    //   ballBody,
    //   ...createGameBoundary(GAME_BOUNDARY_DIMENSIONS),
    //   ...pitchBodies,
    // ]);



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

    // const applyLocalInput = ({ x, y, kick }: Input) => {
    //   Matter.Body.applyForce(localPlayerBody, localPlayerBody.position, scale({ x, y }, MOVE_FORCE));

    //   if (kick) {
    //     const distanceVector = subtract(ballBody.position, localPlayerBody.position);
    //     if (sqrMagnitude(distanceVector) > squareOfKickAndBallRadiusSum) return;
    //     const ballDirection = normalise(distanceVector);
    //     Matter.Body.applyForce(ballBody, ballBody.position, scale(ballDirection, KICK_FORCE));
    //   }
    // };

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
    // this.isRunning = false;
    // TODO: teardown engine
  }

  public addPlayer(id: PeerId, team: Team) {
    return;
    // const body = createPlayerBody({
    //   x: GAME_BOUNDARY_DIMENSIONS.x * 0.25 + +(team === Team.Blue) * GAME_BOUNDARY_DIMENSIONS.x * 0.5,
    //   y: GAME_BOUNDARY_DIMENSIONS.y / 2,
    // });
    // this.players.set(id, { body, team });
    // Matter.Composite.add(this.engine.world, body);
  }

  public removePlayer(id: PeerId) {
    // const playerBody = this.players.get(id)?.body;
    // if (!this.players.delete(id)) {
    //   console.error('tried to remove player from engine but they did not exist!', id);
    //   return;
    // }
    // Matter.Composite.remove(this.engine.world, playerBody!);
  }

  private rollbackAndReapply(state: Matter.Body[], index: number) {

  }
}

export const GameEngine = new Engine();


