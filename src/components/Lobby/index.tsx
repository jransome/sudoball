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
    background: "linear-gradient(to right top, #11108e, #10119d, #1011ad, #0e12bc, #0d12cc, #3f0ed3, #5b08d9, #7200df, #9700dc, #b400d9, #ce00d6, #e518d3)"
  },
  content: {
    minWidth: '300px',
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

  const someUnassigned = players.some(p => p.team === Team.None);
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
          <span id='invite-link'>{inviteLink}</span>
          <button onClick={onCopyClick}>
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <TeamChooser
          onSelfTeamChange={onTeamChanged}
          players={players}
        />

        {selfId === hostId &&
          <button id='start-game' onClick={() => onStartGame()} disabled={someUnassigned} >
            {someUnassigned ? 'Waiting for players to choose teams...' : 'Start Game'}
          </button>
        }
      </div>
    </div>
  );
};

