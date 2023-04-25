import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { PeerId, PlayerInfo } from '../../types';
import { Team } from '../../enums';
import { TeamChooser } from './TeamChooser';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'fixed',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgb(0, 0, 0, 0.6)',
  },
  content: {
    minWidth: '300px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
  },
});

type Props = {
  visible: boolean;
  selfId: PeerId;
  hostId: PeerId;
  players: PlayerInfo[];
  onStartGame: () => void;
  onTeamChanged: (newTeam: Team) => void;
}

const constructInviteLink = (hostId: PeerId) => {
  const inviteLink = new URL(document.URL);
  inviteLink.searchParams.set('hostId', hostId);
  return inviteLink.toString();
};

export const Lobby = ({ visible, selfId, hostId, players, onStartGame, onTeamChanged }: Props) => {
  const classes = useStyles();
  const inviteLink = constructInviteLink(hostId);
  const [isCopied, setIsCopied] = useState(false);

  if (!visible) return null;

  const someUnassigned = players.some(p => p.team === Team.Unassigned);
  const onCopyClick = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={classes.container}>
      <div className={classes.content}>
        <h2>Lobby</h2>

        <div>
          <p>Invite Link:</p>
          <span>{inviteLink}</span>
          <button onClick={onCopyClick}>
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <TeamChooser
          onSelfTeamChange={onTeamChanged}
          players={players}
        />

        {selfId === hostId &&
          <button id='join-game' onClick={() => onStartGame()} disabled={someUnassigned} >
            {someUnassigned ? 'Waiting for players to choose teams...' : 'Start Game'}
          </button>
        }
      </div>
    </div>
  );
};

