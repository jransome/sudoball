import { Team } from './config';

type RTCMessage<T extends RTCHostMessageType | RTCClientMessageType, P extends object> = {
  type: T;
  payload: P;
}

// messages from host
export type RTCHostMessageType =
  | 'START'
  | 'UPDATE'
  | 'PLAYER_LINEUP_CHANGE'

export type RTCGameStarted = RTCMessage<'START', InitPlayer[]>
export type RTCAuthoritativeUpdate = RTCMessage<'UPDATE', PlayerInputsSnapshot>
export type RTCPlayerLineupChanged = RTCMessage<'PLAYER_LINEUP_CHANGE', [PeerId, InitPlayer][]>

export type RTCHostMessage =
  | RTCGameStarted
  | RTCAuthoritativeUpdate
  | RTCPlayerLineupChanged

// messages from client
export type RTCClientMessageType =
  | 'CLIENT_INPUT'

export type RTCClientInput = RTCMessage<'CLIENT_INPUT', TransmittedInput>
export type RTCClientMessage =
  | RTCClientInput

export type PeerId = string; // unique identifier for each rtc (player) connection

export type Vector2 = {
  x: number;
  y: number;
}
export type Polygon = Vector2[];
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

// export type Participant = {
//   name: string;
//   team: Team;
// }

export type InitPlayer = {
  peerId: PeerId;
  name: string;
  team: Team;
}

export type Input = {
  movement: Vector2;
  kick: boolean;
}

export type TransmittedInput = Input & {
  i: number;
}

export type PlayerInputsSnapshot = Record<PeerId, TransmittedInput>;
