import { THRESHOLD_INPUT_CONSIDERED_LAGGING_MS, MAX_TOLERATED_INPUT_LATENCY_MS } from '../config';
import { Team } from '../enums';
import { EventEmitter } from '../Events';
import { getNullInput } from '../input';
import { TransmittedGameState, PeerId, Input, PlayerInfo } from '../types';
import { World } from './World';

type Options = {
  localPlayerId: PeerId;
  frameRateHz: number;
  pollLocalInput: () => Input;
}

type GameEngineEvents = {
  update: (gameState: TransmittedGameState) => void;
  goal: (scoringTeam: Team, scores: Record<Team, number>) => void;
  kickoff: (countdownSeconds: number) => void;
}

export class GameEngine extends EventEmitter<GameEngineEvents>  {
  private localPlayerId: PeerId;
  private nominalMsPerFrame: number;
  private isTicking = false;
  private playSuspended = false;
  private lastKnownClientInputs = new Map<PeerId, { input: Input; timestamp: number; }>();
  private getLocalInput: () => Input;
  private world: World;
  private scores: Record<Team, number> = { [Team.Red]: 0, [Team.Blue]: 0, [Team.None]: 0 };

  constructor({ localPlayerId, frameRateHz, pollLocalInput }: Options) {
    super();
    this.localPlayerId = localPlayerId;
    this.nominalMsPerFrame = Math.floor(1000 / frameRateHz);
    this.getLocalInput = pollLocalInput;
    this.world = new World();
    this.world.on('goal', t => this.onGoal(t));
  }

  public start(players: PlayerInfo[]) {
    this.lastKnownClientInputs = new Map(players
      .filter(p => p.id !== this.localPlayerId)
      .map(p => [p.id, { input: getNullInput(), timestamp: performance.now() }]));
    this.world.addPlayers(players);
    this.kickoff();

    const gameTick = () => {
      if (!this.isTicking) return;

      const now = performance.now();
      const laggingClients = Array
        .from(this.lastKnownClientInputs.entries())
        .filter(([_, { timestamp }]) => now > timestamp + THRESHOLD_INPUT_CONSIDERED_LAGGING_MS)
        .map(([id, { timestamp }]) => ({
          id,
          latency: now - (timestamp + THRESHOLD_INPUT_CONSIDERED_LAGGING_MS),
          exceededMaxTolerated: now > (timestamp + MAX_TOLERATED_INPUT_LATENCY_MS),
        }));

      if (laggingClients.length) {
        console.warn(`Not received inputs for at least ${THRESHOLD_INPUT_CONSIDERED_LAGGING_MS}ms from:`, laggingClients);
        /**
         * If every lagging client is beyond the max tolerated, then assume they should have disconnected and carry on without them.
         * If some are just lagging a bit, then slow the game down to let them catch up.
         */
        if (!laggingClients.every(c => c.exceededMaxTolerated)) {
          setTimeout(() => gameTick(), this.nominalMsPerFrame);
          console.warn('Ignoring lagging clients');
          return;
        }
      }

      const inputs = this.playSuspended ?
        this.getNullPlayerInputs() :
        new Map<PeerId, { input: Input; }>(this.lastKnownClientInputs)
          .set(this.localPlayerId, { input: this.getLocalInput() });

      this.emit('update', this.world.step(inputs));

      setTimeout(() => gameTick(), this.nominalMsPerFrame);
    };

    this.isTicking = true;
    gameTick();
  }

  public shutdown() {
    this.removeAllListeners();
    this.isTicking = false;
    this.world.dispose();
  }

  public registerInput(otherId: PeerId, otherInput: Input) {
    this.lastKnownClientInputs.set(otherId, { input: otherInput, timestamp: performance.now() });
  }

  public removePlayer(id: PeerId) {
    this.lastKnownClientInputs.delete(id);
    this.world.removePlayer(id);
  }

  private getNullPlayerInputs() {
    return new Map(
      [...this.lastKnownClientInputs.keys(), this.localPlayerId]
        .map(id => [id, { input: getNullInput() }]),
    );
  }

  private kickoff(countdownSeconds = 3) {
    this.playSuspended = true;
    this.world.resetPositions();

    setTimeout(() => {
      this.playSuspended = false;
    }, countdownSeconds * 1000);
    this.emit('kickoff', countdownSeconds);
  }

  private onGoal(scoringTeam: Team) {
    if (this.playSuspended) return;

    this.playSuspended = true;
    setTimeout(() => this.kickoff(), 3000);
    this.scores[scoringTeam]++;
    this.emit('goal', scoringTeam, this.scores);
  }
}
