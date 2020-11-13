import config from './config.json'

const BACKEND_HOST = config.backendHost || 'localhost'
const SIGNAL_PORT = config.signalPort || 3012

export interface MessagingServiceOptions {
  /** Called once the service is ready for connection and knows its peer identifier */
  onOpen: (myId: string) => void
  /** Called once connection with a peer has been successfully established */
  onConnected: (to: string) => void
  /** Called whenever a message is received */
  onMessage: (e: MessageEvent) => void
}

/**
 * A point to point messaging service.
 * Will allow you to open a duplex data channel to or from another peer.
 */
export default class MessagingService {
  private sock: WebSocket
  private conn: RTCPeerConnection
  private id?: string
  private connectingTo?: string
  private dataChannel?: RTCDataChannel
  private onMessage: (e: MessageEvent) => void = () => {}
  private onConnected: (to: string) => void = () => {}
  private onOpen: (myId: string) => void = () => {}

  /**
   * Create a new service.
   * @param {MessagingServiceOptions} __namedParameters - The service configuration
   */
  public constructor({
    onMessage,
    onConnected,
    onOpen,
  }: MessagingServiceOptions) {
    this.conn = new RTCPeerConnection({
      iceServers: [{ urls: `stun:${BACKEND_HOST}` }],
    })
    this.sock = new WebSocket(`ws://${BACKEND_HOST}:${SIGNAL_PORT}`)
    if (onMessage) {
      this.onMessage = onMessage
    }
    if (onConnected) {
      this.onConnected = onConnected
    }
    if (onOpen) {
      this.onOpen = onOpen
    }

    this.conn.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
      if (e.candidate) {
        this.sock.send(
          `ICE ${this.id} ${this.connectingTo} ${JSON.stringify(e.candidate)}`,
        )
      } else {
        console.debug('No more ICE candidates')
      }
    }
    this.conn.ondatachannel = (e: RTCDataChannelEvent) => {
      const dataChannel = e.channel
      dataChannel.onmessage = this.onMessage
      dataChannel.onopen = () => {
        if (this.onConnected) {
          this.onConnected(this.connectingTo!)
        }
      }
      this.dataChannel = dataChannel
    }

    this.sock.onmessage = async (e: MessageEvent) => {
      if (!this.id) {
        this.id = e.data
        this.onOpen(e.data)
      } else {
        console.debug('Received', e.data)

        const [verb, source, dest] = e.data.split(' ', 3)
        const arg = e.data
          .split(' ')
          .slice(3)
          .join(' ')
        if (dest !== this.id) {
          throw new Error('Received message not adressed to us')
        }

        switch (verb) {
          case 'OFFER': {
            const sdp = JSON.parse(arg)
            const remote = new RTCSessionDescription(sdp)
            this.connectingTo = source
            await this.conn.setRemoteDescription(remote)
            const answer = await this.conn.createAnswer()
            await this.conn.setLocalDescription(answer)
            this.sock.send(
              `ANSWER ${this.id} ${source} ${JSON.stringify(answer)}`,
            )
            break
          }
          case 'ANSWER': {
            const sdp = JSON.parse(arg)
            const remote = new RTCSessionDescription(sdp)
            await this.conn.setRemoteDescription(remote)
            break
          }
          case 'ICE': {
            const candidate = JSON.parse(arg)
            await this.conn.addIceCandidate(candidate)
            break
          }
        }
      }
    }
  }
  /**
   * Connect to a peer.
   * @param target - The peer identifier of the connection target
   */
  public async connect(target: string) {
    this.connectingTo = target

    const dataChannel = this.conn.createDataChannel('DATACHANNEL')
    dataChannel.onmessage = this.onMessage
    dataChannel.onopen = () => {
      if (this.onConnected) {
        this.onConnected(this.connectingTo!)
      }
    }
    this.dataChannel = dataChannel

    if (!this.sock) {
      throw new Error('Signalling socket not up')
    }
    const offer = await this.conn.createOffer({ iceRestart: true })
    await this.conn.setLocalDescription(offer)
    this.sock.send(
      `OFFER ${this.id} ${this.connectingTo} ${JSON.stringify(offer)}`,
    )
  }

  /**
   * Send a message to the connected peer.
   * This will throw if called without establishing a connection.
   * @param message - The message to send.
   */
  public async send(message: string) {
    if (!this.dataChannel) {
      throw new Error('Data Channel not up')
    }
    this.dataChannel.send(message)
  }
}
