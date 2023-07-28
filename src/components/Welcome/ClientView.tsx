import { useState } from 'react';
import { PeerId } from '../../types';
import { useStyles } from './Welcome.styles';

type Props = {
  hostId: PeerId;
  playerName: string;
  onJoinGame: (hostId: PeerId, playerName: string) => Promise<void>;
};

export const ClientView = ({ hostId, playerName, onJoinGame }: Props) => {
  const classes = useStyles();
  const [attemptingConnection, setAttemptingConnection] = useState(false);
  const [joinErrorMessage, setJoinErrorMessage] = useState('');

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
    <>
      <button
        className={classes.createOrJoinGameButton}
        id='join-game'
        onClick={onJoinClicked}
        disabled={!playerName || attemptingConnection}
      >
        {attemptingConnection ? 'Joining...' : 'Join Game'}
      </button>
      {joinErrorMessage && <p>{joinErrorMessage}</p>}
    </>
  );
};
