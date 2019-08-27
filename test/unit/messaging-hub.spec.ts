import { expect } from 'chai'
import sinon from 'sinon'
import { EventEmitter } from 'events'
import { MessagingHub, WebSocket } from '../../src/messaging-hub'

describe('Messaging Hub', () => {
  it('creates a channel when a new WebSocket connection is openened', () => {
    const wss = new EventEmitter()
    const socket = new EventEmitter()
    const hub = new MessagingHub(wss)

    wss.emit('connection', socket)

    const { channels } = hub.status()

    expect(channels).to.have.lengthOf(1)
  })

  it('removes the channel when the WebSocket connection is closed', () => {
    const wss = new EventEmitter()
    const socket = new EventEmitter()
    const hub = new MessagingHub(wss)

    wss.emit('connection', socket)
    socket.emit('close')

    const { channels } = hub.status()

    expect(channels).to.be.empty
  })

  it('keeps only on message per channel', () => {
    const wss = new EventEmitter()
    const socket1 = new EventEmitter()
    const socket2 = new EventEmitter()
    const hub = new MessagingHub(wss)

    wss.emit('connection', socket1)
    const { channels: [channel1] } = hub.status()
    wss.emit('connection', socket2)
    const channel2 = hub.status().channels.find((c) => c.id !== channel1.id)
    socket1.emit('message', 'message-1-1')
    socket2.emit('message', 'message-2-1')
    socket2.emit('message', 'message-2-2')
    socket1.emit('message', 'message-1-2')

    const messages = hub.pull()

    expect(messages).to.have.lengthOf(2)
    expect(messages[0]).to.eql({ channel: channel2, data: 'message-2-2' })
    expect(messages[1]).to.eql({ channel: channel1, data: 'message-1-2' })
  })

  it('sends messages throught the right channel', async () => {
    const wss = new EventEmitter()
    // The `new class extends EventEmitter` is a workaround to get
    // an object which behaves like an EventEmitter but also has other methods
    //
    // Doing {...emitter, send: sendStub} (or Object.assign) won't work
    // because some of the properties in the EventEmitter instances are
    // non enumerable
    const socket1: WebSocket = new class extends EventEmitter { send = sinon.stub().yieldsAsync() }
    const socket2: WebSocket = new class extends EventEmitter { send = sinon.stub().yieldsAsync() }
    const hub = new MessagingHub(wss)
    const data = 'my-message'

    wss.emit('connection', socket1)
    const { channels: [channel1] } = hub.status()
    wss.emit('connection', socket2)

    await hub.send({ channel: channel1, data })

    expect(socket1.send).to.have.been.calledWith(data)
    expect(socket2.send).to.not.have.been.called
  })

  //TODO don't send messages to a socket that just closed
  //TODO add test for messages in the buffer but socket closed
})

