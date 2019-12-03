import uuid from 'uuid/v4'
import { EventEmitter } from 'events'

type ChannelId = string

export interface ChannelRef {
  id: ChannelId
}
export interface Message {
  channel: { id: ChannelId }
  data?: string
}

export interface WebSocketServerConstructor {
  new (options: { port: number }): WebSocketServer
}
export interface WebSocketServer {
  on (event: 'connection', cb: (socket: WebSocket) => void ): void
}

export interface WebSocket {
  on (event: 'close', cb: (code: number, reason: string) => void): void
  on (event: 'message', cb: (data: string) => void): void
  send (data: any, options: undefined, cb: () => void): Promise<void>
}

interface Channel {
  id: ChannelId,
  socket: WebSocket
}

export interface IMessagingHub {
  pull (): Message[]
  send (options: { channel: { id: ChannelId }, data: string }): Promise<void>
  on (event: 'channelOpen', listener: (ch: ChannelRef) => void): void
  on (event: 'channelClose', listener: (ch: ChannelRef) => void): void
}

export class MessagingHub extends EventEmitter implements IMessagingHub {
  private connection: WebSocketServer
  private channels: Map<string, Channel>
  private messages: [Channel, any][] //TODO replace that any

  constructor (wss: WebSocketServer) {
    super()
    this.connection = wss
    this.connection.on('connection', this.createChannel.bind(this))
    this.channels = new Map()
    this.messages = []
  }

  status (): { channels: { id: string }[] } {
    const channelIds = []

    for (const { id } of this.channels.values()) {
      channelIds.push({ id })
    }

    return{
      channels: channelIds
    }
  }

  pull (): Message[] {
    const result: Message[] = []
    const seen: Map<Channel, boolean> = new Map()

    for (let i = this.messages.length - 1; i >= 0; i--) {
      const [channel, message] = this.messages[i]

      // NOTE this does not belong here. Deciding if the users can send
      // only one or more messages before the previous ones are consumed
      // is a decision of the domain logic and not of this wrapper around
      // the websocket server
      if (seen.has(channel)) {
        continue
      }

      seen.set(channel, true)
      result.push({ channel: { id: channel.id }, data: message })
    }

    this.messages = []

    return result.reverse()
  }

  async send (options: { channel: { id: ChannelId }, data: string }): Promise<void> {
    return new Promise((resolve) => {
      const channel = this.channels.get(options.channel.id)

      if (channel) {
        channel.socket.send(options.data, undefined, () => resolve())
      }

      // TODO throw on invalid/not-found channel?
      resolve()
    })
  }

  private createChannel (socket: WebSocket): void {
    const id = uuid()
    const channel = { id, socket }
    socket.on('close', () => {
      this.emit('channelClose', { id: channel.id })
      this.channels.delete(id)
    })
    socket.on('message', (data) => {
      this.messages.push([channel, data])
    })
    // TODO handle closed channels. How to communicate that to the engine
    this.channels.set(id, channel)
    this.emit('channelOpen', { id: channel.id })
  }
}

