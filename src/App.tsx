import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { GAME_BOUNDARY_DIMENSIONS, GAME_FRAMERATE_HZ, Team } from './config';
import { RTCHost } from './RTCHost';
import { RTCClient } from './RTCClient';
import { ResponsiveCanvas } from './ResponsiveCanvas';
// import { GameEngine } from './game';
import { PeerId, PlayerInputsSnapshot, RTCOtherPlayerInput, RTCClientMessage, RTCGameStarted, RTCHostMessage, RTCHostMessageType, RTCPlayerLineupChanged, RenderableGameState } from './types';
import { CanvasPainter } from './CanvasPainter';
import { ParticipantManager } from './participants';
import { generateReadableId } from './id';
import { PredictiveGameEngine } from './game';
import { getLocalInput } from './input';
import { EngineTest } from './game/EngineTest';

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

let hostGameInstance: PredictiveGameEngine = null!;

// setInterval(() => console.log(clientStates), 3000);

const App = () => {
  const classes = useStyles();

  const [hostId, setHostId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [attemptingConnection, setAttemptingConnection] = useState(false);
  const [participants, setParticipants] = useState<Record<PeerId, { name: string; team: Team; }>>({});

  const [rtcHost, setRtcHost] = useState<RTCHost>();
  const [tickI, setTickI] = useState(0);

  const startGame = () => {

    const initPlayer = Object.entries(participants).map(([peerId, { name, team }]) => ({ peerId, name, team }));
    // playerInputsSnapshot = Object.keys(participants).map(pId => [pId, get])
    rtcHost!.broadcast({ type: 'START', payload: initPlayer });

    hostGameInstance = new PredictiveGameEngine({
      localPlayerId: hostId,
      msPerFrame: 1000 / GAME_FRAMERATE_HZ,
      pollLocalInput: getLocalInput,
    });

    // const otherId = Object.keys(participants).find(k => k !== hostId)!;
    hostGameInstance.on('update', (localInputSnapshot, renderableState) => {
      // if (!isLagging) 
      // console.log('sending', localInputSnapshot.i);
      rtcHost!.broadcast({ type: 'INPUT', payload: { id: hostId, ...localInputSnapshot } });
      rtcHost!.broadcast({ type: 'STATE', payload: { id: hostId, ...renderableState } });

      CanvasPainter.paintGameState(renderableState);
      setTickI(localInputSnapshot.i);
    });

    hostGameInstance.start(initPlayer);

    // GameEngine.on('gameEvent', (gameEvent) => {
    //   /**
    //    * any event that changes the ui, eg:
    //    * game started
    //    * goal scored
    //    * game ended
    //   */
    // });

    // ParticipantManager.HostInterface.add(
    //   host.peerId,
    //   host.clients.length % 2 === 0 ? Team.Red : Team.Blue,
    // );
    // GameEngine.start();
  };

  const createGame = () => {
    const hostId = generateReadableId();
    setHostId(hostId);
    const rtc = new RTCHost(hostId);
    setRtcHost(rtc);
    // ParticipantManager.reset(hostId);

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
        // console.log('received', clientId, message.payload.i);
        rtc.broadcast(message, [clientId]);
        hostGameInstance && hostGameInstance.reconcileInputUpdate(message.payload);
      }

      if (message.type === 'STATE') {
        CanvasPainter.setGhost(message.payload as unknown as RenderableGameState);
        rtc.broadcast(message, [clientId]);
      }
    });

    rtc.startHosting();
  };

  const joinGame = async (hostId: string) => {
    const peerId = generateReadableId();
    const rtc = new RTCClient(peerId);
    const game = new PredictiveGameEngine({
      localPlayerId: peerId,
      msPerFrame: 1000 / GAME_FRAMERATE_HZ,
      pollLocalInput: getLocalInput,
    });
    // ParticipantManager.reset(peerId);
    console.log('me:', peerId);

    game.on('update', (localInputSnapshot, renderableState) => {
      rtc.sendToHost({ type: 'STATE', payload: { id: peerId, ...renderableState } });
      rtc.sendToHost({ type: 'INPUT', payload: { id: peerId, ...localInputSnapshot } });
      CanvasPainter.paintGameState(renderableState);
      setTickI(localInputSnapshot.i);
    });

    const onGameStart = (message: RTCGameStarted) => {
      game.start(message.payload);
    };

    const onInputUpdate = (message: RTCOtherPlayerInput) => {
      game.reconcileInputUpdate(message.payload);
    };

    const onLineupChange = (message: RTCPlayerLineupChanged) => {
      // show lineup change in ui.
      // ParticipantManager.ClientInterface.participants = new Map(message.payload);
    };

    const onState = (message) => {
      CanvasPainter.setGhost(message.payload as unknown as RenderableGameState);
    }

    type HostMessageHandler = (message: RTCHostMessage) => void;
    const hostMessageHandlers: Record<RTCHostMessageType, HostMessageHandler> = {
      START: onGameStart as HostMessageHandler,
      INPUT: onInputUpdate as HostMessageHandler,
      PLAYER_LINEUP_CHANGE: onLineupChange as HostMessageHandler,
      STATE: onState as HostMessageHandler,
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
      <EngineTest />
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
          // disabled={!hostId || attemptingConnection || isConnected}
          >
            Start Game
          </button>
        }

      </div>
      <ResponsiveCanvas gameDimensions={GAME_BOUNDARY_DIMENSIONS} />

      <h4>Tick: {tickI}</h4>
      <h4>Players:</h4>
      <ul>
        {Object.entries(participants).map(([peerId, { name }], i) => <li key={i}>{name} | {peerId} {peerId === hostId && '(you)'}</li>)}
        {isConnected && !participants.length && <li>host</li>}
      </ul>
    </>
  );
};

export default App;
