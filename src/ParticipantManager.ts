import { Team } from './config';
import { PeerId, Participant } from './types';

let participants = new Map<PeerId, Participant>();

const add = (id: PeerId, team: Team) => participants.set(id, {
  name: id.slice(0, 4),
  team,
});
const remove = (id: PeerId) => participants.delete(id);

const HostInterface = {
  add,
  remove,
  get participants() {
    return [...participants];
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
