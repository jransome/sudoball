import { THRESHOLD_INPUT_CONSIDERED_LAGGING_MS, MAX_TOLERATED_INPUT_LATENCY_MS } from '../config';
import { Team } from '../enums';
import { EventEmitter } from '../Events';
import { TransmittedGameState, PeerId, Input, PlayerInfo } from '../types';
import { World } from './World';

type Options = {
  localPlayerId: PeerId;
  frameRateHz: number;
  pollLocalInput: () => Input;
}

type GameEngineEvents = {
  update: (gameState: TransmittedGameState) => void;
}

export class GameEngine extends EventEmitter<GameEngineEvents>  {
  private localPlayerId: PeerId;
  private nominalMsPerFrame: number;
  private isRunning = false;
  private playerIds = new Set<PeerId>();
  private clientInputTimestamps = new Map<PeerId, number>();
  private lastKnownClientInputs = new Map<PeerId, Input>();
  private getLocalInput: () => Input;
  private world: World;

  get running() {
    return this.isRunning;
  }

  constructor({ localPlayerId, frameRateHz, pollLocalInput }: Options) {
    super();
    this.localPlayerId = localPlayerId;
    this.nominalMsPerFrame = Math.floor(1000 / frameRateHz);
    this.getLocalInput = pollLocalInput;
    this.world = new World();
    this.world.on('goal', this.onGoal);
  }

  public start(players: PlayerInfo[]) {
    this.playerIds = new Set(players.map(p => p.id));
    this.world.addPlayers(players);

    const gameTick = () => {
      if (!this.isRunning) return;

      const now = performance.now();
      const laggingClients = Array
        .from(this.clientInputTimestamps.entries())
        .filter(entry => now > entry[1] + THRESHOLD_INPUT_CONSIDERED_LAGGING_MS)
        .map(([id, lastInputTimestamp]) => ({
          id,
          latency: now - (lastInputTimestamp + THRESHOLD_INPUT_CONSIDERED_LAGGING_MS),
          exceededMaxTolerated: now > (lastInputTimestamp + MAX_TOLERATED_INPUT_LATENCY_MS),
        }));

      if (laggingClients.length) {
        console.warn(`Not received inputs for at least ${THRESHOLD_INPUT_CONSIDERED_LAGGING_MS}ms from:`, laggingClients);
        /**
         * If every lagging client is beyond the max tolerated, then assume they should have disconnected and carry on without them.
         * If some are just lagging a bit, then slow the game down to let them catch up.
         */
        if (!laggingClients.every(l => l.exceededMaxTolerated)) {
          setTimeout(() => gameTick(), this.nominalMsPerFrame);
          return;
        }
        console.warn('Ignoring lagging clients');
      }

      const inputs = new Map([
        ...this.lastKnownClientInputs,
        [this.localPlayerId, this.getLocalInput()],
      ]);
      this.emit('update', this.world.step(inputs));

      setTimeout(() => gameTick(), this.nominalMsPerFrame);
    };

    this.isRunning = true;
    gameTick();

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
    this.world.dispose();
  }

  public registerInput(otherId: PeerId, otherInput: Input) {
    if (!this.playerIds.has(otherId)) {
      console.error('Received input for player that is not in-game', {
        otherId,
        playerIds: this.playerIds,
      });
      return;
    }

    this.lastKnownClientInputs.set(otherId, otherInput);
    this.clientInputTimestamps.set(otherId, performance.now());
  }

  public removePlayer(id: PeerId) {
    this.playerIds.delete(id);
    this.lastKnownClientInputs.delete(id);
    this.clientInputTimestamps.delete(id);
    this.world.removePlayer(id);
  }

  private onGoal(scoringTeam: Team) {
    console.log(scoringTeam, 'scored');
  }
}
