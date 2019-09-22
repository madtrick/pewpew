import { expect } from 'chai'
import sinon from 'sinon'
import { ILogger } from '../../src/types'
import { createSession, createControlSession } from '../../src/session'
import { CommandType } from '../../src/message-handlers'
import engine, { EngineState } from '../../src/engine'
import { UpdateType, ComponentType, Arena } from '../../src/components/arena'
import createLogger from '../utils/create-logger'

describe('Engine', () => {
  describe('on each game tick', () => {
    const gameStateFactory = sinon.stub().returns('fake-state')

    let sandbox: sinon.SinonSandbox
    let engineState: EngineState
    let loopStub: sinon.SinonStub
    let logger: ILogger

    beforeEach(() => {
      const arena = new Arena({ width: 100, height: 100 })
      const gameState = gameStateFactory(arena)
      engineState = { arena, gameState, channelSession: new Map(), sessionChannel: new Map() }
      sandbox = sinon.createSandbox()
      loopStub = sandbox.stub().resolves({ updates: [] })
      logger = createLogger()
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('calls the game loop', async () => {
      await engine(engineState, loopStub, [], [], createSession, createControlSession, { logger })

      expect(loopStub).to.have.been.calledOnce
    })

    it('calls the game loop with the valid messages along with the session', async () => {
      const sessionChannel1 = createSession()
      const sessionChannel2 = createSession()
      const movePlayerMessage = {
        sys: { type: 'Request', id: 'MovePlayer' },
        data: { movement: { direction: 'forward' } }
      }
      const shootMessage = { sys: { type: 'Request', id: 'Shoot' } }
      const messages = [
        { channel: { id: 'channel-1' }, data: shootMessage },
        { channel: { id: 'channel-2' }, data: movePlayerMessage }
      ]
      const fakeCreateSession = () => sessionChannel2
      sandbox.stub(engineState.channelSession, 'get').callsFake((id: string) => {
        if (id === 'channel-1') {
          return sessionChannel1
        }

        return undefined
      })

      await engine(engineState, loopStub, [], messages, fakeCreateSession, createControlSession, { logger })

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
      const session = createSession()
      const messages = [
        {
          channel: { id: 'channel-1' },
          data: {
            sys: {
              type: 'Request',
              id: 'RegisterPlayer'
            },
            data: {
              id: 'potato'
            }
          }
        }
      ]
      const fakeCreateSession = () => session

      expect(engineState.channelSession.get('channel-1')).to.be.undefined

      await engine(engineState, loopStub, [], messages, fakeCreateSession, createControlSession, { logger })

      expect(engineState.channelSession.get('channel-1')).to.have.eql(session)
    })

    it('sends an error on messages that do not follow the schemas', async () => {
      const messages = [
        { channel: { id: 'channel-1' }, data: {foo: 'bar'} }
      ]

      const { playerResultMessages, controlResultMessages } = await engine(engineState, loopStub, [], messages, createSession, createControlSession, { logger })

      expect(controlResultMessages).to.be.empty
      expect(playerResultMessages).to.eql([{
        channel: { id: 'channel-1' },
        data: {
          type: 'Error',
          details: {
            msg: 'Invalid message'
          }
        }
      }])
    })

    it('transform the requests and commands results into notifications and responses and sends those', async () => {
      const controlSession = createControlSession()
      const playerSession = createSession()
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

      const { controlResultMessages, playerResultMessages } = await engine(engineState, loopStub, [], [], createSession, createControlSession, { logger })

      expect(playerResultMessages).to.eql([{
        channel: { id: 'channel-2' },
        data: {
          type: 'Notification',
          id: 'StartGame',
        }
      }])
      expect(controlResultMessages).to.eql([{
        channel: { id: 'channel-1' },
        data: {
          type: 'Response',
          id: 'StartGame',
          success: true
        }
      }])
    })

    it('transform the game updates into notifications and sends those', async () => {
      const controlSession = createControlSession()
      const playerSession = createSession()
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
      engineState.sessionChannel = new Map([
        [controlSession, 'channel-1'],
        [playerSession, 'channel-2']
      ])

      const { controlResultMessages, playerResultMessages } = await engine(engineState, loopStub, [], [], createSession, createControlSession, { logger })

      expect(playerResultMessages).to.be.empty
      expect(controlResultMessages).to.eql([{
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
      }])
    })
  })
})

