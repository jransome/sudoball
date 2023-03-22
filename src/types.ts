export type TestClientPayload = {
  message: string;
}

export type Vector2 = {
  x: number;
  y: number;
}

export type Polygon = Vector2[];

export type Circle = {
  position: Vector2;
  radius: number;
}

export type GameObjects = {
  boundaries: Polygon[]; // TODO: remove
  // ball: Circle;
  // players: Circle[];
  boxes: Polygon[];
  player: Circle;
}
