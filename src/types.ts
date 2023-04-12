import { Team } from './config';

type RTCMessage<T extends RTCHostMessageType | RTCClientMessageType, P extends object> = {
  type: T;
  payload: P;
}

type RTCBidirectionalMessageType =
  | 'INPUT'

export type RTCHostMessageType =
  | RTCBidirectionalMessageType
  | 'START'
  | 'PLAYER_LINEUP_CHANGE'

export type RTCHostMessage =
  | RTCGameStarted
  | RTCOtherPlayerInput
  | RTCPlayerLineupChanged

export type RTCClientMessageType =
  | RTCBidirectionalMessageType

export type RTCClientMessage =
  | RTCOtherPlayerInput

export type RTCOtherPlayerInput = RTCMessage<'INPUT', TransmittedInputSnapshot>
export type RTCGameStarted = RTCMessage<'START', InitPlayer[]>
export type RTCPlayerLineupChanged = RTCMessage<'PLAYER_LINEUP_CHANGE', [PeerId, InitPlayer][]>

// export type RTCClientInput = RTCMessage<'INPUT', InputSnapshot>


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

export type InputSnapshot = Input & {
  i: number;
}

export type TransmittedInputSnapshot = InputSnapshot & {
  id: PeerId;
}

export type PlayerInputsSnapshot = Record<PeerId, InputSnapshot>
