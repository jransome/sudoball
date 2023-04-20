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
    - [ ] join via url
    - [ ] allow players to choose name
    - [ ] allow players to choose team
    - [ ] team randomiser
    - [ ] set max number of goals
    - [ ] set match time limit
    - [ ] handling client drop out
    - [ ] handling host drop out
- [ ] game
    - [ ] handling client join during game
    - [ ] handling client drop out
    - [ ] handling host drop out
    - [ ] spectating?
    - [ ] send simpler input data structure?
    - [ ] mechanics
        - [ ] teams
        - [x] starting the game
        - [x] ability to kick the ball
        - [x] add goals and posts
        - [x] goal detection
        - [ ] reset positions after goal
        - [ ] player stats - touches, goals, saves?
        - [ ] ending the match on time/goal limit
    - [ ] ui
        - [ ] make it look like a football pitch
        - [x] kick radius indicator
        - [ ] game clock
        - [ ] goals scored
        - [x] render player names under avatar
        - [ ] meme avatars
        - [ ] sfx on kick/scoring
        - [ ] game summary on match end
