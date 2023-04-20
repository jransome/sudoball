import { Team } from './config';

export type PeerId = string; // unique identifier for each rtc (player) connection

export type Vector2 = {
  x: number;
  y: number;
}
// export type Polygon = Vector2[];
export type Circle = {
  position: Vector2;
  radius: number;
};

export type RenderablePlayer = {
  id: PeerId;
  team: Team;
  position: Vector2;
  isKicking: boolean;
}

export type RenderableGameState = {
  ball: Vector2;
  players: RenderablePlayer[];
}

export type InitPlayer = {
  peerId: PeerId;
  name: string;
  team: Team;
}

export type Input = {
  movement: Vector2;
  kick: boolean;
}

export interface TransmittedInput extends Input {
  frameIndex: number;
}

export type PlayerInputs = Record<PeerId, Input>

type RTCMessage<T extends RTCHostMessageType | RTCClientMessageType, P extends object> = {
  type: T;
  payload: P;
}

export type RTCHostMessageType =
  | 'START'
  | 'UPDATE'
  | 'PLAYER_LINEUP_CHANGE'

export type RTCHostMessage =
  | RTCGameStarted
  | RTCGameUpdate
  | RTCPlayerLineupChanged

export type RTCClientMessageType =
  | 'INPUT'

export type RTCClientMessage =
  | RTCOtherPlayerInput

export type RTCOtherPlayerInput = RTCMessage<'INPUT', Input>
export type RTCGameStarted = RTCMessage<'START', InitPlayer[]>
export type RTCGameUpdate = RTCMessage<'UPDATE', RenderableGameState>
export type RTCPlayerLineupChanged = RTCMessage<'PLAYER_LINEUP_CHANGE', [PeerId, InitPlayer][]>
