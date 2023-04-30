# Sudoball

## Plan
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
        - [ ] kickoff countdown
        - [ ] goal announcement
        - [ ] player stats - touches, goals, saves?
        - [x] kick radius indicator
        - [ ] game clock
        - [ ] goals scored
        - [x] render player names under avatar
        - [ ] meme avatars
        - [ ] sfx on kick/scoring
        - [ ] game summary on match end

### Bugs
  - [ ] can't use arrow keys/space to type name (or anything else) as these are game controls

### Optimisations
  - [x] send simpler input data structure
  - [ ] compress game state data structure + truncate numbers
