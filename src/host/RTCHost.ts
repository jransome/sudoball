import Peer, { DataConnection } from 'peerjs';
import { EventEmitter } from '../Events';
import { PeerId, RTCClientMessage, RTCHostMessage } from '../types';

type ConnectionHostEvents = {
  clientConnected: (clientId: string) => void;
  clientDisconnected: (clientId: string) => void;
  clientMessage: (clientId: string, message: RTCClientMessage) => void;
}

export class RTCHost extends EventEmitter<ConnectionHostEvents> {
  peerId: PeerId;
  peerInstance: Peer;
  isHosting = false;
  private connections: Map<PeerId, DataConnection> = new Map();

  constructor(peerId: PeerId) {
    super();
    this.peerId = peerId;
    this.peerInstance = new Peer(this.peerId, { debug: 2 });
    window.addEventListener('unload', () => this.close());
  }

  public get clients() {
    return [...this.connections.keys()];
  }

  public startHosting() {
    if (this.isHosting) {
      throw new Error('Already hosting rtc connections');
    }

    this.isHosting = true;
    this.peerInstance.on('open', () => {
      this.peerInstance.on('connection', (connection) => {
        const clientPeerId = connection.label;

        connection.on('open', () => {
          this.connections.set(clientPeerId, connection);
          this.emit('clientConnected', clientPeerId);

          connection.on('data', (data) => {
            this.emit('clientMessage', clientPeerId, data as RTCClientMessage);
          });
        });

        connection.on('close', () => {
          this.connections.delete(clientPeerId);
          connection.removeAllListeners();
          this.emit('clientDisconnected', clientPeerId);
        });
      });
    });
  }

  public broadcast(message: RTCHostMessage, exceptions: PeerId[] = []) {
    if (!this.connections.size) return;
    this.connections.forEach((c, id) => {
      !exceptions.includes(id) && c.send(message);
    });
  }

  public close() {
    this.removeAllListeners();
    this.connections.forEach((c) => {
      c.removeAllListeners();
      c.close();
    });
    this.peerInstance.destroy();
    this.peerInstance.removeAllListeners();
  }
}
