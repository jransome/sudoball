import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { PeerId, PlayerInfo } from '../types';
import * as config from '../config';

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
  lineup: {
    paddingTop: '20px',
    height: '150px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});

type Props = {
  visible: boolean;
  hostId: PeerId;
  allowStartGame: boolean;
  players: PlayerInfo[];
  onStartGame: () => void;
  onCancel: () => void;
}

const constructInviteLink = (hostId: PeerId) => {
  const inviteLink = new URL(document.URL);
  inviteLink.searchParams.set('hostId', hostId);
  return inviteLink.toString();
};

export const Lobby = ({ visible, hostId, allowStartGame, players, onStartGame, onCancel }: Props) => {
  const classes = useStyles();
  const inviteLink = constructInviteLink(hostId);
  const [isCopied, setIsCopied] = useState(false);

  if (!visible) return null;

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

        <ul className={classes.lineup}>
          {players.map(({ name }, i) => <li key={i}>{name}</li>)}

        </ul>

        {allowStartGame &&
          <button id='join-game' onClick={() => onStartGame()}>
            Start Game
          </button>
        }

      </div>
    </div>
  );
};
