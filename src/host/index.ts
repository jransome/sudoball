import { Dispatch } from 'react';
import { GameAnnouncement, PeerId, PlayerInfo, RTCClientMessage } from '../types';
import { GAME_FRAMERATE_HZ } from '../config';
import { Team } from '../enums';
import { RTCHost } from './RTCHost';
import { CanvasPainter } from '../CanvasPainter';
import { GameEngine } from '../game';
import { getLocalInput } from '../input';

type Params = {
  selfId: PeerId;
  onPlayerLineupChange: Dispatch<React.SetStateAction<PlayerInfo[]>>;
  onGameAnnouncement: (announcement: GameAnnouncement) => void;
}

export const createGame = ({ selfId, onPlayerLineupChange, onGameAnnouncement }: Params) => {
  const rtc = new RTCHost(selfId);
  const game = new GameEngine({
    localPlayerId: selfId,
    frameRateHz: GAME_FRAMERATE_HZ,
    pollLocalInput: getLocalInput,
  });

  rtc.on('clientDisconnected', (id) => {
    onPlayerLineupChange((prev) => {
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
      onPlayerLineupChange((prev) => {
        const newPlayerLineup = prev.concat({ id: clientId, name: message.payload.name, team: Team.None });
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
    CanvasPainter.setPlayerLookup(new Map(players.map(p => [p.id, p])));

    game.on('update', (newState) => {
      rtc.broadcast({ type: 'UPDATE', payload: newState });
      CanvasPainter.paintGameState(newState, selfId);
    });

    game.on('kickoff', (countdownSeconds) => {
      const kickoffAnnouncement: GameAnnouncement = {
        type: 'KICKOFF',
        countdownSeconds,
      };
      onGameAnnouncement(kickoffAnnouncement);
      rtc.broadcast({ type: 'GAME_ANNOUNCEMENT', payload: kickoffAnnouncement });
    });

    game.on('goal', (scoringTeam, scores) => {
      const goalAnnouncement: GameAnnouncement = {
        type: 'GOAL',
        scoringTeam,
        scores,
      };
      onGameAnnouncement(goalAnnouncement);
      rtc.broadcast({ type: 'GAME_ANNOUNCEMENT', payload: goalAnnouncement });
    });

    game.start(players);
  };

  const changePlayerTeam = (id: PeerId, newTeam: Team) => onPlayerLineupChange((prev) => {
    const newPlayerLineup = prev.map(p => p.id === id ? { ...p, team: newTeam } : p);
    rtc.broadcast({ type: 'PLAYER_LINEUP_CHANGE', payload: newPlayerLineup });
    return newPlayerLineup;
  });

  const changeTeam = (newTeam: Team) => changePlayerTeam(selfId, newTeam);

  return {
    startGame,
    changeTeam,
  };
};
