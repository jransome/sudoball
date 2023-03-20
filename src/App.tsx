import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { ConnectionClient } from './ConnectionClient';
import { ConnectionHost } from './ConnectionHost';
import PitchRenderer from './PitchRenderer';

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

const App = () => {
  const classes = useStyles();
  const [isClientAndConnected, setIsClientAndConnected] = useState(false);
  const [hostId, setHostId] = useState('');
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<string[][]>([]);

  const [clients, setClients] = useState<Set<string>>(new Set());
  const [connHost, setConnHost] = useState<ConnectionHost>();
  const [connClient, setConnClient] = useState<ConnectionClient>();

  const createGame = () => {
    const host = new ConnectionHost();
    setHostId(host.hostId);
    host.startHosting();
    host.on('clientConnected', (id) => {
      setClients(prev => new Set([...prev, id]));
    });
    host.on('clientDisconnected', (id) => {
      setClients(prev => new Set(prev.add(id)));
      setClients((prev) => {
        prev.delete(id);
        return new Set(prev);
      });
    });
    host.on('messageReceived', ({ data, clientId }) => {
      setReceivedMessages(prev => [...prev, [clientId, data.message]]);
    });
    setConnHost(host);
  };

  const joinGame = async (hostId: string) => {
    const client = new ConnectionClient();
    await client.connectToHost(hostId);
    setConnClient(client);
    setIsClientAndConnected(true);
    client.on('messageReceived', (data) => {
      setReceivedMessages(prev => [...prev, ['host', data.message]]);
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
        {/* <PitchRenderer
          gameObjects={gameObjects}
        /> */}
      </div>
    </div>
  );
};

export default App;
