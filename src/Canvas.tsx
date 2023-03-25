import { useRef, useEffect } from 'react';
import { CANVAS_SHARPNESS_FACTOR } from './config';
import { CanvasReference, Vector2 } from './types';

type Props = {
  canvasDimensions: Vector2;
  setReferences: (canvasReferences: CanvasReference) => void;
}

const Canvas = ({ canvasDimensions, setReferences }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const context = canvas.getContext('2d')!;
    context.scale(CANVAS_SHARPNESS_FACTOR, CANVAS_SHARPNESS_FACTOR);
    setReferences({ canvas, context });
  }, []);

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

export default Canvas;
