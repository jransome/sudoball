import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { GAME_BOUNDARY_DIMENSIONS, Team } from './config';
import { RTCHost } from './RTCHost';
import { RTCClient } from './RTCClient';
import { ResponsiveCanvas } from './ResponsiveCanvas';
// import { GameEngine } from './game';
import { PeerId, PlayerInputsSnapshot, RTCAuthoritativeUpdate, RTCClientMessage, RTCGameStarted, RTCHostMessage, RTCHostMessageType, RTCPlayerLineupChanged } from './types';
import { CanvasPainter } from './CanvasPainter';
import { ParticipantManager } from './participants';
import { generateReadableId } from './id';
import { PredictiveGameEngine } from './game';
import { AuthoritativeGameEngine } from './game/AuthoritativeGameEngine';

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

let hostGameInstance: AuthoritativeGameEngine = null!;

const App = () => {
  const classes = useStyles();

  const [hostId, setHostId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [attemptingConnection, setAttemptingConnection] = useState(false);
  const [participants, setParticipants] = useState<Record<PeerId, { name: string; team: Team; }>>({});

  const [rtcHost, setRtcHost] = useState<RTCHost>();


  const startGame = () => {
    // let isLagging = false;
    // setInterval(() => {
    //   console.log('oopsie');
    //   isLagging = true;
    //   setTimeout(() => {
    //     isLagging = false;
    //   }, 500);
    // }, 5000);
    const initPlayer = Object.entries(participants).map(([peerId, { name, team }]) => ({ peerId, name, team }));
    // playerInputsSnapshot = Object.keys(participants).map(pId => [pId, get])
    rtcHost!.broadcast({ type: 'START', payload: initPlayer });

    hostGameInstance = new AuthoritativeGameEngine(hostId);

    const otherId = Object.keys(participants).find(k => k !== hostId)!;
    hostGameInstance.on('update', (lastKnownPlayerInputs, renderableGameState) => {
      // if (!isLagging) 
      console.dir('sending back', lastKnownPlayerInputs[otherId].i);
      rtcHost!.broadcast({ type: 'UPDATE', payload: lastKnownPlayerInputs });
      CanvasPainter.paintGameState(renderableGameState);
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
      if (message.type === 'CLIENT_INPUT') {
        console.log('received', clientId, message.payload.i);
        hostGameInstance && hostGameInstance.updateClientInput(clientId, message.payload);
      }

      // console.log(message)
      // rtc.broadcast(message);
    });

    rtc.startHosting();
  };

  const joinGame = async (hostId: string) => {
    const peerId = generateReadableId();
    const rtc = new RTCClient(peerId);
    const game = new PredictiveGameEngine(peerId);
    // ParticipantManager.reset(peerId);
    console.log('me:', peerId);

    game.on('update', (localInput, renderableState) => {
      rtc.sendToHost({ type: 'CLIENT_INPUT', payload: localInput });
      CanvasPainter.paintGameState(renderableState);
    });

    const onGameStart = (message: RTCGameStarted) => {
      game.start(message.payload);
    };

    const onAuthoritativeUpdate = (message: RTCAuthoritativeUpdate) => {
      game.reconcileAuthoritativeUpdate(message.payload);
    };

    const onLineupChange = (message: RTCPlayerLineupChanged) => {
      // show lineup change in ui.
      // ParticipantManager.ClientInterface.participants = new Map(message.payload);
    };

    type HostMessageHandler = (message: RTCHostMessage) => void;
    const hostMessageHandlers: Record<RTCHostMessageType, HostMessageHandler> = {
      START: onGameStart as HostMessageHandler,
      UPDATE: onAuthoritativeUpdate as HostMessageHandler,
      PLAYER_LINEUP_CHANGE: onLineupChange as HostMessageHandler,
    };

    // let receivedCount = 0;
    // setTimeout(() => {
    //   const send = (i: number) => {
    //     rtc.sendToHost({ clientCounter: i });
    //     setTimeout(() => send(i + 1), 10);
    //   };
    //   send(0);
    // }, 2000);

    rtc.on('hostMessage', (message: RTCHostMessage) => {
      // console.log({
      //   got: message.clientCounter,
      //   receivedCount,
      //   diff: receivedCount - message.clientCounter
      // });
      // receivedCount++;
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

      <h4>Players:</h4>
      <ul>
        {Object.entries(participants).map(([peerId, { name }], i) => <li key={i}>{name} | {peerId} {peerId === hostId && '(you)'}</li>)}
        {isConnected && !participants.length && <li>host</li>}
      </ul>
    </>
  );
};

export default App;
