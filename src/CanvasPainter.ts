import { BALL_RADIUS, KICK_RADIUS, PIXELS_PER_METER, PLAYER_RADIUS, POST_RADIUS, TEAM_COLOURS } from './config';
import { Team } from './enums';
import { lowerPitchVertices, postPositions, upperPitchVertices } from './game/pitch';
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

const paintCircle = (ctx: CanvasRenderingContext2D, fillColour: string, strokeColour: string, x: number, y: number, radius: number, pixelsPerMeter: number) => {
  ctx.beginPath();
  ctx.fillStyle = fillColour;
  ctx.arc(
    ...[x, y, radius].map(n => n * pixelsPerMeter) as [number, number, number],
    0, 2 * Math.PI, false,
  );
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = strokeColour;
  ctx.stroke();
};

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

const paintPitch = (ctx: CanvasRenderingContext2D) => {
  paintLine(ctx, 'white', upperPitchVertices, PIXELS_PER_METER); // TODO: use moveTo
  paintLine(ctx, 'white', lowerPitchVertices, PIXELS_PER_METER);
  paintLine(ctx, 'white', postPositions.slice(0, 2), PIXELS_PER_METER); // red goal line
  paintLine(ctx, 'white', postPositions.slice(-2), PIXELS_PER_METER); // blue goal line

  postPositions.forEach(([x, y]) => paintCircle(ctx, 'black', 'white', x, y, POST_RADIUS, PIXELS_PER_METER));
};

const paint = (gameState: TransmittedGameState, localPlayerId: PeerId) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  paintPitch(ctx);
  paintCircle(ctx, 'white', 'white', ...gameState.slice(0, 2) as [number, number], BALL_RADIUS, PIXELS_PER_METER); // ball

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
