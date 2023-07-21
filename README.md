# Sudoball
![Screenshot 2023-07-20 at 16 45 16](https://github.com/jransome/sudoball/assets/22540551/361138c1-31d8-4e92-870d-c736ce89a791)

Welcome to Sudoball, a browser based realtime multiplayer football game (clone of haxball.com) built with WebRTC and Typescript/Node.js.

:rocket: :soccer: [Link to deployed version](https://jransome.github.io/sudoball/) :soccer: :rocket:

## Running locally
### Prerequisites

- [Node.js](https://nodejs.org/) version 18 or higher is required

### Installation

1. Clone the repository to your local machine using the following command:
```bash
  git clone https://github.com/jransome/sudoball.git
```

2. Navigate to the project directory:
```bash
  cd sudoball
```

3. Install dependencies:
```bash
  npm i
```

### Running the application
Use the following command to run the application on port 5173:
```bash
  npm run dev
```

You should now be able to access the application by visiting http://localhost:5173 in your web browser.

## Running the Tests
Before running the tests, ensure that the application is running on localhost port 5173.

Open a new terminal window and run the following command to execute the visual feedback tests:
```bash
  npm t
```
The tests will use Puppeteer to simulate a multiplayer session by opening a number of windows to "play" the game. They are purely for visual feedback and do not run programmatic assertions as you can see [here](test/e2e/connecting.test.ts).

## Contributing
Contributions are welcome! If you find any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request.

## Roadmap
- [ ] think of better name
- [x] sending json over RTCDataChannel
- [x] rendering game using canvas and physics
- [x] sending gamestate over 1 RTC (unidirectional)
- [x] connecting > 2 players in one session
- [x] sending gamestate to all players
- [x] sending/collecting client inputs to update game state
- [x] allowing clients to control independent player objects
- [x] scale canvas to browser size (independent of game)
- [ ] game setup
    - [x] join via url
    - [x] allow players to choose name
    - [x] allow players to choose team
    - [ ] allow creation of subsequent game without refreshing app
    - [ ] team randomiser
    - [ ] dynamic game variables
      - [ ] max number of goals
      - [ ] match time limit
      - [ ] fight mode
      - [ ] move speed
      - [ ] kick force
      - [ ] ball bounciness/speed
    - [ ] handling client drop out
    - [ ] handling host drop out
- [ ] game
    - [ ] handling client join during game
    - [ ] handling client drop out
    - [ ] handling host drop out
    - [ ] spectating?
    - [x] better initial positioning of players
    - [ ] mechanics
        - [x] teams
        - [x] starting the game
        - [x] ability to kick the ball
        - [x] add goals and posts
        - [x] goal detection
        - [x] reset positions after goal
        - [ ] ending the match on time/goal limit
        - [ ] centre circle thing
    - [ ] ui
        - [ ] make it look like a football pitch
        - [x] kickoff countdown
        - [x] goal announcement
        - [ ] player stats - touches, goals, saves?
        - [x] kick radius indicator
        - [ ] game clock
        - [x] goals scored
        - [x] render player names under avatar
        - [ ] meme avatars
        - [ ] sfx on kick/scoring
        - [ ] game summary on match end

### Bugs
  - [ ] can't use arrow keys/space to type name (or anything else) as these are game controls

### Optimisations
  - [x] send simpler input data structure
  - [ ] client side prediction
  - [ ] compress game state data structure + truncate numbers
  - [ ] try running requestanimationframe inside canvas component and passing game state it as a ref?
  - [ ] unify player lineup data structure/remove PlayerInfo[]
