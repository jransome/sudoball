import { GameObjects, Vector2 } from './types';

type Polygon = Vector2[];
type Circle = {
  position: Vector2;
  radius: number;
};

type PaintingFunction<T extends Circle | Polygon> = (
  ctx: CanvasRenderingContext2D,
  fillColour: string,
  entity: T,
) => void

let ctx: CanvasRenderingContext2D = null!;

const setContext = (context: CanvasRenderingContext2D) => {
  ctx = context;
};

const paintPolygon: PaintingFunction<Polygon> = (ctx, fillColour, vertices) => {
  ctx.beginPath();
  ctx.fillStyle = fillColour;
  vertices.forEach(vert => ctx.lineTo(vert.x, vert.y));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

const paintCircle: PaintingFunction<Circle> = (ctx, fillColour, { position, radius }) => {
  ctx.beginPath();
  ctx.fillStyle = fillColour;
  ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI, false);
  ctx.fill();
  ctx.stroke();
};

const paint = (gameObjects: GameObjects) => {
  if (!ctx) {
    console.error('tried to paint but no canvas context set!');
    return;
  }

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (!gameObjects) {
    ctx.fillText('Nothing to render', 10, 50);
    return;
  }

  gameObjects.players.forEach(p => paintCircle(ctx, 'coral', p));
  gameObjects.boundaries.forEach(b => paintPolygon(ctx, 'black', b));
  gameObjects.boxes.forEach(b => paintPolygon(ctx, 'blue', b));
};

export const CanvasPainter = {
  setContext,
  paint,
};
