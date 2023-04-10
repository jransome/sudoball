import RAPIER from '@dimforge/rapier2d';
import { EventEmitter } from '../Events';
import { Team, GAME_BOUNDARY_DIMENSIONS, MOVE_FORCE, KICK_FORCE, BALL_RADIUS, KICK_RADIUS, GAME_FRAMERATE_HZ } from '../config';
import { RenderableGameState, PeerId, Input, Vector2, TransmittedInput, PlayerInputsSnapshot, InitPlayer } from '../types';
import { createBallBody, createPlayerBody, createGameBoundary } from './helpers';
import { pitchBodies } from './pitch';
import { getLocalInput } from '../input';

const scale = (vector: Vector2, scalar: number) => ({ x: vector.x * scalar, y: vector.y * scalar });
const subtract = (v1: Vector2, v2: Vector2) => ({ x: v1.x - v2.y, y: v1.y - v2.y });
const sqrMagnitude = (vector: Vector2) => (vector.x ** 2) + (vector.y ** 2);
const normalise = (vector: Vector2) => {
  const magnitude = Math.sqrt(sqrMagnitude(vector));
  return { x: vector.x / magnitude, y: vector.y / magnitude };
};

type GameEngineEvents = {
  update: (transmissibleInput: TransmittedInput, gameState: RenderableGameState) => void;
  gameEvent: (eventName: string) => void;
}

const squareOfKickAndBallRadiusSum = (KICK_RADIUS + BALL_RADIUS) ** 2;
const MS_PER_FRAME = 1000 / GAME_FRAMERATE_HZ;

export class PredictiveGameEngine extends EventEmitter<GameEngineEvents> {
  private localPlayerId: PeerId;
  private isRunning = false;
  private world: RAPIER.World;
  private stateInputHistory: Array<{ localInput: TransmittedInput; snapshot: Uint8Array; }> = [];

  private ballHandle: number;

  private lastAuthoritativeUpdateIndex = 0;
  private peerIdWorldHandleMap = new Map<PeerId, number>();
  private lastKnownPlayerInputs: PlayerInputsSnapshot = {}; // TODO make this an array?

  constructor(localPlayerId: PeerId) {
    super();
    this.localPlayerId = localPlayerId;
    this.world = new RAPIER.World({ x: 0, y: 0 });

    // Construct world
    // outer bounds
    const halfBoundsDimensions = { x: 100, y: 50 };
    const bounds = [
      [{ x: 0, y: 0 }, { x: 0, y: 1 }], // top
      [{ x: 0, y: halfBoundsDimensions.y * 2 }, { x: 0, y: -1 }], // bottom
      [{ x: 0, y: 0 }, { x: 1, y: 0 }], // left
      [{ x: halfBoundsDimensions.x * 2, y: 0 }, { x: -1, y: 0 }], // right
    ];
    bounds.forEach(([position, normal]) => this.world.createCollider(
      RAPIER.ColliderDesc.halfspace(normal),
      this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed()
        .setTranslation(position.x, position.y)),
    ));

    // pitch

    // ball
    const ballRb = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(halfBoundsDimensions.x, halfBoundsDimensions.y)
        .setLinearDamping(0.5),
    );
    this.ballHandle = ballRb.handle;

    this.world.createCollider(
      RAPIER.ColliderDesc.ball(0.1),
      ballRb,
    );

  }

  public start(players: InitPlayer[]) {
    players.forEach(({ peerId, team }) => {
      const playerRb = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(0, 100)
          .setLinearDamping(0.5),
      );
      this.peerIdWorldHandleMap.set(peerId, playerRb.handle);
      this.lastKnownPlayerInputs[peerId] = { i: 0, kick: false, movement: { x: 0, y: 0 } };

      this.world.createCollider(
        RAPIER.ColliderDesc.ball(0.2),
        playerRb,
      );
    });




    // setTimeout(() => {
    //   setInterval(() => {
    //     // const i = Math.floor(Math.random() * history.length);
    //     const i = Math.floor(history.length / 2);
    //     console.log('rolling back', {
    //       i,
    //       historyLength: history.length,
    //     });
    //     rollback(i);
    //   }, 200);
    // }, 3000);


    const gameTick = (tickIndex: number) => {
      if (!this.isRunning) return;

      const localInput = { i: tickIndex, ...getLocalInput() };

      this.stateInputHistory.push({
        localInput,
        snapshot: this.world.takeSnapshot(),
      });

      this.emit('update', localInput, this.updateWorld(localInput));
      setTimeout(() => gameTick(tickIndex + 1), MS_PER_FRAME);
    };

    this.isRunning = true;
    gameTick(0);

    // const onAnimationFrame = (timestamp: DOMHighResTimeStamp) => {
    //   // if (!this.isRunning) return;
    //   const deltaTime = timestamp - lastFrameTimeMs;
    //   if (deltaTime > MS_PER_FRAME) {
    //     gameLoop();
    //     lastFrameTimeMs = timestamp - (deltaTime % MS_PER_FRAME);
    //   }
    //   window.requestAnimationFrame(onAnimationFrame);
    // };

    // this.isRunning = true;
    // let lastFrameTimeMs: DOMHighResTimeStamp = performance.now();
    // onAnimationFrame(lastFrameTimeMs);

  }

  public dispose() {
    this.removeAllListeners();
    this.isRunning = false;
    this.world.free();
  }

  public reconcileAuthoritativeUpdate(inputs: PlayerInputsSnapshot) {
    if (inputs[this.localPlayerId].i !== this.lastAuthoritativeUpdateIndex + 1) {
      throw new Error('Out of order state update from host');
    }
    // should we also check the ball position?

    // check if there are divergences, if yes replay
    const playerCountEqual = Object.keys(this.lastKnownPlayerInputs).length === Object.keys(inputs).length;
    const predictionsCorrect = playerCountEqual && Object
      .entries(inputs)
      .some(([peerId, input]) => {
        const lastInput = this.lastKnownPlayerInputs[peerId];
        return lastInput
          && lastInput.movement.x === input.movement.x
          && lastInput.movement.y === input.movement.y
          && lastInput.kick === input.kick;
      });

    if (predictionsCorrect) {
      return;
    }

    // remove dropped player(s)
    if (!playerCountEqual) {
      Object
        .keys(this.lastKnownPlayerInputs)
        .filter(id => !Object.keys(inputs).includes(id))
        .forEach(missingId => this.world.removeRigidBody(
          this.world.getRigidBody(this.peerIdWorldHandleMap.get(missingId)!),
        ));
    }

    this.lastKnownPlayerInputs = inputs;
    this.replayFromIndex(inputs[this.localPlayerId].i);
    this.lastAuthoritativeUpdateIndex++;
  }

  private replayFromIndex(index: number) {
    this.stateInputHistory = this
      .stateInputHistory
      .slice(this.stateInputHistory.findIndex(h => h.localInput.i === index));

    this.world = RAPIER.World.restoreSnapshot(this.stateInputHistory[0].snapshot);
    this.stateInputHistory.forEach(({ localInput }) => this.updateWorld(localInput));
  }

  private updateWorld(localInput: TransmittedInput): RenderableGameState {
    // apply local player input and last known inputs of all other players
    this.lastKnownPlayerInputs[this.localPlayerId] = localInput;
    const ball = this.world.getRigidBody(this.ballHandle);

    const getPlayerInfos = Object
      .entries(this.lastKnownPlayerInputs)
      .map(([peerId, input]) => {
        const rb = this.world.getRigidBody(this.peerIdWorldHandleMap.get(peerId)!);
        this.applyInputs(input, rb, ball);
        return () => ({ id: peerId, team: Team.Blue, position: rb.translation(), isKicking: input.kick });
      });

    this.world.step();

    return {
      ball: ball.translation(),
      players: getPlayerInfos.map(getInfo => getInfo()),
    };
  }

  private applyInputs(input: TransmittedInput, player: RAPIER.RigidBody, ball: RAPIER.RigidBody) {
    player.applyImpulse(scale(input.movement, 0.05), true);

    if (input.kick) {
      const distanceVector = subtract(ball.translation(), player.translation());
      if (sqrMagnitude(distanceVector) > squareOfKickAndBallRadiusSum) return;
      const ballDirection = normalise(distanceVector);
      ball.applyImpulse(scale(ballDirection, KICK_FORCE), true);
    }
  }
}
