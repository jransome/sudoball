import { BALL_RADIUS, KICK_RADIUS, PLAYER_RADIUS, Team } from './config';
import { renderablePitch } from './game';
import { scale } from './game/helpers';
import { ParticipantManager } from './participants';
import { RenderableGameState, Circle, Polygon, Vector2 } from './types';

let ghosts = {};

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
  paintCircle(ctx, teamColour, strokeColor, { position, radius: PLAYER_RADIUS * 4 });
  ctx.textAlign = 'center';
  ctx.fillText(playerName, position.x, position.y + 30);
};

const paint = (gameState: RenderableGameState) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  renderablePitch.polygons.forEach(b => paintPolygon(ctx, 'black', 'white', b));
  renderablePitch.circles.forEach(b => paintCircle(ctx, 'black', 'white', b));

  gameState.players.forEach((p) => {
    // if (!ParticipantManager.participants.has(p.id)) {
    //   console.error('tried to paint a player that doesn\'t exist!', ParticipantManager.participants);
    //   return;
    // }

    // const participantInfo = ParticipantManager.participants.get(p.id)!;
    paintPlayer(
      ctx,
      scale(p.position, 4),
      p.id,
      TEAM_COLOURS[p.team],
      p.isKicking ? 'white' : 'black',
      p.id === ParticipantManager.selfPeerId,
    );
  });
  paintCircle(ctx, 'white', 'white', { position: gameState.ball, radius: BALL_RADIUS });

  const ghostsArr: RenderableGameState[] = Object.values(ghosts);
  const ghostColours = ['cyan', 'magenta', 'yellow'];
  if (ghostsArr.length) {
    ghostsArr.forEach((g, i) => {
      g.players.forEach((p) => {
        paintPlayer(
          ctx,
          scale(p.position, 4),
          p.id,
          'rgba(0, 0, 0, 0)',
          ghostColours[i],
          false,
        );
      });
      // paintCircle(ctx, 'rgba(0, 0, 0, 0)', 'white', { position: ghost.ball, radius: BALL_RADIUS });
    });
  }
};

const paintGameState = (gameState: RenderableGameState) => {
  if (!ctx) {
    console.error('tried to paint but no canvas context set!');
    return;
  }
  // paint(gameState);
  window.requestAnimationFrame(() => paint(gameState)); // we are already inside a RAF when run on the host so technically rendering will take place on the next frame
};

export const CanvasPainter = {
  setContext,
  paintGameState,
  setGhost: (other) => { ghosts[other.id] = other; },
};
