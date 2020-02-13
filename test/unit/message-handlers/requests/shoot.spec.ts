import { expect } from 'chai'
import * as sinon from 'sinon'
import { ShootMessage } from '../../../../src/messages'
import { GameState } from '../../../../src/game-state'
import { createPlayer, Player } from '../../../../src/player'
import { Session, createSession } from '../../../../src/session'
import { Arena, asSuccess } from '../../../../src/components/arena'
import { RequestType } from '../../../../src/message-handlers'
import handler from '../../../../src/message-handlers/requests/shoot'
import { config } from '../../../config'

describe('Requests - Shoot', () => {
  let arena: Arena
  let gameStateOptions: { arena: Arena } // TODO maybe export the type for this options
  let sandbox: sinon.SinonSandbox
  let session: Session
  let player: Player
  const playerShotCostInTokens = config.costs.playerShot

  beforeEach(() => {
    arena = new Arena({ width: 100, height: 100 })
    player = createPlayer({ id: 'player-1', initialTokens: config.initialTokensPerPlayer })

    sandbox = sinon.createSandbox()
    sandbox.stub(arena, 'registerShot')
    gameStateOptions = { arena }

    session = createSession({ id: 'channel-1' })
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('when the game has not started', () => {
    it('rejects the request', () => {
      const state: GameState = new GameState(gameStateOptions)
      const initialPlayerTokens = player.tokens
      const message: ShootMessage = {
        type: 'Request',
        id: 'Shoot'
      }

      const { result } = handler(session, message, state, config)

      expect(result).to.eql({
        session,
        success: false,
        reason: 'The game has not started',
        request: RequestType.Shoot
      })
      expect(player.tokens).to.eql(initialPlayerTokens)
      expect(arena.registerShot).to.not.have.been.called
    })
  })

  describe('when the session has no player registered', () => {
    it('rejects the request', () => {
      const state: GameState = new GameState(gameStateOptions)
      const message: ShootMessage = {
        type: 'Request',
        id: 'Shoot'
      }

      state.started = true

      const { result } = handler(session, message, state, config)

      expect(result).to.eql({
        session,
        success: false,
        reason: 'There is no player registered for this session',
        request: RequestType.Shoot
      })
    })
  })

  describe('when the game is started and the session has a player registered', () => {
    describe('when the player can not be found', () => {
      it('rejects the request', () => {
        const state: GameState = new GameState({ arena })
        const message: ShootMessage = {
          type: 'Request',
          id: 'RotatePlayer'
        }

        state.started = true
        session.playerId = 'some-player-id'

        const { result } = handler(session, message, state, config)

        expect(result).to.eql({
          session,
          success: false,
          request: RequestType.Shoot,
          reason: 'The player could not be found'
        })
        expect(arena.registerShot).to.not.have.been.called
      })
    })

    it('does not take the shot if the player has not enough tokens', () => {
      const state = new GameState(gameStateOptions)
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player))
      const message: ShootMessage = {
        type: 'Request',
        id: 'Shoot'
      }

      registeredPlayer.tokens = playerShotCostInTokens - 1
      session.playerId = registeredPlayer.id
      state.started = true

      const { result } = handler(session, message, state, config)

      expect(result).to.eql({
        session,
        success: false,
        reason: 'Not enough tokens to fire a shot',
        request: RequestType.Shoot
      })
      expect(arena.registerShot).to.not.have.been.called
    })

    it('takes the shot if the player has remaining tokens', () => {
      const state = new GameState(gameStateOptions)
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player))
      const initialPlayerTokens = registeredPlayer.tokens
      const message: ShootMessage = {
        type: 'Request',
        id: 'Shoot'
      }

      session.playerId = registeredPlayer.id
      state.started = true

      const { result } = handler(session, message, state, config)

      expect(result).to.eql({
        success: true,
        request: RequestType.Shoot,
        details: {
          id: registeredPlayer.id,
          requestCostInTokens: playerShotCostInTokens,
          remainingTokens: initialPlayerTokens - playerShotCostInTokens
        }
      })
      expect(registeredPlayer.tokens).to.eql(initialPlayerTokens - playerShotCostInTokens)
      expect(arena.registerShot).to.have.been.calledOnce
    })
  })
})

