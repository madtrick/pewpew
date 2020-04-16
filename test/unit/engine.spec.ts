import { expect } from 'chai'
import sinon from 'sinon'
import { UpdateType, ComponentType, Logger, EventType } from '../../src/types'
import { createSession, createControlSession, Session } from '../../src/session'
import { CommandType, RequestType } from '../../src/message-handlers'
import { createPlayer, Player } from '../../src/player'
import engine, { EngineState } from '../../src/engine'
import { Arena, asSuccess } from '../../src/components/arena'
import { GameState } from '../../src/game-state'
import createLogger from '../utils/create-logger'
import { config } from '../config'

describe('Engine', () => {
  describe('on each game tick', () => {

    let sandbox: sinon.SinonSandbox
    let engineState: EngineState
    let loopStub: sinon.SinonStub
    let logger: Logger
    let arena: Arena
    let player: Player

    beforeEach(() => {
      player = createPlayer({ id: 'player-1', initialTokens: config.initialTokensPerPlayer })
      arena = new Arena({ width: 100, height: 100 })
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
      await engine(engineState, loopStub, [], [], [], { logger, config })

      expect(loopStub).to.have.been.calledOnce
    })

    describe('Control channel - ChannelOpen event', () => {
      let controlSession: Session
      let playerSession: Session

      beforeEach(() => {
        controlSession = createControlSession({ id: 'channel-1' })
        playerSession = createSession({ id: 'channel-2' })
        loopStub.resolves({ results: [] })
        engineState.channelSession = new Map([
          ['channel-2', playerSession]
        ])
        engineState.sessionChannel = new Map([
          [playerSession, 'channel-2']
        ])
      })

      describe('when the game has already been started', () => {
        it('sends a message to notify the control channel of the initial game state', async () => {
          engineState.gameState = new GameState({ arena, started: true })
          const { player: registeredPlayer } = asSuccess(engineState.gameState.registerPlayer(player))

          const event = {
            type: EventType.SessionOpen,
            data: controlSession

          }
          const { controlResultMessages, playerResultMessages } = await engine(engineState, loopStub, [], [], [event], { logger, config })

          expect(playerResultMessages).to.eql([{
            channel: { id: 'channel-2' },
            data: {
              type: 'Notification',
              id: 'Tick'
            }
          }])
          expect(controlResultMessages).to.eql([{
            channel: { id: 'channel-1' },
            data: {
              type: 'Notification',
              id: 'GameStateInit',
              data: {
                isGameStarted: true,
                players: [
                  {
                    id: 'player-1',
                    position: registeredPlayer.position,
                    rotation: registeredPlayer.rotation,
                    life: player.life
                  }
                ],
                shots: [],
                mines: []
              }
            }
          }])
        })
      })
    })

    describe('Player channel - ChannelClose event', () => {
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
        const { player: registeredPlayer } = asSuccess(engineState.gameState.registerPlayer(player))

        sandbox.spy(engineState.arena, 'removePlayer')

        const event = {
          type: EventType.SessionClose,
          data: {
            playerId: player.id
          }
        }
        await engine(engineState, loopStub, [], [], [event], { logger, config })

        expect(engineState.arena.removePlayer).to.have.been.calledOnceWith(registeredPlayer)
      })

      it('sends a message to notify that the corresponding player was removed', async () => {
        engineState.gameState.registerPlayer(player)
        engineState.channelSession.delete(playerSession.channel.id)

        const event = {
          type: EventType.SessionClose,
          data: {
            playerId: player.id
          }
        }
        const { controlResultMessages, playerResultMessages } = await engine(engineState, loopStub, [], [], [event], { logger, config })

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

      await engine(engineState, loopStub, [], messages, [], { logger, config })

      expect(loopStub).to.have.been.calledOnceWith(engineState.gameState, [
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

      await engine(engineState, loopStub, [], messages, [], { logger, config })

      expect(engineState.channelSession.get('channel-1')).to.have.eql(session)
    })

    it('sends an error on messages that do not follow the schemas', async () => {
      const messages = [
        { channel: { id: 'channel-1' }, data: { foo: 'bar' } }
      ]

      const { playerResultMessages, controlResultMessages } = await engine(engineState, loopStub, [], messages, [], { logger, config })

      expect(controlResultMessages).to.be.empty
      expect(playerResultMessages).to.eql([
        {
          channel: { id: 'channel-1' },
          data: {
            type: 'Error',
            details: {
              msg: 'Invalid message'
            }
          }
        },
        // TODO having to include this Notification feels a bit like a leaky abstraction. On this test
        // I'm only interested that the player will receive a response for his invalid request but I
        // have to test nonetheless for the tick notification. Maybe this is a sign that there should be
        // player driven responses and game driven notifications
        {
          channel: { id: 'channel-1' },
          data: {
            type: 'Notification',
            id: 'Tick'
          }
        }
      ])
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

      const { controlResultMessages, playerResultMessages } = await engine(engineState, loopStub, [], [], [], { logger, config })

      expect(playerResultMessages).to.eql([
        {
          channel: { id: 'channel-2' },
          data: {
            type: 'Notification',
            id: 'StartGame'
          }
        },
        {
          channel: { id: 'channel-2' },
          data: {
            type: 'Notification',
            id: 'Tick'
          }
        }
      ])
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

      const { controlResultMessages, playerResultMessages } = await engine(engineState, loopStub, [], [], [], { logger, config })

      expect(playerResultMessages).to.eql([
        {
          channel: { id: 'channel-2' },
          data: {
            type: 'Notification',
            id: 'Tick'
          }
        }
      ])
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

    describe('Tick notifications', () => {
      it('is sent to each registered player after any other message', async () => {
        const playerSession = createSession({ id: 'channel-2' })
        playerSession.playerId = player.id
        // Response to a shoot request
        loopStub.resolves({
          results: [
            {
              session: playerSession,
              success: true,
              request: RequestType.Shoot,
              details: {
                requestCostInTokens: config.costs.playerShot,
                remainingTokens: player.tokens - config.costs.playerShot,
                id: player.id
              }
            }
          ]
        })

        engineState.channelSession = new Map([
          ['channel-2', playerSession]
        ])

        const { playerResultMessages } = await engine(engineState, loopStub, [], [], [], { logger, config })

        expect(playerResultMessages).to.eql([
          {
            channel: { id: 'channel-2' },
            data: {
              type: 'Response',
              id: RequestType.Shoot,
              success: true,
              data: {
                component: {
                  details: {
                    tokens: player.tokens - config.costs.playerShot
                  }
                },
                request: {
                  cost: config.costs.playerShot
                }
              }
            }
          },
          {
            channel: { id: 'channel-2' },
            data: {
              type: 'Notification',
              id: 'Tick'
            }
          }
        ])
      })

      it('is sent to inactive players', async () => {
        const playerSession = createSession({ id: 'channel-2' })
        engineState.channelSession = new Map([
          ['channel-2', playerSession]
        ])

        const { playerResultMessages } = await engine(engineState, loopStub, [], [], [], { logger, config })

        expect(playerResultMessages).to.eql([
          {
            channel: { id: 'channel-2' },
            data: {
              type: 'Notification',
              id: 'Tick'
            }
          }
        ])
      })

      it('is not sent to control channels', async () => {
        const controlSession = createControlSession({ id: 'channel-1' })
        engineState.channelSession = new Map([
          ['channel-1', controlSession]
        ])

        const { controlResultMessages } = await engine(engineState, loopStub, [], [], [], { logger, config })

        expect(controlResultMessages).to.eql([])
      })
    })
  })
})

