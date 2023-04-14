import RAPIER from '@dimforge/rapier2d';
import { EventEmitter } from '../Events';
import { Team, KICK_FORCE, BALL_RADIUS, KICK_RADIUS, PLAYER_RADIUS, MOVE_FORCE } from '../config';
import { RenderableGameState, PeerId, Input, Vector2, InputSnapshot, PlayerInputsSnapshot, InitPlayer, TransmittedInputSnapshot } from '../types';

const scale = (vector: Vector2, scalar: number) => ({ x: vector.x * scalar, y: vector.y * scalar });
const subtract = (v1: Vector2, v2: Vector2) => ({ x: v1.x - v2.y, y: v1.y - v2.y });
const sqrMagnitude = (vector: Vector2) => (vector.x ** 2) + (vector.y ** 2);
const normalise = (vector: Vector2) => {
  const magnitude = Math.sqrt(sqrMagnitude(vector));
  return { x: vector.x / magnitude, y: vector.y / magnitude };
};

type PredictiveGameEngineOptions = {
  localPlayerId: PeerId;
  frameRateHz: number;
  pollLocalInput: () => Input;
}

type GameEngineEvents = {
  update: (transmissibleInput: InputSnapshot, gameState: RenderableGameState) => void;
  // gameEvent: (eventName: string) => void;
}

type StateInputHistory = Array<{ tickIndex: number; localInput: InputSnapshot; snapshot: Uint8Array; }>;

const squareOfKickAndBallRadiusSum = (KICK_RADIUS + BALL_RADIUS) ** 2;
const lastInputCounters = {};

export class PredictiveGameEngine extends EventEmitter<GameEngineEvents>  {
  private localPlayerId: PeerId;
  private msPerFrame: number;
  private isRunning = false;
  private isReplaying = false;
  private pollLocalInput: () => Input;
  private world: RAPIER.World;
  private stateInputHistory: StateInputHistory = []; // TODO: max length on this

  private ballHandle: number;

  private peerIdWorldHandleMap = new Map<PeerId, number>();
  private lastKnownClientInputs: PlayerInputsSnapshot = {};

  private throttleOnNextTick = false;
  private scheduledInputs: Record<number, Record<PeerId, TransmittedInputSnapshot>> = {};

  public stats = {
    ticks: 0,
    throttles: 0,
    replays: 0,
  };

  constructor({ localPlayerId, frameRateHz, pollLocalInput }: PredictiveGameEngineOptions) {
    super();
    this.localPlayerId = localPlayerId;
    this.msPerFrame = Math.floor(1000 / frameRateHz);
    this.pollLocalInput = pollLocalInput;
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
    const startingTickIndex = 0;

    players.forEach(({ peerId, team }, i) => {
      const playerRb = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(10 * (i + 1), 10 * (i + 1))
          .setLinearDamping(0.5),
      );
      this.peerIdWorldHandleMap.set(peerId, playerRb.handle);
      if (peerId !== this.localPlayerId) {
        this.lastKnownClientInputs[peerId] = { i: startingTickIndex, kick: false, movement: { x: 0, y: 0 } };
      }

      this.world.createCollider(
        RAPIER.ColliderDesc.ball(PLAYER_RADIUS),
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
      this.stats.ticks = tickIndex;

      if (!this.isRunning) return;

      if (this.isReplaying) {
        setTimeout(() => gameTick(tickIndex), 0);
        return;
      }

      if (this.throttleOnNextTick) {
        this.stats.throttles++;
        // console.log('throttling');
        this.throttleOnNextTick = false;
        setTimeout(() => gameTick(tickIndex), this.msPerFrame);
        return;
      }

      if (this.scheduledInputs[tickIndex]) {
        // console.log('retreiving scheduled');
        Object.entries(this.scheduledInputs[tickIndex]).forEach(([id, input]) => {
          this.lastKnownClientInputs[id] = input;
        });
        delete this.scheduledInputs[tickIndex];
      }

      const localInput: InputSnapshot = { i: tickIndex, ...this.pollLocalInput() };
      this.stateInputHistory.push({
        tickIndex,
        localInput,
        snapshot: this.world.takeSnapshot(),
      });

      this.emit('update', localInput, this.updateWorld(localInput));
      // console.table(
      //   [...this.peerIdWorldHandleMap.entries()].sort().map(([id, h]) => ({ id, ...round(this.world.getRigidBody(h).translation()) }))
      // );

      setTimeout(() => gameTick(tickIndex + 1), this.msPerFrame);
    };

    this.isRunning = true;
    gameTick(startingTickIndex);

    // const onAnimationFrame = (timestamp: DOMHighResTimeStamp) => {
    //   // if (!this.isRunning) return;
    //   const deltaTime = timestamp - lastFrameTimeMs;
    //   if (deltaTime > this.msPerFrame) {
    //     gameLoop();
    //     lastFrameTimeMs = timestamp - (deltaTime % this.msPerFrame);
    //   }
    //   window.requestAnimationFrame(onAnimationFrame);
    // };

    // this.isRunning = true;
    // let lastFrameTimeMs: DOMHighResTimeStamp = performance.now();
    // onAnimationFrame(lastFrameTimeMs);

  }

  public shutdown() {
    this.removeAllListeners();
    this.isRunning = false;
    this.world.free();
  }

  public reconcileInputUpdate(otherInput: TransmittedInputSnapshot) {

    lastInputCounters[otherInput.id] ??= [-1];
    if ((lastInputCounters[otherInput.id].at(-1) + 1) !== otherInput.i) {
      console.error('tick not in order', {
        id: otherInput.id,
        order: lastInputCounters[otherInput.id].slice(-20),
      });
    }
    lastInputCounters[otherInput.id].push(otherInput.i);

    const lastLocalTickIndex = Number(this.stateInputHistory.at(-1)?.tickIndex);
    const MAX_TICKS_AHEAD = 1;
    // console.log('other is behind by', currentLocalTickIndex - otherInput.i);

    /**
     * input arrived for ticks way in the past 
     * local is ahead by more than MAX_TICKS_AHEAD 
     * MAX_TICKS_AHEAD is large enough that we assume this desync is due to the game instances 
     * drifting in reality as some delay is obviously expected due to latency
     * So we need to slow ourselves down to let others catch up
     */
    if (lastLocalTickIndex > otherInput.i + MAX_TICKS_AHEAD) {
      this.throttleOnNextTick = true;
    }

    /**
     * input arrived JIT
     * so apply immediately
     */
    // if ((currentLocalTickIndex + 1) === otherInput.i) {
    //   console.log('JIT');
    //   this.lastKnownClientInputs[otherInput.id] = otherInput;
    //   return;
    // }

    /**
     * input arrived for future ticks that haven't occurred yet
     * schedule them in the future and the throttling on the other
     * end should take care of the rest
     */
    if (lastLocalTickIndex < otherInput.i) {
      // console.log('behind');
      this.scheduledInputs[otherInput.i] = {
        ...this.scheduledInputs[otherInput.i],
        [otherInput.id]: otherInput,
      };
      // this.lastKnownClientInputs[otherInput.id] = otherInput;
      return;
    }

    const storedHistoryIndex = this.stateInputHistory.findIndex(h => h.tickIndex === otherInput.i);
    /**
     * TODO
     * if other is ahead in ticks then we need to fast forward....
     * using the buffer of inputs that should have been received in the mean time
     * 
     * if one tick ahead then do we just set that input (assuming it's different)
     * 
     * if > 1 tick ahead then drain the buffer of inputs and apply to 'roll forward' the engine
     */
    // if (storedHistoryIndex < 0) {
    //   console.warn('other is in the future');
    //   return;
    // }

    const predictedInput = this.lastKnownClientInputs[otherInput.id];
    const predictionsCorrect = predictedInput.kick === otherInput.kick
      && predictedInput.movement.x === otherInput.movement.x
      && predictedInput.movement.y === otherInput.movement.y;

    if (predictionsCorrect) {
      // console.log('correct');
      return;
    }

    this.lastKnownClientInputs[otherInput.id] = otherInput;
    const replayableHistory = structuredClone(this.stateInputHistory.slice(storedHistoryIndex));
    // console.log({
    //   replayIndex: otherInput.i,
    //   historyLength: this.stateInputHistory.length,
    //   replayableLength: replayableHistory.length,
    // });
    this.replay(replayableHistory);
  }

  private replay(replayableHistory: StateInputHistory) {

    // if (replayableHistory.length < 1) {
    //   console.error('tried to replay nothing');
    //   return;
    // }

    this.isReplaying = true;
    this.stats.replays++;
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

  // applies local player input and last known inputs of all other players
  private updateWorld(localInput: InputSnapshot): RenderableGameState {
    const ball = this.world.getRigidBody(this.ballHandle);
    const getPlayerInfos = Object
      .entries({ ...this.lastKnownClientInputs, [this.localPlayerId]: localInput })
      .map(([peerId, input]) => {
        const rb = this.world.getRigidBody(this.peerIdWorldHandleMap.get(peerId)!);
        this.applyPlayerInput(input, rb, ball);
        return () => ({ id: peerId, team: Team.Blue, position: rb.translation(), isKicking: input.kick });
      });

    this.world.step();

    return {
      ball: ball.translation(),
      players: getPlayerInfos.map(getInfo => getInfo()),
    };
  }

  private applyPlayerInput(input: InputSnapshot, player: RAPIER.RigidBody, ball: RAPIER.RigidBody) {
    player.applyImpulse(scale(input.movement, MOVE_FORCE), true);

    if (input.kick) {
      const distanceVector = subtract(ball.translation(), player.translation());
      if (sqrMagnitude(distanceVector) > squareOfKickAndBallRadiusSum) return;
      const ballDirection = normalise(distanceVector);
      ball.applyImpulse(scale(ballDirection, KICK_FORCE), true);
    }
  }
}
