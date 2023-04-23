import { World as PhysicsWorld, RigidBody, ColliderDesc, RigidBodyDesc, ActiveEvents, EventQueue } from '@dimforge/rapier2d';
import { PlayerInfo, RenderableGameState, PeerId, Input } from '../types';
import { PLAYER_RADIUS, MOVE_FORCE, KICK_FORCE, BALL_RADIUS, POST_RADIUS, KICK_RADIUS, BALL_DRAG, PLAYER_DRAG, PLAYER_MASS, BALL_MASS, BALL_BOUNCINESS } from '../config';
import { Team } from '../enums';
import { EventEmitter } from '../Events';
import { scale, subtract, sqrMagnitude, normalise, isZero } from '../vector2Utils';
import { boundsHalfSpaces, goalSensorPositions, goalSensorSize, lowerPitchVertices, pitchMidpoint, postPositions, upperPitchVertices } from './pitch';
import { CollisionGroup } from './CollisionGroup';

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
  private playerRbs = new Map<PeerId, RigidBody>();

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
      .setTranslation(pitchMidpoint.x, pitchMidpoint.y)
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
    this.playerRbs = new Map(players.map(({ id, team }, i) => {
      const playerRb = this.world.createCollider(
        ColliderDesc.ball(PLAYER_RADIUS)
          .setCollisionGroups(CollisionGroup.Player)
          .setFriction(0),
        this.world.createRigidBody(RigidBodyDesc.dynamic()
          .setTranslation(10 * (i + 1), 10 * (i + 1))
          .setAdditionalMass(PLAYER_MASS)
          .setLinearDamping(PLAYER_DRAG),
        ),
      ).parent()!;
      return [id, playerRb];
    }));
  }

  public removePlayer(id: PeerId) {
    const rb = this.playerRbs.get(id);
    if (!rb) return;
    this.world.removeRigidBody(rb);
    this.playerRbs.delete(id);
  }

  public dispose() {
    this.removeAllListeners();
    this.world.free();
  }

  public step(inputs: Map<PeerId, Input>): RenderableGameState {
    const getPlayerInfos = Array
      .from(inputs)
      .map(([id, input]) => {
        const playerRb = this.tryGetPlayerRb(id);
        this.applyPlayerInput(input, playerRb, this.ballRb);
        return () => ({
          id,
          team: Team.Blue,
          position: playerRb.translation(),
          isKicking: input.kick,
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
      players: getPlayerInfos.map(getInfo => getInfo()),
    };
  }

  private applyPlayerInput(input: Input, player: RigidBody, ball: RigidBody) {
    if (!isZero(input.movement)) {
      player.applyImpulse(scale(normalise(input.movement), MOVE_FORCE), true);
    }

    if (input.kick) {
      const distanceVector = subtract(ball.translation(), player.translation());
      if (sqrMagnitude(distanceVector) > kickBallRadiiSumSquared) return;
      const ballDirection = normalise(distanceVector);
      ball.applyImpulse(scale(ballDirection, KICK_FORCE), true);
    }
  }

  private tryGetPlayerRb(id: PeerId) {
    const playerRb = this.playerRbs.get(id);
    if (!playerRb) {
      throw new InputForNonExistentPlayerError('Received input for player that does not exist in game', { id, currentPlayers: this.playerRbs });
    }
    return playerRb;
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
