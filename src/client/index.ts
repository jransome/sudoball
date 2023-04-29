import { PeerId, PlayerInfo, RTCHostMessage, RenderableGameState, TransmittedGameState } from '../types';
import { Team } from '../enums';
import { generateReadableId } from '../id';
import { RTCClient } from './RTCClient';
import { CanvasPainter } from '../CanvasPainter';
import { getLocalInput } from '../input';
import { INPUT_SEND_RATE_HZ } from '../config';

const inputSendIntervalMs = 1000 / INPUT_SEND_RATE_HZ;

const stateRendererFactory = (playerLookup: Map<PeerId, PlayerInfo>, selfId: PeerId) =>
  (gameState: TransmittedGameState): RenderableGameState => ({
    ballPosition: gameState.ball,
    players: gameState.players.map((p) => {
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
  });

export const joinGame = async (
  hostId: PeerId,
  playerName: string,
  onPlayerLineupChange: (newLineup: PlayerInfo[]) => void,
  // onGoalScored: (scoringTeam: Team) => void,
  onGameStart: () => void,
) => {
  const peerId = generateReadableId();
  const rtc = new RTCClient(peerId);

  let gameInProgress = false;
  let stateToRender: (gameState: TransmittedGameState) => RenderableGameState = null!;
  console.log('me:', peerId);

  const sendInput = () => {
    if (!gameInProgress) return;
    rtc.sendToHost({ type: 'INPUT', payload: getLocalInput() });
    setTimeout(sendInput, inputSendIntervalMs);
  };

  rtc.on('hostMessage', (message: RTCHostMessage) => {
    if (message.type === 'UPDATE') {
      CanvasPainter.paintGameState(stateToRender(message.payload));
      return;
    }

    if (message.type === 'PLAYER_LINEUP_CHANGE') {
      onPlayerLineupChange(message.payload);
      return;
    }

    // if (message.type === 'GOAL_SCORED') {
    //   onGoalScored(message.payload);
    //   return;
    // }

    if (message.type === 'START') {
      gameInProgress = true;
      stateToRender = stateRendererFactory(new Map(message.payload.map(p => [p.id, p])), peerId);
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

  rtc.sendToHost({ type: 'JOINED', payload: { id: peerId, name: playerName, team: Team.Unassigned } });

  return {
    changeTeam: (newTeam: Team) => rtc.sendToHost({ type: 'TEAM_CHANGE', payload: newTeam }),
  };
};
