import { PeerId } from '../types';
import { ClientInterface } from './ClientInterface';
import { HostInterface } from './HostInterface';
import { participants } from './participants';

let selfId: PeerId = null!;

export const ParticipantManager = {
  get selfPeerId() {
    return selfId;
  },
  get participants() {
    return participants.instance;
  },
  reset: (newSelfPeerId: PeerId) => {
    selfId = newSelfPeerId;
    participants.instance.clear();
  },
  HostInterface,
  ClientInterface,
};
