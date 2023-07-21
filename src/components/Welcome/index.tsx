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
    background: "linear-gradient(to right top, #11108e, #10119d, #1011ad, #0e12bc, #0d12cc, #3f0ed3, #5b08d9, #7200df, #9700dc, #b400d9, #ce00d6, #e518d3)"
  },
  content: {
    minWidth: '300px',
    borderRadius: '4px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column'
  },
  controls: {
    height: '150px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  nameInput: {
    paddingTop: '10px',
    fontFamily: 'Bruno Ace',
    textAlign: 'center',
    fontSize: '20px',
    background: "transparent",
    color: '#38EFEF',
     border: 'none',
    '&:focus': {
      outline: 'none',
    },
    },
  
  title:{
    color: '#EB3FFF',
    textAlign: 'center'
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
