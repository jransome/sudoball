import { useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { CANVAS_NATIVE_RESOLUTION, GAME_FRAMERATE_HZ, INPUT_SEND_RATE_HZ, Team } from './config';
import { RTCHost } from './RTCHost';
import { RTCClient } from './RTCClient';
import { ResponsiveCanvas } from './ResponsiveCanvas';
import { PeerId, PlayerInfo, RTCClientMessage, RTCHostMessage } from './types';
import { CanvasPainter } from './CanvasPainter';
import { generateReadableId } from './id';
import { GameEngine } from './game';
import { getLocalInput } from './input';
import { Welcome } from './components/Welcome';
import { Lobby } from './components/Lobby';

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

enum View {
  Welcome,
  Lobby,
  Game,
  About,
}



const joinGame = async (hostId: PeerId, playerName: string, inputIntervalRef, setPlayers, setActiveView) => {
  const peerId = generateReadableId();
  const rtc = new RTCClient(peerId);

  console.log('me:', peerId);

  // setInterval(() => {
  //   rtc.sendToHost({ type: 'INPUT', payload: getLocalInput() });
  // }, 1000 / INPUT_SEND_RATE_HZ);

  const sendInput = () => {
    rtc.sendToHost({ type: 'INPUT', payload: getLocalInput() });
    setTimeout(sendInput, inputIntervalRef.current);
  };

  rtc.on('hostMessage', (message: RTCHostMessage) => {
    if (message.type === 'UPDATE') {
      CanvasPainter.paintGameState(peerId, message.payload);
      return;
    }

    if (message.type === 'PLAYER_LINEUP_CHANGE') {
      setPlayers(message.payload);
      return;
    }

    if (message.type === 'START') {
      setPlayers(message.payload);
      setActiveView(View.Game);
      sendInput();
      return;
    }

    console.warn('received unprocessable message from host', hostId, message);
  });

  rtc.on('disconnected', () => {
    alert('Disconnected from host');
    // TODO: update canvas
  });

  await rtc.connectToHost(hostId);

  rtc.sendToHost({ type: 'JOINED', payload: { id: peerId, name: playerName } });
};


const createGame = (hostId: PeerId, hostPlayerName: string, setPlayers) => {
  // const hostId = generateReadableId();

  const rtc = new RTCHost(hostId);
  const game = new GameEngine({
    localPlayerId: hostId,
    frameRateHz: GAME_FRAMERATE_HZ,
    pollLocalInput: getLocalInput,
  });

  // setHostId(hostId);
  // setRtcHost(rtc);
  setPlayers([{ id: hostId, name: hostPlayerName, team: Team.Unassigned }]);
  // setGameInstance(game);

  rtc.on('clientDisconnected', (id) => {
    setPlayers((prev) => {
      const newPlayerLineup = prev.filter(p => p.id !== id);
      rtc.broadcast({ type: 'PLAYER_LINEUP_CHANGE', payload: newPlayerLineup });
      return newPlayerLineup;
    });
  });

  rtc.on('clientMessage', (clientId: PeerId, message: RTCClientMessage) => {
    if (message.type === 'INPUT') {
      game.registerInput(clientId, message.payload);
      return;
    }

    if (message.type === 'JOINED') {
      setPlayers((prev) => {
        const newPlayerLineup = prev.concat({ id: clientId, name: message.payload.name, team: Team.Unassigned });
        rtc.broadcast({ type: 'PLAYER_LINEUP_CHANGE', payload: newPlayerLineup });
        return newPlayerLineup;
      });
      return;
    }

    console.warn('received unprocessable message from client', clientId, message);
  });

  rtc.startHosting();

  const startGame = (players: PlayerInfo[]) => {
    rtc.broadcast({ type: 'START', payload: players });
    game.on('update', (renderableState) => {
      rtc.broadcast({ type: 'UPDATE', payload: renderableState });
      CanvasPainter.paintGameState(hostId, renderableState);
    });

    game.start(players);
  };

  return startGame;
};

export const App = () => {
  const classes = useStyles();
  const [selfId] = useState<PeerId>(generateReadableId());
  const [hostId, setHostId] = useState<PeerId>('');
  const [activeView, setActiveView] = useState(View.Welcome);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [startGame, setStartGame] = useState<(players: PlayerInfo[]) => void>(() => () => { });

  const [inputInterval, setInputInterval] = useState(1000 / INPUT_SEND_RATE_HZ);
  const ii = useRef(inputInterval);
  ii.current = inputInterval;

  return (
    <>
      <Welcome
        visible={activeView === View.Welcome}
        invitationHostId={new URLSearchParams(document.location.search).get('hostId') || ''}
        onCreateGame={(name) => {
          const start = createGame(selfId, name, setPlayers);
          setStartGame(() => (players: PlayerInfo[]) => start(players));
          setHostId(selfId);
          setActiveView(View.Lobby);
        }}
        onJoinGame={async (hostId, name) => {
          await joinGame(hostId, name, ii, setPlayers, setActiveView);
          setHostId(hostId);
          setActiveView(View.Lobby);
        }}
      />

      <Lobby
        visible={activeView === View.Lobby}
        hostId={hostId}
        allowStartGame={selfId === hostId}
        players={players}
        onStartGame={() => {
          setActiveView(View.Game);
          startGame(players);
        }}
        onCancel={() => { }}
      />

      {selfId !== hostId && <input type='number' value={inputInterval} onChange={ev => setInputInterval(+ev.target.value)} />}

      <div className={classes.controls}>
        <h4>Sudoball</h4>
      </div>

      <ResponsiveCanvas canvasResolution={CANVAS_NATIVE_RESOLUTION} />

      <h4>Players:</h4>
      <ul>
        {players.map(({ id, name }, i) => <li key={i}>{name} | {id} {id === hostId && '(you)'}</li>)}
      </ul>
    </>
  );
};
