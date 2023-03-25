import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { FRAMERATE_HZ, CANVAS_DIMENSIONS } from './config';
import { ConnectionClient } from './rtc/ConnectionClient';
import { ConnectionHost } from './rtc/ConnectionHost';
import Canvas from './Canvas';
import { GameEngine } from './GameEngine';
import { getMovementInput } from './controls';
import { CanvasReference, ClientId, GameObjects, RTCClientInput, RTCGameUpdate, Vector2 } from './types';

const useStyles = createUseStyles({
  app: {
    margin: '0px 30px',
  },
  connected: {
    color: 'greenyellow',
  },
  disconnected: {
    color: 'red',
  },
});



const clientInputs: {
  testInput: Vector2;
} = {
  testInput: { x: 0, y: 0 },
};


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

const draw = ({ canvas, context: ctx }: CanvasReference, gameObjects: GameObjects) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameObjects) {
    ctx.fillText('Nothing to render', 10, 50);
    return;
  }

  drawCircle(gameObjects.player, 'orange', ctx);
  // gameObjects.players.forEach(p => drawCircle(p, 'blue', ctx));
  gameObjects.boundaries.forEach(b => drawPolygon(b, 'black', ctx));
  gameObjects.boxes.forEach(b => drawPolygon(b, 'blue', ctx));
}


const startEngine = (host: ConnectionHost, canvasRefs: CanvasReference) => {
  console.log('started engine');
  const gameEngine = new GameEngine(CANVAS_DIMENSIONS, FRAMERATE_HZ);

  gameEngine.on('update', (gameObjects, sendInputs) => {
    sendInputs(getMovementInput());
    clientInputs.testInput && sendInputs(clientInputs.testInput);

    host.broadcast({ type: 'GAME_UPDATE', payload: gameObjects });
    draw(canvasRefs, gameObjects);
  });

  gameEngine.on('gameEvent', (gameEvent) => {
    /**
     * any event that changes the ui, eg:
     * game started
     * goal scored
     * game ended
    */
  });

  console.log('starting game engine...');
  gameEngine.start();
};

const App = () => {
  const classes = useStyles();

  const [isClientAndConnected, setIsClientAndConnected] = useState(false);
  const [hostId, setHostId] = useState('');

  const [clients, setClients] = useState<string[]>([]);
  const [connHost, setConnHost] = useState<ConnectionHost>();
  const [connClient, setConnClient] = useState<ConnectionClient>();
  const [canvasRefs, setCanvasRefs] = useState<CanvasReference>();

  const createGame = () => {
    const host = new ConnectionHost();
    setHostId(host.hostId);
    host.startHosting();
    host.on('clientConnected', (id) => {
      setClients(host.clients);
    });
    host.on('clientDisconnected', (id) => {
      console.log('client disconnected', id);
      setClients(host.clients);
    });

    host.on('message', (clientId: ClientId, message: RTCClientInput) => {
      console.log('message from:', clientId, message);
      clientInputs.testInput = message.payload;
      // setClientInputs(prev => ({ ...prev, testClient: data.input }));
      // setReceivedMessages(prev => [...prev, [clientId, data.message]]);

      // gets player inputs and 'queue'(?) them for inputting to the engine

    });

    startEngine(host, canvasRefs!);

    setConnHost(host);
  };

  const joinGame = async (hostId: string) => {
    const client = new ConnectionClient();
    await client.connectToHost(hostId);
    setConnClient(client);
    setIsClientAndConnected(true);
    client.on('message', (message: RTCGameUpdate) => {
      // get player input and send it back to keep in lock step with engine frame rate
      client.sendToHost({ type:'CLIENT_INPUT', payload: getMovementInput() });
      draw(canvasRefs!, message.payload);
    });
  };

  const isConnected = () => isClientAndConnected || !!clients.length;

  return (
    <div className={classes.app}>
      <h1>Sudoball</h1>

      <div>
        <h3 className={isConnected() ? classes.connected : classes.disconnected}>
          {isConnected() ? 'Channel Open' : 'Disconnected'}
        </h3>
        <div>
          <button
            onClick={() => createGame()}
            disabled={!!connClient || !!connHost || isConnected()}
          >
            Create Game
          </button>

          <button
            onClick={() => joinGame(hostId)}
            disabled={!hostId || !!connClient || !!connHost || isConnected()}
          >
            Join Game
          </button>
          <input type='text' value={hostId} onChange={ev => setHostId(ev.target.value)} />
          <button onClick={() => navigator.clipboard.writeText(hostId)}>copy</button>

        </div>

        <h4>Connected to:</h4>
        <ul>
          {clients.map((c, i) => <li key={i}>{c}</li>)}
          {connClient && <li>host</li>}
        </ul>
      </div>
      <Canvas
        canvasDimensions={CANVAS_DIMENSIONS}
        setReferences={setCanvasRefs}
      />
    </div>
  );
};

export default App;
