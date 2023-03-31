import { PeerId, Participant } from '../types';

// export const participants = new Map<PeerId, Participant>();

export const participants = {
  instance: new Map<PeerId, Participant>(),
};
