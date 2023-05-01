import { useRef, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { CanvasPainter } from '../CanvasPainter';
import { CANVAS_MAX_ON_SCREEN_WIDTH_PX, CANVAS_NATIVE_RESOLUTION, CANVAS_SHARPNESS_FACTOR } from '../config';

const useStyles = createUseStyles({
  canvas: {
    display: 'block',
    margin: 'auto',
  },
});

export const ResponsiveCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const classes = useStyles();

  useEffect(() => {
    const aspectRatio = CANVAS_NATIVE_RESOLUTION.x / CANVAS_NATIVE_RESOLUTION.y;
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
    canvas.width = CANVAS_NATIVE_RESOLUTION.x * CANVAS_SHARPNESS_FACTOR;
    canvas.height = CANVAS_NATIVE_RESOLUTION.y * CANVAS_SHARPNESS_FACTOR;
    context.scale(CANVAS_SHARPNESS_FACTOR, CANVAS_SHARPNESS_FACTOR);

    const onWindowResize = () => {
      const newWidth = Math.min(window.innerWidth, CANVAS_MAX_ON_SCREEN_WIDTH_PX);
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newWidth / aspectRatio}px`;
    };
    onWindowResize();
    window.addEventListener('resize', onWindowResize);
    return () => window.removeEventListener('resize', onWindowResize);
  }, []);

  return (<canvas ref={canvasRef} className={classes.canvas} />);
};
