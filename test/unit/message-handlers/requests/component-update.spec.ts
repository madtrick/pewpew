import { expect } from 'chai'
import { DeployMineMessage } from '../../../../src/messages'
import { GameState } from '../../../../src/game-state'
import { createPlayer, PLAYER_RADIUS } from '../../../../src/player'
import { Session, createSession } from '../../../../src/session'
import { Arena, asSuccess } from '../../../../src/components/arena'
import { scan } from '../../../../src/components/radar'
import { RequestType } from '../../../../src/message-handlers'
import handler, { ComponentUpdateMessage } from '../../../../src/message-handlers/requests/component-update'

describe('Requests - Update component', () => {
  let arena: Arena
  let gameStateOptions: { arena: Arena } // TODO maybe export the type for this options
  let session: Session

  beforeEach(() => {
    arena = new Arena({ width: 300, height: 300 }, { radar: scan })
    gameStateOptions = { arena }

    session = createSession({ id: 'channel-1' })
  })

  describe('when the game has not started', () => {
    it('rejects the request', () => {
      const state: GameState = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      const initialStatus = player.status
      const message: ComponentUpdateMessage = {
        type: 'Request',
        id: RequestType.ComponentUpdate,
        data: {
          component: {
            type: 'Player',
            set: {
              status: 'Keep calm and rush b'
            }
          }
        }
      }

      const { result } = handler(session, message, state)

      expect(result).to.eql({
        session,
        success: false,
        reason: 'The game has not started',
        request: RequestType.ComponentUpdate
      })
      expect(player.status).to.eql(initialStatus)
    })
  })

  describe('when the session has no player registered', () => {
    it('rejects the request', () => {
      const state: GameState = new GameState(gameStateOptions)
      const message: ComponentUpdateMessage = {
        type: 'Request',
        id: RequestType.ComponentUpdate,
        data: {
          component: {
            type: 'Player',
            set: {
              status: 'Keep calm and rush b'
            }
          }
        }
      }

      state.started = true

      const { result } = handler(session, message, state)

      expect(result).to.eql({
        session,
        success: false,
        reason: 'There is no player registered for this session',
        request: RequestType.ComponentUpdate
      })
    })
  })

  describe('when the game is started and the session has a player registered', () => {
    describe('when the player can not be found', () => {
      it('rejects the request', () => {
        const state: GameState = new GameState({ arena })
        const message: ComponentUpdateMessage = {
          type: 'Request',
          id: RequestType.ComponentUpdate,
          data: {
            component: {
              type: 'Player',
              set: {
                status: 'Keep calm and rush b'
              }
            }
          }
        }

        state.started = true
        session.playerId = 'some-player-id'

        const { result } = handler(session, message, state)

        expect(result).to.eql({
          session,
          success: false,
          request: RequestType.ComponentUpdate,
          reason: 'The player could not be found'
        })
      })
    })

    it('does not update non existent properties', () => {
      const state = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player))
      const message: ComponentUpdateMessage = {
        type: 'Request',
        id: RequestType.ComponentUpdate,
        data: {
          component: {
            type: 'Player',
            set: {
              foo: 'bar'
            }
          }
        }
      }

      session.playerId = registeredPlayer.id
      state.started = true

      const { result } = handler(session, message, state)

      console.dir(result)

      expect(result).to.eql({
        success: true,
        details: {
          type: 'Player',
          set: {
            foo: 'bar'
          },
          errors: [
            { path: 'foo', value: 'bar', msg: 'Path "foo" does not exist on type "Player"' }
          ]
        },
        request: RequestType.ComponentUpdate
      })
      expect('foo' in player).to.be.false
    })

    it('updates existing properties', () => {
      const state = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player))
      const message: ComponentUpdateMessage = {
        type: 'Request',
        id: RequestType.ComponentUpdate,
        data: {
          component: {
            type: 'Player',
            set: {
              status: 'Keep calm and shoot'
            }
          }
        }
      }

      session.playerId = registeredPlayer.id
      state.started = true

      const { result } = handler(session, message, state)

      console.dir(result)

      expect(result).to.eql({
        success: true,
        details: {
          type: 'Player',
          set: {
            status: 'Keep calm and shoot'
          }
        },
        request: RequestType.ComponentUpdate
      })
      expect(registeredPlayer.status).to.eql('Keep calm and shoot')
    })
  })
})

