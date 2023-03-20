import { QueryDocumentSnapshot } from '@firebase/firestore-types';
import { EventEmitter } from './Events';
import { db } from './firebase';

type ClientConnectionDoc = {
  offer: RTCSessionDescriptionInitSignal,
  answer?: RTCSessionDescriptionInitSignal,
}

type RTCSessionDescriptionInitSignal = {
  sdp: string | undefined,
  type: RTCSdpType,
}

type OutboundChannel = {
  close: () => void,
  channel: RTCDataChannel,
}

export class ConnectionHost extends EventEmitter {
  hostId: string;
  private outboundChannels: Map<string, OutboundChannel> = new Map();

  constructor() {
    super();
    this.hostId = crypto.randomUUID();
  }

  public get clientCount() {
    return this.outboundChannels.size;
  }

  public startHosting() {
    const sessionDoc = db.collection('session').doc(this.hostId);
    const clientConnections = sessionDoc.collection('clientConnections');
    clientConnections.onSnapshot((snapshot) => {
      snapshot.docChanges()
        .filter(change => change.type === 'added')
        .forEach(({ doc }) => this.connectWithClient(doc as QueryDocumentSnapshot<ClientConnectionDoc>));
    });
  }

  public broadcast(data: object) {
    this.outboundChannels.forEach(c => c.channel.send(JSON.stringify(data))); // TODO cache as array?
  }

  public close() {
    // TODO: some boolean that prevents use if closed
    this.outboundChannels.forEach(c => c.close());
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

    const sendChannel = peerConnection.createDataChannel('sendChannel');
    sendChannel.onopen = () => {
      console.log('send channel opened');
      this.outboundChannels.set(clientId, {
        close: () => peerConnection.close(),
        channel: sendChannel,
      });
      this.emit('clientConnected', clientId);
    };
    sendChannel.onclose = () => console.log('send channel closed');
    sendChannel.onerror = error => console.error('send channel error:', error);

    let receiveChannel = null;
    peerConnection.ondatachannel = (ev) => {
      receiveChannel = ev.channel;
      receiveChannel.onopen = () => console.log('receive channel opened');
      receiveChannel.onclose = () => {
        console.log('receive channel closed');
        if (!this.outboundChannels.has(clientId)) console.error('client disconnected but channel not in memory');
        this.outboundChannels.delete(clientId);
        this.emit('clientDisconnected', clientId);
      };
      receiveChannel.onmessage = (event) => this.emit('messageReceived', {
        clientId,
        data: JSON.parse(event.data),
      });
      receiveChannel.onerror = error => console.error('receive channel error:', error);
    };


    const iceOfferCandidates = clientConnectionDocSnapshot.ref.collection('iceOfferCandidates');
    const iceAnswerCandidates = clientConnectionDocSnapshot.ref.collection('iceAnswerCandidates');
    peerConnection.onicecandidate = ({ candidate }) => {
      candidate && console.log('generated new ice candidate');
      candidate && iceAnswerCandidates.add(candidate.toJSON());
    };

    const clientOffer = clientConnectionDocSnapshot.data().offer;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(clientOffer));
    const answerDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerDescription);

    const answer: RTCSessionDescriptionInitSignal = {
      sdp: answerDescription.sdp,
      type: answerDescription.type,
    };
    await clientConnectionDocSnapshot.ref.update({ answer });

    iceOfferCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges()
        .filter(change => change.type === 'added')
        .forEach(change => peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data())));
    });
  }
}
