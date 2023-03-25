export type RTCMessageType = 'GAME_UPDATE' | 'CLIENT_INPUT'

export type RTCMessage = {
  type: RTCMessageType;
  payload: object;
}

export interface RTCGameUpdate extends RTCMessage {
  type: 'GAME_UPDATE';
  payload: GameObjects;
}

export interface RTCClientInput extends RTCMessage {
  type: 'CLIENT_INPUT';
  payload: Vector2;
}

export type PeerId = string; // unique identifier for each rtc (player) connection

export type Vector2 = {
  x: number;
  y: number;
}

export type Polygon = Vector2[];

export type PlayerState = {
  id: PeerId;
  position: Vector2;
  radius: number;
}

export type GameObjects = {
  boundaries: Polygon[]; // TODO: remove
  // ball: Circle;
  // players: Circle[];
  boxes: Polygon[];
  players: PlayerState[];
}

export type CanvasReference = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}

export type PlayerInputs = {
  [k in PeerId]: Vector2;
}
