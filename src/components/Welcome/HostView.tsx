import { useState } from 'react';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  createGameButton: {
    color: '#060214',
    backgroundColor: '#EB3FFF',
    '&:hover': {
      backgroundColor: '#38EFEF',
      color: '#242F40'
    },
  },
});

type Props = {
  playerName: string;
  onCreateGame: (playerName: string) => void;
};

export const HostView = ({ playerName, onCreateGame }: Props) => {
  const classes = useStyles();
  const [clicked, setClicked] = useState(false);

  const onCreateClicked = () => {
    localStorage.setItem('playerName', playerName);
    setClicked(true);
    onCreateGame(playerName);
  };

  return (
    <button
      className={classes.createGameButton}
      id='create-game'
      onClick={onCreateClicked}
      disabled={!playerName || clicked}
    >
      Create Game
    </button>
  );
};
