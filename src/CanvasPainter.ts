import { BALL_RADIUS, KICK_RADIUS, PLAYER_RADIUS, Team } from './config';
import { ParticipantManager } from './participants';
import { BroadcastedGameState, Vector2 } from './types';

type Polygon = Vector2[];
type Circle = {
  position: Vector2;
  radius: number;
};

type ShapePainter<T extends Circle | Polygon> = (
  ctx: CanvasRenderingContext2D,
  fillColour: string,
  strokeColour: string,
  entity: T,
) => void

let ctx: CanvasRenderingContext2D = null!;
const TEAM_COLOURS: Record<Team, string> = {
  [Team.Red]: 'coral',
  [Team.Blue]: 'skyblue',
};

const setContext = (context: CanvasRenderingContext2D) => {
  ctx = context;
};

const paintPolygon: ShapePainter<Polygon> = (ctx, fillColour, strokeColour, vertices) => {
  ctx.beginPath();
  ctx.fillStyle = fillColour;
  vertices.forEach(vert => ctx.lineTo(vert.x, vert.y));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = strokeColour;
  ctx.stroke();
};

const paintCircle: ShapePainter<Circle> = (ctx, fillColour, strokeColour, { position, radius }) => {
  ctx.beginPath();
  ctx.fillStyle = fillColour;
  ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI, false);
  ctx.fill();
  ctx.strokeStyle = strokeColour;
  ctx.stroke();
};

const paintPlayer = (ctx: CanvasRenderingContext2D, position: Vector2, playerName: string, teamColour: string, strokeColor: string, isSelf: boolean) => {
  if (isSelf) paintCircle(ctx, 'rgba(0, 0, 0, 0)', 'rgba(255, 255, 255, 0.3)', { position, radius: KICK_RADIUS });
  paintCircle(ctx, teamColour, strokeColor, { position, radius: PLAYER_RADIUS });
  ctx.textAlign = 'center';
  ctx.fillText(playerName, position.x, position.y + 30);
};

const paint = (gameState: BroadcastedGameState) => {
  if (!ctx) {
    console.error('tried to paint but no canvas context set!');
    return;
  }

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (!gameState) {
    ctx.fillText('Nothing to render', 10, 50);
    return;
  }

  gameState.pitchBoundaries.forEach(b => paintPolygon(ctx, 'black', 'white', b));
  gameState.players.forEach((p) => {
    if (!ParticipantManager.participants.has(p.id)) {
      console.error('tried to paint a player that doesn\'t exist!', ParticipantManager.participants);
      return;
    }

    const participantInfo = ParticipantManager.participants.get(p.id)!;
    paintPlayer(
      ctx,
      p.position,
      participantInfo.name,
      TEAM_COLOURS[participantInfo.team],
      p.isKicking ? 'white' : 'black',
      p.id === ParticipantManager.selfPeerId,
    );
  });
  paintCircle(ctx, 'white', 'white', { position: gameState.ball, radius: BALL_RADIUS });
};

export const CanvasPainter = {
  setContext,
  paint,
};
