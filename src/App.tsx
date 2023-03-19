import { useState } from 'react'
import { createUseStyles } from 'react-jss'

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
})

function App() {
  const classes = useStyles()
  const [isConnected, setIsConnected] = useState(false)

  return (
    <div className={classes.app}>
      <h1>Sudoball</h1>

      <div>
        <h3 className={isConnected ? classes.connected : classes.disconnected}>
          {isConnected ? 'Channel Open' : 'Disconnected'}
        </h3>
        <div>
          <button>
            Create Game
          </button>

          <button>
            Join Game
          </button>

          <input type="text" />
        </div>

      </div>
    </div>
  )
}

export default App
