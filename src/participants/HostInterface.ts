import { Team } from '../config';
import { GameEngine } from '../game/GameEngine';
import { PeerId, Input } from '../types';
import { participants } from './participants';

const playerInputs = new Map<PeerId, Input>();

const add = (id: PeerId, team: Team) => {
  GameEngine.addPlayer(id, team);
  participants.instance.set(id, {
    name: id,
    team,
  });
};

const remove = (id: PeerId) => {
  GameEngine.removePlayer(id);
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
