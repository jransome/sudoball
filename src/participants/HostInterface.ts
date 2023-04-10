import { Team } from '../config';
import { PredictiveGameEngine } from '../game/PredictiveGameEngine';
import { PeerId, Input } from '../types';
import { participants } from './participants';

const playerInputs = new Map<PeerId, Input>();

const add = (id: PeerId, team: Team) => {
  PredictiveGameEngine.addPlayer(id, team);
  participants.instance.set(id, {
    name: id,
    team,
  });
};

const remove = (id: PeerId) => {
  PredictiveGameEngine.removePlayer(id);
  participants.instance.delete(id);
  playerInputs.delete(id);
};

export const HostInterface = {
  add,
  remove,
  get participants() {
    return Array.from(participants.instance);
  },
  get playerInputs() {
    return playerInputs;
  },
};
