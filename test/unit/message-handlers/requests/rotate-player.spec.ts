import { expect } from 'chai'
import * as sinon from 'sinon'
import { RotatePlayerMessage } from '../../../../src/messages'
import { GameState } from '../../../../src/game-state'
import { createSession, Session } from '../../../../src/session'
import { createPlayer } from '../../../../src/player'
import { Arena, asSuccess } from '../../../../src/components/arena'
import { RequestType } from '../../../../src/message-handlers'
import { scan } from '../../../../src/components/radar'
import handler, { ROTATION_COST_IN_TOKENS } from '../../../../src/message-handlers/requests/rotate-player'
import { config } from '../../../config'

// TODO: test the representation of the player in the arena
// TODO: test with the game not started
// TODO: test with the player destroyed

const PLAYER_ID = 'player-1'

describe('Requests - Rotate player', () => {
  let arena: Arena
  let session: Session

  beforeEach(() => {
    arena = new Arena({ width: 100, height: 100 }, { radar: scan })
    session = createSession({ id: 'channel-1' })
  })

  describe('when the game is started', () => {
    describe('when the player can not be found', () => {
      it('rejects the request', () => {
        const state: GameState = new GameState({ arena })
        const message: RotatePlayerMessage = {
          type: 'Request',
          id: 'RotatePlayer',
          data: {
            rotation: 30
          }
        }
        sinon.spy(arena, 'rotatePlayer')

        state.started = true
        session.playerId = 'some-player-id'

        const { result } = handler(session, message, state, config)

        expect(result).to.eql({
          session,
          success: false,
          request: RequestType.RotatePlayer,
          reason: 'The player could not be found'
        })
        expect(arena.rotatePlayer).to.not.have.been.called
      })
    })

    describe('when the session has no player registered', () => {
      it('rejects the request', () => {
        const state: GameState = new GameState({ arena })
        const message: RotatePlayerMessage = {
          type: 'Request',
          id: 'RotatePlayer',
          data: {
            rotation: 300
          }
        }
        sinon.spy(arena, 'rotatePlayer')

        state.started = true

        const { result } = handler(session, message, state, config)

        expect(result).to.eql({
          session,
          success: false,
          reason: 'There is no player registered for this session',
          request: RequestType.RotatePlayer
        })
        expect(arena.rotatePlayer).to.not.have.been.called
      })
    })

    describe('when the session has the player registered', () => {
      it('rotates the player', () => {
        const state: GameState = new GameState({ arena })
        const player = createPlayer({ id: PLAYER_ID })
        const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player))
        const rotation = 300
        const initialTokens = player.tokens
        const message: RotatePlayerMessage = {
          type: 'Request',
          id: 'RotatePlayer',
          data: {
            rotation
          }
        }
        sinon.spy(arena, 'rotatePlayer')

        state.started = true
        session.playerId = registeredPlayer.id

        const { result } = handler(session, message, state, config)

        expect(result).to.eql({
          success: true,
          request: RequestType.RotatePlayer,
          details: {
            id: PLAYER_ID,
            rotation,
            remainingTokens: registeredPlayer.tokens,
            requestCostInTokens: ROTATION_COST_IN_TOKENS
          }
        })
        expect(registeredPlayer.rotation).to.eql(rotation)
        expect(registeredPlayer.tokens).to.eql(initialTokens - ROTATION_COST_IN_TOKENS)
        expect(arena.rotatePlayer).to.have.been.calledOnceWith(rotation, registeredPlayer)
      })
    })
  })

  describe('when the game has not started', () => {
    it('rejects the request', () => {
      const state: GameState = new GameState({ arena })
      const message: RotatePlayerMessage = {
        type: 'Request',
        id: 'RotatePlayer',
        data: {
          rotation: 300
        }
      }
      sinon.spy(arena, 'rotatePlayer')

      const { result } = handler(session, message, state, config)

      expect(result).to.eql({
        session,
        success: false,
        reason: 'The game has not started',
        request: RequestType.RotatePlayer
      })
      expect(arena.rotatePlayer).to.not.have.been.called
    })
  })
})

