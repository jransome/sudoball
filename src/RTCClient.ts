import Peer, { DataConnection } from 'peerjs';
import { EventEmitter } from './Events';
import { PeerId, RTCClientMessage, RTCHostMessage } from './types';

type ConnectionClientEvents = {
  disconnected: () => void;
  hostMessage: (message: RTCHostMessage) => void;
}

export class RTCClient extends EventEmitter<ConnectionClientEvents> {
  peerId: PeerId;
  peerInstance: Peer;
  connection!: DataConnection;
  private peerOpened: Promise<void>;
  private connectionEstablished: Promise<void> = null!;

  constructor(peerId: PeerId) {
    super();
    this.peerId = peerId;
    this.peerInstance = new Peer(this.peerId, { debug: 2 });
    this.peerOpened = new Promise((res) => {
      this.peerInstance.on('open', () => res());
    });
    window.addEventListener('unload', () => this.close());
  }

  public async connectToHost(hostId: PeerId) {
    if (this.connectionEstablished !== null) {
      throw new Error('Already connected to a host');
    }

    await this.peerOpened;

    this.connection = this.peerInstance.connect(hostId, {
      label: this.peerId,
      reliable: true,
    });

    this.connectionEstablished = new Promise((res) => {
      this.connection.on('open', () => {
        this.connection.on('data', (data) => {
          this.emit('hostMessage', data as RTCHostMessage);
        });
        res();
      });
    });

    this.connection.on('close', () => {
      this.connection.removeAllListeners();
      this.emit('disconnected');
    });

    await this.connectionEstablished;
  }

  public async sendToHost(message: RTCClientMessage) {
    if (!this.connectionEstablished) {
      throw new Error('Tried to send data to host before establishing a connection');
    }

    await this.connectionEstablished;
    this.connection.send(message);
  }

  public close() {
    this.removeAllListeners();
    this.peerInstance.destroy();
    this.peerInstance.removeAllListeners();
  }
}
