import { Team } from './enums';

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

export type PlayerInfo = {
  id: PeerId;
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

type RTCMessage<T extends RTCHostMessageType | RTCClientMessageType, P extends object | number> = {
  type: T;
  payload: P;
}

// messages from host
export type RTCHostMessageType =
  | 'START'
  | 'UPDATE'
  | 'PLAYER_LINEUP_CHANGE'

export type RTCHostMessage =
  | RTCGameStarted
  | RTCGameUpdate
  | RTCPlayerLineupChanged

export type RTCGameStarted = RTCMessage<'START', PlayerInfo[]>
export type RTCGameUpdate = RTCMessage<'UPDATE', RenderableGameState>
export type RTCPlayerLineupChanged = RTCMessage<'PLAYER_LINEUP_CHANGE', PlayerInfo[]>

// messages from clients
export type RTCClientMessageType =
  | 'JOINED'
  | 'INPUT'
  | 'TEAM_CHANGE'

export type RTCClientMessage =
  | RTCJoinedHost
  | RTCOtherPlayerInput
  | RTCClientTeamChange

export type RTCJoinedHost = RTCMessage<'JOINED', PlayerInfo>
export type RTCOtherPlayerInput = RTCMessage<'INPUT', Input>
export type RTCClientTeamChange = RTCMessage<'TEAM_CHANGE', Team>
