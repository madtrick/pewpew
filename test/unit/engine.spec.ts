import { expect } from 'chai'
import sinon from 'sinon'
import { EventEmitter } from 'events'
import { createSession, createControlSession } from '../../src/session'
import { CommandType } from '../../src/message-handlers'
import engine, { EngineState } from '../../src/engine'
import { UpdateType, ComponentType, Arena } from '../../src/components/arena'
// TODO make messaging hub the default export
import { MessagingHub } from '../../src/messaging-hub'

describe('Engine', () => {
  describe('on each game tick', () => {
    const gameStateFactory = sinon.stub().returns('fake-state')

    let messagingHub: MessagingHub
    let messagingHubPullStub: sinon.SinonStub
    let messagingHubSendStub: sinon.SinonStub
    let sandbox: sinon.SinonSandbox
    let engineState: EngineState
    let loopStub: sinon.SinonStub

    beforeEach(() => {
      const wss = new EventEmitter()
      const arena = new Arena({ width: 100, height: 100 })
      const gameState = gameStateFactory(arena)
      engineState = { arena, gameState, channelSession: new Map(), sessionChannel: new Map() }
      sandbox = sinon.createSandbox()
      loopStub = sandbox.stub().resolves({ updates: [] })
      messagingHub = new MessagingHub(wss)
      messagingHubPullStub = sandbox.stub(messagingHub, 'pull')
      messagingHubSendStub = sandbox.stub(messagingHub, 'send')
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('calls the game loop', async () => {
      const config = { loopDelayInMs: 100 }
      messagingHubPullStub.returns([])

      await engine(engineState, loopStub, messagingHub, createSession, config)

      expect(loopStub).to.have.been.calledOnce
    })

    it('calls the game loop with the valid messages along with the session', async () => {
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
      const fakeCreateSession = () => sessionChannel2
      sandbox.stub(engineState.channelSession, 'get').callsFake((id: string) => {
        if (id === 'channel-1') {
          return sessionChannel1
        }

        return undefined
      })

      await engine(engineState, loopStub, messagingHub, fakeCreateSession, config)

      expect(loopStub).to.have.been.calledOnceWith('fake-state', [
        {
          session: sessionChannel1,
          message: shootMessage
        },
        {
          session: sessionChannel2,
          message: movePlayerMessage
        }
      ])
    })

    it('creates a session if one did not exist', async () => {
      const config = { loopDelayInMs: 100 }
      const session = createSession()
      const messages = [
        { channel: { id: 'channel-1' }, data: JSON.stringify({ sys: { type: 'Request', id: 'RegisterPlayer' } }) }
      ]
      messagingHubPullStub.returns(messages)
      const fakeCreateSession = () => session

      expect(engineState.channelSession.get('channel-1')).to.be.undefined

      engine(engineState, loopStub, messagingHub, fakeCreateSession, config)

      expect(engineState.channelSession.get('channel-1')).to.have.eql(session)
    })

    it('sends an error on non valid json messages', async () => {
      const config = { loopDelayInMs: 100 }
      const messages = [
        { channel: { id: 'channel-1' }, data: 'message-1' }
      ]
      messagingHubPullStub.returns(messages)
      messagingHubSendStub.resolves()

      await engine(engineState, loopStub, messagingHub, createSession, config)

      expect(messagingHub.send).to.have.been.calledOnceWith({
        channel: { id: 'channel-1' },
        data: {
          type: 'Error',
          details: {
            msg: 'Invalid message'
          }
        }
      })
    })

    it('sends an error on non-string messages', async () => {
      const config = { loopDelayInMs: 100 }
      const messages = [
        { channel: { id: 'channel-1' }, data: undefined }
      ]
      messagingHubPullStub.returns(messages)
      messagingHubSendStub.resolves()

      await engine(engineState, loopStub, messagingHub, createSession, config)

      expect(messagingHub.send).to.have.been.calledOnceWith({
        channel: { id: 'channel-1' },
        data: {
          type: 'Error',
          details: {
            msg: 'Invalid message'
          }
        }
      })
    })

    it('sends an error on messages that do not follow the schemas', async () => {
      const config = { loopDelayInMs: 100 }
      const messages = [
        { channel: { id: 'channel-1' }, data: JSON.stringify({foo: 'bar'}) }
      ]
      messagingHubPullStub.returns(messages)
      messagingHubSendStub.resolves()

      await engine(engineState, loopStub, messagingHub, createSession, config)

      expect(messagingHub.send).to.have.been.calledOnceWith({
        channel: { id: 'channel-1' },
        data: {
          type: 'Error',
          details: {
            msg: 'Invalid message'
          }
        }
      })
    })

    it('transform the requests and commands results into notifications and responses and sends those', async () => {
      const config = { loopDelayInMs: 100 }
      const controlSession = createControlSession()
      const playerSession = createSession()
      messagingHubPullStub.returns([])
      messagingHubSendStub.resolves()
      loopStub.resolves({
        results: [
          {
            success: true,
            command: CommandType.StartGame
          }
        ]
      })

      engineState.channelSession = new Map([
        ['channel-1', controlSession],
        ['channel-2', playerSession]
      ])
      engineState.sessionChannel = new Map([
        [controlSession, 'channel-1'],
        [playerSession, 'channel-2']
      ])

      await engine(engineState, loopStub, messagingHub, createSession, config)

      expect(messagingHub.send).to.have.been.calledTwice
      expect(messagingHub.send).to.have.been.calledWith({
        channel: { id: 'channel-1' },
        data: {
          type: 'Response',
          id: 'StartGame',
          success: true
        }
      })
      expect(messagingHub.send).to.have.been.calledWith({
        channel: { id: 'channel-2' },
        data: {
          type: 'Notification',
          id: 'StartGame',
        }
      })
    })

    it('transform the game updates into notifications and sends those', async () => {
      const config = { loopDelayInMs: 100 }
      const controlSession = createControlSession()
      const playerSession = createSession()
      messagingHubPullStub.returns([])
      messagingHubSendStub.resolves()
      loopStub.resolves({
        updates: [
          {
            type: UpdateType.Movement,
            component: {
              type: ComponentType.Shot,
              data: {
                id: 'shot-1',
                position: { x: 100, y: 100 }
              }
            }
          }
        ]
      })

      engineState.channelSession = new Map([
        ['channel-1', controlSession],
        ['channel-2', playerSession]
      ])

      await engine(engineState, loopStub, messagingHub, createSession, config)

      expect(messagingHub.send).to.have.been.calledOnceWith({
        channel: { id: 'channel-1' },
        data: {
          type: 'Notification',
          id: 'Movement',
          component: {
            type: 'Shot',
            data: {
              id: 'shot-1',
              position: { x: 100, y: 100 }
            }
          }
        }
      })
    })
  })
})

