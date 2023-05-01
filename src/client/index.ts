import { PeerId, PlayerInfo, RTCHostMessage } from '../types';
import { Team } from '../enums';
import { RTCClient } from './RTCClient';
import { CanvasPainter } from '../CanvasPainter';
import { getLocalInput } from '../input';
import { INPUT_SEND_RATE_HZ } from '../config';

const inputSendIntervalMs = 1000 / INPUT_SEND_RATE_HZ;

type Params = {
  selfId: PeerId;
  hostId: PeerId;
  playerName: string;
  onPlayerLineupChange: (newLineup: PlayerInfo[]) => void;
  onGameAnnouncement: (message: string) => void;
  onGameStart: () => void;
}

export const joinGame = async ({ selfId, hostId, playerName, onPlayerLineupChange, onGameAnnouncement, onGameStart }: Params) => {
  const rtc = new RTCClient(selfId);

  let gameInProgress = false;
  console.log('me:', selfId);

  const sendInput = () => {
    if (!gameInProgress) return;
    rtc.sendToHost({ type: 'INPUT', payload: getLocalInput() });
    setTimeout(sendInput, inputSendIntervalMs);
  };

  rtc.on('hostMessage', (message: RTCHostMessage) => {
    if (message.type === 'UPDATE') {
      CanvasPainter.paintGameState(message.payload, selfId);
      return;
    }

    if (message.type === 'PLAYER_LINEUP_CHANGE') {
      onPlayerLineupChange(message.payload);
      return;
    }

    if (message.type === 'GAME_ANNOUNCEMENT') {
      onGameAnnouncement(message.payload);
      return;
    }

    if (message.type === 'START') {
      gameInProgress = true;
      CanvasPainter.setPlayerLookup(new Map(message.payload.map(p => [p.id, p])));
      onPlayerLineupChange(message.payload);
      onGameStart();
      sendInput();
      return;
    }

    console.error('received unprocessable message from host', hostId, message);
  });

  rtc.on('disconnected', () => {
    gameInProgress = false;
    alert('Disconnected from host');
    // TODO: wipe canvas
  });

  await rtc.connectToHost(hostId);

  rtc.sendToHost({ type: 'JOINED', payload: { id: selfId, name: playerName, team: Team.Unassigned } });

  return {
    changeTeam: (newTeam: Team) => rtc.sendToHost({ type: 'TEAM_CHANGE', payload: newTeam }),
  };
};
