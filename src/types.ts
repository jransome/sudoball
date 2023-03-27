import { Team } from './config';

export type RTCHostMessageType =
  | 'GAME_UPDATE'
  | 'PLAYER_LINEUP_CHANGE'

export type RTCClientMessageType =
  | 'CLIENT_INPUT'

type RTCMessage<T extends RTCHostMessageType | RTCClientMessageType, P extends object> = {
  type: T;
  payload: P;
}

export type RTCGameUpdate = RTCMessage<'GAME_UPDATE', BroadcastedGameState>
export type RTCPlayerLineupChanged = RTCMessage<'PLAYER_LINEUP_CHANGE', [PeerId, Participant][]>

export type RTCHostMessage =
  | RTCGameUpdate
  | RTCPlayerLineupChanged

export type RTCClientInput = RTCMessage<'CLIENT_INPUT', Vector2>
export type RTCClientMessage =
  | RTCClientInput

export type PeerId = string; // unique identifier for each rtc (player) connection

export type Vector2 = {
  x: number;
  y: number;
}

export type Polygon = Vector2[];

export type Player = {
  id: PeerId;
  position: Vector2;
}

export type BroadcastedGameState = {
  boundaries: Polygon[]; // TODO: remove
  boxes: Polygon[];
  players: Player[];
}

export type Participant = {
  name: string;
  team: Team;
}
