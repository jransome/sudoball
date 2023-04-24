import { PeerId, RTCHostMessage } from './types';
import { Team } from './enums';
import { generateReadableId } from './id';
import { RTCClient } from './RTCClient';
import { CanvasPainter } from './CanvasPainter';
import { getLocalInput } from './input';
import { INPUT_SEND_RATE_HZ } from './config';

const inputSendIntervalMs = 1000 / INPUT_SEND_RATE_HZ;

export const joinGame = async (hostId: PeerId, playerName: string, onPlayerLineupChange: any, onGameStart: any) => {
  const peerId = generateReadableId();
  const rtc = new RTCClient(peerId);

  let isPlaying = false;
  console.log('me:', peerId);

  const sendInput = () => {
    if (!isPlaying) return;
    rtc.sendToHost({ type: 'INPUT', payload: getLocalInput() });
    setTimeout(sendInput, inputSendIntervalMs);
  };

  rtc.on('hostMessage', (message: RTCHostMessage) => {
    if (message.type === 'UPDATE') {
      CanvasPainter.paintGameState(peerId, message.payload);
      return;
    }

    if (message.type === 'PLAYER_LINEUP_CHANGE') {
      onPlayerLineupChange(message.payload);
      return;
    }

    if (message.type === 'START') {
      isPlaying = true;
      onPlayerLineupChange(message.payload);
      onGameStart();
      sendInput();
      return;
    }

    console.error('received unprocessable message from host', hostId, message);
  });

  rtc.on('disconnected', () => {
    isPlaying = false;
    alert('Disconnected from host');
    // TODO: wipe canvas
  });

  await rtc.connectToHost(hostId);

  rtc.sendToHost({ type: 'JOINED', payload: { id: peerId, name: playerName, team: Team.Unassigned } });

  return {
    requestTeamChange: (newTeam: Team) => rtc.sendToHost({ type: 'TEAM_CHANGE', payload: newTeam }),
  };
};
