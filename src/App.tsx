import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import PitchRenderer from './PitchRenderer';

const useStyles = createUseStyles({
  app: {
    margin: '0px 30px',
  },
  connected: {
    color: 'greenyellow',
  },
  disconnected: {
    color: 'red',
  },
});

const App = () => {
  const classes = useStyles();
  const [isConnected, setIsConnected] = useState(false);
  
  const [gameObjects, setGameObjects] = useState(null);


  return (
    <div className={classes.app}>
      <h1>Sudoball</h1>

      <div>
        <h3 className={isConnected ? classes.connected : classes.disconnected}>
          {isConnected ? 'Channel Open' : 'Disconnected'}
        </h3>
        <div>
          <button
            onClick={() => {
              setIsConnected(!isConnected);
              setGameObjects({

                ball: {
                  position: {
                    x: 200,
                    y: 100 + (20 * +isConnected),
                  },
                  radius: 20,
                },
              });
            }}
          >
            Create Game
          </button>

          <button>
            Join Game
          </button>

          <input type="text" />
        </div>
        <PitchRenderer
          gameObjects={gameObjects}
        />
      </div>
    </div>
  );
};

export default App;
