import { BALL_RADIUS, KICK_RADIUS, PIXELS_PER_METER, PLAYER_RADIUS, POST_RADIUS } from './config';
import { Team } from './enums';
import { lowerPitchVertices, postPositions, upperPitchVertices } from './game/pitch';
import { RenderableGameState, Circle, Vector2, PeerId } from './types';

let ctx: CanvasRenderingContext2D = null!;
const TEAM_COLOURS: Record<Team, string> = {
  [Team.Unassigned]: 'grey',
  [Team.Red]: 'coral',
  [Team.Blue]: 'skyblue',
};

const setContext = (context: CanvasRenderingContext2D) => {
  ctx = context;
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

const paintCircle = (ctx: CanvasRenderingContext2D, fillColour: string, strokeColour: string, { position, radius }: Circle, pixelsPerMeter: number) => {
  ctx.beginPath();
  ctx.fillStyle = fillColour;
  ctx.arc(
    position.x * pixelsPerMeter,
    position.y * pixelsPerMeter,
    radius * pixelsPerMeter,
    0, 2 * Math.PI, false,
  );
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = strokeColour;
  ctx.stroke();
};

const paintPlayer = (
  ctx: CanvasRenderingContext2D,
  { position, playerName, teamColour, strokeColour, drawKickIndicator }: { position: Vector2; playerName: string; teamColour: string; strokeColour: string; drawKickIndicator: boolean; },
) => {
  if (drawKickIndicator) {
    paintCircle(ctx, 'rgba(0, 0, 0, 0)', 'rgba(255, 255, 255, 0.3)', { position, radius: KICK_RADIUS }, PIXELS_PER_METER);
  }
  paintCircle(ctx, teamColour, strokeColour, { position, radius: PLAYER_RADIUS }, PIXELS_PER_METER);
  ctx.textAlign = 'center';
  ctx.fillText(playerName, position.x * PIXELS_PER_METER, position.y * PIXELS_PER_METER + 1.2 * PIXELS_PER_METER);
};

const paintPitch = (ctx: CanvasRenderingContext2D) => {
  paintLine(ctx, 'white', upperPitchVertices, PIXELS_PER_METER); // TODO: use moveTo
  paintLine(ctx, 'white', lowerPitchVertices, PIXELS_PER_METER);
  paintLine(ctx, 'white', postPositions.slice(0, 2), PIXELS_PER_METER); // red goal line
  paintLine(ctx, 'white', postPositions.slice(-2), PIXELS_PER_METER); // blue goal line

  postPositions
    .forEach(([x, y]) => paintCircle(ctx, 'black', 'white', { position: { x, y }, radius: POST_RADIUS }, PIXELS_PER_METER));
};

const paint = (selfId: PeerId, gameState: RenderableGameState) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  paintPitch(ctx);

  gameState.players.forEach((p) => {
    paintPlayer(ctx, {
      position: p.position,
      playerName: p.id,
      teamColour: TEAM_COLOURS[p.team],
      strokeColour: p.isKicking ? 'white' : 'black',
      drawKickIndicator: p.id === selfId,
    });
  });
  paintCircle(ctx, 'white', 'white', { position: gameState.ball, radius: BALL_RADIUS }, PIXELS_PER_METER);
};

const paintGameState = (selfId: PeerId, gameState: RenderableGameState) => {
  if (!ctx) {
    console.error('tried to paint but no canvas context set!');
    return;
  }

  window.requestAnimationFrame(() => paint(selfId, gameState));
};

export const CanvasPainter = {
  setContext,
  paintGameState,
};
