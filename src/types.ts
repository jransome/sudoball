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

export type RTCClientInput = RTCMessage<'CLIENT_INPUT', Input>
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

export type SerialisedPlayer = {
  id: PeerId;
  position: Vector2;
  isKicking: boolean;
}

export type BroadcastedGameState = {
  ball: Vector2;
  players: SerialisedPlayer[];
}

export type Participant = {
  name: string;
  team: Team;
}

export type Input = Vector2 & {
  isKicking: boolean;
}
