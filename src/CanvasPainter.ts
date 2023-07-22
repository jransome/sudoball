import {
  BALL_RADIUS,
  PITCH_CIRCLE_RADIUS,
  SPOT_RADIUS,
  KICK_RADIUS,
  PIXELS_PER_METER,
  PLAYER_RADIUS,
  POST_RADIUS,
  TEAM_COLOURS,
  PENALTY_ARC_ANGLE,
  GAME_ENCLOSURE,
  CANVAS_NATIVE_RESOLUTION,
  SIDE_DEPTH,
  GOAL_DEPTH,
  DARK_PURPLE,
  LIGHT_PURPLE, DARKEST_PURPLE
} from './config';
import { Team } from './enums';
import {
  halfWayLineVertices,
  lowerPitchVertices, redPenaltyBoxVertices, penaltyArcCentres,
  pitchMidpoint,
  postPositions,
  upperPitchVertices, bluePenaltyBoxVertices, redGoalBar, blueGoalBar
} from './game/pitch';
import { PlayerInfo, TransmittedGameState, PeerId, TransmittedPlayerState } from './types';

type RenderablePlayer = {
  name: string;
  team: Team;
  x: number;
  y: number;
  isKicking: boolean;
  isLocalPlayer: boolean;
};

let ctx: CanvasRenderingContext2D = null!;
let playerLookup: Map<string, PlayerInfo> = new Map();

const setContext = (context: CanvasRenderingContext2D) => {
  ctx = context;
};

const setPlayerLookup = (lookup: Map<string, PlayerInfo>) => {
  playerLookup = lookup;
};

const paintLine = (ctx: CanvasRenderingContext2D, strokeColour: string, vertices: ReadonlyArray<readonly [number, number]>, pixelsPerMeter: number) => {
  ctx.beginPath();
  vertices.forEach(v => ctx.lineTo(
    v[0] * pixelsPerMeter,
    v[1] * pixelsPerMeter,
  ));
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = strokeColour;
  ctx.stroke();
};

const paintArc = (ctx: CanvasRenderingContext2D, fillColour: string, strokeColour: string, x: number, y: number, radius: number, startAngle: number, endAngle: number, pixelsPerMeter: number) => {
  ctx.beginPath();
  ctx.fillStyle = fillColour;
  ctx.arc(
      ...[x, y, radius].map(n => n * pixelsPerMeter) as [number, number, number],
      startAngle * Math.PI / 180, endAngle * Math.PI / 180, false,
  );
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = strokeColour;
  ctx.stroke();
};

const paintCircle = (ctx: CanvasRenderingContext2D, fillColour: string, strokeColour: string, x: number, y: number, radius: number, pixelsPerMeter: number) =>
    paintArc(ctx, fillColour, strokeColour, x, y, radius, 0, 360, pixelsPerMeter);

const paintPlayer = (
  ctx: CanvasRenderingContext2D,
  player: RenderablePlayer,
) => {
  if (player.isLocalPlayer) {
    paintCircle(
      ctx,
      'rgba(0, 0, 0, 0)',
      'rgba(255, 255, 255, 0.3)',
      player.x,
      player.y,
      KICK_RADIUS,
      PIXELS_PER_METER,
    );
  }
  paintCircle(
    ctx,
    TEAM_COLOURS[player.team],
    player.isKicking ? 'white' : 'black',
    player.x,
    player.y,
    PLAYER_RADIUS,
    PIXELS_PER_METER,
  );
  ctx.textAlign = 'center';
  ctx.fillText(player.name, player.x * PIXELS_PER_METER, player.y * PIXELS_PER_METER + 1.2 * PIXELS_PER_METER);
};

const colourThePitch = () => {
  
  // creating the pitch pattern
  for (let j = 0; j < GAME_ENCLOSURE.x / 2 - 2; j++) {
    let colour;
    if(j % 2 === 0 ) {
      colour = DARK_PURPLE;
    } else {
      colour = LIGHT_PURPLE;
    }
    ctx.save();
    ctx.transform(1,0,-2,1, 2 * PIXELS_PER_METER,0);
    ctx.fillStyle = colour;
    ctx.fillRect(4 * (j + 0.5) * PIXELS_PER_METER, SIDE_DEPTH * PIXELS_PER_METER, 4 * PIXELS_PER_METER, (GAME_ENCLOSURE.y - 2 * SIDE_DEPTH) * PIXELS_PER_METER);
    ctx.restore();
  };
  
  // colouring the border
  ctx.fillStyle = DARKEST_PURPLE;
  ctx.fillRect(0, 0, CANVAS_NATIVE_RESOLUTION.x, SIDE_DEPTH * PIXELS_PER_METER); // top
  ctx.fillRect(0, CANVAS_NATIVE_RESOLUTION.y - SIDE_DEPTH * PIXELS_PER_METER, CANVAS_NATIVE_RESOLUTION.x, SIDE_DEPTH * PIXELS_PER_METER); // bottom
  ctx.fillRect(0, 0, GOAL_DEPTH * PIXELS_PER_METER, CANVAS_NATIVE_RESOLUTION.y); // left
  ctx.fillRect(CANVAS_NATIVE_RESOLUTION.x - GOAL_DEPTH * PIXELS_PER_METER, 0, GOAL_DEPTH * PIXELS_PER_METER, CANVAS_NATIVE_RESOLUTION.y); // right
};

const paintPitch = (ctx: CanvasRenderingContext2D) => {
  colourThePitch();
  
  paintLine(ctx, 'white', upperPitchVertices, PIXELS_PER_METER); // TODO: use moveTo
  paintLine(ctx, 'white', lowerPitchVertices, PIXELS_PER_METER);
  paintLine(ctx, 'white', postPositions.slice(0, 2), PIXELS_PER_METER); // red goal line
  paintLine(ctx, 'white', redGoalBar, PIXELS_PER_METER);
  paintLine(ctx, 'white', postPositions.slice(-2), PIXELS_PER_METER); // blue goal line
  paintLine(ctx, 'white', blueGoalBar, PIXELS_PER_METER);

  paintLine(ctx, 'white', halfWayLineVertices, PIXELS_PER_METER); // half way line
  paintCircle(ctx, 'transparent', 'white', pitchMidpoint.x, pitchMidpoint.y, PITCH_CIRCLE_RADIUS, PIXELS_PER_METER); // centre circle
  paintCircle(ctx, 'white', 'white', pitchMidpoint.x, pitchMidpoint.y, SPOT_RADIUS, PIXELS_PER_METER); // centre spot
  
  paintLine(ctx, 'white', redPenaltyBoxVertices, PIXELS_PER_METER); // red penalty box
  paintArc(ctx, 'transparent', 'white', penaltyArcCentres[0][0], penaltyArcCentres[0][1], PITCH_CIRCLE_RADIUS, -PENALTY_ARC_ANGLE, PENALTY_ARC_ANGLE, PIXELS_PER_METER); // red penalty circle segment
  paintLine(ctx, 'white', bluePenaltyBoxVertices, PIXELS_PER_METER); // blue penalty box
  paintArc(ctx, 'transparent', 'white', penaltyArcCentres[1][0], penaltyArcCentres[1][1], PITCH_CIRCLE_RADIUS, 180 - PENALTY_ARC_ANGLE, PENALTY_ARC_ANGLE - 180, PIXELS_PER_METER); // blue penalty circle segment

  postPositions.slice(0, 2).forEach(([x, y]) => paintCircle(ctx, TEAM_COLOURS[Team.Red], 'white', x, y, POST_RADIUS, PIXELS_PER_METER)); // red goal posts
  postPositions.slice(-2).forEach(([x, y]) => paintCircle(ctx, TEAM_COLOURS[Team.Blue], 'white', x, y, POST_RADIUS, PIXELS_PER_METER)); // blue goal posts
};

const paint = (gameState: TransmittedGameState, localPlayerId: PeerId) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  paintPitch(ctx);
  paintCircle(ctx, 'white', 'black', ...gameState.slice(0, 2) as [number, number], BALL_RADIUS, PIXELS_PER_METER); // ball

  for (let i = 2; i < gameState.length; i += 4) { // ignore ball position and read 4 elements (one player) at a time
    const [id, x, y, isKicking] = gameState.slice(i, i + 4) as unknown as TransmittedPlayerState;

    const playerInfo = playerLookup.get(id);
    paintPlayer(ctx, {
      name: playerInfo!.name,
      team: playerInfo!.team,
      x, y,
      isLocalPlayer: id === localPlayerId,
      isKicking,
    });
  }
};

const paintGameState = (gameState: TransmittedGameState, localPlayerId: PeerId) => {
  if (!ctx) {
    console.error('tried to paint but no canvas context set!');
    return;
  }

  // TODO: local player id could be stored in player lookup
  window.requestAnimationFrame(() => paint(gameState, localPlayerId));
};

export const CanvasPainter = {
  setContext,
  setPlayerLookup,
  paintGameState,
};
