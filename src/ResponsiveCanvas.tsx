import { useRef, useEffect } from 'react';
import { CanvasPainter } from './CanvasPainter';
import { CANVAS_SHARPNESS_FACTOR } from './config';
import { Vector2 } from './types';

type Props = {
  gameDimensions: Vector2;
}

export const ResponsiveCanvas = ({ gameDimensions }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const aspectRatio = gameDimensions.x / gameDimensions.y;
    const canvas = canvasRef.current!;
    const context = canvas.getContext('2d', { alpha: false })!;
    CanvasPainter.setContext(context);

    /**
     * canvas.width/height sets the dimensions of the renderable pixels, not the 
     * on-screen size of the canvas, which is controlled by canvas.style.width/height
     * 
     * Increasing width/height makes the game look smaller, as the canvas
     * shows extra pixels the game will never 'touch', eg. rendering a 100 x 100
     * game on a canvas 200 x 200 means game will only occupy 1/4 of the space.
     * 
     * Therefore we scale() the canvas to compensate. Leaving the width and scale
     * as-is would mean the game renders correctly, but at a low resolution. 
     */
    canvas.width = gameDimensions.x * CANVAS_SHARPNESS_FACTOR;
    canvas.height = gameDimensions.y * CANVAS_SHARPNESS_FACTOR;
    context.scale(CANVAS_SHARPNESS_FACTOR, CANVAS_SHARPNESS_FACTOR);

    const onWindowResize = () => {
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerWidth / aspectRatio}px`;
    };
    onWindowResize();
    window.addEventListener('resize', onWindowResize);
    return () => window.removeEventListener('resize', onWindowResize);
  }, []);

  return (<canvas ref={canvasRef} />);
};