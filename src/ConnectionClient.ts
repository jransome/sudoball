import { EventEmitter } from './Events';
import { db } from './firebase';

export class ConnectionClient extends EventEmitter {
  clientId: string;
  private peerConnection!: RTCPeerConnection;
  private sendChannel!: RTCDataChannel;
  private connectionEstablished!: Promise<void>;

  constructor() {
    super();
    this.clientId = crypto.randomUUID();
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

    this.sendChannel = this.peerConnection.createDataChannel('sendChannel');
    this.connectionEstablished = new Promise((res) => {
      this.sendChannel.onopen = () => {
        console.log('send channel opened');
        res();
      };
    });
    this.sendChannel.onclose = () => console.log('send channel closed');
    this.sendChannel.onerror = error => console.error('send channel error:', error);

    let receiveChannel = null;
    this.peerConnection.ondatachannel = (ev) => {
      receiveChannel = ev.channel;
      receiveChannel.onopen = () => console.log('receive channel opened');
      receiveChannel.onclose = () => {
        console.log('receive channel closed');
        this.emit('hostClosed'); // TODO: some boolean that prevents use if connection drops
      };
      receiveChannel.onmessage = event => this.emit('messageReceived', JSON.parse(event.data));
      receiveChannel.onerror = error => console.error('receive channel error:', error);
    };




    const sessionDoc = db.collection('session').doc(hostId);
    const connectionOfferDoc = sessionDoc.collection('clientConnections').doc(this.clientId);
    const iceOfferCandidates = connectionOfferDoc.collection('iceOfferCandidates');
    const iceAnswerCandidates = connectionOfferDoc.collection('iceAnswerCandidates');

    this.peerConnection.onicecandidate = ({ candidate }) => {
      candidate && console.log('generated new ice candidate');
      candidate && iceOfferCandidates.add(candidate.toJSON());
    };
    const offerDescription = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offerDescription); // this will start generating ice candidates

    await connectionOfferDoc.set({
      offer: {
        sdp: offerDescription.sdp, // session description protocol
        type: offerDescription.type,
      },
    });
    console.log('set offer');

    // Listen for remote answer
    connectionOfferDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!this.peerConnection.currentRemoteDescription && data?.answer) { // When the host connects
        console.log('received answer from host');
        const answerDescription = new RTCSessionDescription(data.answer);
        this.peerConnection.setRemoteDescription(answerDescription);
      }
    });

    // Listen for ice candidates on answering user
    iceAnswerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges()
        .filter(change => change.type === 'added')
        .forEach((change) => {
          console.log('received ice ANSWER from host');
          this.peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        });
    });

    await this.connectionEstablished;
  }

  public async sendToHost(data: object) {
    await this.connectionEstablished;
    this.sendChannel.send(JSON.stringify(data));
  }

  public disconnect() {
    this.peerConnection.close();
  }
}
