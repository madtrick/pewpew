import { expect } from 'chai'
import sinon from 'sinon'
import { ILogger } from '../../src/types'
import { createSession, createControlSession } from '../../src/session'
import { CommandType } from '../../src/message-handlers'
import { createPlayer } from '../../src/player'
import engine, { EngineState } from '../../src/engine'
import { UpdateType, ComponentType, Arena, asSuccess } from '../../src/components/arena'
import { GameState } from '../../src/game-state'
import { scan } from '../../src/components/radar'
import createLogger from '../utils/create-logger'
import { Session } from '../../src/session'
import { EventType } from '../../src/types'

describe('Engine', () => {
  describe('on each game tick', () => {
    const currentTick = 1

    let sandbox: sinon.SinonSandbox
    let engineState: EngineState
    let loopStub: sinon.SinonStub
    let logger: ILogger

    beforeEach(() => {
      const arena = new Arena({ width: 100, height: 100 }, { radar: scan })
      const gameState = new GameState({ arena })
      engineState = { arena, gameState, channelSession: new Map(), sessionChannel: new Map() }
      sandbox = sinon.createSandbox()
      loopStub = sandbox.stub().resolves({ updates: [] })
      logger = createLogger()
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('calls the game loop', async () => {
      await engine(currentTick, engineState, loopStub, [], [], [], { logger })

      expect(loopStub).to.have.been.calledOnce
    })

    describe('ChannelClose event', () => {
      let controlSession: Session
      let playerSession: Session

      beforeEach(() => {
        controlSession = createControlSession({ id: 'channel-1' })
        playerSession = createSession({ id: 'channel-2' })
        loopStub.resolves({ results: [] })
        engineState.channelSession = new Map([
          ['channel-1', controlSession],
          ['channel-2', playerSession]
        ])
        engineState.sessionChannel = new Map([
          [controlSession, 'channel-1'],
          [playerSession, 'channel-2']
        ])
      })

      it('calls the arena to remove the player', async () => {
        const player = createPlayer({ id: 'player-1' })
        const { player: arenaPlayer } = asSuccess(engineState.gameState.registerPlayer(player))

        sandbox.spy(engineState.arena, 'removePlayer')

        const event = {
          type: EventType.SessionClose,
          data: {
            playerId: player.id
          }
        }
        await engine(currentTick, engineState, loopStub, [], [], [event], { logger })

        expect(engineState.arena.removePlayer).to.have.been.calledOnceWith(arenaPlayer)
      })

      it('sends a message to notify that the corresponding player was removed', async () => {
        const player = createPlayer({ id: 'player-1' })
        engineState.gameState.registerPlayer(player)

        const event = {
          type: EventType.SessionClose,
          data: {
            playerId: player.id
          }
        }
        const { controlResultMessages, playerResultMessages } = await engine(currentTick, engineState, loopStub, [], [], [event], { logger })

        console.dir(controlResultMessages, { depth: null, colors: true })
        expect(playerResultMessages).to.eql([])
        expect(controlResultMessages).to.eql([{
          channel: { id: 'channel-1' },
          data: {
            type: 'Notification',
            id: 'GameStateUpdate',
            data: [{
              type: 'Notification',
              id: 'RemovePlayer',
              component: {
                type: 'Player',
                data: {
                  id: player.id
                }
              }
            }]
          }
        }])
      })

    })

    it('calls the game loop with the valid messages along with the session', async () => {
      const sessionChannel1 = createSession({ id: 'channel-1' })
      const sessionChannel2 = createSession({ id: 'channel-2' })
      const movePlayerMessage = {
        type: 'Request', id: 'MovePlayer',
        data: { movement: { direction: 'forward' } }
      }
      const shootMessage = { type: 'Request', id: 'Shoot' }
      const messages = [
        { channel: { id: 'channel-1' }, data: shootMessage },
        { channel: { id: 'channel-2' }, data: movePlayerMessage }
      ]
      engineState.channelSession.set('channel-1', sessionChannel1)
      engineState.channelSession.set('channel-2', sessionChannel2)

      await engine(currentTick, engineState, loopStub, [], messages, [], { logger })

      expect(loopStub).to.have.been.calledOnceWith(currentTick, engineState.gameState, [
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
      const session = createSession({ id: 'channel-1' })
      const messages = [
        {
          channel: { id: 'channel-1' },
          data: {
            type: 'Request',
            id: 'RegisterPlayer',
            data: {
              id: 'potato'
            }
          }
        }
      ]
      engineState.channelSession.set('channel-1', session)

      await engine(currentTick, engineState, loopStub, [], messages, [], { logger })

      expect(engineState.channelSession.get('channel-1')).to.have.eql(session)
    })

    it('sends an error on messages that do not follow the schemas', async () => {
      const messages = [
        { channel: { id: 'channel-1' }, data: {foo: 'bar'} }
      ]

      const { playerResultMessages, controlResultMessages } = await engine(currentTick, engineState, loopStub, [], messages, [], { logger })

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
      const controlSession = createControlSession({ id: 'channel-1' })
      const playerSession = createSession({ id: 'channel-2' })
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

      const { controlResultMessages, playerResultMessages } = await engine(currentTick, engineState, loopStub, [], [], [], { logger })

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
          type: 'Notification',
          id: 'GameStateUpdate',
          data: [{
            type: 'Response',
            id: 'StartGame',
            success: true
          }]
        }
      }])
    })

    it('transform the game updates into notifications and sends those', async () => {
      const controlSession = createControlSession({ id: 'channel-1' })
      const playerSession = createSession({ id: 'channel-2' })
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

      const { controlResultMessages, playerResultMessages } = await engine(currentTick, engineState, loopStub, [], [], [], { logger })

      expect(playerResultMessages).to.be.empty
      expect(controlResultMessages).to.eql([{
        channel: { id: 'channel-1' },
        data: {
          type: 'Notification',
          id: 'GameStateUpdate',
          data: [{
            type: 'Notification',
            id: 'Movement',
            component: {
              type: 'Shot',
              data: {
                id: 'shot-1',
                position: { x: 100, y: 100 }
              }
            }
          }]
        }
      }])
    })
  })
})

