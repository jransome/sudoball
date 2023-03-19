import { useRef, useEffect } from 'react'

const CANVAS_SHARPNESS_FACTOR = 3

const PitchRenderer = ({ gameObjects }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContextRef = useRef<CanvasRenderingContext2D>(null)

  useEffect(() => {
    // console.log('setting up canvas')
    canvasContextRef.current = canvasRef.current.getContext('2d')
    canvasContextRef.current.scale(CANVAS_SHARPNESS_FACTOR, CANVAS_SHARPNESS_FACTOR)
  }, [])

  useEffect(() => {
    // console.log('drawing on canvas')
    const ctx = canvasContextRef.current
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    if (!gameObjects) {
      ctx.fillText('Nothing to render', 10, 50);
      return;
    }

    drawCircle(gameObjects.ball, 'orange', ctx);
    // gameObjects.players.forEach(p => drawCircle(p, 'blue', ctx));
    // gameObjects.boundaries.forEach(b => drawPolygon(b, 'black', ctx));

  }, [canvasContextRef, gameObjects])

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
      width={window.innerWidth * CANVAS_SHARPNESS_FACTOR}
      height={window.innerHeight * CANVAS_SHARPNESS_FACTOR}
      style={{
        width: `${window.innerWidth}px`,
        height: `${window.innerHeight}px`,
      }}
    />
  )
}

export default PitchRenderer
