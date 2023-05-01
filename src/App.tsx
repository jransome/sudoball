import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { PeerId, PlayerInfo } from './types';
import { generateReadableId } from './id';
import { Welcome } from './components/Welcome';
import { Lobby } from './components/Lobby';
import { joinGame } from './client';
import { createGame } from './host';
import { Team } from './enums';
import { GameRenderer } from './components/GameRenderer';

const useStyles = createUseStyles({
  header: {
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

export const App = () => {
  const classes = useStyles();
  const [selfId] = useState<PeerId>(generateReadableId());
  const [hostId, setHostId] = useState<PeerId>('');
  const [activeView, setActiveView] = useState(View.Welcome);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [gameAnnouncement, setGameAnnouncement] = useState('');

  const [hostInterface, setHostInterface] = useState<ReturnType<typeof createGame>>();
  const [clientInterface, setClientInterface] = useState<Awaited<ReturnType<typeof joinGame>>>();

  return (
    <>
      <Welcome
        visible={activeView === View.Welcome}
        invitationHostId={new URLSearchParams(document.location.search).get('hostId') || ''}
        onCreateGame={(playerName) => {
          setPlayers([{ id: selfId, name: playerName, team: Team.Unassigned }]);

          const host = createGame({
            selfId,
            onPlayerLineupChange: setPlayers,
            onGameAnnouncement: setGameAnnouncement,
          });
          setHostInterface(host);
          setHostId(selfId);
          setActiveView(View.Lobby);
        }}
        onJoinGame={async (hostId, playerName) => {
          const client = await joinGame({
            selfId,
            hostId,
            playerName,
            onPlayerLineupChange: setPlayers,
            onGameAnnouncement: setGameAnnouncement,
            onGameStart: () => setActiveView(View.Game),
          });
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

      {activeView === View.Game &&
        <>
          <div className={classes.header}>
            <h4>Sudoball</h4>
          </div>

          <GameRenderer announcementMessage={gameAnnouncement} />

          <h4>Players:</h4>
          <ul>
            {players.map(({ id, name }, i) => <li key={i}>{name} | {id} {id === selfId && '(you)'}</li>)}
          </ul>
        </>
      }
    </>
  );
};
