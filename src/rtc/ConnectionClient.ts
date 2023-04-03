import { EventEmitter } from '../Events';
import { generateReadableId } from '../id';
import { PeerId, RTCClientMessage, RTCGameUpdate } from '../types';
import { db } from './firebase';

type ConnectionClientEvents = {
  disconnected: () => void;
  hostMessage: (message: RTCGameUpdate) => void;
}

export class ConnectionClient extends EventEmitter<ConnectionClientEvents> {
  peerId: PeerId;
  private peerConnection!: RTCPeerConnection;
  private sendChannel!: RTCDataChannel;
  private connectionEstablished!: Promise<void>;
  private isConnected = false;

  constructor() {
    super();
    this.peerId = generateReadableId();
  }

  get connected() {
    return this.isConnected;
  }

  public async connectToHost(hostId: string) {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun3.l.google.com:19302',
            'stun:stun4.l.google.com:19302',
          ],
        },
      ],
      iceCandidatePoolSize: 10,
    });

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection.iceConnectionState === 'disconnected') {
        // triggered on other person clicking back or refreshing or closing the tab, but with a ~5 second delay
        this.disconnect();
      }
    };

    this.sendChannel = this.peerConnection.createDataChannel('sendChannel');
    this.connectionEstablished = new Promise((res) => {
      this.sendChannel.onopen = () => {
        console.log('send channel opened');
        res();
      };
    });
    this.sendChannel.onclose = () => console.log('send channel closed');
    this.sendChannel.onerror = (event) => {
      const error = (event as RTCErrorEvent).error as RTCError;
      if (error.message === 'User-Initiated Abort, reason=Close called') {
        // only triggered on other person clicking back or refreshing. closing the tab doesn't trigger this
        this.disconnect();
        return;
      }
      console.error('send channel error:', error);
    };

    this.peerConnection.ondatachannel = (ev) => {
      const receiveChannel = ev.channel;
      receiveChannel.onopen = () => console.log('receive channel opened');
      receiveChannel.onclose = () => console.log('receive channel closed');
      receiveChannel.onmessage = event => this.emit('hostMessage', console.log(new TextEncoder().encode(event.data).length, JSON.parse(event.data))! || JSON.parse(event.data));
      receiveChannel.onerror = (event) => {
        const error = (event as RTCErrorEvent).error as RTCError;
        if (error.message === 'User-Initiated Abort, reason=Close called') {
          // only triggered on other person clicking back or refreshing. closing the tab doesn't trigger this
          this.disconnect();
          return;
        }
        console.error('receive channel error:', error);
      };
    };



    const sessionDoc = db.collection('session').doc(hostId);
    const connectionOfferDoc = sessionDoc.collection('clientConnections').doc(this.peerId);
    const iceOfferCandidates = connectionOfferDoc.collection('iceOfferCandidates');
    const iceAnswerCandidates = connectionOfferDoc.collection('iceAnswerCandidates');

    this.peerConnection.onicecandidate = ({ candidate }) => {
      try {
        candidate && iceOfferCandidates.add(candidate.toJSON());
      } catch (error) {
        console.error('Error adding ice candidate to firestore:', error);
      }
    };
    const offerDescription = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offerDescription); // this will start generating ice candidates

    try {
      await connectionOfferDoc.set({
        offer: {
          sdp: offerDescription.sdp, // session description protocol
          type: offerDescription.type,
        },
      });
    } catch (error) {
      console.error('Error updating connectionOfferDoc with offer:', error);
    }

    // Listen for remote answer
    connectionOfferDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!this.peerConnection.currentRemoteDescription && data?.answer) { // When the host connects
        console.log('received answer from host');
        const answerDescription = new RTCSessionDescription(data.answer);
        this.peerConnection.setRemoteDescription(answerDescription);
      }
    }, error => console.error('Error onSnapshot of connectionOfferDoc when clienting:', error));

    // Listen for ice candidates on answering user
    iceAnswerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges()
        .filter(change => change.type === 'added')
        .forEach((change) => {
          console.log('received ice ANSWER from host');
          this.peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        });
    }, error => console.error('Error onSnapshot of iceAnswerCandidates when clienting:', error));

    await this.connectionEstablished;
    this.isConnected = true;
  }

  public async sendToHost(message: RTCClientMessage) {
    await this.connectionEstablished;
    this.sendChannel.send(JSON.stringify(message));
  }

  public disconnect() {
    this.peerConnection.close();
    if (!this.connected) return;
    this.isConnected = false;
    this.emit('disconnected');
  }
}
