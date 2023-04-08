import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { GAME_BOUNDARY_DIMENSIONS, Team } from './config';
import { RTCHost } from './RTCHost';
import { RTCClient } from './RTCClient';
import { ResponsiveCanvas } from './ResponsiveCanvas';
import { GameEngine } from './game';
import { getLocalInput } from './input';
import { PeerId, RTCClientInput, RTCGameUpdate, RTCHostMessage, RTCHostMessageType, RTCPlayerLineupChanged } from './types';
import { CanvasPainter } from './CanvasPainter';
import { ParticipantManager } from './participants';
import { generateReadableId } from './id';

const useStyles = createUseStyles({
  controls: {
    display: 'flex',
    alignItems: 'baseline',
  },
  connected: {
    color: 'greenyellow',
  },
  disconnected: {
    color: 'red',
  },
});

const startEngine = (host: RTCHost) => {
  GameEngine.on('update', (gameState) => {
    const playerInputs = ParticipantManager.HostInterface.playerInputs.set(host.peerId, getLocalInput());
    // applyInputs(playerInputs);

    host.broadcast({ type: 'GAME_UPDATE', payload: gameState });
    CanvasPainter.paintGameState(gameState);
  });

  // GameEngine.on('gameEvent', (gameEvent) => {
  //   /**
  //    * any event that changes the ui, eg:
  //    * game started
  //    * goal scored
  //    * game ended
  //   */
  // });

  ParticipantManager.HostInterface.add(
    host.peerId,
    host.clients.length % 2 === 0 ? Team.Red : Team.Blue,
  );
  GameEngine.start();
};

const App = () => {
  const classes = useStyles();

  const [hostId, setHostId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [attemptingConnection, setAttemptingConnection] = useState(false);
  const [clients, setClients] = useState<string[]>([]);

  const createGame = () => {
    const hostId = generateReadableId();
    const rtc = new RTCHost(hostId);
    ParticipantManager.reset(hostId);

    startEngine(rtc);

    rtc.on('clientConnected', (id) => {
      setClients(rtc.clients);
      setIsConnected(true);
      ParticipantManager.HostInterface.add(
        id,
        rtc.clients.length % 2 === 0 ? Team.Red : Team.Blue,
      );
      rtc.broadcast({ type: 'PLAYER_LINEUP_CHANGE', payload: ParticipantManager.HostInterface.participants });
    });

    rtc.on('clientDisconnected', (id) => {
      setClients(rtc.clients);
      setIsConnected(rtc.clients.length > 0);
      ParticipantManager.HostInterface.remove(id);
      rtc.broadcast({ type: 'PLAYER_LINEUP_CHANGE', payload: ParticipantManager.HostInterface.participants });
    });

    rtc.on('clientMessage', (clientId: PeerId, message: RTCClientInput) => {
      ParticipantManager.HostInterface.playerInputs.set(clientId, message.payload);
    });

    rtc.startHosting();

    setHostId(hostId);
  };

  const joinGame = async (hostId: string) => {
    const peerId = generateReadableId();
    const rtc = new RTCClient(peerId);
    ParticipantManager.reset(peerId);

    const onGameUpdate = (message: RTCGameUpdate) => {
      rtc.sendToHost({ type: 'CLIENT_INPUT', payload: getLocalInput() });
      CanvasPainter.paintGameState(message.payload);
    };
    const onLineupChange = (message: RTCPlayerLineupChanged) => {
      ParticipantManager.ClientInterface.participants = new Map(message.payload);
    };

    type HostMessageHandler = (message: RTCHostMessage) => void;
    const hostMessageHandlers: Record<RTCHostMessageType, HostMessageHandler> = {
      GAME_UPDATE: onGameUpdate as HostMessageHandler,
      PLAYER_LINEUP_CHANGE: onLineupChange as HostMessageHandler,
    };

    rtc.on('hostMessage', (message: RTCHostMessage) => {
      const handler = hostMessageHandlers[message.type];
      if (!handler) {
        console.error('received unprocessable message from host!', message);
        return;
      }
      handler(message);
    });

    rtc.on('disconnected', () => setIsConnected(false)); // TODO: update canvas
    await rtc.connectToHost(hostId);
    setIsConnected(true);
  };

  return (
    <>
      <div className={classes.controls}>
        <h4>Sudoball</h4>
        <h3 className={isConnected ? classes.connected : classes.disconnected}>
          {isConnected ? 'Channel Open' : 'Disconnected'}
        </h3>
        <button
          id='create-game'
          onClick={() => {
            createGame();
            setAttemptingConnection(true);
          }}
          disabled={!!hostId || attemptingConnection || isConnected}
        >
          Create Game
        </button>

        <button
          id='join-game'
          onClick={() => {
            joinGame(hostId);
            setAttemptingConnection(true);
          }}
          disabled={!hostId || attemptingConnection || isConnected}
        >
          Join Game
        </button>
        <input id='host-id' type='text' value={hostId} onChange={ev => setHostId(ev.target.value)} />
        <button onClick={() => navigator.clipboard.writeText(hostId)}>copy</button>

      </div>
      <ResponsiveCanvas gameDimensions={GAME_BOUNDARY_DIMENSIONS} />

      <h4>Connected to:</h4>
      <ul>
        {clients.map((c, i) => <li key={i}>{c}</li>)}
        {isConnected && !clients.length && <li>host</li>}
      </ul>
    </>
  );
};

export default App;
