import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { FRAMERATE_HZ, GAME_DIMENSIONS } from './config';
import { ConnectionClient } from './rtc/ConnectionClient';
import { ConnectionHost } from './rtc/ConnectionHost';
import { ResponsiveCanvas } from './ResponsiveCanvas';
import { GameEngine } from './GameEngine';
import { getMovementInput } from './controls';
import { PeerId, GameObjects, RTCClientInput, RTCGameUpdate, PlayerInputs } from './types';

const useStyles = createUseStyles({
  appUi: {
    margin: '0px 30px',
  },
  connected: {
    color: 'greenyellow',
  },
  disconnected: {
    color: 'red',
  },
});


const clientInputs: PlayerInputs = {};


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

const draw = (ctx: CanvasRenderingContext2D, gameObjects: GameObjects) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (!gameObjects) {
    ctx.fillText('Nothing to render', 10, 50);
    return;
  }

  gameObjects.players.forEach(p => drawCircle(p, 'coral', ctx));
  gameObjects.boundaries.forEach(b => drawPolygon(b, 'black', ctx));
  gameObjects.boxes.forEach(b => drawPolygon(b, 'blue', ctx));
};

const startEngine = (host: ConnectionHost, canvasContext: CanvasRenderingContext2D) => {
  console.log('started engine');
  const gameEngine = new GameEngine(GAME_DIMENSIONS, FRAMERATE_HZ);

  gameEngine.on('update', (gameObjects, applyInputs) => {
    applyInputs({
      ...clientInputs,
      [host.peerId]: getMovementInput(),
    });
    // clientInputs.testInput && applyInputs(clientInputs.testInput);

    host.broadcast({ type: 'GAME_UPDATE', payload: gameObjects });
    draw(canvasContext, gameObjects);
  });

  gameEngine.on('gameEvent', (gameEvent) => {
    /**
     * any event that changes the ui, eg:
     * game started
     * goal scored
     * game ended
    */
  });

  gameEngine.addPlayer(host.peerId);
  gameEngine.start();
  return gameEngine;
};

const App = () => {
  const classes = useStyles();

  const [hostId, setHostId] = useState('');
  const [getConnectedState, setGetConnectedState] = useState<() => boolean>(() => () => false);
  const [clients, setClients] = useState<string[]>([]);
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D>();

  const createGame = () => {
    const host = new ConnectionHost();
    const engine = startEngine(host, canvasContext!);

    host.on('clientConnected', (id) => {
      setClients(host.clients);
      engine.addPlayer(id);
    });

    host.on('clientDisconnected', (id) => {
      setClients(host.clients);
      engine.removePlayer(id);
    });

    host.on('message', (clientId: PeerId, message: RTCClientInput) => {
      // TODO: what if client isn't registered?!
      clientInputs[clientId] = message.payload;

      // gets player inputs and 'queue'(?) them for inputting to the engine
    });

    host.startHosting();

    setHostId(host.peerId);
    setGetConnectedState(() => () => host.clients.length > 0);
  };

  const joinGame = async (hostId: string) => {
    const client = new ConnectionClient();
    client.on('message', (message: RTCGameUpdate) => {
      // get player input and send it back to keep in lock step with engine frame rate
      client.sendToHost({ type: 'CLIENT_INPUT', payload: getMovementInput() });
      draw(canvasContext!, message.payload);
    });
    await client.connectToHost(hostId);
    setGetConnectedState(() => () => client.connected);
  };

  return (
    <>
      <div className={classes.appUi}>
        <h1>Sudoball</h1>
        <h3 className={getConnectedState() ? classes.connected : classes.disconnected}>
          {getConnectedState() ? 'Channel Open' : 'Disconnected'}
        </h3>
        <div>
          <button
            onClick={() => createGame()}
            disabled={getConnectedState()}
          >
            Create Game
          </button>

          <button
            onClick={() => joinGame(hostId)}
            disabled={!hostId || getConnectedState()}
          >
            Join Game
          </button>
          <input type='text' value={hostId} onChange={ev => setHostId(ev.target.value)} />
          <button onClick={() => navigator.clipboard.writeText(hostId)}>copy</button>

        </div>

        <h4>Connected to:</h4>
        <ul>
          {clients.map((c, i) => <li key={i}>{c}</li>)}
          {getConnectedState() && !clients.length && <li>host</li>}
        </ul>
      </div>
      <ResponsiveCanvas
        gameDimensions={GAME_DIMENSIONS}
        setReference={setCanvasContext}
      />
    </>
  );
};

export default App;
