import { useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { CANVAS_NATIVE_RESOLUTION, GAME_FRAMERATE_HZ, INPUT_SEND_RATE_HZ, Team } from './config';
import { RTCHost } from './RTCHost';
import { RTCClient } from './RTCClient';
import { ResponsiveCanvas } from './ResponsiveCanvas';
import { PeerId, RTCClientMessage, RTCHostMessage } from './types';
import { CanvasPainter } from './CanvasPainter';
// import { ParticipantManager } from './participants';
import { generateReadableId } from './id';
import { GameEngine } from './game';
import { getLocalInput } from './input';

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

const App = () => {
  const classes = useStyles();

  const [hostId, setHostId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [attemptingConnection, setAttemptingConnection] = useState(false);
  const [participants, setParticipants] = useState<Record<PeerId, { name: string; team: Team; }>>({});

  const [rtcHost, setRtcHost] = useState<RTCHost>();
  const [gameInstance, setGameInstance] = useState<GameEngine>();

  const startGame = () => {
    const initPlayers = Object.entries(participants).map(([peerId, { name, team }]) => ({ peerId, name, team }));
    // rtcHost!.broadcast({ type: 'START', payload: initPlayer });

    gameInstance!.on('update', (renderableState) => {
      rtcHost!.broadcast({ type: 'UPDATE', payload: renderableState });
      CanvasPainter.paintGameState(hostId, renderableState);
    });

    gameInstance!.start(initPlayers);

    // ParticipantManager.HostInterface.add(
    //   host.peerId,
    //   host.clients.length % 2 === 0 ? Team.Red : Team.Blue,
    // );
  };

  const createGame = () => {
    const hostId = generateReadableId();
    setHostId(hostId);
    const rtc = new RTCHost(hostId);
    setRtcHost(rtc);
    // ParticipantManager.reset(hostId);

    const game = new GameEngine({
      localPlayerId: hostId,
      frameRateHz: GAME_FRAMERATE_HZ,
      pollLocalInput: getLocalInput,
    });
    setGameInstance(game);

    setParticipants(prev => ({
      ...prev,
      [hostId]: { name: hostId, team: Team.Blue },
    }));

    rtc.on('clientConnected', (id) => {
      console.log(id, 'joined');

      setParticipants(prev => ({
        ...prev,
        [id]: { name: id, team: Team.Blue },
      }));
      setIsConnected(true);

      // ParticipantManager.HostInterface.add(
      //   id,
      //   rtc.clients.length % 2 === 0 ? Team.Red : Team.Blue,
      // );
      // rtc.broadcast({ type: 'PLAYER_LINEUP_CHANGE', payload: ParticipantManager.HostInterface.participants });
    });

    rtc.on('clientDisconnected', (id) => {
      setParticipants((prev) => {
        delete prev[id];
        return prev;
      });
      setIsConnected(rtc.clients.length > 0);
      // ParticipantManager.HostInterface.remove(id);
      // rtc.broadcast({ type: 'PLAYER_LINEUP_CHANGE', payload: ParticipantManager.HostInterface.participants });
    });

    rtc.on('clientMessage', (clientId: PeerId, message: RTCClientMessage) => {
      // ParticipantManager.HostInterface.playerInputs.set(clientId, message.payload);
      if (message.type === 'INPUT') {
        game.registerInput(clientId, message.payload);
      }
    });

    rtc.startHosting();
  };

  const [inputInterval, setInputInterval] = useState(33);
  const ii = useRef(inputInterval);
  ii.current = inputInterval;

  const joinGame = async (hostId: string) => {
    const peerId = generateReadableId();
    const rtc = new RTCClient(peerId);

    console.log('me:', peerId);

    rtc.on('hostMessage', (message: RTCHostMessage) => {
      if (message.type === 'UPDATE') {
        CanvasPainter.paintGameState(peerId, message.payload);
      }
    });

    rtc.on('disconnected', () => setIsConnected(false)); // TODO: update canvas
    await rtc.connectToHost(hostId);

    // setInterval(() => {
    //   rtc.sendToHost({ type: 'INPUT', payload: getLocalInput() });
    // }, 1000 / INPUT_SEND_RATE_HZ);

    const sendInput = () => {
      console.log('i', ii.current);
      rtc.sendToHost({ type: 'INPUT', payload: getLocalInput() });
      setTimeout(sendInput, ii.current);
    };
    sendInput();

    setIsConnected(true);
  };

  return (
    <>
      {!rtcHost && <input type='number' value={inputInterval} onChange={ev => setInputInterval(+ev.target.value)} />}
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

        {!rtcHost &&
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
        }
        <input id='host-id' type='text' value={hostId} onChange={ev => setHostId(ev.target.value)} />
        <button onClick={() => navigator.clipboard.writeText(hostId)}>copy</button>
        {rtcHost &&
          <button
            id='start-game'
            onClick={() => {
              startGame();
            }}
            disabled={gameInstance?.running}
          >
            Start Game
          </button>
        }

      </div>
      <ResponsiveCanvas canvasResolution={CANVAS_NATIVE_RESOLUTION} />

      <h4>Players:</h4>
      <ul>
        {Object.entries(participants).map(([peerId, { name }], i) => <li key={i}>{name} | {peerId} {peerId === hostId && '(you)'}</li>)}
        {isConnected && !participants.length && <li>host</li>}
      </ul>
    </>
  );
};

export default App;
