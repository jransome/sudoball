import { QueryDocumentSnapshot } from '@firebase/firestore-types';
import { EventEmitter } from '../Events';
import { db } from './firebase';
import { PeerId, RTCClientMessage, RTCHostMessage } from '../types';
import { generateReadableId } from '../id';

type ClientConnectionDoc = {
  offer: RTCSessionDescriptionInitSignal;
  answer?: RTCSessionDescriptionInitSignal;
}

type RTCSessionDescriptionInitSignal = {
  sdp: string | undefined;
  type: RTCSdpType;
}

type OutboundChannel = {
  closePeerConnection: () => void;
  channel: RTCDataChannel;
}

type ConnectionHostEvents = {
  clientConnected: (clientId: string) => void;
  clientDisconnected: (clientId: string) => void;
  clientMessage: (clientId: string, message: RTCClientMessage) => void;
}

export class ConnectionHost extends EventEmitter<ConnectionHostEvents> {
  peerId: PeerId;
  private outboundChannels: Map<PeerId, OutboundChannel> = new Map();

  constructor() {
    super();
    this.peerId = generateReadableId();
  }

  public get clients() {
    return [...this.outboundChannels.keys()];
  }

  public startHosting() {
    const sessionDoc = db.collection('session').doc(this.peerId);
    const clientConnections = sessionDoc.collection('clientConnections');
    clientConnections.onSnapshot((snapshot) => {
      snapshot.docChanges()
        .filter(change => change.type === 'added')
        .forEach(({ doc }) => this.connectWithClient(doc as QueryDocumentSnapshot<ClientConnectionDoc>));
    }, error => console.error('Error onSnapshot of client connections when hosting:', error));
  }

  public broadcast(message: RTCHostMessage) {
    this.outboundChannels.forEach(c => c.channel.send(JSON.stringify(message))); // TODO cache as array?
  }

  public close() {
    // TODO: some boolean that prevents use if closed
    this.outboundChannels.forEach(c => c.closePeerConnection());
    this.outboundChannels.clear();
  }

  private async connectWithClient(clientConnectionDocSnapshot: QueryDocumentSnapshot<ClientConnectionDoc>) {
    const clientId = clientConnectionDocSnapshot.id;
    const peerConnection = new RTCPeerConnection({
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

    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === 'disconnected') {
        // triggered on other person clicking back or refreshing or closing the tab, but with a ~5 second delay
        this.onClientDisconnected(clientId);
      }
    };

    const sendChannel = peerConnection.createDataChannel('sendChannel');
    sendChannel.onopen = () => {
      console.log('send channel opened');
      this.outboundChannels.set(clientId, {
        closePeerConnection: () => peerConnection.close(), // TODO: clean up all the event listeners
        channel: sendChannel,
      });
      this.emit('clientConnected', clientId);
    };
    sendChannel.onclose = () => console.log('send channel closed');
    sendChannel.onerror = (event) => {
      const error = (event as RTCErrorEvent).error as RTCError;
      if (error.message === 'User-Initiated Abort, reason=Close called') {
        // only triggered on other person clicking back or refreshing. closing the tab doesn't trigger this
        this.onClientDisconnected(clientId);
        return;
      }
      console.error('send channel error:', error);
    };

    peerConnection.ondatachannel = (ev) => {
      const receiveChannel = ev.channel;
      receiveChannel.onopen = () => console.log('receive channel opened');
      receiveChannel.onclose = () => console.log('receive channel closed');
      receiveChannel.onmessage = event => this.emit('clientMessage', clientId, JSON.parse(event.data));
      receiveChannel.onerror = (event) => {
        const error = (event as RTCErrorEvent).error as RTCError;
        if (error.message === 'User-Initiated Abort, reason=Close called') {
          // only triggered on other person clicking back or refreshing. closing the tab doesn't trigger this
          this.onClientDisconnected(clientId);
          return;
        }
        console.error('receive channel error:', error);
      };
    };


    const iceOfferCandidates = clientConnectionDocSnapshot.ref.collection('iceOfferCandidates');
    const iceAnswerCandidates = clientConnectionDocSnapshot.ref.collection('iceAnswerCandidates');
    peerConnection.onicecandidate = ({ candidate }) => {
      try {
        candidate && iceAnswerCandidates.add(candidate.toJSON());
      } catch (error) {
        console.error('Error adding ice candidate to firestore:', clientId, error);
      }
    };

    const clientOffer = clientConnectionDocSnapshot.data().offer;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(clientOffer));
    const answerDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerDescription);

    const answer: RTCSessionDescriptionInitSignal = {
      sdp: answerDescription.sdp,
      type: answerDescription.type,
    };

    try {
      await clientConnectionDocSnapshot.ref.update({ answer });
    } catch (error) {
      console.error('Error updating client doc with answer:', clientId, error);
    }

    iceOfferCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges()
        .filter(change => change.type === 'added')
        .forEach(change => peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data())));
    }, error => console.error('Error onSnapshot of iceOfferCandidates when hosting:', error));
  }

  private onClientDisconnected(clientId: PeerId) {
    this.outboundChannels.get(clientId)?.closePeerConnection();
    if (this.outboundChannels.delete(clientId)) { // may have already been deleted from other 'disconnection' callbacks
      console.log('client disconnected', clientId);
      this.emit('clientDisconnected', clientId);
    }
  }
}
