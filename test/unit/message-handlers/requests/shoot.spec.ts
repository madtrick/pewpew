import { expect } from 'chai'
import * as sinon from 'sinon'
import { ShootMessage } from '../../../../src/messages'
import { GameState } from '../../../../src/game-state'
import { createPlayer } from '../../../../src/player'
import { createSession } from '../../../../src/session'
import { Arena, asSuccess } from '../../../../src/components/arena'
import handler from '../../../../src/message-handlers/requests/shoot'

describe('Requests - Shoot', () => {
  let arena: Arena
  let gameStateOptions: { arena: Arena } // TODO maybe export the type for this options
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    arena = new Arena({ width: 100, height: 100 })

    sandbox = sinon.createSandbox()
    sandbox.stub(arena, 'registerShot')
    gameStateOptions = { arena }
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('when the game has not started', () => {
    it('rejects the request', () => {
      const state: GameState = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      const session = createSession()
      const initialShots = player.shots

      const message: ShootMessage = {
        session,
        payload: {
          sys: {
            type: 'Request',
            id: 'Shoot'
          }
        }
      }

      const { response } = handler(message, state)

      // TODO check that the player still has the initial number of shots
      expect(response).to.eql({
        data: {
          result: 'Failure',
          msg: 'The game has not started'
        },
        sys: {
          type: 'Response',
          id: 'Shoot'
        }
      })
      expect(player.shots).to.eql(initialShots)
      expect(arena.registerShot).to.not.have.been.called
    })
  })

  describe('when the session has no player registered', () => {
    it('rejects the request', () => {
      const state: GameState = new GameState(gameStateOptions)
      const session = createSession()
      const message: ShootMessage = {
        session,
        payload: {
          sys: {
            type: 'Request',
            id: 'Shoot'
          }
        }
      }

      state.started = true

      const { response } = handler(message, state)

      expect(response).to.eql({
        data: {
          result: 'Failure',
          msg: 'There is no player registered for this session'
        },
        sys: {
          type: 'Response',
          id: 'Shoot'
        }
      })
    })
  })

  describe('when the game is started and the session has a player registered', () => {
    it('does not take the shot if the player has no shots left', () => {
      const state = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player))
      const session = createSession()
      const message: ShootMessage = {
        session,
        payload: {
          sys: {
            type: 'Request',
            id: 'Shoot'
          }
        }
      }

      registeredPlayer.shots = 0
      session.player = registeredPlayer
      state.started = true

      const { response } = handler(message, state)

      expect(response).to.eql({
        data: {
          result: 'Failure',
          msg: 'There are no shots left'
        },
        sys: {
          type: 'Response',
          id: 'Shoot'
        }
      })
      expect(arena.registerShot).to.not.have.been.called
    })

    it('takes the shot if the player has remaining shots', () => {
      const state = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player))
      const initialShots = registeredPlayer.shots
      const session = createSession()
      const message: ShootMessage = {
        session,
        payload: {
          sys: {
            type: 'Request',
            id: 'Shoot'
          }
        }
      }

      session.player = registeredPlayer
      state.started = true

      const { response } = handler(message, state)

      expect(response).to.eql({
        data: {
          result: 'Success',
        },
        sys: {
          type: 'Response',
          id: 'Shoot'
        }
      })
      expect(registeredPlayer.shots).to.eql(initialShots - 1)
      expect(arena.registerShot).to.have.been.calledOnce
    })
  })
})


