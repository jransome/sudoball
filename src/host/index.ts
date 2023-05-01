import { Dispatch } from 'react';
import { PeerId, PlayerInfo, RTCClientMessage } from '../types';
import { GAME_FRAMERATE_HZ } from '../config';
import { Team } from '../enums';
import { RTCHost } from './RTCHost';
import { CanvasPainter } from '../CanvasPainter';
import { GameEngine } from '../game';
import { getLocalInput } from '../input';

type Params = {
  selfId: PeerId;
  onPlayerLineupChange: Dispatch<React.SetStateAction<PlayerInfo[]>>;
  onGameAnnouncement: (message: string) => void;
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
            isLocalPlayer: p.id === selfId,
          };
        }),
      };
      CanvasPainter.paintGameState(renderableState);
    });

    game.on('goal', (scoringTeam) => {
      // TODO: only send data, not concerned with message presentation here
      const announcementMessage = `${Team[scoringTeam]} Team Scored!`;
      onGameAnnouncement(announcementMessage);
      rtc.broadcast({ type: 'GAME_ANNOUNCEMENT', payload: announcementMessage });
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
