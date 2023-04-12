import RAPIER from '@dimforge/rapier2d';
import { EventEmitter } from '../Events';
import { Team, GAME_BOUNDARY_DIMENSIONS, MOVE_FORCE, KICK_FORCE, BALL_RADIUS, KICK_RADIUS, GAME_FRAMERATE_HZ } from '../config';
import { RenderableGameState, PeerId, Input, Vector2, InputSnapshot, PlayerInputsSnapshot, InitPlayer } from '../types';
import { createBallBody, createPlayerBody, createGameBoundary, round } from './helpers';
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
  update: (transmissibleInput: InputSnapshot, gameState: RenderableGameState) => void;
  gameEvent: (eventName: string) => void;
}

const squareOfKickAndBallRadiusSum = (KICK_RADIUS + BALL_RADIUS) ** 2;
const MS_PER_FRAME = 1000 / GAME_FRAMERATE_HZ;

export class PredictiveGameEngine extends EventEmitter<GameEngineEvents> {
  private localPlayerId: PeerId;
  private isRunning = false;
  private isReplaying = false;
  private world: RAPIER.World;
  private stateInputHistory: Array<{ tickIndex: number; localInput: InputSnapshot; snapshot: Uint8Array; }> = [];

  private ballHandle: number;

  private lastAuthoritativeUpdateIndex = -1;
  private peerIdWorldHandleMap = new Map<PeerId, number>();
  private lastKnownOtherPlayerInputs: PlayerInputsSnapshot = { // TODO make this an array?
    i: 0,
    inputs: {},
  };

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

    players.forEach(({ peerId, team }, i) => {
      const playerRb = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(100 * (i + 1), 100 * (i + 1))
          .setLinearDamping(0.5),
      );
      this.peerIdWorldHandleMap.set(peerId, playerRb.handle);
      if (peerId !== this.localPlayerId) {
        this.lastKnownOtherPlayerInputs.inputs[peerId] = { i: -1, kick: false, movement: { x: 0, y: 0 } };
      }

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

      if (!this.isReplaying) {
        const localInput: InputSnapshot = { i: tickIndex, ...getLocalInput() };

        this.stateInputHistory.push({
          tickIndex,
          localInput,
          snapshot: this.world.takeSnapshot(),
        });

        this.emit('update', localInput, this.updateWorld(localInput));
      }

      // console.table(
      //   [...this.peerIdWorldHandleMap.entries()].sort().map(([id, h]) => ({ id, ...round(this.world.getRigidBody(h).translation()) }))
      // );
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

  public reconcileAuthoritativeUpdate(inputsSnapshot: PlayerInputsSnapshot) {
    // if (inputs[this.localPlayerId].i !== this.lastAuthoritativeUpdateIndex + 1) {
    // console.log('order', {
    //   expected: this.lastAuthoritativeUpdateIndex + 1,
    //   received: inputsSnapshot.i,
    //   diff: this.lastAuthoritativeUpdateIndex + 1 - inputsSnapshot.i,
    // });
    // console.warn(`Received stale update from host, ${(this.lastAuthoritativeUpdateIndex + 1) - inputs[this.localPlayerId].i} frame(s) behind expected.`);
    // return;
    // }
    this.lastAuthoritativeUpdateIndex++;

    // should we also check the ball position?

    // check if there are divergences, if yes replay
    const noPlayersDropped = Object.keys(this.lastKnownOtherPlayerInputs).length === Object.keys(inputsSnapshot).length;
    const predictionsCorrect = Object.entries(inputsSnapshot.inputs)
      .every(([peerId, input]) => {
        const lastInput = this.lastKnownOtherPlayerInputs.inputs[peerId];
        return lastInput
          && lastInput.movement.x === input.movement.x
          && lastInput.movement.y === input.movement.y
          && lastInput.kick === input.kick;
      });

    // console.table({
    //   hostUpdate: inputsSnapshot.inputs[Object.keys(this.lastKnownOtherPlayerInputs.inputs).find(k => k !== this.localPlayerId)!].movement,
    //   lastKnown: this.lastKnownOtherPlayerInputs.inputs[Object.keys(this.lastKnownOtherPlayerInputs.inputs).find(k => k !== this.localPlayerId)!].movement,
    //   predictionsCorrect: noPlayersDropped && predictionsCorrect,
    // });
    if (noPlayersDropped && predictionsCorrect) {
      // console.log('correct');
      return;
    }
    // console.log('replaying...');

    // remove dropped player(s)
    if (!noPlayersDropped) {
      Object
        .keys(this.lastKnownOtherPlayerInputs.inputs)
        .filter(id => !Object.keys(inputsSnapshot.inputs).includes(id))
        .forEach(missingId => this.world.removeRigidBody(
          this.world.getRigidBody(this.peerIdWorldHandleMap.get(missingId)!),
        ));
    }

    this.lastKnownOtherPlayerInputs = inputsSnapshot;
    this.replayFromIndex(inputsSnapshot.i);
  }

  private replayFromIndex(index: number) {
    const replayableHistory = this.stateInputHistory
      .slice(this.stateInputHistory.findIndex(h => h.tickIndex === index));
    // console.log('replaying input', replayableHistory);

    if (!replayableHistory.length) {
      console.error('tried to replay nothing');
      return;
    }

    this.isReplaying = true;
    this.world = RAPIER.World.restoreSnapshot(replayableHistory[0].snapshot);
    replayableHistory.forEach(({ tickIndex, localInput }) => {
      this.stateInputHistory[tickIndex].snapshot = this.world.takeSnapshot();
      this.updateWorld(localInput);
    });
    this.isReplaying = false;
    // console.log('replayed');
    // console.table(
    //   [...this.peerIdWorldHandleMap.entries()].sort().map(([id, h]) => ({ id, ...round(this.world.getRigidBody(h).translation()) }))
    // );
  }

  private updateWorld(localInput: InputSnapshot): RenderableGameState {
    // apply local player input and last known inputs of all other players
    this.lastKnownOtherPlayerInputs.inputs[this.localPlayerId] = localInput;
    const ball = this.world.getRigidBody(this.ballHandle);

    const getPlayerInfos = Object
      .entries(this.lastKnownOtherPlayerInputs.inputs)
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

  private applyInputs(input: InputSnapshot, player: RAPIER.RigidBody, ball: RAPIER.RigidBody) {
    player.applyImpulse(scale(input.movement, 0.5), true);

    if (input.kick) {
      const distanceVector = subtract(ball.translation(), player.translation());
      if (sqrMagnitude(distanceVector) > squareOfKickAndBallRadiusSum) return;
      const ballDirection = normalise(distanceVector);
      ball.applyImpulse(scale(ballDirection, KICK_FORCE), true);
    }
  }
}
