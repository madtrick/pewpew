import { expect } from 'chai'
import sinon from 'sinon'
import { EventEmitter } from 'events'
import { createSession } from '../../src/session'
import engine, { createSessionManager, SessionManager } from '../../src/engine'
// TODO make messaging hub the default export
import { MessagingHub } from '../../src/messaging-hub'

describe('Engine', () => {
  describe('on each game tick', () => {
    const gameStateFactory = sinon.stub().returns('fake-state')

    let messagingHub: MessagingHub
    let sessionManager: SessionManager
    let messagingHubPullStub: sinon.SinonStub
    let messagingHubSendStub: sinon.SinonStub
    let sandbox: sinon.SinonSandbox

    beforeEach(() => {
      const wss = new EventEmitter()
      messagingHub = new MessagingHub(wss)
      messagingHubPullStub = sinon.stub(messagingHub, 'pull')
      messagingHubSendStub = sinon.stub(messagingHub, 'send')
      sessionManager = createSessionManager()
      sandbox = sinon.createSandbox()
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('calls the game loop periodically', async () => {
      const loop = sinon.stub()
      const clock = sinon.useFakeTimers()
      const config = { loopDelayInMs: 100 }
      messagingHubPullStub.returns([])

      engine(loop, messagingHub, gameStateFactory, sessionManager, config)

      // TODO maybe replace the setInterval in the engine
      // with a custom abstraction I can pass as a dependency
      // so I don't have to mock the timer
      clock.tick(config.loopDelayInMs)
      clock.tick(config.loopDelayInMs)
      clock.tick(config.loopDelayInMs)

      expect(loop).to.have.been.calledThrice
      clock.restore()
    })

    it('calls the game loop with the valid messages along with the session', async () => {
      const loop = sinon.stub()
      const clock = sinon.useFakeTimers()
      const config = { loopDelayInMs: 100 }
      const sessionChannel1 = createSession()
      const sessionChannel2 = createSession()
      const movePlayerMessage = {
        sys: { type: 'Request', id: 'MovePlayer' },
        data: { movement: { direction: 'forward' } }
      }
      const shootMessage = { sys: { type: 'Request', id: 'Shoot' } }
      const messages = [
        { channel: { id: 'channel-1' }, data: JSON.stringify(shootMessage) },
        { channel: { id: 'channel-2' }, data: JSON.stringify(movePlayerMessage) },
        { channel: { id: 'channel-3' }, data: 'foo' },
      ]
      messagingHubPullStub.returns(messages)
      sandbox.stub(sessionManager, 'createAndSet').returns(sessionChannel2)
      sandbox.stub(sessionManager, 'get').callsFake((id: string) => {
        if (id === 'channel-1') {
          return sessionChannel1
        }

        return undefined
      })

      engine(loop, messagingHub, gameStateFactory, sessionManager, config)

      // TODO maybe replace the setInterval in the engine
      // with a custom abstraction I can pass as a dependency
      // so I don't have to mock the timer
      clock.tick(config.loopDelayInMs)

      expect(loop).to.have.been.calledOnceWith('fake-state', [
        {
          session: sessionChannel1,
          message: shootMessage
        },
        {
          session: sessionChannel2,
          message: movePlayerMessage
        }
      ])
      clock.restore()
    })

    it('creates a session if one did not exist', () => {
      const loop = sinon.stub()
      const clock = sinon.useFakeTimers()
      const config = { loopDelayInMs: 100 }
      const messages = [
        { channel: { id: 'channel-1' }, data: JSON.stringify({ sys: { type: 'Request', id: 'RegisterPlayer' } }) }
      ]
      messagingHubPullStub.returns(messages)
      sandbox.spy(sessionManager, 'createAndSet')

      engine(loop, messagingHub, gameStateFactory, sessionManager, config)

      // TODO maybe replace the setInterval in the engine
      // with a custom abstraction I can pass as a dependency
      // so I don't have to mock the timer
      clock.tick(config.loopDelayInMs)

      expect(sessionManager.createAndSet).to.have.been.calledOnceWith('channel-1')
      clock.restore()
    })

    it('sends an error on non valid json messages', () => {
      const loop = sinon.stub()
      const clock = sinon.useFakeTimers()
      const config = { loopDelayInMs: 100 }
      const messages = [
        { channel: { id: 'channel-1' }, data: 'message-1' }
      ]
      messagingHubPullStub.returns(messages)
      messagingHubSendStub.resolves()

      engine(loop, messagingHub, gameStateFactory, sessionManager, config)

      // TODO maybe replace the setInterval in the engine
      // with a custom abstraction I can pass as a dependency
      // so I don't have to mock the timer
      clock.tick(config.loopDelayInMs)

      expect(messagingHub.send).to.have.been.calledOnceWith({
        channel: { id: 'channel-1' },
        data: {
          type: 'Error',
          details: {
            msg: 'Invalid message payload'
          }
        }
      })
      clock.restore()
    })

    it('sends an error on non-string messages', () => {
      const loop = sinon.stub()
      const clock = sinon.useFakeTimers()
      const config = { loopDelayInMs: 100 }
      const messages = [
        { channel: { id: 'channel-1' }, data: undefined }
      ]
      messagingHubPullStub.returns(messages)
      messagingHubSendStub.resolves()

      engine(loop, messagingHub, gameStateFactory, sessionManager, config)

      // TODO maybe replace the setInterval in the engine
      // with a custom abstraction I can pass as a dependency
      // so I don't have to mock the timer
      clock.tick(config.loopDelayInMs)

      expect(messagingHub.send).to.have.been.calledOnceWith({
        channel: { id: 'channel-1' },
        data: {
          type: 'Error',
          details: {
            msg: 'Invalid message payload'
          }
        }
      })
      clock.restore()
    })

    it('sends an error on messages that do not follow the schemas', () => {
      const loop = sinon.stub()
      const clock = sinon.useFakeTimers()
      const config = { loopDelayInMs: 100 }
      const messages = [
        { channel: { id: 'channel-1' }, data: JSON.stringify({foo: 'bar'}) }
      ]
      messagingHubPullStub.returns(messages)
      messagingHubSendStub.resolves()

      engine(loop, messagingHub, gameStateFactory, sessionManager, config)

      // TODO maybe replace the setInterval in the engine
      // with a custom abstraction I can pass as a dependency
      // so I don't have to mock the timer
      clock.tick(config.loopDelayInMs)

      expect(messagingHub.send).to.have.been.calledOnceWith({
        channel: { id: 'channel-1' },
        data: {
          type: 'Error',
          details: {
            msg: 'Invalid message payload'
          }
        }
      })
      clock.restore()
    })
  })
})

