import { useState } from 'react';
import { PeerId } from '../../types';
import { createUseStyles } from 'react-jss';
import { ClientView } from './ClientView';
import { HostView } from './HostView';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'fixed',
    width: '100%',
    height: '100%',
    backgroundColor: '#324376',
    color: '#E56B6F'
  },
  content: {
    minWidth: '300px',
    backgroundColor: '#324376',
    borderRadius: '4px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
  },
  controls: {
    paddingTop: '20px',
    height: '150px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  nameInput: {
    padding: '12px 20px',
    fontFamily: 'Bruno Ace',
    backgroundColor:  '#324376',
    color: '#E56B6F',
    borderColor:'#E56B6F'
  }
});

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
        <h1>Sudoball</h1>

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
