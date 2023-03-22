import { useRef, useEffect } from 'react';
import { GameObjects, Vector2 } from './types';

const CANVAS_SHARPNESS_FACTOR = 3;

type Props = {
  canvasDimensions: Vector2;
  gameObjects: GameObjects;
}

const PitchRenderer = ({ canvasDimensions, gameObjects }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    console.log('INIT canvas');

    canvasContextRef.current = canvasRef.current!.getContext('2d');
    canvasContextRef.current!.scale(CANVAS_SHARPNESS_FACTOR, CANVAS_SHARPNESS_FACTOR);
  }, []);

  useEffect(() => {
    // console.log('drawing on canvas');
    const ctx = canvasContextRef.current!;
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

    if (!gameObjects) {
      ctx.fillText('Nothing to render', 10, 50);
      return;
    }

    drawCircle(gameObjects.player, 'orange', ctx);
    // gameObjects.players.forEach(p => drawCircle(p, 'blue', ctx));
    gameObjects.boundaries.forEach(b => drawPolygon(b, 'black', ctx));
    gameObjects.boxes.forEach(b => drawPolygon(b, 'blue', ctx));

  }, [canvasContextRef, gameObjects]);

  const drawPolygon = (vertices, fillColour, ctx) => {
    ctx.beginPath();
    ctx.fillStyle = fillColour;
    vertices.forEach(vert => ctx.lineTo(vert.x, vert.y));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const drawCircle = ({ position, radius }, fillColour, ctx) => {
    ctx.beginPath();
    ctx.fillStyle = fillColour;
    ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.stroke();
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasDimensions.x * CANVAS_SHARPNESS_FACTOR}
      height={canvasDimensions.y * CANVAS_SHARPNESS_FACTOR}
      style={{
        width: `${canvasDimensions.x}px`,
        height: `${canvasDimensions.y}px`,
      }}
    />
  );
};

export default PitchRenderer;
