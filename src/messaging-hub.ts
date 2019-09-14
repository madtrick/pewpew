import uuid from 'uuid/v4'

interface Message {
  channel: { id: ChannelId }
  data: string
}

interface WebSocketServer {
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

type ChannelId = string

export class MessagingHub {
  private connection: WebSocketServer
  private channels: Map<string, Channel>
  private messages: [Channel, any][] //TODO replace that any

  constructor (wss: WebSocketServer) {
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

      if (seen.has(channel)) {
        continue
      }

      seen.set(channel, true)
      result.push({ channel: { id: channel.id }, data: message })
    }

    return result.reverse()
  }

  async send (options: { channel: { id: ChannelId }, data: any }): Promise<void> {
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
      this.channels.delete(id)
    })
    socket.on('message', (data) => {
      this.messages.push([channel, data])
    })
    // TODO handle closed channels. How to communicate that to the engine
    this.channels.set(id, channel)
  }
}
