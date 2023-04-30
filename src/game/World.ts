import { World as PhysicsWorld, RigidBody, ColliderDesc, RigidBodyDesc, ActiveEvents, EventQueue } from '@dimforge/rapier2d';
import { PlayerInfo, TransmittedGameState, PeerId, Input } from '../types';
import { PLAYER_RADIUS, MOVE_FORCE, KICK_FORCE, BALL_RADIUS, POST_RADIUS, KICK_RADIUS, BALL_DRAG, PLAYER_DRAG, PLAYER_MASS, BALL_MASS, BALL_BOUNCINESS, GAME_ENCLOSURE } from '../config';
import { Team } from '../enums';
import { EventEmitter } from '../Events';
import { scale, subtract, sqrMagnitude, normalise } from '../vector2Utils';
import { boundsHalfSpaces, goalSensorPositions, goalSensorSize, lowerPitchVertices, pitchMidpoint, postPositions, upperPitchVertices } from './pitch';
import { CollisionGroup } from './CollisionGroups';

const kickBallRadiiSumSquared = (KICK_RADIUS + BALL_RADIUS) ** 2;

type WorldEvents = {
  goal: (scoringTeam: Team) => void;
};

export class World extends EventEmitter<WorldEvents> {
  private world: PhysicsWorld;
  private ballColliderHandle: number;
  private redGoalRbHandle: number;
  private blueGoalRbHandle: number;
  private ballRb: RigidBody;
  private players = new Map<PeerId, { rb: RigidBody; team: Team; }>();

  constructor() {
    super();
    this.world = new PhysicsWorld({ x: 0, y: 0 });

    // outer bounds
    boundsHalfSpaces.forEach(([position, normal]) => this.world.createCollider(
      ColliderDesc.halfspace(normal)
        .setCollisionGroups(CollisionGroup.GameBoundary),
      this.world.createRigidBody(RigidBodyDesc.fixed().setTranslation(position.x, position.y)),
    ));

    // pitch
    [upperPitchVertices, lowerPitchVertices].forEach(vertexArr => this.world.createCollider(
      ColliderDesc.polyline(new Float32Array(vertexArr.flat()))
        .setCollisionGroups(CollisionGroup.PitchBoundary),
      this.world.createRigidBody(RigidBodyDesc.fixed()),
    ));

    // goals
    const [redHandle, blueHandle] = goalSensorPositions.map(position => this.world.createCollider(
      ColliderDesc.cuboid(...goalSensorSize)
        .setSensor(true)
        .setTranslation(...position),
      this.world.createRigidBody(RigidBodyDesc.fixed()),
    ).parent()!.handle);

    this.redGoalRbHandle = redHandle;
    this.blueGoalRbHandle = blueHandle;

    // posts
    postPositions.map(([x, y]) => this.world.createCollider(
      ColliderDesc.ball(POST_RADIUS)
        .setTranslation(x, y),
    ));

    // ball
    this.ballRb = this.world.createRigidBody(RigidBodyDesc.dynamic()
      .setCcdEnabled(true)
      .setAdditionalMass(BALL_MASS)
      .setLinearDamping(BALL_DRAG),
    );
    this.ballColliderHandle = this.world.createCollider(
      ColliderDesc.ball(BALL_RADIUS)
        .setActiveEvents(ActiveEvents.COLLISION_EVENTS)
        .setCollisionGroups(CollisionGroup.Ball)
        .setFriction(0)
        .setRestitution(BALL_BOUNCINESS),
      this.ballRb,
    ).handle;
  }

  public addPlayers(players: PlayerInfo[]) {
    this.players = new Map(players.map(({ id, team }) => {
      const playerRb = this.world.createCollider(
        ColliderDesc.ball(PLAYER_RADIUS)
          .setCollisionGroups(CollisionGroup.Player)
          .setFriction(0),
        this.world.createRigidBody(RigidBodyDesc.dynamic()
          .setAdditionalMass(PLAYER_MASS)
          .setLinearDamping(PLAYER_DRAG),
        ),
      ).parent()!;
      return [id, { rb: playerRb, team }];
    }));
  }

  public removePlayer(id: PeerId) {
    const player = this.players.get(id);
    if (!player) return;
    this.world.removeRigidBody(player.rb);
    this.players.delete(id);
  }

  public resetPositions() {
    this.ballRb.setLinvel({ x: 0, y: 0 }, true);
    this.ballRb.setTranslation(pitchMidpoint, true);

    const safePitchWidth = GAME_ENCLOSURE.y * 0.9;
    const pitchWidthBuffer = (GAME_ENCLOSURE.y - safePitchWidth) / 2;
    const allPlayers = Array.from(this.players.values());

    [Team.Red, Team.Blue]
      .map(t => allPlayers.filter(p => p.team === t))
      .forEach((teamPlayers) => {
        const playerSpacingY = safePitchWidth / (teamPlayers.length + 1);
        teamPlayers.forEach(({ rb, team }, i) => rb.setTranslation({
          x: GAME_ENCLOSURE.x * (team === Team.Red ? 0.25 : 0.75),
          y: pitchWidthBuffer + playerSpacingY + i * playerSpacingY,
        }, true));
      });
  }

  public dispose() {
    this.removeAllListeners();
    this.world.free();
  }

  public step(inputs: { id: PeerId; input: Input; }[]): TransmittedGameState {
    const getPlayerStates = inputs
      .map(({ id, input }) => {
        const player = this.players.get(id);
        if (!player) {
          throw new InputForNonExistentPlayerError('Received input for player that does not exist in game', { id, currentPlayers: this.players });
        }

        this.applyPlayerInput(input, player.rb, this.ballRb);

        return () => ({
          id,
          position: player.rb.translation(),
          isKicking: input[2],
        });
      });

    const eventQueue = new EventQueue(true);
    this.world.step(eventQueue);

    eventQueue.drainCollisionEvents((h1, h2, started) => {
      if (!started) return;
      if (h1 !== this.ballColliderHandle && h2 !== this.ballColliderHandle) return;

      if (h1 === this.redGoalRbHandle || h2 === this.redGoalRbHandle) {
        this.emit('goal', Team.Blue);
      }

      if (h1 === this.blueGoalRbHandle || h2 === this.blueGoalRbHandle) {
        this.emit('goal', Team.Red);
      }
    });
    eventQueue.free();

    return {
      ball: this.ballRb.translation(),
      players: getPlayerStates.map(getState => getState()),
    };
  }

  private applyPlayerInput(input: Input, player: RigidBody, ball: RigidBody) {
    const [x, y, isKicking] = input;

    if (!(x === 0 && y === 0)) { // ignore if no movement input
      player.applyImpulse(scale(normalise({ x, y }), MOVE_FORCE), true);
    }

    if (isKicking) {
      const distanceVector = subtract(ball.translation(), player.translation());
      if (sqrMagnitude(distanceVector) > kickBallRadiiSumSquared) return;
      const ballDirection = normalise(distanceVector);
      ball.applyImpulse(scale(ballDirection, KICK_FORCE), true);
    }
  }
}

class InputForNonExistentPlayerError extends Error {
  details: object;

  constructor(message: string, details: object) {
    super(message);
    this.name = 'InputForNonExistentPlayerError';
    this.details = details;
  }
}
