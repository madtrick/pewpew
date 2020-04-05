import { EventEmitter } from 'events'
import { IncomingMessage } from 'http'
import { URL } from 'url'

type ChannelId = string

export interface ChannelRef {
  id: ChannelId
}

interface Route {
  id: string
}

export interface RouteRef {
  id: string
}

interface RouteDef {
  id: string
}

export interface Message {
  channel: ChannelRef
  route: RouteRef
  data?: string
}

export interface WebSocketConnectionHandler {
  on (event: 'connection', cb: (socket: WebSocket, request: IncomingMessage) => void): void
}

export interface WebSocket {
  on (event: 'close', cb: (code: number, reason: string) => void): void
  on (event: 'message', cb: (data: string) => void): void
  send (data: any, options: undefined, cb: () => void): void
  terminate (): void
}

interface Channel {
  id: ChannelId
  socket: WebSocket
  route: Route
}

export interface MessagingHub {
  pull (): Message[]
  send (options: { channel: { id: ChannelId }, data: string }): Promise<void>
  on (event: 'channelOpen' | 'channelClose', listener: (ch: ChannelRef, context: { route: RouteRef }) => void): void
}

type UUIDFn = () => string

export class WebSocketMessagingHub extends EventEmitter implements MessagingHub {
  private connection: WebSocketConnectionHandler
  private channels: Map<string, Channel>
  private messages: [Channel, any][] // TODO replace that any
  private routes: { [path: string]: { id: string } }
  private uuidFn: UUIDFn

  constructor (wss: WebSocketConnectionHandler, uuid: UUIDFn, options: { routes: { [path: string]: RouteDef } }) {
    super()
    this.connection = wss
    this.connection.on('connection', this.createChannel.bind(this))
    this.channels = new Map()
    this.messages = []
    this.routes = options.routes
    this.uuidFn = uuid
  }

  status (): { channels: ChannelRef[] } {
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
      result.push({ channel: { id: channel.id }, route: { id: channel.route.id }, data: message })
    }

    this.messages = []

    return result.reverse()
  }

  async send (options: { channel: { id: ChannelId }, data: string }): Promise<void> {
    return new Promise((resolve) => {
      const channel = this.channels.get(options.channel.id)

      if (channel) {
        return channel.socket.send(options.data, undefined, () => resolve())
      } else {
        // TODO replace this console.log with proper loggin
        console.log('Channel not found')
        // TODO throw on invalid/not-found channel?
        resolve()
      }

    })
  }

  private async createChannel (socket: WebSocket, request: IncomingMessage): Promise<void> {
    if (!request.url) {
      throw new Error('Request lacks url')
    }

    if (request.headers && !request.headers.host) {
      throw new Error('Request lacks host header')
    }

    const url = new URL(request.url, `http://${request.headers.host}`)
    const route = this.routes[url.pathname]

    if (!route) {
      await new Promise((resolve) => socket.send(`Unknown path "${url.pathname}"`, undefined, resolve))
      socket.terminate()
      return
    }

    const id = this.uuidFn()
    const channel = { id, socket, route: { id: route.id } }
    socket.on('close', () => {
      this.emit('channelClose', { id: channel.id }, { route: route.id })
      this.channels.delete(id)
    })
    socket.on('message', (data) => {
      this.messages.push([channel, data])
    })
    // TODO handle closed channels. How to communicate that to the engine
    this.channels.set(id, channel)
    this.emit('channelOpen', { id: channel.id }, { route: { id: route.id } })
  }
}

