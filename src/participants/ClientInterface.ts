import { PeerId, Participant } from '../types';
import { participants } from './participants';

export const ClientInterface = {
  set participants(value: Map<PeerId, Participant>) {
    participants.instance = new Map(value);
  },
  get participants() {
    return participants.instance;
  },
};
