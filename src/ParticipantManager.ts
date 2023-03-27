import { Team } from './config';
import { GameEngine } from './game/GameEngine';
import { PeerId, Participant, Vector2 } from './types';

let participants = new Map<PeerId, Participant>();
const playerInputs = new Map<PeerId, Vector2>();

const add = (id: PeerId, team: Team) => {
  GameEngine.addPlayer(id);
  participants.set(id, {
    name: id.slice(0, 4),
    team,
  });
};

const remove = (id: PeerId) => {
  GameEngine.removePlayer(id);
  participants.delete(id);
  playerInputs.delete(id);
};

const HostInterface = {
  add,
  remove,
  get participants() {
    return Array.from(participants);
  },
  get playerInputs() {
    return playerInputs;
  },
};

const ClientInterface = {
  set participants(value: [PeerId, Participant][]) {
    participants = new Map(value);
  },
};

export const ParticipantManager = {
  get participants() {
    return participants;
  },
  HostInterface,
  ClientInterface,
};
