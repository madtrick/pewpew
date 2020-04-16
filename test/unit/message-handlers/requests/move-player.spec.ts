import { expect } from 'chai'
import * as sinon from 'sinon'
import { MovePlayerMessage } from '../../../../src/messages'
import { GameState } from '../../../../src/game-state'
import { createSession } from '../../../../src/session'
import { createPlayer, PLAYER_RADIUS, Player } from '../../../../src/player'
import { Arena, asSuccess } from '../../../../src/components/arena'
import { RequestType } from '../../../../src/message-handlers'
import handler from '../../../../src/message-handlers/requests/move-player'
import { config } from '../../../config'

// TODO: test the representation of the player in the arena
// TODO: test with the game not started
// TODO: test with the player destroyed

const PLAYER_ID = 'player-1'
const ARENA_WIDTH = 400

describe('Requests - Move player', () => {
  let arena: Arena
  let domainStub: sinon.SinonStub
  let player: Player
  let otherPlayer: Player

  const message: MovePlayerMessage = {
    type: 'Request',
    id: 'MovePlayer',
    data: {
      movement: { direction: 'forward' }
    }
  }

  beforeEach(() => {
    arena = new Arena({ width: ARENA_WIDTH, height: 500 })
    player = createPlayer({ id: PLAYER_ID, initialTokens: config.initialTokensPerPlayer })
    otherPlayer = createPlayer({ id: 'another-player', initialTokens: config.initialTokensPerPlayer })
    domainStub = sinon.stub()
  })

  describe('when the game is started', () => {
    describe('when the player can not be found', () => {
      it('rejects the request', () => {
        const state: GameState = new GameState({ arena })
        const session = createSession({ id: 'channel-1' })

        state.started = true
        session.playerId = 'some-player-id'

        const { result } = handler(session, message, state, domainStub, config)

        expect(result).to.eql({
          session,
          success: false,
          request: RequestType.MovePlayer,
          reason: 'The player could not be found'
        })
        expect(domainStub).to.not.have.been.called
      })
    })

    it('calls the domain logic', () => {
      const state: GameState = new GameState({ arena })
      const session = createSession({ id: 'channel-1' })
      arena.registerPlayer(otherPlayer, { position: { x: ARENA_WIDTH - PLAYER_RADIUS, y: 400 } })
      const registeredPlayer = asSuccess(arena.registerPlayer(player, { position: { x: 50, y: 17 } })).player
      registeredPlayer.rotation = 0
      state.started = true
      session.playerId = registeredPlayer.id
      const initialPlayerTokens = registeredPlayer.tokens
      domainStub.returns({
        status: 'ok',
        turboApplied: false,
        actionCostInTokens: 0,
        player: {
          tokens: initialPlayerTokens,
          position: { x: 51, y: 17 }
        }
      })

      const { result } = handler(session, message, state, domainStub, config)

      expect(domainStub).to.have.been.calledWith()
      expect(result).to.eql({
        session,
        request: RequestType.MovePlayer,
        success: true,
        details: {
          id: PLAYER_ID,
          requestCostInTokens: 0,
          remainingTokens: initialPlayerTokens,
          turboApplied: false,
          position: {
            x: 51,
            y: 17
          }
        }
      })
    })
  })

  describe('when the game has not started', () => {
    it('rejects the request', () => {
      const state: GameState = new GameState({ arena })
      const session = createSession({ id: 'channel-1' })

      const { result } = handler(session, message, state, domainStub, config)

      expect(result).to.eql({
        session,
        success: false,
        reason: 'The game has not started',
        request: RequestType.MovePlayer
      })
      expect(domainStub).to.not.have.been.called
    })
  })
})

