import { Team } from './enums';

export type PeerId = string; // unique identifier for each rtc (player) connection

export type Vector2 = {
  x: number;
  y: number;
}

export type Circle = {
  position: Vector2;
  radius: number;
};

export type TransmittedGameState = {
  ball: Vector2;
  players: {
    id: PeerId;
    position: Vector2;
    isKicking: boolean;
  }[];
}

export type RenderableGameState = {
  ballPosition: Vector2;
  players: {
    name: string;
    team: Team;
    position: Vector2;
    isKicking: boolean;
    isLocalPlayer: boolean;
  }[];
}

export type PlayerInfo = {
  id: PeerId;
  name: string;
  team: Team;
}

export type Input = [
  number, // x dimension
  number, // y dimension
  boolean, // isKicking
]

type KickoffCountdownAnnouncement = {
  type: 'KICKOFF';
  countdownSeconds: number;
}

type GoalAnnouncement = {
  type: 'GOAL';
  scoringTeam: Team;
  scores: Record<Team, number>;
}

type MatchOverAnnouncement = {
  type: 'FINISH';
  winningTeam: Team; // Team.None = draw
}

export type GameAnnouncement = 
  | KickoffCountdownAnnouncement
  | GoalAnnouncement
  | MatchOverAnnouncement

type RTCMessage<T extends RTCHostMessageType | RTCClientMessageType, P extends object | string | number> = {
  type: T;
  payload: P;
}

// messages from host
type RTCHostMessageType =
  | 'START'
  | 'UPDATE'
  | 'PLAYER_LINEUP_CHANGE'
  | 'GAME_ANNOUNCEMENT'

export type RTCHostMessage =
  | RTCGameStarted
  | RTCGameUpdate
  | RTCPlayerLineupChanged
  | RTCGameAnnouncement

export type RTCGameStarted = RTCMessage<'START', PlayerInfo[]>
export type RTCGameUpdate = RTCMessage<'UPDATE', TransmittedGameState>
export type RTCPlayerLineupChanged = RTCMessage<'PLAYER_LINEUP_CHANGE', PlayerInfo[]>
export type RTCGameAnnouncement = RTCMessage<'GAME_ANNOUNCEMENT', GameAnnouncement>

// messages from clients
type RTCClientMessageType =
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
