import { Dispatch } from 'react';
import { PeerId, PlayerInfo, RTCClientMessage } from '../types';
import { GAME_FRAMERATE_HZ } from '../config';
import { Team } from '../enums';
import { RTCHost } from './RTCHost';
import { CanvasPainter } from '../CanvasPainter';
import { GameEngine } from '../game';
import { getLocalInput } from '../input';

export const createGame = (
  hostId: PeerId,
  hostPlayerName: string,
  setPlayers: Dispatch<React.SetStateAction<PlayerInfo[]>>,
) => {
  const rtc = new RTCHost(hostId);
  const game = new GameEngine({
    localPlayerId: hostId,
    frameRateHz: GAME_FRAMERATE_HZ,
    pollLocalInput: getLocalInput,
  });

  setPlayers([{ id: hostId, name: hostPlayerName, team: Team.Unassigned }]);
  rtc.on('clientDisconnected', (id) => {
    setPlayers((prev) => {
      const newPlayerLineup = prev.filter(p => p.id !== id);
      rtc.broadcast({ type: 'PLAYER_LINEUP_CHANGE', payload: newPlayerLineup });
      return newPlayerLineup;
    });
  });

  rtc.on('clientMessage', (clientId: PeerId, message: RTCClientMessage) => {
    if (message.type === 'INPUT') {
      game.registerInput(clientId, message.payload);
      return;
    }

    if (message.type === 'JOINED') {
      setPlayers((prev) => {
        const newPlayerLineup = prev.concat({ id: clientId, name: message.payload.name, team: Team.Unassigned });
        rtc.broadcast({ type: 'PLAYER_LINEUP_CHANGE', payload: newPlayerLineup });
        return newPlayerLineup;
      });
      return;
    }

    if (message.type === 'TEAM_CHANGE') {
      changePlayerTeam(clientId, message.payload);
      return;
    }

    console.error('received unprocessable message from client', clientId, message);
  });

  rtc.startHosting();

  const startGame = (players: PlayerInfo[]) => {
    rtc.broadcast({ type: 'START', payload: players });

    const playerLookup = new Map(players.map(p => [p.id, p])); // maybe lives in the renderer

    game.on('update', (newState) => {
      rtc.broadcast({ type: 'UPDATE', payload: newState });
      const renderableState = {
        ballPosition: newState.ball,
        players: newState.players.map((p) => {
          const playerInfo = playerLookup.get(p.id);
          if (!playerInfo) {
            console.error('Unrecognised player id', p);
          }

          return {
            ...p,
            ...playerInfo!,
            isLocalPlayer: p.id === hostId,
          };
        }),
      };
      CanvasPainter.paintGameState(renderableState);
    });
    
    game.on('goal', (scoringTeam) => {
      rtc.broadcast({ type: 'GOAL_SCORED', payload: scoringTeam });
      // paint something
    });

    game.start(players);
  };

  const changePlayerTeam = (id: PeerId, newTeam: Team) => setPlayers((prev) => {
    const newPlayerLineup = prev.map(p => p.id === id ? { ...p, team: newTeam } : p);
    rtc.broadcast({ type: 'PLAYER_LINEUP_CHANGE', payload: newPlayerLineup });
    return newPlayerLineup;
  });

  const changeTeam = (newTeam: Team) => changePlayerTeam(hostId, newTeam);

  return {
    startGame,
    changeTeam,
  };
};
