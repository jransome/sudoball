import { useState } from 'react';
import { useStyles } from './Welcome.styles';

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
      className={classes.createOrJoinGameButton}
      id='create-game'
      onClick={onCreateClicked}
      disabled={!playerName || clicked}
    >
      Create Game
    </button>
  );
};
