import { useState } from 'react';
import { PeerId } from '../../types';
import { ClientView } from './ClientView';
import { HostView } from './HostView';
import { useStyles } from './Welcome.styles';

type WelcomeProps = {
  visible: boolean;
  invitationHostId: PeerId | null;
  onCreateGame: (playerName: string) => void;
  onJoinGame: (hostId: PeerId, playerName: string) => Promise<void>;
}

export const Welcome = ({ visible, onCreateGame, onJoinGame, invitationHostId }: WelcomeProps) => {
  const classes = useStyles();
  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');

  if (!visible) return null;

  return (
    <div className={classes.container}>
      <div className={classes.content}>
        <h1 className={classes.title}>Sudoball</h1>
        <input 
          className={classes.nameInput}
          id='player-name'
          type='text'
          placeholder='Enter your name'
          value={playerName}
          onChange={ev => setPlayerName(ev.target.value)}
        />

        <div className={classes.controls}>
          {invitationHostId ?
            <ClientView hostId={invitationHostId} playerName={playerName} onJoinGame={onJoinGame} /> :
            <HostView playerName={playerName} onCreateGame={onCreateGame} />
          }
        </div>
      </div>
    </div>
  );
};
