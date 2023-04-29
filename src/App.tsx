import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { PeerId, PlayerInfo } from './types';
import { CANVAS_NATIVE_RESOLUTION } from './config';
import { generateReadableId } from './id';
import { ResponsiveCanvas } from './ResponsiveCanvas';
import { Welcome } from './components/Welcome';
import { Lobby } from './components/Lobby';
import { joinGame } from './client';
import { createGame } from './host';
import { Team } from './enums';

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

export enum View {
  Welcome,
  Lobby,
  Game,
  About,
}

export const App = () => {
  const classes = useStyles();
  const [selfId] = useState<PeerId>(generateReadableId());
  const [hostId, setHostId] = useState<PeerId>('');
  const [activeView, setActiveView] = useState(View.Welcome);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  
  const [hostInterface, setHostInterface] = useState<ReturnType<typeof createGame>>();
  const [clientInterface, setClientInterface] = useState<Awaited<ReturnType<typeof joinGame>>>();

  return (
    <>
      <Welcome
        visible={activeView === View.Welcome}
        invitationHostId={new URLSearchParams(document.location.search).get('hostId') || ''}
        onCreateGame={(name) => {
          const host = createGame(selfId, name, setPlayers);
          setHostInterface(host);
          setHostId(selfId);
          setActiveView(View.Lobby);
        }}
        onJoinGame={async (hostId, name) => {
          const client = await joinGame(hostId, name, setPlayers, () => setActiveView(View.Game));
          setClientInterface(client);
          setHostId(hostId);
          setActiveView(View.Lobby);
        }}
      />

      <Lobby
        visible={activeView === View.Lobby}
        selfId={selfId}
        hostId={hostId}
        players={players}
        onStartGame={() => {
          setActiveView(View.Game);
          hostInterface?.startGame(players);
        }}
        onTeamChanged={(newTeam: Team) => { 
          const gameInterface = hostInterface || clientInterface;
          gameInterface?.changeTeam(newTeam);
        }}
      />

      <div className={classes.controls}>
        <h4>Sudoball</h4>
      </div>

      <ResponsiveCanvas canvasResolution={CANVAS_NATIVE_RESOLUTION} />

      <h4>Players:</h4>
      <ul>
        {players.map(({ id, name }, i) => <li key={i}>{name} | {id} {id === selfId && '(you)'}</li>)}
      </ul>
    </>
  );
};
