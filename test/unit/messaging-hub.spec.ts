import { expect } from 'chai'
import sinon from 'sinon'
import { EventEmitter } from 'events'
import { WebSocketMessagingHub, ChannelRef, RouteRef } from '../../src/messaging-hub'

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

describe('Messaging Hub', () => {
  let socket1: EventEmitter & { send: sinon.SinonStub, terminate: sinon.SinonStub }
  let socket2: EventEmitter & { send: sinon.SinonStub, terminate: sinon.SinonStub }
  let wss: EventEmitter
  let uuidFn: () => string

  beforeEach(() => {
    let counter = 0
    uuidFn = () => `uuid-${counter += 1}`
    const emitter1 = new EventEmitter()
    const emitter2 = new EventEmitter()
    socket1 = Object.assign(emitter1, { send: sinon.stub().yields(), terminate: sinon.stub() })
    socket2 = Object.assign(emitter2, { send: sinon.stub().yields(), terminate: sinon.stub() })
    wss = new EventEmitter()
  })

  describe('when the request path exists in the hub', () => {
    it('assigns correct route to incoming messages', () => {
      const routes = { '/player': { id: 'player' }, '/control': { id: 'control' } }
      const hub = new WebSocketMessagingHub(wss, uuidFn, { routes })
      const playerRequest = { url: '/player', headers: { host: 'localhost:8888' } }
      const controlRequest = { url: '/control', headers: { host: 'localhost:8888' } }

      wss.emit('connection', socket1, playerRequest)
      wss.emit('connection', socket2, controlRequest)

      socket1.emit('message', 'player-msg-1')
      expect(hub.pull()).to.eql([
        { channel: { id: 'uuid-1' }, route: { id: 'player' }, data: 'player-msg-1' }
      ])

      socket2.emit('message', 'control-msg-1')
      expect(hub.pull()).to.eql([
        { channel: { id: 'uuid-2' }, route: { id: 'control' }, data: 'control-msg-1' }
      ])
    })
  })

  describe('when the requested path does not exist in the hub', () => {
    it('does not create a channel for the request', () => {
      const routes = { '/player': { id: 'player' } }
      const hub = new WebSocketMessagingHub(wss, uuidFn, { routes })
      const request = { url: '/foo', headers: { host: 'localhost:8888' } }

      socket1.send = sinon.stub().resolves()
      socket1.terminate = sinon.stub()
      wss.emit('connection', socket1, request)

      const { channels } = hub.status()

      expect(channels).to.be.empty
    })

    it('sends an error message', () => {
      const routes = { '/player': { id: 'player' } }
      // tslint:disable-next-line
      new WebSocketMessagingHub(wss, uuidFn, { routes })
      const request = { url: '/foo', headers: { host: 'localhost:8888' } }

      socket1.send = sinon.stub().yields()
      socket1.terminate = sinon.stub()
      wss.emit('connection', socket1, request)

      expect(socket1.send).to.have.been.calledWith('Unknown path "/foo"', undefined, sinon.match.func)
    })

    it('terminates the socket', async () => {
      const routes = { '/player': { id: 'player' } }
      // tslint:disable-next-line
      new WebSocketMessagingHub(wss, uuidFn, { routes })
      const request = { url: '/foo', headers: { host: 'localhost:8888' } }

      socket1.send = sinon.stub().yields()
      socket1.terminate = sinon.stub()
      wss.emit('connection', socket1, request)

      // Since sending the error message is async we have to wait a bit
      // before checking if the socket has been terminated
      await delay(100)

      expect(socket1.terminate).to.have.been.called
    })
  })

  it('creates a channel when a new WebSocket connection is openened', () => {
    const routes = { '/player': { id: 'player' } }
    const hub = new WebSocketMessagingHub(wss, uuidFn, { routes })
    const request = { url: '/player', headers: { host: 'localhost:8888' } }

    wss.emit('connection', socket1, request)

    const { channels } = hub.status()

    expect(channels).to.have.lengthOf(1)
  })

  it('removes the channel when the WebSocket connection is closed', () => {
    const routes = { '/player': { id: 'player' }, '/control': { id: 'control' } }
    const hub = new WebSocketMessagingHub(wss, uuidFn, { routes })
    const request = { url: '/player', headers: { host: 'localhost:8888' } }

    wss.emit('connection', socket1, request)
    socket1.emit('close')

    const { channels } = hub.status()

    expect(channels).to.be.empty
  })

  it('calls the listener when a channel is closed', () => {
    const routes = { '/player': { id: 'player' } }
    const hub = new WebSocketMessagingHub(wss, uuidFn, { routes })
    const request = { url: '/player', headers: { host: 'localhost:8888' } }
    let openedChannel: ChannelRef | undefined
    let closedChannel: ChannelRef | undefined

    hub.on('channelOpen', (ch: ChannelRef) => openedChannel = ch)
    hub.on('channelClose', (ch: ChannelRef) => closedChannel = ch)
    wss.emit('connection', socket1, request)
    socket1.emit('close')

    expect(closedChannel).to.eql(openedChannel)
  })

  it('clears the in memory messages after each pull', () => {
    const routes = { '/player': { id: 'player' } }
    const hub = new WebSocketMessagingHub(wss, uuidFn, { routes })
    const request = { url: '/player', headers: { host: 'localhost:8888' } }

    wss.emit('connection', socket1, request)
    socket1.emit('message', 'message-1-1')

    expect(hub.pull()).to.have.lengthOf(1)
    expect(hub.pull()).to.have.lengthOf(0)
  })

  it('keeps only on message per channel', () => {
    const routes = { '/player': { id: 'player' } }
    const hub = new WebSocketMessagingHub(wss, uuidFn, { routes })
    const request = { url: '/player', headers: { host: 'localhost:8888' } }

    wss.emit('connection', socket1, request)
    wss.emit('connection', socket2, request)
    socket1.emit('message', 'message-1-1')
    socket2.emit('message', 'message-2-1')
    socket2.emit('message', 'message-2-2')
    socket1.emit('message', 'message-1-2')

    const messages = hub.pull()

    expect(messages).to.have.lengthOf(2)
    expect(messages[0]).to.eql({ channel: { id: 'uuid-2' }, route: { id: 'player' }, data: 'message-2-2' })
    expect(messages[1]).to.eql({ channel: { id: 'uuid-1' }, route: { id: 'player' }, data: 'message-1-2' })
  })

  it('sends messages throught the right channel', async () => {
    const routes = { '/player': { id: 'player' } }
    const hub = new WebSocketMessagingHub(wss, uuidFn, { routes })
    const request = { url: '/player', headers: { host: 'localhost:8888' } }
    const data = 'my-message'

    wss.emit('connection', socket1, request)
    wss.emit('connection', socket2, request)

    await hub.send({ channel: { id: 'uuid-1' }, data })

    expect(socket1.send).to.have.been.calledWith(data)
    expect(socket2.send).to.not.have.been.called
  })

  it('calls the listener when a new channel is created', () => {
    const routes = { '/player': { id: 'player' } }
    const hub = new WebSocketMessagingHub(wss, uuidFn, { routes })
    const request = { url: '/player', headers: { host: 'localhost:8888' } }
    let channel: ChannelRef | undefined

    hub.on('channelOpen', (ch: ChannelRef) => channel = ch)
    wss.emit('connection', socket1, request)
    const { channels } = hub.status()

    expect(channels[0]).to.eql(channel)
  })

  it('calls the listener when a new channel is created including the respective route', () => {
    const routes = { '/player': { id: 'player' } }
    const hub = new WebSocketMessagingHub(wss, uuidFn, { routes })
    const request = { url: '/player', headers: { host: 'localhost:8888' } }
    let route: RouteRef

    hub.on('channelOpen', (_ch: ChannelRef, context: { route: RouteRef }) => route = context.route)

    wss.emit('connection', socket1, request)
    // @ts-ignore
    expect(route.id).to.eql('player')
  })

  // TODO don't send messages to a socket that just closed
  // TODO add test for messages in the buffer but socket closed
})

