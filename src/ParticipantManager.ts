import { Team } from './config';
import { GameEngine } from './game/GameEngine';
import { PeerId, Participant, Input } from './types';

let selfId: PeerId = null!;
let participants = new Map<PeerId, Participant>();
const playerInputs = new Map<PeerId, Input>();

const add = (id: PeerId, team: Team) => {
  GameEngine.addPlayer(id, team);
  participants.set(id, {
    name: id,
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
  get selfPeerId() {
    return selfId;
  },
  set selfPeerId(value) {
    selfId = value;
  },
  get participants() {
    return participants;
  },
  HostInterface,
  ClientInterface,
};
