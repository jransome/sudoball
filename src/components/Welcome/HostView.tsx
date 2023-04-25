import { useState } from 'react';

type Props = {
  playerName: string;
  onCreateGame: (playerName: string) => void;
};

export const HostView = ({ playerName, onCreateGame }: Props) => {
  const [clicked, setClicked] = useState(false);

  const onCreateClicked = () => {
    localStorage.setItem('playerName', playerName);
    setClicked(true);
    onCreateGame(playerName);
  };
  
  return (
    <button
      id='create-game'
      onClick={onCreateClicked}
      disabled={!playerName || clicked}
    >
      Create Game
    </button>
  );
};
