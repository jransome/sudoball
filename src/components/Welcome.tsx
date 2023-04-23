import { useState } from 'react';
import { PeerId } from '../types';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'fixed',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgb(155, 190, 68)',
  },
  content: {
    minWidth: '300px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
  },
  gameControls: {
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
  onCreateGame: (playerName: string) => void;
  onJoinGame: (hostId: PeerId, playerName: string) => Promise<void>;
  invitationHostId: PeerId | null;
}

export const Welcome = ({ visible, onCreateGame, onJoinGame, invitationHostId }: Props) => {
  const classes = useStyles();
  const [attemptingConnection, setAttemptingConnection] = useState(false);
  const [joinErrorMessage, setJoinErrorMessage] = useState('');
  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');
  const [hostId, setHostId] = useState(invitationHostId || '');

  if (!visible) return null;

  const onCreateClicked = () => {
    localStorage.setItem('playerName', playerName);
    onCreateGame(playerName);
  };

  const onJoinClicked = async () => {
    localStorage.setItem('playerName', playerName);
    setAttemptingConnection(true);
    try {
      await onJoinGame(hostId, playerName);
    } catch (error) {
      setJoinErrorMessage(`Failed to join: ${error}`);
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.content}>
        <h1>Sudoball</h1>

        <input
          id='player-name'
          type='text'
          placeholder='Enter your name'
          value={playerName}
          onChange={ev => setPlayerName(ev.target.value)}
        />

        <div className={classes.gameControls}>
          {!invitationHostId &&
            <>
              <button
                id='create-game'
                onClick={onCreateClicked}
                disabled={!playerName || attemptingConnection}
              >
                Create Game
              </button>
              Or
              <input
                id='host-id'
                type='text'
                placeholder='Enter game id'
                value={hostId} onChange={ev => setHostId(ev.target.value)}
              />
            </>
          }
          <button
            id='join-game'
            onClick={onJoinClicked}
            disabled={!playerName || !hostId || attemptingConnection}
          >
            {attemptingConnection ? 'Joining...' : 'Join Game'}
          </button>

          {joinErrorMessage && <p>{joinErrorMessage}</p>}
        </div>
      </div>
    </div>
  );
};
