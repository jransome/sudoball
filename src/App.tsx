import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { ConnectionClient } from './rtc/ConnectionClient';
import { ConnectionHost } from './rtc/ConnectionHost';
import PitchRenderer from './PitchRenderer';
import { GameEngine } from './GameEngine';
import { GameObjects, Vector2 } from './types';
import { getMovementInput } from './controls';

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

const FRAMERATE_HZ = 60;
const CANVAS_DIMENSIONS: Vector2 = {
  x: 600,
  y: 400,
};

const App = () => {
  const classes = useStyles();

  const [isClientAndConnected, setIsClientAndConnected] = useState(false);
  const [hostId, setHostId] = useState('');
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<string[][]>([]);

  const [clients, setClients] = useState<Set<string>>(new Set());
  const [connHost, setConnHost] = useState<ConnectionHost>();
  const [connClient, setConnClient] = useState<ConnectionClient>();

  const [gameObjects, setGameObjects] = useState<GameObjects>({
    boxes: [],
    boundaries: [],
    player: {
      position: { x: 100, y: 200 },
      radius: 20,
    },
  });
  
  const startEngine = (host) => {
    console.log('started engine');
    const gameEngine = new GameEngine(CANVAS_DIMENSIONS, FRAMERATE_HZ);
    gameEngine.start();
    gameEngine.on('update', (gameState, sendInputs) => {
      sendInputs(getMovementInput());
      host.broadcast(gameState);
      setGameObjects(gameState); // set some rendering component's state
    });
    gameEngine.on('gameEvent', (gameEvent) => {
      /**
       * any event that changes the ui, eg:
       * game started
       * goal scored
       * game ended
      */
    });
  };

  const createGame = () => {
    const host = new ConnectionHost();
    setHostId(host.hostId);
    host.startHosting();
    host.on('clientConnected', (id) => {
      setClients(prev => new Set([...prev, id]));
    });
    host.on('clientDisconnected', (id) => {
      console.log('client disconnected', id);
      setClients(prev => new Set(prev.add(id)));
      setClients((prev) => {
        prev.delete(id);
        return new Set(prev);
      });
    });
    host.on('messageReceived', (clientId, data) => {
      // setReceivedMessages(prev => [...prev, [clientId, data.message]]);

      // gets player inputs and 'queue'(?) them for inputting to the engine

    });

    startEngine(host);


    setConnHost(host);
  };

  const joinGame = async (hostId: string) => {
    const client = new ConnectionClient();
    await client.connectToHost(hostId);
    setConnClient(client);
    setIsClientAndConnected(true);
    client.on('messageReceived', (data) => {
      // setReceivedMessages(prev => [...prev, ['host', data.message]]);

      // get player input and send it back to keep in lock step with engine frame rate
      // client.sendToHost({ message: 'fake input x, y, spacebarPressed' });

      setGameObjects(data);
    });
  };

  const sendMessage = (message: string) => {
    console.log('sending', message);
    connHost?.broadcast({ message });
    connClient?.sendToHost({ message });
  };

  const isConnected = () => isClientAndConnected || !!clients.size;

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
          <input type="text" value={hostId} onChange={ev => setHostId(ev.target.value)} />
          <button onClick={() => navigator.clipboard.writeText(hostId)}>copy</button>

        </div>
        <div>
          <input disabled={!isConnected()} type="text" value={message} onChange={ev => setMessage(ev.target.value)} />
          <button disabled={!isConnected()} onClick={() => sendMessage(message)}>
            send
          </button>
        </div>

        <h4>Connected to:</h4>
        <ul>
          {[...clients.values()].map((c, i) => <li key={i}>{c}</li>)}
          {connClient && <li>host</li>}
        </ul>

        <h4>messages</h4>
        <ul>
          {receivedMessages.map(([sender, message], i) => <li key={i}><i>{sender} said: </i>{message}</li>)}
        </ul>
        <PitchRenderer
          canvasDimensions={CANVAS_DIMENSIONS}
          gameObjects={gameObjects}
        />
      </div>
    </div>
  );
};

export default App;
